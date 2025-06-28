import { useRef, useEffect, useState, useCallback } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SQLWhereEditorSimpleProps {
  value: string
  onChange: (value: string) => void
  onCommit: () => void
  schema?: any
  disabled?: boolean
  onAiPrompt?: (position: { top: number; left: number }) => void
}

interface Suggestion {
  label: string
  value: string
  type: 'column' | 'operator' | 'keyword' | 'value'
  detail?: string
}

export function SQLWhereEditorSimple({
  value,
  onChange,
  onCommit,
  schema,
  disabled = false,
  onAiPrompt
}: SQLWhereEditorSimpleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Generate suggestions based on input
  const generateSuggestions = useCallback((input: string, position: number) => {
    const suggestions: Suggestion[] = []
    
    // Get the word at cursor position
    const beforeCursor = input.substring(0, position)
    const words = beforeCursor.split(/\s+/)
    const currentWord = words[words.length - 1]?.toLowerCase() || ''
    
    // Check context
    const hasOperator = /[=!<>]+\s*$/.test(beforeCursor)
    const afterLike = /\slike\s+$/i.test(beforeCursor)
    const afterIn = /\sin\s*\(?$/i.test(beforeCursor)
    const needsValue = hasOperator || afterLike || afterIn
    const atStart = beforeCursor.trim() === '' || beforeCursor.trim() === currentWord
    const afterConnector = /\s(and|or)\s+$/i.test(beforeCursor)
    
    // Suggest columns
    if ((atStart || afterConnector) && schema?.columns && !needsValue) {
      schema.columns.forEach((col: any) => {
        if (!currentWord || col.name.toLowerCase().startsWith(currentWord)) {
          suggestions.push({
            label: col.name,
            value: col.name,
            type: 'column',
            detail: col.dataType
          })
        }
      })
    }
    
    // Suggest operators
    if (!needsValue && !atStart && !afterConnector && currentWord.length === 0) {
      const operators = [
        { label: '=', value: ' = ' },
        { label: '!=', value: ' != ' },
        { label: '>', value: ' > ' },
        { label: '<', value: ' < ' },
        { label: '>=', value: ' >= ' },
        { label: '<=', value: ' <= ' },
        { label: 'LIKE', value: ' LIKE ' },
        { label: 'IN', value: ' IN (' },
        { label: 'IS NULL', value: ' IS NULL' },
        { label: 'IS NOT NULL', value: ' IS NOT NULL' }
      ]
      operators.forEach(op => {
        suggestions.push({
          label: op.label,
          value: op.value,
          type: 'operator'
        })
      })
    }
    
    // Suggest values after LIKE
    if (afterLike) {
      suggestions.push({
        label: "'%...%'",
        value: "'%%'",
        type: 'value',
        detail: 'Contains pattern'
      })
      suggestions.push({
        label: "'...%'",
        value: "'%'",
        type: 'value',
        detail: 'Starts with'
      })
      suggestions.push({
        label: "'%...'",
        value: "'%'",
        type: 'value',
        detail: 'Ends with'
      })
    }
    
    // Suggest AND/OR
    if (beforeCursor.trim() && !needsValue && !afterConnector) {
      ['AND', 'OR'].forEach(kw => {
        if (!currentWord || kw.toLowerCase().startsWith(currentWord)) {
          suggestions.push({
            label: kw,
            value: ' ' + kw + ' ',
            type: 'keyword'
          })
        }
      })
    }
    
    return suggestions.slice(0, 10) // Limit suggestions
  }, [schema])
  
  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const position = e.target.selectionStart || 0
    
    onChange(newValue)
    setCursorPosition(position)
    
    // Generate and show suggestions
    const newSuggestions = generateSuggestions(newValue, position)
    setSuggestions(newSuggestions)
    setIsOpen(newSuggestions.length > 0)
    setSelectedIndex(0)
  }, [onChange, generateSuggestions])
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        onCommit()
      } else if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (onAiPrompt && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          onAiPrompt({
            top: rect.bottom + 5,
            left: rect.left
          })
        }
      }
      return
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % suggestions.length)
        break
        
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
        break
        
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        if (suggestions[selectedIndex]) {
          insertSuggestion(suggestions[selectedIndex])
        }
        break
        
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
    }
  }, [isOpen, suggestions, selectedIndex, onCommit, onAiPrompt])
  
  // Insert suggestion at cursor position
  const insertSuggestion = useCallback((suggestion: Suggestion) => {
    if (!inputRef.current) return
    
    const input = inputRef.current
    const start = input.selectionStart || 0
    const end = input.selectionEnd || 0
    
    // Find the word boundaries
    const beforeCursor = value.substring(0, start)
    const afterCursor = value.substring(end)
    const words = beforeCursor.split(/\s+/)
    const currentWord = words[words.length - 1] || ''
    const beforeWord = beforeCursor.substring(0, beforeCursor.length - currentWord.length)
    
    // Construct new value
    let newValue = beforeWord + suggestion.value
    
    // Handle special cases
    if (suggestion.type === 'value' && suggestion.value.includes('%')) {
      // Place cursor between quotes for LIKE patterns
      const cursorOffset = suggestion.value.indexOf('%') + 1
      newValue = beforeWord + suggestion.value + afterCursor
      onChange(newValue)
      
      // Set cursor position after React updates
      setTimeout(() => {
        input.focus()
        const newPosition = beforeWord.length + cursorOffset
        input.setSelectionRange(newPosition, newPosition)
      }, 0)
    } else if (suggestion.value === ' IN (') {
      // Place cursor inside parentheses
      newValue = beforeWord + suggestion.value + ')' + afterCursor
      onChange(newValue)
      
      setTimeout(() => {
        input.focus()
        const newPosition = beforeWord.length + suggestion.value.length
        input.setSelectionRange(newPosition, newPosition)
      }, 0)
    } else {
      newValue = beforeWord + suggestion.value + afterCursor
      onChange(newValue)
      
      setTimeout(() => {
        input.focus()
        const newPosition = beforeWord.length + suggestion.value.length
        input.setSelectionRange(newPosition, newPosition)
      }, 0)
    }
    
    setIsOpen(false)
  }, [value, onChange])
  
  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Handle focus
  const handleFocus = useCallback(() => {
    const position = inputRef.current?.selectionStart || 0
    const newSuggestions = generateSuggestions(value, position)
    setSuggestions(newSuggestions)
    if (newSuggestions.length > 0) {
      setIsOpen(true)
      setSelectedIndex(0)
    }
  }, [value, generateSuggestions])
  
  return (
    <div ref={containerRef} className="relative flex items-center gap-2 px-3 py-2 border rounded-md bg-background">
      <button
        className="h-4 w-4 text-muted-foreground flex-shrink-0 hover:text-foreground transition-colors cursor-pointer"
        onClick={onCommit}
        title="Search (or press Enter)"
        disabled={disabled}
      >
        <Search className="h-4 w-4" />
      </button>
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        disabled={disabled}
        placeholder="Enter WHERE clause (press Enter to search)"
        className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        spellCheck={false}
        autoComplete="off"
      />
      
      {schema?.columns && (
        <button
          className="h-4 w-4 text-muted-foreground flex-shrink-0 hover:text-foreground transition-colors cursor-pointer"
          onClick={() => {
            inputRef.current?.focus()
            handleFocus()
          }}
          title="Show suggestions"
          disabled={disabled}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
      
      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md z-50"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors",
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => insertSuggestion(suggestion)}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{suggestion.label}</span>
                {suggestion.detail && (
                  <span className="text-xs text-muted-foreground">
                    {suggestion.detail}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded",
                  suggestion.type === 'column' && "bg-blue-500/20 text-blue-500",
                  suggestion.type === 'operator' && "bg-green-500/20 text-green-500",
                  suggestion.type === 'keyword' && "bg-purple-500/20 text-purple-500",
                  suggestion.type === 'value' && "bg-orange-500/20 text-orange-500"
                )}
              >
                {suggestion.type}
              </span>
            </div>
          ))}
          
          <div className="px-3 py-2 text-xs text-muted-foreground border-t">
            <kbd className="text-xs">↑↓</kbd> Navigate • <kbd className="text-xs">Enter/Tab</kbd> Select • <kbd className="text-xs">Esc</kbd> Close
          </div>
        </div>
      )}
    </div>
  )
}