/**
 * StreakDisplay Component
 *
 * Displays the user's current streak, longest streak, and streak-based rewards.
 * Shows fire emoji animations and milestone celebrations.
 */

import React from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Progress,
  Tooltip,
  Icon,
  Flex,
  Spacer,
} from '@chakra-ui/react'
import { Flame, Trophy, Target, Zap } from 'lucide-react'

interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
  streakBonusMultiplier: number
  lastActivityDate?: string | null
  compact?: boolean
}

// Streak milestones with rewards
const MILESTONES = [
  { days: 3, emoji: '🔥', label: '3-Day Streak', bonus: '1.0x' },
  { days: 7, emoji: '🔥🔥', label: 'Week Warrior', bonus: '1.5x' },
  { days: 14, emoji: '⚡', label: 'Two Week Champion', bonus: '1.5x' },
  { days: 30, emoji: '🏆', label: 'Monthly Master', bonus: '2.0x' },
  { days: 60, emoji: '💎', label: 'Diamond Streak', bonus: '2.0x' },
  { days: 100, emoji: '👑', label: 'Legendary', bonus: '2.0x' },
]

const getStreakColor = (streak: number): string => {
  if (streak >= 30) return 'orange.500'
  if (streak >= 14) return 'yellow.500'
  if (streak >= 7) return 'purple.500'
  if (streak >= 3) return 'blue.500'
  return 'gray.500'
}

const getStreakEmoji = (streak: number): string => {
  if (streak >= 100) return '👑'
  if (streak >= 60) return '💎'
  if (streak >= 30) return '🏆'
  if (streak >= 14) return '⚡'
  if (streak >= 7) return '🔥🔥'
  if (streak >= 3) return '🔥'
  return '✨'
}

const getNextMilestone = (streak: number) => {
  return MILESTONES.find(m => m.days > streak) || MILESTONES[MILESTONES.length - 1]
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  longestStreak,
  streakBonusMultiplier,
  lastActivityDate,
  compact = false,
}) => {
  const streakColor = getStreakColor(currentStreak)
  const streakEmoji = getStreakEmoji(currentStreak)
  const nextMilestone = getNextMilestone(currentStreak)
  const progressToNext = nextMilestone
    ? Math.min(100, (currentStreak / nextMilestone.days) * 100)
    : 100

  // Check if streak is at risk (no activity today)
  const isAtRisk = lastActivityDate
    ? new Date(lastActivityDate).toDateString() !== new Date().toDateString()
    : false

  if (compact) {
    return (
      <Tooltip
        label={
          <VStack align="start" spacing={1} p={1}>
            <Text fontWeight="bold">Current Streak: {currentStreak} days</Text>
            <Text>Longest: {longestStreak} days</Text>
            <Text>Bonus: {streakBonusMultiplier}x points</Text>
            {isAtRisk && (
              <Text color="orange.300">⚠️ Generate today to keep your streak!</Text>
            )}
          </VStack>
        }
        placement="top"
      >
        <HStack
          bg="gray.50"
          px={3}
          py={1}
          borderRadius="full"
          cursor="pointer"
          _hover={{ bg: 'gray.100' }}
        >
          <Text fontSize="lg">{streakEmoji}</Text>
          <Text fontWeight="bold" color={streakColor}>
            {currentStreak}
          </Text>
          {isAtRisk && <Badge colorScheme="orange" size="sm">!</Badge>}
        </HStack>
      </Tooltip>
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
        <Flex align="center">
          <HStack>
            <Icon as={Flame} color={streakColor} boxSize={5} />
            <Text fontWeight="bold" fontSize="lg">
              Activity Streak
            </Text>
          </HStack>
          <Spacer />
          {streakBonusMultiplier > 1 && (
            <Badge colorScheme="purple" variant="subtle">
              <HStack spacing={1}>
                <Icon as={Zap} boxSize={3} />
                <Text>{streakBonusMultiplier}x bonus</Text>
              </HStack>
            </Badge>
          )}
        </Flex>

        {/* Current Streak */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={0}>
            <Text fontSize="3xl" fontWeight="bold" color={streakColor}>
              {currentStreak}
              <Text as="span" fontSize="lg" fontWeight="normal" color="gray.500" ml={2}>
                days
              </Text>
            </Text>
            <Text fontSize="sm" color="gray.500">
              Current Streak {streakEmoji}
            </Text>
          </VStack>

          <VStack align="end" spacing={0}>
            <HStack>
              <Icon as={Trophy} color="yellow.500" boxSize={4} />
              <Text fontWeight="semibold">{longestStreak}</Text>
            </HStack>
            <Text fontSize="xs" color="gray.500">
              Personal Best
            </Text>
          </VStack>
        </HStack>

        {/* Streak at Risk Warning */}
        {isAtRisk && currentStreak > 0 && (
          <Box
            bg="orange.50"
            border="1px solid"
            borderColor="orange.200"
            borderRadius="md"
            p={3}
          >
            <HStack>
              <Text fontSize="lg">⚠️</Text>
              <VStack align="start" spacing={0}>
                <Text fontWeight="medium" color="orange.700" fontSize="sm">
                  Don't lose your streak!
                </Text>
                <Text fontSize="xs" color="orange.600">
                  Generate a post today to maintain your {currentStreak}-day streak
                </Text>
              </VStack>
            </HStack>
          </Box>
        )}

        {/* Progress to Next Milestone */}
        {nextMilestone && currentStreak < nextMilestone.days && (
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <HStack>
                <Icon as={Target} color="purple.500" boxSize={4} />
                <Text fontSize="sm" fontWeight="medium">
                  Next: {nextMilestone.label}
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                {nextMilestone.days - currentStreak} days to go
              </Text>
            </HStack>
            <Progress
              value={progressToNext}
              size="sm"
              colorScheme="purple"
              borderRadius="full"
            />
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Unlock {nextMilestone.bonus} point multiplier at {nextMilestone.days} days
            </Text>
          </VStack>
        )}

        {/* Achieved Milestones */}
        {currentStreak >= 7 && (
          <Box>
            <Text fontSize="xs" color="gray.500" mb={2}>
              Achievements Unlocked
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              {MILESTONES.filter(m => currentStreak >= m.days).map((milestone) => (
                <Tooltip key={milestone.days} label={milestone.label}>
                  <Badge
                    colorScheme="purple"
                    variant="subtle"
                    px={2}
                    py={1}
                    borderRadius="full"
                  >
                    <HStack spacing={1}>
                      <Text>{milestone.emoji}</Text>
                      <Text fontSize="xs">{milestone.days}d</Text>
                    </HStack>
                  </Badge>
                </Tooltip>
              ))}
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  )
}

export default StreakDisplay
