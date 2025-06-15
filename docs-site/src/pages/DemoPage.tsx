import { useState } from 'react'
import { Button } from '@/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/dialog'
import { Database, Table, Search, Plus, Settings } from 'lucide-react'

export default function DemoPage() {
  const [selectedTable, setSelectedTable] = useState('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [quickSearchOpen, setQuickSearchOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('data')
  const [tabs, setTabs] = useState([
    { id: '1', type: 'table', name: 'users', tableName: 'users' }
  ])
  const [activeTabId, setActiveTabId] = useState('1')

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
                <div className="flex items-center justify-between border-b px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{selectedTable}</span>
                    <span className="text-xs text-muted-foreground">({mockData.length} rows)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Filter data..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-7 rounded border bg-background px-2 text-sm"
                    />
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add Row
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">id</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">created_at</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">status</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-xs">
                      {mockData
                        .filter(row => 
                          !searchQuery || 
                          Object.values(row).some(v => 
                            v.toString().toLowerCase().includes(searchQuery.toLowerCase())
                          )
                        )
                        .map((row) => (
                          <tr key={row.id} className="border-b hover:bg-muted/30">
                            <td className="px-4 py-2">{row.id}</td>
                            <td className="px-4 py-2">{row.name}</td>
                            <td className="px-4 py-2">{row.email}</td>
                            <td className="px-4 py-2">{row.created_at}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                                row.status === 'active' ? 'bg-green-500/20 text-green-600' : 
                                row.status === 'inactive' ? 'bg-red-500/20 text-red-600' : 
                                'bg-yellow-500/20 text-yellow-600'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="structure" className="flex-1 overflow-hidden p-0">
              <div className="flex h-full flex-col">
                <div className="border-b px-4 py-2">
                  <h3 className="text-sm font-medium">Table Structure - {selectedTable}</h3>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Column</th>
                        <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                        <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Nullable</th>
                        <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Default</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-xs">
                      <tr className="border-b">
                        <td className="py-2">id</td>
                        <td className="py-2 text-cyan-500">integer</td>
                        <td className="py-2">NO</td>
                        <td className="py-2 text-muted-foreground">nextval('users_id_seq')</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">name</td>
                        <td className="py-2 text-cyan-500">varchar(255)</td>
                        <td className="py-2">NO</td>
                        <td className="py-2 text-muted-foreground">NULL</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">email</td>
                        <td className="py-2 text-cyan-500">varchar(255)</td>
                        <td className="py-2">NO</td>
                        <td className="py-2 text-muted-foreground">NULL</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">created_at</td>
                        <td className="py-2 text-cyan-500">timestamp</td>
                        <td className="py-2">NO</td>
                        <td className="py-2 text-muted-foreground">CURRENT_TIMESTAMP</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">status</td>
                        <td className="py-2 text-cyan-500">varchar(50)</td>
                        <td className="py-2">YES</td>
                        <td className="py-2 text-muted-foreground">'active'</td>
                      </tr>
                    </tbody>
                  </table>
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