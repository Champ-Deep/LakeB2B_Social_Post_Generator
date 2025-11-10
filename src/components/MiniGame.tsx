import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Grid,
  GridItem,
  Button,
  Progress,
  Badge,
  Flex,
  Icon,
  useToast,
  Fade,
  Input
} from '@chakra-ui/react'
import { Mail, Target, TrendingUp, Users, X, Zap } from 'lucide-react'

interface MiniGameProps {
  isVisible: boolean
  onClose: () => void
  onComplete?: (score: number) => void
  generationProgress: number
}

const GAME_ICONS = [
  { icon: Mail, color: '#FFB703', name: 'email', isLead: true },
  { icon: Target, color: '#DD1286', name: 'target', isLead: true },
  { icon: TrendingUp, color: '#6D08BE', name: 'growth', isLead: true },
  { icon: Users, color: '#0EA5E9', name: 'leads', isLead: true },
  { icon: Zap, color: '#666', name: 'spam', isLead: false }
]

type GameType = 'match' | 'quickclick' | 'collector'

const MiniGame: React.FC<MiniGameProps> = ({ 
  isVisible, 
  onClose, 
  onComplete,
  generationProgress 
}) => {
  const [currentGame, setCurrentGame] = useState<GameType>('match')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(12) // Shorter games
  const [gameCompleted, setGameCompleted] = useState(false)
  const [gameSpecificData, setGameSpecificData] = useState<any>({})
  const [generationComplete, setGenerationComplete] = useState(false)
  const [showFinishPrompt, setShowFinishPrompt] = useState(false)
  const toast = useToast()

  // Game titles
  const getGameTitle = () => {
    switch (currentGame) {
      case 'match': return 'Brand Matcher'
      case 'quickclick': return 'Quick Click'
      case 'collector': return 'Lead Collector'
      default: return 'Mini Game'
    }
  }

  // Select random game
  const selectRandomGame = useCallback(() => {
    const games: GameType[] = ['match', 'quickclick', 'collector']
    return games[Math.floor(Math.random() * games.length)]
  }, [])

  // Initialize game
  const initializeGame = useCallback(() => {
    const gameType = selectRandomGame()
    setCurrentGame(gameType)
    setScore(0)
    setTimeLeft(12)
    setGameCompleted(false)
    
    switch (gameType) {
      case 'match':
        // Create 4x2 grid with 4 pairs (8 tiles total)
        const tiles = []
        const pairCount = 4
        for (let i = 0; i < pairCount; i++) {
          const iconData = GAME_ICONS[i % 4]
          tiles.push({ ...iconData, id: i * 2, matched: false, flipped: false })
          tiles.push({ ...iconData, id: i * 2 + 1, matched: false, flipped: false })
        }
        setGameSpecificData({ 
          tiles: tiles.sort(() => Math.random() - 0.5),
          flipped: [],
          matches: 0
        })
        break
        
      case 'quickclick':
        // Quick click on appearing logos
        setGameSpecificData({ 
          targets: [],
          clickedCount: 0,
          missedClicks: 0,
          nextSpawnTime: Date.now() + 1000,
          spawnInterval: 1500 // Start with 1.5 seconds
        })
        break
        
      case 'collector':
        setGameSpecificData({ 
          fallingIcons: [],
          collectedLeads: 0,
          spawnCounter: 0
        })
        break
    }
  }, [selectRandomGame])

  // Initialize game when visible
  useEffect(() => {
    if (isVisible) {
      initializeGame()
    }
  }, [isVisible, initializeGame])

  // Track generation completion
  useEffect(() => {
    if (generationProgress >= 100 && !generationComplete) {
      setGenerationComplete(true)
      if (!gameCompleted) {
        setShowFinishPrompt(true)
      }
    }
  }, [generationProgress, generationComplete, gameCompleted])

  // Game timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isVisible && timeLeft > 0 && !gameCompleted) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    } else if (timeLeft === 0) {
      // Only end game when timer runs out, not when generation completes
      endGame()
    }
    return () => clearTimeout(timer)
  }, [isVisible, timeLeft, gameCompleted])

  // Collector game logic
  useEffect(() => {
    if (currentGame === 'collector' && isVisible && !gameCompleted) {
      const interval = setInterval(() => {
        setGameSpecificData((prev: any) => {
          const newData = { ...prev }
          
          // Spawn new icon
          if (newData.spawnCounter % 20 === 0) {
            const iconData = GAME_ICONS[Math.floor(Math.random() * GAME_ICONS.length)]
            newData.fallingIcons = [...(newData.fallingIcons || []), {
              id: Date.now() + Math.random(),
              ...iconData,
              x: Math.random() * 300,
              y: -30,
              speed: 2 + Math.random() * 2
            }]
          }
          
          // Move icons down
          newData.fallingIcons = newData.fallingIcons
            .map((icon: any) => ({ ...icon, y: icon.y + icon.speed }))
            .filter((icon: any) => icon.y < 350)
          
          newData.spawnCounter = (newData.spawnCounter || 0) + 1
          return newData
        })
      }, 100)
      
      return () => clearInterval(interval)
    }
  }, [currentGame, isVisible, gameCompleted])

  // Quick click game logic
  useEffect(() => {
    if (currentGame === 'quickclick' && isVisible && !gameCompleted) {
      const interval = setInterval(() => {
        setGameSpecificData((prev: any) => {
          const now = Date.now()
          
          // Remove expired targets (missed)
          const activeTargets = prev.targets.filter((target: any) => {
            if (now - target.spawnTime > 2000) {
              setScore(s => Math.max(0, s - 10)) // Penalty for missing
              return false
            }
            return true
          })
          
          // Spawn new target
          if (now >= prev.nextSpawnTime) {
            const newTarget = {
              id: Math.random(),
              x: Math.random() * 280 + 20, // Random position
              y: Math.random() * 150 + 20,
              spawnTime: now
            }
            
            return {
              ...prev,
              targets: [...activeTargets, newTarget],
              nextSpawnTime: now + prev.spawnInterval,
              spawnInterval: Math.max(800, prev.spawnInterval - 50) // Speed up
            }
          }
          
          return { ...prev, targets: activeTargets }
        })
      }, 100)
      
      return () => clearInterval(interval)
    }
  }, [currentGame, isVisible, gameCompleted])

  const endGame = (completed = false) => {
    setGameCompleted(true)
    setShowFinishPrompt(false)
    const bonusPoints = completed ? (timeLeft * 10) : 0
    const generationBonus = generationComplete ? 25 : 0 // Bonus for finishing after generation
    const finalScore = score + bonusPoints + generationBonus
    onComplete?.(finalScore)
    
    if (completed) {
      toast({
        title: `${getGameTitle()} completed! Score: ${finalScore}`,
        description: generationComplete ? "Bonus for finishing after generation!" : undefined,
        status: "success",
        duration: 3000,
        position: "top"
      })
    }
  }

  const finishGameNow = () => {
    endGame(true)
  }

  // Game-specific handlers
  const handleMatchTileClick = (tileId: number) => {
    if (gameCompleted || gameSpecificData.flipped?.length >= 2) return
    
    setGameSpecificData((prev: any) => {
      const newFlipped = [...(prev.flipped || []), tileId]
      const newData = { ...prev, flipped: newFlipped }
      
      if (newFlipped.length === 2) {
        const [id1, id2] = newFlipped
        const tile1 = prev.tiles.find((t: any) => t.id === id1)
        const tile2 = prev.tiles.find((t: any) => t.id === id2)
        
        if (tile1.name === tile2.name) {
          // Match!
          newData.tiles = prev.tiles.map((t: any) => 
            t.id === id1 || t.id === id2 ? { ...t, matched: true } : t
          )
          newData.matches = prev.matches + 1
          setScore(s => s + 100)
          newData.flipped = []
          
          if (newData.matches >= 4) {
            setTimeout(() => endGame(true), 500)
          }
        } else {
          // No match
          setTimeout(() => {
            setGameSpecificData((current: any) => ({ ...current, flipped: [] }))
          }, 1000)
        }
      }
      
      return newData
    })
  }

  const handleQuickClick = (targetId: number) => {
    if (currentGame !== 'quickclick' || gameCompleted) return
    
    setGameSpecificData((prev: any) => {
      const targets = prev.targets.filter((t: any) => t.id !== targetId)
      const clicked = prev.targets.find((t: any) => t.id === targetId)
      
      if (clicked) {
        setScore(s => s + 50) // Points for successful click
        
        // Check if reached goal
        if (prev.clickedCount + 1 >= 10) {
          setTimeout(() => endGame(true), 500)
        }
        
        return {
          ...prev,
          targets,
          clickedCount: prev.clickedCount + 1
        }
      }
      
      return prev
    })
  }

  const handleCollectorIconClick = (iconId: string) => {
    setGameSpecificData((prev: any) => {
      const clickedIcon = prev.fallingIcons.find((icon: any) => icon.id === iconId)
      if (!clickedIcon) return prev
      
      const newFallingIcons = prev.fallingIcons.filter((icon: any) => icon.id !== iconId)
      
      if (clickedIcon.isLead) {
        setScore(s => s + 50)
        const newCollected = prev.collectedLeads + 1
        if (newCollected >= 10) {
          endGame(true)
        }
        return { ...prev, fallingIcons: newFallingIcons, collectedLeads: newCollected }
      } else {
        setScore(s => Math.max(0, s - 25))
        return { ...prev, fallingIcons: newFallingIcons }
      }
    })
  }

  const renderGame = () => {
    switch (currentGame) {
      case 'match':
        return (
          <Grid templateColumns="repeat(4, 1fr)" gap={2} w="full" maxW="280px">
            {gameSpecificData.tiles?.map((tile: any) => {
              const isVisible = gameSpecificData.flipped?.includes(tile.id) || tile.matched
              return (
                <GridItem key={tile.id}>
                  <Box
                    w="60px"
                    h="60px"
                    borderRadius="md"
                    cursor={tile.matched ? "default" : "pointer"}
                    onClick={() => handleMatchTileClick(tile.id)}
                    bg={isVisible ? tile.color : "gray.200"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="all 0.2s ease"
                    opacity={tile.matched ? 0.6 : 1}
                    _hover={!tile.matched ? { transform: "scale(1.05)" } : {}}
                  >
                    {isVisible && <Icon as={tile.icon} w={6} h={6} color="white" />}
                  </Box>
                </GridItem>
              )
            })}
          </Grid>
        )

      case 'quickclick':
        return (
          <VStack spacing={3}>
            <Text fontSize="sm" textAlign="center" color="gray.600">
              Click the LakeB2B logos as they appear!
            </Text>
            <Box
              position="relative"
              width="320px"
              height="200px"
              bg="gray.50"
              borderRadius="md"
              overflow="hidden"
              border="2px solid gray.200"
            >
              {gameSpecificData.targets?.map((target: any) => (
                <Box
                  key={target.id}
                  position="absolute"
                  left={`${target.x}px`}
                  top={`${target.y}px`}
                  w="50px"
                  h="50px"
                  borderRadius="full"
                  bg="purple.600"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  onClick={() => handleQuickClick(target.id)}
                  animation="pulse 1s infinite"
                  _hover={{ transform: "scale(1.1)" }}
                  transition="all 0.1s ease"
                  boxShadow="lg"
                >
                  <Text color="white" fontWeight="bold" fontSize="sm">
                    B2B
                  </Text>
                </Box>
              ))}
            </Box>
            <HStack spacing={4}>
              <Text fontSize="sm">
                Clicked: {gameSpecificData.clickedCount || 0}/10
              </Text>
              <Text fontSize="sm" color="red.500">
                Miss penalty: -10 points
              </Text>
            </HStack>
          </VStack>
        )

      case 'collector':
        return (
          <VStack spacing={3}>
            <Text fontSize="sm" textAlign="center" color="gray.600">
              Click the business icons! Avoid the spam ⚡
            </Text>
            <Box
              position="relative"
              width="320px"
              height="200px"
              bg="gray.50"
              borderRadius="md"
              overflow="hidden"
              border="2px solid gray.200"
            >
              {gameSpecificData.fallingIcons?.map((icon: any) => (
                <Box
                  key={icon.id}
                  position="absolute"
                  left={`${icon.x}px`}
                  top={`${icon.y}px`}
                  w="30px"
                  h="30px"
                  borderRadius="full"
                  bg={icon.color}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  onClick={() => handleCollectorIconClick(icon.id)}
                  _hover={{ transform: "scale(1.1)" }}
                  transition="all 0.1s ease"
                >
                  <Icon as={icon.icon} w={4} h={4} color="white" />
                </Box>
              ))}
            </Box>
            <Text fontSize="sm">
              Leads collected: {gameSpecificData.collectedLeads || 0}/10
            </Text>
          </VStack>
        )

      default:
        return null
    }
  }

  if (!isVisible) return null

  return (
    <Fade in={isVisible}>
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(0, 0, 0, 0.8)"
        zIndex={20}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
      >
        <Box
          bg="white"
          borderRadius="xl"
          p={6}
          maxW="400px"
          w="full"
          shadow="2xl"
        >
          <VStack spacing={4}>
            {/* Header */}
            <Flex w="full" justify="space-between" align="center">
              <VStack spacing={1} align="start">
                <Text fontSize="lg" fontWeight="bold" color="purple.600">
                  {getGameTitle()}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Quick game while your image generates!
                </Text>
              </VStack>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                leftIcon={<X size={16} />}
              >
                Skip
              </Button>
            </Flex>

            {/* Game Stats */}
            <HStack w="full" justify="space-between">
              <Badge colorScheme="purple" variant="subtle">
                Score: {score}
              </Badge>
              <Badge colorScheme="orange" variant="subtle">
                Time: {timeLeft}s
              </Badge>
            </HStack>

            {/* Game Area */}
            <Box minH="200px" w="full" display="flex" justifyContent="center" alignItems="center">
              {renderGame()}
            </Box>

            {/* Generation Progress */}
            <VStack w="full" spacing={2}>
              <HStack w="full" justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  Image Generation Progress
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {Math.round(generationProgress)}%
                </Text>
              </HStack>
              <Progress
                value={generationProgress}
                colorScheme="purple"
                size="sm"
                w="full"
                borderRadius="full"
              />
            </VStack>

            {/* Generation Complete - Finish Game Prompt */}
            {showFinishPrompt && !gameCompleted && (
              <Box
                bg="green.50"
                border="2px solid"
                borderColor="green.200"
                borderRadius="lg"
                p={4}
                textAlign="center"
              >
                <VStack spacing={3}>
                  <Text fontSize="md" color="green.700" fontWeight="semibold">
                    🎉 Image Generated! Your post is ready!
                  </Text>
                  <Text fontSize="sm" color="green.600">
                    Keep playing to earn bonus points, or finish now to see your image.
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={finishGameNow}
                    leftIcon={<Text>🏆</Text>}
                  >
                    Finish Game (+25 bonus!)
                  </Button>
                </VStack>
              </Box>
            )}

            {/* Game Over Message */}
            {gameCompleted && (
              <Text
                fontSize="md"
                color="green.600"
                fontWeight="semibold"
                textAlign="center"
              >
                🎉 Great job! Final score: {score}
              </Text>
            )}
          </VStack>
        </Box>
      </Box>
    </Fade>
  )
}

export default MiniGame