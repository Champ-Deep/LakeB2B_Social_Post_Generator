import React, { useState, useRef } from 'react'
import {
  Box,
  VStack,
  HStack,
  Button,
  ButtonGroup,
  Textarea,
  IconButton,
  Tooltip,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Type,
  ChevronDown,
  Undo,
  Redo
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  minHeight?: string
  label?: string
}

interface FormatAction {
  type: 'bold' | 'italic' | 'underline' | 'bullet' | 'number' | 'quote' | 'heading' | 'align'
  value?: string
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type your message...',
  maxLength = 500,
  minHeight = '120px',
  label
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [history, setHistory] = useState<string[]>([value])
  const [historyIndex, setHistoryIndex] = useState(0)

  const borderColor = useColorModeValue('gray.300', 'gray.600')
  const toolbarBg = useColorModeValue('gray.50', 'gray.700')
  const hoverBg = useColorModeValue('gray.100', 'gray.600')

  // Track selection changes
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setSelection({
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      })
    }
  }

  // Add to history for undo/redo
  const addToHistory = (newValue: string) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newValue)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // Apply formatting to selected text or insert at cursor
  const applyFormat = (action: FormatAction) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const beforeText = value.substring(0, start)
    const afterText = value.substring(end)

    let newText = ''
    let newCursorPos = start

    switch (action.type) {
      case 'bold':
        if (selectedText) {
          newText = `${beforeText}**${selectedText}**${afterText}`
          newCursorPos = end + 4
        } else {
          newText = `${beforeText}****${afterText}`
          newCursorPos = start + 2
        }
        break

      case 'italic':
        if (selectedText) {
          newText = `${beforeText}_${selectedText}_${afterText}`
          newCursorPos = end + 2
        } else {
          newText = `${beforeText}__${afterText}`
          newCursorPos = start + 1
        }
        break

      case 'underline':
        // Using HTML-style for underline (not standard markdown)
        if (selectedText) {
          newText = `${beforeText}<u>${selectedText}</u>${afterText}`
          newCursorPos = end + 7
        } else {
          newText = `${beforeText}<u></u>${afterText}`
          newCursorPos = start + 3
        }
        break

      case 'bullet':
        const bulletText = selectedText || 'List item'
        newText = `${beforeText}• ${bulletText}${afterText}`
        newCursorPos = selectedText ? end + 2 : start + 11
        break

      case 'number':
        const numberText = selectedText || 'List item'
        newText = `${beforeText}1. ${numberText}${afterText}`
        newCursorPos = selectedText ? end + 3 : start + 12
        break

      case 'quote':
        const quoteText = selectedText || 'Quote text'
        newText = `${beforeText}> ${quoteText}${afterText}`
        newCursorPos = selectedText ? end + 2 : start + 12
        break

      case 'heading':
        const level = action.value || '1'
        const headingPrefix = '#'.repeat(parseInt(level)) + ' '
        const headingText = selectedText || 'Heading'
        newText = `${beforeText}${headingPrefix}${headingText}${afterText}`
        newCursorPos = selectedText ? end + headingPrefix.length : start + headingPrefix.length + 7
        break

      default:
        return
    }

    addToHistory(newText)
    onChange(newText)

    // Restore cursor position
    setTimeout(() => {
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  // Undo/Redo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      onChange(history[newIndex])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      onChange(history[newIndex])
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      onChange(newValue)
      // Only add to history on significant changes
      if (Math.abs(newValue.length - value.length) > 3) {
        addToHistory(newValue)
      }
    }
  }

  return (
    <VStack spacing={0} align="stretch">
      {label && (
        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
          {label}
        </Text>
      )}
      
      {/* Toolbar */}
      <Box
        bg={toolbarBg}
        borderTopRadius="md"
        border="1px"
        borderColor={borderColor}
        borderBottom="none"
        p={2}
      >
        <HStack spacing={2} wrap="wrap">
          {/* Text Formatting */}
          <ButtonGroup size="sm" isAttached>
            <Tooltip label="Bold (Ctrl+B)">
              <IconButton
                aria-label="Bold"
                icon={<Bold size={14} />}
                onClick={() => applyFormat({ type: 'bold' })}
                variant="ghost"
                _hover={{ bg: hoverBg }}
              />
            </Tooltip>
            <Tooltip label="Italic (Ctrl+I)">
              <IconButton
                aria-label="Italic"
                icon={<Italic size={14} />}
                onClick={() => applyFormat({ type: 'italic' })}
                variant="ghost"
                _hover={{ bg: hoverBg }}
              />
            </Tooltip>
            <Tooltip label="Underline (Ctrl+U)">
              <IconButton
                aria-label="Underline"
                icon={<Underline size={14} />}
                onClick={() => applyFormat({ type: 'underline' })}
                variant="ghost"
                _hover={{ bg: hoverBg }}
              />
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" height="24px" />

          {/* Lists */}
          <ButtonGroup size="sm" isAttached>
            <Tooltip label="Bullet List">
              <IconButton
                aria-label="Bullet List"
                icon={<List size={14} />}
                onClick={() => applyFormat({ type: 'bullet' })}
                variant="ghost"
                _hover={{ bg: hoverBg }}
              />
            </Tooltip>
            <Tooltip label="Numbered List">
              <IconButton
                aria-label="Numbered List"
                icon={<ListOrdered size={14} />}
                onClick={() => applyFormat({ type: 'number' })}
                variant="ghost"
                _hover={{ bg: hoverBg }}
              />
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" height="24px" />

          {/* Quote and Heading */}
          <Tooltip label="Quote">
            <IconButton
              aria-label="Quote"
              icon={<Quote size={14} />}
              onClick={() => applyFormat({ type: 'quote' })}
              variant="ghost"
              size="sm"
              _hover={{ bg: hoverBg }}
            />
          </Tooltip>

          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDown size={12} />}
              variant="ghost"
              size="sm"
              _hover={{ bg: hoverBg }}
            >
              <HStack spacing={1}>
                <Type size={14} />
                <Text fontSize="xs">H</Text>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => applyFormat({ type: 'heading', value: '1' })}>
                Heading 1
              </MenuItem>
              <MenuItem onClick={() => applyFormat({ type: 'heading', value: '2' })}>
                Heading 2
              </MenuItem>
              <MenuItem onClick={() => applyFormat({ type: 'heading', value: '3' })}>
                Heading 3
              </MenuItem>
            </MenuList>
          </Menu>

          <Box flex={1} />

          {/* Undo/Redo */}
          <ButtonGroup size="sm" isAttached>
            <Tooltip label="Undo (Ctrl+Z)">
              <IconButton
                aria-label="Undo"
                icon={<Undo size={14} />}
                onClick={handleUndo}
                isDisabled={historyIndex <= 0}
                variant="ghost"
                _hover={{ bg: hoverBg }}
              />
            </Tooltip>
            <Tooltip label="Redo (Ctrl+Y)">
              <IconButton
                aria-label="Redo"
                icon={<Redo size={14} />}
                onClick={handleRedo}
                isDisabled={historyIndex >= history.length - 1}
                variant="ghost"
                _hover={{ bg: hoverBg }}
              />
            </Tooltip>
          </ButtonGroup>
        </HStack>
      </Box>

      {/* Text Area */}
      <Box position="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onSelect={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          placeholder={placeholder}
          minHeight={minHeight}
          borderTopRadius="none"
          borderColor={borderColor}
          resize="vertical"
          _focus={{
            borderColor: 'purple.400',
            boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)'
          }}
          onKeyDown={(e) => {
            // Handle keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
              switch (e.key.toLowerCase()) {
                case 'b':
                  e.preventDefault()
                  applyFormat({ type: 'bold' })
                  break
                case 'i':
                  e.preventDefault()
                  applyFormat({ type: 'italic' })
                  break
                case 'u':
                  e.preventDefault()
                  applyFormat({ type: 'underline' })
                  break
                case 'z':
                  e.preventDefault()
                  if (e.shiftKey) {
                    handleRedo()
                  } else {
                    handleUndo()
                  }
                  break
                case 'y':
                  e.preventDefault()
                  handleRedo()
                  break
              }
            }
          }}
        />
        
        {/* Character Counter */}
        <Text
          position="absolute"
          bottom={2}
          right={3}
          fontSize="xs"
          color={value.length > maxLength * 0.9 ? 'red.500' : 'gray.500'}
          bg="white"
          px={1}
          borderRadius="sm"
        >
          {value.length}/{maxLength}
        </Text>
      </Box>
    </VStack>
  )
}

export default RichTextEditor