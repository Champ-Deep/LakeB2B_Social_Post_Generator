import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  Badge,
  Icon,
  FormControl,
  FormLabel,
  Input
} from '@chakra-ui/react'
import { Palette } from 'lucide-react'
import { MemeFormatId, MEME_FORMATS } from '../types/styles'

interface MemeSelectorProps {
  selectedFormat: MemeFormatId
  onFormatChange: (formatId: MemeFormatId) => void
  memeTexts: Record<string, string>
  onTextChange: (textId: string, value: string) => void
  disabled?: boolean
}

const MemeSelector: React.FC<MemeSelectorProps> = ({
  selectedFormat,
  onFormatChange,
  memeTexts,
  onTextChange,
  disabled = false
}) => {
  const selectedMemeFormat = MEME_FORMATS.find(format => format.id === selectedFormat)

  const getTextInputsForFormat = () => {
    if (!selectedMemeFormat || selectedFormat === 'auto') return null

    return selectedMemeFormat.textPositions.areas.map((area) => (
      <FormControl key={area.id}>
        <FormLabel fontSize="sm" textTransform="capitalize">
          {area.id.replace('-', ' ')} Text
        </FormLabel>
        <Input
          value={memeTexts[area.id] || ''}
          onChange={(e) => onTextChange(area.id, e.target.value)}
          placeholder={getPlaceholderForArea(selectedFormat, area.id)}
          size="sm"
          disabled={disabled}
        />
      </FormControl>
    ))
  }

  const getPlaceholderForArea = (format: MemeFormatId, areaId: string): string => {
    const placeholders: Record<MemeFormatId, Record<string, string>> = {
      auto: {},
      drake: {
        top: 'Old way / What we reject',
        bottom: 'New way / What we prefer'
      },
      distracted: {
        girlfriend: 'Current solution',
        boyfriend: 'You',
        'other-woman': 'New tempting option'
      },
      'woman-cat': {
        woman: 'Frustrated response',
        cat: 'Unbothered reaction'
      },
      'change-mind': {
        sign: 'Your bold statement here'
      }
    }

    return placeholders[format]?.[areaId] || `${areaId} text`
  }

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
          Meme Format
        </Text>
        <Select
          value={selectedFormat}
          onChange={(e) => onFormatChange(e.target.value as MemeFormatId)}
          disabled={disabled}
          bg="white"
          border="1px"
          borderColor="gray.200"
          _hover={{ borderColor: 'gray.300' }}
          _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px purple.500' }}
        >
          {MEME_FORMATS.map((format) => (
            <option key={format.id} value={format.id}>
              {format.name}
            </option>
          ))}
        </Select>
      </Box>

      {/* Format Preview Card */}
      {selectedMemeFormat && (
        <Box
          p={4}
          bg="gray.50"
          borderRadius="md"
          border="1px"
          borderColor="gray.200"
        >
          <HStack spacing={3} mb={3}>
            <Icon 
              as={Palette} 
              w={5} 
              h={5} 
              color="purple.500"
            />
            <Text fontWeight="semibold" color="gray.800">
              {selectedMemeFormat.name}
            </Text>
            <Badge 
              colorScheme="purple"
              variant="subtle"
            >
              Meme
            </Badge>
          </HStack>
          
          <Text fontSize="sm" color="gray.600" mb={3}>
            {selectedMemeFormat.description}
          </Text>

          {/* Meme Text Input Fields */}
          {selectedFormat !== 'auto' && (
            <Box mt={4}>
              <Text fontSize="sm" fontWeight="semibold" mb={3} color="gray.700">
                Meme Text
              </Text>
              <VStack spacing={3}>
                {getTextInputsForFormat()}
              </VStack>
            </Box>
          )}

          {/* Auto Selection Info */}
          {selectedFormat === 'auto' && (
            <Box mt={3} p={3} bg="purple.50" borderRadius="md" border="1px" borderColor="purple.200">
              <Text fontSize="sm" color="purple.700" fontWeight="medium">
                🤖 Smart Auto-Selection
              </Text>
              <Text fontSize="xs" color="purple.600" mt={1}>
                AI will analyze your content and choose the most relevant meme format, 
                then generate smart text suggestions automatically.
              </Text>
            </Box>
          )}
        </Box>
      )}
    </VStack>
  )
}

export default MemeSelector