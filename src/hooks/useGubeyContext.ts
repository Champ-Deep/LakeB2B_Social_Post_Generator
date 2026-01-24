/**
 * useGubeyContext - Context-aware content selection hook
 *
 * Provides tips and messages based on the current page pathname.
 * Includes greeting messages based on time of day.
 */

import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import type { GubeyTip } from '../types/gubey';

/**
 * Context-specific tips for each page
 */
const CONTEXT_TIPS: Record<string, GubeyTip[]> = {
  '/': [
    {
      message: "Ready to create? Try isometric for technical posts!",
      actionLabel: "Start Creating",
      actionPath: '/generator',
      priority: 1,
    },
    {
      message: "LinkedIn posts with numbers get 20% more engagement.",
      priority: 2,
    },
    {
      message: "First time here? I'll guide you through it!",
      priority: 3,
    },
    {
      message: "Pro tip: Start with the problem your buyer faces.",
      priority: 2,
    },
  ],
  '/generator': [
    {
      message: "Ready to create? Try isometric for technical posts!",
      priority: 1,
    },
    {
      message: "The meme style is trending for B2B right now!",
      priority: 2,
    },
    {
      message: "Start with the problem your buyer is facing.",
      priority: 1,
    },
    {
      message: "Infographic style works great for stats and data.",
      priority: 2,
    },
    {
      message: "New Yorker cartoon style adds editorial credibility.",
      priority: 3,
    },
  ],
  '/pricing': [
    {
      message: "Most teams start with 50 monthly generations.",
      priority: 1,
    },
    {
      message: "Need help choosing a plan? I can break it down.",
      priority: 2,
    },
    {
      message: "Enterprise plans include custom branding options.",
      priority: 3,
    },
  ],
  '/gallery': [
    {
      message: "Minimalist LinkedIn style trending this week.",
      priority: 1,
    },
    {
      message: "These posts got the most engagement. See a pattern?",
      priority: 2,
    },
    {
      message: "Click any post to see how it was created.",
      priority: 3,
    },
  ],
  '/dashboard': [
    {
      message: "Your streak is looking good! Keep it up.",
      priority: 1,
    },
    {
      message: "Check your achievements - you might have new ones!",
      priority: 2,
    },
  ],
  '/settings': [
    {
      message: "Connect LinkedIn to post directly from here.",
      priority: 1,
    },
    {
      message: "Customize your default style and logo preferences.",
      priority: 2,
    },
  ],
};

/**
 * Default tips when no specific context matches
 */
const DEFAULT_TIPS: GubeyTip[] = [
  {
    message: "Hey, I'm Gubey - your guide to posts that land.",
    priority: 1,
  },
  {
    message: "Need help? I'm here to assist, not judge.",
    priority: 2,
  },
  {
    message: "Let's create something your audience will love.",
    priority: 3,
  },
];

/**
 * Greeting messages based on time of day
 */
const GREETING_MESSAGES = {
  morning: [
    "Good morning! Ready to create something great?",
    "Rise and grind! Let's make your content count.",
    "Morning! Early posts get early engagement.",
  ],
  afternoon: [
    "Hey there! Let's make your content count.",
    "Afternoon! Perfect time for a creative boost.",
    "Ready when you are! What are we creating today?",
  ],
  evening: [
    "Evening! Late-night content session?",
    "Good evening! Night owls create the best content.",
    "Burning the midnight oil? Let's make it count.",
  ],
};

/**
 * Custom hook for context-aware Gubey content
 *
 * @returns Object with tips, greeting, and utility functions
 *
 * @example
 * ```tsx
 * const { currentTips, getRandomTip, getGreetingMessage } = useGubeyContext();
 * const tip = getRandomTip();
 * const greeting = getGreetingMessage();
 * ```
 */
export function useGubeyContext() {
  const router = useRouter();
  const pathname = router.pathname;

  /**
   * Get tips for current page
   */
  const currentTips = useMemo(() => {
    return CONTEXT_TIPS[pathname] || DEFAULT_TIPS;
  }, [pathname]);

  /**
   * Get a random tip from current context
   */
  const getRandomTip = useCallback((): GubeyTip => {
    const tips = currentTips;

    // Weight by priority (lower priority = higher weight)
    const weightedTips = tips.flatMap((tip) => {
      const weight = 4 - (tip.priority || 2); // priority 1 = weight 3, priority 3 = weight 1
      return Array(weight).fill(tip);
    });

    const randomIndex = Math.floor(Math.random() * weightedTips.length);
    return weightedTips[randomIndex] || tips[0];
  }, [currentTips]);

  /**
   * Get greeting message based on time of day
   */
  const getGreetingMessage = useCallback((): string => {
    const hour = new Date().getHours();

    let timeOfDay: 'morning' | 'afternoon' | 'evening';
    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
    } else {
      timeOfDay = 'evening';
    }

    const messages = GREETING_MESSAGES[timeOfDay];
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }, []);

  /**
   * Get tip by priority
   */
  const getTopTip = useCallback((): GubeyTip => {
    const sorted = [...currentTips].sort(
      (a, b) => (a.priority || 2) - (b.priority || 2)
    );
    return sorted[0] || DEFAULT_TIPS[0];
  }, [currentTips]);

  /**
   * Check if on generator page
   */
  const isOnGenerator = useMemo(() => {
    return pathname === '/' || pathname === '/generator';
  }, [pathname]);

  return {
    pathname,
    currentTips,
    getRandomTip,
    getGreetingMessage,
    getTopTip,
    isOnGenerator,
    DEFAULT_TIPS,
    CONTEXT_TIPS,
  };
}

export type { GubeyTip };
