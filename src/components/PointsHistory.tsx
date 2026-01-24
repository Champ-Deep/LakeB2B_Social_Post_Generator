/**
 * PointsHistory Component
 *
 * Displays the user's points transaction history with reasons, changes, and balances.
 * Shows streak multipliers when applied.
 */

import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Icon,
  Flex,
  Spacer,
  Spinner,
  Center,
} from '@chakra-ui/react'
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Award,
  Image,
  Gamepad2,
  Star,
  Calendar,
} from 'lucide-react'

interface PointsHistoryEntry {
  id: string
  points_change: number
  reason: string
  balance_after: number
  metadata?: {
    original_points?: number
    multiplier?: number
    gameType?: string
    achievement?: string
  }
  created_at: string
}

interface PointsHistoryProps {
  entries: PointsHistoryEntry[]
  isLoading?: boolean
  maxEntries?: number
}

// Map reasons to display labels and icons
const REASON_CONFIG: Record<string, { label: string; icon: typeof Star; color: string }> = {
  generation: { label: 'Post Generated', icon: Image, color: 'purple' },
  generation_complete: { label: 'Generation Complete', icon: Image, color: 'purple' },
  points_added: { label: 'Points Added', icon: Star, color: 'blue' },
  achievement_unlocked: { label: 'Achievement', icon: Award, color: 'yellow' },
  game_bonus: { label: 'Game Bonus', icon: Gamepad2, color: 'green' },
  streak_bonus: { label: 'Streak Bonus', icon: Zap, color: 'orange' },
  level_up: { label: 'Level Up', icon: TrendingUp, color: 'pink' },
  first_generation: { label: 'First Post', icon: Star, color: 'purple' },
  daily_login: { label: 'Daily Login', icon: Calendar, color: 'teal' },
}

const getReasonConfig = (reason: string) => {
  return REASON_CONFIG[reason] || { label: reason, icon: Star, color: 'gray' }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const PointsHistoryItem: React.FC<{ entry: PointsHistoryEntry }> = ({ entry }) => {
  const config = getReasonConfig(entry.reason)
  const isPositive = entry.points_change >= 0
  const hasMultiplier = entry.metadata?.multiplier && entry.metadata.multiplier > 1

  return (
    <Box
      p={3}
      borderRadius="md"
      bg="gray.50"
      _hover={{ bg: 'gray.100' }}
      transition="background 0.2s"
    >
      <Flex align="center">
        {/* Icon */}
        <Box
          p={2}
          borderRadius="full"
          bg={`${config.color}.100`}
          mr={3}
        >
          <Icon as={config.icon} boxSize={4} color={`${config.color}.600`} />
        </Box>

        {/* Details */}
        <VStack align="start" spacing={0} flex={1}>
          <HStack spacing={2}>
            <Text fontWeight="medium" fontSize="sm">
              {config.label}
            </Text>
            {hasMultiplier && (
              <Badge colorScheme="orange" size="sm" variant="subtle">
                <HStack spacing={1}>
                  <Icon as={Zap} boxSize={2.5} />
                  <Text>{entry.metadata?.multiplier}x</Text>
                </HStack>
              </Badge>
            )}
          </HStack>
          <Text fontSize="xs" color="gray.500">
            {formatDate(entry.created_at)}
          </Text>
        </VStack>

        <Spacer />

        {/* Points Change */}
        <VStack align="end" spacing={0}>
          <HStack spacing={1}>
            <Icon
              as={isPositive ? TrendingUp : TrendingDown}
              boxSize={3}
              color={isPositive ? 'green.500' : 'red.500'}
            />
            <Text
              fontWeight="bold"
              color={isPositive ? 'green.600' : 'red.600'}
              fontSize="sm"
            >
              {isPositive ? '+' : ''}{entry.points_change}
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.500">
            Balance: {entry.balance_after}
          </Text>
        </VStack>
      </Flex>
    </Box>
  )
}

const PointsHistory: React.FC<PointsHistoryProps> = ({
  entries,
  isLoading = false,
  maxEntries = 10,
}) => {
  const displayEntries = entries.slice(0, maxEntries)

  if (isLoading) {
    return (
      <Box
        bg="white"
        borderRadius="lg"
        p={4}
        boxShadow="sm"
        border="1px solid"
        borderColor="gray.200"
      >
        <Center py={8}>
          <VStack spacing={3}>
            <Spinner size="md" color="purple.500" />
            <Text color="gray.500" fontSize="sm">Loading history...</Text>
          </VStack>
        </Center>
      </Box>
    )
  }

  if (entries.length === 0) {
    return (
      <Box
        bg="white"
        borderRadius="lg"
        p={4}
        boxShadow="sm"
        border="1px solid"
        borderColor="gray.200"
      >
        <Center py={8}>
          <VStack spacing={3}>
            <Icon as={Star} boxSize={8} color="gray.300" />
            <Text color="gray.500" fontSize="sm" textAlign="center">
              No points history yet.
              <br />
              Generate posts to earn points!
            </Text>
          </VStack>
        </Center>
      </Box>
    )
  }

  return (
    <Box
      bg="white"
      borderRadius="lg"
      p={4}
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
    >
      <VStack align="stretch" spacing={4}>
        {/* Header */}
        <HStack>
          <Icon as={Star} color="purple.500" boxSize={5} />
          <Text fontWeight="bold" fontSize="lg">
            Points History
          </Text>
          <Spacer />
          <Badge colorScheme="purple" variant="subtle">
            {entries.length} transactions
          </Badge>
        </HStack>

        <Divider />

        {/* Entries */}
        <VStack align="stretch" spacing={2}>
          {displayEntries.map((entry) => (
            <PointsHistoryItem key={entry.id} entry={entry} />
          ))}
        </VStack>

        {/* Show more indicator */}
        {entries.length > maxEntries && (
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Showing {maxEntries} of {entries.length} transactions
          </Text>
        )}
      </VStack>
    </Box>
  )
}

export default PointsHistory
