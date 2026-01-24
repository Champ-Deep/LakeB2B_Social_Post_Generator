/**
 * LinkedIn Connect Button Component
 *
 * Displays connection status and allows users to connect/disconnect their LinkedIn account.
 * Shows warning if token is expiring soon.
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Button,
  HStack,
  VStack,
  Text,
  Avatar,
  Icon,
  Spinner,
  Box,
  Badge,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react'
import toast from 'react-hot-toast'
import { Linkedin, Link2, Unlink, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface LinkedInConnection {
  id: string
  linkedin_id: string
  profile_name: string | null
  profile_image_url: string | null
  profile_url: string | null
  token_expires_at: string
  is_token_valid: boolean
  is_token_expiring_soon: boolean
}

interface ConnectionResponse {
  connected: boolean
  connection?: LinkedInConnection
  message?: string
}

interface LinkedInConnectButtonProps {
  onConnectionChange?: (connected: boolean) => void
  compact?: boolean
}

const LinkedInConnectButton: React.FC<LinkedInConnectButtonProps> = ({
  onConnectionChange,
  compact = false
}) => {
  const { isAuthenticated } = useAuth()
  const [connection, setConnection] = useState<LinkedInConnection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = React.useRef<HTMLButtonElement>(null)

  const fetchConnectionStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setConnection(null)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/linkedin/connection', {
        credentials: 'include'
      })

      if (response.ok) {
        const data: ConnectionResponse = await response.json()
        setConnection(data.connected ? data.connection || null : null)
        onConnectionChange?.(data.connected)
      }
    } catch (error) {
      console.error('Failed to fetch LinkedIn connection:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, onConnectionChange])

  useEffect(() => {
    fetchConnectionStatus()

    // Check URL for connection status
    const params = new URLSearchParams(window.location.search)
    if (params.get('linkedin_connected') === 'true') {
      toast.success('LinkedIn account connected successfully!')
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('linkedin_connected')
      window.history.replaceState({}, '', url.pathname + url.search)
      fetchConnectionStatus()
    }

    if (params.get('linkedin_error')) {
      const error = params.get('linkedin_error')
      toast.error(error || 'Failed to connect LinkedIn account')
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('linkedin_error')
      window.history.replaceState({}, '', url.pathname + url.search)
    }
  }, [fetchConnectionStatus])

  const handleConnect = () => {
    // Redirect to OAuth flow
    window.location.href = '/api/auth/linkedin/connect'
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      const response = await fetch('/api/linkedin/connection', {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setConnection(null)
        onConnectionChange?.(false)
        toast.success('LinkedIn account disconnected')
      } else {
        throw new Error('Failed to disconnect')
      }
    } catch (error) {
      toast.error('Failed to disconnect LinkedIn account')
    } finally {
      setIsDisconnecting(false)
      onClose()
    }
  }

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <HStack spacing={2} p={2}>
        <Spinner size="sm" />
        <Text fontSize="sm" color="gray.500">Checking LinkedIn...</Text>
      </HStack>
    )
  }

  // Connected state
  if (connection) {
    // Token expired
    if (!connection.is_token_valid) {
      return (
        <VStack align="stretch" spacing={2}>
          <HStack
            p={3}
            bg="orange.50"
            borderRadius="md"
            border="1px solid"
            borderColor="orange.200"
          >
            <Icon as={AlertTriangle} color="orange.500" />
            <VStack align="start" spacing={0} flex={1}>
              <Text fontSize="sm" fontWeight="medium" color="orange.800">
                Connection Needs Refresh
              </Text>
              <Text fontSize="xs" color="orange.600">
                Please reconnect your LinkedIn account to continue posting.
              </Text>
            </VStack>
          </HStack>
          <Button
            size="sm"
            colorScheme="linkedin"
            leftIcon={<Icon as={Link2} />}
            onClick={handleConnect}
          >
            Reconnect LinkedIn
          </Button>
        </VStack>
      )
    }

    // Token expiring soon warning
    if (connection.is_token_expiring_soon) {
      return (
        <VStack align="stretch" spacing={2}>
          <HStack
            p={3}
            bg="orange.50"
            borderRadius="md"
            border="1px solid"
            borderColor="orange.200"
          >
            <Avatar
              size="sm"
              src={connection.profile_image_url || undefined}
              name={connection.profile_name || 'LinkedIn User'}
            />
            <VStack align="start" spacing={0} flex={1}>
              <HStack>
                <Text fontSize="sm" fontWeight="medium">
                  {connection.profile_name || 'LinkedIn User'}
                </Text>
                <Badge colorScheme="orange" fontSize="xs">Expiring Soon</Badge>
              </HStack>
              <Text fontSize="xs" color="orange.600">
                Token expires in less than 7 days
              </Text>
            </VStack>
          </HStack>
          <HStack spacing={2}>
            <Button
              size="sm"
              colorScheme="orange"
              leftIcon={<Icon as={Link2} />}
              onClick={handleConnect}
              flex={1}
            >
              Refresh Connection
            </Button>
            <Button
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={onOpen}
            >
              <Icon as={Unlink} />
            </Button>
          </HStack>
        </VStack>
      )
    }

    // Valid connection - compact view
    if (compact) {
      return (
        <HStack
          p={2}
          bg="green.50"
          borderRadius="md"
          border="1px solid"
          borderColor="green.200"
        >
          <Icon as={CheckCircle} color="green.500" boxSize={4} />
          <Text fontSize="sm" color="green.700" fontWeight="medium">
            LinkedIn Connected
          </Text>
        </HStack>
      )
    }

    // Valid connection - full view
    return (
      <>
        <HStack
          p={3}
          bg="green.50"
          borderRadius="md"
          border="1px solid"
          borderColor="green.200"
          justify="space-between"
        >
          <HStack spacing={3}>
            <Avatar
              size="sm"
              src={connection.profile_image_url || undefined}
              name={connection.profile_name || 'LinkedIn User'}
            />
            <VStack align="start" spacing={0}>
              <HStack>
                <Text fontSize="sm" fontWeight="medium">
                  {connection.profile_name || 'LinkedIn User'}
                </Text>
                <Icon as={CheckCircle} color="green.500" boxSize={4} />
              </HStack>
              <Text fontSize="xs" color="gray.500">
                LinkedIn Connected
              </Text>
            </VStack>
          </HStack>
          <Button
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={onOpen}
            isLoading={isDisconnecting}
          >
            <Icon as={Unlink} />
          </Button>
        </HStack>

        {/* Disconnect confirmation dialog */}
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Disconnect LinkedIn
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to disconnect your LinkedIn account? You won&apos;t be able to post directly to LinkedIn until you reconnect.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleDisconnect}
                  ml={3}
                  isLoading={isDisconnecting}
                >
                  Disconnect
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </>
    )
  }

  // Not connected state
  return (
    <Box>
      <Button
        colorScheme="linkedin"
        leftIcon={<Icon as={Linkedin} />}
        onClick={handleConnect}
        size={compact ? 'sm' : 'md'}
        width={compact ? 'auto' : 'full'}
      >
        Connect LinkedIn
      </Button>
      {!compact && (
        <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
          Connect to post directly to LinkedIn
        </Text>
      )}
    </Box>
  )
}

export default LinkedInConnectButton
