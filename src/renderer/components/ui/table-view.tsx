import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Search, RefreshCw, Save, MoreHorizontal, Filter, EyeOff, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  data,
  onRefresh,
  onSave,
  isLoading = false,
  hasUnsavedChanges = false,
  className,
}: TableViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  
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
      <div className="flex items-center justify-between border-b bg-background overflow-visible">
        <div className="flex-1 overflow-visible">
          {/* Search */}
          <div className="relative m-0.5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-none border focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-0 focus-visible:border-cyan-500/30"
            />
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
            onClick={onRefresh}
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
              {data.columns.map((columnName) => {
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
        {data.columns.length > 0 ? (
          <DataTable 
            columns={columns}
            data={filteredRows}
            tableName={tableName}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
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