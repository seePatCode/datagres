import { useState } from 'react'
import { Database, Search, Table, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface DatabaseConnection {
  id: string
  name: string
  database: string
}

interface Table {
  name: string
  rowCount?: number
}

interface DatabaseSidebarProps {
  connections: DatabaseConnection[]
  currentConnection?: DatabaseConnection
  tables: Table[]
  recentTables: Table[]
  onConnectionChange: (connectionId: string) => void
  onTableSelect: (tableName: string) => void
  selectedTable?: string
  className?: string
}

export function DatabaseSidebar({
  connections,
  currentConnection,
  tables,
  recentTables,
  onConnectionChange,
  onTableSelect,
  selectedTable,
  className,
}: DatabaseSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [recentExpanded, setRecentExpanded] = useState(true)
  const [allTablesExpanded, setAllTablesExpanded] = useState(true)

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatRowCount = (count?: number) => {
    if (!count) return ''
    if (count < 1000) return `(${count})`
    if (count < 1000000) return `(${(count / 1000).toFixed(1)}k)`
    return `(${(count / 1000000).toFixed(1)}M)`
  }

  return (
    <div className={cn("flex h-full flex-col border-r bg-background", className)}>
      {/* Connection Selector */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Database</span>
        </div>
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

      {/* Tables Section */}
      <div className="flex-1 overflow-hidden">
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

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
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
                  <div className="ml-4 space-y-0.5">
                    {recentTables.map((table) => (
                      <Button
                        key={`recent-${table.name}`}
                        variant={selectedTable === table.name ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onTableSelect(table.name)}
                        className="w-full justify-start gap-2 h-7 px-2 text-xs"
                      >
                        <Table className="h-3 w-3" />
                        <span className="truncate">{table.name}</span>
                        {table.rowCount && (
                          <span className="text-muted-foreground ml-auto">
                            {formatRowCount(table.rowCount)}
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
                <Separator className="my-2" />
              </>
            )}

            {/* All Tables */}
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
              <div className="ml-4 space-y-0.5">
                {filteredTables.map((table) => (
                  <Button
                    key={table.name}
                    variant={selectedTable === table.name ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => onTableSelect(table.name)}
                    className="w-full justify-start gap-2 h-7 px-2 text-xs"
                  >
                    <Table className="h-3 w-3" />
                    <span className="truncate">{table.name}</span>
                    {table.rowCount && (
                      <span className="text-muted-foreground ml-auto">
                        {formatRowCount(table.rowCount)}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            )}

            {searchQuery && filteredTables.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No tables found matching "{searchQuery}"
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}