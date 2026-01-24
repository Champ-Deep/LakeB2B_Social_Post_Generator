/**
 * Twitter Connect Button
 *
 * Allows users to connect their Twitter/X account for posting.
 * Shows connection status and provides disconnect functionality.
 */

import React, { useState, useEffect } from 'react'
import {
  Button,
  HStack,
  VStack,
  Text,
  Avatar,
  Box,
  Spinner,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Badge,
} from '@chakra-ui/react'
import toast from 'react-hot-toast'
import { ExternalLink, LogOut, Twitter } from 'lucide-react'

interface TwitterConnectionStatus {
  connected: boolean
  username?: string
  profileImageUrl?: string
  expiresAt?: string
}

interface TwitterConnectButtonProps {
  variant?: 'full' | 'compact'
  onConnectionChange?: (connected: boolean) => void
}

// Twitter/X icon component
const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const TwitterConnectButton: React.FC<TwitterConnectButtonProps> = ({
  variant = 'full',
  onConnectionChange,
}) => {
  const [status, setStatus] = useState<TwitterConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = React.useRef<HTMLButtonElement>(null)

  // Fetch connection status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/twitter/connection')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
        onConnectionChange?.(data.connected)
      } else if (response.status === 503) {
        // Twitter not configured
        setStatus(null)
      }
    } catch (error) {
      console.error('Failed to fetch Twitter status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Check URL params for connection result
    const params = new URLSearchParams(window.location.search)
    const twitterConnected = params.get('twitter_connected')
    const twitterUsername = params.get('twitter_username')
    const twitterError = params.get('twitter_error')

    if (twitterConnected === 'true') {
      toast.success(`Connected to Twitter as @${twitterUsername}`)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
      fetchStatus()
    } else if (twitterError) {
      toast.error(`Twitter connection failed: ${twitterError}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleConnect = () => {
    // Redirect to Twitter OAuth
    window.location.href = '/api/twitter/connect'
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const response = await fetch('/api/twitter/connection', {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Twitter account disconnected')
        setStatus({ connected: false })
        onConnectionChange?.(false)
      } else {
        toast.error('Failed to disconnect Twitter')
      }
    } catch (error) {
      toast.error('Failed to disconnect Twitter')
    } finally {
      setDisconnecting(false)
      onClose()
    }
  }

  if (loading) {
    return (
      <Button isDisabled variant="outline" size="md">
        <Spinner size="sm" mr={2} />
        Checking Twitter...
      </Button>
    )
  }

  // Twitter not configured
  if (status === null) {
    return null
  }

  // Connected state
  if (status.connected) {
    if (variant === 'compact') {
      return (
        <HStack spacing={2}>
          <Badge colorScheme="blue" display="flex" alignItems="center" gap={1}>
            <TwitterIcon />
            @{status.username}
          </Badge>
          <Button
            size="xs"
            variant="ghost"
            colorScheme="red"
            onClick={onOpen}
            leftIcon={<LogOut size={12} />}
          >
            Disconnect
          </Button>

          <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={onClose}
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader>Disconnect Twitter</AlertDialogHeader>
                <AlertDialogBody>
                  Are you sure you want to disconnect @{status.username}?
                  You won&apos;t be able to post to Twitter until you reconnect.
                </AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={handleDisconnect}
                    isLoading={disconnecting}
                    ml={3}
                  >
                    Disconnect
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
        </HStack>
      )
    }

    return (
      <Box
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        bg="gray.50"
        _dark={{ bg: 'gray.800' }}
      >
        <VStack align="start" spacing={3}>
          <HStack justify="space-between" w="full">
            <HStack spacing={3}>
              <Avatar
                size="sm"
                src={status.profileImageUrl}
                name={status.username}
              />
              <VStack align="start" spacing={0}>
                <HStack>
                  <TwitterIcon />
                  <Text fontWeight="bold">@{status.username}</Text>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  Connected to Twitter/X
                </Text>
              </VStack>
            </HStack>
            <Badge colorScheme="green">Connected</Badge>
          </HStack>

          <HStack spacing={2} w="full">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<ExternalLink size={14} />}
              as="a"
              href={`https://twitter.com/${status.username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Profile
            </Button>
            <Button
              size="sm"
              variant="ghost"
              colorScheme="red"
              leftIcon={<LogOut size={14} />}
              onClick={onOpen}
            >
              Disconnect
            </Button>
          </HStack>
        </VStack>

        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader>Disconnect Twitter</AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to disconnect @{status.username}?
                You won&apos;t be able to post to Twitter until you reconnect.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleDisconnect}
                  isLoading={disconnecting}
                  ml={3}
                >
                  Disconnect
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    )
  }

  // Not connected state
  return (
    <Button
      onClick={handleConnect}
      colorScheme="gray"
      variant="outline"
      leftIcon={<TwitterIcon />}
      _hover={{ bg: 'black', color: 'white' }}
    >
      Connect Twitter/X
    </Button>
  )
}

export default TwitterConnectButton
