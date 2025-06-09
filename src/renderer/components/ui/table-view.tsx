import { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Search, RefreshCw, Save, MoreHorizontal, Filter, EyeOff, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { SQLWhereEditor } from '@/components/ui/sql-where-editor-v2'
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
  console.log('[TableView] Rendering with props:', { tableName, connectionString, initialSearchTerm, initialPage, initialPageSize })
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  
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
  }, [tableName, initialSearchTerm])
  
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

  return (
    <div className={`flex h-full flex-col min-w-0 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-background" style={{ overflow: 'visible', zIndex: 100 }}>
        <div className="flex-1" style={{ overflow: 'visible' }}>
          {/* Search */}
          <div className="relative m-0.5 flex items-center" style={{ overflow: 'visible' }}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <div className="pl-9 flex-1" style={{ overflow: 'visible' }}>
              <SQLWhereEditor
                value={searchTerm}
                onChange={setSearchTerm}
                onCommit={handleSearchCommit}
                schema={schemaData}
                disabled={isLoading}
                placeholder="WHERE clause (e.g., location = 'NYC' AND age > 25) - Press Enter"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3">
          {/* Save button (if changes) */}
          {hasUnsavedChanges && onSave && (
            <Button onClick={onSave} size="sm" className="gap-1">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          )}
          
          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
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
              {(data?.columns || []).map((columnName) => {
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
        ) : data && data.columns.length > 0 ? (
          <DataTable 
            columns={columns}
            data={data.rows}
            tableName={tableName}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
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
          {hasUnsavedChanges && (
            <span className="text-orange-600">Unsaved changes</span>
          )}
          {isLoading && (
            <span className="text-cyan-600">Loading...</span>
          )}
        </div>
      </div>
    </div>
  )
}