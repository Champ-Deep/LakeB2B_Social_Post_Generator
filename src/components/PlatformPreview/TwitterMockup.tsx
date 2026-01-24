import React from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  Avatar,
  Image,
  Icon,
} from '@chakra-ui/react'
import { MessageCircle, Repeat2, Heart, BarChart2, Share, Bookmark, MoreHorizontal, BadgeCheck } from 'lucide-react'

interface TwitterMockupProps {
  imageUrl: string
  message?: string
  headline?: string
}

const TwitterMockup: React.FC<TwitterMockupProps> = ({
  imageUrl,
  message,
  headline
}) => {
  const displayText = message?.slice(0, 280) || headline || 'Your post will appear here...'
  const charCount = displayText.length

  return (
    <Box
      bg="black"
      borderRadius="xl"
      maxW="500px"
      mx="auto"
      border="1px"
      borderColor="gray.800"
      overflow="hidden"
    >
      {/* Tweet */}
      <Box p={4}>
        <HStack align="start" spacing={3}>
          {/* Avatar */}
          <Avatar
            size="md"
            name="LakeB2B"
            src="/logos/LakeB2B Logo Square.png"
            bg="purple.500"
          />

          {/* Content */}
          <VStack align="stretch" flex={1} spacing={3}>
            {/* Header */}
            <HStack justify="space-between">
              <HStack spacing={1} flexWrap="wrap">
                <Text fontWeight="bold" fontSize="sm" color="white">
                  LakeB2B
                </Text>
                <Icon as={BadgeCheck} boxSize={4} color="blue.400" />
                <Text fontSize="sm" color="gray.500">
                  @lakeb2b
                </Text>
                <Text fontSize="sm" color="gray.500">·</Text>
                <Text fontSize="sm" color="gray.500">2h</Text>
              </HStack>
              <Icon as={MoreHorizontal} boxSize={5} color="gray.500" cursor="pointer" />
            </HStack>

            {/* Tweet Text */}
            <Text fontSize="sm" color="white" whiteSpace="pre-wrap">
              {displayText}
            </Text>

            {/* Image */}
            <Box borderRadius="xl" overflow="hidden" border="1px" borderColor="gray.800">
              <Image
                src={imageUrl}
                alt="Post image"
                w="full"
                maxH="350px"
                objectFit="cover"
                fallback={
                  <Box
                    w="full"
                    h="250px"
                    bg="gray.900"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="gray.600">Image Preview</Text>
                  </Box>
                }
              />
            </Box>

            {/* Engagement Stats */}
            <HStack justify="space-between" color="gray.500" pt={1}>
              <HStack spacing={1} cursor="pointer" _hover={{ color: 'blue.400' }}>
                <Icon as={MessageCircle} boxSize={4} />
                <Text fontSize="xs">42</Text>
              </HStack>
              <HStack spacing={1} cursor="pointer" _hover={{ color: 'green.400' }}>
                <Icon as={Repeat2} boxSize={4} />
                <Text fontSize="xs">128</Text>
              </HStack>
              <HStack spacing={1} cursor="pointer" _hover={{ color: 'pink.400' }}>
                <Icon as={Heart} boxSize={4} />
                <Text fontSize="xs">1.2K</Text>
              </HStack>
              <HStack spacing={1} cursor="pointer" _hover={{ color: 'blue.400' }}>
                <Icon as={BarChart2} boxSize={4} />
                <Text fontSize="xs">24K</Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={Bookmark} boxSize={4} cursor="pointer" _hover={{ color: 'blue.400' }} />
                <Icon as={Share} boxSize={4} cursor="pointer" _hover={{ color: 'blue.400' }} />
              </HStack>
            </HStack>
          </VStack>
        </HStack>
      </Box>
    </Box>
  )
}

export default TwitterMockup
