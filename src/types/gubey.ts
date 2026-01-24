/**
 * Gubey Mascot TypeScript Interfaces
 *
 * Defines all types for the Gubey animated mascot assistant,
 * including state machine states, actions, and context types.
 */

// ============================================================================
// State Machine Types
// ============================================================================

/**
 * All possible states for the Gubey mascot animation
 */
export type GubeyState =
  | 'IDLE'        // Default bobbing animation (3s loop)
  | 'GREETING'    // First visit slide-in + wing flap (0.6s)
  | 'PEEK'        // Hover tooltip from left (0.3s)
  | 'FLAP'        // Wing rotation on interaction (0.4s)
  | 'THINKING'    // Continuous rotation during generation (0.8s loop)
  | 'CELEBRATING' // Fly into preview + confetti (1.2s + 3s hold)
  | 'ERROR'       // Shake + X eyes (0.4s)
  | 'EXPANDED';   // Panel open state (persistent)

/**
 * Actions that trigger state transitions
 */
export type GubeyAction =
  | { type: 'SHOW_GREETING' }
  | { type: 'DISMISS_GREETING' }
  | { type: 'START_HOVER' }
  | { type: 'END_HOVER' }
  | { type: 'CLICK' }
  | { type: 'OPEN_PANEL' }
  | { type: 'CLOSE_PANEL' }
  | { type: 'START_GENERATION' }
  | { type: 'GENERATION_SUCCESS' }
  | { type: 'GENERATION_ERROR' }
  | { type: 'RETURN_TO_IDLE' }
  | { type: 'SET_PATHNAME'; payload: string }
  // Game-related actions
  | { type: 'GAME_WIN'; payload?: { score: number; gameType: string } }
  | { type: 'GAME_SCORE'; payload?: { points: number } };

/**
 * Internal state managed by the reducer
 */
export interface GubeyInternalState {
  currentState: GubeyState;
  previousState: GubeyState | null;
  isFirstVisit: boolean;
  interactionCount: number;
  lastInteraction: Date | null;
  pathname: string;
  isPanelOpen: boolean;
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * Tip content for context-aware assistance
 */
export interface GubeyTip {
  message: string;
  actionLabel?: string;
  actionPath?: string;
  priority?: number;
}

/**
 * Context value exposed by GubeyProvider
 */
export interface GubeyContextValue extends GubeyInternalState {
  dispatch: React.Dispatch<GubeyAction>;
  currentTip: GubeyTip | null;
  trackInteraction: (type: string, metadata?: Record<string, unknown>) => void;
  getRandomTip: () => GubeyTip;
  getGreetingMessage: () => string;
}

// ============================================================================
// Parallax Types
// ============================================================================

/**
 * 2D position for parallax calculations
 */
export interface ParallaxPosition {
  x: number;
  y: number;
}

/**
 * Options for mouse parallax hook
 */
export interface UseMouseParallaxOptions {
  /** Multiplier for parallax effect (default: 0.3) */
  intensity?: number;
  /** Enable/disable parallax (default: true) */
  enabled?: boolean;
  /** Maximum offset in pixels (default: 20) */
  maxOffset?: number;
}

/**
 * Options for scroll parallax hook
 */
export interface UseScrollParallaxOptions {
  /** Multiplier for scroll effect (default: -0.5) */
  intensity?: number;
  /** Enable/disable parallax (default: true) */
  enabled?: boolean;
  /** Debounce time in ms (default: 100) */
  debounceMs?: number;
}

// ============================================================================
// Animation Types
// ============================================================================

/**
 * Animation timing configuration per state
 */
export interface AnimationTiming {
  duration: number;
  delay?: number;
  repeat?: number | 'Infinity';
  ease?: string;
}

/**
 * State to animation timing map
 */
export type AnimationTimingMap = Record<GubeyState, AnimationTiming>;

// ============================================================================
// Service Types
// ============================================================================

/**
 * Data sent to Supabase for interaction tracking
 */
export interface GubeyInteractionData {
  interactionType: string;
  contextPathname?: string;
  stateFrom?: string;
  stateTo?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Row in gubey_interactions table
 */
export interface GubeyInteractionRow {
  id: string;
  user_id: string | null;
  session_id: string;
  interaction_type: string;
  context_pathname: string | null;
  state_from: string | null;
  state_to: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for GubeyAvatar component
 */
export interface GubeyAvatarProps {
  size: 'button' | 'avatar' | 'favicon';
  state: GubeyState;
  className?: string;
}

/**
 * Props for GubeyTooltip component
 */
export interface GubeyTooltipProps {
  message: string;
  isVisible: boolean;
}

/**
 * Props for GubeyPanel component
 */
export interface GubeyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tip: GubeyTip | null;
}

/**
 * Props for GubeyParticles component
 */
export interface GubeyParticlesProps {
  mouseParallax: ParallaxPosition;
  isActive: boolean;
}

/**
 * Props for GubeyButton component
 */
export interface GubeyButtonProps {
  onStateChange?: (state: GubeyState) => void;
}

/**
 * Props for GubeyProvider component
 */
export interface GubeyProviderProps {
  children: React.ReactNode;
  /** Delay before showing mascot (ms) - default: 2000 */
  appearDelay?: number;
  /** Enable analytics tracking - default: true */
  enableTracking?: boolean;
}
