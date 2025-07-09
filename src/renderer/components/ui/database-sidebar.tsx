import { useState, useEffect } from 'react'
import { Database, Search, Table, Clock, ChevronDown, ChevronRight, FileCode2, ChevronsUpDown, Edit2, Trash2, Copy, Info, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { TableInfoDialog } from '@/components/ui/table-info-dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'
import type { SchemaInfo, TableInfo } from '@shared/types'

interface DatabaseConnection {
  id: string
  name: string
  database: string
}

interface DatabaseSidebarProps {
  connections: DatabaseConnection[]
  currentConnection?: DatabaseConnection
  tables: TableInfo[]  // Still support flat table list for backward compatibility
  schemas?: SchemaInfo[]  // New: schemas with their tables
  recentTables: TableInfo[]
  starredTables: TableInfo[]
  onConnectionChange: (connectionId: string) => void
  onTableSelect: (tableName: string, schemaName?: string) => void
  onToggleTableStar: (tableName: string) => void
  isTableStarred: (tableName: string) => boolean
  selectedTable?: string
  className?: string
  onNewQuery?: () => void
  onEditConnection?: (connection: any) => void
  onDeleteConnection?: (connectionId: string) => void
  connectionString?: string
}

export function DatabaseSidebar({
  connections,
  currentConnection,
  tables,
  schemas,
  recentTables,
  starredTables,
  onConnectionChange,
  onTableSelect,
  onToggleTableStar,
  isTableStarred,
  selectedTable,
  className,
  onNewQuery,
  onEditConnection,
  onDeleteConnection,
  connectionString,
}: DatabaseSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [starredExpanded, setStarredExpanded] = useState(true)
  const [recentExpanded, setRecentExpanded] = useState(true)
  const [allTablesExpanded, setAllTablesExpanded] = useState(true)
  const [schemaExpanded, setSchemaExpanded] = useState<Record<string, boolean>>({})
  const [tableInfoDialog, setTableInfoDialog] = useState<{
    open: boolean
    tableName: string
    schemaName?: string
  }>({ open: false, tableName: '' })
  
  // Initialize all schemas as expanded when schemas change
  useEffect(() => {
    if (schemas) {
      const initialExpanded: Record<string, boolean> = {}
      schemas.forEach(schema => {
        initialExpanded[schema.name] = true
      })
      setSchemaExpanded(initialExpanded)
    }
  }, [schemas])

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Filter schemas and their tables
  const filteredSchemas = schemas?.map(schema => ({
    ...schema,
    tables: schema.tables.filter(table =>
      table.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(schema => schema.tables.length > 0)

  const formatRowCount = (count?: number) => {
    if (!count) return ''
    if (count < 1000) return `(${count})`
    if (count < 1000000) return `(${(count / 1000).toFixed(1)}k)`
    return `(${(count / 1000000).toFixed(1)}M)`
  }
  
  const handleExpandAll = () => {
    if (schemas) {
      const expanded: Record<string, boolean> = {}
      schemas.forEach(schema => {
        expanded[schema.name] = true
      })
      setSchemaExpanded(expanded)
    }
  }
  
  const handleCollapseAll = () => {
    setSchemaExpanded({})
  }

  const handleCopyTableName = async (tableName: string) => {
    try {
      await navigator.clipboard.writeText(tableName)
      toast({
        description: `Copied "${tableName}" to clipboard`,
        duration: 2000,
      })
    } catch (err) {
      console.error('Failed to copy table name:', err)
      toast({
        variant: "destructive",
        description: "Failed to copy table name",
        duration: 3000,
      })
    }
  }

  const handleViewTableInfo = (tableName: string, schemaName?: string) => {
    setTableInfoDialog({
      open: true,
      tableName,
      schemaName,
    })
  }
  
  const toggleSchema = (schemaName: string) => {
    setSchemaExpanded(prev => ({
      ...prev,
      [schemaName]: !prev[schemaName]
    }))
  }

  return (
    <>
      <div className={cn("flex h-full flex-col border-r bg-sidebar min-w-0 overflow-hidden", className)}>
      {/* Connection Selector */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Database</span>
        </div>
        {currentConnection && onEditConnection && onDeleteConnection ? (
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div>
                <Select 
                  value={currentConnection?.id} 
                  onValueChange={onConnectionChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select connection..." />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((connection) => (
                      <SelectItem key={connection.id} value={connection.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{connection.name}</span>
                          <span className="text-xs text-muted-foreground">{connection.database}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => onEditConnection(currentConnection)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </ContextMenuItem>
              <ContextMenuItem 
                onClick={() => onDeleteConnection(currentConnection.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Connection
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ) : (
          <Select 
            value={currentConnection?.id} 
            onValueChange={onConnectionChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select connection..." />
            </SelectTrigger>
            <SelectContent>
              {connections.map((connection) => (
                <SelectItem key={connection.id} value={connection.id}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{connection.name}</span>
                    <span className="text-xs text-muted-foreground">{connection.database}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Scratchpad Button */}
      {onNewQuery && (
        <div className="p-3 border-b">
          <Button 
            onClick={onNewQuery}
            className="w-full justify-start gap-2"
            variant="outline"
            size="sm"
          >
            <FileCode2 className="h-4 w-4" />
            Scratchpad
          </Button>
        </div>
      )}

      {/* Tables Section */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {tables.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              {filteredTables.length} of {tables.length} tables
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
          <div className="p-2 space-y-1 min-w-0">
            {/* Starred Tables */}
            {starredTables.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStarredExpanded(!starredExpanded)}
                  className="w-full justify-start gap-1 h-7 px-2 text-muted-foreground hover:text-foreground"
                >
                  {starredExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-xs font-medium">Starred</span>
                </Button>
                
                {starredExpanded && (
                  <div className="ml-4 space-y-0.5 overflow-hidden min-w-0 pr-2" style={{ width: 'calc(100% - 1rem)' }}>
                    {starredTables.map((table) => (
                      <ContextMenu key={`starred-${table.name}`}>
                        <ContextMenuTrigger>
                          <button
                            onClick={() => onTableSelect(table.name, table.schema)}
                            className={cn(
                              "w-full h-7 text-xs px-2 rounded-md transition-all",
                              "flex items-center gap-2 min-w-0 overflow-hidden",
                              "active:scale-[0.98]",
                              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                              selectedTable === table.name
                                ? "bg-muted text-muted-foreground shadow-sm hover:bg-muted/80 hover:text-foreground"
                                : "hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <Table className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate flex-1 text-left">{table.name}</span>
                            <Star 
                              className="h-3 w-3 flex-shrink-0 fill-current text-yellow-500 hover:text-yellow-600" 
                              onClick={(e) => {
                                e.stopPropagation()
                                onToggleTableStar(table.name)
                              }}
                            />
                          </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => handleViewTableInfo(table.name, table.schema)}>
                            <Info className="mr-2 h-4 w-4" />
                            View Info
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => handleCopyTableName(table.name)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Table Name
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => onToggleTableStar(table.name)}>
                            <Star className="mr-2 h-4 w-4" />
                            Unstar Table
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </div>
                )}
                <Separator className="my-2" />
              </>
            )}

            {/* Recent Tables */}
            {recentTables.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRecentExpanded(!recentExpanded)}
                  className="w-full justify-start gap-1 h-7 px-2 text-muted-foreground hover:text-foreground"
                >
                  {recentExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <Clock className="h-3 w-3" />
                  <span className="text-xs font-medium">Recent</span>
                </Button>
                
                {recentExpanded && (
                  <div className="ml-4 space-y-0.5 overflow-hidden min-w-0 pr-2" style={{ width: 'calc(100% - 1rem)' }}>
                    {recentTables.map((table) => (
                      <ContextMenu key={`recent-${table.name}`}>
                        <ContextMenuTrigger>
                          <button
                            onClick={() => onTableSelect(table.name, table.schema)}
                            className={cn(
                              "w-full h-7 text-xs px-2 rounded-md transition-all",
                              "flex items-center gap-2 min-w-0 overflow-hidden",
                              "active:scale-[0.98]",
                              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                              selectedTable === table.name
                                ? "bg-muted text-muted-foreground shadow-sm hover:bg-muted/80 hover:text-foreground"
                                : "hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <Table className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate flex-1 text-left">{table.name}</span>
                            {table.rowCount && (
                              <span className="text-muted-foreground ml-auto flex-shrink-0">
                                {formatRowCount(table.rowCount)}
                              </span>
                            )}
                            <Star 
                              className={cn(
                                "h-3 w-3 flex-shrink-0 ml-1",
                                isTableStarred(table.name) ? "fill-current text-yellow-500" : "text-muted-foreground"
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                onToggleTableStar(table.name)
                              }}
                            />
                          </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => handleViewTableInfo(table.name, table.schema)}>
                            <Info className="mr-2 h-4 w-4" />
                            View Info
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => handleCopyTableName(table.name)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Table Name
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => onToggleTableStar(table.name)}>
                            <Star className="mr-2 h-4 w-4" />
                            {isTableStarred(table.name) ? 'Unstar' : 'Star'} Table
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </div>
                )}
                <Separator className="my-2" />
              </>
            )}

            {/* All Tables - with schemas or fallback */}
            {schemas && schemas.length > 0 ? (
              <>
                <div className="flex items-center justify-between px-2 pb-1 min-w-0 overflow-hidden">
                  <span className="text-xs font-medium text-muted-foreground truncate">All Tables</span>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExpandAll}
                      className="h-6 px-2 text-xs"
                      title="Expand all schemas"
                    >
                      Expand All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCollapseAll}
                      className="h-6 px-2 text-xs"
                      title="Collapse all schemas"
                    >
                      Collapse All
                    </Button>
                  </div>
                </div>
                
                {/* Render schemas */}
                {filteredSchemas?.map((schema) => (
                  <div key={schema.name} className="min-w-0 overflow-hidden">
                    <button
                      onClick={() => toggleSchema(schema.name)}
                      className={cn(
                        "w-full h-7 px-2 rounded-md transition-all cursor-pointer",
                        "flex items-center justify-start gap-1 min-w-0 overflow-hidden",
                        "text-muted-foreground hover:text-foreground hover:bg-accent",
                        "active:scale-[0.98]",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      )}
                    >
                      {schemaExpanded[schema.name] ? (
                        <ChevronDown className="h-3 w-3 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 flex-shrink-0" />
                      )}
                      <Database className="h-3 w-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="text-xs font-medium truncate text-left">{schema.name}</div>
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                        ({schema.tables.length})
                      </span>
                    </button>
                    
                    {schemaExpanded[schema.name] && (
                      <div className="ml-6 space-y-0.5 overflow-hidden min-w-0 pr-2" style={{ width: 'calc(100% - 1.5rem)' }}>
                        {schema.tables.map((table) => (
                          <ContextMenu key={`${schema.name}.${table.name}`}>
                            <ContextMenuTrigger>
                              <button
                                onClick={() => onTableSelect(table.name, schema.name)}
                                className={cn(
                                  "w-full h-7 text-xs px-2 rounded-md transition-all",
                                  "flex items-center gap-2 min-w-0 overflow-hidden",
                                  "active:scale-[0.98]",
                                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                  selectedTable === table.name
                                    ? "bg-muted text-muted-foreground shadow-sm hover:bg-muted/80 hover:text-foreground"
                                    : "hover:bg-accent hover:text-accent-foreground"
                                )}
                              >
                                <Table className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate flex-1 text-left">{table.name}</span>
                                {table.rowCount && (
                                  <span className="text-muted-foreground ml-auto flex-shrink-0">
                                    {formatRowCount(table.rowCount)}
                                  </span>
                                )}
                                <Star 
                                  className={cn(
                                    "h-3 w-3 flex-shrink-0 ml-1",
                                    isTableStarred(table.name) ? "fill-current text-yellow-500" : "text-muted-foreground"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onToggleTableStar(table.name)
                                  }}
                                />
                              </button>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem onClick={() => handleViewTableInfo(table.name, schema.name)}>
                                <Info className="mr-2 h-4 w-4" />
                                View Info
                              </ContextMenuItem>
                              <ContextMenuItem onClick={() => handleCopyTableName(table.name)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Table Name
                              </ContextMenuItem>
                              <ContextMenuItem onClick={() => onToggleTableStar(table.name)}>
                                <Star className="mr-2 h-4 w-4" />
                                {isTableStarred(table.name) ? 'Unstar' : 'Star'} Table
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              /* Fallback to old flat table list */
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAllTablesExpanded(!allTablesExpanded)}
                  className="w-full justify-start gap-1 h-7 px-2 text-muted-foreground hover:text-foreground"
                >
                  {allTablesExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <Table className="h-3 w-3" />
                  <span className="text-xs font-medium">All Tables</span>
                </Button>

                {allTablesExpanded && (
                  <div className="ml-4 space-y-0.5 overflow-hidden min-w-0 pr-2" style={{ width: 'calc(100% - 1rem)' }}>
                    {filteredTables.map((table) => (
                      <ContextMenu key={table.name}>
                        <ContextMenuTrigger>
                          <button
                            onClick={() => onTableSelect(table.name, table.schema)}
                            className={cn(
                              "w-full h-7 text-xs px-2 rounded-md transition-all",
                              "flex items-center gap-2 min-w-0 overflow-hidden",
                              "active:scale-[0.98]",
                              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                              selectedTable === table.name
                                ? "bg-muted text-muted-foreground shadow-sm hover:bg-muted/80 hover:text-foreground"
                                : "hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <Table className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate flex-1 text-left">{table.name}</span>
                            {table.rowCount && (
                              <span className="text-muted-foreground ml-auto flex-shrink-0">
                                {formatRowCount(table.rowCount)}
                              </span>
                            )}
                            <Star 
                              className={cn(
                                "h-3 w-3 flex-shrink-0 ml-1",
                                isTableStarred(table.name) ? "fill-current text-yellow-500" : "text-muted-foreground"
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                onToggleTableStar(table.name)
                              }}
                            />
                          </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => handleViewTableInfo(table.name, table.schema)}>
                            <Info className="mr-2 h-4 w-4" />
                            View Info
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => handleCopyTableName(table.name)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Table Name
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => onToggleTableStar(table.name)}>
                            <Star className="mr-2 h-4 w-4" />
                            {isTableStarred(table.name) ? 'Unstar' : 'Star'} Table
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </div>
                )}
              </>
            )}

            {searchQuery && filteredTables.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground px-2">
                No tables found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Table Info Dialog */}
      {connectionString && (
        <TableInfoDialog
          open={tableInfoDialog.open}
          onOpenChange={(open) => setTableInfoDialog(prev => ({ ...prev, open }))}
          tableName={tableInfoDialog.tableName}
          schemaName={tableInfoDialog.schemaName}
          connectionString={connectionString}
        />
      )}
    </>
  )
}