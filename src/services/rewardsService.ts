import { User } from '../types/auth'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  points: number
  condition: (user: User) => boolean
  unlocked?: boolean
}

export interface Reward {
  id: string
  name: string
  description: string
  cost: number
  type: 'style' | 'position' | 'template' | 'feature'
  unlocked?: boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_generation',
    name: 'First Steps',
    description: 'Generated your first image',
    icon: '🎯',
    points: 50,
    condition: (user) => (user.generationCount || 0) >= 1
  },
  {
    id: 'style_explorer',
    name: 'Style Explorer',
    description: 'Generated images in all three styles',
    icon: '🎨',
    points: 100,
    condition: (user) => (user.generationCount || 0) >= 3 // Simplified - in real app, track styles used
  },
  {
    id: 'mini_game_master',
    name: 'Game Master',
    description: 'Completed 10 mini-games',
    icon: '🎮',
    points: 150,
    condition: (user) => (user.achievements || []).includes('mini_game_master') // Would track separately
  },
  {
    id: 'point_collector',
    name: 'Point Collector',
    description: 'Earned 500+ points',
    icon: '💎',
    points: 200,
    condition: (user) => (user.totalPoints || 0) >= 500
  },
  {
    id: 'prolific_creator',
    name: 'Prolific Creator',
    description: 'Generated 25+ images',
    icon: '🚀',
    points: 300,
    condition: (user) => (user.generationCount || 0) >= 25
  },
  {
    id: 'week_streak',
    name: 'Weekly Warrior',
    description: 'Used the app for 7 consecutive days',
    icon: '🔥',
    points: 250,
    condition: (user) => (user.achievements || []).includes('week_streak') // Would track login streaks
  }
]

export const REWARDS: Reward[] = [
  {
    id: 'premium_styles',
    name: 'Premium Style Pack',
    description: 'Unlock 3 additional premium styles',
    cost: 200,
    type: 'style'
  },
  {
    id: 'custom_positions',
    name: 'Custom Logo Positions',
    description: 'Place logo anywhere on the image',
    cost: 150,
    type: 'position'
  },
  {
    id: 'template_library',
    name: 'Template Library',
    description: 'Access to 50+ pre-made templates',
    cost: 300,
    type: 'template'
  },
  {
    id: 'batch_generation',
    name: 'Batch Generation',
    description: 'Generate multiple images at once',
    cost: 400,
    type: 'feature'
  },
  {
    id: 'priority_generation',
    name: 'Priority Generation',
    description: 'Skip queue during peak hours',
    cost: 250,
    type: 'feature'
  }
]

export class RewardsService {
  private static instance: RewardsService

  static getInstance(): RewardsService {
    if (!RewardsService.instance) {
      RewardsService.instance = new RewardsService()
    }
    return RewardsService.instance
  }

  checkNewAchievements(user: User): Achievement[] {
    const newAchievements: Achievement[] = []
    
    for (const achievement of ACHIEVEMENTS) {
      // Check if user doesn't already have this achievement and meets the condition
      if (!(user.achievements || []).includes(achievement.id) && achievement.condition(user)) {
        newAchievements.push({
          ...achievement,
          unlocked: true
        })
      }
    }
    
    return newAchievements
  }

  getUserAchievements(user: User): Achievement[] {
    return ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      unlocked: (user.achievements || []).includes(achievement.id)
    }))
  }

  getAvailableRewards(user: User): Reward[] {
    return REWARDS.map(reward => ({
      ...reward,
      unlocked: (user.totalPoints || 0) >= reward.cost
    }))
  }

  calculateLevelProgress(user: User): {
    currentLevel: number
    nextLevel: number
    pointsInCurrentLevel: number
    pointsNeededForNext: number
    progressPercentage: number
  } {
    const currentLevel = user.level || 1
    const nextLevel = currentLevel + 1
    const currentLevelPoints = (currentLevel - 1) * 100
    const nextLevelPoints = currentLevel * 100
    const totalPoints = user.totalPoints || 0
    const pointsInCurrentLevel = totalPoints - currentLevelPoints
    const pointsNeededForNext = nextLevelPoints - totalPoints
    const progressPercentage = (pointsInCurrentLevel / 100) * 100

    return {
      currentLevel,
      nextLevel,
      pointsInCurrentLevel,
      pointsNeededForNext: Math.max(0, pointsNeededForNext),
      progressPercentage: Math.min(100, progressPercentage)
    }
  }

  getPointsForAction(action: string): number {
    const pointsMap: Record<string, number> = {
      'image_generation': 10,
      'mini_game_completion': 5,
      'daily_login': 20,
      'first_time_bonus': 50,
      'achievement_bonus': 100
    }
    
    return pointsMap[action] || 0
  }
}

export const rewardsService = RewardsService.getInstance()