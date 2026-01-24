import React from 'react'
import {
  Box,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { STYLE_OPTIONS, StyleId } from '../../types/styles'
import StyleCard from './StyleCard'

const MotionBox = motion(Box)

interface StyleMoodBoardProps {
  selectedStyle: StyleId
  onStyleChange: (styleId: StyleId) => void
  disabled?: boolean
}

const StyleMoodBoard: React.FC<StyleMoodBoardProps> = ({
  selectedStyle,
  onStyleChange,
  disabled = false
}) => {
  const handleStyleSelect = (styleId: string) => {
    if (!disabled) {
      onStyleChange(styleId as StyleId)
    }
  }

  const selectedStyleOption = STYLE_OPTIONS.find(s => s.id === selectedStyle)

  return (
    <VStack spacing={4} align="stretch" width="full">
      <Text fontSize="sm" fontWeight="medium" color="gray.700">
        Visual Style
      </Text>

      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={3}>
        <AnimatePresence>
          {STYLE_OPTIONS.map((style, index) => (
            <MotionBox
              key={style.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <StyleCard
                style={style}
                isSelected={selectedStyle === style.id}
                onSelect={() => handleStyleSelect(style.id)}
                disabled={disabled}
              />
            </MotionBox>
          ))}
        </AnimatePresence>
      </SimpleGrid>

      {/* Selected Style Info */}
      {selectedStyleOption && (
        <MotionBox
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
          p={3}
          bg="purple.50"
          borderRadius="lg"
          borderWidth={1}
          borderColor="purple.100"
        >
          <Text fontSize="xs" color="gray.600">
            <Text as="span" fontWeight="bold" color="purple.600">
              {selectedStyleOption.name}:
            </Text>{' '}
            {selectedStyleOption.id === 'isometric' && 'Creates modern 3D business scenes with professional gradients.'}
            {selectedStyleOption.id === 'infographic' && 'Generates data visualizations with charts, graphs, and statistics.'}
            {selectedStyleOption.id === 'newyork-cartoon' && 'Produces bold B&W illustrations. Logo area is automatically lightened.'}
            {selectedStyleOption.id === 'minimalist-linkedin' && 'Clean, mobile-friendly designs for professional networks.'}
            {selectedStyleOption.id === 'meme' && 'Real meme templates with AI-generated text overlays.'}
          </Text>
        </MotionBox>
      )}
    </VStack>
  )
}

export default StyleMoodBoard
