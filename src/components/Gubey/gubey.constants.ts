/**
 * Gubey Constants
 *
 * Animation variants, timing configurations, and style constants
 * for the Gubey mascot assistant.
 */

import type { Variants } from 'framer-motion';
import type { GubeyState } from '../../types/gubey';

// ============================================================================
// Brand Colors
// ============================================================================

export const GUBEY_COLORS = {
  primary: '#6D08BE',    // LakeB2B Purple
  secondary: '#FFB703',  // LakeB2B Orange
  accent: '#DD1286',     // LakeB2B Magenta
  background: 'rgba(109, 8, 190, 0.15)',
  glow: 'rgba(109, 8, 190, 0.3)',
  panelBg: 'white',
  panelBorder: 'rgba(109, 8, 190, 0.2)',
} as const;

// ============================================================================
// Sizing & Positioning
// ============================================================================

export const GUBEY_SIZES = {
  button: {
    width: 80,
    height: 80,
  },
  buttonRetina: {
    width: 160,
    height: 160,
  },
  avatar: {
    width: 200,
    height: 200,
  },
  favicon: {
    width: 32,
    height: 32,
  },
} as const;

export const GUBEY_POSITION = {
  /** Distance from bottom (above ConnectionStatus) */
  bottom: 90,
  /** Distance from right edge */
  right: 16,
  /** Z-index (below modals at 100+, above content) */
  zIndex: 50,
  /** Z-index for background glow */
  glowZIndex: 49,
  /** Z-index for panel */
  panelZIndex: 51,
} as const;

// ============================================================================
// Animation Timing
// ============================================================================

export const ANIMATION_DURATIONS: Record<GubeyState, number> = {
  IDLE: 3000,
  GREETING: 600,
  PEEK: 300,
  FLAP: 400,
  THINKING: 800,
  CELEBRATING: 4200,
  ERROR: 2000,
  EXPANDED: 0,
};

/** Delay before Gubey appears after page load */
export const APPEAR_DELAY = 2000;

/** Delay before showing greeting after appearing */
export const GREETING_DELAY = 500;

// ============================================================================
// Framer Motion Variants
// ============================================================================

/**
 * Main button animation variants
 */
export const buttonVariants: Variants = {
  idle: {
    y: [0, -5, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  greeting: {
    x: [-100, 0],
    rotate: [0, -10, 10, -5, 0],
    transition: {
      x: { duration: 0.4, ease: 'easeOut' },
      rotate: { duration: 0.6, delay: 0.2, ease: 'easeInOut' },
    },
  },
  peek: {
    scale: 1.1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  flap: {
    rotate: [0, -15, 15, -10, 10, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
  thinking: {
    rotate: 360,
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  celebrating: {
    y: [0, -50, 0],
    scale: [1, 1.2, 1],
    transition: {
      duration: 1.2,
      ease: 'easeOut',
    },
  },
  error: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
  expanded: {
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

/**
 * Panel animation variants
 */
export const panelVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    x: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
      duration: 0.4,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    x: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Panel content item variants (for staggered animation)
 */
export const panelItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * Tooltip animation variants
 */
export const tooltipVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 10,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

/**
 * Particle animation variants
 */
export const particleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0,
  },
  animate: (i: number) => ({
    opacity: [0, 1, 0],
    scale: [0, 1, 0.5],
    x: Math.cos((i * Math.PI) / 3) * 80,
    y: Math.sin((i * Math.PI) / 3) * 80 - 30,
    transition: {
      duration: 1.5,
      ease: 'easeOut',
      delay: i * 0.1,
    },
  }),
};

/**
 * Background glow variants
 */
export const glowVariants: Variants = {
  idle: {
    opacity: [0.15, 0.25, 0.15],
    scale: [1, 1.1, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  celebrating: {
    opacity: [0.3, 0.5, 0.3],
    scale: [1.1, 1.3, 1.1],
    transition: {
      duration: 0.6,
      repeat: 2,
      ease: 'easeInOut',
    },
  },
};

// ============================================================================
// Parallax Configuration
// ============================================================================

export const PARALLAX_CONFIG = {
  /** Mouse parallax intensity for mascot button */
  mouseIntensity: 0.3,
  /** Scroll parallax intensity */
  scrollIntensity: -0.5,
  /** Mouse parallax intensity for particles */
  particleIntensity: 0.8,
  /** Maximum parallax offset in pixels */
  maxOffset: 20,
  /** Scroll debounce in milliseconds */
  scrollDebounce: 100,
} as const;

// ============================================================================
// Accessibility
// ============================================================================

export const ACCESSIBILITY = {
  /** ARIA label for the mascot button */
  buttonLabel: 'Open Gubey assistant',
  /** ARIA label for the close button */
  closeLabel: 'Close Gubey assistant',
  /** Role for the panel */
  panelRole: 'dialog',
  /** Panel title for screen readers */
  panelTitle: 'Gubey Assistant Panel',
} as const;

// ============================================================================
// Image Paths
// ============================================================================

export const GUBEY_IMAGES = {
  button: {
    png: '/mascot/gubey-button.png',
    webp: '/mascot/gubey-button.webp',
    retina: {
      png: '/mascot/gubey-button@2x.png',
      webp: '/mascot/gubey-button@2x.webp',
    },
  },
  avatar: {
    png: '/mascot/gubey-avatar.png',
    webp: '/mascot/gubey-avatar.webp',
  },
  favicon: {
    '32': '/mascot/gubey-favicon-32.png',
    '16': '/mascot/gubey-favicon-16.png',
  },
} as const;
