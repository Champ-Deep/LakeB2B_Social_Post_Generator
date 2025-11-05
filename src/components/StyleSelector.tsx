import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  Badge,
  Icon,
  Tooltip,
} from '@chakra-ui/react'
import { Palette, Image, Briefcase } from 'lucide-react'
import { STYLE_OPTIONS, StyleId } from '../types/styles'

interface StyleSelectorProps {
  selectedStyle: StyleId
  onStyleChange: (styleId: StyleId) => void
  disabled?: boolean
}

const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyle,
  onStyleChange,
  disabled = false
}) => {
  const selectedStyleOption = STYLE_OPTIONS.find(style => style.id === selectedStyle)

  const getStyleIcon = (category: string) => {
    switch (category) {
      case 'professional':
        return Briefcase
      case 'creative':
        return Palette
      case 'minimalist':
        return Image
      default:
        return Image
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'professional':
        return 'blue'
      case 'creative':
        return 'purple'
      case 'minimalist':
        return 'gray'
      default:
        return 'gray'
    }
  }

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
          Visual Style
        </Text>
        <Select
          value={selectedStyle}
          onChange={(e) => onStyleChange(e.target.value as StyleId)}
          disabled={disabled}
          bg="white"
          border="1px"
          borderColor="gray.200"
          _hover={{ borderColor: 'gray.300' }}
          _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px purple.500' }}
        >
          {STYLE_OPTIONS.map((style) => (
            <option key={style.id} value={style.id}>
              {style.name} - {style.description}
            </option>
          ))}
        </Select>
      </Box>

      {/* Style Preview Card */}
      {selectedStyleOption && (
        <Box
          p={4}
          bg="gray.50"
          borderRadius="md"
          border="1px"
          borderColor="gray.200"
        >
          <HStack spacing={3} mb={3}>
            <Icon 
              as={getStyleIcon(selectedStyleOption.category)} 
              w={5} 
              h={5} 
              color={`${getCategoryColor(selectedStyleOption.category)}.500`}
            />
            <Text fontWeight="semibold" color="gray.800">
              {selectedStyleOption.name}
            </Text>
            <Badge 
              colorScheme={getCategoryColor(selectedStyleOption.category)}
              variant="subtle"
              textTransform="capitalize"
            >
              {selectedStyleOption.category}
            </Badge>
          </HStack>
          
          <Text fontSize="sm" color="gray.600" mb={3}>
            {selectedStyleOption.description}
          </Text>

          <HStack spacing={2} flexWrap="wrap">
            <Text fontSize="xs" color="gray.500" fontWeight="medium">
              Optimized for:
            </Text>
            {selectedStyleOption.platform.map((platform) => (
              <Badge 
                key={platform} 
                size="sm" 
                variant="outline" 
                colorScheme="gray"
                textTransform="capitalize"
              >
                {platform}
              </Badge>
            ))}
          </HStack>

          {/* Style-specific tips */}
          <Box mt={3} p={2} bg="white" borderRadius="sm" border="1px" borderColor="gray.100">
            <Text fontSize="xs" color="gray.600">
              <Text as="span" fontWeight="medium">Style Tips:</Text>
              {selectedStyleOption.id === 'isometric' && ' Creates modern 3D business scenes with professional gradients.'}
              {selectedStyleOption.id === 'newyork-cartoon' && ' Produces bold B&W illustrations perfect for editorial content.'}
              {selectedStyleOption.id === 'minimalist-linkedin' && ' Generates clean, mobile-friendly designs for professional networks.'}
            </Text>
          </Box>
        </Box>
      )}
    </VStack>
  )
}

export default StyleSelector