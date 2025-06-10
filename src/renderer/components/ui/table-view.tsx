import { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { RefreshCw, Save, MoreHorizontal, Filter, EyeOff, Eye, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EditableDataTable } from '@/components/ui/editable-data-table'
import { SQLWhereEditor } from '@/components/ui/sql-where-editor-monaco'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useServerSideTableData } from '@/hooks/useServerSideTableData'

interface TableViewProps {
  tableName: string
  connectionString: string
  onSave?: () => void
  hasUnsavedChanges?: boolean
  className?: string
  initialSearchTerm?: string
  initialPage?: number
  initialPageSize?: number
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
    size: 120, // Default column width
    minSize: 60,
    maxSize: 180, // Smaller max width for more compact display
  }))
}

export function TableView({
  tableName,
  connectionString,
  onSave,
  hasUnsavedChanges = false,
  className,
  initialSearchTerm = '',
  initialPage = 1,
  initialPageSize = 100,
}: TableViewProps) {
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [editedCells, setEditedCells] = useState<Map<string, any>>(new Map())
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [optimisticData, setOptimisticData] = useState<any>(null)
  
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
  
  // Use server-side table data hook
  const {
    data,
    totalRows,
    isLoading,
    isError,
    error,
    refetch,
    searchTerm,
    setSearchTerm,
    handleSearchCommit,
    activeSearchTerm,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  } = useServerSideTableData({
    connectionString,
    tableName,
    enabled: !!connectionString && !!tableName,
    pageSize: initialPageSize
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
  
  // Initialize pagination from props when table changes
  useEffect(() => {
    if (initialPage !== page) {
      setPage(initialPage)
    }
    if (initialPageSize !== pageSize) {
      setPageSize(initialPageSize)
    }
  }, [tableName, initialPage, initialPageSize])

  // Create column definitions
  const columns = data ? createColumns(data.columns) : []

  const formatRowCount = (count: number) => {
    if (count < 1000) return count.toLocaleString()
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`
    return `${(count / 1000000).toFixed(1)}M`
  }

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

  const handleSaveChanges = async () => {
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
      <div className="flex items-center justify-between border-b bg-background" style={{ overflow: 'visible', zIndex: 100 }}>
        <div className="flex-1 m-0.5" style={{ overflow: 'visible' }}>
          <SQLWhereEditor
            value={searchTerm}
            onChange={setSearchTerm}
            onCommit={handleSearchCommit}
            schema={schemaData}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center gap-2 px-3">
          {/* Save button (if changes) */}
          {hasEdits && (
            <Button 
              onClick={handleSaveChanges} 
              size="sm" 
              className="gap-1" 
              variant="default"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save {editedCells.size} Change{editedCells.size > 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
          
          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditedCells(new Map())
              refetch()
            }}
            disabled={isLoading}
            className="gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Column Visibility
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(data?.columns || []).map((columnName: string) => {
                const isVisible = columnVisibility[columnName] !== false
                return (
                  <DropdownMenuCheckboxItem
                    key={columnName}
                    checked={isVisible}
                    onCheckedChange={(checked) => {
                      setColumnVisibility(prev => ({
                        ...prev,
                        [columnName]: checked
                      }))
                    }}
                    onSelect={(event) => {
                      // Prevent dropdown from closing when clicking checkbox
                      event.preventDefault()
                    }}
                    className="capitalize"
                  >
                    <div className="flex items-center gap-2">
                      {isVisible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                      {columnName}
                    </div>
                  </DropdownMenuCheckboxItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
      <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            {data ? `${formatRowCount(data.rows.length)} of ${formatRowCount(totalRows)}` : '0'} rows
            {activeSearchTerm && ` WHERE ${activeSearchTerm}`}
          </span>
          {data && data.columns.length > 0 && (
            <span>{data.columns.length} columns</span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={!hasPreviousPage || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[100px] text-center">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!hasNextPage || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {hasEdits && (
            <span className="text-orange-600">
              {editedCells.size} unsaved change{editedCells.size > 1 ? 's' : ''}
            </span>
          )}
          {isLoading && (
            <span className="text-cyan-600">Loading...</span>
          )}
        </div>
      </div>
    </div>
  )
}