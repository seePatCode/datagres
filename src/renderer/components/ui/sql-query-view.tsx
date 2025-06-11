import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DataTable } from '@/components/ui/data-table'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SQLEditor, SQLEditorHandle } from '@/components/ui/sql-editor'
import { useSqlSettings } from '@/contexts/SqlSettingsContext'
import { useDebounce } from '@/hooks/useDebounce'
import { Play, Loader2, AlertCircle, Clock, Eye } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import type { TableSchema, TableInfo } from '@shared/types'

interface SQLQueryViewProps {
  connectionString: string
  initialQuery?: string
  onQueryChange?: (query: string) => void
  tables?: TableInfo[]
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

export function SQLQueryView({ connectionString, initialQuery = '', onQueryChange, tables = [] }: SQLQueryViewProps) {
  const [query, setQuery] = useState(initialQuery)
  const editorRef = useRef<SQLEditorHandle>(null)
  const { livePreview, setLivePreview } = useSqlSettings()
  const [schemas, setSchemas] = useState<TableSchema[]>([])
  
  // Only debounce when live preview is on
  const debouncedQuery = useDebounce(query, livePreview ? 500 : 0)
  
  
  // Fetch schemas for all tables
  useEffect(() => {
    if (!tables || tables.length === 0) {
      setSchemas([])
      return
    }
    
    // Fetch schemas for all tables
    const fetchSchemas = async () => {
      const schemaPromises = tables.map(async (table) => {
        try {
          const result = await window.electronAPI.fetchTableSchema(connectionString, table.name)
          if (result.success && result.schema) {
            return result.schema
          }
        } catch (error) {
          console.error(`Failed to fetch schema for ${table.name}:`, error)
        }
        return null
      })
      
      const results = await Promise.all(schemaPromises)
      const validSchemas = results.filter((schema): schema is TableSchema => schema !== null)
      setSchemas(validSchemas)
    }
    
    fetchSchemas()
  }, [tables, connectionString])

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

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery)
    onQueryChange?.(newQuery)
  }

  const handleExecute = () => {
    // Get selected text if any, otherwise use the entire query
    const selectedText = editorRef.current?.getSelectedText() || ''
    const queryToExecute = selectedText.trim() ? selectedText : query
    
    if (queryToExecute.trim()) {
      executeMutation.mutate(queryToExecute)
    }
  }

  // Auto-execute for live preview
  useEffect(() => {
    // Skip if live preview is off
    if (!livePreview) return
    
    // Skip if query is empty
    if (!debouncedQuery.trim()) return
    
    // Skip if already executing
    if (executeMutation.isPending) return
    
    // Only execute safe queries
    const trimmedQuery = debouncedQuery.trim().toLowerCase()
    const isSafeQuery = trimmedQuery.startsWith('select') || 
                       trimmedQuery.startsWith('show') || 
                       trimmedQuery.startsWith('describe') ||
                       trimmedQuery.startsWith('explain')
    
    if (isSafeQuery) {
      executeMutation.mutate(debouncedQuery)
    }
  }, [debouncedQuery, livePreview])

  // Format execution time
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* SQL Editor */}
      <div className="flex-1 min-h-[200px] max-h-[50%] border-b">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-2 border-b bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                SQL Editor
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="live-preview"
                        checked={livePreview}
                        onCheckedChange={setLivePreview}
                        className="h-4 w-8"
                      />
                      <Label 
                        htmlFor="live-preview" 
                        className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Live Preview
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Automatically execute SELECT queries as you type</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              variant="primary"
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
            <SQLEditor
              ref={editorRef}
              value={query}
              onChange={handleQueryChange}
              onExecute={handleExecute}
              schemas={schemas}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {executeMutation.error && (
          <Alert variant="destructive" className="m-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{executeMutation.error.message}</AlertDescription>
          </Alert>
        )}

        {executeMutation.data && (
          <div className="flex flex-col h-full">
            {/* Query stats */}
            <div className="flex items-center gap-4 px-3 py-2 border-b bg-muted/20 text-sm flex-shrink-0">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTime(executeMutation.data.queryTime || 0)}
              </span>
              <span className="text-muted-foreground">
                {executeMutation.data.data?.rowCount || 0} rows
              </span>
            </div>

            {/* Results table with its own scroll container */}
            <div className="flex-1 min-h-0">
              {executeMutation.data.data && executeMutation.data.data.columns.length > 0 && (
                <DataTable
                  columns={createColumns(executeMutation.data.data.columns)}
                  data={executeMutation.data.data.rows}
                />
              )}
            </div>
          </div>
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