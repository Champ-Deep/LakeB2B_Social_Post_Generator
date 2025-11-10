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
import { 
  Download, 
  ImageIcon
} from 'lucide-react'
import MiniGame from './MiniGame'
import { brandTheme } from '../theme/brand'
import { createDefaultLogoService } from '../services/logoService'
import { 
  isBrowser, 
  applyLogoToCanvas, 
  createLogoOverlay 
} from '../utils/client/canvasUtils'
import { serviceContainer } from '../lib/api/ServiceContainer'
import { globalErrorHandler } from '../lib/errors/GlobalErrorHandler'
import { useAuth } from '../contexts/AuthContext'

interface ImagePreviewProps {
  imageUrl: string
  isLoading: boolean
  style?: string
  logoPosition?: string
  generationProgress?: number
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUrl,
  isLoading,
  style = 'isometric',
  logoPosition = 'bottom-left',
  generationProgress = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('')
  const [isAddingLogo, setIsAddingLogo] = useState(false)
  const [showMiniGame, setShowMiniGame] = useState(false)
  const [logoSize, setLogoSize] = useState('medium')
  const toast = useToast()
  const { isAuthenticated, addPoints } = useAuth()

  const sizeConfig = brandTheme.sizes.square

  useEffect(() => {
    // Since headlines are now integrated into the generation, just use the image as-is
    if (imageUrl) {
      setProcessedImageUrl(imageUrl)
    }
  }, [imageUrl])

  // Show mini-game when loading starts
  useEffect(() => {
    if (isLoading) {
      setShowMiniGame(true)
    } else {
      // Delay hiding mini-game to allow completion celebration
      setTimeout(() => setShowMiniGame(false), 1000)
    }
  }, [isLoading])

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
      const imageService = serviceContainer.getImageGenerationService()
      
      // Use the service layer for API calls
      const response = await imageService.addLogo({
        imageUrl: processedImageUrl || imageUrl,
        style: style || 'isometric'
      })

      if (!response.success || !response.data) {
        throw response.error || new Error('Failed to add logo')
      }

      setProcessedImageUrl(response.data.imageUrl)
      
      toast({
        title: 'Logo Replaced!',
        description: 'The generated logo has been seamlessly replaced with the actual LakeB2B logo.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      const errorMessage = globalErrorHandler.getUserMessage(error)
      
      toast({
        title: 'Logo Replacement Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      
      // Log the error for debugging
      globalErrorHandler.handleError(error, {
        component: 'ImagePreview',
        action: 'addLogo',
        imageUrl: processedImageUrl || imageUrl
      })
    } finally {
      setIsAddingLogo(false)
    }
  }



  const handleMiniGameComplete = async (score: number) => {
    if (isAuthenticated && score > 0) {
      try {
        // Award points for mini-game completion (base 10 points + performance bonus)
        const basePoints = 10
        const performanceBonus = Math.min(score * 2, 50) // Up to 50 bonus points
        const totalPoints = basePoints + performanceBonus
        
        await addPoints(totalPoints)
        
        toast({
          title: `Game Complete! 🎉`,
          description: `You earned ${totalPoints} points! (Base: ${basePoints} + Bonus: ${performanceBonus})`,
          status: 'success',
          duration: 4000,
        })
      } catch (error) {
        console.error('Error awarding mini-game points:', error)
        toast({
          title: `Game Complete! 🎉`,
          description: `You scored ${score} points while waiting!`,
          status: 'success',
          duration: 3000,
        })
      }
    } else if (!isAuthenticated) {
      toast({
        title: `Game Complete! 🎉`,
        description: `You scored ${score} points! Login to earn rewards!`,
        status: 'success',
        duration: 3000,
      })
    } else {
      toast({
        title: `Game Complete! 🎉`,
        description: `You scored ${score} points while waiting!`,
        status: 'success',
        duration: 3000,
      })
    }
  }


  return (
    <VStack spacing={4} bg="white" p={6} borderRadius="lg" boxShadow="md" height="full">
      <HStack justify="space-between" width="full">
        <Heading size="md">Preview</Heading>
        {(imageUrl || processedImageUrl) && (
          <Button
            size="sm"
            leftIcon={<Download size={16} />}
            onClick={handleDownload}
            colorScheme="green"
          >
            Download
          </Button>
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
        {/* Mini Game Overlay */}
        <MiniGame
          isVisible={showMiniGame}
          onClose={() => setShowMiniGame(false)}
          onComplete={handleMiniGameComplete}
          generationProgress={generationProgress}
        />
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