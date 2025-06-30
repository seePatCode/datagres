import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/card'
import { Button } from '@/components/button'
import { Database, Table, Loader2, MousePointer, Search, FileCode2 } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { DemoCallout, DemoTimer } from '@/components/ui/demo-callout'
import { 
  Table as DataTable, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell,
} from '@/components/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import { RefreshCw, X, Keyboard } from 'lucide-react'

export function DemoSection() {
  const [connectionString, setConnectionString] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [showDemo] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showMouse, setShowMouse] = useState(false)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [showQuickSearch, setShowQuickSearch] = useState(false)
  
  const [sqlQuery, setSqlQuery] = useState('')
  const [showSqlGeneration, setShowSqlGeneration] = useState(false)
  const [showQueryResults, setShowQueryResults] = useState(false)
  const [quickSearchQuery, setQuickSearchQuery] = useState('')
  const [highlightScratchpad, setHighlightScratchpad] = useState(false)
  const [openTabs, setOpenTabs] = useState<Array<{id: string, type: 'table' | 'query', name: string, tableName?: string}>>([])
  
  // Callout state
  const [currentCallout, setCurrentCallout] = useState<{ message: string; position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' } | null>(null)

  const savedConnections = [
    { id: '1', name: 'Sample DB', database: 'sample_db' }
  ]

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
  }

  const handleTableSelect = (tableName: string) => {
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
      name: openTabs.filter(t => t.type === 'query').length === 0 ? 'Scratchpad' : `Query ${openTabs.filter(t => t.type === 'query').length + 1}`
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
      // Initial Setup
      await wait(500)
      
      // Show Connection Screen
      const inputEl = document.querySelector('input[type="text"]') as HTMLElement
      if (inputEl) {
        const rect = inputEl.getBoundingClientRect()
        setMousePosition({ x: rect.left + 20, y: rect.top + rect.height / 2 })
        setShowMouse(true)
      }
      
      // Show callout for connection
      setCurrentCallout({ message: "Paste any PostgreSQL URL and connect instantly", position: "top-right" })
      
      // Type Connection String
      await wait(300)
      await typeText('postgresql://user:pass@localhost:5432/sample_db', setConnectionString)
      
      // Click Connect Button
      await wait(200)
      const connectBtn = findButtonByText('Connect')
      if (connectBtn) {
        const rect = connectBtn.getBoundingClientRect()
        await animateMouseTo(rect.left + rect.width / 2, rect.top + rect.height / 2)
      }
      
      // Hide callout and start connecting
      await wait(200)
      setCurrentCallout(null)
      setIsConnecting(true)
      await wait(800)
      setIsConnecting(false)
      setIsConnected(true)
      
      // Show success callout
      setCurrentCallout({ message: "Connected! Let's explore your data", position: "top-right" })
      
      // Browse Initial Data
      await wait(1200)
      setCurrentCallout(null)
      
      // Show Shift+Shift hint
      await wait(800)
      setCurrentCallout({ message: "Press Shift+Shift for lightning-fast table search", position: "top-right" })
      await wait(800)
      
      // Actually show the quick search modal
      setShowMouse(false)
      setShowQuickSearch(true)
      await wait(600)
      
      // Type in the quick search
      await typeText('user', setQuickSearchQuery, 50)
      await wait(1000)
      
      setShowQuickSearch(false)
      setQuickSearchQuery('')
      setCurrentCallout(null)
      
      // Select users table
      const usersButton = findButtonByText('users', 'button[data-table]')
      if (usersButton) {
        const rect = usersButton.getBoundingClientRect()
        await animateMouseTo(rect.left + rect.width / 2, rect.top + rect.height / 2)
        await wait(200)
        handleTableSelect('users')
      }
      
      await wait(1500)
      
      // Open SQL Scratchpad
      await wait(500)
      setCurrentCallout({ message: "Open a SQL scratchpad for ad-hoc queries", position: "top-right" })
      
      // Blink the Scratchpad button multiple times
      for (let i = 0; i < 3; i++) {
        setHighlightScratchpad(true)
        await wait(200)
        setHighlightScratchpad(false)
        await wait(200)
      }
      setHighlightScratchpad(true)
      await wait(300)
      
      const newQueryButton = findButtonByText('Scratchpad')
      if (newQueryButton) {
        const rect = newQueryButton.getBoundingClientRect()
        await animateMouseTo(rect.left + rect.width / 2, rect.top + rect.height / 2)
        await wait(200)
        handleNewQuery()
        setHighlightScratchpad(false)
        setSqlQuery('')
      }
      
      await wait(300)
      setCurrentCallout(null)
      
      // Demo AI SQL Generation
      await wait(800)
      setCurrentCallout({ message: "Press Cmd+K to generate SQL with local AI", position: "top-right" })
      setShowSqlGeneration(true)
      await wait(2000)
      
      // Generate and Display SQL
      const generatedSql = `SELECT name, email, role, status 
FROM users 
WHERE status = 'active' 
ORDER BY created_at DESC
LIMIT 10;`
      
      await typeText(generatedSql, setSqlQuery, 5)
      setCurrentCallout(null)
      
      // Execute Query
      await wait(1000)
      setCurrentCallout({ message: "Execute to see results instantly", position: "top-right" })
      await wait(800)
      setShowQueryResults(true)
      await wait(1200)
      setCurrentCallout(null)
      
      // Show final callout
      setCurrentCallout({ message: "From connection to insights in under 15 seconds!", position: "top-right" })
      await wait(3000)
      
      // Reset and Loop
      await wait(1500)
      setCurrentCallout(null)
      
      setShowMouse(false)
      setConnectionString('')
      setIsConnected(false)
      setSelectedTable(null)
      setOpenTabs([])
      setActiveTab(null)
      setSqlQuery('')
      setShowSqlGeneration(false)
      setShowQueryResults(false)
      setQuickSearchQuery('')
      setHighlightScratchpad(false)
      
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
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/10 to-transparent" />
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            See It In Action
          </h2>
          <p className="text-xl text-gray-500">
            Watch how fast you can go from connection to exploring data
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <Card className="overflow-hidden bg-gray-950/50 backdrop-blur border-gray-800 relative">
            
            
            {/* Callout Display */}
            {currentCallout && (
              <DemoCallout
                message={currentCallout.message}
                isVisible={true}
                position={currentCallout.position}
              />
            )}
            
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

            <div className="border-b border-gray-800 bg-gray-900/50 p-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-4 text-sm font-medium text-gray-400">Datagres</span>
              </div>
            </div>
            
            <div className="relative">
              {!isConnected ? (
                <div className="p-0">
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
                            placeholder="postgresql://user:password@localhost:5432/database"
                            className="w-full rounded-md border bg-background px-4 py-2 focus:border-violet-500 focus:outline-none"
                          />
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
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-[600px]">
                  {/* Sidebar */}
                  <div className="w-64 border-r bg-secondary/10">
                    <div className="border-b p-4">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">sample_db</span>
                      </div>
                    </div>
                    
                    {/* New Query Button */}
                    <div className="p-3 border-b">
                      <Button 
                        className={`w-full justify-start gap-2 transition-all ${
                          highlightScratchpad ? 'bg-violet-500 text-white shadow-lg scale-105' : ''
                        }`}
                        variant={highlightScratchpad ? "default" : "outline"}
                        size="sm"
                        onClick={handleNewQuery}
                      >
                        <FileCode2 className="h-4 w-4" />
                        Scratchpad
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
                                  <FileCode2 className="h-3 w-3" />
                                  <span>{tab.name}</span>
                                </div>
                              )}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const newTabs = openTabs.filter(t => t.id !== tab.id)
                                  setOpenTabs(newTabs)
                                  if (activeTab === tab.id && newTabs.length > 0) {
                                    setActiveTab(newTabs[newTabs.length - 1].id)
                                  }
                                }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-accent rounded flex items-center justify-center"
                              >
                                <X className="h-3 w-3" />
                              </div>
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        
                        {openTabs.map(tab => (
                          <TabsContent key={tab.id} value={tab.id} className="flex-1 flex flex-col overflow-hidden mt-0">
                            {tab.type === 'table' ? (
                              <>
                                {/* Table Toolbar */}
                                <div className="flex items-center justify-between border-b bg-background p-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground whitespace-nowrap px-2">WHERE</span>
                                      <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex-1 bg-secondary/50 rounded px-2 py-1 text-sm"
                                        placeholder="Filter..."
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 px-3">
                                    <Button variant="outline" size="sm" className="gap-1">
                                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                      Refresh
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="flex-1 overflow-auto">
                                  <DataTable>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                      <TableRow>
                                        {getTableColumns(tab.tableName).map((col) => (
                                          <TableHead key={col}>{col}</TableHead>
                                        ))}
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {getTableData(tab.tableName).slice(0, 5).map((row, idx) => (
                                        <TableRow key={idx}>
                                          {Object.entries(row).map(([key, value]) => (
                                            <TableCell key={key}>
                                              <div className="font-mono text-vs-ui truncate py-1 px-2">
                                                {String(value)}
                                              </div>
                                            </TableCell>
                                          ))}
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </DataTable>
                                </div>
                              </>
                            ) : (
                              // Query Tab
                              <div className="flex-1 flex flex-col">
                                <div className="border-b bg-muted/20 p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium">SQL Scratchpad</span>
                                    <kbd className="rounded bg-secondary px-2 py-1 text-xs">Cmd+K</kbd>
                                    <span className="text-xs text-muted-foreground">Generate SQL with AI</span>
                                  </div>
                                </div>
                                
                                <div className={`${showQueryResults ? 'h-1/3' : 'flex-1'} relative transition-all duration-300`}>
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
                                            value="show me active users"
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
                                
                                {/* Query Results */}
                                {showQueryResults && (
                                  <div className="flex-1 border-t">
                                    <div className="bg-muted/20 p-2 border-b">
                                      <span className="text-xs text-muted-foreground">Query Results (3 rows)</span>
                                    </div>
                                    <div className="overflow-auto h-full">
                                      <DataTable>
                                        <TableHeader className="sticky top-0 bg-background z-10">
                                          <TableRow>
                                            <TableHead>name</TableHead>
                                            <TableHead>email</TableHead>
                                            <TableHead>role</TableHead>
                                            <TableHead>status</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          <TableRow>
                                            <TableCell className="font-mono text-xs">David Brown</TableCell>
                                            <TableCell className="font-mono text-xs">david@example.com</TableCell>
                                            <TableCell className="font-mono text-xs">moderator</TableCell>
                                            <TableCell className="font-mono text-xs">active</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell className="font-mono text-xs">Bob Smith</TableCell>
                                            <TableCell className="font-mono text-xs">bob@example.com</TableCell>
                                            <TableCell className="font-mono text-xs">user</TableCell>
                                            <TableCell className="font-mono text-xs">active</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell className="font-mono text-xs">Alice Johnson</TableCell>
                                            <TableCell className="font-mono text-xs">alice@example.com</TableCell>
                                            <TableCell className="font-mono text-xs">admin</TableCell>
                                            <TableCell className="font-mono text-xs">active</TableCell>
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
              
              {/* Quick Search Modal */}
              {showQuickSearch && (
                <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm">
                  <div className="absolute left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg rounded-lg">
                    <div className="flex items-center border-b px-4 py-3">
                      <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search tables and connections..."
                        value={quickSearchQuery}
                        onChange={(e) => setQuickSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-2">
                      <div className="mb-4">
                        <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">Connections</h3>
                        <div className="space-y-1">
                          {savedConnections.filter(conn => 
                            conn.name.toLowerCase().includes(quickSearchQuery.toLowerCase()) ||
                            conn.database.toLowerCase().includes(quickSearchQuery.toLowerCase())
                          ).map(conn => (
                            <button
                              key={conn.id}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent bg-accent"
                              onClick={() => setShowQuickSearch(false)}
                            >
                              <Database className="h-4 w-4" />
                              <span className="flex-1 text-left">{conn.name}</span>
                              <span className="text-xs text-muted-foreground">Current</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                          Tables ({tables.filter(t => t.name.toLowerCase().includes(quickSearchQuery.toLowerCase())).length})
                        </h3>
                        <div className="space-y-1">
                          {tables.filter(table => 
                            table.name.toLowerCase().includes(quickSearchQuery.toLowerCase())
                          ).map(table => (
                            <button
                              key={table.name}
                              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent ${
                                table.name === 'users' && quickSearchQuery === 'user' ? 'bg-violet-500/20 text-violet-300' : ''
                              }`}
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
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500">
            This is a live demo. Download Datagres to connect to your real databases.
          </p>
        </motion.div>
      </div>
    </section>
  )
}