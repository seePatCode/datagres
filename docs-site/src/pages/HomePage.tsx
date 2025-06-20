import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card'
import { ArrowRight, Zap, Keyboard, Lock, Database, Table, Plus, Loader2, CheckCircle, MousePointer, RefreshCw, MoreHorizontal, Eye, EyeOff, Save, X } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import { Link } from 'react-router-dom'

export default function HomePage() {
  const [connectionString, setConnectionString] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [showDemo, setShowDemo] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showMouse, setShowMouse] = useState(false)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [editedCells] = useState(new Map())
  const [isLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('data')

  const tables = [
    { name: 'users', count: 1847 },
    { name: 'orders', count: 5423 },
    { name: 'products', count: 342 },
    { name: 'customers', count: 892 },
    { name: 'invoices', count: 3251 },
  ]

  const mockData = {
    users: [
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', created_at: '2024-01-15 09:30:00', status: 'active' },
      { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', created_at: '2024-01-16 14:22:00', status: 'active' },
      { id: 3, name: 'Carol Williams', email: 'carol@example.com', role: 'user', created_at: '2024-01-17 11:45:00', status: 'inactive' },
      { id: 4, name: 'David Brown', email: 'david@example.com', role: 'moderator', created_at: '2024-01-18 16:30:00', status: 'active' },
      { id: 5, name: 'Emma Davis', email: 'emma@example.com', role: 'user', created_at: '2024-01-19 10:15:00', status: 'pending' },
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

  // Update ref when mouse position changes
  useEffect(() => {
    mousePositionRef.current = mousePosition
  }, [mousePosition])

  // Auto-play demo sequence
  useEffect(() => {
    if (!showDemo) return

    const sequence = async () => {
      // Wait a bit before starting
      await new Promise(resolve => setTimeout(resolve, 500))

      // Show mouse at input field
      const inputEl = document.querySelector('input[type="text"]')
      if (inputEl) {
        const rect = inputEl.getBoundingClientRect()
        setMousePosition({ x: rect.left + 20, y: rect.top + rect.height / 2 })
        setShowMouse(true)
      }

      // Type connection string
      const connStr = 'postgresql://user:pass@localhost:5432/sample_db'
      for (let i = 0; i <= connStr.length; i++) {
        setConnectionString(connStr.substring(0, i))
        await new Promise(resolve => setTimeout(resolve, 25))
      }

      // Move mouse to connect button
      await new Promise(resolve => setTimeout(resolve, 200))
      // Find the Connect button by looking for button with "Connect" text
      const allButtons = document.querySelectorAll('button')
      let connectBtn = null
      for (const btn of allButtons) {
        if (btn.textContent?.includes('Connect') && !btn.textContent?.includes('Connecting')) {
          connectBtn = btn
          break
        }
      }
      
      if (connectBtn) {
        const rect = connectBtn.getBoundingClientRect()
        // Animate mouse movement
        const startX = mousePositionRef.current.x
        const startY = mousePositionRef.current.y
        const endX = rect.left + rect.width / 2
        const endY = rect.top + rect.height / 2
        const steps = 30
        for (let i = 0; i <= steps; i++) {
          const progress = i / steps
          setMousePosition({
            x: startX + (endX - startX) * progress,
            y: startY + (endY - startY) * progress
          })
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      // Click connect
      await new Promise(resolve => setTimeout(resolve, 200))
      setIsConnecting(true)
      
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 800))
      setIsConnecting(false)
      setIsConnected(true)

      // Wait then move to users table
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Animate mouse to users table
      const usersButton = document.querySelector('[data-table="users"]')
      if (usersButton) {
        const rect = usersButton.getBoundingClientRect()
        const startX = mousePositionRef.current.x
        const startY = mousePositionRef.current.y
        const endX = rect.left + rect.width / 2
        const endY = rect.top + rect.height / 2
        const steps = 40
        for (let i = 0; i <= steps; i++) {
          const progress = i / steps
          setMousePosition({
            x: startX + (endX - startX) * progress,
            y: startY + (endY - startY) * progress
          })
          await new Promise(resolve => setTimeout(resolve, 8))
        }
      }

      // Click users table
      await new Promise(resolve => setTimeout(resolve, 200))
      setSelectedTable('users')

      // Wait then move to orders
      await new Promise(resolve => setTimeout(resolve, 1200))
      const ordersButton = document.querySelector('[data-table="orders"]')
      if (ordersButton) {
        const rect = ordersButton.getBoundingClientRect()
        const startX = mousePositionRef.current.x
        const startY = mousePositionRef.current.y
        const endX = rect.left + rect.width / 2
        const endY = rect.top + rect.height / 2
        const steps = 30
        for (let i = 0; i <= steps; i++) {
          const progress = i / steps
          setMousePosition({
            x: startX + (endX - startX) * progress,
            y: startY + (endY - startY) * progress
          })
          await new Promise(resolve => setTimeout(resolve, 8))
        }
      }

      // Click orders table
      await new Promise(resolve => setTimeout(resolve, 200))
      setSelectedTable('orders')

      // Wait then restart
      await new Promise(resolve => setTimeout(resolve, 2000))
      setShowMouse(false)
      setConnectionString('')
      setIsConnected(false)
      setSelectedTable(null)
      
      // Restart the sequence
      setTimeout(() => sequence(), 500)
    }

    sequence()
  }, [showDemo])

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
      {/* Animated Cursor */}
      {showMouse && (
        <div 
          className="pointer-events-none fixed z-[60] transition-all duration-100 ease-out"
          style={{ 
            left: `${mousePosition.x}px`, 
            top: `${mousePosition.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <MousePointer className="h-6 w-6 rotate-12 fill-white text-black drop-shadow-lg" />
        </div>
      )}
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
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
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
              <CardContent className="p-0">
                <div className="flex h-[600px] items-center justify-center p-8">
                  <div className="w-full max-w-xl">
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && connectionString.trim()) {
                            setIsConnecting(true)
                            setTimeout(() => {
                              setIsConnecting(false)
                              setIsConnected(true)
                            }, 1000)
                          }
                        }}
                        placeholder="postgresql://user:password@localhost:5432/database"
                        className="w-full rounded-md border bg-background px-4 py-2 focus:border-violet-500 focus:outline-none"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Try: <button 
                          onClick={() => {
                            setConnectionString('postgresql://demo:pass@localhost:5432/sample_db')
                            setIsConnecting(true)
                            setTimeout(() => {
                              setIsConnecting(false)
                              setIsConnected(true)
                            }, 1000)
                          }}
                          className="text-violet-400 hover:underline"
                        >
                          postgresql://demo:pass@localhost:5432/sample_db
                        </button>
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        if (connectionString.trim()) {
                          setIsConnecting(true)
                          setTimeout(() => {
                            setIsConnecting(false)
                            setIsConnected(true)
                          }, 800)
                        }
                      }}
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
                          data-table={table.name}
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
                <div className="flex-1 flex flex-col overflow-hidden">
                  {selectedTable ? (
                    <>
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
                              {getTableColumns().map((columnName) => {
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
                              {getTableColumns().filter(col => columnVisibility[col] !== false).map((col) => (
                                <TableHead key={col}>{col}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getTableData()
                              .filter(row => {
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
                              })
                              .map((row, idx) => (
                                <TableRow key={idx}>
                                  {Object.entries(row).filter(([key]) => columnVisibility[key] !== false).map(([key, value]) => (
                                    <TableCell key={key}>
                                      <div className="font-mono text-vs-ui truncate py-1 px-2 hover:bg-muted/30 transition-colors">
                                        {String(value)}
                                      </div>
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                          </TableBody>
                        </DataTable>
                      </div>
                      
                      {/* Status Bar */}
                      <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20 text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>
                            {getTableData().filter(row => {
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
                            }).length} of {getTableData().length} rows
                            {searchQuery && ` WHERE ${searchQuery}`}
                          </span>
                          <span>{getTableColumns().filter(col => columnVisibility[col] !== false).length} columns</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {editedCells.size > 0 && (
                            <span className="text-orange-600">
                              {editedCells.size} unsaved change{editedCells.size > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
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

      {/* Features Grid */}
      <section className="container py-24">
        <h2 className="mb-12 text-center text-4xl font-bold text-foreground">Why Developers Love Datagres</h2>
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
          <h2 className="mb-12 text-center text-4xl font-bold text-foreground">Performance That Scales</h2>
          <div className="grid gap-8 text-center md:grid-cols-3">
            <div>
              <div className="mb-2 text-5xl font-bold text-foreground">&lt; 2s</div>
              <p className="text-muted-foreground">Connection Time</p>
            </div>
            <div>
              <div className="mb-2 text-5xl font-bold text-foreground">1M+</div>
              <p className="text-muted-foreground">Rows Handled</p>
            </div>
            <div>
              <div className="mb-2 text-5xl font-bold text-foreground">60 FPS</div>
              <p className="text-muted-foreground">Smooth Scrolling</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24 text-center">
        <Database className="mx-auto mb-6 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-4 text-4xl font-bold text-foreground">Ready to Explore Your Data?</h2>
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