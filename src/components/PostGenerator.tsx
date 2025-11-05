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
import { brandTheme } from '../theme/brand'
import ImagePreview from './ImagePreview'

const PostGenerator: React.FC = () => {
  const [formData, setFormData] = useState<PostFormData>({
    message: '',
    headline: '',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const toast = useToast()

  const handleInputChange = (field: keyof PostFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const generatePrompt = (data: PostFormData): string => {
    const { width, height } = brandTheme.sizes.square
    
    // Enhanced prompt based on example images
    const basePrompt = 'Create a high-quality isometric 3D business illustration featuring professional business people in suits'
    const style = 'with modern isometric perspective, floating data visualization screens, charts, and dashboards'
    const background = 'Background: Vibrant gradient using LakeB2B brand colors (purple #6D08BE to orange #FFB703 to magenta #DD1286)'
    const content = `Business theme: "${data.message}"`
    const headline = `Headline: "${data.headline}" prominently displayed at the top in bold white text`
    const elements = 'Include professional business people interacting with data, technology elements, clean shadows, floating elements'
    const logo = 'LakeB2B logo with "ENABLING GROWTH" text in bottom-left corner'
    
    return `${basePrompt} ${style}. ${background}. ${content}. ${headline}. ${elements}. ${logo}. Modern B2B aesthetic, ${width}x${height}px, high quality, professional design.`
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

    setIsGenerating(true)
    setError('')

    try {
      const prompt = generatePrompt(formData)
      
      // Call the API route to generate image
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      setGeneratedImageUrl(data.imageUrl)
      
      toast({
        title: 'Image Generated!',
        description: 'Your social post image has been created successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate image')
      toast({
        title: 'Generation Failed',
        description: 'Unable to generate image. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
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

              <Button
                variant="gradient"
                size="lg"
                width="full"
                onClick={handleGenerate}
                isLoading={isGenerating}
                loadingText="Generating..."
                leftIcon={<Sparkles size={20} />}
              >
                Generate Post
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
            />
          </Box>
        </HStack>
      </VStack>
    </Container>
  )
}

export default PostGenerator