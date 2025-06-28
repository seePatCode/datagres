import { useRef, useEffect, useState, memo, useCallback, useMemo } from 'react'
import Editor, { OnMount, loader } from '@monaco-editor/react'
import { Search } from 'lucide-react'

interface SQLWhereEditorProps {
  value: string
  onChange: (value: string) => void
  onCommit: () => void
  schema?: any
  disabled?: boolean
  onAiPrompt?: (position: { top: number; left: number }) => void
}

// Define theme once globally
let themeInitialized = false
const initializeTheme = async () => {
  if (themeInitialized) return
  
  const monaco = await loader.init()
  monaco.editor.defineTheme('datagres-search', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword.sql', foreground: '569cd6' },
      { token: 'string.sql', foreground: 'ce9178' },
      { token: 'number.sql', foreground: 'b5cea8' },
    ],
    colors: {
      'editor.background': '#09090b',
      'editor.foreground': '#fafafa',
      'editorSuggestWidget.background': '#09090b',
      'editorSuggestWidget.border': '#27272a',
      'editorSuggestWidget.selectedBackground': '#27272a',
    }
  })
  themeInitialized = true
}

const SQLWhereEditorComponent = memo(function SQLWhereEditor({
  value,
  onChange,
  onCommit,
  schema,
  disabled = false,
  onAiPrompt
}: SQLWhereEditorProps) {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const onCommitRef = useRef(onCommit)
  const onAiPromptRef = useRef(onAiPrompt)
  const schemaRef = useRef(schema)
  const completionProviderRef = useRef<any>(null)
  
  // Keep the refs up to date
  useEffect(() => {
    onCommitRef.current = onCommit
  }, [onCommit])
  
  useEffect(() => {
    onAiPromptRef.current = onAiPrompt
  }, [onAiPrompt])
  
  useEffect(() => {
    schemaRef.current = schema
  }, [schema])

  // Initialize theme before any editor mounts
  useEffect(() => {
    initializeTheme()
  }, [])

  // Handle container resize
  useEffect(() => {
    if (!isEditorReady || !editorRef.current || !containerRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      // Force Monaco to re-layout when container size changes
      editorRef.current?.layout()
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [isEditorReady])

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    
    monaco.editor.setTheme('datagres-search')

    // Handle Enter key - use addAction for better reliability
    editor.addAction({
      id: 'search-on-enter',
      label: 'Search',
      keybindings: [monaco.KeyCode.Enter],
      precondition: '!suggestWidgetVisible',
      run: () => {
        onCommitRef.current()
      }
    })
    
    // Also handle Ctrl/Cmd+Enter as a fallback
    editor.addAction({
      id: 'search-on-cmd-enter',
      label: 'Search (Force)',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        onCommitRef.current()
      }
    })
    
    // Handle Cmd+K for AI prompt
    if (onAiPrompt) {
      editor.addAction({
        id: 'open-ai-prompt',
        label: 'Open AI Prompt',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
        run: () => {
          if (!onAiPromptRef.current) return
          
          // Get cursor position for prompt placement
          const position = editor.getPosition()
          if (!position) return
          
          const coords = editor.getScrolledVisiblePosition(position)
          if (!coords) return
          
          const editorDom = editor.getDomNode()
          if (!editorDom) return
          
          const editorRect = editorDom.getBoundingClientRect()
          
          onAiPromptRef.current({
            top: editorRect.top + coords.top + 20, // Offset below cursor
            left: editorRect.left + coords.left
          })
        }
      })
    }

    editor.focus()
    setIsEditorReady(true)
  }, [])

  // Memoized suggestion generator for better performance
  const generateSuggestions = useCallback((monaco: any, word: any, range: any, textUntilPosition: string) => {
    const suggestions: any[] = []
    const currentSchema = schemaRef.current
    if (!currentSchema) return suggestions
    
    const lastWord = textUntilPosition.split(/\s+/).pop() || ''
    const hasOperator = /[=!<>]+\s*$/.test(textUntilPosition)
    const afterLike = /\slike\s+$/i.test(textUntilPosition)
    const afterIn = /\sin\s*\(?$/i.test(textUntilPosition)
    const needsValue = hasOperator || afterLike || afterIn
    const atStart = textUntilPosition.trim() === '' || textUntilPosition.trim() === word.word.toLowerCase()
    const afterConnector = /\s(and|or)\s+$/i.test(textUntilPosition)
    
    // Limit suggestions for performance
    const maxSuggestions = 20
    
    // Suggest columns at start or after AND/OR
    if ((atStart || afterConnector) && currentSchema.columns) {
      currentSchema.columns.slice(0, 10).forEach((col: any) => {
        if (suggestions.length >= maxSuggestions) return
        suggestions.push({
          label: col.name,
          kind: monaco.languages.CompletionItemKind.Field,
          detail: col.dataType,
          insertText: col.name,
          range,
          sortText: '0' + col.name
        })
      })
    }
    
    // Suggest operators after column name
    if (!needsValue && !atStart && !afterConnector && suggestions.length < maxSuggestions) {
      const operators = [
        { label: '=', insert: ' = ' },
        { label: '!=', insert: ' != ' },
        { label: 'LIKE', insert: ' LIKE ' },
        { label: 'IN', insert: ' IN (' },
        { label: 'IS NULL', insert: ' IS NULL' },
        { label: 'IS NOT NULL', insert: ' IS NOT NULL' }
      ]
      operators.forEach(op => {
        if (suggestions.length >= maxSuggestions) return
        suggestions.push({
          label: op.label,
          kind: monaco.languages.CompletionItemKind.Operator,
          insertText: op.insert,
          range,
          sortText: '1' + op.label
        })
      })
    }
    
    // Suggest values after operators
    if (needsValue && afterLike && suggestions.length < maxSuggestions) {
      suggestions.push({
        label: "'%...%'",
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: "'%$1%'",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Contains pattern',
        range
      })
    }
    
    // Always suggest AND/OR if we have some content
    if (textUntilPosition.trim() && !needsValue && !afterConnector && suggestions.length < maxSuggestions) {
      ['AND', 'OR'].forEach(kw => {
        suggestions.push({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: ' ' + kw + ' ',
          range,
          sortText: '2' + kw
        })
      })
    }
    
    return suggestions
  }, [])
  
  // Register completion provider once when editor is ready
  useEffect(() => {
    if (!isEditorReady || !monacoRef.current || completionProviderRef.current) return
    
    const monaco = monacoRef.current
    
    completionProviderRef.current = monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }

        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        }).toLowerCase()

        return { suggestions: generateSuggestions(monaco, word, range, textUntilPosition) }
      },
      triggerCharacters: [' ', '=', '>', '<', '!']
    })
    
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose()
        completionProviderRef.current = null
      }
    }
  }, [isEditorReady, generateSuggestions])

  // Memoize onChange handler
  const handleChange = useCallback((val: string | undefined) => {
    onChange(val || '')
  }, [onChange])
  
  // Memoize editor options
  const editorOptions = useMemo(() => ({
    // Core options for inline appearance
    minimap: { enabled: false },
    lineNumbers: 'off',
    folding: false,
    renderLineHighlight: 'none',
    scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    
    // Typography
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'inherit',
    
    // Behavior
    wordWrap: 'off',
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false
    },
    acceptSuggestionOnEnter: 'off',
    tabCompletion: 'on',
    suggestOnTriggerCharacters: true,
    suggestSelection: 'first',
    
    // Appearance
    renderWhitespace: 'none',
    guides: { indentation: false },
    bracketPairColorization: { enabled: false },
    padding: { top: 0, bottom: 0 },
    
    // Features to disable for cleaner look
    contextmenu: false,
    links: false,
    occurrencesHighlight: 'off',
    selectionHighlight: false,
    renderValidationDecorations: 'off',
    
    // Monaco-specific optimizations
    fixedOverflowWidgets: true,
    readOnly: disabled,
    automaticLayout: true,
    
    // Performance optimizations
    suggest: {
      maxVisibleSuggestions: 8,
      localityBonus: true,
    }
  }), [disabled])

  return (
    <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background min-w-0">
      <button
        className="h-4 w-4 text-muted-foreground flex-shrink-0 hover:text-foreground transition-colors cursor-pointer"
        onClick={() => onCommitRef.current()}
        title="Search (or press Enter)"
      >
        <Search className="h-4 w-4" />
      </button>
      <div ref={containerRef} className="flex-1 -my-1 -mr-3 relative min-w-0 overflow-hidden">
        {!isEditorReady && (
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-6 bg-[#09090b] text-[#fafafa] text-sm px-2 flex items-center">
              <span className="text-muted-foreground">{value || 'Enter WHERE clause (press Enter to search)'}</span>
            </div>
          </div>
        )}
        <div className={!isEditorReady ? 'opacity-0' : ''}>
          <Editor
            height="28px"
            defaultLanguage="sql"
            theme="datagres-search"
            value={value}
            onChange={handleChange}
            onMount={handleEditorDidMount}
            beforeMount={() => initializeTheme()}
            options={editorOptions}
          />
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if value, callbacks, or disabled state change
  // schema changes are handled via refs
  return (
    prevProps.value === nextProps.value &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.onCommit === nextProps.onCommit &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.onAiPrompt === nextProps.onAiPrompt
  )
})

export const SQLWhereEditor = SQLWhereEditorComponent