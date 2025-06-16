import { RefreshCw, Save, MoreHorizontal, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SQLWhereEditor } from '@/components/ui/sql-where-editor-monaco'
import { AiSqlInput } from '@/components/ui/ai-sql-input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TableToolbarProps {
  // Search props
  searchTerm: string
  onSearchChange: (value: string) => void
  onSearchCommit: () => void
  schemaData: any
  
  // Save props
  hasEdits: boolean
  editedCellsCount: number
  isSaving: boolean
  onSave: () => void
  
  // Refresh props
  isLoading: boolean
  onRefresh: () => void
  
  // Column visibility props
  columns: string[]
  columnVisibility: Record<string, boolean>
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void
  
  // AI props
  tableName?: string
}

export function TableToolbar({
  searchTerm,
  onSearchChange,
  onSearchCommit,
  schemaData,
  hasEdits,
  editedCellsCount,
  isSaving,
  onSave,
  isLoading,
  onRefresh,
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  tableName,
}: TableToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b bg-background" style={{ overflow: 'visible', zIndex: 100 }}>
      <div className="flex-1 m-0.5" style={{ overflow: 'visible' }}>
        <SQLWhereEditor
          value={searchTerm}
          onChange={onSearchChange}
          onCommit={onSearchCommit}
          schema={schemaData}
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-2 px-3">
        {/* AI SQL Input */}
        {tableName && columns.length > 0 && (
          <AiSqlInput
            tableName={tableName}
            columns={columns}
            onSqlGenerated={(sql) => {
              // Extract WHERE clause from generated SQL
              const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i)
              if (whereMatch) {
                onSearchChange(whereMatch[1])
                onSearchCommit()
              } else if (sql.toLowerCase().includes('select')) {
                // If it's a simple SELECT *, clear the WHERE clause
                onSearchChange('')
                onSearchCommit()
              }
            }}
          />
        )}
        
        {/* Save button (if changes) */}
        {hasEdits && (
          <Button 
            onClick={onSave} 
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
                Save {editedCellsCount} Change{editedCellsCount > 1 ? 's' : ''}
              </>
            )}
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
            {columns.map((columnName) => {
              const isVisible = columnVisibility[columnName] !== false
              return (
                <DropdownMenuCheckboxItem
                  key={columnName}
                  checked={isVisible}
                  onCheckedChange={(checked) => {
                    onColumnVisibilityChange({
                      ...columnVisibility,
                      [columnName]: checked
                    })
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
  )
}