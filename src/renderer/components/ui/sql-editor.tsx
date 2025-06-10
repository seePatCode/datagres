import { useState, useRef, useEffect } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DataTable } from '@/components/ui/data-table'
import { Play, Loader2, AlertCircle, Clock } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

interface SQLEditorProps {
  connectionString: string
  initialQuery?: string
  onQueryChange?: (query: string) => void
}

// Helper function to create columns dynamically
const createColumns = (columnNames: string[]): ColumnDef<any>[] => {
  return columnNames.map((columnName, index) => ({
    accessorKey: index.toString(),
    header: columnName,
    cell: ({ getValue }) => {
      const value = getValue()
      return (
        <div 
          className="font-mono text-vs-ui truncate py-1 px-2 hover:bg-muted/30 transition-colors w-full"
          title={value !== null ? String(value) : 'NULL'}
        >
          {value !== null ? (
            <span className="text-foreground">
              {String(value)}
            </span>
          ) : (
            <span className="text-muted-foreground italic font-system text-vs-ui-small">
              NULL
            </span>
          )}
        </div>
      )
    },
    size: 120,
    minSize: 60,
    maxSize: 300,
  }))
}

export function SQLEditor({ connectionString, initialQuery = '', onQueryChange }: SQLEditorProps) {
  const [query, setQuery] = useState(initialQuery)
  const [selectedText, setSelectedText] = useState('')
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)

  const executeMutation = useMutation({
    mutationFn: async (sqlQuery: string) => {
      const result = await window.electronAPI.executeSQL(connectionString, {
        query: sqlQuery
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Query execution failed')
      }
      
      return result
    }
  })

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

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleExecute()
    })

    // Track selection changes
    editor.onDidChangeCursorSelection((e: any) => {
      const selection = editor.getSelection()
      if (selection && !selection.isEmpty()) {
        const selectedText = editor.getModel()?.getValueInRange(selection) || ''
        setSelectedText(selectedText)
      } else {
        setSelectedText('')
      }
    })
  }

  const handleExecute = () => {
    const queryToExecute = selectedText || query
    if (queryToExecute.trim()) {
      executeMutation.mutate(queryToExecute)
    }
  }

  const handleQueryChange = (value: string | undefined) => {
    const newQuery = value || ''
    setQuery(newQuery)
    onQueryChange?.(newQuery)
  }

  // Format execution time
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="flex flex-col h-full">
      {/* SQL Editor */}
      <div className="flex-1 min-h-[200px] border-b">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-2 border-b bg-muted/30">
            <div className="text-sm text-muted-foreground">
              SQL Editor {selectedText && <span className="ml-2">(selection will be executed)</span>}
            </div>
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={executeMutation.isPending || !query.trim()}
              className="gap-2"
            >
              {executeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Execute (⌘+Enter)
                </>
              )}
            </Button>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="sql"
              value={query}
              onChange={handleQueryChange}
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
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 min-h-0 flex flex-col">
        {executeMutation.error && (
          <Alert variant="destructive" className="m-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{executeMutation.error.message}</AlertDescription>
          </Alert>
        )}

        {executeMutation.data && (
          <>
            {/* Query stats */}
            <div className="flex items-center gap-4 px-3 py-2 border-b bg-muted/20 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTime(executeMutation.data.queryTime || 0)}
              </span>
              <span className="text-muted-foreground">
                {executeMutation.data.data?.rowCount || 0} rows
              </span>
            </div>

            {/* Results table */}
            <div className="flex-1 overflow-auto">
              {executeMutation.data.data && executeMutation.data.data.columns.length > 0 && (
                <DataTable
                  columns={createColumns(executeMutation.data.data.columns)}
                  data={executeMutation.data.data.rows}
                />
              )}
            </div>
          </>
        )}

        {!executeMutation.data && !executeMutation.error && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Execute a query to see results
          </div>
        )}
      </div>
    </div>
  )
}