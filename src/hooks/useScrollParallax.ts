/**
 * useScrollParallax - Scroll-based parallax hook
 *
 * Tracks scroll position and calculates vertical offset for
 * scroll-linked animations. Uses debouncing for performance.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { UseScrollParallaxOptions } from '../types/gubey';

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<UseScrollParallaxOptions> = {
  intensity: -0.5,
  enabled: true,
  debounceMs: 100,
};

/**
 * Custom hook for scroll-based parallax effect
 *
 * @param options - Configuration options
 * @returns Current scroll offset (number)
 *
 * @example
 * ```tsx
 * const scrollOffset = useScrollParallax({ intensity: -0.5 });
 * // Use scrollOffset for vertical transform
 * ```
 */
export function useScrollParallax(
  options: UseScrollParallaxOptions = {}
): number {
  const { intensity, enabled, debounceMs } = { ...DEFAULT_OPTIONS, ...options };

  const [offset, setOffset] = useState(0);
  const lastScrollRef = useRef(0);
  const accumulatedRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  /**
   * Handle scroll event with debouncing
   */
  const handleScroll = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the scroll update
    timeoutRef.current = setTimeout(() => {
      const currentScroll = window.scrollY;
      const delta = currentScroll - lastScrollRef.current;
      lastScrollRef.current = currentScroll;

      // Accumulate offset with intensity multiplier
      accumulatedRef.current += delta * intensity;

      // Clamp to reasonable bounds (-50 to 50)
      accumulatedRef.current = Math.max(
        -50,
        Math.min(50, accumulatedRef.current)
      );

      // Gradually decay back to zero when not scrolling
      if (Math.abs(accumulatedRef.current) > 0.5) {
        accumulatedRef.current *= 0.95;
      }

      setOffset(Math.round(accumulatedRef.current * 100) / 100);
    }, debounceMs);
  }, [intensity, enabled, debounceMs]);

  /**
   * Decay animation when not scrolling
   */
  const animateDecay = useCallback(() => {
    if (Math.abs(accumulatedRef.current) > 0.1) {
      accumulatedRef.current *= 0.98;
      setOffset(Math.round(accumulatedRef.current * 100) / 100);
    }
    rafRef.current = requestAnimationFrame(animateDecay);
  }, []);

  /**
   * Initialize scroll listener
   */
  useEffect(() => {
    if (!enabled) {
      setOffset(0);
      return;
    }

    // Initialize last scroll position
    lastScrollRef.current = window.scrollY;

    // Add scroll listener (passive for performance)
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Start decay animation
    rafRef.current = requestAnimationFrame(animateDecay);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [enabled, handleScroll, animateDecay]);

  /**
   * Reset on page visibility change
   */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        accumulatedRef.current = 0;
        setOffset(0);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return offset;
}

export type { UseScrollParallaxOptions };
