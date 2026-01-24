/**
 * Twitter Post Modal Component
 *
 * Modal for composing and posting an image to Twitter.
 * Includes text input with 280 character limit and scheduling options.
 */

import React, { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Textarea,
  Text,
  Image,
  Box,
  FormControl,
  FormLabel,
  FormHelperText,
  Icon,
  Progress,
  Link,
  Alert,
  AlertIcon,
  Input,
  Switch,
  Divider,
} from '@chakra-ui/react'
import toast from 'react-hot-toast'
import { Twitter, Send, ExternalLink, Clock, Calendar, Copy, Check, Download } from 'lucide-react'
import { trackSocialShare } from '../lib/analytics/posthog'

interface TwitterPostModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  imageData?: string // Base64 for posting
  initialText?: string
  isConnected?: boolean
}

const MAX_TEXT_LENGTH = 280 // Twitter's character limit

const TwitterPostModal: React.FC<TwitterPostModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageData,
  initialText = '',
  isConnected = false
}) => {
  const [postText, setPostText] = useState(initialText)
  const [isPosting, setIsPosting] = useState(false)
  const [postResult, setPostResult] = useState<{ success: boolean; postUrl?: string; scheduled?: boolean; copied?: boolean } | null>(null)
  const [isScheduling, setIsScheduling] = useState(false)
  const [scheduledDateTime, setScheduledDateTime] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  // Get minimum datetime (current time + 5 minutes)
  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 5)
    return now.toISOString().slice(0, 16)
  }

  // Get maximum datetime (30 days from now)
  const getMaxDateTime = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    return maxDate.toISOString().slice(0, 16)
  }

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPostText(initialText)
      setPostResult(null)
      setIsScheduling(false)
      setScheduledDateTime('')
      setIsCopied(false)
    }
  }, [isOpen, initialText])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    if (text.length <= MAX_TEXT_LENGTH) {
      setPostText(text)
    }
  }

  const handlePost = async () => {
    if (!postText.trim()) {
      toast.error('Please enter some text for your tweet')
      return
    }

    // Validate scheduled time if scheduling
    if (isScheduling) {
      if (!scheduledDateTime) {
        toast.error('Please select when to schedule your tweet')
        return
      }

      const scheduledTime = new Date(scheduledDateTime)
      const minTime = new Date()
      minTime.setMinutes(minTime.getMinutes() + 5)

      if (scheduledTime < minTime) {
        toast.error('Please select a time at least 5 minutes from now')
        return
      }
    }

    setIsPosting(true)

    try {
      // Choose endpoint based on whether scheduling
      const endpoint = isScheduling ? '/api/twitter/schedule' : '/api/twitter/post'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          imageData: imageData || imageUrl,
          text: postText.trim(),
          ...(isScheduling && { scheduledFor: scheduledDateTime })
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        if (isScheduling) {
          setPostResult({ success: true, scheduled: true })
          toast.success(`Tweet scheduled for ${new Date(scheduledDateTime).toLocaleString()}`)
        } else {
          setPostResult({ success: true, postUrl: data.postUrl })
          toast.success('Posted to Twitter!')
          trackSocialShare({ platform: 'twitter', success: true, contentType: 'generated_image' })
        }
      } else {
        const errorMessage = data.error || data.message || 'Failed to post to Twitter'

        // Handle specific error cases
        if (response.status === 401) {
          toast.error('Please log in to post to Twitter')
        } else if (response.status === 429) {
          toast.error(`Rate limit reached: ${errorMessage}`)
        } else if (errorMessage.includes('not connected') || errorMessage.includes('expired')) {
          toast.error('Please connect your Twitter account first')
        } else {
          toast.error(errorMessage)
        }
        trackSocialShare({ platform: 'twitter', success: false, contentType: 'generated_image' })
      }
    } catch (error) {
      console.error('Twitter post error:', error)
      toast.error('An unexpected error occurred. Please try again.')
      trackSocialShare({ platform: 'twitter', success: false, contentType: 'generated_image' })
    } finally {
      setIsPosting(false)
    }
  }

  // Copy to clipboard fallback for users not connected to Twitter
  const handleCopyToClipboard = async () => {
    if (!postText.trim()) {
      toast.error('Please enter some text to copy')
      return
    }

    try {
      // Modern clipboard API with fallback
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(postText.trim())
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = postText.trim()
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)

        if (!successful) {
          throw new Error('Copy command failed')
        }
      }

      setIsCopied(true)
      setPostResult({ success: true, copied: true })
      toast.success('Tweet text copied! Now download the image and paste both to Twitter.')

      // Reset copied state after 3 seconds
      setTimeout(() => setIsCopied(false), 3000)
    } catch (error) {
      console.error('Copy to clipboard failed:', error)
      toast.error('Failed to copy. Please select and copy the text manually.')
    }
  }

  // Handle image download from modal
  const handleDownloadImage = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `lakeb2b-twitter-post-${Date.now()}.png`
    link.click()
    toast.success('Image downloaded! Upload it to Twitter with your copied text.')
  }

  const textLength = postText.length
  const textPercentage = (textLength / MAX_TEXT_LENGTH) * 100
  const isNearLimit = textPercentage > 80
  const isAtLimit = textPercentage >= 100

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" closeOnOverlayClick={!isPosting}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={Twitter} color="twitter.500" />
            <Text>Post to Twitter</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isPosting} />

        <ModalBody>
          {postResult?.success ? (
            <VStack spacing={4} py={4}>
              <Icon
                as={postResult.copied ? Check : postResult.scheduled ? Clock : Twitter}
                boxSize={12}
                color={postResult.copied ? "green.500" : postResult.scheduled ? "purple.500" : "twitter.500"}
              />
              <Text fontSize="lg" fontWeight="bold" color="green.500">
                {postResult.copied ? 'Copied to Clipboard!' : postResult.scheduled ? 'Tweet Scheduled!' : 'Successfully Posted!'}
              </Text>
              <Text color="gray.600" textAlign="center">
                {postResult.copied
                  ? 'Your tweet text has been copied. Download the image and paste both to Twitter.'
                  : postResult.scheduled
                  ? `Your tweet will be published on ${new Date(scheduledDateTime).toLocaleString()}`
                  : 'Your image has been shared to Twitter.'}
              </Text>
              {postResult.copied && (
                <VStack spacing={2}>
                  <Button
                    colorScheme="green"
                    leftIcon={<Icon as={Download} />}
                    onClick={handleDownloadImage}
                  >
                    Download Image
                  </Button>
                  <Link href="https://twitter.com/compose/tweet" isExternal>
                    <Button
                      colorScheme="twitter"
                      rightIcon={<Icon as={ExternalLink} />}
                    >
                      Open Twitter
                    </Button>
                  </Link>
                </VStack>
              )}
              {postResult.postUrl && !postResult.scheduled && !postResult.copied && (
                <Link href={postResult.postUrl} isExternal>
                  <Button
                    colorScheme="twitter"
                    rightIcon={<Icon as={ExternalLink} />}
                  >
                    View on Twitter
                  </Button>
                </Link>
              )}
            </VStack>
          ) : (
            <VStack spacing={4} align="stretch">
              {/* Image Preview */}
              <Box
                borderRadius="md"
                overflow="hidden"
                border="1px solid"
                borderColor="gray.200"
                maxH="200px"
              >
                <Image
                  src={imageUrl}
                  alt="Tweet preview"
                  objectFit="contain"
                  maxH="200px"
                  w="full"
                />
              </Box>

              {/* Manual sharing instructions when not connected */}
              {!isConnected && (
                <Alert status="warning" borderRadius="md" fontSize="sm">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium">Twitter not connected</Text>
                    <Text>Write your tweet, then use "Copy Text" and "Download Image" to share manually on Twitter.</Text>
                  </VStack>
                </Alert>
              )}

              {/* Post Text */}
              <FormControl>
                <FormLabel>Tweet Text</FormLabel>
                <Textarea
                  value={postText}
                  onChange={handleTextChange}
                  placeholder="What's happening?"
                  rows={4}
                  resize="vertical"
                  isDisabled={isPosting}
                />
                <HStack justify="space-between" mt={1}>
                  <FormHelperText m={0}>
                    Add hashtags and mentions for better reach
                  </FormHelperText>
                  <Text
                    fontSize="xs"
                    color={isAtLimit ? 'red.500' : isNearLimit ? 'orange.500' : 'gray.500'}
                    fontWeight={isNearLimit ? 'medium' : 'normal'}
                  >
                    {textLength} / {MAX_TEXT_LENGTH}
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

              {/* Scheduling Option - only show when connected */}
              {isConnected && (
                <>
                  <Divider />

                  <FormControl>
                    <HStack justify="space-between">
                      <HStack>
                        <Icon as={Clock} color="purple.500" />
                        <FormLabel m={0}>Schedule for later</FormLabel>
                      </HStack>
                      <Switch
                        colorScheme="purple"
                        isChecked={isScheduling}
                        onChange={(e) => setIsScheduling(e.target.checked)}
                        isDisabled={isPosting}
                      />
                    </HStack>
                  </FormControl>

                  {isScheduling && (
                    <FormControl>
                      <FormLabel>
                        <HStack>
                          <Icon as={Calendar} boxSize={4} />
                          <Text>Schedule Date & Time</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        type="datetime-local"
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        min={getMinDateTime()}
                        max={getMaxDateTime()}
                        isDisabled={isPosting}
                      />
                      <FormHelperText>
                        Schedule up to 30 days in advance. Times are in your local timezone.
                      </FormHelperText>
                    </FormControl>
                  )}
                </>
              )}

              {/* Tips */}
              <Alert status="info" borderRadius="md" fontSize="sm">
                <AlertIcon />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="medium">Tips for better engagement:</Text>
                  <Text>Keep it concise, use trending hashtags, and engage with replies</Text>
                </VStack>
              </Alert>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          {postResult?.success ? (
            <Button onClick={onClose}>
              Close
            </Button>
          ) : (
            <HStack spacing={3} flexWrap="wrap" justify="flex-end">
              <Button variant="ghost" onClick={onClose} isDisabled={isPosting}>
                Cancel
              </Button>

              {/* Copy to Clipboard button - always available as fallback */}
              <Button
                colorScheme="gray"
                variant="outline"
                leftIcon={<Icon as={isCopied ? Check : Copy} />}
                onClick={handleCopyToClipboard}
                isDisabled={!postText.trim() || isPosting}
              >
                {isCopied ? 'Copied!' : 'Copy Text'}
              </Button>

              {/* Direct post button - only when connected */}
              {isConnected && (
                <Button
                  colorScheme={isScheduling ? "purple" : "twitter"}
                  leftIcon={<Icon as={isScheduling ? Clock : Send} />}
                  onClick={handlePost}
                  isLoading={isPosting}
                  loadingText={isScheduling ? "Scheduling..." : "Posting..."}
                  isDisabled={!postText.trim() || (isScheduling && !scheduledDateTime)}
                >
                  {isScheduling ? 'Schedule Tweet' : 'Post to Twitter'}
                </Button>
              )}

              {/* Download + Open Twitter when not connected */}
              {!isConnected && (
                <Button
                  colorScheme="green"
                  leftIcon={<Icon as={Download} />}
                  onClick={handleDownloadImage}
                  isDisabled={isPosting}
                >
                  Download Image
                </Button>
              )}
            </HStack>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default TwitterPostModal
