/**
 * ConnectionStatus - Displays real-time connection health status
 */

import React from 'react'
import {
  Box,
  HStack,
  Text,
  Badge,
  Tooltip,
  Icon,
  Button,
} from '@chakra-ui/react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useConnectionHealth } from '../hooks/useConnectionHealth'

export const ConnectionStatus: React.FC = () => {
  const { isConnected, isChecking, lastCheckTime, retry } = useConnectionHealth({
    showToasts: false // We'll handle display here
  })

  const getStatusColor = () => {
    if (isChecking) return 'blue'
    if (isConnected) return 'green'
    return 'red'
  }

  const getStatusText = () => {
    if (isChecking) return 'Checking...'
    if (isConnected) return 'Connected'
    return 'Disconnected'
  }

  const getLastCheckText = () => {
    if (!lastCheckTime) return 'Never checked'
    
    const seconds = Math.floor((Date.now() - lastCheckTime.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  return (
    <Box
      position="fixed"
      bottom={4}
      right={4}
      bg="white"
      p={3}
      borderRadius="lg"
      boxShadow="md"
      zIndex={1000}
    >
      <HStack spacing={3}>
        <Icon
          as={isConnected ? Wifi : WifiOff}
          color={`${getStatusColor()}.500`}
          boxSize={5}
        />
        
        <Tooltip
          label={`Last check: ${getLastCheckText()}`}
          placement="top"
        >
          <Badge
            colorScheme={getStatusColor()}
            variant="subtle"
            px={2}
            py={1}
            borderRadius="md"
          >
            {getStatusText()}
          </Badge>
        </Tooltip>

        {!isConnected && !isChecking && (
          <Button
            size="xs"
            leftIcon={<RefreshCw size={14} />}
            onClick={retry}
            colorScheme="blue"
            variant="ghost"
          >
            Retry
          </Button>
        )}
      </HStack>
    </Box>
  )
}