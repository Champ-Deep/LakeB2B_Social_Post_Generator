import React, { useEffect, useState } from 'react'
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
  useToast,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { ImageIcon, Download, Sparkles, User, LogIn } from 'lucide-react'
import { PostFormData } from '../types/post'
import { StyleId } from '../types/styles'
import { brandTheme } from '../theme/brand'
import ImagePreview from './ImagePreview'
import StyleSelector from './StyleSelector'
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
import { useGubey } from './Gubey'

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
  const toast = useToast()
  const { isConnected, isChecking, retry } = useConnectionHealth()
  const { isAuthenticated, addPoints, incrementGeneration } = useAuth()
  const { dispatch: gubeyDispatch } = useGubey()

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
      toast({
        title: 'Login Required',
        description: 'Please log in to generate images',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      setShowAuthModal(true)
      return
    }

    if (!formData.message || !formData.headline) {
      toast({
        title: 'Required Fields Missing',
        description: 'Please enter both message and headline for your social post',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Check connection before attempting
    if (!isConnected) {
      const reconnected = await retry()
      if (!reconnected) {
        toast({
          title: 'Connection Required',
          description: 'Please check your internet connection and ensure the server is running.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
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
          toast({
            title: 'Authentication Required',
            description: 'Your session has expired. Please log in again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
          setShowAuthModal(true)
          return
        }
        throw error || new Error('Failed to generate image')
      }

      clearInterval(progressInterval)
      setGenerationProgress(100)
      setGeneratedImageUrl(response.data.imageUrl)

      // Notify Gubey mascot of success (triggers celebration animation)
      gubeyDispatch({ type: 'GENERATION_SUCCESS' })

      // Award points and track generation if user is authenticated
      if (isAuthenticated) {
        await addPoints(10) // 10 points per generation
        await incrementGeneration()
      }

      // Check for fallback - show warning if AI was unavailable
      const responseData = response.data
      if (responseData?.fallback) {
        setTimeout(() => {
          toast({
            title: 'AI Image Generation Unavailable',
            description: responseData.fallbackReason || 'Using preview placeholder. The AI image generation service is temporarily unavailable. Please try again later.',
            status: 'warning',
            duration: 8000,
            isClosable: true,
          })
        }, 500)
      } else {
        // Single consolidated success toast - wait for progress to complete
        setTimeout(() => {
          const successMessage = isAuthenticated
            ? 'Image generated successfully! +10 points earned!'
            : 'Image generated successfully!'

          const memeInfo = selectedStyle === 'meme' && actualMemeFormat !== 'auto'
            ? ` Used ${actualMemeFormat.replace('-', ' ')} meme format.`
            : ''

          const modelInfo = responseData?.modelUsed
            ? ` (${responseData.modelUsed.split('-')[0]})`
            : ''

          toast({
            title: 'Success!',
            description: successMessage + memeInfo + modelInfo,
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        }, 500) // Small delay to let progress complete
      }
    } catch (error) {
      clearInterval(progressInterval)

      // Notify Gubey mascot of error (triggers shake animation)
      gubeyDispatch({ type: 'GENERATION_ERROR' })

      const errorMessage = globalErrorHandler.getUserMessage(error)
      setError(errorMessage)
      
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      
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
    
    toast({
      title: 'Topic Applied! 📝',
      description: `Used trending topic: ${topic.title}`,
      status: 'info',
      duration: 3000,
    })
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

              <StyleSelector
                selectedStyle={selectedStyle}
                onStyleChange={setSelectedStyle}
                disabled={isGenerating}
              />

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
            <ImagePreview
              imageUrl={generatedImageUrl}
              isLoading={isGenerating}
              style={selectedStyle}
              logoPosition={logoPosition}
              generationProgress={generationProgress}
            />
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