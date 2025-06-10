import { forwardRef, useRef, useImperativeHandle } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'

interface SQLEditorProps {
  value: string
  onChange: (value: string) => void
  onExecute?: () => void
}

export interface SQLEditorHandle {
  getSelectedText: () => string
  focus: () => void
}

export const SQLEditor = forwardRef<SQLEditorHandle, SQLEditorProps>(
  ({ value, onChange, onExecute }, ref) => {
    const editorRef = useRef<any>(null)
    const monacoRef = useRef<any>(null)

    const handleEditorDidMount: OnMount = (editor, monaco) => {
      editorRef.current = editor
      monacoRef.current = monaco

      // Define SQL theme
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
      
      monaco.editor.setTheme('sql-dark')

      // Add execute action
      editor.addAction({
        id: 'execute-query',
        label: 'Execute Query',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => {
          onExecute?.()
        }
      })
    }

    useImperativeHandle(ref, () => ({
      getSelectedText: () => {
        if (!editorRef.current) return ''
        const selection = editorRef.current.getSelection()
        if (!selection || selection.isEmpty()) return ''
        return editorRef.current.getModel()?.getValueInRange(selection) || ''
      },
      focus: () => {
        editorRef.current?.focus()
      }
    }), [])

    return (
      <Editor
        height="100%"
        defaultLanguage="sql"
        value={value}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorDidMount}
        options={{
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
          },
        }}
      />
    )
  }
)

SQLEditor.displayName = 'SQLEditor'