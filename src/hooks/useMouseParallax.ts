/**
 * useMouseParallax - Mouse tracking parallax hook
 *
 * Tracks mouse position and calculates parallax offset for smooth
 * floating effects. Uses requestAnimationFrame for 60 FPS performance.
 * Automatically disables on touch devices.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ParallaxPosition, UseMouseParallaxOptions } from '../types/gubey';

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<UseMouseParallaxOptions> = {
  intensity: 0.3,
  enabled: true,
  maxOffset: 20,
};

/**
 * Detect if device is touch-only (mobile)
 */
function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Linear interpolation for smooth transitions
 */
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * Custom hook for mouse-based parallax effect
 *
 * @param options - Configuration options
 * @returns Current parallax position { x, y }
 *
 * @example
 * ```tsx
 * const parallax = useMouseParallax({ intensity: 0.3 });
 * // Use parallax.x and parallax.y for transform offsets
 * ```
 */
export function useMouseParallax(
  options: UseMouseParallaxOptions = {}
): ParallaxPosition {
  const { intensity, enabled, maxOffset } = { ...DEFAULT_OPTIONS, ...options };

  const [position, setPosition] = useState<ParallaxPosition>({ x: 0, y: 0 });
  const targetRef = useRef<ParallaxPosition>({ x: 0, y: 0 });
  const currentRef = useRef<ParallaxPosition>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const isDisabledRef = useRef<boolean>(false);

  /**
   * Handle mouse movement - update target position
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Calculate normalized position (-1 to 1)
      const normalizedX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normalizedY = (e.clientY / window.innerHeight - 0.5) * 2;

      // Apply intensity and clamp to maxOffset
      targetRef.current = {
        x: Math.max(-maxOffset, Math.min(maxOffset, normalizedX * intensity * maxOffset)),
        y: Math.max(-maxOffset, Math.min(maxOffset, normalizedY * intensity * maxOffset)),
      };
    },
    [intensity, maxOffset]
  );

  /**
   * Animation loop - smoothly interpolate to target
   */
  const animate = useCallback(() => {
    // Smooth interpolation (lerp factor 0.1 for smooth motion)
    currentRef.current = {
      x: lerp(currentRef.current.x, targetRef.current.x, 0.1),
      y: lerp(currentRef.current.y, targetRef.current.y, 0.1),
    };

    // Only update state if position changed significantly (> 0.01px)
    const dx = Math.abs(currentRef.current.x - position.x);
    const dy = Math.abs(currentRef.current.y - position.y);

    if (dx > 0.01 || dy > 0.01) {
      setPosition({
        x: Math.round(currentRef.current.x * 100) / 100,
        y: Math.round(currentRef.current.y * 100) / 100,
      });
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [position.x, position.y]);

  /**
   * Initialize and cleanup
   */
  useEffect(() => {
    // Disable on touch devices or if explicitly disabled
    isDisabledRef.current = !enabled || isTouchDevice();

    if (isDisabledRef.current) {
      setPosition({ x: 0, y: 0 });
      return;
    }

    // Add mouse listener (passive for performance)
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Start animation loop
    rafRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [enabled, handleMouseMove, animate]);

  /**
   * Handle window blur - reset to center
   */
  useEffect(() => {
    const handleBlur = () => {
      targetRef.current = { x: 0, y: 0 };
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  return position;
}

export type { ParallaxPosition, UseMouseParallaxOptions };
