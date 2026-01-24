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
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react'

interface InstagramMockupProps {
  imageUrl: string
  message?: string
  headline?: string
}

const InstagramMockup: React.FC<InstagramMockupProps> = ({
  imageUrl,
  message,
  headline
}) => {
  const displayCaption = message?.slice(0, 150) || headline || 'Your caption here...'
  const showMore = message && message.length > 150

  return (
    <Box
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      maxW="400px"
      mx="auto"
      border="1px"
      borderColor="gray.200"
      overflow="hidden"
    >
      {/* Header */}
      <HStack p={3} justify="space-between">
        <HStack spacing={3}>
          <Box
            p={0.5}
            borderRadius="full"
            bgGradient="linear(to-tr, #f9ce34, #ee2a7b, #6228d7)"
          >
            <Avatar
              size="sm"
              name="LakeB2B"
              src="/logos/LakeB2B Logo Square.png"
              bg="white"
              border="2px solid white"
            />
          </Box>
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold" fontSize="sm" color="gray.900">
              lakeb2b
            </Text>
            <Text fontSize="xs" color="gray.500">
              Sponsored
            </Text>
          </VStack>
        </HStack>
        <Icon as={MoreHorizontal} boxSize={5} color="gray.900" cursor="pointer" />
      </HStack>

      {/* Image */}
      <Box position="relative" aspectRatio={1}>
        <Image
          src={imageUrl}
          alt="Post image"
          w="full"
          h="full"
          objectFit="cover"
          fallback={
            <Box
              w="full"
              h="full"
              bg="gray.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="gray.400">Image Preview</Text>
            </Box>
          }
        />

        {/* Instagram UI Overlay - Pagination dots */}
        <HStack
          position="absolute"
          bottom={3}
          left="50%"
          transform="translateX(-50%)"
          spacing={1}
        >
          <Box w={1.5} h={1.5} borderRadius="full" bg="blue.500" />
          <Box w={1.5} h={1.5} borderRadius="full" bg="gray.400" opacity={0.5} />
          <Box w={1.5} h={1.5} borderRadius="full" bg="gray.400" opacity={0.5} />
        </HStack>
      </Box>

      {/* Action Buttons */}
      <HStack p={3} justify="space-between">
        <HStack spacing={4}>
          <Icon as={Heart} boxSize={6} color="gray.900" cursor="pointer" />
          <Icon as={MessageCircle} boxSize={6} color="gray.900" cursor="pointer" />
          <Icon as={Send} boxSize={6} color="gray.900" cursor="pointer" />
        </HStack>
        <Icon as={Bookmark} boxSize={6} color="gray.900" cursor="pointer" />
      </HStack>

      {/* Likes */}
      <Box px={3} pb={1}>
        <Text fontSize="sm" fontWeight="bold" color="gray.900">
          1,234 likes
        </Text>
      </Box>

      {/* Caption */}
      <Box px={3} pb={3}>
        <Text fontSize="sm" color="gray.900">
          <Text as="span" fontWeight="bold">lakeb2b </Text>
          {displayCaption}
          {showMore && (
            <Text as="span" color="gray.500" cursor="pointer"> more</Text>
          )}
        </Text>
        <Text fontSize="xs" color="gray.500" mt={1}>
          View all 42 comments
        </Text>
        <Text fontSize="xs" color="gray.400" mt={1} textTransform="uppercase">
          2 hours ago
        </Text>
      </Box>
    </Box>
  )
}

export default InstagramMockup
