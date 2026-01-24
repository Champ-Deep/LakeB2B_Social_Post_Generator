/**
 * GubeyParticles - Celebration confetti component
 *
 * Displays animated particles during the CELEBRATING state
 * with parallax effect on mouse movement.
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box } from '@chakra-ui/react';
import type { GubeyParticlesProps, ParallaxPosition } from '../../types/gubey';
import { particleVariants, GUBEY_COLORS, GUBEY_POSITION, PARALLAX_CONFIG } from './gubey.constants';

/**
 * Particle colors from LakeB2B brand
 */
const PARTICLE_COLORS = [
  GUBEY_COLORS.primary,   // Purple
  GUBEY_COLORS.secondary, // Orange
  GUBEY_COLORS.accent,    // Magenta
  '#FFD700',              // Gold
  '#00CED1',              // Teal
  '#FF69B4',              // Pink
];

/**
 * Particle shapes
 */
const PARTICLE_SHAPES = ['circle', 'square', 'triangle'] as const;

/**
 * Generate particle configurations
 */
const generateParticles = (count: number = 6) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    shape: PARTICLE_SHAPES[i % PARTICLE_SHAPES.length],
    size: 8 + (i % 3) * 4, // 8, 12, or 16px
    delay: i * 0.1,
  }));
};

/**
 * Render particle shape
 */
const ParticleShape: React.FC<{
  shape: typeof PARTICLE_SHAPES[number];
  color: string;
  size: number;
}> = ({ shape, color, size }) => {
  switch (shape) {
    case 'circle':
      return (
        <Box
          width={`${size}px`}
          height={`${size}px`}
          bg={color}
          borderRadius="full"
        />
      );
    case 'square':
      return (
        <Box
          width={`${size}px`}
          height={`${size}px`}
          bg={color}
          borderRadius="sm"
          transform="rotate(45deg)"
        />
      );
    case 'triangle':
      return (
        <Box
          width={0}
          height={0}
          borderLeft={`${size / 2}px solid transparent`}
          borderRight={`${size / 2}px solid transparent`}
          borderBottom={`${size}px solid ${color}`}
        />
      );
    default:
      return null;
  }
};

/**
 * GubeyParticles Component
 *
 * Renders animated celebration particles with parallax effect.
 * Only visible during CELEBRATING state.
 */
export const GubeyParticles: React.FC<GubeyParticlesProps> = ({
  mouseParallax,
  isActive,
}) => {
  // Generate particles once
  const particles = useMemo(() => generateParticles(6), []);

  // Calculate parallax offset for particles
  const parallaxOffset: ParallaxPosition = {
    x: mouseParallax.x * PARALLAX_CONFIG.particleIntensity,
    y: mouseParallax.y * PARALLAX_CONFIG.particleIntensity,
  };

  return (
    <AnimatePresence>
      {isActive && (
        <Box
          position="fixed"
          bottom={`${GUBEY_POSITION.bottom + 40}px`}
          right={`${GUBEY_POSITION.right + 40}px`}
          width="0"
          height="0"
          zIndex={GUBEY_POSITION.zIndex + 2}
          pointerEvents="none"
          style={{
            transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
          }}
        >
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              custom={particle.id}
              variants={particleVariants}
              initial="initial"
              animate="animate"
              exit="initial"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                marginLeft: -particle.size / 2,
                marginTop: -particle.size / 2,
              }}
            >
              <ParticleShape
                shape={particle.shape}
                color={particle.color}
                size={particle.size}
              />
            </motion.div>
          ))}
        </Box>
      )}
    </AnimatePresence>
  );
};

export default GubeyParticles;
