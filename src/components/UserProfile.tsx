import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Progress,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Wrap,
  WrapItem,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup
} from '@chakra-ui/react'
import { User, Trophy, Target, TrendingUp, LogOut, Star, BarChart3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import UserDashboard from './UserDashboard'

const UserProfile: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const [showDashboard, setShowDashboard] = useState(false)

  if (!isAuthenticated || !user) {
    return null
  }

  // Calculate progress to next level
  const level = user.level || 1
  const totalPoints = user.totalPoints || 0
  const userAchievements = user.achievements || []
  const generationCount = user.generationCount || 0
  
  const currentLevelPoints = (level - 1) * 100
  const nextLevelPoints = level * 100
  const progressToNextLevel = ((totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100

  const availableAchievements = [
    { id: 'first_generation', name: 'First Steps', icon: Target, description: 'Generated your first image' },
    { id: 'style_explorer', name: 'Style Explorer', icon: TrendingUp, description: 'Tried all three styles' },
    { id: 'mini_game_master', name: 'Game Master', icon: Trophy, description: 'Completed 10 mini-games' },
    { id: 'point_collector', name: 'Point Collector', icon: Star, description: 'Earned 500+ points' },
  ]

  return (
    <>
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<User size={16} />}
          rightIcon={<Badge colorScheme="purple" borderRadius="full">{user.totalPoints}</Badge>}
        >
          {user.name}
        </Button>
      </PopoverTrigger>
      <PopoverContent w="320px">
        <PopoverArrow />
        <PopoverBody p={4}>
          <VStack spacing={4} align="stretch">
            {/* User Info */}
            <HStack justify="space-between">
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold">{user.name}</Text>
                <Text fontSize="sm" color="gray.600">{user.email}</Text>
              </VStack>
              <Badge colorScheme="purple" fontSize="sm" p={2} borderRadius="md">
                Level {level}
              </Badge>
            </HStack>

            {/* Level Progress */}
            <Box>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="sm" fontWeight="medium">Level Progress</Text>
                <Text fontSize="xs" color="gray.600">
                  {totalPoints - currentLevelPoints}/{nextLevelPoints - currentLevelPoints} XP
                </Text>
              </HStack>
              <Progress 
                value={progressToNextLevel} 
                colorScheme="purple" 
                borderRadius="full" 
                size="sm"
              />
            </Box>

            <Divider />

            {/* Stats */}
            <StatGroup>
              <Stat>
                <StatLabel fontSize="xs">Total Points</StatLabel>
                <StatNumber fontSize="lg">{totalPoints}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel fontSize="xs">Images</StatLabel>
                <StatNumber fontSize="lg">{generationCount}</StatNumber>
              </Stat>
            </StatGroup>

            {/* Achievements */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Achievements</Text>
              <Wrap spacing={1}>
                {availableAchievements.map((achievement) => {
                  const hasAchievement = userAchievements.includes(achievement.id)
                  const IconComponent = achievement.icon
                  return (
                    <WrapItem key={achievement.id}>
                      <Badge
                        colorScheme={hasAchievement ? "yellow" : "gray"}
                        variant={hasAchievement ? "solid" : "outline"}
                        fontSize="xs"
                        p={1}
                        borderRadius="md"
                        title={achievement.description}
                      >
                        <HStack spacing={1}>
                          <IconComponent size={10} />
                          <Text>{achievement.name}</Text>
                        </HStack>
                      </Badge>
                    </WrapItem>
                  )
                })}
              </Wrap>
            </Box>

            <Divider />

            {/* Dashboard Button */}
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<BarChart3 size={16} />}
              onClick={() => setShowDashboard(true)}
              colorScheme="purple"
              width="full"
            >
              View Dashboard
            </Button>

            {/* Logout */}
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<LogOut size={16} />}
              onClick={logout}
              colorScheme="red"
              width="full"
            >
              Logout
            </Button>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>

    {/* User Dashboard Modal */}
    <UserDashboard 
      isOpen={showDashboard} 
      onClose={() => setShowDashboard(false)} 
    />
    </>
  )
}

export default UserProfile