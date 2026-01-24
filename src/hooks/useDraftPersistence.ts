/**
 * Custom hook for persisting form drafts to localStorage
 * Provides auto-save with debouncing and recovery on page load
 */

import { useState, useEffect, useCallback, useRef } from 'react'

const DRAFT_STORAGE_KEY = 'lakeb2b-draft'
const DEBOUNCE_DELAY = 1000 // 1 second debounce

export interface DraftData {
  message: string
  headline: string
  selectedStyle: string
  logoPosition: string
  logoSize: number
  logoOpacity: number
  logoRotation: number
  selectedMemeFormat: string
  memeTexts: Record<string, string>
  savedAt: number
}

interface UseDraftPersistenceOptions {
  onDraftRestored?: (draft: DraftData) => void
  maxAge?: number // Maximum age of draft in milliseconds (default: 24 hours)
}

interface UseDraftPersistenceReturn {
  saveDraft: (data: Partial<DraftData>) => void
  clearDraft: () => void
  hasDraft: boolean
  lastSaved: number | null
}

export function useDraftPersistence(
  options: UseDraftPersistenceOptions = {}
): UseDraftPersistenceReturn {
  const { onDraftRestored, maxAge = 24 * 60 * 60 * 1000 } = options

  const [hasDraft, setHasDraft] = useState(false)
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const currentDraftRef = useRef<Partial<DraftData>>({})
  const hasRestoredRef = useRef(false)

  // Check for existing draft on mount and restore if valid
  useEffect(() => {
    if (hasRestoredRef.current) return
    hasRestoredRef.current = true

    try {
      const storedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (storedDraft) {
        const draft: DraftData = JSON.parse(storedDraft)

        // Check if draft is still valid (not expired)
        const age = Date.now() - draft.savedAt
        if (age < maxAge) {
          // Draft is valid, restore it
          setHasDraft(true)
          setLastSaved(draft.savedAt)
          currentDraftRef.current = draft

          // Notify parent component
          if (onDraftRestored) {
            onDraftRestored(draft)
          }
        } else {
          // Draft is expired, clear it
          localStorage.removeItem(DRAFT_STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Failed to restore draft:', error)
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }, [maxAge, onDraftRestored])

  // Debounced save function
  const saveDraft = useCallback((data: Partial<DraftData>) => {
    // Merge with current draft
    currentDraftRef.current = { ...currentDraftRef.current, ...data }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      try {
        const draftToSave: DraftData = {
          message: currentDraftRef.current.message || '',
          headline: currentDraftRef.current.headline || '',
          selectedStyle: currentDraftRef.current.selectedStyle || 'isometric',
          logoPosition: currentDraftRef.current.logoPosition || 'bottom-left',
          logoSize: currentDraftRef.current.logoSize ?? 35,
          logoOpacity: currentDraftRef.current.logoOpacity ?? 85,
          logoRotation: currentDraftRef.current.logoRotation ?? 0,
          selectedMemeFormat: currentDraftRef.current.selectedMemeFormat || 'auto',
          memeTexts: currentDraftRef.current.memeTexts || {},
          savedAt: Date.now(),
        }

        // Only save if there's actual content
        if (draftToSave.message || draftToSave.headline) {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftToSave))
          setHasDraft(true)
          setLastSaved(draftToSave.savedAt)
        }
      } catch (error) {
        console.error('Failed to save draft:', error)
      }
    }, DEBOUNCE_DELAY)
  }, [])

  // Clear draft function
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      currentDraftRef.current = {}
      setHasDraft(false)
      setLastSaved(null)

      // Clear any pending save
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    } catch (error) {
      console.error('Failed to clear draft:', error)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    saveDraft,
    clearDraft,
    hasDraft,
    lastSaved,
  }
}
