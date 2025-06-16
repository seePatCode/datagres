import { useState, useEffect, useRef, useCallback } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { EditableDataTable } from '@/components/ui/editable-data-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TableToolbar } from '@/components/ui/table-toolbar'
import { TableStatusBar } from '@/components/ui/table-status-bar'
import { useInfiniteTableData } from '@/hooks/useInfiniteTableData'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { DEFAULT_PAGE_SIZE, DEFAULT_COLUMN_WIDTH, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH, INFINITE_SCROLL_THRESHOLD } from '@/constants'

interface TableViewProps {
  tableName: string
  connectionString: string
  onSave?: () => void
  hasUnsavedChanges?: boolean
  className?: string
  initialSearchTerm?: string
  initialPageSize?: number
  onSearchChange?: (searchTerm: string) => void
}

// Helper function to create columns dynamically
const createColumns = (columnNames: string[]): ColumnDef<any>[] => {
  return columnNames.map((columnName, index) => ({
    id: columnName, // Add explicit ID for drag and drop
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
}: TableViewProps) {
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [editedCells, setEditedCells] = useState<Map<string, any>>(new Map())
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [optimisticData, setOptimisticData] = useState<any>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
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
    rootRef: scrollContainerRef
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
        refetch().then(() => {
          setOptimisticData(null)
        })
      } else {
        // Failed to update data
        setSaveError(result.error || 'Failed to save changes')
      }
    } catch (error) {
      // Error updating data
      setSaveError('An error occurred while saving')
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
        onSearchCommit={handleSearchCommit}
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
      />

      {/* Data Table */}
      <div className="flex-1 overflow-hidden">
        {isError ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="text-destructive mb-2">Error loading table</div>
              <div className="text-sm text-muted-foreground mb-4">{error?.message}</div>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
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
            scrollContainerRef={scrollContainerRef}
            onSortingChange={(updaterOrValue) => {
              // Handle both updater function and direct value
              const newSorting = typeof updaterOrValue === 'function' 
                ? updaterOrValue(orderBy.map(sort => ({
                    id: sort.column,
                    desc: sort.direction === 'desc'
                  })))
                : updaterOrValue
              
              // Convert TanStack sorting state to our orderBy format
              const newOrderBy = newSorting.map(sort => ({
                column: sort.id,
                direction: sort.desc ? 'desc' as const : 'asc' as const
              }))
              setOrderBy(newOrderBy)
            }}
            sorting={orderBy.map(sort => ({
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