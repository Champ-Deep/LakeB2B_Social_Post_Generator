import React, { useState } from 'react'
import {
  Box,
  VStack,
  Text,
  Badge,
  Image,
  Icon,
  HStack,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Palette, Image as ImageIcon, Briefcase, Check } from 'lucide-react'
import { StyleOption } from '../../types/styles'

const MotionBox = motion(Box)

interface StyleCardProps {
  style: StyleOption
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
}

const StyleCard: React.FC<StyleCardProps> = ({
  style,
  isSelected,
  onSelect,
  disabled = false
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const getStyleIcon = (category: string) => {
    switch (category) {
      case 'professional':
        return Briefcase
      case 'creative':
        return Palette
      case 'minimalist':
        return ImageIcon
      default:
        return ImageIcon
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

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'professional':
        return 'linear(to-br, blue.400, blue.600)'
      case 'creative':
        return 'linear(to-br, purple.400, pink.500)'
      case 'minimalist':
        return 'linear(to-br, gray.400, gray.600)'
      default:
        return 'linear(to-br, gray.400, gray.600)'
    }
  }

  return (
    <MotionBox
      as="button"
      onClick={onSelect}
      disabled={disabled}
      position="relative"
      borderRadius="xl"
      overflow="hidden"
      bg="white"
      borderWidth={isSelected ? 3 : 1}
      borderColor={isSelected ? 'purple.500' : 'gray.200'}
      boxShadow={isSelected ? 'lg' : 'sm'}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.6 : 1}
      whileHover={!disabled ? { scale: 1.03, y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      _focus={{ outline: 'none', boxShadow: 'outline' }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <Box
          position="absolute"
          top={2}
          right={2}
          zIndex={2}
          bg="purple.500"
          borderRadius="full"
          p={1}
        >
          <Check size={14} color="white" />
        </Box>
      )}

      {/* Preview Image */}
      <Box position="relative" h="120px" overflow="hidden">
        {style.previewImage ? (
          <Image
            src={style.previewImage}
            alt={style.name}
            objectFit="cover"
            w="full"
            h="full"
            transition="transform 0.3s ease"
            transform={isHovered ? 'scale(1.1)' : 'scale(1)'}
          />
        ) : (
          <Box
            w="full"
            h="full"
            bgGradient={getCategoryGradient(style.category)}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon
              as={getStyleIcon(style.category)}
              w={12}
              h={12}
              color="white"
              opacity={0.8}
            />
          </Box>
        )}

        {/* Hover overlay with description */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          bg="blackAlpha.700"
          backdropFilter="blur(4px)"
          p={2}
          transform={isHovered ? 'translateY(0)' : 'translateY(100%)'}
          transition="transform 0.2s ease"
        >
          <Text fontSize="xs" color="white" noOfLines={2}>
            {style.description}
          </Text>
        </Box>
      </Box>

      {/* Card Content */}
      <VStack p={3} spacing={2} align="stretch">
        <HStack justify="space-between" align="center">
          <Text
            fontWeight="bold"
            fontSize="sm"
            color="gray.800"
            textAlign="left"
          >
            {style.name}
          </Text>
          <Icon
            as={getStyleIcon(style.category)}
            w={4}
            h={4}
            color={`${getCategoryColor(style.category)}.500`}
          />
        </HStack>

        <HStack spacing={1} flexWrap="wrap">
          <Badge
            colorScheme={getCategoryColor(style.category)}
            variant="subtle"
            fontSize="2xs"
            textTransform="capitalize"
          >
            {style.category}
          </Badge>
          {style.platform.slice(0, 2).map((platform) => (
            <Badge
              key={platform}
              variant="outline"
              colorScheme="gray"
              fontSize="2xs"
              textTransform="capitalize"
            >
              {platform}
            </Badge>
          ))}
        </HStack>
      </VStack>
    </MotionBox>
  )
}

export default StyleCard
