/**
 * GubeyTooltip - Peek tooltip component
 *
 * Displays a tooltip with context-aware tips when hovering
 * over the Gubey mascot button.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Text } from '@chakra-ui/react';
import type { GubeyTooltipProps } from '../../types/gubey';
import { tooltipVariants, GUBEY_COLORS, GUBEY_POSITION } from './gubey.constants';

/**
 * GubeyTooltip Component
 *
 * Animated tooltip that appears on hover with a tip message.
 * Positioned to the left of the mascot button.
 */
export const GubeyTooltip: React.FC<GubeyTooltipProps> = ({
  message,
  isVisible,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={tooltipVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: 'fixed',
            bottom: `${GUBEY_POSITION.bottom + 20}px`,
            right: `${GUBEY_POSITION.right + 95}px`,
            zIndex: GUBEY_POSITION.zIndex + 1,
            pointerEvents: 'none',
          }}
        >
          <Box
            bg={GUBEY_COLORS.panelBg}
            borderRadius="lg"
            boxShadow="lg"
            border="1px solid"
            borderColor={GUBEY_COLORS.panelBorder}
            px={4}
            py={3}
            maxWidth="220px"
            position="relative"
            _after={{
              content: '""',
              position: 'absolute',
              right: '-8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid',
              borderLeftColor: GUBEY_COLORS.panelBg,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
            }}
          >
            <Text
              fontSize="sm"
              color="gray.700"
              lineHeight="1.4"
              fontWeight="medium"
            >
              {message}
            </Text>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GubeyTooltip;
