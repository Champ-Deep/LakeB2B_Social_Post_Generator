import { useReducer, useCallback } from 'react'

export interface CanvasElement {
  id: string
  type: 'image' | 'logo' | 'text'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  zIndex: number
}

export interface LogoElement extends CanvasElement {
  type: 'logo'
  logoVariant: 'color' | 'bw' | 'inverted'
}

export interface TextElement extends CanvasElement {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  fill: string
  stroke?: string
  strokeWidth?: number
}

export interface CanvasState {
  elements: CanvasElement[]
  selectedId: string | null
  zoom: number
  history: CanvasElement[][]
  historyIndex: number
  isDirty: boolean
}

export type CanvasAction =
  | { type: 'SELECT'; id: string | null }
  | { type: 'MOVE'; id: string; x: number; y: number }
  | { type: 'RESIZE'; id: string; width: number; height: number; x?: number; y?: number }
  | { type: 'ROTATE'; id: string; rotation: number }
  | { type: 'UPDATE_OPACITY'; id: string; opacity: number }
  | { type: 'ADD_ELEMENT'; element: CanvasElement }
  | { type: 'DELETE_ELEMENT'; id: string }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; elements: CanvasElement[] }
  | { type: 'SAVE_HISTORY' }

const MAX_HISTORY = 50

function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'SELECT':
      return { ...state, selectedId: action.id }

    case 'MOVE': {
      const elements = state.elements.map(el =>
        el.id === action.id ? { ...el, x: action.x, y: action.y } : el
      )
      return { ...state, elements, isDirty: true }
    }

    case 'RESIZE': {
      const elements = state.elements.map(el =>
        el.id === action.id
          ? {
              ...el,
              width: action.width,
              height: action.height,
              ...(action.x !== undefined && { x: action.x }),
              ...(action.y !== undefined && { y: action.y })
            }
          : el
      )
      return { ...state, elements, isDirty: true }
    }

    case 'ROTATE': {
      const elements = state.elements.map(el =>
        el.id === action.id ? { ...el, rotation: action.rotation } : el
      )
      return { ...state, elements, isDirty: true }
    }

    case 'UPDATE_OPACITY': {
      const elements = state.elements.map(el =>
        el.id === action.id ? { ...el, opacity: action.opacity } : el
      )
      return { ...state, elements, isDirty: true }
    }

    case 'ADD_ELEMENT':
      return {
        ...state,
        elements: [...state.elements, action.element],
        isDirty: true
      }

    case 'DELETE_ELEMENT': {
      const elements = state.elements.filter(el => el.id !== action.id)
      return {
        ...state,
        elements,
        selectedId: state.selectedId === action.id ? null : state.selectedId,
        isDirty: true
      }
    }

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.25, Math.min(2, action.zoom)) }

    case 'SAVE_HISTORY': {
      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        [...state.elements]
      ].slice(-MAX_HISTORY)

      return {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: false
      }
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state
      const newIndex = state.historyIndex - 1
      return {
        ...state,
        elements: [...state.history[newIndex]],
        historyIndex: newIndex,
        selectedId: null
      }
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state
      const newIndex = state.historyIndex + 1
      return {
        ...state,
        elements: [...state.history[newIndex]],
        historyIndex: newIndex,
        selectedId: null
      }
    }

    case 'RESET':
      return {
        ...state,
        elements: action.elements,
        selectedId: null,
        history: [action.elements],
        historyIndex: 0,
        isDirty: false
      }

    default:
      return state
  }
}

const initialState: CanvasState = {
  elements: [],
  selectedId: null,
  zoom: 1,
  history: [[]],
  historyIndex: 0,
  isDirty: false
}

export function useCanvasState(initialElements: CanvasElement[] = []) {
  const [state, dispatch] = useReducer(canvasReducer, {
    ...initialState,
    elements: initialElements,
    history: [initialElements]
  })

  const select = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT', id })
  }, [])

  const move = useCallback((id: string, x: number, y: number) => {
    dispatch({ type: 'MOVE', id, x, y })
  }, [])

  const resize = useCallback((id: string, width: number, height: number, x?: number, y?: number) => {
    dispatch({ type: 'RESIZE', id, width, height, x, y })
  }, [])

  const rotate = useCallback((id: string, rotation: number) => {
    dispatch({ type: 'ROTATE', id, rotation })
  }, [])

  const updateOpacity = useCallback((id: string, opacity: number) => {
    dispatch({ type: 'UPDATE_OPACITY', id, opacity })
  }, [])

  const addElement = useCallback((element: CanvasElement) => {
    dispatch({ type: 'ADD_ELEMENT', element })
  }, [])

  const deleteElement = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ELEMENT', id })
  }, [])

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', zoom })
  }, [])

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' })
  }, [])

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' })
  }, [])

  const reset = useCallback((elements: CanvasElement[]) => {
    dispatch({ type: 'RESET', elements })
  }, [])

  const saveHistory = useCallback(() => {
    dispatch({ type: 'SAVE_HISTORY' })
  }, [])

  const getSelectedElement = useCallback(() => {
    return state.elements.find(el => el.id === state.selectedId) || null
  }, [state.elements, state.selectedId])

  return {
    state,
    actions: {
      select,
      move,
      resize,
      rotate,
      updateOpacity,
      addElement,
      deleteElement,
      setZoom,
      undo,
      redo,
      reset,
      saveHistory
    },
    getSelectedElement,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1
  }
}
