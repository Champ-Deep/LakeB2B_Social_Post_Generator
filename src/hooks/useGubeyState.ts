/**
 * useGubeyState - State machine hook for Gubey mascot
 *
 * Implements an 8-state animation state machine using useReducer.
 * Handles all state transitions and auto-transitions after animation durations.
 */

import { useReducer, useEffect, useCallback } from 'react';
import type { GubeyState, GubeyAction, GubeyInternalState } from '../types/gubey';

// Animation durations in milliseconds
const ANIMATION_DURATIONS: Record<GubeyState, number> = {
  IDLE: 3000,        // Continuous bob
  GREETING: 600,     // Slide in + wing flap
  PEEK: 300,         // Scale up
  FLAP: 400,         // Wing rotation
  THINKING: 800,     // Rotation loop
  CELEBRATING: 4200, // 1.2s animation + 3s hold
  ERROR: 2000,       // 0.4s shake + display time
  EXPANDED: 0,       // Persistent until closed
};

// States that auto-transition back to IDLE
const AUTO_RETURN_STATES: GubeyState[] = ['GREETING', 'FLAP', 'CELEBRATING', 'ERROR'];

/**
 * Initial state for the reducer
 */
const initialState: GubeyInternalState = {
  currentState: 'IDLE',
  previousState: null,
  isFirstVisit: true,
  interactionCount: 0,
  lastInteraction: null,
  pathname: '/',
  isPanelOpen: false,
};

/**
 * Helper to create a transition state
 */
function transition(
  state: GubeyInternalState,
  newState: GubeyState,
  updates: Partial<GubeyInternalState> = {}
): GubeyInternalState {
  return {
    ...state,
    previousState: state.currentState,
    currentState: newState,
    lastInteraction: new Date(),
    interactionCount: state.interactionCount + 1,
    ...updates,
  };
}

/**
 * State machine reducer
 */
function gubeyReducer(
  state: GubeyInternalState,
  action: GubeyAction
): GubeyInternalState {
  switch (action.type) {
    // Greeting (first visit only)
    case 'SHOW_GREETING':
      if (state.isFirstVisit && state.currentState === 'IDLE') {
        return transition(state, 'GREETING', { isFirstVisit: false });
      }
      return state;

    case 'DISMISS_GREETING':
      if (state.currentState === 'GREETING') {
        return transition(state, 'IDLE', { isFirstVisit: false });
      }
      return state;

    // Hover interactions
    case 'START_HOVER':
      if (state.currentState === 'IDLE' && !state.isPanelOpen) {
        return transition(state, 'PEEK');
      }
      return state;

    case 'END_HOVER':
      if (state.currentState === 'PEEK') {
        return transition(state, 'IDLE');
      }
      return state;

    // Click interaction
    case 'CLICK':
      if (['IDLE', 'PEEK', 'GREETING'].includes(state.currentState)) {
        return transition(state, 'FLAP');
      }
      return state;

    // Panel open/close
    case 'OPEN_PANEL':
      return transition(state, 'EXPANDED', { isPanelOpen: true });

    case 'CLOSE_PANEL':
      return transition(state, 'IDLE', { isPanelOpen: false });

    // Generation lifecycle
    case 'START_GENERATION':
      if (!state.isPanelOpen) {
        return transition(state, 'THINKING');
      }
      return state;

    case 'GENERATION_SUCCESS':
      if (state.currentState === 'THINKING') {
        return transition(state, 'CELEBRATING');
      }
      return state;

    case 'GENERATION_ERROR':
      if (state.currentState === 'THINKING') {
        return transition(state, 'ERROR');
      }
      return state;

    // Manual return to idle
    case 'RETURN_TO_IDLE':
      if (state.currentState !== 'EXPANDED') {
        return transition(state, 'IDLE');
      }
      return state;

    // Pathname update
    case 'SET_PATHNAME':
      return { ...state, pathname: action.payload };

    // Game-related actions
    case 'GAME_WIN':
      // Trigger celebrating state when player wins a mini-game
      // Only transition if not in panel (similar to generation success)
      if (!state.isPanelOpen && state.currentState !== 'CELEBRATING') {
        return transition(state, 'CELEBRATING');
      }
      return state;

    case 'GAME_SCORE':
      // Quick acknowledgment of scoring - currently just tracks interaction
      // Could add a brief PEEK or pulse animation in the future
      return state;

    default:
      return state;
  }
}

/**
 * Custom hook for Gubey state machine
 */
export function useGubeyState() {
  const [state, dispatch] = useReducer(gubeyReducer, initialState);

  // Auto-transition from temporary states back to IDLE
  useEffect(() => {
    if (AUTO_RETURN_STATES.includes(state.currentState)) {
      const duration = ANIMATION_DURATIONS[state.currentState];
      const timer = setTimeout(() => {
        dispatch({ type: 'RETURN_TO_IDLE' });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [state.currentState]);

  // Auto-open panel after FLAP animation
  useEffect(() => {
    if (state.currentState === 'FLAP') {
      const timer = setTimeout(() => {
        dispatch({ type: 'OPEN_PANEL' });
      }, ANIMATION_DURATIONS.FLAP);

      return () => clearTimeout(timer);
    }
  }, [state.currentState]);

  // Check localStorage for first visit status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const visited = localStorage.getItem('gubey_visited');
      if (visited === 'true') {
        // Already visited, update state without showing greeting
        dispatch({ type: 'DISMISS_GREETING' });
      }
    }
  }, []);

  // Save visit status to localStorage when greeting is dismissed
  useEffect(() => {
    if (!state.isFirstVisit && typeof window !== 'undefined') {
      localStorage.setItem('gubey_visited', 'true');
    }
  }, [state.isFirstVisit]);

  /**
   * Trigger the greeting animation (called after appear delay)
   */
  const triggerGreeting = useCallback(() => {
    dispatch({ type: 'SHOW_GREETING' });
  }, []);

  /**
   * Get the animation duration for the current state
   */
  const getCurrentDuration = useCallback(() => {
    return ANIMATION_DURATIONS[state.currentState];
  }, [state.currentState]);

  /**
   * Check if currently in an animated (non-idle) state
   */
  const isAnimating = useCallback(() => {
    return state.currentState !== 'IDLE' && state.currentState !== 'EXPANDED';
  }, [state.currentState]);

  return {
    state,
    dispatch,
    triggerGreeting,
    getCurrentDuration,
    isAnimating,
    ANIMATION_DURATIONS,
  };
}

export type { GubeyState, GubeyAction, GubeyInternalState };
