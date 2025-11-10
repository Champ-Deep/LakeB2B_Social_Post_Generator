import React, { useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  Avatar,
  Wrap,
  WrapItem,
  Icon,
  Grid,
  GridItem,
  Divider,
  Button
} from '@chakra-ui/react'
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Image as ImageIcon,
  Sparkles,
  Target,
  Star,
  Calendar,
  Users,
  BarChart3,
  Download
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Leaderboard from './Leaderboard'

interface UserDashboardProps {
  isOpen: boolean
  onClose: () => void
}

const UserDashboard: React.FC<UserDashboardProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(0)

  if (!user) return null

  const level = user.level || 1
  const totalPoints = user.totalPoints || 0
  const achievements = user.achievements || []
  const generationCount = user.generationCount || 0

  // Calculate level progress
  const currentLevelPoints = (level - 1) * 100
  const nextLevelPoints = level * 100
  const progressToNextLevel = ((totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100

  // Mock additional stats (in production, these would come from API)
  const weeklyStats = {
    postsGenerated: 12,
    pointsEarned: 230,
    gamesPlayed: 8,
    streakDays: 5
  }

  const availableAchievements = [
    { 
      id: 'first_generation', 
      name: 'First Steps', 
      icon: Target, 
      description: 'Generated your first image',
      unlocked: achievements.includes('first_generation')
    },
    { 
      id: 'style_explorer', 
      name: 'Style Explorer', 
      icon: Sparkles, 
      description: 'Tried all three styles',
      unlocked: achievements.includes('style_explorer')
    },
    { 
      id: 'mini_game_master', 
      name: 'Game Master', 
      icon: Trophy, 
      description: 'Completed 10 mini-games',
      unlocked: achievements.includes('mini_game_master')
    },
    { 
      id: 'point_collector', 
      name: 'Point Collector', 
      icon: Star, 
      description: 'Earned 500+ points',
      unlocked: totalPoints >= 500
    },
    {
      id: 'power_user',
      name: 'Power User',
      icon: TrendingUp,
      description: 'Generated 25+ images',
      unlocked: generationCount >= 25
    }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            <Avatar name={user.name} size="md" bg="purple.500" color="white" />
            <VStack align="start" spacing={0}>
              <Heading size="lg">{user.name}'s Dashboard</Heading>
              <Text fontSize="sm" color="gray.600">{user.email}</Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* User Stats Overview */}
            <Box p={6} bg="gradient.light" borderRadius="lg">
              <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={6}>
                <GridItem>
                  <Stat>
                    <StatLabel color="gray.600">Current Level</StatLabel>
                    <StatNumber color="purple.600" fontSize="3xl">
                      {level}
                    </StatNumber>
                    <StatHelpText>
                      <Progress 
                        value={progressToNextLevel} 
                        colorScheme="purple" 
                        size="sm" 
                        borderRadius="full"
                      />
                      <Text fontSize="xs" mt={1}>
                        {Math.round(progressToNextLevel)}% to Level {level + 1}
                      </Text>
                    </StatHelpText>
                  </Stat>
                </GridItem>

                <GridItem>
                  <Stat>
                    <StatLabel color="gray.600">Total Points</StatLabel>
                    <StatNumber color="green.600" fontSize="3xl">
                      {totalPoints.toLocaleString()}
                    </StatNumber>
                    <StatHelpText>
                      <HStack spacing={1}>
                        <TrendingUp size={12} />
                        <Text>+{weeklyStats.pointsEarned} this week</Text>
                      </HStack>
                    </StatHelpText>
                  </Stat>
                </GridItem>

                <GridItem>
                  <Stat>
                    <StatLabel color="gray.600">Posts Generated</StatLabel>
                    <StatNumber color="blue.600" fontSize="3xl">
                      {generationCount}
                    </StatNumber>
                    <StatHelpText>
                      <HStack spacing={1}>
                        <ImageIcon size={12} />
                        <Text>+{weeklyStats.postsGenerated} this week</Text>
                      </HStack>
                    </StatHelpText>
                  </Stat>
                </GridItem>

                <GridItem>
                  <Stat>
                    <StatLabel color="gray.600">Login Streak</StatLabel>
                    <StatNumber color="orange.600" fontSize="3xl">
                      {weeklyStats.streakDays}
                    </StatNumber>
                    <StatHelpText>
                      <HStack spacing={1}>
                        <Calendar size={12} />
                        <Text>days in a row</Text>
                      </HStack>
                    </StatHelpText>
                  </Stat>
                </GridItem>
              </Grid>
            </Box>

            {/* Tabbed Content */}
            <Tabs index={activeTab} onChange={setActiveTab} colorScheme="purple">
              <TabList>
                <Tab>
                  <HStack spacing={2}>
                    <Trophy size={16} />
                    <Text>Achievements</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Users size={16} />
                    <Text>Leaderboard</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <BarChart3 size={16} />
                    <Text>Statistics</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Achievements Tab */}
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <HStack justify="space-between" mb={4}>
                        <Heading size="md">Your Achievements</Heading>
                        <Badge colorScheme="purple" px={3} py={1}>
                          {achievements.length} / {availableAchievements.length} Unlocked
                        </Badge>
                      </HStack>
                      
                      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                        {availableAchievements.map((achievement) => {
                          const IconComponent = achievement.icon
                          return (
                            <Box
                              key={achievement.id}
                              p={4}
                              borderRadius="lg"
                              border="2px"
                              borderColor={achievement.unlocked ? 'yellow.400' : 'gray.200'}
                              bg={achievement.unlocked ? 'yellow.50' : 'gray.50'}
                              opacity={achievement.unlocked ? 1 : 0.6}
                            >
                              <HStack spacing={3}>
                                <Box
                                  p={3}
                                  borderRadius="full"
                                  bg={achievement.unlocked ? 'yellow.400' : 'gray.300'}
                                  color={achievement.unlocked ? 'yellow.900' : 'gray.600'}
                                >
                                  <IconComponent size={24} />
                                </Box>
                                <VStack align="start" spacing={1}>
                                  <HStack spacing={2}>
                                    <Text fontWeight="bold" color="gray.800">
                                      {achievement.name}
                                    </Text>
                                    {achievement.unlocked && (
                                      <Badge colorScheme="yellow" size="sm">
                                        ✓ Unlocked
                                      </Badge>
                                    )}
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600">
                                    {achievement.description}
                                  </Text>
                                </VStack>
                              </HStack>
                            </Box>
                          )
                        })}
                      </Grid>
                    </Box>
                  </VStack>
                </TabPanel>

                {/* Leaderboard Tab */}
                <TabPanel px={0}>
                  <Leaderboard />
                </TabPanel>

                {/* Statistics Tab */}
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Heading size="md">Weekly Performance</Heading>
                    
                    <StatGroup>
                      <Stat>
                        <StatLabel>Posts Generated</StatLabel>
                        <StatNumber>{weeklyStats.postsGenerated}</StatNumber>
                        <StatHelpText>This week</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Points Earned</StatLabel>
                        <StatNumber>{weeklyStats.pointsEarned}</StatNumber>
                        <StatHelpText>This week</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Games Played</StatLabel>
                        <StatNumber>{weeklyStats.gamesPlayed}</StatNumber>
                        <StatHelpText>This week</StatHelpText>
                      </Stat>
                    </StatGroup>

                    <Divider />

                    <Heading size="md">All Time Records</Heading>
                    
                    <StatGroup>
                      <Stat>
                        <StatLabel>Total Posts</StatLabel>
                        <StatNumber>{generationCount}</StatNumber>
                        <StatHelpText>Since joining</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Total Points</StatLabel>
                        <StatNumber>{totalPoints.toLocaleString()}</StatNumber>
                        <StatHelpText>All time</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Current Level</StatLabel>
                        <StatNumber>{level}</StatNumber>
                        <StatHelpText>Achievement level</StatHelpText>
                      </Stat>
                    </StatGroup>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default UserDashboard