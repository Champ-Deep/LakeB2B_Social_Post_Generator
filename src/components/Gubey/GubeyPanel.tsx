/**
 * GubeyPanel - Expanded assistant panel component
 *
 * Displays context-aware tips and actions when the mascot
 * button is clicked. Supports keyboard navigation.
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Divider,
} from '@chakra-ui/react';
import { X, ExternalLink, Lightbulb, Sparkles } from 'lucide-react';
import type { GubeyPanelProps } from '../../types/gubey';
import {
  panelVariants,
  panelItemVariants,
  GUBEY_COLORS,
  GUBEY_POSITION,
  ACCESSIBILITY,
} from './gubey.constants';
import { GubeyAvatar } from './GubeyAvatar';

/**
 * GubeyPanel Component
 *
 * Animated panel that appears when the mascot is clicked.
 * Contains tips, greeting, and optional action buttons.
 */
export const GubeyPanel: React.FC<GubeyPanelProps> = ({
  isOpen,
  onClose,
  tip,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Handle ESC key to close panel
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the close button for accessibility
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  /**
   * Trap focus within panel when open
   */
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const focusableElements = panelRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              zIndex: GUBEY_POSITION.panelZIndex - 1,
            }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role={ACCESSIBILITY.panelRole}
            aria-label={ACCESSIBILITY.panelTitle}
            aria-modal="true"
            style={{
              position: 'fixed',
              bottom: `${GUBEY_POSITION.bottom + 90}px`,
              right: `${GUBEY_POSITION.right}px`,
              zIndex: GUBEY_POSITION.panelZIndex,
            }}
          >
            <Box
              bg={GUBEY_COLORS.panelBg}
              borderRadius="xl"
              boxShadow="xl"
              border="1px solid"
              borderColor={GUBEY_COLORS.panelBorder}
              width="300px"
              overflow="hidden"
            >
              {/* Header */}
              <motion.div variants={panelItemVariants}>
                <HStack
                  px={4}
                  py={3}
                  bg={`linear-gradient(135deg, ${GUBEY_COLORS.primary}10, ${GUBEY_COLORS.secondary}10)`}
                  borderBottom="1px solid"
                  borderColor={GUBEY_COLORS.panelBorder}
                  justifyContent="space-between"
                >
                  <HStack spacing={3}>
                    <Box width="40px" height="40px">
                      <GubeyAvatar size="favicon" state="IDLE" />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="sm" color="gray.800">
                        Gubey
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Your content assistant
                      </Text>
                    </VStack>
                  </HStack>
                  <IconButton
                    ref={closeButtonRef}
                    aria-label={ACCESSIBILITY.closeLabel}
                    icon={<X size={18} />}
                    size="sm"
                    variant="ghost"
                    colorScheme="gray"
                    onClick={onClose}
                  />
                </HStack>
              </motion.div>

              {/* Content */}
              <VStack px={4} py={4} spacing={4} align="stretch">
                {/* Tip Section */}
                {tip && (
                  <motion.div variants={panelItemVariants}>
                    <HStack
                      p={3}
                      bg={`${GUBEY_COLORS.primary}08`}
                      borderRadius="lg"
                      align="start"
                      spacing={3}
                    >
                      <Box
                        p={2}
                        bg={`${GUBEY_COLORS.primary}15`}
                        borderRadius="md"
                        color={GUBEY_COLORS.primary}
                      >
                        <Lightbulb size={16} />
                      </Box>
                      <VStack align="start" spacing={2} flex={1}>
                        <Text fontSize="sm" color="gray.700" lineHeight="1.5">
                          {tip.message}
                        </Text>
                        {tip.actionLabel && tip.actionPath && (
                          <Button
                            as="a"
                            href={tip.actionPath}
                            size="xs"
                            variant="ghost"
                            colorScheme="purple"
                            rightIcon={<ExternalLink size={12} />}
                          >
                            {tip.actionLabel}
                          </Button>
                        )}
                      </VStack>
                    </HStack>
                  </motion.div>
                )}

                <Divider />

                {/* Quick Actions */}
                <motion.div variants={panelItemVariants}>
                  <VStack spacing={2} align="stretch">
                    <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">
                      Quick Actions
                    </Text>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Sparkles size={14} />}
                        flex={1}
                        onClick={onClose}
                      >
                        Get Tip
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        flex={1}
                        onClick={onClose}
                      >
                        Dismiss
                      </Button>
                    </HStack>
                  </VStack>
                </motion.div>

                {/* Footer */}
                <motion.div variants={panelItemVariants}>
                  <Text fontSize="xs" color="gray.400" textAlign="center">
                    Press ESC to close
                  </Text>
                </motion.div>
              </VStack>
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GubeyPanel;
