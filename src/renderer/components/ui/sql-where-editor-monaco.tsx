import { useRef, useEffect } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import { Search } from 'lucide-react'

interface SQLWhereEditorProps {
  value: string
  onChange: (value: string) => void
  onCommit: () => void
  schema?: any
  disabled?: boolean
}

export function SQLWhereEditor({
  value,
  onChange,
  onCommit,
  schema,
  disabled = false
}: SQLWhereEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Define theme (Monaco handles duplicate registrations)
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
    
    monaco.editor.setTheme('datagres-search')

    // Setup completions
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

    editor.focus()
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

        // Add columns
        schema?.columns?.forEach((col: any) => {
          suggestions.push({
            label: col.name,
            kind: monaco.languages.CompletionItemKind.Field,
            detail: col.dataType,
            insertText: col.name,
            range
          })
        })

        // Add keywords
        ['AND', 'OR', 'NOT', 'LIKE', 'IN', 'BETWEEN'].forEach(kw => {
          suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range
          })
        })

        return { suggestions }
      }
    })
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border rounded-md bg-background">
      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 -my-1.5 -mr-3">
        <Editor
          height="24px"
          defaultLanguage="sql"
          value={value}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
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
  )
}