/**
 * SocialSpace Component
 *
 * Displays a gallery of public posts from the community.
 * Features filtering, sorting, likes, and infinite scroll.
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Image,
  Grid,
  GridItem,
  Badge,
  Select,
  Button,
  Spinner,
  Center,
  Icon,
  Flex,
  Spacer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  IconButton,
  Tooltip,
} from '@chakra-ui/react'
import toast from 'react-hot-toast'
import {
  Heart,
  Eye,
  Share2,
  Download,
  RefreshCw,
  ImageIcon,
  Sparkles,
  TrendingUp,
  Clock,
  Filter,
} from 'lucide-react'

interface Post {
  id: string
  image_url: string
  prompt: string
  headline: string | null
  style: string
  meme_format: string | null
  created_at: string
  likes_count: number
  views_count: number
}

interface SocialSpaceProps {
  maxPosts?: number
}

const STYLE_LABELS: Record<string, string> = {
  'professional-3d': 'Professional 3D',
  'newyork-cartoon': 'New York Cartoon',
  'meme-style': 'Meme Style',
  'meme-woman-cat': 'Woman Yelling at Cat',
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent', icon: Clock },
  { value: 'popular', label: 'Most Popular', icon: Heart },
  { value: 'trending', label: 'Trending', icon: TrendingUp },
]

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

const PostCard: React.FC<{
  post: Post
  onViewDetails: (post: Post) => void
  onLike: (postId: string) => Promise<boolean>
}> = ({ post, onViewDetails, onLike }) => {
  const [isLiked, setIsLiked] = useState(false)
  const [localLikes, setLocalLikes] = useState(post.likes_count)
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isLiked && !isLiking) {
      // Optimistic update
      setIsLiked(true)
      setLocalLikes(prev => prev + 1)
      setIsLiking(true)

      const success = await onLike(post.id)

      if (!success) {
        // Revert optimistic update on failure
        setIsLiked(false)
        setLocalLikes(prev => prev - 1)
      }

      setIsLiking(false)
    }
  }

  return (
    <Box
      bg="white"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      transition="all 0.2s"
      _hover={{
        boxShadow: 'md',
        transform: 'translateY(-2px)',
      }}
      cursor="pointer"
      onClick={() => onViewDetails(post)}
    >
      {/* Image */}
      <Box position="relative" paddingTop="100%" bg="gray.100">
        <Image
          src={post.image_url}
          alt={post.headline || post.prompt}
          position="absolute"
          top={0}
          left={0}
          w="100%"
          h="100%"
          objectFit="cover"
        />
        {/* Style Badge */}
        <Badge
          position="absolute"
          top={2}
          left={2}
          colorScheme="purple"
          variant="solid"
          fontSize="xs"
        >
          {STYLE_LABELS[post.style] || post.style}
        </Badge>
      </Box>

      {/* Content */}
      <Box p={3}>
        {/* Headline or Prompt Preview */}
        <Text
          fontWeight="medium"
          fontSize="sm"
          noOfLines={2}
          mb={2}
          color="gray.800"
        >
          {post.headline || post.prompt}
        </Text>

        {/* Stats and Actions */}
        <Flex align="center">
          <HStack spacing={3} fontSize="xs" color="gray.500">
            <HStack spacing={1}>
              <Icon as={Eye} boxSize={3} />
              <Text>{post.views_count}</Text>
            </HStack>
            <HStack spacing={1}>
              <Icon
                as={Heart}
                boxSize={3}
                color={isLiked ? 'red.500' : 'gray.500'}
                fill={isLiked ? 'currentColor' : 'none'}
              />
              <Text>{localLikes}</Text>
            </HStack>
          </HStack>
          <Spacer />
          <Text fontSize="xs" color="gray.400">
            {formatDate(post.created_at)}
          </Text>
        </Flex>

        {/* Action Buttons */}
        <HStack mt={2} justify="space-between">
          <Tooltip label={isLiked ? 'Liked!' : 'Like this post'}>
            <IconButton
              aria-label="Like"
              icon={<Heart size={16} />}
              size="sm"
              variant="ghost"
              colorScheme={isLiked ? 'red' : 'gray'}
              onClick={handleLike}
            />
          </Tooltip>
          <Tooltip label="Share">
            <IconButton
              aria-label="Share"
              icon={<Share2 size={16} />}
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                // Copy link to clipboard
                navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
              }}
            />
          </Tooltip>
        </HStack>
      </Box>
    </Box>
  )
}

const SocialSpace: React.FC<SocialSpaceProps> = ({ maxPosts = 50 }) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('recent')
  const [styleFilter, setStyleFilter] = useState<string>('')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const fetchPosts = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      setIsLoading(true)

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12',
        sort,
      })
      if (styleFilter) {
        params.append('style', styleFilter)
      }

      const response = await fetch(`/api/posts?${params}`)
      const data = await response.json()

      if (data.posts) {
        if (isRefresh || pageNum === 1) {
          setPosts(data.posts)
        } else {
          setPosts(prev => [...prev, ...data.posts])
        }
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Error loading posts. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }, [sort, styleFilter])

  // Initial fetch and refetch on filter/sort changes
  useEffect(() => {
    setPage(1)
    fetchPosts(1, true)
  }, [sort, styleFilter, fetchPosts])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPosts(nextPage)
  }

  const handleRefresh = () => {
    setPage(1)
    fetchPosts(1, true)
  }

  const handleViewDetails = (post: Post) => {
    setSelectedPost(post)
    onOpen()
  }

  const handleLike = async (postId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Like failed')
      }

      return true
    } catch (error) {
      console.error('Error liking post:', error)
      toast.error('Like failed. Please try again.')
      return false
    }
  }

  const handleDownload = async (post: Post) => {
    try {
      const response = await fetch(post.image_url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lakeb2b-post-${post.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Downloaded!')
    } catch (error) {
      toast.error('Download failed')
    }
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center" wrap="wrap" gap={4}>
          <HStack>
            <Icon as={Sparkles} color="purple.500" boxSize={6} />
            <Heading size="lg" color="gray.800">
              Community Gallery
            </Heading>
          </HStack>
          <Spacer />
          <HStack spacing={3}>
            {/* Style Filter */}
            <HStack>
              <Icon as={Filter} boxSize={4} color="gray.500" />
              <Select
                size="sm"
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value)}
                minW="150px"
              >
                <option value="">All Styles</option>
                {Object.entries(STYLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </HStack>

            {/* Sort */}
            <Select
              size="sm"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              minW="140px"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            {/* Refresh */}
            <Tooltip label="Refresh">
              <IconButton
                aria-label="Refresh"
                icon={<RefreshCw size={16} />}
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                isLoading={isLoading}
              />
            </Tooltip>
          </HStack>
        </Flex>

        {/* Posts Grid */}
        {isLoading && posts.length === 0 ? (
          <Center py={12}>
            <VStack spacing={4}>
              <Spinner size="xl" color="purple.500" />
              <Text color="gray.500">Loading community posts...</Text>
            </VStack>
          </Center>
        ) : posts.length === 0 ? (
          <Center py={12}>
            <VStack spacing={4}>
              <Icon as={ImageIcon} boxSize={12} color="gray.300" />
              <Text color="gray.500" textAlign="center">
                No posts yet.
                <br />
                Be the first to share your creation!
              </Text>
            </VStack>
          </Center>
        ) : (
          <>
            <Grid
              templateColumns={{
                base: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              }}
              gap={4}
            >
              {posts.map((post) => (
                <GridItem key={post.id}>
                  <PostCard
                    post={post}
                    onViewDetails={handleViewDetails}
                    onLike={handleLike}
                  />
                </GridItem>
              ))}
            </Grid>

            {/* Load More */}
            {hasMore && posts.length < maxPosts && (
              <Center pt={4}>
                <Button
                  colorScheme="purple"
                  variant="outline"
                  onClick={handleLoadMore}
                  isLoading={isLoading}
                  loadingText="Loading..."
                >
                  Load More
                </Button>
              </Center>
            )}
          </>
        )}
      </VStack>

      {/* Post Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedPost?.headline || 'Post Details'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedPost && (
              <VStack spacing={4} align="stretch">
                {/* Image */}
                <Image
                  src={selectedPost.image_url}
                  alt={selectedPost.headline || selectedPost.prompt}
                  borderRadius="md"
                  w="100%"
                />

                {/* Details */}
                <Box>
                  <Badge colorScheme="purple" mb={2}>
                    {STYLE_LABELS[selectedPost.style] || selectedPost.style}
                  </Badge>
                  <Text fontSize="sm" color="gray.600">
                    {selectedPost.prompt}
                  </Text>
                </Box>

                {/* Stats */}
                <HStack spacing={4} fontSize="sm" color="gray.500">
                  <HStack>
                    <Icon as={Eye} boxSize={4} />
                    <Text>{selectedPost.views_count} views</Text>
                  </HStack>
                  <HStack>
                    <Icon as={Heart} boxSize={4} />
                    <Text>{selectedPost.likes_count} likes</Text>
                  </HStack>
                  <Text>{formatDate(selectedPost.created_at)}</Text>
                </HStack>

                {/* Actions */}
                <HStack spacing={3}>
                  <Button
                    leftIcon={<Download size={16} />}
                    colorScheme="purple"
                    size="sm"
                    onClick={() => handleDownload(selectedPost)}
                  >
                    Download
                  </Button>
                  <Button
                    leftIcon={<Share2 size={16} />}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/post/${selectedPost.id}`
                      )
                      toast.success('Link copied!')
                    }}
                  >
                    Share
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default SocialSpace
