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

              {/* Trending Topics - Moved up for better UX */}
              <Box width="full">
                <TrendingTopics onTopicSelect={handleTopicSelect} compact={true} />
              </Box>

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