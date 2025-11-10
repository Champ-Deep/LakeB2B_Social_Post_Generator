import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Badge,
  Spinner,
  Center,
  Input,
  InputGroup,
  InputLeftElement,
  Wrap,
  WrapItem,
  Collapse,
  useDisclosure,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  Flex
} from '@chakra-ui/react'
import { 
  TrendingUp, 
  Search, 
  Hash, 
  Calendar,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Globe,
  Users
} from 'lucide-react'

interface TrendingTopic {
  id: string
  title: string
  description: string
  category: 'business' | 'technology' | 'marketing' | 'social' | 'industry'
  engagement: number
  trending_since: string
  keywords: string[]
  suggestion: string
}

interface TrendingTopicsProps {
  onTopicSelect?: (topic: TrendingTopic) => void
  compact?: boolean
}

// Mock trending topics data (in production, this would come from APIs like Twitter, Google Trends, etc.)
const mockTrendingTopics: TrendingTopic[] = [
  {
    id: '1',
    title: 'AI-Powered Sales Automation',
    description: 'Businesses are increasingly adopting AI tools to streamline sales processes and improve conversion rates.',
    category: 'technology',
    engagement: 1250,
    trending_since: '2 hours ago',
    keywords: ['AI', 'sales automation', 'conversion', 'CRM', 'productivity'],
    suggestion: 'How AI is revolutionizing our sales process - and the results might surprise you! 📈'
  },
  {
    id: '2',
    title: 'Remote Work Culture Evolution',
    description: 'Companies are redefining workplace culture for distributed teams and hybrid work models.',
    category: 'business',
    engagement: 980,
    trending_since: '4 hours ago',
    keywords: ['remote work', 'company culture', 'hybrid teams', 'productivity', 'collaboration'],
    suggestion: 'Building a winning remote culture: 5 strategies that transformed our team dynamics 💼'
  },
  {
    id: '3',
    title: 'Sustainable Business Practices',
    description: 'ESG initiatives and sustainable business models are becoming competitive advantages.',
    category: 'business',
    engagement: 850,
    trending_since: '6 hours ago',
    keywords: ['sustainability', 'ESG', 'green business', 'corporate responsibility', 'environment'],
    suggestion: 'Going green isn\'t just good for the planet - it\'s great for business. Here\'s our journey... 🌱'
  },
  {
    id: '4',
    title: 'Customer Data Privacy',
    description: 'New regulations and consumer awareness are reshaping how businesses handle customer data.',
    category: 'technology',
    engagement: 720,
    trending_since: '8 hours ago',
    keywords: ['data privacy', 'GDPR', 'customer trust', 'security', 'compliance'],
    suggestion: 'Privacy-first marketing: How we built trust while growing our customer base 🔒'
  },
  {
    id: '5',
    title: 'B2B Video Marketing',
    description: 'Video content is becoming essential for B2B marketing and lead generation strategies.',
    category: 'marketing',
    engagement: 690,
    trending_since: '12 hours ago',
    keywords: ['video marketing', 'B2B content', 'lead generation', 'social media', 'engagement'],
    suggestion: 'Why video content just became our #1 lead generation tool (and how to start today) 🎥'
  }
]

const TrendingTopics: React.FC<TrendingTopicsProps> = ({ onTopicSelect, compact = false }) => {
  const [topics, setTopics] = useState<TrendingTopic[]>([])
  const [filteredTopics, setFilteredTopics] = useState<TrendingTopic[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: !compact })

  useEffect(() => {
    loadTrendingTopics()
  }, [])

  useEffect(() => {
    filterTopics()
  }, [topics, searchQuery, selectedCategory])

  const loadTrendingTopics = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setTopics(mockTrendingTopics)
    setLoading(false)
  }

  const filterTopics = () => {
    let filtered = topics

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(topic =>
        topic.title.toLowerCase().includes(query) ||
        topic.description.toLowerCase().includes(query) ||
        topic.keywords.some(keyword => keyword.toLowerCase().includes(query))
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(topic => topic.category === selectedCategory)
    }

    setFilteredTopics(filtered)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      business: 'blue',
      technology: 'purple',
      marketing: 'green',
      social: 'pink',
      industry: 'orange'
    }
    return colors[category] || 'gray'
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'business':
        return <BarChart3 size={12} />
      case 'technology':
        return <Sparkles size={12} />
      case 'marketing':
        return <Users size={12} />
      case 'social':
        return <Globe size={12} />
      default:
        return <Hash size={12} />
    }
  }

  const handleTopicSelect = (topic: TrendingTopic) => {
    onTopicSelect?.(topic)
  }

  const categories = ['business', 'technology', 'marketing', 'social', 'industry']

  return (
    <Box bg="white" borderRadius="lg" boxShadow="md" overflow="hidden">
      {/* Header */}
      <Box p={4} bg="gradient.light" borderBottom="1px" borderColor="gray.200">
        <HStack justify="space-between">
          <HStack spacing={2}>
            <TrendingUp color="#6B46C1" size={20} />
            <Heading size="md" color="gray.800">
              Trending Topics
            </Heading>
            <Badge colorScheme="purple" variant="subtle">
              Live
            </Badge>
          </HStack>
          <HStack spacing={2}>
            <Tooltip label="Refresh topics">
              <IconButton
                aria-label="Refresh"
                icon={<RefreshCw size={16} />}
                size="sm"
                variant="ghost"
                onClick={loadTrendingTopics}
                isLoading={loading}
              />
            </Tooltip>
            {compact && (
              <IconButton
                aria-label={isOpen ? "Collapse" : "Expand"}
                icon={isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                size="sm"
                variant="ghost"
                onClick={onToggle}
              />
            )}
          </HStack>
        </HStack>
      </Box>

      <Collapse in={isOpen}>
        <Box p={4}>
          {/* Search and Filters */}
          <VStack spacing={4} mb={6}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Search color="gray.400" size={16} />
              </InputLeftElement>
              <Input
                placeholder="Search trending topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
              />
            </InputGroup>

            <Wrap spacing={2}>
              <WrapItem>
                <Button
                  size="xs"
                  variant={selectedCategory === null ? 'solid' : 'outline'}
                  colorScheme="purple"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Topics
                </Button>
              </WrapItem>
              {categories.map(category => (
                <WrapItem key={category}>
                  <Button
                    size="xs"
                    variant={selectedCategory === category ? 'solid' : 'outline'}
                    colorScheme={getCategoryColor(category)}
                    leftIcon={getCategoryIcon(category)}
                    onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
          </VStack>

          {/* Topics List */}
          {loading ? (
            <Center py={8}>
              <VStack spacing={4}>
                <Spinner size="lg" color="purple.500" />
                <Text color="gray.600">Loading trending topics...</Text>
              </VStack>
            </Center>
          ) : filteredTopics.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text>No trending topics found for your search criteria.</Text>
            </Alert>
          ) : (
            <VStack spacing={4} align="stretch">
              {filteredTopics.map(topic => (
                <Box
                  key={topic.id}
                  p={4}
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  _hover={{ 
                    borderColor: 'purple.300',
                    boxShadow: 'md',
                    transform: 'translateY(-1px)'
                  }}
                  transition="all 0.2s"
                  cursor="pointer"
                  onClick={() => handleTopicSelect(topic)}
                >
                  <VStack align="stretch" spacing={3}>
                    {/* Header */}
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack spacing={2}>
                          <Text fontWeight="semibold" fontSize="sm" color="gray.800">
                            {topic.title}
                          </Text>
                          <Badge 
                            colorScheme={getCategoryColor(topic.category)} 
                            variant="subtle"
                            size="sm"
                          >
                            <HStack spacing={1}>
                              {getCategoryIcon(topic.category)}
                              <Text fontSize="xs">
                                {topic.category}
                              </Text>
                            </HStack>
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.600">
                          {topic.description}
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Metrics */}
                    <HStack spacing={4} fontSize="xs" color="gray.500">
                      <HStack spacing={1}>
                        <TrendingUp size={12} />
                        <Text>{topic.engagement} mentions</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <Calendar size={12} />
                        <Text>Trending {topic.trending_since}</Text>
                      </HStack>
                    </HStack>

                    {/* Keywords */}
                    <Wrap spacing={1}>
                      {topic.keywords.slice(0, 4).map(keyword => (
                        <WrapItem key={keyword}>
                          <Badge variant="outline" colorScheme="gray" fontSize="xs">
                            #{keyword}
                          </Badge>
                        </WrapItem>
                      ))}
                    </Wrap>

                    {/* Suggested Post */}
                    <Box
                      p={3}
                      bg="purple.50"
                      borderRadius="md"
                      border="1px"
                      borderColor="purple.200"
                    >
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        💡 Suggested post:
                      </Text>
                      <Text fontSize="sm" color="gray.700" fontStyle="italic">
                        "{topic.suggestion}"
                      </Text>
                    </Box>
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </Collapse>
    </Box>
  )
}

export default TrendingTopics