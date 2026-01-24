/**
 * GubeyAvatar - Animated mascot image component
 *
 * Renders the Gubey mascot image with Framer Motion animations
 * based on the current state. Supports WebP with PNG fallback.
 */

import React, { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Box, Image } from '@chakra-ui/react';
import type { GubeyAvatarProps, GubeyState } from '../../types/gubey';
import { buttonVariants, GUBEY_SIZES, GUBEY_IMAGES } from './gubey.constants';

/**
 * Map size prop to dimensions
 */
const SIZE_CONFIG = {
  button: GUBEY_SIZES.button,
  avatar: GUBEY_SIZES.avatar,
  favicon: GUBEY_SIZES.favicon,
} as const;

/**
 * Map size prop to image paths
 */
const getImagePaths = (size: 'button' | 'avatar' | 'favicon') => {
  switch (size) {
    case 'button':
      return {
        webp: GUBEY_IMAGES.button.webp,
        png: GUBEY_IMAGES.button.png,
      };
    case 'avatar':
      return {
        webp: GUBEY_IMAGES.avatar.webp,
        png: GUBEY_IMAGES.avatar.png,
      };
    case 'favicon':
      return {
        webp: null,
        png: GUBEY_IMAGES.favicon['32'],
      };
  }
};

/**
 * Map GubeyState to variant name for Framer Motion
 */
const getVariantName = (state: GubeyState): string => {
  return state.toLowerCase();
};

/**
 * GubeyAvatar Component
 *
 * Displays the Gubey mascot with state-based animations.
 * Uses WebP format for modern browsers with PNG fallback.
 */
export const GubeyAvatar: React.FC<GubeyAvatarProps> = ({
  size,
  state,
  className,
}) => {
  const [useWebP, setUseWebP] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const config = SIZE_CONFIG[size];
  const paths = getImagePaths(size);

  /**
   * Handle image load error - fallback to PNG
   */
  const handleError = useCallback(() => {
    if (useWebP && paths.png) {
      setUseWebP(false);
    }
  }, [useWebP, paths.png]);

  /**
   * Get current image source
   */
  const imageSrc = useWebP && paths.webp ? paths.webp : paths.png;

  /**
   * Get animation variant based on state
   * Returns static variant if reduced motion is preferred
   */
  const currentVariant = prefersReducedMotion ? 'idle' : getVariantName(state);

  return (
    <motion.div
      variants={buttonVariants}
      animate={currentVariant}
      initial={false}
      style={{
        width: config.width,
        height: config.height,
        willChange: 'transform',
      }}
      className={className}
    >
      <Box
        position="relative"
        width={`${config.width}px`}
        height={`${config.height}px`}
        borderRadius="full"
        overflow="hidden"
      >
        <Image
          src={imageSrc}
          alt="Gubey - LakeB2B Mascot"
          width={config.width}
          height={config.height}
          onError={handleError}
          loading={size === 'button' ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          style={{
            objectFit: 'contain',
            userSelect: 'none',
          }}
        />
      </Box>
    </motion.div>
  );
};

export default GubeyAvatar;
