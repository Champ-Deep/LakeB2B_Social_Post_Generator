import React, { useState } from 'react'
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Text,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react'
import { Monitor, Linkedin, Instagram, Twitter } from 'lucide-react'
import LinkedInMockup from './LinkedInMockup'
import InstagramMockup from './InstagramMockup'
import TwitterMockup from './TwitterMockup'

export type PlatformType = 'raw' | 'linkedin' | 'instagram' | 'twitter'

interface PlatformPreviewProps {
  imageUrl: string
  message?: string
  headline?: string
  children?: React.ReactNode  // For raw image display
  defaultPlatform?: PlatformType
  onPlatformChange?: (platform: PlatformType) => void
}

const PLATFORMS = [
  { id: 'raw' as PlatformType, label: 'Raw', icon: Monitor },
  { id: 'linkedin' as PlatformType, label: 'LinkedIn', icon: Linkedin },
  { id: 'instagram' as PlatformType, label: 'Instagram', icon: Instagram },
  { id: 'twitter' as PlatformType, label: 'X / Twitter', icon: Twitter },
]

const PlatformPreview: React.FC<PlatformPreviewProps> = ({
  imageUrl,
  message,
  headline,
  children,
  defaultPlatform = 'raw',
  onPlatformChange
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>(defaultPlatform)
  const tabBg = useColorModeValue('gray.50', 'gray.800')
  const selectedTabBg = useColorModeValue('white', 'gray.700')

  const handleTabChange = (index: number) => {
    const platform = PLATFORMS[index].id
    setSelectedPlatform(platform)
    onPlatformChange?.(platform)
  }

  const currentIndex = PLATFORMS.findIndex(p => p.id === selectedPlatform)

  return (
    <Box>
      <Tabs
        index={currentIndex}
        onChange={handleTabChange}
        variant="unstyled"
        size="sm"
      >
        <TabList
          bg={tabBg}
          p={1}
          borderRadius="lg"
          mb={4}
          display="flex"
          gap={1}
        >
          {PLATFORMS.map((platform) => (
            <Tab
              key={platform.id}
              flex={1}
              borderRadius="md"
              fontSize="xs"
              fontWeight="medium"
              color="gray.600"
              _selected={{
                bg: selectedTabBg,
                color: 'purple.600',
                boxShadow: 'sm',
              }}
              _hover={{
                color: 'purple.500',
              }}
              transition="all 0.2s"
            >
              <HStack spacing={1.5} justify="center">
                <Icon as={platform.icon} boxSize={3.5} />
                <Text display={{ base: 'none', sm: 'block' }}>{platform.label}</Text>
              </HStack>
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {/* Raw Preview */}
          <TabPanel p={0}>
            {children}
          </TabPanel>

          {/* LinkedIn Preview */}
          <TabPanel p={0}>
            <Box
              bg="gray.100"
              borderRadius="lg"
              p={4}
              minH="400px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <LinkedInMockup
                imageUrl={imageUrl}
                message={message}
                headline={headline}
              />
            </Box>
          </TabPanel>

          {/* Instagram Preview */}
          <TabPanel p={0}>
            <Box
              bgGradient="linear(to-br, #833ab4, #fd1d1d, #fcb045)"
              borderRadius="lg"
              p={4}
              minH="400px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <InstagramMockup
                imageUrl={imageUrl}
                message={message}
                headline={headline}
              />
            </Box>
          </TabPanel>

          {/* Twitter/X Preview */}
          <TabPanel p={0}>
            <Box
              bg="black"
              borderRadius="lg"
              p={4}
              minH="400px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <TwitterMockup
                imageUrl={imageUrl}
                message={message}
                headline={headline}
              />
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Platform Tips */}
      {selectedPlatform !== 'raw' && (
        <Box
          mt={3}
          p={3}
          bg="blue.50"
          borderRadius="md"
          borderWidth={1}
          borderColor="blue.100"
        >
          <Text fontSize="xs" color="blue.700">
            {selectedPlatform === 'linkedin' && (
              <>
                <Text as="span" fontWeight="bold">LinkedIn Tip:</Text> Square images (1:1) perform best. Keep text concise and professional.
              </>
            )}
            {selectedPlatform === 'instagram' && (
              <>
                <Text as="span" fontWeight="bold">Instagram Tip:</Text> Square format is ideal for feed posts. Consider using carousel for multi-slide content.
              </>
            )}
            {selectedPlatform === 'twitter' && (
              <>
                <Text as="span" fontWeight="bold">X/Twitter Tip:</Text> Images are cropped in timeline. Important content should be centered.
              </>
            )}
          </Text>
        </Box>
      )}
    </Box>
  )
}

export default PlatformPreview
