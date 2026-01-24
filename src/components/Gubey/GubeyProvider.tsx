/**
 * GubeyProvider - Context provider for Gubey mascot
 *
 * Provides global access to Gubey state and actions.
 * Wrap your app with this provider to enable Gubey features.
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { useRouter } from 'next/router';
import type {
  GubeyContextValue,
  GubeyProviderProps,
  GubeyState,
  GubeyAction,
  GubeyTip,
  GubeyInternalState,
} from '../../types/gubey';
import { useGubeyState } from '../../hooks/useGubeyState';
import { useGubeyContext } from '../../hooks/useGubeyContext';
import { gubeyService } from '../../services/gubeyService';

/**
 * Default context value (should never be used directly)
 */
const defaultContextValue: GubeyContextValue = {
  currentState: 'IDLE',
  previousState: null,
  isFirstVisit: true,
  interactionCount: 0,
  lastInteraction: null,
  pathname: '/',
  isPanelOpen: false,
  currentTip: null,
  dispatch: () => {},
  trackInteraction: () => {},
  getRandomTip: () => ({ message: '' }),
  getGreetingMessage: () => '',
};

/**
 * Gubey Context
 */
const GubeyContext = createContext<GubeyContextValue>(defaultContextValue);

/**
 * Hook to access Gubey context
 *
 * @throws Error if used outside GubeyProvider
 */
export function useGubey(): GubeyContextValue {
  const context = useContext(GubeyContext);
  if (context === defaultContextValue) {
    throw new Error('useGubey must be used within a GubeyProvider');
  }
  return context;
}

/**
 * GubeyProvider Component
 *
 * Provides Gubey state and actions to the component tree.
 * Should be placed high in the component hierarchy.
 */
export const GubeyProvider: React.FC<GubeyProviderProps> = ({
  children,
  appearDelay = 2000,
  enableTracking = true,
}) => {
  const router = useRouter();
  const { state, dispatch } = useGubeyState();
  const { getRandomTip, getGreetingMessage, pathname } = useGubeyContext();
  const [currentTip, setCurrentTip] = useState<GubeyTip | null>(null);

  /**
   * Update tip when state changes
   */
  useEffect(() => {
    if (state.currentState === 'PEEK' || state.currentState === 'EXPANDED') {
      setCurrentTip(getRandomTip());
    }
  }, [state.currentState, getRandomTip]);

  /**
   * Update pathname when route changes
   */
  useEffect(() => {
    dispatch({ type: 'SET_PATHNAME', payload: pathname });
  }, [pathname, dispatch]);

  /**
   * Track state transitions
   */
  useEffect(() => {
    if (enableTracking && state.previousState) {
      gubeyService.trackInteraction({
        interactionType: 'state_transition',
        contextPathname: pathname,
        stateFrom: state.previousState,
        stateTo: state.currentState,
      });
    }
  }, [state.currentState, state.previousState, pathname, enableTracking]);

  /**
   * Track interaction with optional metadata
   */
  const trackInteraction = useCallback(
    (type: string, metadata?: Record<string, unknown>) => {
      if (!enableTracking) return;

      gubeyService.trackInteraction({
        interactionType: type,
        contextPathname: pathname,
        stateFrom: state.currentState,
        metadata,
      });
    },
    [enableTracking, pathname, state.currentState]
  );

  /**
   * Wrapped dispatch with tracking
   */
  const trackedDispatch = useCallback(
    (action: GubeyAction) => {
      dispatch(action);

      if (enableTracking) {
        gubeyService.trackInteraction({
          interactionType: `action_${action.type}`,
          contextPathname: pathname,
          stateFrom: state.currentState,
          metadata: { action: action.type },
        });
      }
    },
    [dispatch, enableTracking, pathname, state.currentState]
  );

  /**
   * Context value
   */
  const value = useMemo<GubeyContextValue>(
    () => ({
      ...state,
      currentTip,
      dispatch: trackedDispatch,
      trackInteraction,
      getRandomTip,
      getGreetingMessage,
    }),
    [state, currentTip, trackedDispatch, trackInteraction, getRandomTip, getGreetingMessage]
  );

  return (
    <GubeyContext.Provider value={value}>
      {children}
    </GubeyContext.Provider>
  );
};

export default GubeyProvider;
