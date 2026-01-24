import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Stage, Layer, Image as KonvaImage } from 'react-konva'
import Konva from 'konva'
import {
  Box,
  VStack,
  Text,
  Center,
  Spinner,
  useToast,
} from '@chakra-ui/react'
import { useCanvasState, LogoElement, CanvasElement } from './hooks/useCanvasState'
import LogoLayer from './LogoLayer'
import CanvasToolbar from './CanvasToolbar'

interface InteractiveCanvasProps {
  backgroundImageUrl: string
  logoUrl?: string
  initialLogoPosition?: { x: number; y: number }
  initialLogoSize?: number
  initialLogoOpacity?: number
  initialLogoRotation?: number
  canvasWidth?: number
  canvasHeight?: number
  onExport?: (dataUrl: string) => void
  onLogoChange?: (logo: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
    opacity: number
  }) => void
}

const DEFAULT_LOGO_URL = '/logos/LakeB2B Logo Square.png'
const CANVAS_SIZE = 1080
const DISPLAY_SIZE = 500

const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  backgroundImageUrl,
  logoUrl = DEFAULT_LOGO_URL,
  initialLogoPosition = { x: 20, y: CANVAS_SIZE - 200 },
  initialLogoSize = 35,
  initialLogoOpacity = 85,
  initialLogoRotation = 0,
  canvasWidth = CANVAS_SIZE,
  canvasHeight = CANVAS_SIZE,
  onExport,
  onLogoChange
}) => {
  const stageRef = useRef<Konva.Stage>(null)
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()

  // Calculate initial logo dimensions
  const logoWidth = (canvasWidth * initialLogoSize) / 100
  const logoHeight = logoWidth // Assuming square logo

  // Initialize canvas state
  const initialElements: CanvasElement[] = [
    {
      id: 'logo-1',
      type: 'logo',
      x: initialLogoPosition.x,
      y: initialLogoPosition.y,
      width: logoWidth,
      height: logoHeight,
      rotation: initialLogoRotation,
      opacity: initialLogoOpacity,
      zIndex: 1,
      logoVariant: 'color'
    } as LogoElement
  ]

  const { state, actions, getSelectedElement, canUndo, canRedo } = useCanvasState(initialElements)

  // Load images
  useEffect(() => {
    setIsLoading(true)
    let loadedCount = 0
    const totalImages = 2

    const checkLoaded = () => {
      loadedCount++
      if (loadedCount >= totalImages) {
        setIsLoading(false)
      }
    }

    // Load background image
    if (backgroundImageUrl) {
      const bgImg = new window.Image()
      bgImg.crossOrigin = 'anonymous'
      bgImg.onload = () => {
        setBackgroundImage(bgImg)
        checkLoaded()
      }
      bgImg.onerror = () => {
        console.error('Failed to load background image')
        checkLoaded()
      }
      bgImg.src = backgroundImageUrl
    } else {
      checkLoaded()
    }

    // Load logo image
    const lgImg = new window.Image()
    lgImg.crossOrigin = 'anonymous'
    lgImg.onload = () => {
      setLogoImage(lgImg)
      checkLoaded()
    }
    lgImg.onerror = () => {
      console.error('Failed to load logo image')
      checkLoaded()
    }
    lgImg.src = logoUrl

    return () => {
      setBackgroundImage(null)
      setLogoImage(null)
    }
  }, [backgroundImageUrl, logoUrl])

  // Notify parent of logo changes
  useEffect(() => {
    const logoElement = state.elements.find(el => el.type === 'logo') as LogoElement | undefined
    if (logoElement && onLogoChange) {
      onLogoChange({
        x: logoElement.x,
        y: logoElement.y,
        width: logoElement.width,
        height: logoElement.height,
        rotation: logoElement.rotation,
        opacity: logoElement.opacity
      })
    }
  }, [state.elements, onLogoChange])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          actions.redo()
        } else {
          actions.undo()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        actions.redo()
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedId && state.selectedId !== 'logo-1') {
          // Don't delete the main logo
          actions.deleteElement(state.selectedId)
        }
      }
      if (e.key === 'Escape') {
        actions.select(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [actions, state.selectedId])

  // Handle export
  const handleExport = useCallback(() => {
    if (!stageRef.current) return

    // Deselect to hide transformer
    actions.select(null)

    // Small delay to ensure transformer is hidden
    setTimeout(() => {
      const dataUrl = stageRef.current?.toDataURL({
        pixelRatio: canvasWidth / DISPLAY_SIZE,
        mimeType: 'image/png',
        quality: 1
      })

      if (dataUrl) {
        if (onExport) {
          onExport(dataUrl)
        } else {
          // Download directly
          const link = document.createElement('a')
          link.download = `lakeb2b-edited-${Date.now()}.png`
          link.href = dataUrl
          link.click()
        }

        toast({
          title: 'Image exported!',
          status: 'success',
          duration: 2000
        })
      }
    }, 50)
  }, [actions, canvasWidth, onExport, toast])

  // Handle stage click (deselect)
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      actions.select(null)
      actions.saveHistory()
    }
  }

  const selectedElement = getSelectedElement()
  const scale = DISPLAY_SIZE / canvasWidth

  if (isLoading) {
    return (
      <Center h="400px" bg="gray.100" borderRadius="lg">
        <VStack spacing={3}>
          <Spinner size="lg" color="purple.500" />
          <Text color="gray.500">Loading canvas...</Text>
        </VStack>
      </Center>
    )
  }

  return (
    <VStack spacing={3} align="stretch">
      <CanvasToolbar
        zoom={state.zoom}
        onZoomChange={actions.setZoom}
        onUndo={actions.undo}
        onRedo={actions.redo}
        onReset={() => actions.reset(initialElements)}
        onExport={handleExport}
        canUndo={canUndo}
        canRedo={canRedo}
        selectedElement={selectedElement ? {
          opacity: selectedElement.opacity,
          rotation: selectedElement.rotation
        } : null}
        onOpacityChange={selectedElement ? (opacity) => {
          actions.updateOpacity(selectedElement.id, opacity)
        } : undefined}
        onRotationChange={selectedElement ? (rotation) => {
          actions.rotate(selectedElement.id, rotation)
        } : undefined}
      />

      <Box
        position="relative"
        w={DISPLAY_SIZE}
        h={DISPLAY_SIZE}
        mx="auto"
        borderRadius="lg"
        overflow="hidden"
        boxShadow="lg"
        bg="gray.200"
        cursor="crosshair"
      >
        <Stage
          ref={stageRef}
          width={DISPLAY_SIZE}
          height={DISPLAY_SIZE}
          scaleX={scale * state.zoom}
          scaleY={scale * state.zoom}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            {/* Background Image */}
            {backgroundImage && (
              <KonvaImage
                image={backgroundImage}
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
              />
            )}

            {/* Logo Elements */}
            {state.elements
              .filter((el): el is LogoElement => el.type === 'logo')
              .map(logoEl => (
                <LogoLayer
                  key={logoEl.id}
                  element={logoEl}
                  image={logoImage}
                  isSelected={state.selectedId === logoEl.id}
                  onSelect={() => {
                    actions.select(logoEl.id)
                  }}
                  onDragEnd={(x, y) => {
                    actions.move(logoEl.id, x, y)
                    actions.saveHistory()
                  }}
                  onTransformEnd={(attrs) => {
                    actions.move(logoEl.id, attrs.x, attrs.y)
                    actions.resize(logoEl.id, attrs.width, attrs.height)
                    actions.rotate(logoEl.id, attrs.rotation)
                    actions.saveHistory()
                  }}
                />
              ))}
          </Layer>
        </Stage>

        {/* Instructions overlay */}
        {!state.selectedId && (
          <Box
            position="absolute"
            bottom={2}
            left={2}
            bg="blackAlpha.600"
            color="white"
            px={2}
            py={1}
            borderRadius="md"
            fontSize="xs"
          >
            Click logo to select • Drag to move • Corners to resize
          </Box>
        )}
      </Box>

      <Text fontSize="xs" color="gray.500" textAlign="center">
        Tip: Use Ctrl+Z to undo, Ctrl+Y to redo
      </Text>
    </VStack>
  )
}

export default InteractiveCanvas
