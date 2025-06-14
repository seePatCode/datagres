import { useState, useEffect } from 'react'
import { Button } from '@/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card'
import { ArrowRight, Zap, Keyboard, Lock, Database, Table, Plus, Loader2, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HomePage() {
  const [connectionString, setConnectionString] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [showDemo, setShowDemo] = useState(false)

  const tables = [
    { name: 'users', count: 1847 },
    { name: 'orders', count: 5423 },
    { name: 'products', count: 342 },
    { name: 'customers', count: 892 },
    { name: 'invoices', count: 3251 },
  ]

  const mockData = {
    users: [
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', created_at: '2024-01-15 09:30:00' },
      { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', created_at: '2024-01-16 14:22:00' },
      { id: 3, name: 'Carol Williams', email: 'carol@example.com', role: 'user', created_at: '2024-01-17 11:45:00' },
      { id: 4, name: 'David Brown', email: 'david@example.com', role: 'moderator', created_at: '2024-01-18 16:30:00' },
      { id: 5, name: 'Emma Davis', email: 'emma@example.com', role: 'user', created_at: '2024-01-19 10:15:00' },
    ],
    orders: [
      { id: 1001, user_id: 1, total: 299.99, status: 'completed', created_at: '2024-02-01 10:30:00' },
      { id: 1002, user_id: 2, total: 149.50, status: 'processing', created_at: '2024-02-02 11:45:00' },
      { id: 1003, user_id: 3, total: 599.00, status: 'completed', created_at: '2024-02-03 09:20:00' },
      { id: 1004, user_id: 1, total: 79.99, status: 'shipped', created_at: '2024-02-04 14:10:00' },
      { id: 1005, user_id: 4, total: 450.00, status: 'pending', created_at: '2024-02-05 16:55:00' },
    ],
    products: [
      { id: 101, name: 'Wireless Mouse', price: 29.99, stock: 145, category: 'Electronics' },
      { id: 102, name: 'Mechanical Keyboard', price: 149.99, stock: 87, category: 'Electronics' },
      { id: 103, name: 'USB-C Hub', price: 49.99, stock: 203, category: 'Accessories' },
      { id: 104, name: 'Monitor Stand', price: 79.99, stock: 64, category: 'Furniture' },
      { id: 105, name: 'Laptop Sleeve', price: 39.99, stock: 189, category: 'Accessories' },
    ],
    customers: [
      { id: 201, company: 'Acme Corp', contact: 'John Smith', email: 'john@acme.com', country: 'USA' },
      { id: 202, company: 'Tech Solutions', contact: 'Sarah Johnson', email: 'sarah@techsol.com', country: 'Canada' },
      { id: 203, company: 'Global Imports', contact: 'Mike Chen', email: 'mike@global.com', country: 'China' },
      { id: 204, company: 'Euro Traders', contact: 'Anna Mueller', email: 'anna@euro.com', country: 'Germany' },
    ],
    invoices: [
      { id: 5001, order_id: 1001, amount: 299.99, due_date: '2024-03-01', status: 'paid' },
      { id: 5002, order_id: 1002, amount: 149.50, due_date: '2024-03-15', status: 'pending' },
      { id: 5003, order_id: 1003, amount: 599.00, due_date: '2024-03-10', status: 'paid' },
    ],
  }

  const handleConnect = () => {
    const connectString = connectionString.trim() || 'postgresql://demo:pass@localhost:5432/sample_db'
    setConnectionString(connectString)
    setIsConnecting(true)
    setTimeout(() => {
      setIsConnecting(false)
      setIsConnected(true)
    }, 1500)
  }

  const getTableData = () => {
    if (!selectedTable) return []
    return mockData[selectedTable as keyof typeof mockData] || []
  }

  const getTableColumns = () => {
    const data = getTableData()
    return data.length > 0 ? Object.keys(data[0]) : []
  }

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent" />
        <div className="container relative py-16 text-center">
          <img 
            src="/datagres/icon.png" 
            alt="Datagres" 
            className="mx-auto mb-6 h-24 w-24 drop-shadow-2xl"
          />
          <h1 className="mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
            Datagres
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            The Lightning-Fast PostgreSQL Explorer. Try it live below.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="https://github.com/seepatcode/datagres/releases">
              <Button size="lg" className="gap-2">
                Download Now <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setShowDemo(true)}
            >
              Try Live Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      {showDemo && (
        <section className="container py-12">
          <Card className="mx-auto max-w-6xl overflow-hidden">
            <div className="border-b bg-secondary/30 p-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-4 text-sm font-medium">Datagres</span>
              </div>
            </div>
            
            {!isConnected ? (
              <CardContent className="p-8">
                <div className="mx-auto max-w-xl">
                  <h2 className="mb-2 text-2xl font-bold">Connect to PostgreSQL</h2>
                  <p className="mb-6 text-muted-foreground">
                    Enter your connection string to get started
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Connection String
                      </label>
                      <input
                        type="text"
                        value={connectionString}
                        onChange={(e) => setConnectionString(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                        placeholder="postgresql://user:password@localhost:5432/database"
                        className="w-full rounded-md border bg-background px-4 py-2 focus:border-violet-500 focus:outline-none"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Try: <button 
                          onClick={() => {
                            setConnectionString('postgresql://demo:pass@localhost:5432/sample_db')
                            handleConnect()
                          }}
                          className="text-violet-400 hover:underline"
                        >
                          postgresql://demo:pass@localhost:5432/sample_db
                        </button>
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleConnect}
                      disabled={!connectionString.trim() || isConnecting}
                      className="w-full"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Database className="mr-2 h-4 w-4" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="mt-8 rounded-lg bg-secondary/30 p-4">
                    <h3 className="mb-2 text-sm font-medium">Recent Connections</h3>
                    <div className="space-y-2">
                      <button className="flex w-full items-center justify-between rounded px-3 py-2 text-sm hover:bg-secondary/50">
                        <span>postgresql://demo@localhost/sample_db</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </button>
                      <button className="flex w-full items-center justify-between rounded px-3 py-2 text-sm hover:bg-secondary/50">
                        <span>postgresql://prod@db.example.com/main</span>
                        <span className="text-xs text-muted-foreground">2 days ago</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            ) : (
              <div className="flex h-[600px]">
                {/* Sidebar */}
                <div className="w-64 border-r bg-secondary/10">
                  <div className="border-b p-4">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">sample_db</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      postgresql://demo@localhost:5432
                    </p>
                  </div>
                  
                  <div className="p-2">
                    <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                      Tables ({tables.length})
                    </h3>
                    <div className="space-y-1">
                      {tables.map((table) => (
                        <button
                          key={table.name}
                          onClick={() => setSelectedTable(table.name)}
                          className={`flex w-full items-center justify-between rounded px-3 py-2 text-sm transition-colors ${
                            selectedTable === table.name
                              ? 'bg-violet-500/20 text-violet-300'
                              : 'hover:bg-secondary/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Table className="h-4 w-4" />
                            <span>{table.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {table.count.toLocaleString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Main Content */}
                <div className="flex-1">
                  {selectedTable ? (
                    <>
                      <div className="border-b p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-lg font-semibold">{selectedTable}</h2>
                            <p className="text-sm text-muted-foreground">
                              Showing first 100 rows
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Row
                          </Button>
                        </div>
                      </div>
                      
                      <div className="overflow-auto">
                        <table className="w-full">
                          <thead className="sticky top-0 bg-secondary/50">
                            <tr>
                              {getTableColumns().map((col) => (
                                <th key={col} className="border-b px-4 py-2 text-left text-sm font-medium">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {getTableData().map((row, idx) => (
                              <tr key={idx} className="border-b hover:bg-secondary/20">
                                {Object.values(row).map((value, i) => (
                                  <td key={i} className="px-4 py-2 text-sm">
                                    {String(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <Table className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-medium">Select a table</h3>
                        <p className="text-sm text-muted-foreground">
                          Choose a table from the sidebar to view its data
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              This is a demo. Download Datagres to connect to your real databases.
            </p>
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section className="container py-24">
        <h2 className="mb-12 text-center text-4xl font-bold">Why Developers Love Datagres</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-violet-500/10" />
            <CardHeader>
              <Zap className="mb-4 h-10 w-10 text-violet-500" />
              <CardTitle>Instant Connection</CardTitle>
              <CardDescription>
                Connect in under 2 seconds. No JDBC drivers, no connection pools to configure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code className="block rounded bg-secondary p-3 text-xs">
                postgresql://user:pass@localhost/mydb
              </code>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-blue-500/10" />
            <CardHeader>
              <Keyboard className="mb-4 h-10 w-10 text-blue-500" />
              <CardTitle>Keyboard First</CardTitle>
              <CardDescription>
                Built for speed. Quick table search, tab navigation, and smart SQL completion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <kbd className="rounded bg-secondary px-2 py-1 text-xs">Shift+Shift</kbd>
                <kbd className="rounded bg-secondary px-2 py-1 text-xs">Cmd+N</kbd>
                <kbd className="rounded bg-secondary px-2 py-1 text-xs">Cmd+Enter</kbd>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-green-500/10" />
            <CardHeader>
              <Lock className="mb-4 h-10 w-10 text-green-500" />
              <CardTitle>Bank-Level Security</CardTitle>
              <CardDescription>
                Passwords in OS keychain. SSL auto-detection. Code-signed and notarized.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="text-green-500">✓</span> macOS Keychain
                <span className="text-green-500">✓</span> SSL/TLS
                <span className="text-green-500">✓</span> Notarized
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="bg-secondary/30">
        <div className="container py-24">
          <h2 className="mb-12 text-center text-4xl font-bold">Performance That Scales</h2>
          <div className="grid gap-8 text-center md:grid-cols-3">
            <div>
              <div className="mb-2 text-5xl font-bold">&lt; 2s</div>
              <p className="text-muted-foreground">Connection Time</p>
            </div>
            <div>
              <div className="mb-2 text-5xl font-bold">1M+</div>
              <p className="text-muted-foreground">Rows Handled</p>
            </div>
            <div>
              <div className="mb-2 text-5xl font-bold">60 FPS</div>
              <p className="text-muted-foreground">Smooth Scrolling</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24 text-center">
        <Database className="mx-auto mb-6 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-4 text-4xl font-bold">Ready to Explore Your Data?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          Download Datagres now and experience the fastest way to browse PostgreSQL databases.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="https://github.com/seepatcode/datagres/releases">
            <Button size="lg">Download for Free</Button>
          </a>
          <a href="https://github.com/seepatcode/datagres">
            <Button size="lg" variant="outline">View Source Code</Button>
          </a>
        </div>
      </section>
    </div>
  )
}