import React, { useState } from 'react'
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Icon,
  Collapse,
  useToast,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, ChevronDown, Sparkles, Check, Target, Eye, Briefcase } from 'lucide-react'
import { StyleId } from '../../types/styles'

const MotionBox = motion(Box)

type ImprovementGoal = 'engagement' | 'clarity' | 'brand_alignment' | 'visual_appeal'

interface PromptSuggestion {
  id: string
  improvedPrompt: string
  improvedHeadline: string
  explanation: string
  tags: string[]
}

interface MagicFixProps {
  currentPrompt: string
  currentHeadline: string
  style: StyleId
  onApplySuggestion: (prompt: string, headline: string) => void
  disabled?: boolean
}

const GOALS: { id: ImprovementGoal; label: string; icon: typeof Target; description: string }[] = [
  { id: 'engagement', label: 'Boost Engagement', icon: Sparkles, description: 'More likes & shares' },
  { id: 'clarity', label: 'Improve Clarity', icon: Eye, description: 'Clear messaging' },
  { id: 'brand_alignment', label: 'Brand Alignment', icon: Briefcase, description: 'Professional tone' },
  { id: 'visual_appeal', label: 'Visual Appeal', icon: Target, description: 'Better imagery' },
]

const MagicFix: React.FC<MagicFixProps> = ({
  currentPrompt,
  currentHeadline,
  style,
  onApplySuggestion,
  disabled = false
}) => {
  const [selectedGoal, setSelectedGoal] = useState<ImprovementGoal>('engagement')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const toast = useToast()

  const selectedGoalConfig = GOALS.find(g => g.id === selectedGoal)

  const handleSuggest = async () => {
    if (!currentPrompt || !currentHeadline) {
      toast({
        title: 'Content Required',
        description: 'Please enter both a message and headline first.',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    setIsLoading(true)
    setSuggestions([])

    try {
      const response = await fetch('/api/suggest-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: currentPrompt,
          headline: currentHeadline,
          style,
          goal: selectedGoal
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get suggestions')
      }

      setSuggestions(data.suggestions || [])
      setShowSuggestions(true)

      toast({
        title: 'Suggestions Ready!',
        description: `${data.suggestions?.length || 0} improvement options generated.`,
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      console.error('Magic Fix error:', error)
      toast({
        title: 'Suggestion Failed',
        description: error instanceof Error ? error.message : 'Could not generate suggestions',
        status: 'error',
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = (suggestion: PromptSuggestion) => {
    onApplySuggestion(suggestion.improvedPrompt, suggestion.improvedHeadline)
    setShowSuggestions(false)
    setSuggestions([])

    toast({
      title: 'Suggestion Applied!',
      description: 'Your content has been updated.',
      status: 'success',
      duration: 2000,
    })
  }

  const handleDismiss = () => {
    setShowSuggestions(false)
    setSuggestions([])
  }

  return (
    <Box width="full">
      <HStack spacing={2} flexWrap="wrap">
        <Button
          leftIcon={<Wand2 size={16} />}
          colorScheme="purple"
          variant="outline"
          size="sm"
          onClick={handleSuggest}
          isLoading={isLoading}
          loadingText="Thinking..."
          isDisabled={disabled || !currentPrompt || !currentHeadline}
        >
          Magic Fix
        </Button>

        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDown size={14} />}
            size="sm"
            variant="ghost"
            isDisabled={disabled || isLoading}
          >
            <HStack spacing={1}>
              <Icon as={selectedGoalConfig?.icon || Target} boxSize={3} />
              <Text fontSize="xs">{selectedGoalConfig?.label || 'Goal'}</Text>
            </HStack>
          </MenuButton>
          <MenuList>
            {GOALS.map((goal) => (
              <MenuItem
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                icon={<Icon as={goal.icon} boxSize={4} />}
              >
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm">{goal.label}</Text>
                  <Text fontSize="xs" color="gray.500">{goal.description}</Text>
                </VStack>
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </HStack>

      {/* Suggestions Panel */}
      <Collapse in={showSuggestions && suggestions.length > 0} animateOpacity>
        <VStack spacing={3} mt={4} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              AI Suggestions ({suggestions.length})
            </Text>
            <Button size="xs" variant="ghost" onClick={handleDismiss}>
              Dismiss
            </Button>
          </HStack>

          <AnimatePresence>
            {suggestions.map((suggestion, index) => (
              <MotionBox
                key={suggestion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.1 }}
              >
                <Box
                  p={3}
                  bg="white"
                  borderRadius="md"
                  borderWidth={1}
                  borderColor="gray.200"
                  _hover={{ borderColor: 'purple.300', shadow: 'sm' }}
                  transition="all 0.2s"
                >
                  <VStack align="stretch" spacing={2}>
                    {/* Headline Preview */}
                    <Text fontSize="sm" fontWeight="bold" color="purple.700" noOfLines={1}>
                      "{suggestion.improvedHeadline}"
                    </Text>

                    {/* Message Preview */}
                    <Text fontSize="xs" color="gray.600" noOfLines={2}>
                      {suggestion.improvedPrompt}
                    </Text>

                    {/* Explanation */}
                    <Text fontSize="xs" color="gray.500" fontStyle="italic">
                      {suggestion.explanation}
                    </Text>

                    {/* Tags and Apply Button */}
                    <HStack justify="space-between" pt={1}>
                      <HStack spacing={1} flexWrap="wrap">
                        {suggestion.tags.map((tag) => (
                          <Badge
                            key={tag}
                            size="sm"
                            colorScheme="purple"
                            variant="subtle"
                            fontSize="2xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </HStack>
                      <Button
                        size="xs"
                        colorScheme="purple"
                        leftIcon={<Check size={12} />}
                        onClick={() => handleApply(suggestion)}
                      >
                        Apply
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              </MotionBox>
            ))}
          </AnimatePresence>
        </VStack>
      </Collapse>
    </Box>
  )
}

export default MagicFix
