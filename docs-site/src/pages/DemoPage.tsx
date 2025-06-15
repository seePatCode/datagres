import { useState, useEffect } from 'react'
import { Button } from '@/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/dialog'
import { Database, Table, Search, Plus, Settings, RefreshCw, MoreHorizontal, Eye, EyeOff, Save } from 'lucide-react'
import Editor from '@monaco-editor/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Table as DataTable, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell,
} from '@/components/table'

export default function DemoPage() {
  const [selectedTable, setSelectedTable] = useState('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [quickSearchOpen, setQuickSearchOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('data')
  const [tabs, setTabs] = useState([
    { id: '1', type: 'table', name: 'users', tableName: 'users' }
  ])
  const [activeTabId, setActiveTabId] = useState('1')
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [editedCells] = useState(new Map())
  const [isLoading] = useState(false)

  const tables = ['users', 'orders', 'products', 'customers', 'invoices']
  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2024-01-15 10:30:45', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2024-01-16 14:22:18', status: 'active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: '2024-01-17 09:15:33', status: 'inactive' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', created_at: '2024-01-18 16:45:27', status: 'active' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', created_at: '2024-01-19 11:20:15', status: 'pending' },
  ]

  const handleTableSelect = (table: string) => {
    const newTab = {
      id: Date.now().toString(),
      type: 'table' as const,
      name: table,
      tableName: table
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
    setSelectedTable(table)
    setQuickSearchOpen(false)
  }

  const handleCloseTab = (tabId: string) => {
    const newTabs = tabs.filter(t => t.id !== tabId)
    if (newTabs.length === 0) {
      setTabs([{ id: '1', type: 'table', name: 'users', tableName: 'users' }])
      setActiveTabId('1')
    } else if (activeTabId === tabId) {
      setActiveTabId(newTabs[newTabs.length - 1].id)
    }
    setTabs(newTabs)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">

      {/* Title Bar */}
      <div className="flex h-12 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-3">
          <Database className="h-4 w-4 text-green-500" />
          <span className="text-sm">demo@localhost/sample_db</span>
          <span className="text-xs text-muted-foreground">PostgreSQL 16.2</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-7 px-2">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-[hsl(var(--sidebar))] p-3">
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium">Tables</h3>
              <span className="text-xs text-muted-foreground">{tables.length}</span>
            </div>
            <div className="space-y-0.5">
              {tables.map((table) => (
                <button
                  key={table}
                  onClick={() => handleTableSelect(table)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                    selectedTable === table
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <Table className="h-3.5 w-3.5" />
                  {table}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded border bg-background/50 p-3">
            <h3 className="mb-2 text-xs font-medium">Keyboard Shortcuts</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quick Search</span>
                <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs">⇧⇧</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Close Tab</span>
                <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs">⌘W</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Query</span>
                <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs">⌘T</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tabs Bar */}
          <div className="flex h-10 items-center border-b bg-background">
            <div className="flex flex-1 items-center gap-0.5 overflow-x-auto px-2">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`group flex h-8 cursor-pointer items-center gap-1.5 rounded-t border border-b-0 px-3 text-sm transition-colors ${
                    activeTabId === tab.id
                      ? 'border-border bg-background'
                      : 'border-transparent bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <Table className="h-3.5 w-3.5" />
                  <span>{tab.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCloseTab(tab.id)
                    }}
                    className="ml-1 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() => handleTableSelect('new_query')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 px-2">
              <Button 
                size="sm" 
                variant="ghost"
                className="h-7 px-2"
                onClick={() => setQuickSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <TabsList className="h-8">
                <TabsTrigger value="data" className="h-7 text-xs">Data</TabsTrigger>
                <TabsTrigger value="structure" className="h-7 text-xs">Structure</TabsTrigger>
                <TabsTrigger value="query" className="h-7 text-xs">Query</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="data" className="flex-1 overflow-hidden p-0">
              <div className="flex h-full flex-col">
                {/* Table Toolbar */}
                <div className="flex items-center justify-between border-b bg-background" style={{ overflow: 'visible', zIndex: 100 }}>
                  <div className="flex-1 m-0.5" style={{ overflow: 'visible' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap px-2">WHERE</span>
                      <div className="relative flex-1 h-8 border rounded">
                          <Editor
                            height="32px"
                            defaultLanguage="sql"
                            value={searchQuery}
                            onChange={(value) => setSearchQuery(value || '')}
                            options={{
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              lineNumbers: 'off',
                              glyphMargin: false,
                              folding: false,
                              lineDecorationsWidth: 0,
                              lineNumbersMinChars: 0,
                              automaticLayout: true,
                              wordWrap: 'off',
                              fontSize: 12,
                              fontFamily: "'SF Mono', Monaco, Consolas, 'Courier New', monospace",
                              suggestFontSize: 12,
                              padding: { top: 4, bottom: 4 },
                              renderLineHighlight: 'none',
                              scrollbar: {
                                vertical: 'hidden',
                                horizontal: 'hidden',
                              },
                              overviewRulerLanes: 0,
                              hideCursorInOverviewRuler: true,
                              overviewRulerBorder: false,
                              contextmenu: false,
                            }}
                            theme="vs-dark"
                          />
                        </div>
                      </div>
                    </div>
                  <div className="flex items-center gap-2 px-3">
                    {/* Save button (only shows when there are edits) */}
                    {editedCells.size > 0 && (
                      <Button 
                        size="sm" 
                        className="gap-1" 
                        variant="default"
                      >
                        <Save className="h-4 w-4" />
                        Save {editedCells.size} Change{editedCells.size > 1 ? 's' : ''}
                      </Button>
                    )}
                    
                    {/* Refresh button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    
                    {/* Column visibility dropdown */}
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
                        {['id', 'name', 'email', 'created_at', 'status'].map((columnName) => {
                          const isVisible = columnVisibility[columnName] !== false
                          return (
                            <DropdownMenuCheckboxItem
                              key={columnName}
                              checked={isVisible}
                              onCheckedChange={(checked) => {
                                setColumnVisibility({
                                  ...columnVisibility,
                                  [columnName]: checked
                                })
                              }}
                              onSelect={(event) => {
                                // Prevent dropdown from closing
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
                <div className="flex-1 overflow-auto">
                  <DataTable>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>id</TableHead>
                        <TableHead>name</TableHead>
                        <TableHead>email</TableHead>
                        <TableHead>created_at</TableHead>
                        <TableHead>status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockData
                        .filter(row => {
                          if (!searchQuery) return true;
                          try {
                            // Simple WHERE clause simulation
                            if (searchQuery.includes('=')) {
                              const [field, value] = searchQuery.split('=').map(s => s.trim())
                              const cleanValue = value.replace(/['";]/g, '')
                              return row[field as keyof typeof row]?.toString().toLowerCase() === cleanValue.toLowerCase()
                            }
                            // Default to text search
                            return Object.values(row).some(v => 
                              v.toString().toLowerCase().includes(searchQuery.toLowerCase())
                            )
                          } catch {
                            return true
                          }
                        })
                        .map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <div className="font-mono text-vs-ui truncate py-1 px-2 hover:bg-muted/30 transition-colors">
                                {row.id}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-vs-ui truncate py-1 px-2 hover:bg-muted/30 transition-colors">
                                {row.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-vs-ui truncate py-1 px-2 hover:bg-muted/30 transition-colors">
                                {row.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-vs-ui truncate py-1 px-2 hover:bg-muted/30 transition-colors">
                                {row.created_at}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-vs-ui truncate py-1 px-2 hover:bg-muted/30 transition-colors">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                                  row.status === 'active' ? 'bg-green-500/20 text-green-600' : 
                                  row.status === 'inactive' ? 'bg-red-500/20 text-red-600' : 
                                  'bg-yellow-500/20 text-yellow-600'
                                }`}>
                                  {row.status}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </DataTable>
                </div>
                {/* Status Bar */}
                <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20 text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>
                      {mockData.filter(row => {
                        if (!searchQuery) return true;
                        try {
                          if (searchQuery.includes('=')) {
                            const [field, value] = searchQuery.split('=').map(s => s.trim())
                            const cleanValue = value.replace(/['";]/g, '')
                            return row[field as keyof typeof row]?.toString().toLowerCase() === cleanValue.toLowerCase()
                          }
                          return Object.values(row).some(v => 
                            v.toString().toLowerCase().includes(searchQuery.toLowerCase())
                          )
                        } catch {
                          return true
                        }
                      }).length} of {mockData.length} rows
                      {searchQuery && ` WHERE ${searchQuery}`}
                    </span>
                    <span>5 columns</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {editedCells.size > 0 && (
                      <span className="text-orange-600">
                        {editedCells.size} unsaved change{editedCells.size > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="structure" className="flex-1 overflow-hidden p-0">
              <div className="flex h-full flex-col">
                <div className="border-b px-4 py-2">
                  <h3 className="text-sm font-medium">Table Structure - {selectedTable}</h3>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <DataTable>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Column</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Nullable</TableHead>
                        <TableHead>Default</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono">id</TableCell>
                        <TableCell className="font-mono text-cyan-500">integer</TableCell>
                        <TableCell className="font-mono">NO</TableCell>
                        <TableCell className="font-mono text-muted-foreground">nextval('users_id_seq')</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">name</TableCell>
                        <TableCell className="font-mono text-cyan-500">varchar(255)</TableCell>
                        <TableCell className="font-mono">NO</TableCell>
                        <TableCell className="font-mono text-muted-foreground">NULL</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">email</TableCell>
                        <TableCell className="font-mono text-cyan-500">varchar(255)</TableCell>
                        <TableCell className="font-mono">NO</TableCell>
                        <TableCell className="font-mono text-muted-foreground">NULL</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">created_at</TableCell>
                        <TableCell className="font-mono text-cyan-500">timestamp</TableCell>
                        <TableCell className="font-mono">NO</TableCell>
                        <TableCell className="font-mono text-muted-foreground">CURRENT_TIMESTAMP</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">status</TableCell>
                        <TableCell className="font-mono text-cyan-500">varchar(50)</TableCell>
                        <TableCell className="font-mono">YES</TableCell>
                        <TableCell className="font-mono text-muted-foreground">'active'</TableCell>
                      </TableRow>
                    </TableBody>
                  </DataTable>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="query" className="flex-1 overflow-hidden p-0">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b px-4 py-2">
                  <h3 className="text-sm font-medium">SQL Query</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                      Execute (⌘↩)
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                      Explain
                    </Button>
                  </div>
                </div>
                <div className="flex-1 p-4">
                  <div className="h-full rounded border bg-muted/30 p-4 font-mono text-sm">
                    <div className="text-cyan-500">SELECT</div>
                    <div className="ml-4">*</div>
                    <div className="text-cyan-500">FROM</div>
                    <div className="ml-4">{selectedTable}</div>
                    <div className="text-cyan-500">WHERE</div>
                    <div className="ml-4">created_at &gt; <span className="text-green-500">'2024-01-01'</span></div>
                    <div className="text-cyan-500">ORDER BY</div>
                    <div className="ml-4">id DESC</div>
                    <div className="text-cyan-500">LIMIT</div>
                    <div className="ml-4">100;</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Quick Search Dialog */}
      <Dialog open={quickSearchOpen} onOpenChange={setQuickSearchOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base">Quick Table Search</DialogTitle>
            <DialogDescription className="text-xs">
              Jump to any table in your database
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <input
              type="text"
              placeholder="Search tables..."
              className="h-9 w-full rounded border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <div className="max-h-[300px] space-y-1 overflow-y-auto">
              {tables.map((table) => (
                <button
                  key={table}
                  onClick={() => handleTableSelect(table)}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <Table className="h-4 w-4" />
                  <span>{table}</span>
                  <span className="ml-auto text-xs text-muted-foreground">table</span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}