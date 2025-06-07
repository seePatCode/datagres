import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Search, RefreshCw, Save, MoreHorizontal, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'

interface TableViewProps {
  tableName: string
  data: {
    columns: string[]
    rows: any[][]
  }
  onRefresh: () => void
  onSave?: () => void
  isLoading?: boolean
  hasUnsavedChanges?: boolean
  className?: string
}

// Helper function to create columns dynamically
const createColumns = (columnNames: string[]): ColumnDef<any>[] => {
  return columnNames.map((columnName, index) => ({
    accessorKey: index.toString(),
    header: columnName,
    cell: ({ getValue }) => {
      const value = getValue()
      return value !== null ? String(value) : (
        <span className="text-muted-foreground italic">NULL</span>
      )
    },
  }))
}

export function TableView({
  tableName,
  data,
  onRefresh,
  onSave,
  isLoading = false,
  hasUnsavedChanges = false,
  className,
}: TableViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filter rows based on search query
  const filteredRows = data.rows.filter(row =>
    row.some(cell =>
      cell?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  // Create column definitions
  const columns = createColumns(data.columns)

  const formatRowCount = (count: number) => {
    if (count < 1000) return count.toLocaleString()
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`
    return `${(count / 1000000).toFixed(1)}M`
  }

  return (
    <div className={`flex h-full flex-col min-w-0 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-background">
        <div className="flex items-center gap-3">
          {/* Table name */}
          <h2 className="text-lg font-semibold">{tableName}</h2>
          
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {/* More options */}
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-hidden">
        {data.columns.length > 0 ? (
          <DataTable 
            columns={columns}
            data={filteredRows}
            tableName={tableName}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="text-muted-foreground mb-2">No data available</div>
              <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
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
            {formatRowCount(filteredRows.length)} 
            {searchQuery && filteredRows.length !== data.rows.length && 
              ` of ${formatRowCount(data.rows.length)}`
            } rows
          </span>
          {data.columns.length > 0 && (
            <span>{data.columns.length} columns</span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {hasUnsavedChanges && (
            <span className="text-orange-600">Unsaved changes</span>
          )}
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}