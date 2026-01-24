/**
 * PostEditor Component
 *
 * A comprehensive post formatting editor that appears after image generation.
 * Allows users to:
 * - View the generated image
 * - Edit post text with character counter
 * - Add hashtags and CTAs
 * - Copy to clipboard
 * - Download the image
 * - Post to LinkedIn
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Textarea,
  Input,
  Button,
  Image,
  FormControl,
  FormLabel,
  FormHelperText,
  Progress,
  Icon,
  Badge,
  Divider,
  Wrap,
  WrapItem,
  IconButton,
  Tooltip,
  Collapse,
  useDisclosure,
  Alert,
  AlertIcon,
  Flex,
  Spacer,
} from '@chakra-ui/react'
import toast from 'react-hot-toast'
import {
  Copy,
  Check,
  Download,
  Linkedin,
  ChevronDown,
  ChevronUp,
  Hash,
  Sparkles,
  Eye,
  RotateCcw,
  Globe,
  Users,
} from 'lucide-react'
import LinkedInPostModal from './LinkedInPostModal'
import { useAuth } from '../contexts/AuthContext'

interface PostEditorProps {
  imageUrl: string
  initialMessage?: string
  initialHeadline?: string
  style?: string
  onClose?: () => void
  isLinkedInConnected?: boolean
}

const MAX_TEXT_LENGTH = 3000
const WARNING_THRESHOLD = 2800

// Suggested hashtags by category
const SUGGESTED_HASHTAGS = {
  general: ['#B2BMarketing', '#BusinessGrowth', '#LeadGeneration', '#SalesEnablement'],
  dataMarketing: ['#DataDriven', '#MarketingData', '#DatabaseMarketing', '#B2BData'],
  emailMarketing: ['#EmailMarketing', '#EmailList', '#DirectMarketing'],
  industry: ['#MarTech', '#SalesTools', '#GrowthHacking', '#DigitalTransformation'],
}

const PostEditor: React.FC<PostEditorProps> = ({
  imageUrl,
  initialMessage = '',
  initialHeadline = '',
  style = 'isometric',
  onClose,
  isLinkedInConnected = false,
}) => {
  const [postText, setPostText] = useState(initialMessage)
  const [headline, setHeadline] = useState(initialHeadline)
  const [isCopied, setIsCopied] = useState(false)
  const [showHashtags, setShowHashtags] = useState(false)
  const [isSharedToGallery, setIsSharedToGallery] = useState(false)
  const [isSharingToGallery, setIsSharingToGallery] = useState(false)
  const { isOpen: isLinkedInModalOpen, onOpen: openLinkedInModal, onClose: closeLinkedInModal } = useDisclosure()
  const { isAuthenticated } = useAuth()

  // Build complete post text (headline + body)
  const buildCompletePost = useCallback(() => {
    const parts: string[] = []
    if (headline.trim()) {
      parts.push(headline.trim())
      parts.push('')  // Empty line after headline
    }
    if (postText.trim()) {
      parts.push(postText.trim())
    }
    return parts.join('\n')
  }, [headline, postText])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    const totalLength = headline.length + (headline ? 2 : 0) + text.length
    if (totalLength <= MAX_TEXT_LENGTH) {
      setPostText(text)
    }
  }

  const handleHeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value.slice(0, 200) // Max 200 chars for headline
    setHeadline(text)
  }

  const handleCopyToClipboard = async () => {
    const completePost = buildCompletePost()
    try {
      await navigator.clipboard.writeText(completePost)
      setIsCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast.error('Copy failed. Try selecting and copying manually.')
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `lakeb2b-post-${Date.now()}.png`
    link.click()

    toast.success('Image downloaded!')
  }

  const addHashtag = (hashtag: string) => {
    if (!postText.includes(hashtag)) {
      const newText = postText + (postText.endsWith(' ') || !postText ? '' : ' ') + hashtag
      if (newText.length <= MAX_TEXT_LENGTH - headline.length - 2) {
        setPostText(newText)
      } else {
        toast.error('Character limit reached. Remove some text first.')
      }
    }
  }

  const handleClearText = () => {
    setPostText('')
    setHeadline('')
  }

  const handleShareToGallery = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to share your post to the gallery')
      return
    }

    if (isSharedToGallery) {
      toast('This post is already in the gallery', { icon: 'ℹ️' })
      return
    }

    setIsSharingToGallery(true)

    try {
      const response = await fetch('/api/posts/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          imageUrl,
          prompt: initialMessage || postText,
          headline: headline || null,
          style,
          isPublic: true,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsSharedToGallery(true)
        toast.success('Shared to Gallery!')
      } else {
        throw new Error(data.error || 'Failed to share')
      }
    } catch (error) {
      console.error('Error sharing to gallery:', error)
      toast.error('Could not share to gallery. Please try again.')
    } finally {
      setIsSharingToGallery(false)
    }
  }

  // Calculate total length and percentages
  const totalLength = headline.length + (headline ? 2 : 0) + postText.length
  const textPercentage = (totalLength / MAX_TEXT_LENGTH) * 100
  const isNearLimit = totalLength > WARNING_THRESHOLD
  const isAtLimit = totalLength >= MAX_TEXT_LENGTH

  return (
    <Box bg="white" borderRadius="xl" boxShadow="xl" overflow="hidden">
      {/* Header */}
      <Box bg="purple.600" color="white" p={4}>
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Heading size="md">Format Your Post</Heading>
            <Text fontSize="sm" opacity={0.9}>
              Add text, hashtags, and share your creation
            </Text>
          </VStack>
          <Badge colorScheme="purple" variant="subtle" fontSize="sm">
            {style.replace('-', ' ')}
          </Badge>
        </HStack>
      </Box>

      <Box p={6}>
        <VStack spacing={6} align="stretch">
          {/* Image Preview */}
          <Box
            borderRadius="lg"
            overflow="hidden"
            border="2px solid"
            borderColor="gray.200"
            position="relative"
          >
            <Image
              src={imageUrl}
              alt="Generated post image"
              objectFit="contain"
              maxH="300px"
              w="full"
            />
            <HStack position="absolute" bottom={2} right={2} spacing={2}>
              <Tooltip label="Preview full size">
                <IconButton
                  aria-label="Preview"
                  icon={<Icon as={Eye} />}
                  size="sm"
                  colorScheme="blackAlpha"
                  onClick={() => window.open(imageUrl, '_blank')}
                />
              </Tooltip>
              <Tooltip label="Download image">
                <IconButton
                  aria-label="Download"
                  icon={<Icon as={Download} />}
                  size="sm"
                  colorScheme="green"
                  onClick={handleDownload}
                />
              </Tooltip>
            </HStack>
          </Box>

          <Divider />

          {/* Headline Input */}
          <FormControl>
            <FormLabel fontWeight="semibold">
              <HStack>
                <Icon as={Sparkles} color="purple.500" />
                <Text>Headline (Optional)</Text>
              </HStack>
            </FormLabel>
            <Input
              value={headline}
              onChange={handleHeadlineChange}
              placeholder="Add a catchy headline to grab attention..."
              size="lg"
              fontWeight="semibold"
            />
            <FormHelperText>
              A strong headline increases engagement. Keep it under 200 characters.
            </FormHelperText>
          </FormControl>

          {/* Post Body */}
          <FormControl>
            <Flex align="center" mb={2}>
              <FormLabel fontWeight="semibold" m={0}>
                Post Body
              </FormLabel>
              <Spacer />
              <Button
                size="xs"
                variant="ghost"
                leftIcon={<Icon as={RotateCcw} boxSize={3} />}
                onClick={handleClearText}
                isDisabled={!postText && !headline}
              >
                Clear
              </Button>
            </Flex>
            <Textarea
              value={postText}
              onChange={handleTextChange}
              placeholder="Share your thoughts, insights, or a call-to-action..."
              rows={6}
              resize="vertical"
            />
            <HStack justify="space-between" mt={2}>
              <Button
                size="xs"
                variant="ghost"
                leftIcon={<Icon as={Hash} />}
                onClick={() => setShowHashtags(!showHashtags)}
                rightIcon={<Icon as={showHashtags ? ChevronUp : ChevronDown} boxSize={3} />}
              >
                Add Hashtags
              </Button>
              <Text
                fontSize="sm"
                color={isAtLimit ? 'red.500' : isNearLimit ? 'orange.500' : 'gray.500'}
                fontWeight={isNearLimit ? 'medium' : 'normal'}
              >
                {totalLength.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
              </Text>
            </HStack>
            {isNearLimit && (
              <Progress
                value={textPercentage}
                size="xs"
                colorScheme={isAtLimit ? 'red' : 'orange'}
                mt={2}
                borderRadius="full"
              />
            )}
          </FormControl>

          {/* Hashtag Suggestions */}
          <Collapse in={showHashtags} animateOpacity>
            <Box bg="gray.50" p={4} borderRadius="md">
              <Text fontSize="sm" fontWeight="medium" mb={3} color="gray.600">
                Click to add hashtags:
              </Text>
              <VStack align="stretch" spacing={3}>
                {Object.entries(SUGGESTED_HASHTAGS).map(([category, tags]) => (
                  <Box key={category}>
                    <Text fontSize="xs" color="gray.500" textTransform="capitalize" mb={1}>
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                    <Wrap spacing={2}>
                      {tags.map((tag) => (
                        <WrapItem key={tag}>
                          <Button
                            size="xs"
                            variant={postText.includes(tag) ? 'solid' : 'outline'}
                            colorScheme="purple"
                            onClick={() => addHashtag(tag)}
                            isDisabled={postText.includes(tag)}
                          >
                            {tag}
                          </Button>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>
                ))}
              </VStack>
            </Box>
          </Collapse>

          {/* Tips */}
          <Alert status="info" borderRadius="md" fontSize="sm">
            <AlertIcon />
            <VStack align="start" spacing={0}>
              <Text fontWeight="medium">Tips for better LinkedIn engagement:</Text>
              <Text fontSize="xs" color="gray.600">
                Use 3-5 relevant hashtags | Ask a question | Include a clear CTA | Keep it concise
              </Text>
            </VStack>
          </Alert>

          <Divider />

          {/* Action Buttons */}
          <VStack spacing={3}>
            <HStack w="full" spacing={3}>
              <Button
                flex={1}
                leftIcon={<Icon as={isCopied ? Check : Copy} />}
                onClick={handleCopyToClipboard}
                colorScheme={isCopied ? 'green' : 'gray'}
                variant="outline"
              >
                {isCopied ? 'Copied!' : 'Copy Text'}
              </Button>
              <Button
                flex={1}
                leftIcon={<Icon as={Download} />}
                onClick={handleDownload}
                colorScheme="green"
                variant="outline"
              >
                Download Image
              </Button>
            </HStack>

            {/* Share to Gallery Button */}
            <Button
              w="full"
              leftIcon={<Icon as={isSharedToGallery ? Check : Users} />}
              onClick={handleShareToGallery}
              colorScheme={isSharedToGallery ? 'green' : 'purple'}
              variant={isSharedToGallery ? 'solid' : 'outline'}
              isLoading={isSharingToGallery}
              loadingText="Sharing..."
              isDisabled={isSharedToGallery}
            >
              {isSharedToGallery ? 'Shared to Gallery!' : 'Share to Gallery'}
            </Button>

            {isAuthenticated ? (
              <Tooltip
                label={isLinkedInConnected ? '' : 'Connect LinkedIn account first'}
                placement="top"
              >
                <Button
                  w="full"
                  size="lg"
                  leftIcon={<Icon as={Linkedin} />}
                  onClick={openLinkedInModal}
                  colorScheme="linkedin"
                  isDisabled={!isLinkedInConnected}
                >
                  Post to LinkedIn
                </Button>
              </Tooltip>
            ) : (
              <Button
                w="full"
                size="lg"
                colorScheme="purple"
                onClick={() => {
                  toast('Please log in to post to LinkedIn', { icon: 'ℹ️' })
                }}
              >
                Login to Post to LinkedIn
              </Button>
            )}
          </VStack>
        </VStack>
      </Box>

      {/* LinkedIn Post Modal */}
      <LinkedInPostModal
        isOpen={isLinkedInModalOpen}
        onClose={closeLinkedInModal}
        imageUrl={imageUrl}
        defaultText={buildCompletePost()}
        onPostSuccess={(postUrl) => {
          toast.success('Posted to LinkedIn! Your post is now live.')
          closeLinkedInModal()
        }}
      />
    </Box>
  )
}

export default PostEditor
