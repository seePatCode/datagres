import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DataTable } from '@/components/ui/data-table'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SQLEditor, SQLEditorHandle } from '@/components/ui/sql-editor'
import { SqlAiPrompt } from '@/components/ui/sql-ai-prompt'
import { useSqlSettings } from '@/hooks/useSettings'
import { useDebounce } from '@/hooks/useDebounce'
import { Play, Loader2, AlertCircle, Clock, Eye, Sparkles, Check } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import type { TableSchema, TableInfo } from '@shared/types'
import { formatCellValue, formatCellTooltip, isJsonValue } from '@/lib/formatters'
import { DEFAULT_COLUMN_WIDTH, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH } from '@/constants'

interface SQLQueryViewProps {
  connectionString: string
  initialQuery?: string
  onQueryChange?: (query: string) => void
  tables?: TableInfo[]
}

// Helper function to create columns dynamically
const createColumns = (columnNames: string[]): ColumnDef<any>[] => {
  return columnNames.map((columnName, index) => ({
    id: columnName,
    accessorKey: index.toString(),
    header: columnName,
    cell: ({ getValue }) => {
      const value = getValue()
      const isJson = isJsonValue(value)
      return (
        <div 
          className="font-mono text-vs-ui py-1 px-2 hover:bg-muted/30 transition-colors w-full truncate"
          title={formatCellTooltip(value)}
        >
          {value !== null ? (
            <span className="text-foreground">
              {formatCellValue(value)}
            </span>
          ) : (
            <span className="text-muted-foreground italic font-system text-vs-ui-small">
              NULL
            </span>
          )}
        </div>
      )
    },
    size: DEFAULT_COLUMN_WIDTH,
    minSize: MIN_COLUMN_WIDTH,
    maxSize: MAX_COLUMN_WIDTH,
  }))
}

export function SQLQueryView({ connectionString, initialQuery = '', onQueryChange, tables = [] }: SQLQueryViewProps) {
  const [query, setQuery] = useState(typeof initialQuery === 'string' ? initialQuery : '')
  const editorRef = useRef<SQLEditorHandle>(null)
  const { livePreview, setLivePreview } = useSqlSettings()
  const [schemas, setSchemas] = useState<TableSchema[]>([])
  const [showAiPrompt, setShowAiPrompt] = useState(false)
  const [aiPromptPosition, setAiPromptPosition] = useState<{ top: number; left: number } | undefined>()
  const [isFixingError, setIsFixingError] = useState(false)
  const [lastExecutedQuery, setLastExecutedQuery] = useState<string>('')
  const [fixSuccessMessage, setFixSuccessMessage] = useState<{ before: string; after: string } | null>(null)
  
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
          // Schema fetch failed - continue without it
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

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery)
    onQueryChange?.(newQuery)
  }, [onQueryChange])

  const handleExecute = useCallback(() => {
    // Get selected text if any, otherwise use the entire query
    const selectedText = editorRef.current?.getSelectedText() || ''
    const queryToExecute = selectedText.trim() ? selectedText : query
    
    if (queryToExecute.trim()) {
      setLastExecutedQuery(queryToExecute)
      setFixSuccessMessage(null) // Clear any success message
      executeMutation.mutate(queryToExecute)
    }
  }, [query, executeMutation])

  const handleInsertSql = useCallback((sql: string, replaceSelection: boolean = false) => {
    if (editorRef.current) {
      if (replaceSelection) {
        // Replace selected text with generated SQL
        editorRef.current.insertText(sql)
      } else {
        // Insert SQL at cursor position
        editorRef.current.insertText(sql)
      }
      // Focus back to editor
      editorRef.current.focus()
    }
  }, [])

  // Handle Cmd+K for AI prompt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the editor is focused
      const isEditorFocused = editorRef.current?.isFocused()
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && isEditorFocused) {
        e.preventDefault()
        e.stopPropagation()
        
        // Get cursor position from Monaco editor
        const cursorPos = editorRef.current?.getCursorPosition()
        if (cursorPos) {
          setAiPromptPosition({
            top: cursorPos.top + 30, // Below cursor
            left: Math.min(cursorPos.left, window.innerWidth - 400) // Ensure it fits
          })
        }
        
        setShowAiPrompt(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [])

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
      setLastExecutedQuery(debouncedQuery)
      setFixSuccessMessage(null) // Clear any success message
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
          <div className="flex-1 relative" data-testid="sql-editor">
            {/* Show placeholder hint when editor is empty */}
            {!query.trim() && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-muted-foreground text-sm">
                  Type a SQL query or press <kbd className="px-2 py-1 mx-1 text-xs bg-muted rounded">⌘K</kbd> to generate with AI
                </div>
              </div>
            )}
            {useMemo(() => (
              <SQLEditor
                ref={editorRef}
                value={query}
                onChange={handleQueryChange}
                onExecute={handleExecute}
                schemas={schemas}
              />
            ), [query, handleQueryChange, handleExecute, schemas])}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {executeMutation.error && (
          <div className="flex justify-center p-2">
            <Alert variant="destructive" className="w-auto max-w-2xl" data-testid="sql-error">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <AlertDescription className="text-sm">{executeMutation.error.message}</AlertDescription>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={async () => {
                        setIsFixingError(true);
                        try {
                          // Get the query that failed (use the last executed query)
                          const failedQuery = lastExecutedQuery || query.trim();
                          const errorMessage = executeMutation.error.message;
                          
                          // Generate a prompt for fixing the SQL
                          const fixPrompt = `Fix this SQL error by finding the correct column name.

Error: ${errorMessage}

Failed query:
${failedQuery}

IMPORTANT: The error says a column doesn't exist. Look at the available columns in the schema and find the correct column name to use instead. For example:
- If "user_id" doesn't exist, look for "author_id", "committer_id", "created_by", etc.
- If "created_at" doesn't exist, look for "created", "timestamp", "date_created", etc.

Return ONLY the corrected SQL query.`;
                          
                          const result = await window.electronAPI.generateSQL(fixPrompt, {
                            prompt: fixPrompt,
                            tableName: tables[0]?.name || '',
                            columns: schemas[0]?.columns.map(c => c.name) || [],
                            allSchemas: schemas
                          });
                          
                          if (result.success && result.sql) {
                            console.log('AI fixed SQL:', result.sql);
                            console.log('Original failed SQL:', failedQuery);
                            
                            // Check if the AI actually changed the query
                            if (result.sql.trim() === failedQuery.trim()) {
                              console.warn('AI returned the same query without fixing it');
                              alert('The AI could not fix this error. The column name might not exist in any table. Please check your database schema.');
                              return;
                            }
                            
                            // Replace only the failed query part in the editor
                            const currentEditorContent = query;
                            const failedQueryIndex = currentEditorContent.indexOf(failedQuery);
                            
                            if (failedQueryIndex !== -1) {
                              // Replace the specific failed query
                              const newContent = 
                                currentEditorContent.substring(0, failedQueryIndex) +
                                result.sql +
                                currentEditorContent.substring(failedQueryIndex + failedQuery.length);
                              handleQueryChange(newContent);
                              
                              // Select the fixed query in the editor
                              setTimeout(() => {
                                editorRef.current?.selectText(failedQueryIndex, failedQueryIndex + result.sql.length);
                              }, 50); // Small delay to ensure editor has updated
                            } else {
                              // If we can't find the exact query, just replace the whole content
                              handleQueryChange(result.sql);
                              
                              // Select all text
                              setTimeout(() => {
                                editorRef.current?.selectText(0, result.sql.length);
                              }, 50);
                            }
                            
                            // Clear the error by resetting the mutation
                            executeMutation.reset();
                            // Show success message with before/after
                            setFixSuccessMessage({
                              before: failedQuery,
                              after: result.sql
                            });
                            // Don't auto-hide - message stays until next query
                          } else {
                            console.error('Failed to fix SQL:', result.error);
                            // Show error in alert if AI fails
                            alert(result.error || 'Failed to fix SQL query. Please check if Ollama is running.');
                          }
                        } catch (error) {
                          console.error('Error calling AI to fix SQL:', error);
                          alert('Failed to connect to AI service. Please ensure Ollama is running.');
                        } finally {
                          setIsFixingError(false);
                        }
                      }}
                      disabled={isFixingError}
                      className="gap-1 flex-shrink-0"
                    >
                      {isFixingError ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Fixing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          Fix with AI
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Use AI to analyze and fix the SQL error</p>
                  </TooltipContent>
                </Tooltip>
                </TooltipProvider>
              </div>
            </Alert>
          </div>
        )}

        {/* Success message after fixing */}
        {fixSuccessMessage && !executeMutation.error && (
          <div className="flex justify-center p-2">
            <Alert className="w-auto max-w-4xl border-green-500/50 bg-green-50/10" data-testid="sql-fix-success">
              <div className="flex items-start gap-3">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <AlertDescription className="text-sm font-medium text-green-700">
                    Query fixed! Review the changes and press Execute when ready.
                  </AlertDescription>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground font-medium">Before:</span>
                      <pre className="mt-1 p-2 bg-muted/30 rounded border text-xs font-mono overflow-x-auto">
                        <code>{fixSuccessMessage.before}</code>
                      </pre>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground font-medium">After:</span>
                      <pre className="mt-1 p-2 bg-muted/30 rounded border text-xs font-mono overflow-x-auto">
                        <code>{fixSuccessMessage.after}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </Alert>
          </div>
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
            <div className="flex-1 min-h-0" data-testid="query-results">
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
      
      {/* AI Prompt */}
      <SqlAiPrompt
        isOpen={showAiPrompt}
        onClose={() => setShowAiPrompt(false)}
        onInsertSql={handleInsertSql}
        connectionString={connectionString}
        tableName={tables[0]?.name}
        schemas={schemas}
        position={aiPromptPosition}
        selectedText={editorRef.current?.getSelectedText()}
      />
    </div>
  )
}