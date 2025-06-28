import { useState, useEffect, useRef, useCallback } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { RefreshCw, AlertCircle, Sparkles, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { EditableDataTable } from '@/components/ui/editable-data-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TableToolbar } from '@/components/ui/table-toolbar'
import { TableStatusBar } from '@/components/ui/table-status-bar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useInfiniteTableData } from '@/hooks/useInfiniteTableData'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { DEFAULT_PAGE_SIZE, DEFAULT_COLUMN_WIDTH, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH, INFINITE_SCROLL_THRESHOLD } from '@/constants'
import type { TableSchema } from '@shared/types'
import { toast } from '@/hooks/use-toast'
import { formatCellValue, formatCellTooltip, isJsonValue } from '@/lib/formatters'

interface TableViewProps {
  tableName: string
  connectionString: string
  onSave?: () => void
  hasUnsavedChanges?: boolean
  className?: string
  initialSearchTerm?: string
  initialPageSize?: number
  onSearchChange?: (searchTerm: string) => void
  tables?: Array<{ name: string }>
}

// Helper function to create columns dynamically
const createColumns = (columnNames: string[]): ColumnDef<any>[] => {
  return columnNames.map((columnName, index) => ({
    id: columnName, // Add explicit ID for drag and drop
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

export function TableView({
  tableName,
  connectionString,
  onSave,
  hasUnsavedChanges = false,
  className,
  initialSearchTerm = '',
  initialPageSize = DEFAULT_PAGE_SIZE,
  onSearchChange,
  tables = [],
}: TableViewProps) {
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [editedCells, setEditedCells] = useState<Map<string, any>>(new Map())
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [optimisticData, setOptimisticData] = useState<any>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [allSchemas, setAllSchemas] = useState<TableSchema[]>([])
  const [isFixingError, setIsFixingError] = useState(false)
  const [lastExecutedSearch, setLastExecutedSearch] = useState<string>('')
  
  // Fetch table schema for autocomplete
  const { data: schemaData } = useQuery({
    queryKey: ['table-schema', connectionString, tableName],
    queryFn: async () => {
      const result = await window.electronAPI.fetchTableSchema(connectionString, tableName)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch table schema')
      }
      return result.schema
    },
    enabled: !!connectionString && !!tableName,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
  
  // Use infinite table data hook
  const {
    data,
    allRows,
    totalRows,
    isLoading,
    isLoadingMore,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    searchTerm,
    setSearchTerm,
    handleSearchCommit,
    activeSearchTerm,
    orderBy,
    setOrderBy,
  } = useInfiniteTableData({
    connectionString,
    tableName,
    enabled: !!connectionString && !!tableName,
    pageSize: initialPageSize
  })
  
  // Set up infinite scroll
  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoading: isLoadingMore,
    threshold: INFINITE_SCROLL_THRESHOLD,
    rootRef: scrollContainerRef as React.RefObject<HTMLElement>
  })
  
  // Initialize search term from props when table changes
  useEffect(() => {
    if (initialSearchTerm !== searchTerm) {
      setSearchTerm(initialSearchTerm)
      if (initialSearchTerm) {
        // Also set the active search term if there's an initial value
        handleSearchCommit()
      }
    }
    // Clear edited cells, errors, and optimistic data when switching tables
    setEditedCells(new Map())
    setSaveError(null)
    setOptimisticData(null)
  }, [tableName, initialSearchTerm])
  
  // Clear optimistic data when search changes
  useEffect(() => {
    setOptimisticData(null)
  }, [activeSearchTerm])
  
  // Wrap the setter to notify parent
  const handleSearchChange = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
    onSearchChange?.(newSearchTerm)
  }, [onSearchChange, setSearchTerm])
  
  // Track search commits for error fixing
  const handleSearchCommitWithTracking = useCallback(() => {
    setLastExecutedSearch(searchTerm)
    handleSearchCommit()
  }, [searchTerm, handleSearchCommit])

  // Create column definitions
  const columns = data ? createColumns(data.columns) : []


  const handleSaveChanges = useCallback(async () => {
    if (!data || !schemaData || editedCells.size === 0) return
    
    setIsSaving(true)
    setSaveError(null)
    // Process edited cells for saving
    
    // Get primary key columns from schema
    const primaryKeyColumns = schemaData.columns.filter(col => col.isPrimaryKey).map(col => col.name)
    
    if (primaryKeyColumns.length === 0) {
      // No primary key found for table
      setSaveError('Cannot save: table has no primary key')
      setIsSaving(false)
      return
    }
    
    // Build updates array
    const updates: any[] = []
    
    for (const [cellKey, value] of editedCells) {
      const [rowIndexStr, columnId] = cellKey.split('-')
      const rowIndex = parseInt(rowIndexStr)
      const row = data.rows[rowIndex]
      
      if (!row) continue
      
      // Build primary key values for WHERE clause
      const primaryKeyValues: Record<string, any> = {}
      for (const pkColumn of primaryKeyColumns) {
        const pkColumnIndex = data.columns.indexOf(pkColumn)
        if (pkColumnIndex >= 0) {
          primaryKeyValues[pkColumn] = row[pkColumnIndex]
        }
      }
      
      updates.push({
        rowIndex,
        columnName: columnId,
        value,
        primaryKeyColumns: primaryKeyValues
      })
    }
    
    try {
      const result = await window.electronAPI.updateTableData(connectionString, {
        tableName,
        updates
      })
      
      if (result.success) {
        // Successfully updated rows
        
        // Don't use optimistic updates when there's an active search
        // because the optimistic data doesn't apply the WHERE clause
        if (data && !activeSearchTerm) {
          const updatedData = {
            ...data,
            rows: [...data.rows] // Create a new array to trigger re-render
          }
          
          for (const update of updates) {
            const { rowIndex, columnName, value } = update
            const columnIndex = data.columns.indexOf(columnName)
            if (columnIndex >= 0 && updatedData.rows[rowIndex]) {
              // Create a new row array to ensure immutability
              updatedData.rows[rowIndex] = [...updatedData.rows[rowIndex]]
              updatedData.rows[rowIndex][columnIndex] = value
            }
          }
          
          setOptimisticData(updatedData)
        }
        
        // Clear edited cells and errors
        setEditedCells(new Map())
        setSaveError(null)
        
        // Refetch in the background and clear optimistic data when done
        ;(async () => {
          await refetch()
          setOptimisticData(null)
        })()
      } else {
        // Failed to update data
        console.error('Update failed:', result.error)
        setSaveError(result.error || 'Failed to save changes')
      }
    } catch (error) {
      // Error updating data
      console.error('Update error:', error)
      setSaveError(error instanceof Error ? error.message : 'An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }, [connectionString, tableName, data, schemaData, editedCells, activeSearchTerm, refetch])
  
  // Handle Cmd+S for saving changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && editedCells.size > 0) {
        e.preventDefault()
        handleSaveChanges()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editedCells.size, handleSaveChanges])

  const handleCellEdit = (rowIndex: number, columnId: string, value: any) => {
    const cellKey = `${rowIndex}-${columnId}`
    const newEditedCells = new Map(editedCells)
    
    // Get original value to compare
    // Column ID is the column name, we need to find the index
    const columnIndex = data?.columns.findIndex((col: string) => col === columnId) ?? -1
    const originalValue = columnIndex >= 0 ? data?.rows[rowIndex]?.[columnIndex] : undefined
    
    if (value === originalValue) {
      // If value is same as original, remove from edited cells
      newEditedCells.delete(cellKey)
    } else {
      // Add to edited cells
      newEditedCells.set(cellKey, value)
    }
    
    setEditedCells(newEditedCells)
  }

  // Fetch all table schemas for AI context
  useEffect(() => {
    const fetchAllSchemas = async () => {
      try {
        if (tables.length > 0) {
          // Fetch schemas for all tables
          const schemaPromises = tables.slice(0, 10).map(async (table) => { // Limit to first 10 tables for performance
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
          setAllSchemas(validSchemas)
        }
      } catch (error) {
        console.error('Failed to fetch schemas:', error)
      }
    }
    
    if (connectionString && tables.length > 0) {
      fetchAllSchemas()
    }
  }, [connectionString, tables])

  const hasEdits = editedCells.size > 0

  return (
    <div className={`flex h-full flex-col min-w-0 ${className}`}>
      {/* Error Alert */}
      {saveError && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}
      
      {/* Toolbar */}
      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSearchCommit={handleSearchCommitWithTracking}
        schemaData={schemaData}
        hasEdits={hasEdits}
        editedCellsCount={editedCells.size}
        isSaving={isSaving}
        onSave={handleSaveChanges}
        isLoading={isLoading}
        onRefresh={() => {
          setEditedCells(new Map())
          refetch()
        }}
        columns={data?.columns || []}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        connectionString={connectionString}
        tableName={tableName}
        schemas={allSchemas}
      />

      {/* Data Table */}
      <div className="flex-1 overflow-hidden">
        {isError ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md">
              <Alert variant="destructive">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <AlertDescription className="text-sm">
                      <div className="font-medium mb-1">Error loading table</div>
                      <div className="opacity-90">{error?.message}</div>
                      {lastExecutedSearch && (
                        <div className="mt-2 text-xs opacity-70">
                          WHERE: {lastExecutedSearch}
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                  {lastExecutedSearch && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              setIsFixingError(true)
                              try {
                                // Generate a prompt for fixing the WHERE clause
                                const fixPrompt = `Fix this WHERE clause error.

Error: ${error?.message}

Failed WHERE clause: ${lastExecutedSearch}

The error indicates a problem with the WHERE condition. Common issues:
- Column doesn't exist (check exact column names)
- Wrong data type (e.g., comparing text to number)
- Invalid syntax

Return ONLY the corrected WHERE condition.`
                                
                                const result = await window.electronAPI.generateSQL('[where-clause-only] ' + fixPrompt, {
                                  prompt: '[where-clause-only] ' + fixPrompt,
                                  tableName: tableName,
                                  columns: schemaData?.columns.map(c => c.name) || [],
                                  allSchemas: schemaData ? [schemaData] : []
                                })
                                
                                if (result.success && result.sql) {
                                  // Show toast with before/after comparison
                                  toast({
                                    title: "WHERE clause fixed!",
                                    description: (
                                      <div className="space-y-2 mt-2">
                                        <div>
                                          <span className="text-xs font-medium">Before:</span>
                                          <pre className="mt-1 p-2 bg-muted/30 rounded border text-xs font-mono overflow-x-auto">
                                            <code>{lastExecutedSearch}</code>
                                          </pre>
                                        </div>
                                        <div>
                                          <span className="text-xs font-medium">After:</span>
                                          <pre className="mt-1 p-2 bg-muted/30 rounded border text-xs font-mono overflow-x-auto">
                                            <code>{result.sql}</code>
                                          </pre>
                                        </div>
                                      </div>
                                    ),
                                    duration: 8000, // Show for 8 seconds to give time to review
                                  })
                                  
                                  // Update the search term with the fixed WHERE clause
                                  handleSearchChange(result.sql)
                                  // Clear the error by triggering a new search
                                  setTimeout(() => {
                                    handleSearchCommitWithTracking()
                                  }, 100)
                                } else {
                                  alert(result.error || 'Failed to fix WHERE clause. Please check the column names and syntax.')
                                }
                              } catch (error) {
                                console.error('Error fixing WHERE clause:', error)
                                alert('Failed to connect to AI service. Please ensure Ollama is running.')
                              } finally {
                                setIsFixingError(false)
                              }
                            }}
                            disabled={isFixingError}
                            className="gap-1"
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
                          <p>Use AI to analyze and fix the WHERE clause error</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </Alert>
            </div>
          </div>
        ) : (optimisticData || data) && (optimisticData || data).columns.length > 0 ? (
          <EditableDataTable 
            columns={columns}
            data={(optimisticData || data).rows}
            tableName={tableName}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            onCellEdit={handleCellEdit}
            editedCells={editedCells}
            scrollContainerRef={scrollContainerRef as React.RefObject<HTMLDivElement>}
            onSortingChange={(updaterOrValue: any) => {
              // Handle both updater function and direct value
              const newSorting = typeof updaterOrValue === 'function' 
                ? updaterOrValue(orderBy.map((sort: any) => ({
                    id: sort.column,
                    desc: sort.direction === 'desc'
                  })))
                : updaterOrValue
              
              // Convert TanStack sorting state to our orderBy format
              const newOrderBy = newSorting.map((sort: any) => ({
                column: sort.id,
                direction: sort.desc ? 'desc' as const : 'asc' as const
              }))
              setOrderBy(newOrderBy)
            }}
            sorting={orderBy.map((sort: any) => ({
              id: sort.column,
              desc: sort.direction === 'desc'
            }))}
            infiniteScrollContent={
              hasNextPage && allRows?.length > 0 ? (
                <div ref={sentinelRef} className="h-20 flex items-center justify-center">
                  {isLoadingMore ? (
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <div className="text-sm text-muted-foreground">Scroll for more...</div>
                  )}
                </div>
              ) : null
            }
          />
        ) : isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
              <div className="text-muted-foreground">Loading table data...</div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="text-muted-foreground mb-2">No data available</div>
              <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Table
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <TableStatusBar
        rowCount={data?.rows.length || 0}
        totalRows={totalRows}
        columnCount={data?.columns.length || 0}
        activeSearchTerm={activeSearchTerm}
        unsavedChangesCount={editedCells.size}
        isLoadingMore={isLoadingMore}
      />
    </div>
  )
}