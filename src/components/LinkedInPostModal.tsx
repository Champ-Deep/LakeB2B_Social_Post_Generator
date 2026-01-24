/**
 * LinkedIn Post Modal Component
 *
 * Modal for composing and posting an image to LinkedIn.
 * Includes text input, visibility selector, and character counter.
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
  Select,
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
import { Linkedin, Send, ExternalLink, Eye, Users, Clock, Calendar, Copy, Check, Download } from 'lucide-react'

interface LinkedInPostModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  defaultText?: string
  onPostSuccess?: (postUrl: string) => void
  isConnected?: boolean
}

const MAX_TEXT_LENGTH = 3000

const LinkedInPostModal: React.FC<LinkedInPostModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  defaultText = '',
  onPostSuccess,
  isConnected = true
}) => {
  const [postText, setPostText] = useState(defaultText)
  const [visibility, setVisibility] = useState<'PUBLIC' | 'CONNECTIONS'>('PUBLIC')
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
      setPostText(defaultText)
      setPostResult(null)
      setIsScheduling(false)
      setScheduledDateTime('')
    }
  }, [isOpen, defaultText])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    if (text.length <= MAX_TEXT_LENGTH) {
      setPostText(text)
    }
  }

  const handlePost = async () => {
    if (!postText.trim()) {
      toast.error('Please enter some text for your LinkedIn post')
      return
    }

    // Validate scheduled time if scheduling
    if (isScheduling) {
      if (!scheduledDateTime) {
        toast.error('Please select when to schedule your post')
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
      const endpoint = isScheduling ? '/api/linkedin/schedule' : '/api/linkedin/post'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          imageData: imageUrl,
          postText: postText.trim(),
          visibility,
          ...(isScheduling && { scheduledFor: scheduledDateTime })
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        if (isScheduling) {
          setPostResult({ success: true, scheduled: true })
          toast.success(`Post scheduled for ${new Date(scheduledDateTime).toLocaleString()}`)
        } else {
          setPostResult({ success: true, postUrl: data.postUrl })
          onPostSuccess?.(data.postUrl)
          toast.success('Posted to LinkedIn!')
        }
      } else {
        const errorMessage = data.error || data.message || 'Failed to post to LinkedIn'

        // Handle specific error cases
        if (response.status === 401) {
          toast.error('Please log in to post to LinkedIn')
        } else if (response.status === 429) {
          toast.error(`Rate limit reached: ${errorMessage}`)
        } else if (errorMessage.includes('not connected') || errorMessage.includes('expired')) {
          toast.error('Please connect your LinkedIn account first')
        } else {
          toast.error(errorMessage)
        }
      }
    } catch (error) {
      console.error('LinkedIn post error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsPosting(false)
    }
  }

  // Copy to clipboard fallback for users not connected to LinkedIn
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
      toast.success('Post text copied! Now download the image and paste both to LinkedIn.')

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
    link.download = `lakeb2b-linkedin-post-${Date.now()}.png`
    link.click()
    toast.success('Image downloaded! Upload it to LinkedIn with your copied text.')
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
            <Icon as={Linkedin} color="linkedin.500" />
            <Text>Post to LinkedIn</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isPosting} />

        <ModalBody>
          {postResult?.success ? (
            <VStack spacing={4} py={4}>
              <Icon
                as={postResult.copied ? Check : postResult.scheduled ? Clock : Linkedin}
                boxSize={12}
                color={postResult.copied ? "green.500" : postResult.scheduled ? "purple.500" : "linkedin.500"}
              />
              <Text fontSize="lg" fontWeight="bold" color="green.500">
                {postResult.copied ? 'Copied to Clipboard!' : postResult.scheduled ? 'Post Scheduled!' : 'Successfully Posted!'}
              </Text>
              <Text color="gray.600" textAlign="center">
                {postResult.copied
                  ? 'Your post text has been copied. Download the image and paste both to LinkedIn.'
                  : postResult.scheduled
                  ? `Your post will be published on ${new Date(scheduledDateTime).toLocaleString()}`
                  : 'Your image has been shared to LinkedIn.'}
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
                  <Link href="https://www.linkedin.com/feed/" isExternal>
                    <Button
                      colorScheme="linkedin"
                      rightIcon={<Icon as={ExternalLink} />}
                    >
                      Open LinkedIn
                    </Button>
                  </Link>
                </VStack>
              )}
              {postResult.postUrl && !postResult.scheduled && !postResult.copied && (
                <Link href={postResult.postUrl} isExternal>
                  <Button
                    colorScheme="linkedin"
                    rightIcon={<Icon as={ExternalLink} />}
                  >
                    View on LinkedIn
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
                  alt="Post preview"
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
                    <Text fontWeight="medium">LinkedIn not connected</Text>
                    <Text>Write your post, then use "Copy Text" and "Download Image" to share manually on LinkedIn.</Text>
                  </VStack>
                </Alert>
              )}

              {/* Post Text */}
              <FormControl>
                <FormLabel>Post Text</FormLabel>
                <Textarea
                  value={postText}
                  onChange={handleTextChange}
                  placeholder="Write something about this image..."
                  rows={5}
                  resize="vertical"
                  isDisabled={isPosting}
                />
                <HStack justify="space-between" mt={1}>
                  <FormHelperText m={0}>
                    Add context, hashtags, or a call to action
                  </FormHelperText>
                  <Text
                    fontSize="xs"
                    color={isAtLimit ? 'red.500' : isNearLimit ? 'orange.500' : 'gray.500'}
                    fontWeight={isNearLimit ? 'medium' : 'normal'}
                  >
                    {textLength.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
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

              {/* Visibility Selector - only show when connected */}
              {isConnected && (
                <>
                  <FormControl>
                    <FormLabel>Visibility</FormLabel>
                    <Select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as 'PUBLIC' | 'CONNECTIONS')}
                      isDisabled={isPosting}
                    >
                      <option value="PUBLIC">
                        Anyone (Public)
                      </option>
                      <option value="CONNECTIONS">
                        Connections Only
                      </option>
                    </Select>
                    <FormHelperText>
                      <HStack spacing={1}>
                        <Icon as={visibility === 'PUBLIC' ? Eye : Users} boxSize={3} />
                        <Text>
                          {visibility === 'PUBLIC'
                            ? 'Anyone on or off LinkedIn can see this'
                            : 'Only your connections can see this'}
                        </Text>
                      </HStack>
                    </FormHelperText>
                  </FormControl>

                  <Divider />

                  {/* Scheduling Option */}
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
                  <Text>Use relevant hashtags, ask questions, and include a clear CTA</Text>
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
                  colorScheme={isScheduling ? "purple" : "linkedin"}
                  leftIcon={<Icon as={isScheduling ? Clock : Send} />}
                  onClick={handlePost}
                  isLoading={isPosting}
                  loadingText={isScheduling ? "Scheduling..." : "Posting..."}
                  isDisabled={!postText.trim() || (isScheduling && !scheduledDateTime)}
                >
                  {isScheduling ? 'Schedule Post' : 'Post to LinkedIn'}
                </Button>
              )}

              {/* Download + Open LinkedIn when not connected */}
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

export default LinkedInPostModal
