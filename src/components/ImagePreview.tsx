import React, { useRef, useEffect, useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Heading,
  Spinner,
  Image,
  Center,
  useToast,
} from '@chakra-ui/react'
import { Download, ImageIcon, Plus } from 'lucide-react'
import { brandTheme } from '../theme/brand'
import { createDefaultLogoService } from '../services/logoService'
import { 
  isBrowser, 
  applyLogoToCanvas, 
  createLogoOverlay 
} from '../utils/client/canvasUtils'

interface ImagePreviewProps {
  imageUrl: string
  isLoading: boolean
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUrl,
  isLoading,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('')
  const [isAddingLogo, setIsAddingLogo] = useState(false)
  const toast = useToast()

  const sizeConfig = brandTheme.sizes.square

  useEffect(() => {
    // Since headlines are now integrated into the generation, just use the image as-is
    if (imageUrl) {
      setProcessedImageUrl(imageUrl)
    }
  }, [imageUrl])

  // No longer needed since headlines are integrated into generation
  // Keeping minimal structure for potential future canvas operations

  const handleDownload = () => {
    if (!isBrowser()) {
      console.error('Download requires browser environment')
      return
    }

    const link = document.createElement('a')
    link.href = processedImageUrl || imageUrl
    link.download = `lakeb2b-post-${Date.now()}.png`
    link.click()
  }

  const handleAddLogo = async () => {
    setIsAddingLogo(true)
    
    try {
      // Use Gemini to replace the placeholder logo with the actual LakeB2B logo
      const response = await fetch('/api/add-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl: processedImageUrl || imageUrl
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add logo')
      }

      setProcessedImageUrl(data.imageUrl)
      
      toast({
        title: 'Logo Replaced!',
        description: 'The generated logo has been seamlessly replaced with the actual LakeB2B logo.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Logo replacement error:', error)
      toast({
        title: 'Logo Replacement Failed',
        description: error instanceof Error ? error.message : 'Unable to replace logo. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsAddingLogo(false)
    }
  }

  return (
    <VStack spacing={4} bg="white" p={6} borderRadius="lg" boxShadow="md" height="full">
      <HStack justify="space-between" width="full">
        <Heading size="md">Preview</Heading>
        {(imageUrl || processedImageUrl) && (
          <HStack spacing={2}>
            <Button
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={handleAddLogo}
              isLoading={isAddingLogo}
              loadingText="Replacing..."
              colorScheme="purple"
              variant="outline"
            >
              Replace with Real Logo
            </Button>
            <Button
              size="sm"
              leftIcon={<Download size={16} />}
              onClick={handleDownload}
            >
              Download
            </Button>
          </HStack>
        )}
      </HStack>

      <Box
        position="relative"
        width="full"
        height="400px"
        borderRadius="md"
        overflow="hidden"
        bg="gray.100"
      >
        {isLoading ? (
          <Center height="full">
            <VStack spacing={4}>
              <Spinner size="xl" color="purple.500" thickness="4px" />
              <Text color="gray.600">Generating your image...</Text>
            </VStack>
          </Center>
        ) : imageUrl || processedImageUrl ? (
          <>
            <Image
              src={processedImageUrl || imageUrl}
              alt="Generated social post"
              objectFit="contain"
              width="full"
              height="full"
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
              width={sizeConfig.width}
              height={sizeConfig.height}
            />
          </>
        ) : (
          <Center height="full">
            <VStack spacing={3} color="gray.400">
              <ImageIcon size={48} />
              <Text>Your generated image will appear here</Text>
            </VStack>
          </Center>
        )}
      </Box>

      <Text fontSize="sm" color="gray.600" textAlign="center">
        Size: 1080 × 1080px (Square Format)
      </Text>
    </VStack>
  )
}

export default ImagePreview