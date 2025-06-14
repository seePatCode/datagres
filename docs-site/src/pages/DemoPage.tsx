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

  const tables = ['users', 'orders', 'products', 'customers', 'invoices']
  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2024-01-16' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: '2024-01-17' },
  ]

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Interactive Demo</h1>
        <p className="text-muted-foreground">
          Experience Datagres's interface without installing anything. Try the keyboard shortcuts!
        </p>
      </div>

      {/* Connection Bar */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Connected to: postgresql://demo@localhost:5432/sample_db</span>
            </div>
            <Button size="sm" variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Manage Connections
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tables</CardTitle>
              <CardDescription>5 tables in database</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 p-2">
                {tables.map((table) => (
                  <button
                    key={table}
                    onClick={() => setSelectedTable(table)}
                    className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
                      selectedTable === table
                        ? 'bg-secondary text-foreground'
                        : 'hover:bg-secondary/50'
                    }`}
                  >
                    <Table className="h-4 w-4" />
                    {table}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 rounded-lg border bg-secondary/30 p-4">
            <h3 className="mb-2 text-sm font-medium">Try These Shortcuts</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Quick Search</span>
                <kbd className="rounded bg-background px-2 py-0.5">Shift+Shift</kbd>
              </div>
              <div className="flex justify-between">
                <span>New Connection</span>
                <kbd className="rounded bg-background px-2 py-0.5">Cmd+N</kbd>
              </div>
              <div className="flex justify-between">
                <span>Execute Query</span>
                <kbd className="rounded bg-background px-2 py-0.5">Cmd+Enter</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="data" className="w-full">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="structure">Structure</TabsTrigger>
                <TabsTrigger value="query">Query</TabsTrigger>
              </TabsList>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setQuickSearchOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                Quick Search
              </Button>
            </div>

            <TabsContent value="data" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedTable}</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Row
                      </Button>
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rounded border bg-background px-3 py-1 text-sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2 text-left text-sm font-medium">ID</th>
                          <th className="p-2 text-left text-sm font-medium">Name</th>
                          <th className="p-2 text-left text-sm font-medium">Email</th>
                          <th className="p-2 text-left text-sm font-medium">Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockData
                          .filter(row => 
                            !searchQuery || 
                            Object.values(row).some(v => 
                              v.toString().toLowerCase().includes(searchQuery.toLowerCase())
                            )
                          )
                          .map((row) => (
                            <tr key={row.id} className="border-b hover:bg-secondary/30">
                              <td className="p-2 text-sm">{row.id}</td>
                              <td className="p-2 text-sm">{row.name}</td>
                              <td className="p-2 text-sm">{row.email}</td>
                              <td className="p-2 text-sm">{row.created_at}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="structure">
              <Card>
                <CardHeader>
                  <CardTitle>Table Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left text-sm font-medium">Column</th>
                        <th className="p-2 text-left text-sm font-medium">Type</th>
                        <th className="p-2 text-left text-sm font-medium">Nullable</th>
                        <th className="p-2 text-left text-sm font-medium">Default</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2 text-sm">id</td>
                        <td className="p-2 text-sm">integer</td>
                        <td className="p-2 text-sm">NO</td>
                        <td className="p-2 text-sm">nextval('users_id_seq')</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 text-sm">name</td>
                        <td className="p-2 text-sm">varchar(255)</td>
                        <td className="p-2 text-sm">NO</td>
                        <td className="p-2 text-sm">NULL</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 text-sm">email</td>
                        <td className="p-2 text-sm">varchar(255)</td>
                        <td className="p-2 text-sm">NO</td>
                        <td className="p-2 text-sm">NULL</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 text-sm">created_at</td>
                        <td className="p-2 text-sm">timestamp</td>
                        <td className="p-2 text-sm">NO</td>
                        <td className="p-2 text-sm">CURRENT_TIMESTAMP</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="query">
              <Card>
                <CardHeader>
                  <CardTitle>SQL Query Editor</CardTitle>
                  <CardDescription>Write and execute SQL queries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded border bg-secondary/30 p-4 font-mono text-sm">
                      SELECT * FROM {selectedTable}<br />
                      WHERE created_at &gt; '2024-01-01'<br />
                      ORDER BY id DESC<br />
                      LIMIT 100;
                    </div>
                    <div className="flex gap-2">
                      <Button>
                        Execute Query (Cmd+Enter)
                      </Button>
                      <Button variant="outline">
                        Explain Query
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Quick Search Dialog */}
      <Dialog open={quickSearchOpen} onOpenChange={setQuickSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Table Search</DialogTitle>
            <DialogDescription>
              Search for tables in your database (Shift+Shift)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Type to search tables..."
              className="w-full rounded border bg-background px-3 py-2"
              autoFocus
            />
            <div className="space-y-2">
              {tables.map((table) => (
                <button
                  key={table}
                  onClick={() => {
                    setSelectedTable(table)
                    setQuickSearchOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 hover:bg-secondary"
                >
                  <Table className="h-4 w-4" />
                  {table}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}