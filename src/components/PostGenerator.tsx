import React, { useCallback, useEffect, useState, useRef } from 'react'
import {
  Box,
  Container,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Text,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react'
import toast from 'react-hot-toast'
import { Sparkles, LogIn, Trash2, Save, Video, Image as ImageIconLucide, Upload } from 'lucide-react'
import ImageUploader from './ImageUploader'
import { PostFormData } from '../types/post'
import { StyleId } from '../types/styles'
import { brandTheme } from '../theme/brand'
import ImagePreview from './ImagePreview'
import VideoPreview from './VideoPreview'
import { StyleMoodBoard } from './StyleMoodBoard'
import UserProfile from './UserProfile'
import AuthModal from './AuthModal'
import RichTextEditor from './RichTextEditor'
import TrendingTopics from './TrendingTopics'
import { serviceContainer } from '../lib/api/ServiceContainer'
import { globalErrorHandler } from '../lib/errors/GlobalErrorHandler'
import { useConnectionHealth } from '../hooks/useConnectionHealth'
import { useAuth } from '../contexts/AuthContext'
import { MemeFormatId } from '../types/styles'
import MemeSelector from './MemeSelector'
import { MagicFix } from './MagicFix'
import { useGubey } from './Gubey'
import { useDraftPersistence, DraftData } from '../hooks/useDraftPersistence'
import { trackImageGeneration, trackStyleSelection, trackFeatureUsage } from '../lib/analytics/posthog'

const PostGenerator: React.FC = () => {
  const [formData, setFormData] = useState<PostFormData>({
    message: '',
    headline: '',
  })
  const [selectedStyle, setSelectedStyle] = useState<StyleId>('isometric')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [generationProgress, setGenerationProgress] = useState(0)
  const [logoPosition, setLogoPosition] = useState('bottom-left')
  const [logoSize, setLogoSize] = useState(35) // Default 35% of image width
  const [logoOpacity, setLogoOpacity] = useState(85) // Default 85% opacity
  const [logoRotation, setLogoRotation] = useState(0) // Default 0 degrees
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedMemeFormat, setSelectedMemeFormat] = useState<MemeFormatId>('auto')
  const [memeTexts, setMemeTexts] = useState<Record<string, string>>({})
  const [customBackground, setCustomBackground] = useState<string | null>(null)
  const { isConnected, isChecking, retry } = useConnectionHealth()
  const { isAuthenticated, addPoints, incrementGeneration } = useAuth()
  const { dispatch: gubeyDispatch } = useGubey()
  const previousStyleRef = useRef(selectedStyle)

  // Draft persistence for form recovery
  const handleDraftRestored = useCallback((draft: DraftData) => {
    setFormData({ message: draft.message, headline: draft.headline })
    setSelectedStyle(draft.selectedStyle as StyleId)
    setLogoPosition(draft.logoPosition)
    setLogoSize(draft.logoSize)
    setLogoOpacity(draft.logoOpacity)
    setLogoRotation(draft.logoRotation)
    setSelectedMemeFormat(draft.selectedMemeFormat as MemeFormatId)
    setMemeTexts(draft.memeTexts)
    toast.success('Draft restored! Your previous work has been recovered.', { icon: '📝' })
  }, [])

  const { saveDraft, clearDraft, hasDraft, lastSaved } = useDraftPersistence({
    onDraftRestored: handleDraftRestored,
  })

  // Auto-save draft when form data changes
  useEffect(() => {
    saveDraft({
      message: formData.message,
      headline: formData.headline,
      selectedStyle,
      logoPosition,
      logoSize,
      logoOpacity,
      logoRotation,
      selectedMemeFormat,
      memeTexts,
    })
  }, [
    formData.message,
    formData.headline,
    selectedStyle,
    logoPosition,
    logoSize,
    logoOpacity,
    logoRotation,
    selectedMemeFormat,
    memeTexts,
    saveDraft,
  ])

  const isMemeStyleSelected = selectedStyle === 'meme'

  // Auto-generate smart meme text suggestions
  const generateSmartMemeText = (format: MemeFormatId, message: string, headline: string) => {
    const combined = `${message} ${headline}`.toLowerCase()
    const newTexts: Record<string, string> = {}

    switch (format) {
      case 'drake':
        if (combined.includes('old') || combined.includes('before')) {
          newTexts.top = 'Old way of doing things'
          newTexts.bottom = 'Our new approach'
        } else {
          newTexts.top = 'Traditional methods'
          newTexts.bottom = 'Our solution'
        }
        break

      case 'distracted':
        newTexts.girlfriend = 'Current solution'
        newTexts.boyfriend = 'You'
        newTexts['other-woman'] = 'Our tempting offer'
        break

      case 'woman-cat':
        newTexts.woman = 'Complaints about change'
        newTexts.cat = 'Us knowing it works'
        break

      case 'change-mind':
        newTexts.sign = `${headline || 'Our approach'} is the best solution`
        break
    }

    setMemeTexts(newTexts)
  }

  // Auto-select meme format based on content
  const selectBestMemeFormat = (message: string, headline: string): MemeFormatId => {
    const combined = `${message} ${headline}`.toLowerCase()

    if (combined.includes('before') || combined.includes('after') || combined.includes('old') || combined.includes('new')) {
      return 'drake'
    } else if (combined.includes('frustrated') || combined.includes('complaint') || combined.includes('angry')) {
      return 'woman-cat'
    } else if (combined.includes('convince') || combined.includes('prove') || combined.includes('debate')) {
      return 'change-mind'
    } else if (combined.includes('tempted') || combined.includes('versus') || combined.includes('option')) {
      return 'distracted'
    }

    return 'drake' // Default fallback
  }

  const handleMemeTextChange = (textId: string, value: string) => {
    setMemeTexts(prev => ({ ...prev, [textId]: value }))
  }

  const handleInputChange = (field: keyof PostFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const generatePrompt = (data: PostFormData): string => {
    // Simple business context prompt - let style prompts handle all visual requirements
    const content = `Business theme: "${data.message}"`
    const headline = data.headline ? `Headline: "${data.headline}"` : ''

    return `${content}. ${headline}`.trim()
  }

  const handleGenerate = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      toast.error('Please log in to generate images')
      setShowAuthModal(true)
      return
    }

    if (!formData.message || !formData.headline) {
      toast.error('Please enter both message and headline for your social post')
      return
    }

    // Check connection before attempting
    if (!isConnected) {
      const reconnected = await retry()
      if (!reconnected) {
        toast.error('Please check your internet connection and ensure the server is running.')
        return
      }
    }

    setIsGenerating(true)
    setError('')
    setGenerationProgress(0)

    // Notify Gubey mascot that generation started
    gubeyDispatch({ type: 'START_GENERATION' })

    // Simulate progress for mini-game
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev + Math.random() * 15
        return newProgress >= 95 ? 95 : newProgress
      })
    }, 800)

    try {
      let actualMemeFormat = selectedMemeFormat

      // Auto-select best format if needed
      if (selectedStyle === 'meme' && selectedMemeFormat === 'auto') {
        actualMemeFormat = selectBestMemeFormat(formData.message, formData.headline)

        // Generate smart text suggestions for auto-selected format
        if (formData.message || formData.headline) {
          generateSmartMemeText(actualMemeFormat, formData.message, formData.headline)
        }
      }

      const prompt = generatePrompt(formData)
      const imageService = serviceContainer.getImageGenerationService()

      // Use the service layer for API calls
      const response = await imageService.generateImage({
        prompt,
        style: selectedStyle,
        memeFormat: selectedStyle === 'meme' ? actualMemeFormat : undefined,
        memeTexts: selectedStyle === 'meme' ? memeTexts : undefined,
        position: logoPosition,
        logoSize,
        logoOpacity,
        logoRotation
      })

      if (!response.success || !response.data) {
        // Check if it's an authentication error (401 status or UNAUTHORIZED code)
        const error = response.error
        if (
          response.statusCode === 401 ||
          error?.code === 'UNAUTHORIZED' ||
          error?.message?.includes('Authentication') ||
          error?.message?.includes('UNAUTHORIZED')
        ) {
          toast.error('Your session has expired. Please log in again.')
          setShowAuthModal(true)
          return
        }
        throw error || new Error('Failed to generate image')
      }

      clearInterval(progressInterval)
      setGenerationProgress(100)
      setGeneratedImageUrl(response.data.imageUrl)

      // Track successful generation
      trackImageGeneration({
        style: selectedStyle,
        memeFormat: selectedStyle === 'meme' ? actualMemeFormat : undefined,
        logoPosition: logoPosition,
        success: true,
        duration: response.data?.duration || 0,
        modelUsed: response.data?.modelUsed || 'unknown'
      })

      // Notify Gubey mascot of success (triggers celebration animation)
      gubeyDispatch({ type: 'GENERATION_SUCCESS' })

      // Award points and track generation if user is authenticated
      if (isAuthenticated) {
        await addPoints(10) // 10 points per generation
        await incrementGeneration()
      }

      // Clear draft after successful generation
      clearDraft()

      // Check for fallback - show warning if AI was unavailable
      const responseData = response.data
      if (responseData?.fallback) {
        setTimeout(() => {
          toast(responseData.fallbackReason || 'Using preview placeholder. AI temporarily unavailable.', {
            icon: '⚠️',
            duration: 8000,
          })
        }, 500)
      } else {
        // Single consolidated success toast - wait for progress to complete
        setTimeout(() => {
          const successMessage = isAuthenticated
            ? 'Image generated! +10 points earned!'
            : 'Image generated successfully!'

          const memeInfo = selectedStyle === 'meme' && actualMemeFormat !== 'auto'
            ? ` (${actualMemeFormat.replace('-', ' ')} meme)`
            : ''

          const modelInfo = responseData?.modelUsed
            ? ` - ${responseData.modelUsed.split('-')[0]}`
            : ''

          toast.success(successMessage + memeInfo + modelInfo)
        }, 500) // Small delay to let progress complete
      }
    } catch (error) {
      clearInterval(progressInterval)

      // Notify Gubey mascot of error (triggers shake animation)
      gubeyDispatch({ type: 'GENERATION_ERROR' })

      const errorMessage = globalErrorHandler.getUserMessage(error)
      setError(errorMessage)

      // Track failed generation
      trackImageGeneration({
        style: selectedStyle,
        memeFormat: selectedStyle === 'meme' ? selectedMemeFormat : undefined,
        logoPosition: logoPosition,
        success: false
      })

      toast.error(`Generation failed: ${errorMessage}`)

      // Log the error for debugging
      globalErrorHandler.handleError(error, {
        component: 'PostGenerator',
        action: 'generateImage',
        formData
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStyleChange = (newStyle: string) => {
    // Track style selection
    trackStyleSelection(newStyle, previousStyleRef.current)
    previousStyleRef.current = newStyle as StyleId

    setSelectedStyle(newStyle as StyleId)

    // Adjust logo size based on style for better visibility
    if (newStyle === 'newyork-cartoon') {
      // Increase logo size for New York Cartoon style for better visibility
      // Use max opacity since the background area is lightened in the prompt
      setLogoSize(45) // 45% for better visibility
      setLogoOpacity(100) // Full opacity for maximum visibility on lightened background
    } else if (newStyle === 'meme') {
      // Keep default size for meme style
      setLogoSize(35)
      setLogoOpacity(85)
      // Track meme feature usage
      trackFeatureUsage('meme_generator', { format: selectedMemeFormat })
    } else {
      // Reset to defaults for other styles
      setLogoSize(35)
      setLogoOpacity(85)
    }

    if (generatedImageUrl) {
      // Re-generate with new style
      handleGenerate()
    }
  }

  const handleRandomize = () => {
    if (formData.message && formData.headline) {
      // Add randomization suffix to prompt for variety
      const randomSuffix = Math.random().toString(36).substring(7)
      const originalMessage = formData.message
      setFormData(prev => ({ ...prev, message: `${originalMessage} (v${randomSuffix})` }))

      setTimeout(() => {
        handleGenerate()
        setFormData(prev => ({ ...prev, message: originalMessage }))
      }, 100)
    }
  }

  const handleRefresh = () => {
    if (formData.message && formData.headline) {
      handleGenerate()
    }
  }

  const handleLogoPositionChange = (newPosition: string) => {
    setLogoPosition(newPosition)
    // Don't auto-regenerate on position change - user can click Generate Post
  }

  const handleTopicSelect = (topic: any) => {
    // Auto-fill the message field with the suggested post
    setFormData(prev => ({
      ...prev,
      message: topic.suggestion,
      headline: topic.title
    }))

    toast.success(`Topic applied: ${topic.title}`)
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <HStack justify="space-between" align="center" mb={4}>
            <Box></Box> {/* Spacer */}
            <VStack spacing={1}>
              <Heading
                size="2xl"
                bgGradient={brandTheme.colors.gradients.logo}
                bgClip="text"
              >
                LakeB2B Social Post Generator
              </Heading>
              <Text color="gray.600">
                Create brand-consistent social media images with AI
              </Text>
            </VStack>
            <Box>
              {isAuthenticated ? (
                <UserProfile />
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<LogIn size={16} />}
                  onClick={() => setShowAuthModal(true)}
                >
                  Login
                </Button>
              )}
            </Box>
          </HStack>
        </Box>

        <HStack spacing={8} align="start" flexDirection={{ base: 'column', lg: 'row' }}>
          {/* Form Panel */}
          <Box flex={1} bg="white" p={6} borderRadius="lg" boxShadow="md">
            <VStack spacing={5}>
              {/* Trending Topics - Moved to top for better visibility */}
              <Box width="full">
                <TrendingTopics onTopicSelect={handleTopicSelect} compact={true} />
              </Box>

              <FormControl isRequired>
                <RichTextEditor
                  label="Post Message"
                  value={formData.message}
                  onChange={(value) => setFormData(prev => ({ ...prev, message: value }))}
                  placeholder="Enter your post message... Use formatting tools for emphasis!"
                  maxLength={800}
                  minHeight="140px"
                />
              </FormControl>

              <FormControl isRequired>
                <RichTextEditor
                  label="Headline"
                  value={formData.headline}
                  onChange={(value) => setFormData(prev => ({ ...prev, headline: value }))}
                  placeholder="Enter your headline text..."
                  maxLength={200}
                  minHeight="80px"
                />
              </FormControl>

              {/* Magic Fix - AI-powered content improvement */}
              <MagicFix
                currentPrompt={formData.message}
                currentHeadline={formData.headline}
                style={selectedStyle}
                onApplySuggestion={(prompt, headline) => {
                  setFormData({ message: prompt, headline })
                }}
                disabled={isGenerating}
              />

              <StyleMoodBoard
                selectedStyle={selectedStyle}
                onStyleChange={setSelectedStyle}
                disabled={isGenerating}
              />

              {/* Custom Background Upload */}
              <Accordion allowToggle>
                <AccordionItem border="none">
                  <AccordionButton
                    px={0}
                    _hover={{ bg: 'transparent' }}
                  >
                    <HStack flex="1" spacing={2}>
                      <Icon as={Upload} boxSize={4} color="purple.500" />
                      <Text fontSize="sm" fontWeight="semibold" color="purple.600">
                        Custom Background (Optional)
                      </Text>
                    </HStack>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4} px={0}>
                    <ImageUploader
                      onUpload={(file, dataUrl) => {
                        setCustomBackground(dataUrl)
                        trackFeatureUsage('custom_background_upload')
                        toast.success('Custom background uploaded!')
                      }}
                      onClear={() => {
                        setCustomBackground(null)
                        toast('Background cleared', { icon: '🗑️' })
                      }}
                      previewUrl={customBackground || undefined}
                      label="Upload Background Image"
                      helperText="PNG, JPG, WEBP up to 5MB. Your image will be used as the background."
                      compact={true}
                    />
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              {/* Meme Selector - Show only when meme style is selected */}
              {isMemeStyleSelected && (
                <MemeSelector
                  selectedFormat={selectedMemeFormat}
                  onFormatChange={setSelectedMemeFormat}
                  memeTexts={memeTexts}
                  onTextChange={handleMemeTextChange}
                  disabled={isGenerating}
                />
              )}

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Logo Position</FormLabel>
                <Select
                  value={logoPosition}
                  onChange={(e) => handleLogoPositionChange(e.target.value)}
                  size="md"
                  isDisabled={isGenerating}
                >
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="top-right">Top Right</option>
                </Select>
              </FormControl>

              {/* Logo Customization - Using preset buttons instead of sliders */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Logo Size</FormLabel>
                <HStack spacing={2} flexWrap="wrap">
                  {[20, 30, 35, 45, 60].map((size) => (
                    <Button
                      key={size}
                      size="sm"
                      variant={logoSize === size ? 'solid' : 'outline'}
                      colorScheme="purple"
                      onClick={() => setLogoSize(size)}
                      isDisabled={isGenerating}
                    >
                      {size}%
                    </Button>
                  ))}
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Selected: {logoSize}%
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Logo Opacity</FormLabel>
                <HStack spacing={2} flexWrap="wrap">
                  {[60, 75, 85, 95, 100].map((opacity) => (
                    <Button
                      key={opacity}
                      size="sm"
                      variant={logoOpacity === opacity ? 'solid' : 'outline'}
                      colorScheme="purple"
                      onClick={() => setLogoOpacity(opacity)}
                      isDisabled={isGenerating}
                    >
                      {opacity}%
                    </Button>
                  ))}
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Selected: {logoOpacity}%
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Logo Rotation</FormLabel>
                <HStack spacing={2} flexWrap="wrap">
                  {[-15, -5, 0, 5, 15].map((rotation) => (
                    <Button
                      key={rotation}
                      size="sm"
                      variant={logoRotation === rotation ? 'solid' : 'outline'}
                      colorScheme="purple"
                      onClick={() => setLogoRotation(rotation)}
                      isDisabled={isGenerating}
                    >
                      {rotation > 0 ? `+${rotation}°` : `${rotation}°`}
                    </Button>
                  ))}
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Selected: {logoRotation > 0 ? `+${logoRotation}°` : `${logoRotation}°`}
                </Text>
              </FormControl>

              {/* Draft status indicator */}
              {hasDraft && (
                <HStack
                  w="full"
                  justify="space-between"
                  p={2}
                  bg="green.50"
                  borderRadius="md"
                  fontSize="xs"
                  color="green.700"
                >
                  <HStack>
                    <Save size={14} />
                    <Text>
                      Draft saved {lastSaved ? new Date(lastSaved).toLocaleTimeString() : ''}
                    </Text>
                  </HStack>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    leftIcon={<Trash2 size={12} />}
                    onClick={() => {
                      clearDraft()
                      setFormData({ message: '', headline: '' })
                      setSelectedStyle('isometric')
                      setLogoPosition('bottom-left')
                      setLogoSize(35)
                      setLogoOpacity(85)
                      setLogoRotation(0)
                      setSelectedMemeFormat('auto')
                      setMemeTexts({})
                      toast.success('Draft cleared')
                    }}
                    isDisabled={isGenerating}
                  >
                    Clear
                  </Button>
                </HStack>
              )}

              <Button
                variant="gradient"
                size="lg"
                width="full"
                onClick={handleGenerate}
                isLoading={isGenerating}
                loadingText="Generating..."
                leftIcon={<Sparkles size={20} />}
                isDisabled={!isConnected && !isChecking}
              >
                {!isConnected && !isChecking ? 'Connection Required' : 'Generate Post'}
              </Button>

              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}
            </VStack>
          </Box>

          {/* Preview Panel */}
          <Box flex={1}>
            <Tabs isFitted variant="soft-rounded" colorScheme="purple">
              <TabList mb="1em" bg="white" p={1} borderRadius="xl" boxShadow="sm">
                <Tab borderRadius="lg">
                  <HStack spacing={2}>
                    <Icon as={ImageIconLucide} size={18} />
                    <Text fontSize="sm" fontWeight="bold">Image Preview</Text>
                  </HStack>
                </Tab>
                <Tab borderRadius="lg">
                  <HStack spacing={2}>
                    <Icon as={Video} size={18} />
                    <Text fontSize="sm" fontWeight="bold">Video Preview</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel p={0}>
                  <ImagePreview
                    imageUrl={generatedImageUrl}
                    isLoading={isGenerating}
                    style={selectedStyle}
                    logoPosition={logoPosition}
                    generationProgress={generationProgress}
                  />
                </TabPanel>
                <TabPanel p={0}>
                  <VideoPreview
                    title={formData.headline || 'LakeB2B Social Post'}
                    subtitle={formData.message || 'Empowering your brand with AI.'}
                    imageUrl={generatedImageUrl}
                    logoUrl="/logos/lakeb2b-logo-square.png"
                    isLoading={isGenerating}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </HStack>

        {/* Authentication Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </VStack>
    </Container>
  )
}

export default PostGenerator