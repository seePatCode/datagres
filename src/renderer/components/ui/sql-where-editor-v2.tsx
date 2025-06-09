import { useRef, useEffect } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'

interface SQLWhereEditorProps {
  value: string
  onChange: (value: string) => void
  onCommit: () => void
  schema?: any
  disabled?: boolean
  placeholder?: string
}

export function SQLWhereEditor({
  value,
  onChange,
  onCommit,
  schema,
  disabled = false,
  placeholder = "WHERE clause (e.g., location = 'NYC' AND age > 25) - Press Enter"
}: SQLWhereEditorProps) {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    console.log('[SQLWhereEditor] Editor mounted')
    editorRef.current = editor
    monacoRef.current = monaco

    // Define custom theme
    monaco.editor.defineTheme('datagres-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569cd6' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
      ],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#d4d4d4',
        'editorSuggestWidget.background': '#1e1e1e',
        'editorSuggestWidget.selectedBackground': '#264f78',
      }
    })

    editor.updateOptions({ theme: 'datagres-dark' })
    
    // Set up schema completions if available
    if (schema && monaco) {
      setupSchemaCompletions(monaco, schema)
    }

    // Handle Enter key - simple and direct
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      console.log('[SQLWhereEditor] Ctrl/Cmd+Enter pressed')
      onCommit()
    })
    
    // Also handle plain Enter when suggestions aren't showing
    editor.onKeyDown((e: any) => {
      if (e.keyCode === monaco.KeyCode.Enter && !e.ctrlKey && !e.metaKey) {
        // Check if the suggest widget is visible
        const suggestController = editor.getContribution('editor.contrib.suggestController')
        const suggestWidget = (suggestController as any)?.widget?.value
        
        if (!suggestWidget || !suggestWidget._isVisible) {
          console.log('[SQLWhereEditor] Enter pressed, no suggestions visible')
          e.preventDefault()
          e.stopPropagation()
          onCommit()
        }
      }
    })

    editor.focus()
  }

  const setupSchemaCompletions = (monaco: any, tableSchema: any) => {
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }

        const suggestions: any[] = []

        // Add column suggestions
        if (tableSchema?.columns) {
          tableSchema.columns.forEach((column: any) => {
            suggestions.push({
              label: column.name,
              kind: monaco.languages.CompletionItemKind.Field,
              detail: `${column.dataType}${column.nullable ? ' (nullable)' : ''}`,
              insertText: column.name,
              range
            })
          })
        }

        // Add SQL keywords
        const keywords = ['AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL']
        keywords.forEach(keyword => {
          suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range
          })
        })

        return { suggestions }
      }
    })
  }

  useEffect(() => {
    // Update schema completions when schema changes
    if (editorRef.current && monacoRef.current && schema) {
      setupSchemaCompletions(monacoRef.current, schema)
    }
  }, [schema])

  return (
    <div className="relative w-full h-[40px] border rounded-md" style={{ overflow: 'visible' }}>
      <Editor
        height="40px"
        defaultLanguage="sql"
        value={value}
        onChange={(val) => {
          console.log('[SQLWhereEditor] Value changed:', val)
          onChange(val || '')
        }}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          lineNumbers: 'off',
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          renderLineHighlight: 'none',
          scrollbar: { 
            vertical: 'hidden', 
            horizontal: 'auto',
            horizontalScrollbarSize: 4
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          wordWrap: 'off',
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'off', // Important: don't accept suggestions on Enter
          tabCompletion: 'on',
          fontSize: 14,
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          padding: { top: 8, bottom: 8 },
          placeholder: placeholder,
          readOnly: disabled,
          contextmenu: false,
          scrollBeyondLastLine: false,
          fixedOverflowWidgets: true,
          suggest: {
            insertMode: 'replace',
            localityBonus: true,
            showIcons: true
          }
        }}
      />
    </div>
  )
}