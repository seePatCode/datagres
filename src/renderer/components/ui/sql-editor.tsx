import { forwardRef, useRef, useImperativeHandle, useEffect, useState } from 'react'
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
}

export const SQLEditor = forwardRef<SQLEditorHandle, SQLEditorProps>(
  ({ value, onChange, onExecute, schemas = [] }, ref) => {
    const editorRef = useRef<any>(null)
    const monacoRef = useRef<any>(null)
    const onExecuteRef = useRef(onExecute)
    const schemasRef = useRef(schemas)
    const [isMonacoReady, setIsMonacoReady] = useState(false)
    const completionDisposableRef = useRef<any>(null)
    
    // Keep the refs updated with the latest values
    useEffect(() => {
      onExecuteRef.current = onExecute
    }, [onExecute])
    
    useEffect(() => {
      schemasRef.current = schemas
    }, [schemas])

    const handleEditorDidMount: OnMount = (editor, monaco) => {
      editorRef.current = editor
      monacoRef.current = monaco
      setIsMonacoReady(true)

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
          onExecuteRef.current?.()
        }
      })
    }

    // Register completion provider when Monaco is ready
    useEffect(() => {
      if (!isMonacoReady || !monacoRef.current) return

      const monaco = monacoRef.current
      
      // Dispose any existing provider
      if (completionDisposableRef.current) {
        completionDisposableRef.current.dispose()
      }
      
      // Register new completion provider
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

          const suggestions: any[] = []
          
          // Add table suggestions
          schemasRef.current.forEach((schema: TableSchema) => {
            suggestions.push({
              label: schema.tableName,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: schema.tableName,
              detail: 'Table',
              sortText: '0' + schema.tableName,
              range
            })
            
            // Add column suggestions with table prefix
            schema.columns.forEach(column => {
              suggestions.push({
                label: `${schema.tableName}.${column.name}`,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: `${schema.tableName}.${column.name}`,
                detail: `${column.dataType}${column.isPrimaryKey ? ' (PK)' : ''}`,
                sortText: '1' + column.name,
                range
              })
              
              // Also add columns without table prefix for convenience
              suggestions.push({
                label: column.name,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: column.name,
                detail: `${column.dataType} (from ${schema.tableName})`,
                sortText: '2' + column.name,
                range
              })
            })
          })
          
          // Add SQL keywords
          const keywords = [
            'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 
            'INNER JOIN', 'ON', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 
            'HAVING', 'LIMIT', 'OFFSET', 'AS', 'DISTINCT', 'COUNT', 
            'SUM', 'AVG', 'MIN', 'MAX', 'LIKE', 'IN', 'NOT IN', 
            'EXISTS', 'NOT EXISTS', 'BETWEEN', 'IS NULL', 'IS NOT NULL',
            'UNION', 'UNION ALL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
            'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
            'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'PRIMARY KEY',
            'FOREIGN KEY', 'REFERENCES', 'INDEX', 'UNIQUE'
          ]
          
          keywords.forEach(keyword => {
            suggestions.push({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              sortText: '3' + keyword,
              range
            })
          })
          
          // Add common PostgreSQL functions
          const functions = [
            'NOW()', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP',
            'DATE_TRUNC', 'EXTRACT', 'TO_CHAR', 'TO_DATE', 'TO_TIMESTAMP',
            'COALESCE', 'NULLIF', 'CAST', 'LENGTH', 'UPPER', 'LOWER',
            'SUBSTRING', 'POSITION', 'TRIM', 'LTRIM', 'RTRIM'
          ]
          
          functions.forEach(func => {
            suggestions.push({
              label: func,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: func,
              detail: 'PostgreSQL function',
              sortText: '4' + func,
              range
            })
          })
          
          return { suggestions }
        }
      })
      
      return () => {
        if (completionDisposableRef.current) {
          completionDisposableRef.current.dispose()
        }
      }
    }, [isMonacoReady])

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