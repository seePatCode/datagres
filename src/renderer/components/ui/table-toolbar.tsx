import { RefreshCw, Save, MoreHorizontal, Eye, EyeOff, AlertCircle, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SQLWhereEditor } from '@/components/ui/sql-where-editor-monaco'
import { SqlAiPrompt } from '@/components/ui/sql-ai-prompt'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
  
  // Error handling props
  queryError?: Error | null
  lastExecutedSearch?: string
  isFixingError?: boolean
  onFixError?: (errorMessage: string) => void | Promise<void>
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
  connectionString,
  tableName,
  schemas,
  queryError,
  lastExecutedSearch,
  isFixingError,
  onFixError,
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
    <div className="flex flex-col" style={{ overflow: 'visible', zIndex: 100 }}>
      {/* Error Alert */}
      {queryError && (
        <div className="flex justify-center p-2 border-b bg-background">
          <Alert variant="destructive" className="w-auto max-w-2xl" data-testid="where-clause-error">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <AlertDescription className="text-sm">
                {queryError.message}
                {lastExecutedSearch && (
                  <div className="mt-1 text-xs opacity-80">
                    WHERE: {lastExecutedSearch}
                  </div>
                )}
              </AlertDescription>
              {onFixError && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onFixError(queryError.message)}
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
                      <p>Use AI to analyze and fix the WHERE clause error</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </Alert>
        </div>
      )}
      
      {/* Main Toolbar */}
      <div className="flex items-center justify-between border-b bg-background" style={{ overflow: 'visible' }}>
      <div className="flex-1 m-0.5" style={{ overflow: 'visible' }}>
        <SQLWhereEditor
          value={searchTerm}
          onChange={onSearchChange}
          onCommit={onSearchCommit}
          schema={schemaData}
          disabled={isLoading}
          onAiPrompt={handleAiPrompt}
        />
      </div>

      <div className="flex items-center gap-2 px-3">
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