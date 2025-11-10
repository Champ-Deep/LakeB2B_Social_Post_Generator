import React, { useState } from 'react'
import {
  Box,
  Container,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Textarea,
  Input,
  Select,
  Button,
  Text,
  Heading,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
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
  const toast = useToast()
  const { isConnected, isChecking, retry } = useConnectionHealth()
  const { isAuthenticated, addPoints, incrementGeneration } = useAuth()

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

    // Simulate progress for mini-game
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev + Math.random() * 15
        return newProgress >= 95 ? 95 : newProgress
      })
    }, 800)

    try {
      const prompt = generatePrompt(formData)
      const imageService = serviceContainer.getImageGenerationService()
      
      // Use the service layer for API calls
      const response = await imageService.generateImage({
        prompt,
        style: selectedStyle,
        position: logoPosition,
        logoSize,
        logoOpacity,
        logoRotation
      })

      if (!response.success || !response.data) {
        throw response.error || new Error('Failed to generate image')
      }

      clearInterval(progressInterval)
      setGenerationProgress(100)
      setGeneratedImageUrl(response.data.imageUrl)
      
      // Award points and track generation if user is authenticated
      if (isAuthenticated) {
        await addPoints(10) // 10 points per generation
        await incrementGeneration()
      }
      
      toast({
        title: 'Image Generated!',
        description: isAuthenticated 
          ? 'Your social post image has been created successfully. +10 points earned!'
          : 'Your social post image has been created successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      clearInterval(progressInterval)
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
    // Only regenerate if we have a generated image
    if (generatedImageUrl && formData.message && formData.headline) {
      // Small delay to ensure state update completes
      setTimeout(() => {
        handleGenerate()
      }, 100)
    }
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

              <HStack spacing={4} width="full">
                <FormControl flex={1}>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    Logo Size: {logoSize}%
                  </FormLabel>
                  <Slider
                    value={logoSize}
                    onChange={(value) => {
                      setLogoSize(value)
                      if (generatedImageUrl && formData.message && formData.headline) {
                        setTimeout(() => handleGenerate(), 100)
                      }
                    }}
                    min={10}
                    max={80}
                    step={5}
                    isDisabled={isGenerating}
                  >
                    <SliderTrack>
                      <SliderFilledTrack bg="purple.400" />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </FormControl>

                <FormControl flex={1}>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    Opacity: {logoOpacity}%
                  </FormLabel>
                  <Slider
                    value={logoOpacity}
                    onChange={(value) => {
                      setLogoOpacity(value)
                      if (generatedImageUrl && formData.message && formData.headline) {
                        setTimeout(() => handleGenerate(), 100)
                      }
                    }}
                    min={10}
                    max={100}
                    step={5}
                    isDisabled={isGenerating}
                  >
                    <SliderTrack>
                      <SliderFilledTrack bg="purple.400" />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">
                  Rotation: {logoRotation}°
                </FormLabel>
                <Slider
                  value={logoRotation}
                  onChange={(value) => {
                    setLogoRotation(value)
                    if (generatedImageUrl && formData.message && formData.headline) {
                      setTimeout(() => handleGenerate(), 100)
                    }
                  }}
                  min={-45}
                  max={45}
                  step={5}
                  isDisabled={isGenerating}
                >
                  <SliderTrack>
                    <SliderFilledTrack bg="purple.400" />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
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

        {/* Trending Topics Section */}
        <Box>
          <TrendingTopics onTopicSelect={handleTopicSelect} compact={true} />
        </Box>
        
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