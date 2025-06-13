import { useRef, useEffect, useState } from 'react'
import Editor, { OnMount, loader } from '@monaco-editor/react'
import { Search } from 'lucide-react'

interface SQLWhereEditorProps {
  value: string
  onChange: (value: string) => void
  onCommit: () => void
  schema?: any
  disabled?: boolean
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

export function SQLWhereEditor({
  value,
  onChange,
  onCommit,
  schema,
  disabled = false
}: SQLWhereEditorProps) {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)

  // Initialize theme before any editor mounts
  useEffect(() => {
    initializeTheme()
  }, [])

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    
    monaco.editor.setTheme('datagres-search')

    // Setup completions if schema is already available (rare case)
    if (schema) {
      setupCompletions(monaco, schema)
    }

    // Handle Enter key
    editor.addCommand(monaco.KeyCode.Enter, () => {
      const suggestController = editor.getContribution('editor.contrib.suggestController') as any
      if (!suggestController?.model?.state) {
        onCommit()
      }
    })
    
    // Also handle Ctrl/Cmd+Enter as a fallback
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onCommit()
    })

    editor.focus()
    setIsEditorReady(true)
  }

  const setupCompletions = (monaco: any, schema: any) => {
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model: any, position: any) => {
        const suggestions: any[] = []
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }

        // Get the text before cursor to understand context
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        }).toLowerCase()

        // Analyze context - what should we suggest?
        const lastWord = textUntilPosition.split(/\s+/).pop() || ''
        const hasOperator = /[=!<>]+\s*$/.test(textUntilPosition)
        const afterLike = /\slike\s+$/i.test(textUntilPosition)
        const afterIn = /\sin\s*\(?$/i.test(textUntilPosition)
        const needsValue = hasOperator || afterLike || afterIn
        
        // Check if we're at the start or after AND/OR
        const atStart = textUntilPosition.trim() === '' || textUntilPosition.trim() === word.word.toLowerCase()
        const afterConnector = /\s(and|or)\s+$/i.test(textUntilPosition)

        // Suggest columns at start or after AND/OR
        if (atStart || afterConnector) {
          schema?.columns?.forEach((col: any) => {
            suggestions.push({
              label: col.name,
              kind: monaco.languages.CompletionItemKind.Field,
              detail: col.dataType,
              insertText: col.name,
              range,
              sortText: '0' + col.name // prioritize columns
            })
          })
        }

        // Suggest operators after column name
        if (!needsValue && !atStart && !afterConnector) {
          const operators = [
            { label: '=', insert: ' = ' },
            { label: '!=', insert: ' != ' },
            { label: '<>', insert: ' <> ' },
            { label: '>', insert: ' > ' },
            { label: '<', insert: ' < ' },
            { label: '>=', insert: ' >= ' },
            { label: '<=', insert: ' <= ' },
            { label: 'LIKE', insert: ' LIKE ' },
            { label: 'ILIKE', insert: ' ILIKE ' },
            { label: 'IN', insert: ' IN (' },
            { label: 'NOT IN', insert: ' NOT IN (' },
            { label: 'IS NULL', insert: ' IS NULL' },
            { label: 'IS NOT NULL', insert: ' IS NOT NULL' }
          ]
          operators.forEach(op => {
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
        if (needsValue) {
          // For LIKE patterns
          if (afterLike) {
            suggestions.push({
              label: "'%...%'",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "'%$1%'",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: 'Contains pattern',
              range
            })
            suggestions.push({
              label: "'...%'",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "'$1%'",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: 'Starts with pattern',
              range
            })
            suggestions.push({
              label: "'%...'",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "'%$1'",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: 'Ends with pattern',
              range
            })
          }
          
          // Boolean values for boolean columns
          const lastColumnName = textUntilPosition.match(/(\w+)\s*[=!<>]/)?.[1]
          if (lastColumnName) {
            const column = schema?.columns?.find((col: any) => 
              col.name.toLowerCase() === lastColumnName
            )
            if (column?.dataType === 'boolean') {
              ['true', 'false'].forEach(val => {
                suggestions.push({
                  label: val,
                  kind: monaco.languages.CompletionItemKind.Value,
                  insertText: val,
                  range
                })
              })
            }
          }
        }

        // Always suggest AND/OR if we have some content (for chaining conditions)
        if (textUntilPosition.trim() && !needsValue && !afterConnector) {
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

        return { suggestions }
      }
    })
  }

  // Update completions when both editor is ready and schema is available
  useEffect(() => {
    if (isEditorReady && monacoRef.current && schema) {
      setupCompletions(monacoRef.current, schema)
    }
  }, [isEditorReady, schema])

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border rounded-md bg-background">
      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 -my-1.5 -mr-3 relative">
        {!isEditorReady && (
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-6 bg-[#09090b] text-[#fafafa] text-sm px-2 flex items-center">
              <span className="text-muted-foreground">{value || 'Enter WHERE clause (press Enter to search)'}</span>
            </div>
          </div>
        )}
        <div className={!isEditorReady ? 'opacity-0' : ''}>
          <Editor
            height="24px"
            defaultLanguage="sql"
            theme="datagres-search"
            value={value}
            onChange={(val) => onChange(val || '')}
            onMount={handleEditorDidMount}
            beforeMount={() => initializeTheme()}
            options={{
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
            quickSuggestions: true,
            acceptSuggestionOnEnter: 'off',
            tabCompletion: 'on',
            suggestOnTriggerCharacters: true,
            
            // Appearance
            renderWhitespace: 'none',
            guides: { indentation: false },
            bracketPairColorization: { enabled: false },
            padding: { top: 0, bottom: 0 },
            
            // Features to disable for cleaner look
            contextmenu: false,
            links: false,
            occurrencesHighlight: false,
            selectionHighlight: false,
            renderValidationDecorations: 'off',
            
            // Monaco-specific optimizations
            fixedOverflowWidgets: true,
            readOnly: disabled,
            domReadOnly: disabled,
          }}
          />
        </div>
      </div>
    </div>
  )
}