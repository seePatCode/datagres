import { RefreshCw, Save, MoreHorizontal, Eye, EyeOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SQLWhereEditorSimple } from '@/components/ui/sql-where-editor-simple'
import { SqlAiPrompt } from '@/components/ui/sql-ai-prompt'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'

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
  onCancelEdits?: () => void
  
  // Refresh props
  isLoading: boolean
  onRefresh: () => void
  
  // Column visibility props
  columns: string[]
  columnVisibility: Record<string, boolean>
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void
  
  // AI props
  connectionString?: string
  tableName?: string
  schemas?: any[]
  
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
  onCancelEdits,
  isLoading,
  onRefresh,
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  connectionString,
  tableName,
  schemas,
}: TableToolbarProps) {
  const [showAiPrompt, setShowAiPrompt] = useState(false)
  const [aiPromptPosition, setAiPromptPosition] = useState<{ top: number; left: number } | undefined>()
  
  const handleAiPrompt = (position: { top: number; left: number }) => {
    setAiPromptPosition(position)
    setShowAiPrompt(true)
  }
  
  const handleInsertWhereClause = (sql: string) => {
    // The SQL should already be just the WHERE clause condition
    onSearchChange(sql.trim())
    onSearchCommit()
  }
  return (
    <div className="flex items-center border-b bg-background py-1" style={{ zIndex: 100 }}>
      <div className="flex-1 min-w-0 px-2 py-1" style={{ overflow: 'visible' }}>
        <SQLWhereEditorSimple
          value={searchTerm}
          onChange={onSearchChange}
          onCommit={onSearchCommit}
          schema={schemaData}
          disabled={isLoading}
          onAiPrompt={handleAiPrompt}
        />
      </div>

      <div className="flex items-center gap-1 px-2 bg-background border-l">
        {/* Save/Cancel buttons (if changes) */}
        {hasEdits && (
          <>
            <Button 
              onClick={onSave} 
              size="sm" 
              className="rounded-none px-2" 
              variant="default"
              disabled={isSaving}
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  {editedCellsCount}
                </>
              )}
            </Button>
            {onCancelEdits && (
              <Button
                onClick={onCancelEdits}
                size="sm"
                className="rounded-none px-2"
                variant="outline"
                disabled={isSaving}
                title="Cancel all changes"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
        
        {/* Refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="rounded-none px-2"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        
        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-none">
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
      
      {/* AI Prompt */}
      <SqlAiPrompt
        isOpen={showAiPrompt}
        onClose={() => setShowAiPrompt(false)}
        onInsertSql={handleInsertWhereClause}
        connectionString={connectionString || ''}
        tableName={tableName}
        schemas={schemaData ? [schemaData] : []}
        position={aiPromptPosition}
        mode="where-clause"
      />
    </div>
  )
}