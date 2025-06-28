import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card'
import { ArrowRight, Zap, Keyboard, Lock, Database, Table, Loader2, CheckCircle, MousePointer, RefreshCw, MoreHorizontal, Eye, EyeOff, Save, X, Search, FileText } from 'lucide-react'
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

export default function HomePage() {
  const [connectionString, setConnectionString] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [showDemo] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showMouse, setShowMouse] = useState(false)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [editedCells] = useState(new Map())
  const [isLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [showQuickSearch, setShowQuickSearch] = useState(false)
  const [currentDatabase, setCurrentDatabase] = useState('sample_db')
  const [sqlQuery, setSqlQuery] = useState('')
  const [showSqlGeneration, setShowSqlGeneration] = useState(false)
  const [openTabs, setOpenTabs] = useState<Array<{id: string, type: 'table' | 'query', name: string, tableName?: string}>>([])

  const savedConnections = [
    { id: '1', name: 'Production DB', database: 'prod_db' },
    { id: '2', name: 'Staging DB', database: 'staging_db' },
    { id: '3', name: 'Development DB', database: 'sample_db' }
  ]

  const tables = currentDatabase === 'sample_db' ? [
    { name: 'users', count: 1847 },
    { name: 'orders', count: 5423 },
    { name: 'products', count: 342 },
    { name: 'customers', count: 892 },
    { name: 'invoices', count: 3251 },
  ] : currentDatabase === 'prod_db' ? [
    { name: 'users', count: 28451 },
    { name: 'orders', count: 142893 },
    { name: 'products', count: 1248 },
    { name: 'order_items', count: 523901 },
    { name: 'categories', count: 47 },
  ] : [
    { name: 'users', count: 4521 },
    { name: 'orders', count: 8934 },
    { name: 'products', count: 678 },
    { name: 'test_data', count: 10000 },
  ]

  const mockDataByDatabase: Record<string, Record<string, any[]>> = {
    sample_db: {
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
    },
    prod_db: {
      users: [
        { id: 101, name: 'Enterprise User A', email: 'user.a@enterprise.com', department: 'Sales', created_at: '2023-06-15', active: true },
        { id: 102, name: 'Enterprise User B', email: 'user.b@enterprise.com', department: 'Marketing', created_at: '2023-07-20', active: true },
        { id: 103, name: 'Enterprise User C', email: 'user.c@enterprise.com', department: 'Engineering', created_at: '2023-08-10', active: true },
        { id: 104, name: 'Enterprise User D', email: 'user.d@enterprise.com', department: 'Sales', created_at: '2023-09-05', active: false },
      ],
      orders: [
        { id: 20001, user_id: 101, amount: 15999.99, status: 'completed', order_date: '2024-01-15', shipped_date: '2024-01-17' },
        { id: 20002, user_id: 102, amount: 8500.00, status: 'processing', order_date: '2024-01-20', shipped_date: null },
        { id: 20003, user_id: 101, amount: 12750.50, status: 'completed', order_date: '2024-01-25', shipped_date: '2024-01-27' },
      ],
      order_items: [
        { id: 1, order_id: 20001, product_id: 501, quantity: 10, unit_price: 999.99 },
        { id: 2, order_id: 20001, product_id: 502, quantity: 5, unit_price: 1200.00 },
        { id: 3, order_id: 20002, product_id: 503, quantity: 20, unit_price: 425.00 },
      ],
      products: [
        { id: 501, name: 'Enterprise Server', price: 999.99, category_id: 1 },
        { id: 502, name: 'Database License', price: 1200.00, category_id: 2 },
        { id: 503, name: 'Cloud Storage Plan', price: 425.00, category_id: 3 },
      ],
      categories: [
        { id: 1, name: 'Hardware', description: 'Physical computing equipment' },
        { id: 2, name: 'Software', description: 'Digital products and licenses' },
        { id: 3, name: 'Services', description: 'Cloud and managed services' },
      ]
    }
  }
  
  const mockData = mockDataByDatabase[currentDatabase] || mockDataByDatabase.sample_db

  const handleTableSelect = (tableName: string) => {
    // Check if tab already exists
    const existingTab = openTabs.find(tab => tab.type === 'table' && tab.tableName === tableName)
    if (existingTab) {
      setActiveTab(existingTab.id)
    } else {
      const newTab = {
        id: `table-${Date.now()}`,
        type: 'table' as const,
        name: tableName,
        tableName: tableName
      }
      setOpenTabs([...openTabs, newTab])
      setActiveTab(newTab.id)
    }
    setSelectedTable(tableName)
  }

  const handleNewQuery = () => {
    const newTab = {
      id: `query-${Date.now()}`,
      type: 'query' as const,
      name: `Query ${openTabs.filter(t => t.type === 'query').length + 1}`
    }
    setOpenTabs([...openTabs, newTab])
    setActiveTab(newTab.id)
  }

  // Update ref when mouse position changes
  useEffect(() => {
    mousePositionRef.current = mousePosition
  }, [mousePosition])

  // Auto-play demo sequence
  useEffect(() => {
    if (!showDemo) return

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    const animateMouseTo = async (targetX: number, targetY: number, duration: number = 300) => {
      const startX = mousePositionRef.current.x
      const startY = mousePositionRef.current.y
      const steps = 30
      const stepDuration = duration / steps
      
      for (let i = 0; i <= steps; i++) {
        const progress = i / steps
        setMousePosition({
          x: startX + (targetX - startX) * progress,
          y: startY + (targetY - startY) * progress
        })
        await wait(stepDuration)
      }
    }
    
    const typeText = async (text: string, setter: (value: string) => void, speed: number = 25) => {
      for (let i = 0; i <= text.length; i++) {
        setter(text.substring(0, i))
        await wait(speed)
      }
    }
    
    const findButtonByText = (text: string, container: string = 'button') => {
      const buttons = document.querySelectorAll(container)
      for (const btn of buttons) {
        if (btn.textContent?.includes(text)) {
          return btn as HTMLElement
        }
      }
      return null
    }

    const runDemoScript = async () => {
      /**
       * DEMO SCRIPT: Showcases Datagres' key features in order
       * 
       * 1. Connection: Type PostgreSQL connection string and connect
       * 2. Browse Data: Automatically open users table
       * 3. Quick Search: Press Shift+Shift to open table/connection switcher
       * 4. Switch Database: Click on Production DB to switch context
       * 5. Open Table: Select orders table in production database
       * 6. New Query: Create a new SQL query tab
       * 7. AI Generation: Press CMD+K to show AI SQL generation
       * 8. Execute Query: Show generated complex JOIN query
       * 9. View Results: Display query results in table format
       * 10. Loop: Reset and restart demo
       */
      
      // === STEP 1: Initial Setup ===
      await wait(500) // Let the page settle
      
      // === STEP 2: Show Connection Screen ===
      // Position mouse at connection input
      const inputEl = document.querySelector('input[type="text"]') as HTMLElement
      if (inputEl) {
        const rect = inputEl.getBoundingClientRect()
        setMousePosition({ x: rect.left + 20, y: rect.top + rect.height / 2 })
        setShowMouse(true)
      }
      
      // === STEP 3: Type Connection String ===
      await wait(300)
      await typeText('postgresql://user:pass@localhost:5432/sample_db', setConnectionString)
      
      // === STEP 4: Click Connect Button ===
      await wait(200)
      const connectBtn = findButtonByText('Connect')
      if (connectBtn) {
        const rect = connectBtn.getBoundingClientRect()
        await animateMouseTo(rect.left + rect.width / 2, rect.top + rect.height / 2)
      }
      
      await wait(200)
      setIsConnecting(true)
      await wait(800) // Simulate connection time
      setIsConnecting(false)
      setIsConnected(true)
      
      // === STEP 5: Browse Initial Data ===
      await wait(800)
      
      // Find and click the users table in sidebar
      const usersButton = findButtonByText('users', 'button[data-table]')
      if (usersButton) {
        const rect = usersButton.getBoundingClientRect()
        await animateMouseTo(rect.left + rect.width / 2, rect.top + rect.height / 2)
        await wait(200)
        handleTableSelect('users') // Click to open users table
      }
      
      await wait(1500) // Let user see the data
      
      // === STEP 6: Demo Quick Search (Shift+Shift) ===
      setShowMouse(false) // Hide mouse to show keyboard action
      setShowQuickSearch(true)
      await wait(600)
      
      // === STEP 7: Switch to Production Database ===
      setShowMouse(true)
      await wait(300)
      
      // Find and click Production DB in quick search
      const prodButton = findButtonByText('Production DB', '.fixed button')
      if (prodButton) {
        const rect = prodButton.getBoundingClientRect()
        await animateMouseTo(rect.left + rect.width / 2, rect.top + rect.height / 2)
      }
      
      await wait(300)
      setShowQuickSearch(false)
      setCurrentDatabase('prod_db')
      setSelectedTable(null)
      
      // === STEP 8: Open Orders Table in Production ===
      await wait(800)
      
      // Find and click the orders table in sidebar
      const ordersButton = findButtonByText('orders', 'button[data-table]')
      if (ordersButton) {
        const rect = ordersButton.getBoundingClientRect()
        await animateMouseTo(rect.left + rect.width / 2, rect.top + rect.height / 2)
        await wait(200)
        handleTableSelect('orders') // Click to open orders table
      }
      
      await wait(1000)
      
      // === STEP 9: Create New Query Tab ===
      await wait(500)
      
      // Find and click the New Query button
      const newQueryButton = findButtonByText('New Query')
      if (newQueryButton) {
        const rect = newQueryButton.getBoundingClientRect()
        await animateMouseTo(rect.left + rect.width / 2, rect.top + rect.height / 2)
        await wait(200)
        handleNewQuery() // Click to create new query tab
        setSqlQuery('')
      }
      
      await wait(300)
      
      // === STEP 10: Demo AI SQL Generation (CMD+K) ===
      await wait(800)
      setShowSqlGeneration(true) // Show AI prompt popover
      await wait(2000) // Simulate user thinking/AI processing
      
      // === STEP 11: Generate and Display SQL ===
      const generatedSql = `SELECT 
  o.id as order_id,
  o.user_id,
  o.amount as total_amount,
  o.status,
  oi.quantity,
  oi.unit_price,
  p.name as product_name,
  c.name as category
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
JOIN categories c ON p.category_id = c.id
WHERE o.status = 'completed'
ORDER BY o.order_date DESC;`
      
      // Type out the SQL gradually
      await typeText(generatedSql, setSqlQuery, 5)
      
      // === STEP 12: Show Query Results ===
      await wait(2500)
      
      // === STEP 13: Reset and Loop ===
      await wait(1500)
      setShowMouse(false)
      setConnectionString('')
      setIsConnected(false)
      setSelectedTable(null)
      setOpenTabs([])
      setActiveTab(null)
      setSqlQuery('')
      setCurrentDatabase('sample_db')
      setShowSqlGeneration(false)
      
      // Restart the demo
      await wait(1000)
      runDemoScript()
    }

    runDemoScript()
  }, [showDemo])

  const getTableData = (tableName?: string) => {
    const table = tableName || selectedTable
    if (!table) return []
    return mockData[table] || []
  }

  const getTableColumns = (tableName?: string) => {
    const data = getTableData(tableName)
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
            src={`${import.meta.env.BASE_URL}icon.png`} 
            alt="Datagres" 
            className="mx-auto mb-6 h-24 w-24 drop-shadow-2xl"
          />
          <h1 className="mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
            Datagres
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            The PostgreSQL client that respects your time. Connect and browse data in under 15 seconds.
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

      {/* Pain Points Section */}
      <section className="bg-red-950/10 border-y border-red-900/20">
        <div className="container py-12">
          <h2 className="mb-8 text-center text-3xl font-bold">Frustrated with Existing Database Tools?</h2>
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <span className="text-red-500">✗</span>
                <div>
                  <h3 className="font-semibold">Waiting for Java to start</h3>
                  <p className="text-sm text-muted-foreground">30+ seconds just to open the app</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-500">✗</span>
                <div>
                  <h3 className="font-semibold">JDBC driver hell</h3>
                  <p className="text-sm text-muted-foreground">Download, configure, troubleshoot, repeat</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-500">✗</span>
                <div>
                  <h3 className="font-semibold">Complex UI for simple tasks</h3>
                  <p className="text-sm text-muted-foreground">5 clicks to see table data</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-500">✗</span>
                <div>
                  <h3 className="font-semibold">Memory hungry</h3>
                  <p className="text-sm text-muted-foreground">1GB+ RAM for a database viewer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="container py-12">
          <Card className="mx-auto max-w-6xl overflow-hidden relative">
            <div className="border-b bg-secondary/30 p-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-4 text-sm font-medium">Datagres</span>
              </div>
            </div>
            
            <div className="relative">
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
                      <span className="text-sm font-medium">{currentDatabase}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {savedConnections.find(c => c.database === currentDatabase)?.name || 'postgresql://demo@localhost:5432'}
                    </p>
                  </div>
                  
                  {/* New Query Button */}
                  <div className="p-3 border-b">
                    <Button 
                      className="w-full justify-start gap-2"
                      variant="outline"
                      size="sm"
                      onClick={handleNewQuery}
                    >
                      <FileText className="h-4 w-4" />
                      New Query
                    </Button>
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
                          onClick={() => handleTableSelect(table.name)}
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
                  {openTabs.length > 0 ? (
                    <Tabs value={activeTab || ''} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                      <TabsList className="h-auto p-0 bg-transparent rounded-none w-full justify-start">
                        {openTabs.map(tab => (
                          <TabsTrigger 
                            key={tab.id} 
                            value={tab.id}
                            className="rounded-none border-r data-[state=active]:bg-muted data-[state=active]:shadow-none pr-8 relative group"
                          >
                            {tab.type === 'table' ? (
                              <div className="flex items-center gap-1">
                                <Table className="h-3 w-3" />
                                <span>{tab.name}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>{tab.name}</span>
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                const newTabs = openTabs.filter(t => t.id !== tab.id)
                                setOpenTabs(newTabs)
                                if (activeTab === tab.id && newTabs.length > 0) {
                                  setActiveTab(newTabs[newTabs.length - 1].id)
                                }
                              }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {openTabs.map(tab => (
                        <TabsContent key={tab.id} value={tab.id} className="flex-1 flex flex-col overflow-hidden mt-0">
                          {tab.type === 'table' ? (
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
                              {getTableColumns(tab.tableName).map((columnName) => {
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
                              {getTableColumns(tab.tableName).filter(col => columnVisibility[col] !== false).map((col) => (
                                <TableHead key={col}>{col}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getTableData(tab.tableName)
                              .filter(row => {
                                if (!searchQuery) return true;
                                try {
                                  if (searchQuery.includes('=')) {
                                    const [field, value] = searchQuery.split('=').map(s => s.trim())
                                    const cleanValue = value.replace(/['";]/g, '')
                                    return row[field as keyof typeof row]?.toString().toLowerCase() === cleanValue.toLowerCase()
                                  }
                                  return Object.values(row).some(v => 
                                    v?.toString().toLowerCase().includes(searchQuery.toLowerCase())
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
                            {getTableData(tab.tableName).filter(row => {
                              if (!searchQuery) return true;
                              try {
                                if (searchQuery.includes('=')) {
                                  const [field, value] = searchQuery.split('=').map(s => s.trim())
                                  const cleanValue = value.replace(/['";]/g, '')
                                  return row[field as keyof typeof row]?.toString().toLowerCase() === cleanValue.toLowerCase()
                                }
                                return Object.values(row).some((v: any) => 
                                  v.toString().toLowerCase().includes(searchQuery.toLowerCase())
                                )
                              } catch {
                                return true
                              }
                            }).length} of {getTableData(tab.tableName).length} rows
                            {searchQuery && ` WHERE ${searchQuery}`}
                          </span>
                          <span>{getTableColumns(tab.tableName).filter(col => columnVisibility[col] !== false).length} columns</span>
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
                            // Query Tab (SQL Scratchpad)
                            <div className="flex-1 flex flex-col">
                              <div className="border-b bg-muted/20 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium">SQL Editor</span>
                                  <kbd className="rounded bg-secondary px-2 py-1 text-xs">Cmd+K</kbd>
                                  <span className="text-xs text-muted-foreground">Generate SQL with AI</span>
                                </div>
                              </div>
                              
                              <div className="flex-1 relative">
                                <Editor
                                  height="100%"
                                  defaultLanguage="sql"
                                  value={sqlQuery}
                                  onChange={(value) => setSqlQuery(value || '')}
                                  options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    lineNumbers: 'on',
                                    automaticLayout: true,
                                    wordWrap: 'on',
                                    fontFamily: "'SF Mono', Monaco, Consolas, 'Courier New', monospace",
                                  }}
                                  theme="vs-dark"
                                />
                                
                                {/* AI Prompt Popover */}
                                {showSqlGeneration && !sqlQuery && (
                                  <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
                                    <div className="bg-background border rounded-lg shadow-lg p-4 w-96">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Keyboard className="h-4 w-4 text-violet-500" />
                                        <span className="text-sm font-medium">Generate SQL with AI</span>
                                      </div>
                                      <div className="relative">
                                        <input
                                          type="text"
                                          placeholder="Describe what you want in plain English..."
                                          className="w-full bg-secondary/50 rounded px-3 py-2 text-sm outline-none"
                                          value="show me all orders with their items and product details"
                                          readOnly
                                        />
                                      </div>
                                      <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Press Enter to generate</span>
                                        <div className="flex items-center gap-1">
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          <span className="text-xs">Generating...</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {showSqlGeneration && sqlQuery.includes('SELECT') && (
                                <div className="border-t p-4">
                                  <h4 className="text-sm font-medium mb-2">Query Results Preview</h4>
                                  <div className="overflow-auto max-h-48">
                                    <DataTable>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>order_id</TableHead>
                                          <TableHead>user_id</TableHead>
                                          <TableHead>total_amount</TableHead>
                                          <TableHead>status</TableHead>
                                          <TableHead>quantity</TableHead>
                                          <TableHead>unit_price</TableHead>
                                          <TableHead>product_name</TableHead>
                                          <TableHead>category</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        <TableRow>
                                          <TableCell>20001</TableCell>
                                          <TableCell>101</TableCell>
                                          <TableCell>$15,999.99</TableCell>
                                          <TableCell>completed</TableCell>
                                          <TableCell>10</TableCell>
                                          <TableCell>$999.99</TableCell>
                                          <TableCell>Enterprise Server</TableCell>
                                          <TableCell>Hardware</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>20001</TableCell>
                                          <TableCell>101</TableCell>
                                          <TableCell>$15,999.99</TableCell>
                                          <TableCell>completed</TableCell>
                                          <TableCell>5</TableCell>
                                          <TableCell>$1,200.00</TableCell>
                                          <TableCell>Database License</TableCell>
                                          <TableCell>Software</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>20003</TableCell>
                                          <TableCell>101</TableCell>
                                          <TableCell>$12,750.50</TableCell>
                                          <TableCell>completed</TableCell>
                                          <TableCell>15</TableCell>
                                          <TableCell>$850.03</TableCell>
                                          <TableCell>Cloud Storage Plan</TableCell>
                                          <TableCell>Services</TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </DataTable>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </TabsContent>
                      ))}
                    </Tabs>
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
            
            {/* Quick Search Modal - Contained within demo */}
            {showQuickSearch && (
              <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm">
                <div className="absolute left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg rounded-lg">
              <div className="flex items-center border-b px-4 py-3">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tables and connections..."
                  className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="max-h-[400px] overflow-y-auto p-2">
                <div className="mb-4">
                  <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">Connections</h3>
                  <div className="space-y-1">
                    {savedConnections.map(conn => (
                      <button
                        key={conn.id}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent ${
                          conn.database === currentDatabase ? 'bg-accent' : ''
                        }`}
                        onClick={() => {
                          setCurrentDatabase(conn.database)
                          setShowQuickSearch(false)
                        }}
                      >
                        <Database className="h-4 w-4" />
                        <span className="flex-1 text-left">{conn.name}</span>
                        {conn.database === currentDatabase && (
                          <span className="text-xs text-muted-foreground">Current</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">Tables</h3>
                  <div className="space-y-1">
                    {tables.map(table => (
                      <button
                        key={table.name}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => {
                          handleTableSelect(table.name)
                          setShowQuickSearch(false)
                        }}
                      >
                        <Table className="h-4 w-4" />
                        <span className="flex-1 text-left">{table.name}</span>
                        <span className="text-xs text-muted-foreground">{table.count.toLocaleString()} rows</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
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
                Built for speed. Quick search for tables AND connections. Switch databases instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <kbd className="rounded bg-secondary px-2 py-1">Shift+Shift</kbd>
                  <span className="text-muted-foreground">Search tables & connections</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <kbd className="rounded bg-secondary px-2 py-1">Cmd+1-9</kbd>
                  <span className="text-muted-foreground">Jump between tabs</span>
                </div>
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

          <Card className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-purple-500/10" />
            <CardHeader>
              <Keyboard className="mb-4 h-10 w-10 text-purple-500" />
              <CardTitle>AI-Powered SQL</CardTitle>
              <CardDescription>
                Generate complex queries in plain English. Runs locally for complete privacy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="rounded bg-secondary p-2">
                  <span className="text-muted-foreground">Cmd+K:</span> "show orders with their products"
                </div>
                <div className="text-xs text-muted-foreground">
                  → Instant JOIN query with proper relationships
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-orange-500/10" />
            <CardHeader>
              <Database className="mb-4 h-10 w-10 text-orange-500" />
              <CardTitle>Zero Configuration</CardTitle>
              <CardDescription>
                No JDBC drivers. No workspace setup. Just paste your connection string and go.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>❌ Other tools: Download drivers, configure workspace</div>
                <div>✅ Datagres: Paste connection string, done!</div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-cyan-500/10" />
            <CardHeader>
              <Zap className="mb-4 h-10 w-10 text-cyan-500" />
              <CardTitle>10x Faster Workflow</CardTitle>
              <CardDescription>
                Switch between dev, staging, and production databases in 2 keystrokes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Traditional tools:</span>
                  <span className="font-mono">30s-2min startup</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Datagres to data:</span>
                  <span className="font-mono text-green-500">&lt;15s total</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-secondary/30">
        <div className="container py-24">
          <h2 className="mb-12 text-center text-4xl font-bold text-foreground">How Datagres Compares</h2>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-lg border bg-background">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left font-medium">Feature</th>
                    <th className="p-4 text-center font-medium">Datagres</th>
                    <th className="p-4 text-center font-medium">Traditional Tools</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-4">Time to first query</td>
                    <td className="p-4 text-center font-mono text-green-500">&lt;15 seconds</td>
                    <td className="p-4 text-center font-mono text-muted-foreground">2-5 minutes</td>
                  </tr>
                  <tr>
                    <td className="p-4">Driver installation</td>
                    <td className="p-4 text-center text-green-500">✓ None required</td>
                    <td className="p-4 text-center text-red-500">✗ Manual setup</td>
                  </tr>
                  <tr>
                    <td className="p-4">Quick table search</td>
                    <td className="p-4 text-center font-mono">Shift+Shift</td>
                    <td className="p-4 text-center text-muted-foreground">Navigate menus</td>
                  </tr>
                  <tr>
                    <td className="p-4">Switch databases</td>
                    <td className="p-4 text-center font-mono">2 keystrokes</td>
                    <td className="p-4 text-center text-muted-foreground">Multiple dialogs</td>
                  </tr>
                  <tr>
                    <td className="p-4">Memory usage</td>
                    <td className="p-4 text-center font-mono text-green-500">~100MB</td>
                    <td className="p-4 text-center font-mono text-muted-foreground">1GB+</td>
                  </tr>
                  <tr>
                    <td className="p-4">AI SQL assistance</td>
                    <td className="p-4 text-center text-green-500">✓ Built-in (local)</td>
                    <td className="p-4 text-center text-red-500">✗ None</td>
                  </tr>
                  <tr>
                    <td className="p-4">Startup time</td>
                    <td className="p-4 text-center font-mono text-green-500">&lt;2s</td>
                    <td className="p-4 text-center font-mono text-muted-foreground">10-30s</td>
                  </tr>
                  <tr>
                    <td className="p-4">Target audience</td>
                    <td className="p-4 text-center">Developers</td>
                    <td className="p-4 text-center">Enterprise/DBAs</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
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