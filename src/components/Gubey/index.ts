/**
 * Gubey Components - Barrel Export
 *
 * Main entry point for all Gubey mascot components.
 */

// Main components
export { GubeyButton } from './GubeyButton';
export { GubeyProvider, useGubey } from './GubeyProvider';
export { GubeyPanel } from './GubeyPanel';
export { GubeyAvatar } from './GubeyAvatar';
export { GubeyTooltip } from './GubeyTooltip';
export { GubeyParticles } from './GubeyParticles';

// Constants
export * from './gubey.constants';

// Re-export types from types/gubey.ts for convenience
export type {
  GubeyState,
  GubeyAction,
  GubeyInternalState,
  GubeyContextValue,
  GubeyProviderProps,
  GubeyButtonProps,
  GubeyPanelProps,
  GubeyAvatarProps,
  GubeyTooltipProps,
  GubeyParticlesProps,
  GubeyTip,
  ParallaxPosition,
} from '../../types/gubey';
