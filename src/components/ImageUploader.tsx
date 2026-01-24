/**
 * ImageUploader Component
 *
 * Drag & drop image uploader using react-dropzone.
 * Allows users to upload custom backgrounds or logos.
 */

import React, { useCallback, useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Image,
  IconButton,
  Progress,
} from '@chakra-ui/react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, ImageIcon, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImageUploaderProps {
  onUpload: (file: File, dataUrl: string) => void
  onClear?: () => void
  accept?: Record<string, string[]>
  maxSize?: number
  label?: string
  helperText?: string
  previewUrl?: string
  compact?: boolean
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUpload,
  onClear,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = 'Upload Image',
  helperText = 'Drag & drop an image here, or click to select',
  previewUrl,
  compact = false,
}) => {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0]
        if (error.code === 'file-too-large') {
          toast.error(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`)
        } else if (error.code === 'file-invalid-type') {
          toast.error('Invalid file type. Please upload an image.')
        } else {
          toast.error(error.message || 'Upload failed')
        }
        return
      }

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        setIsUploading(true)
        setUploadProgress(0)

        // Read file as data URL
        const reader = new FileReader()

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(progress)
          }
        }

        reader.onload = () => {
          const dataUrl = reader.result as string
          setLocalPreview(dataUrl)
          setUploadProgress(100)
          setIsUploading(false)
          onUpload(file, dataUrl)
          toast.success('Image uploaded!')
        }

        reader.onerror = () => {
          setIsUploading(false)
          toast.error('Failed to read file')
        }

        reader.readAsDataURL(file)
      }
    },
    [maxSize, onUpload]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1,
    multiple: false,
  })

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalPreview(null)
    setUploadProgress(0)
    onClear?.()
  }

  const currentPreview = localPreview || previewUrl

  if (compact) {
    return (
      <HStack
        {...getRootProps()}
        p={3}
        border="2px dashed"
        borderColor={isDragActive ? 'purple.400' : isDragReject ? 'red.400' : 'gray.300'}
        borderRadius="md"
        cursor="pointer"
        transition="all 0.2s"
        bg={isDragActive ? 'purple.50' : 'transparent'}
        _hover={{ borderColor: 'purple.400', bg: 'purple.50' }}
      >
        <input {...getInputProps()} />
        {currentPreview ? (
          <>
            <Image
              src={currentPreview}
              alt="Preview"
              boxSize="40px"
              objectFit="cover"
              borderRadius="md"
            />
            <Text fontSize="sm" flex={1} noOfLines={1}>
              Image selected
            </Text>
            <IconButton
              aria-label="Clear image"
              icon={<X size={16} />}
              size="xs"
              variant="ghost"
              onClick={handleClear}
            />
          </>
        ) : (
          <>
            <Icon as={Upload} boxSize={5} color="gray.500" />
            <Text fontSize="sm" color="gray.600">
              {isDragActive ? 'Drop here' : label}
            </Text>
          </>
        )}
      </HStack>
    )
  }

  return (
    <Box>
      <Box
        {...getRootProps()}
        p={6}
        border="2px dashed"
        borderColor={
          isDragReject
            ? 'red.400'
            : isDragActive
            ? 'purple.500'
            : currentPreview
            ? 'green.300'
            : 'gray.300'
        }
        borderRadius="lg"
        cursor="pointer"
        transition="all 0.2s"
        bg={
          isDragReject
            ? 'red.50'
            : isDragActive
            ? 'purple.50'
            : currentPreview
            ? 'green.50'
            : 'gray.50'
        }
        _hover={{
          borderColor: currentPreview ? 'green.400' : 'purple.400',
          bg: currentPreview ? 'green.50' : 'purple.50',
        }}
        position="relative"
      >
        <input {...getInputProps()} />

        {currentPreview ? (
          <VStack spacing={3}>
            <Box position="relative">
              <Image
                src={currentPreview}
                alt="Preview"
                maxH="150px"
                maxW="100%"
                objectFit="contain"
                borderRadius="md"
              />
              <IconButton
                aria-label="Clear image"
                icon={<X size={16} />}
                size="sm"
                colorScheme="red"
                position="absolute"
                top={-2}
                right={-2}
                borderRadius="full"
                onClick={handleClear}
              />
            </Box>
            <HStack color="green.600" fontSize="sm">
              <Icon as={CheckCircle} />
              <Text>Image ready - click to replace</Text>
            </HStack>
          </VStack>
        ) : (
          <VStack spacing={3} color={isDragReject ? 'red.500' : 'gray.500'}>
            <Icon
              as={isDragReject ? X : isDragActive ? Upload : ImageIcon}
              boxSize={10}
              color={isDragActive ? 'purple.500' : 'gray.400'}
            />
            <VStack spacing={1}>
              <Text fontWeight="medium" color={isDragActive ? 'purple.600' : 'gray.700'}>
                {isDragReject
                  ? 'Invalid file type'
                  : isDragActive
                  ? 'Drop image here'
                  : label}
              </Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                {isDragReject
                  ? 'Please upload a valid image file'
                  : helperText}
              </Text>
              <Text fontSize="xs" color="gray.400">
                Max size: {Math.round(maxSize / 1024 / 1024)}MB
              </Text>
            </VStack>
          </VStack>
        )}

        {isUploading && (
          <Progress
            value={uploadProgress}
            size="xs"
            colorScheme="purple"
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            borderRadius="0 0 lg lg"
          />
        )}
      </Box>
    </Box>
  )
}

export default ImageUploader
