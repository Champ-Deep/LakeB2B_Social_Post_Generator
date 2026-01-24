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
  useDisclosure,
  Icon,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
} from '@chakra-ui/react'
import toast from 'react-hot-toast'
import {
  Download,
  ImageIcon,
  Linkedin,
  Twitter,
  Edit3,
  Move,
} from 'lucide-react'
import LinkedInPostModal from './LinkedInPostModal'
import LinkedInConnectButton from './LinkedInConnectButton'
import TwitterPostModal from './TwitterPostModal'
import TwitterConnectButton from './TwitterConnectButton'
import ShareButtons from './ShareButtons'
import PostEditor from './PostEditor'
import MiniGame from './MiniGame'
import { PlatformPreview } from './PlatformPreview'
import { InteractiveCanvas } from './InteractiveCanvas'
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
import { trackFeatureUsage } from '../lib/analytics/posthog'

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
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false)
  const [isTwitterConnected, setIsTwitterConnected] = useState(false)
  const { isAuthenticated, addPoints } = useAuth()
  const { isOpen: isLinkedInModalOpen, onOpen: openLinkedInModal, onClose: closeLinkedInModal } = useDisclosure()
  const { isOpen: isTwitterModalOpen, onOpen: openTwitterModal, onClose: closeTwitterModal } = useDisclosure()
  const { isOpen: isPostEditorOpen, onOpen: openPostEditor, onClose: closePostEditor } = useDisclosure()
  const { isOpen: isCanvasOpen, onOpen: openCanvas, onClose: closeCanvas } = useDisclosure()

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
    trackFeatureUsage('download', { hasLogo: true })

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

      toast.success('Logo replaced with the actual LakeB2B logo!')
    } catch (error) {
      const errorMessage = globalErrorHandler.getUserMessage(error)

      toast.error(`Logo replacement failed: ${errorMessage}`)

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

        toast.success(`Game Complete! You earned ${totalPoints} points!`, { icon: '🎉' })
      } catch (error) {
        console.error('Error awarding mini-game points:', error)
        toast.success(`Game Complete! You scored ${score} points!`, { icon: '🎉' })
      }
    } else if (!isAuthenticated) {
      toast.success(`Game Complete! Score: ${score}. Login to earn rewards!`, { icon: '🎉' })
    } else {
      toast.success(`Game Complete! You scored ${score} points!`, { icon: '🎉' })
    }
  }


  return (
    <VStack spacing={4} bg="white" p={6} borderRadius="lg" boxShadow="md" height="full">
      <HStack justify="space-between" width="full">
        <Heading size="md">Preview</Heading>
        {(imageUrl || processedImageUrl) && (
          <HStack spacing={2}>
            <Tooltip label="Drag & resize logo interactively" placement="top">
              <Button
                size="sm"
                leftIcon={<Icon as={Move} boxSize={4} />}
                onClick={() => {
                  trackFeatureUsage('logo_editor')
                  openCanvas()
                }}
                colorScheme="orange"
              >
                Edit Logo
              </Button>
            </Tooltip>
            <Tooltip label="Format and customize your post" placement="top">
              <Button
                size="sm"
                leftIcon={<Icon as={Edit3} boxSize={4} />}
                onClick={() => {
                  trackFeatureUsage('post_editor')
                  openPostEditor()
                }}
                colorScheme="purple"
              >
                Format Post
              </Button>
            </Tooltip>
            {isAuthenticated && (
              <>
                <Tooltip
                  label={isLinkedInConnected ? "Post to LinkedIn" : "Share to LinkedIn (copy & download)"}
                  placement="top"
                >
                  <Button
                    size="sm"
                    leftIcon={<Icon as={Linkedin} boxSize={4} />}
                    onClick={openLinkedInModal}
                    colorScheme="linkedin"
                  >
                    {isLinkedInConnected ? 'Post to LinkedIn' : 'Share to LinkedIn'}
                  </Button>
                </Tooltip>
                <Tooltip
                  label={isTwitterConnected ? "Post to Twitter" : "Share to Twitter (copy & download)"}
                  placement="top"
                >
                  <Button
                    size="sm"
                    leftIcon={<Icon as={Twitter} boxSize={4} />}
                    onClick={openTwitterModal}
                    colorScheme="twitter"
                  >
                    {isTwitterConnected ? 'Post to Twitter' : 'Share to Twitter'}
                  </Button>
                </Tooltip>
              </>
            )}
            <Button
              size="sm"
              leftIcon={<Download size={16} />}
              onClick={handleDownload}
              colorScheme="green"
            >
              Download
            </Button>
            <ShareButtons
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title="Check out this B2B marketing visual I created with LakeB2B!"
              description="AI-powered social media content for B2B marketing"
              imageUrl={processedImageUrl || imageUrl}
              variant="compact"
            />
          </HStack>
        )}
      </HStack>

      <PlatformPreview
        imageUrl={processedImageUrl || imageUrl}
        defaultPlatform="raw"
      >
        {/* Raw Preview Tab Content */}
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
      </PlatformPreview>

      <Text fontSize="sm" color="gray.600" textAlign="center">
        Size: 1080 × 1080px (Square Format)
      </Text>

      {/* Social Connection Status */}
      {isAuthenticated && (
        <VStack width="full" spacing={2}>
          <LinkedInConnectButton
            compact={true}
            onConnectionChange={setIsLinkedInConnected}
          />
          <TwitterConnectButton
            variant="compact"
            onConnectionChange={setIsTwitterConnected}
          />
        </VStack>
      )}

      {/* LinkedIn Post Modal */}
      <LinkedInPostModal
        isOpen={isLinkedInModalOpen}
        onClose={closeLinkedInModal}
        imageUrl={processedImageUrl || imageUrl}
        isConnected={isLinkedInConnected}
        onPostSuccess={(postUrl) => {
          toast.success('Posted to LinkedIn! Your image is now live.')
        }}
      />

      {/* Twitter Post Modal */}
      <TwitterPostModal
        isOpen={isTwitterModalOpen}
        onClose={closeTwitterModal}
        imageUrl={processedImageUrl || imageUrl}
        imageData={processedImageUrl || imageUrl}
        initialText=""
        isConnected={isTwitterConnected}
      />

      {/* Post Editor Modal */}
      <Modal isOpen={isPostEditorOpen} onClose={closePostEditor} size="2xl">
        <ModalOverlay />
        <ModalContent maxW="700px" my={4}>
          <ModalCloseButton zIndex={10} />
          <PostEditor
            imageUrl={processedImageUrl || imageUrl}
            style={style}
            onClose={closePostEditor}
            isLinkedInConnected={isLinkedInConnected}
          />
        </ModalContent>
      </Modal>

      {/* Interactive Canvas Modal */}
      <Modal isOpen={isCanvasOpen} onClose={closeCanvas} size="xl">
        <ModalOverlay />
        <ModalContent maxW="600px" my={4} p={4}>
          <ModalCloseButton zIndex={10} />
          <Heading size="md" mb={4}>Edit Logo Position</Heading>
          <InteractiveCanvas
            backgroundImageUrl={processedImageUrl || imageUrl}
            logoUrl={style === 'newyork-cartoon' ? '/logos/LakeB2B Logo BW.png' : '/logos/LakeB2B Logo Square.png'}
            onExport={(dataUrl) => {
              setProcessedImageUrl(dataUrl)
              closeCanvas()
              toast.success('Changes applied! Your edited image is ready.')
            }}
          />
        </ModalContent>
      </Modal>
    </VStack>
  )
}

export default ImagePreview