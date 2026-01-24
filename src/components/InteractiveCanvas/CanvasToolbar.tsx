import React from 'react'
import {
  HStack,
  Button,
  IconButton,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tooltip,
  Divider,
  Box,
} from '@chakra-ui/react'
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Move,
  Maximize2,
} from 'lucide-react'

interface CanvasToolbarProps {
  zoom: number
  onZoomChange: (zoom: number) => void
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  onExport: () => void
  canUndo: boolean
  canRedo: boolean
  selectedElement: {
    opacity?: number
    rotation?: number
  } | null
  onOpacityChange?: (opacity: number) => void
  onRotationChange?: (rotation: number) => void
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  zoom,
  onZoomChange,
  onUndo,
  onRedo,
  onReset,
  onExport,
  canUndo,
  canRedo,
  selectedElement,
  onOpacityChange,
  onRotationChange
}) => {
  return (
    <HStack
      spacing={2}
      p={2}
      bg="gray.50"
      borderRadius="lg"
      borderWidth={1}
      borderColor="gray.200"
      flexWrap="wrap"
      justify="space-between"
    >
      {/* History Controls */}
      <HStack spacing={1}>
        <Tooltip label="Undo (Ctrl+Z)" placement="top">
          <IconButton
            aria-label="Undo"
            icon={<Undo2 size={16} />}
            size="sm"
            variant="ghost"
            onClick={onUndo}
            isDisabled={!canUndo}
          />
        </Tooltip>
        <Tooltip label="Redo (Ctrl+Y)" placement="top">
          <IconButton
            aria-label="Redo"
            icon={<Redo2 size={16} />}
            size="sm"
            variant="ghost"
            onClick={onRedo}
            isDisabled={!canRedo}
          />
        </Tooltip>
        <Tooltip label="Reset to original" placement="top">
          <IconButton
            aria-label="Reset"
            icon={<RotateCcw size={16} />}
            size="sm"
            variant="ghost"
            onClick={onReset}
          />
        </Tooltip>
      </HStack>

      <Divider orientation="vertical" h="24px" />

      {/* Zoom Controls */}
      <HStack spacing={2}>
        <Tooltip label="Zoom out" placement="top">
          <IconButton
            aria-label="Zoom out"
            icon={<ZoomOut size={16} />}
            size="sm"
            variant="ghost"
            onClick={() => onZoomChange(zoom - 0.1)}
            isDisabled={zoom <= 0.25}
          />
        </Tooltip>
        <Text fontSize="xs" fontWeight="medium" minW="40px" textAlign="center">
          {Math.round(zoom * 100)}%
        </Text>
        <Tooltip label="Zoom in" placement="top">
          <IconButton
            aria-label="Zoom in"
            icon={<ZoomIn size={16} />}
            size="sm"
            variant="ghost"
            onClick={() => onZoomChange(zoom + 0.1)}
            isDisabled={zoom >= 2}
          />
        </Tooltip>
        <Tooltip label="Fit to view" placement="top">
          <IconButton
            aria-label="Fit to view"
            icon={<Maximize2 size={16} />}
            size="sm"
            variant="ghost"
            onClick={() => onZoomChange(1)}
          />
        </Tooltip>
      </HStack>

      <Divider orientation="vertical" h="24px" />

      {/* Selected Element Controls */}
      {selectedElement && (
        <HStack spacing={3}>
          {onOpacityChange && (
            <HStack spacing={2}>
              <Text fontSize="xs" color="gray.600">Opacity:</Text>
              <Box w="80px">
                <Slider
                  value={selectedElement.opacity ?? 100}
                  min={10}
                  max={100}
                  step={5}
                  onChange={onOpacityChange}
                  size="sm"
                >
                  <SliderTrack>
                    <SliderFilledTrack bg="purple.500" />
                  </SliderTrack>
                  <SliderThumb boxSize={3} />
                </Slider>
              </Box>
              <Text fontSize="xs" color="gray.500" minW="30px">
                {selectedElement.opacity ?? 100}%
              </Text>
            </HStack>
          )}

          {onRotationChange && (
            <HStack spacing={2}>
              <Text fontSize="xs" color="gray.600">Rotate:</Text>
              <Box w="80px">
                <Slider
                  value={selectedElement.rotation ?? 0}
                  min={-180}
                  max={180}
                  step={5}
                  onChange={onRotationChange}
                  size="sm"
                >
                  <SliderTrack>
                    <SliderFilledTrack bg="purple.500" />
                  </SliderTrack>
                  <SliderThumb boxSize={3} />
                </Slider>
              </Box>
              <Text fontSize="xs" color="gray.500" minW="30px">
                {selectedElement.rotation ?? 0}°
              </Text>
            </HStack>
          )}
        </HStack>
      )}

      <Divider orientation="vertical" h="24px" />

      {/* Export */}
      <Button
        size="sm"
        colorScheme="green"
        leftIcon={<Download size={14} />}
        onClick={onExport}
      >
        Export
      </Button>
    </HStack>
  )
}

export default CanvasToolbar
