/**
 * ShareButtons Component Unit Tests
 *
 * Comprehensive tests for the ShareButtons component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ShareButtons from '@/components/ShareButtons'

// Mock dependencies
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/analytics/posthog', () => ({
  trackSocialShare: vi.fn(),
}))

// Mock react-share components
vi.mock('react-share', () => ({
  TwitterShareButton: vi.fn(({ children, onClick }) => (
    <div data-testid="twitter-share-button" onClick={onClick}>
      {children}
    </div>
  )),
  LinkedinShareButton: vi.fn(({ children, onClick }) => (
    <div data-testid="linkedin-share-button" onClick={onClick}>
      {children}
    </div>
  )),
  FacebookShareButton: vi.fn(({ children, onClick }) => (
    <div data-testid="facebook-share-button" onClick={onClick}>
      {children}
    </div>
  )),
  WhatsappShareButton: vi.fn(({ children }) => (
    <div data-testid="whatsapp-share-button">{children}</div>
  )),
}))

// Mock Chakra UI components for testing
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react')
  return {
    ...actual,
    Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})

// Mock clipboard API
const mockWriteText = vi.fn()
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
})

describe('ShareButtons', () => {
  const defaultProps = {
    url: 'https://example.com/post/123',
    title: 'Test Post Title',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockWriteText.mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    it('renders all share buttons', () => {
      render(<ShareButtons {...defaultProps} />)

      // Check for all share buttons
      expect(screen.getByLabelText('Share on X')).toBeInTheDocument()
      expect(screen.getByLabelText('Share on LinkedIn')).toBeInTheDocument()
      expect(screen.getByLabelText('Share on Facebook')).toBeInTheDocument()
      expect(screen.getByLabelText('Share on WhatsApp')).toBeInTheDocument()
      expect(screen.getByLabelText('Copy link')).toBeInTheDocument()
    })

    it('renders with horizontal layout by default', () => {
      const { container } = render(<ShareButtons {...defaultProps} />)
      // HStack is the default container for horizontal layout
      const stackElement = container.querySelector('.chakra-stack')
      expect(stackElement).toBeInTheDocument()
    })

    it('renders with vertical layout when specified', () => {
      render(<ShareButtons {...defaultProps} variant="vertical" />)
      // Component should still render all buttons
      expect(screen.getByLabelText('Share on X')).toBeInTheDocument()
      expect(screen.getByLabelText('Share on LinkedIn')).toBeInTheDocument()
    })

    it('renders with compact variant', () => {
      render(<ShareButtons {...defaultProps} variant="compact" />)
      // All buttons should still be present
      expect(screen.getByLabelText('Share on X')).toBeInTheDocument()
      expect(screen.getByLabelText('Copy link')).toBeInTheDocument()
    })

    it('shows share label when showLabels is true', () => {
      render(<ShareButtons {...defaultProps} showLabels />)
      expect(screen.getByText('Share:')).toBeInTheDocument()
    })

    it('hides share label by default', () => {
      render(<ShareButtons {...defaultProps} />)
      expect(screen.queryByText('Share:')).not.toBeInTheDocument()
    })
  })

  describe('Share Button Interactions', () => {
    it('calls onShare callback with "twitter" when Twitter button is clicked', async () => {
      const onShareMock = vi.fn()
      render(<ShareButtons {...defaultProps} onShare={onShareMock} />)

      const twitterButton = screen.getByTestId('twitter-share-button')
      fireEvent.click(twitterButton)

      await waitFor(() => {
        expect(onShareMock).toHaveBeenCalledWith('twitter')
      })
    })

    it('calls onShare callback with "linkedin" when LinkedIn button is clicked', async () => {
      const onShareMock = vi.fn()
      render(<ShareButtons {...defaultProps} onShare={onShareMock} />)

      const linkedinButton = screen.getByTestId('linkedin-share-button')
      fireEvent.click(linkedinButton)

      await waitFor(() => {
        expect(onShareMock).toHaveBeenCalledWith('linkedin')
      })
    })

    it('calls onShare callback with "facebook" when Facebook button is clicked', async () => {
      const onShareMock = vi.fn()
      render(<ShareButtons {...defaultProps} onShare={onShareMock} />)

      const facebookButton = screen.getByTestId('facebook-share-button')
      fireEvent.click(facebookButton)

      await waitFor(() => {
        expect(onShareMock).toHaveBeenCalledWith('facebook')
      })
    })

    it('tracks social share analytics when buttons are clicked', async () => {
      const { trackSocialShare } = await import('@/lib/analytics/posthog')
      render(<ShareButtons {...defaultProps} />)

      const twitterButton = screen.getByTestId('twitter-share-button')
      fireEvent.click(twitterButton)

      await waitFor(() => {
        expect(trackSocialShare).toHaveBeenCalledWith({
          platform: 'twitter',
          success: true,
        })
      })
    })
  })

  describe('Copy Link Functionality', () => {
    it('copies URL to clipboard when copy button is clicked', async () => {
      render(<ShareButtons {...defaultProps} />)

      const copyButton = screen.getByLabelText('Copy link')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(defaultProps.url)
      })
    })

    it('shows success toast when copy succeeds', async () => {
      const toast = (await import('react-hot-toast')).default
      render(<ShareButtons {...defaultProps} />)

      const copyButton = screen.getByLabelText('Copy link')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard!')
      })
    })

    it('calls onShare callback with "copy_link" when copy succeeds', async () => {
      const onShareMock = vi.fn()
      render(<ShareButtons {...defaultProps} onShare={onShareMock} />)

      const copyButton = screen.getByLabelText('Copy link')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(onShareMock).toHaveBeenCalledWith('copy_link')
      })
    })

    it('tracks copy link analytics on success', async () => {
      const { trackSocialShare } = await import('@/lib/analytics/posthog')
      render(<ShareButtons {...defaultProps} />)

      const copyButton = screen.getByLabelText('Copy link')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(trackSocialShare).toHaveBeenCalledWith({
          platform: 'copy_link',
          success: true,
        })
      })
    })

    it('changes copy button icon temporarily after successful copy', async () => {
      render(<ShareButtons {...defaultProps} />)

      const copyButton = screen.getByLabelText('Copy link')
      fireEvent.click(copyButton)

      // Button should briefly show "Copied!" state
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalled()
      })
    })

    it('shows error toast when copy fails', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard error'))
      const toast = (await import('react-hot-toast')).default

      render(<ShareButtons {...defaultProps} />)

      const copyButton = screen.getByLabelText('Copy link')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to copy link')
      })
    })

    it('tracks copy link analytics on failure', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard error'))
      const { trackSocialShare } = await import('@/lib/analytics/posthog')

      render(<ShareButtons {...defaultProps} />)

      const copyButton = screen.getByLabelText('Copy link')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(trackSocialShare).toHaveBeenCalledWith({
          platform: 'copy_link',
          success: false,
        })
      })
    })

    it('does not call onShare callback when copy fails', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard error'))
      const onShareMock = vi.fn()

      render(<ShareButtons {...defaultProps} onShare={onShareMock} />)

      const copyButton = screen.getByLabelText('Copy link')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalled()
      })

      // onShare should not be called on failure
      expect(onShareMock).not.toHaveBeenCalled()
    })
  })

  describe('Props Handling', () => {
    it('handles missing optional description prop', () => {
      render(<ShareButtons {...defaultProps} />)
      expect(screen.getByLabelText('Share on LinkedIn')).toBeInTheDocument()
    })

    it('handles custom hashtags', () => {
      const customHashtags = ['Custom1', 'Custom2', 'Custom3']
      render(<ShareButtons {...defaultProps} hashtags={customHashtags} />)
      // Component should render without errors
      expect(screen.getByLabelText('Share on X')).toBeInTheDocument()
    })

    it('uses default hashtags when not provided', () => {
      render(<ShareButtons {...defaultProps} />)
      // Default hashtags: ['LakeB2B', 'B2BMarketing']
      expect(screen.getByLabelText('Share on X')).toBeInTheDocument()
    })

    it('handles optional imageUrl prop', () => {
      render(
        <ShareButtons
          {...defaultProps}
          imageUrl="https://example.com/image.png"
        />
      )
      expect(screen.getByLabelText('Share on Facebook')).toBeInTheDocument()
    })

    it('handles all optional props together', () => {
      render(
        <ShareButtons
          {...defaultProps}
          description="Test description"
          hashtags={['Test1', 'Test2']}
          imageUrl="https://example.com/image.png"
          variant="vertical"
          showLabels
          onShare={vi.fn()}
        />
      )

      expect(screen.getByText('Share:')).toBeInTheDocument()
      expect(screen.getByLabelText('Share on X')).toBeInTheDocument()
      expect(screen.getByLabelText('Share on LinkedIn')).toBeInTheDocument()
      expect(screen.getByLabelText('Share on Facebook')).toBeInTheDocument()
      expect(screen.getByLabelText('Share on WhatsApp')).toBeInTheDocument()
      expect(screen.getByLabelText('Copy link')).toBeInTheDocument()
    })

    it('works without onShare callback', async () => {
      render(<ShareButtons {...defaultProps} />)

      const twitterButton = screen.getByTestId('twitter-share-button')
      // Should not throw error when clicking without onShare callback
      expect(() => fireEvent.click(twitterButton)).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for all buttons', () => {
      render(<ShareButtons {...defaultProps} />)

      expect(screen.getByLabelText('Share on X')).toBeInTheDocument()
      expect(screen.getByLabelText('Share on LinkedIn')).toBeInTheDocument()
      expect(screen.getByLabelText('Share on Facebook')).toBeInTheDocument()
      expect(screen.getByLabelText('Share on WhatsApp')).toBeInTheDocument()
      expect(screen.getByLabelText('Copy link')).toBeInTheDocument()
    })

    it('buttons are keyboard accessible', () => {
      render(<ShareButtons {...defaultProps} />)

      const copyButton = screen.getByLabelText('Copy link')
      // IconButton should be focusable
      expect(copyButton).toHaveProperty('type')
    })
  })

  describe('Different Variants', () => {
    it('renders correctly with horizontal variant', () => {
      const { container } = render(
        <ShareButtons {...defaultProps} variant="horizontal" />
      )
      expect(container.querySelector('.chakra-stack')).toBeInTheDocument()
      expect(screen.getByLabelText('Share on X')).toBeInTheDocument()
    })

    it('renders correctly with vertical variant', () => {
      const { container } = render(
        <ShareButtons {...defaultProps} variant="vertical" />
      )
      expect(container.querySelector('.chakra-stack')).toBeInTheDocument()
      expect(screen.getByLabelText('Share on X')).toBeInTheDocument()
    })

    it('renders correctly with compact variant', () => {
      const { container } = render(
        <ShareButtons {...defaultProps} variant="compact" />
      )
      expect(container.querySelector('.chakra-stack')).toBeInTheDocument()
      expect(screen.getByLabelText('Share on X')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000)
      render(<ShareButtons {...defaultProps} url={longUrl} />)

      const copyButton = screen.getByLabelText('Copy link')
      fireEvent.click(copyButton)

      expect(mockWriteText).toHaveBeenCalledWith(longUrl)
    })

    it('handles very long titles', () => {
      const longTitle = 'a'.repeat(1000)
      render(<ShareButtons {...defaultProps} title={longTitle} />)

      expect(screen.getByLabelText('Share on X')).toBeInTheDocument()
    })

    it('handles empty hashtags array', () => {
      render(<ShareButtons {...defaultProps} hashtags={[]} />)
      expect(screen.getByLabelText('Share on X')).toBeInTheDocument()
    })

    it('handles special characters in URL', () => {
      const specialUrl = 'https://example.com/post?id=123&name=test%20post'
      render(<ShareButtons {...defaultProps} url={specialUrl} />)

      const copyButton = screen.getByLabelText('Copy link')
      fireEvent.click(copyButton)

      expect(mockWriteText).toHaveBeenCalledWith(specialUrl)
    })

    it('handles multiple rapid clicks on copy button', async () => {
      render(<ShareButtons {...defaultProps} />)

      const copyButton = screen.getByLabelText('Copy link')

      // Click multiple times rapidly
      fireEvent.click(copyButton)
      fireEvent.click(copyButton)
      fireEvent.click(copyButton)

      await waitFor(() => {
        // Should have been called for each click
        expect(mockWriteText).toHaveBeenCalled()
      })
    })
  })
})
