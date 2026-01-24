/**
 * GubeyButton - Main floating mascot button component
 *
 * The primary interface for the Gubey mascot. Renders as a fixed
 * floating button with parallax effects and state-based animations.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Box, Portal } from '@chakra-ui/react';
import type { GubeyButtonProps, GubeyTip } from '../../types/gubey';
import { useGubeyState } from '../../hooks/useGubeyState';
import { useMouseParallax } from '../../hooks/useMouseParallax';
import { useScrollParallax } from '../../hooks/useScrollParallax';
import { useGubeyContext } from '../../hooks/useGubeyContext';
import { GubeyAvatar } from './GubeyAvatar';
import { GubeyTooltip } from './GubeyTooltip';
import { GubeyPanel } from './GubeyPanel';
import { GubeyParticles } from './GubeyParticles';
import {
  glowVariants,
  GUBEY_COLORS,
  GUBEY_POSITION,
  GUBEY_SIZES,
  PARALLAX_CONFIG,
  APPEAR_DELAY,
  GREETING_DELAY,
  ACCESSIBILITY,
} from './gubey.constants';

const MotionBox = motion(Box);

/**
 * GubeyButton Component
 *
 * Main mascot button with:
 * - Parallax effects (mouse + scroll)
 * - 8-state animation system
 * - Context-aware tooltips
 * - Expandable panel
 * - Celebration particles
 */
export const GubeyButton: React.FC<GubeyButtonProps> = ({ onStateChange }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState<GubeyTip | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // State machine
  const { state, dispatch, triggerGreeting } = useGubeyState();

  // Parallax hooks
  const mouseParallax = useMouseParallax({
    intensity: PARALLAX_CONFIG.mouseIntensity,
    enabled: !prefersReducedMotion,
    maxOffset: PARALLAX_CONFIG.maxOffset,
  });

  const scrollOffset = useScrollParallax({
    intensity: PARALLAX_CONFIG.scrollIntensity,
    enabled: !prefersReducedMotion,
    debounceMs: PARALLAX_CONFIG.scrollDebounce,
  });

  // Context-aware content
  const { getRandomTip, getGreetingMessage, pathname } = useGubeyContext();

  /**
   * Show mascot after delay
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, APPEAR_DELAY);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Trigger greeting after appearing (if first visit)
   */
  useEffect(() => {
    if (isVisible && state.isFirstVisit) {
      const timer = setTimeout(() => {
        triggerGreeting();
      }, GREETING_DELAY);

      return () => clearTimeout(timer);
    }
  }, [isVisible, state.isFirstVisit, triggerGreeting]);

  /**
   * Update tip on state change
   */
  useEffect(() => {
    if (state.currentState === 'PEEK' || state.currentState === 'EXPANDED') {
      setCurrentTip(getRandomTip());
    }
  }, [state.currentState, getRandomTip]);

  /**
   * Notify parent of state changes
   */
  useEffect(() => {
    onStateChange?.(state.currentState);
  }, [state.currentState, onStateChange]);

  /**
   * Update pathname in state
   */
  useEffect(() => {
    dispatch({ type: 'SET_PATHNAME', payload: pathname });
  }, [pathname, dispatch]);

  /**
   * Handle button click
   */
  const handleClick = useCallback(() => {
    dispatch({ type: 'CLICK' });
  }, [dispatch]);

  /**
   * Handle mouse enter
   */
  const handleMouseEnter = useCallback(() => {
    if (!state.isPanelOpen) {
      dispatch({ type: 'START_HOVER' });
    }
  }, [dispatch, state.isPanelOpen]);

  /**
   * Handle mouse leave
   */
  const handleMouseLeave = useCallback(() => {
    dispatch({ type: 'END_HOVER' });
  }, [dispatch]);

  /**
   * Handle panel close
   */
  const handleClosePanel = useCallback(() => {
    dispatch({ type: 'CLOSE_PANEL' });
  }, [dispatch]);

  /**
   * Handle keyboard interaction
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  // Don't render until visible
  if (!isVisible) return null;

  return (
    <Portal>
      {/* Background Glow Layer (-1) */}
      <MotionBox
        position="fixed"
        bottom={`${GUBEY_POSITION.bottom - 10}px`}
        right={`${GUBEY_POSITION.right - 10}px`}
        width={`${GUBEY_SIZES.button.width + 20}px`}
        height={`${GUBEY_SIZES.button.height + 20}px`}
        borderRadius="full"
        bg={GUBEY_COLORS.glow}
        filter="blur(15px)"
        zIndex={GUBEY_POSITION.glowZIndex}
        pointerEvents="none"
        variants={glowVariants}
        animate={state.currentState === 'CELEBRATING' ? 'celebrating' : 'idle'}
        style={{
          x: mouseParallax.x * 0.3,
          y: mouseParallax.y * 0.3,
        }}
      />

      {/* Mascot Button Layer (0) */}
      <MotionBox
        position="fixed"
        bottom={`${GUBEY_POSITION.bottom}px`}
        right={`${GUBEY_POSITION.right}px`}
        width={`${GUBEY_SIZES.button.width}px`}
        height={`${GUBEY_SIZES.button.height}px`}
        borderRadius="full"
        cursor="pointer"
        zIndex={GUBEY_POSITION.zIndex}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={ACCESSIBILITY.buttonLabel}
        role="button"
        tabIndex={0}
        style={{
          x: mouseParallax.x,
          y: scrollOffset,
          willChange: 'transform',
        }}
      >
        <GubeyAvatar size="button" state={state.currentState} />
      </MotionBox>

      {/* Particles Layer (1) - Only during CELEBRATING */}
      <GubeyParticles
        mouseParallax={mouseParallax}
        isActive={state.currentState === 'CELEBRATING'}
      />

      {/* Tooltip on PEEK */}
      <GubeyTooltip
        message={currentTip?.message || getRandomTip().message}
        isVisible={state.currentState === 'PEEK'}
      />

      {/* Panel Layer (2) */}
      <GubeyPanel
        isOpen={state.isPanelOpen}
        onClose={handleClosePanel}
        tip={currentTip}
      />
    </Portal>
  );
};

export default GubeyButton;
