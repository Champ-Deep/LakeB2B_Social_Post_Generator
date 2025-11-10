import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Avatar,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Flex,
  Divider,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react'
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'

interface LeaderboardEntry {
  userId: string
  name: string
  email: string
  totalPoints: number
  weeklyPoints: number
  level: number
  generationCount: number
  rank: number
}

interface LeaderboardData {
  allTime: LeaderboardEntry[]
  weekly: LeaderboardEntry[]
  currentUser?: LeaderboardEntry
}

interface LeaderboardProps {
  className?: string
}

const Leaderboard: React.FC<LeaderboardProps> = ({ className }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/leaderboard', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }

      const data = await response.json()
      if (data.success) {
        setLeaderboardData(data.leaderboard)
      } else {
        setError(data.error || 'Failed to load leaderboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy color="#FFD700" size={20} />
      case 2:
        return <Medal color="#C0C0C0" size={20} />
      case 3:
        return <Award color="#CD7F32" size={20} />
      default:
        return <Text fontWeight="bold" color="gray.600">#{rank}</Text>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'yellow'
      case 2:
        return 'gray'
      case 3:
        return 'orange'
      default:
        return 'gray'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const renderLeaderboardList = (entries: LeaderboardEntry[], showWeekly = false) => (
    <VStack spacing={3} align="stretch">
      {entries.map((entry) => (
        <Box
          key={entry.userId}
          p={4}
          bg={entry.rank <= 3 ? `${getRankColor(entry.rank)}.50` : 'white'}
          borderRadius="lg"
          border="1px"
          borderColor={entry.rank <= 3 ? `${getRankColor(entry.rank)}.200` : 'gray.200'}
          boxShadow="sm"
        >
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Box minW="40px" textAlign="center">
                {getRankIcon(entry.rank)}
              </Box>
              <Avatar 
                name={entry.name} 
                size="sm"
                bg="purple.500"
                color="white"
              >
                {getInitials(entry.name)}
              </Avatar>
              <VStack align="start" spacing={0}>
                <Text fontWeight="semibold" fontSize="sm">
                  {entry.name}
                </Text>
                <Text fontSize="xs" color="gray.600">
                  Level {entry.level} • {entry.generationCount} posts
                </Text>
              </VStack>
            </HStack>
            <VStack align="end" spacing={0}>
              <Text fontWeight="bold" color="purple.600">
                {showWeekly ? entry.weeklyPoints : entry.totalPoints} pts
              </Text>
              {showWeekly && (
                <Text fontSize="xs" color="gray.500">
                  this week
                </Text>
              )}
            </VStack>
          </HStack>
        </Box>
      ))}
    </VStack>
  )

  if (loading) {
    return (
      <Box className={className}>
        <Center p={8}>
          <VStack spacing={4}>
            <Spinner size="lg" color="purple.500" />
            <Text color="gray.600">Loading leaderboard...</Text>
          </VStack>
        </Center>
      </Box>
    )
  }

  if (error) {
    return (
      <Box className={className}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Text>Error loading leaderboard: {error}</Text>
        </Alert>
      </Box>
    )
  }

  if (!leaderboardData) {
    return (
      <Box className={className}>
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Text>No leaderboard data available</Text>
        </Alert>
      </Box>
    )
  }

  return (
    <Box className={className} bg="white" borderRadius="lg" boxShadow="md" p={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading size="lg" color="gray.800">
            🏆 Leaderboard
          </Heading>
          <Badge colorScheme="purple" variant="subtle" px={3} py={1}>
            <HStack spacing={1}>
              <TrendingUp size={12} />
              <Text fontSize="xs">Live Rankings</Text>
            </HStack>
          </Badge>
        </HStack>

        {/* Current User Stats */}
        {leaderboardData.currentUser && (
          <>
            <Box p={4} bg="purple.50" borderRadius="lg" border="2px" borderColor="purple.200">
              <VStack spacing={3}>
                <Text fontSize="sm" fontWeight="medium" color="purple.700">
                  Your Ranking
                </Text>
                <HStack spacing={4}>
                  <Avatar 
                    name={leaderboardData.currentUser.name} 
                    size="md"
                    bg="purple.500"
                    color="white"
                  />
                  <StatGroup flex={1}>
                    <Stat>
                      <StatLabel fontSize="xs">Rank</StatLabel>
                      <StatNumber fontSize="lg">#{leaderboardData.currentUser.rank}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel fontSize="xs">Points</StatLabel>
                      <StatNumber fontSize="lg">{leaderboardData.currentUser.totalPoints}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel fontSize="xs">Level</StatLabel>
                      <StatNumber fontSize="lg">{leaderboardData.currentUser.level}</StatNumber>
                    </Stat>
                  </StatGroup>
                </HStack>
              </VStack>
            </Box>
            <Divider />
          </>
        )}

        {/* Leaderboard Tabs */}
        <Tabs variant="soft-rounded" colorScheme="purple">
          <TabList>
            <Tab flex={1}>All Time</Tab>
            <Tab flex={1}>This Week</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0} py={4}>
              {leaderboardData.allTime.length > 0 ? (
                renderLeaderboardList(leaderboardData.allTime, false)
              ) : (
                <Center py={8}>
                  <Text color="gray.500">No all-time rankings available</Text>
                </Center>
              )}
            </TabPanel>
            <TabPanel px={0} py={4}>
              {leaderboardData.weekly.length > 0 ? (
                renderLeaderboardList(leaderboardData.weekly, true)
              ) : (
                <Center py={8}>
                  <Text color="gray.500">No weekly rankings available</Text>
                </Center>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  )
}

export default Leaderboard