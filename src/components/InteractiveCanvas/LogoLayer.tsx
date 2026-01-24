import React, { useRef, useEffect } from 'react'
import { Image as KonvaImage, Transformer, Group } from 'react-konva'
import Konva from 'konva'
import { LogoElement } from './hooks/useCanvasState'

interface LogoLayerProps {
  element: LogoElement
  image: HTMLImageElement | null
  isSelected: boolean
  onSelect: () => void
  onTransformEnd: (attrs: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
  }) => void
  onDragEnd: (x: number, y: number) => void
}

const LogoLayer: React.FC<LogoLayerProps> = ({
  element,
  image,
  isSelected,
  onSelect,
  onTransformEnd,
  onDragEnd
}) => {
  const imageRef = useRef<Konva.Image>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    if (isSelected && transformerRef.current && imageRef.current) {
      transformerRef.current.nodes([imageRef.current])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  if (!image) return null

  const handleTransformEnd = () => {
    const node = imageRef.current
    if (!node) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Reset scale and apply to width/height
    node.scaleX(1)
    node.scaleY(1)

    onTransformEnd({
      x: node.x(),
      y: node.y(),
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
      rotation: node.rotation()
    })
  }

  return (
    <>
      <KonvaImage
        ref={imageRef}
        image={image}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation}
        opacity={element.opacity / 100}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onDragEnd(e.target.x(), e.target.y())
        }}
        onTransformEnd={handleTransformEnd}
        // Visual feedback
        shadowColor={isSelected ? 'purple' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={0.3}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox
            }
            return newBox
          }}
          // Style the transformer
          borderStroke="#6D08BE"
          borderStrokeWidth={2}
          anchorFill="#FFB703"
          anchorStroke="#6D08BE"
          anchorSize={10}
          rotateAnchorOffset={20}
        />
      )}
    </>
  )
}

export default LogoLayer
