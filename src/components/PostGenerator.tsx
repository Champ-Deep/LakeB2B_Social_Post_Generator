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
import { ImageIcon, Download, Sparkles } from 'lucide-react'
import { PostFormData } from '../types/post'
import { StyleId } from '../types/styles'
import { brandTheme } from '../theme/brand'
import ImagePreview from './ImagePreview'
import StyleSelector from './StyleSelector'
import { serviceContainer } from '../lib/api/ServiceContainer'
import { globalErrorHandler } from '../lib/errors/GlobalErrorHandler'
import { useConnectionHealth } from '../hooks/useConnectionHealth'

const PostGenerator: React.FC = () => {
  const [formData, setFormData] = useState<PostFormData>({
    message: '',
    headline: '',
  })
  const [selectedStyle, setSelectedStyle] = useState<StyleId>('isometric')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const toast = useToast()
  const { isConnected, isChecking, retry } = useConnectionHealth()

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

    try {
      const prompt = generatePrompt(formData)
      const imageService = serviceContainer.getImageGenerationService()
      
      // Use the service layer for API calls
      const response = await imageService.generateImage({
        prompt,
        style: selectedStyle
      })

      if (!response.success || !response.data) {
        throw response.error || new Error('Failed to generate image')
      }

      setGeneratedImageUrl(response.data.imageUrl)
      
      toast({
        title: 'Image Generated!',
        description: 'Your social post image has been created successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
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

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading
            size="2xl"
            bgGradient={brandTheme.colors.gradients.logo}
            bgClip="text"
          >
            LakeB2B Social Post Generator
          </Heading>
          <Text color="gray.600" mt={2}>
            Create brand-consistent social media images with AI
          </Text>
        </Box>

        <HStack spacing={8} align="start" flexDirection={{ base: 'column', lg: 'row' }}>
          {/* Form Panel */}
          <Box flex={1} bg="white" p={6} borderRadius="lg" boxShadow="md">
            <VStack spacing={5}>
              <FormControl isRequired>
                <FormLabel>Post Message</FormLabel>
                <Textarea
                  placeholder="Enter your post message..."
                  value={formData.message}
                  onChange={handleInputChange('message')}
                  rows={4}
                  resize="none"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Headline</FormLabel>
                <Input
                  placeholder="Enter your headline text..."
                  value={formData.headline}
                  onChange={handleInputChange('headline')}
                />
              </FormControl>

              <StyleSelector
                selectedStyle={selectedStyle}
                onStyleChange={setSelectedStyle}
                disabled={isGenerating}
              />

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
            />
          </Box>
        </HStack>
      </VStack>
    </Container>
  )
}

export default PostGenerator