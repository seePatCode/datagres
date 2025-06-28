import { forwardRef, useRef, useImperativeHandle, useEffect, useState, memo, useCallback, useMemo } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import type { TableSchema } from '@shared/types'

interface SQLEditorProps {
  value: string
  onChange: (value: string) => void
  onExecute?: () => void
  schemas?: TableSchema[]
}

export interface SQLEditorHandle {
  getSelectedText: () => string
  focus: () => void
  insertText: (text: string) => void
  isFocused: () => boolean
  getCursorPosition: () => { top: number; left: number } | null
  selectText: (startOffset: number, endOffset: number) => void
}

const SQLEditorComponent = forwardRef<SQLEditorHandle, SQLEditorProps>(
  ({ value, onChange, onExecute, schemas = [] }, ref) => {
    const editorRef = useRef<any>(null)
    const monacoRef = useRef<any>(null)
    const onExecuteRef = useRef(onExecute)
    const schemasRef = useRef(schemas)
    const [isMonacoReady, setIsMonacoReady] = useState(false)
    const completionDisposableRef = useRef<any>(null)
    const hasRegisteredCompletionRef = useRef(false)
    const onChangeRef = useRef(onChange)
    const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastValueRef = useRef(value)
    const isTypingRef = useRef(false)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    
    // Keep the refs updated with the latest values
    useEffect(() => {
      onExecuteRef.current = onExecute
    }, [onExecute])
    
    useEffect(() => {
      schemasRef.current = schemas
    }, [schemas])
    
    useEffect(() => {
      onChangeRef.current = onChange
    }, [onChange])
    
    // Update editor value when prop changes (controlled component)
    useEffect(() => {
      if (editorRef.current && value !== lastValueRef.current) {
        const currentValue = editorRef.current.getValue()
        if (currentValue !== value) {
          editorRef.current.setValue(value)
        }
        lastValueRef.current = value
      }
    }, [value])

    const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
      editorRef.current = editor
      monacoRef.current = monaco
      setIsMonacoReady(true)

      // Define SQL theme only if not already defined
      try {
        monaco.editor.defineTheme('sql-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'keyword.sql', foreground: '569cd6' },
            { token: 'string.sql', foreground: 'ce9178' },
            { token: 'number.sql', foreground: 'b5cea8' },
            { token: 'comment.sql', foreground: '6a9955' },
            { token: 'operator.sql', foreground: 'd4d4d4' },
          ],
          colors: {
            'editor.background': '#1e1e1e',
            'editor.foreground': '#d4d4d4',
          }
        })
      } catch (e) {
        // Theme already defined
      }
      
      monaco.editor.setTheme('sql-dark')

      // Add execute action
      editor.addAction({
        id: 'execute-query',
        label: 'Execute Query',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => {
          onExecuteRef.current?.()
        }
      })
    }, [])

    // Create memoized suggestion generator
    const generateSuggestions = useCallback((monaco: any, range: any, textBeforeCursor: string) => {
      // Skip suggestions while actively typing
      if (isTypingRef.current) {
        return []
      }
      
      const suggestions: any[] = []
      const currentSchemas = schemasRef.current
      
      // Limit suggestions based on context
      const lastWord = textBeforeCursor.split(/\s+/).pop()?.toLowerCase() || ''
      const isAfterFrom = /\bfrom\s+$/i.test(textBeforeCursor)
      const isAfterSelect = /\bselect\s+$/i.test(textBeforeCursor)
      const maxSuggestions = 50 // Limit total suggestions
      
      // Prioritize table names after FROM
      if (isAfterFrom) {
        currentSchemas.forEach((schema: TableSchema) => {
          if (suggestions.length >= maxSuggestions) return
          suggestions.push({
            label: schema.tableName,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: schema.tableName,
            detail: 'Table',
            sortText: '0' + schema.tableName,
            range
          })
        })
        return suggestions
      }
      
      // Add suggestions based on context
      if (!lastWord || lastWord.length < 2) {
        // For very short input, only show most relevant items
        const keywords = ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'LIMIT']
        keywords.forEach(keyword => {
          if (suggestions.length >= maxSuggestions) return
          if (keyword.toLowerCase().startsWith(lastWord)) {
            suggestions.push({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              sortText: '0' + keyword,
              range
            })
          }
        })
      } else {
        // For longer input, add relevant suggestions
        // Add matching tables
        currentSchemas.forEach((schema: TableSchema) => {
          if (suggestions.length >= maxSuggestions) return
          if (schema.tableName.toLowerCase().includes(lastWord)) {
            suggestions.push({
              label: schema.tableName,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: schema.tableName,
              detail: 'Table',
              sortText: '1' + schema.tableName,
              range
            })
          }
        })
        
        // Add matching columns (limit to avoid overwhelming)
        currentSchemas.forEach((schema: TableSchema) => {
          if (suggestions.length >= maxSuggestions) return
          schema.columns.slice(0, 10).forEach(column => {
            if (column.name.toLowerCase().includes(lastWord)) {
              suggestions.push({
                label: column.name,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: column.name,
                detail: `${column.dataType} (from ${schema.tableName})`,
                sortText: '2' + column.name,
                range
              })
            }
          })
        })
      }
      
      return suggestions
    }, [])

    // Register completion provider only once
    useEffect(() => {
      if (!isMonacoReady || !monacoRef.current || hasRegisteredCompletionRef.current) return

      const monaco = monacoRef.current
      
      // Register completion provider once
      completionDisposableRef.current = monaco.languages.registerCompletionItemProvider('sql', {
        provideCompletionItems: (model: any, position: any) => {
          const textBeforeCursor = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          })

          const word = model.getWordUntilPosition(position)
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          }

          return { suggestions: generateSuggestions(monaco, range, textBeforeCursor) }
        },
        triggerCharacters: ['.', ' '] // Only trigger on specific characters
      })
      
      hasRegisteredCompletionRef.current = true
      
      return () => {
        if (completionDisposableRef.current) {
          completionDisposableRef.current.dispose()
          hasRegisteredCompletionRef.current = false
        }
      }
    }, [isMonacoReady, generateSuggestions])

    useImperativeHandle(ref, () => ({
      getSelectedText: () => {
        if (!editorRef.current) return ''
        const selection = editorRef.current.getSelection()
        if (!selection || selection.isEmpty()) return ''
        return editorRef.current.getModel()?.getValueInRange(selection) || ''
      },
      focus: () => {
        editorRef.current?.focus()
      },
      insertText: (text: string) => {
        if (!editorRef.current) return
        const selection = editorRef.current.getSelection()
        const id = { major: 1, minor: 1 }
        const op = {
          identifier: id,
          range: selection,
          text: text,
          forceMoveMarkers: true
        }
        editorRef.current.executeEdits("ai-insert", [op])
      },
      isFocused: () => {
        if (!editorRef.current) return false
        return editorRef.current.hasWidgetFocus()
      },
      getCursorPosition: () => {
        if (!editorRef.current) return null
        const position = editorRef.current.getPosition()
        if (!position) return null
        
        // Get the editor's DOM node position
        const editorDom = editorRef.current.getDomNode()
        if (!editorDom) return null
        
        const editorRect = editorDom.getBoundingClientRect()
        const coords = editorRef.current.getScrolledVisiblePosition(position)
        
        if (!coords) return null
        
        return {
          top: editorRect.top + coords.top,
          left: editorRect.left + coords.left
        }
      },
      selectText: (startOffset: number, endOffset: number) => {
        if (!editorRef.current || !monacoRef.current) return
        
        const model = editorRef.current.getModel()
        if (!model) return
        
        // Convert offsets to positions
        const startPosition = model.getPositionAt(startOffset)
        const endPosition = model.getPositionAt(endOffset)
        
        // Create a selection range
        const selection = new monacoRef.current.Selection(
          startPosition.lineNumber,
          startPosition.column,
          endPosition.lineNumber,
          endPosition.column
        )
        
        // Set the selection
        editorRef.current.setSelection(selection)
        
        // Reveal the selection in viewport
        editorRef.current.revealRangeInCenter(selection)
        
        // Focus the editor
        editorRef.current.focus()
      }
    }), [])

    // Debounced onChange handler to reduce lag
    const handleChange = useCallback((newValue: string | undefined) => {
      const val = newValue || ''
      lastValueRef.current = val
      
      // Mark as typing
      isTypingRef.current = true
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Stop typing after 300ms of no activity
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false
      }, 300)
      
      // Clear any pending change
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current)
      }
      
      // Debounce the onChange callback
      changeTimeoutRef.current = setTimeout(() => {
        onChangeRef.current(val)
      }, 50) // 50ms debounce for typing
    }, [])
    
    // Cleanup timeouts on unmount
    useEffect(() => {
      return () => {
        if (changeTimeoutRef.current) {
          clearTimeout(changeTimeoutRef.current)
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
      }
    }, [])

    // Memoize editor options with performance optimizations
    const editorOptions = useMemo(() => ({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      suggest: {
        showKeywords: true,
        maxVisibleSuggestions: 10,
        localityBonus: true,
        shareSuggestSelections: false,
        snippetsPreventQuickSuggestions: false,
        showIcons: false, // Disable icons for performance
        showStatusBar: false,
        preview: false, // Disable suggestion preview
      },
      quickSuggestions: false, // Disable automatic suggestions while typing
      acceptSuggestionOnCommitCharacter: true,
      tabCompletion: 'on',
      suggestSelection: 'first',
      // Performance optimizations
      renderWhitespace: 'none',
      renderControlCharacters: false,
      fontLigatures: false,
      renderLineHighlight: 'none',
      renderIndentGuides: false,
      matchBrackets: 'never',
      occurrencesHighlight: false,
      selectionHighlight: false,
      foldingHighlight: false,
      links: false,
      contextmenu: true,
      quickSuggestionsDelay: 500, // Increase delay to suggestions
      mouseWheelZoom: false,
      multiCursorModifier: 'alt',
      accessibilitySupport: 'off',
      autoIndent: 'simple',
      formatOnPaste: false,
      formatOnType: false,
      trimAutoWhitespace: false,
    }), [])

    return (
      <Editor
        height="100%"
        defaultLanguage="sql"
        defaultValue={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={editorOptions}
        loading={<div className="flex items-center justify-center h-full text-muted-foreground">Loading editor...</div>}
      />
    )
  }
)

SQLEditorComponent.displayName = 'SQLEditor'

// Memoize the component to prevent unnecessary re-renders
export const SQLEditor = memo(SQLEditorComponent, (prevProps, nextProps) => {
  // Custom comparison - only re-render if value or callbacks change
  // schemas changes are handled via refs, so no need to re-render
  return (
    prevProps.value === nextProps.value &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.onExecute === nextProps.onExecute
  )
})