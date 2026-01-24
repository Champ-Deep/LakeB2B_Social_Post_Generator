import React from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  Avatar,
  Image,
  Icon,
  Divider,
} from '@chakra-ui/react'
import { ThumbsUp, MessageSquare, Repeat2, Send, Globe, MoreHorizontal } from 'lucide-react'

interface LinkedInMockupProps {
  imageUrl: string
  message?: string
  headline?: string
}

const LinkedInMockup: React.FC<LinkedInMockupProps> = ({
  imageUrl,
  message,
  headline
}) => {
  // Truncate message for preview
  const displayMessage = message?.slice(0, 200) || headline || 'Your post message will appear here...'
  const showMoreText = message && message.length > 200

  return (
    <Box
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      maxW="550px"
      mx="auto"
      border="1px"
      borderColor="gray.200"
      overflow="hidden"
    >
      {/* Header */}
      <HStack p={3} justify="space-between">
        <HStack spacing={3}>
          <Avatar
            size="md"
            name="LakeB2B"
            src="/logos/LakeB2B Logo Square.png"
            bg="purple.500"
          />
          <VStack align="start" spacing={0}>
            <HStack spacing={1}>
              <Text fontWeight="bold" fontSize="sm" color="gray.900">
                LakeB2B
              </Text>
              <Text fontSize="xs" color="blue.600">• 1st</Text>
            </HStack>
            <Text fontSize="xs" color="gray.500" noOfLines={1}>
              Enabling Growth | B2B Data Solutions
            </Text>
            <HStack spacing={1}>
              <Text fontSize="xs" color="gray.500">Just now</Text>
              <Text fontSize="xs" color="gray.500">•</Text>
              <Icon as={Globe} boxSize={3} color="gray.500" />
            </HStack>
          </VStack>
        </HStack>
        <Icon as={MoreHorizontal} boxSize={5} color="gray.500" cursor="pointer" />
      </HStack>

      {/* Post Content */}
      <Box px={3} pb={2}>
        <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap">
          {displayMessage}
          {showMoreText && (
            <Text as="span" color="gray.500" cursor="pointer">
              ...more
            </Text>
          )}
        </Text>
      </Box>

      {/* Image */}
      <Box position="relative">
        <Image
          src={imageUrl}
          alt="Post image"
          w="full"
          maxH="400px"
          objectFit="cover"
          fallback={
            <Box
              w="full"
              h="300px"
              bg="gray.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="gray.400">Image Preview</Text>
            </Box>
          }
        />
      </Box>

      {/* Engagement Stats */}
      <HStack px={3} py={2} justify="space-between">
        <HStack spacing={1}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="blue.500"
            borderRadius="full"
            w={4}
            h={4}
          >
            <ThumbsUp size={10} color="white" />
          </Box>
          <Text fontSize="xs" color="gray.500">24</Text>
        </HStack>
        <HStack spacing={3}>
          <Text fontSize="xs" color="gray.500">3 comments</Text>
          <Text fontSize="xs" color="gray.500">1 repost</Text>
        </HStack>
      </HStack>

      <Divider />

      {/* Action Buttons */}
      <HStack p={2} justify="space-around">
        <HStack
          spacing={1}
          color="gray.600"
          cursor="pointer"
          px={3}
          py={2}
          borderRadius="md"
          _hover={{ bg: 'gray.100' }}
        >
          <ThumbsUp size={18} />
          <Text fontSize="xs" fontWeight="medium">Like</Text>
        </HStack>
        <HStack
          spacing={1}
          color="gray.600"
          cursor="pointer"
          px={3}
          py={2}
          borderRadius="md"
          _hover={{ bg: 'gray.100' }}
        >
          <MessageSquare size={18} />
          <Text fontSize="xs" fontWeight="medium">Comment</Text>
        </HStack>
        <HStack
          spacing={1}
          color="gray.600"
          cursor="pointer"
          px={3}
          py={2}
          borderRadius="md"
          _hover={{ bg: 'gray.100' }}
        >
          <Repeat2 size={18} />
          <Text fontSize="xs" fontWeight="medium">Repost</Text>
        </HStack>
        <HStack
          spacing={1}
          color="gray.600"
          cursor="pointer"
          px={3}
          py={2}
          borderRadius="md"
          _hover={{ bg: 'gray.100' }}
        >
          <Send size={18} />
          <Text fontSize="xs" fontWeight="medium">Send</Text>
        </HStack>
      </HStack>
    </Box>
  )
}

export default LinkedInMockup
