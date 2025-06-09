import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataTable } from "@/components/ui/data-table"
import { ConnectionManager } from "@/components/ui/connection-manager"
import { TitleBar } from "@/components/ui/title-bar"
import { DatabaseSidebar } from "@/components/ui/database-sidebar"
import { TableView } from "@/components/ui/table-view"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { X } from 'lucide-react'
import type { ElectronAPI, AppView, TableInfo, MenuAction, TableTab } from '@shared/types'
import { validateConnectionString } from '@shared/validation'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

// Helper function to create columns dynamically
const createColumns = (columnNames: string[]): ColumnDef<any>[] => {
  return columnNames.map((columnName, index) => ({
    accessorKey: index.toString(),
    header: columnName,
    cell: ({ getValue }) => {
      const value = getValue()
      return value !== null ? String(value) : (
        <span className="text-muted-foreground italic">NULL</span>
      )
    },
  }))
}

function App() {
  
  const [connectionString, setConnectionString] = useState('')
  const [currentView, setCurrentView] = useState<AppView>('connect')
  const [currentDatabase, setCurrentDatabase] = useState<string>('')
  const [tables, setTables] = useState<TableInfo[]>([])
  const [recentTables, setRecentTables] = useState<TableInfo[]>([])
  const [hasAttemptedAutoConnect, setHasAttemptedAutoConnect] = useState(false)
  const [isAutoConnecting, setIsAutoConnecting] = useState(false)
  
  // Tab management
  const [tabs, setTabs] = useState<TableTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  
  // Debug logging for tab state
  useEffect(() => {
    console.log('[Tab State Changed] tabs:', tabs)
    console.log('[Tab State Changed] activeTabId:', activeTabId)
  }, [tabs, activeTabId])

  // Get saved connections to find the most recently used one
  const { data: connectionsData } = useQuery({
    queryKey: ['saved-connections'],
    queryFn: async () => {
      console.log(`[${new Date().toISOString()}] Starting to fetch saved connections`)
      console.timeEnd('app-component-mount')
      const result = await window.electronAPI.getSavedConnections()
      console.log(`[${new Date().toISOString()}] Finished fetching saved connections:`, result.success ? `${result.connections?.length} connections` : result.error)
      if (!result.success) {
        throw new Error(result.error || 'Failed to load connections')
      }
      return result.connections
    }
  })

  const connectionMutation = useMutation({
    mutationFn: async (connectionString: string) => {
      console.log(`[${new Date().toISOString()}] Starting database connection attempt`)
      const trimmedConnection = connectionString.trim()
      
      if (!trimmedConnection) {
        throw new Error('Please enter a connection string')
      }

      if (!validateConnectionString(trimmedConnection)) {
        throw new Error('Invalid connection string format')
      }

      console.log(`[${new Date().toISOString()}] Calling electronAPI.connectDatabase`)
      const result = await window.electronAPI.connectDatabase(trimmedConnection)
      console.log(`[${new Date().toISOString()}] Database connection result:`, result.success ? `Connected to ${result.database}, ${result.tables?.length} tables` : result.error)
      
      if (!result.success) {
        throw new Error(result.error || 'Connection failed')
      }
      
      return result
    },
    onSuccess: (data) => {
      console.log(`[${new Date().toISOString()}] Connection successful, switching to explorer view`)
      setCurrentView('explorer')
      setCurrentDatabase(data.database || '')
      setTables((data.tables || []).map(name => ({ name })))
      setIsAutoConnecting(false)
    },
    onError: (error) => {
      console.log(`[${new Date().toISOString()}] Connection failed:`, error.message)
      setIsAutoConnecting(false)
    }
  })


  const handleConnect = () => {
    connectionMutation.mutate(connectionString)
  }

  // Auto-connect to the most recently used connection on startup (delayed for better UX)
  useEffect(() => {
    if (!hasAttemptedAutoConnect && connectionsData && connectionsData.length > 0) {
      setHasAttemptedAutoConnect(true)
      setIsAutoConnecting(true)
      
      // Delay auto-connection slightly to let UI render first
      setTimeout(() => {
      
      // Find the most recently used connection (connections are already sorted by lastUsed)
      const mostRecentConnection = connectionsData[0]
      
      // Load and connect to the most recent connection
      window.electronAPI.loadConnection(mostRecentConnection.id)
        .then((result) => {
          if (result.success && result.connectionString) {
            setConnectionString(result.connectionString)
            connectionMutation.mutate(result.connectionString)
          } else {
            setIsAutoConnecting(false)
          }
        })
        .catch((error) => {
          console.warn('Failed to auto-connect to last used database:', error)
          setIsAutoConnecting(false)
        })
      }, 100) // 100ms delay to let UI render first
    } else if (!hasAttemptedAutoConnect) {
      setHasAttemptedAutoConnect(true)
    }
  }, [connectionsData, hasAttemptedAutoConnect, connectionMutation])

  const handleConnectionSelect = (newConnectionString: string) => {
    setConnectionString(newConnectionString)
    // Auto-connect when a saved connection is selected
    connectionMutation.mutate(newConnectionString)
  }

  const handleConnectionChange = (connectionId: string) => {
    // Load and connect to selected connection
    window.electronAPI.loadConnection(connectionId)
      .then((result) => {
        if (result.success && result.connectionString) {
          setConnectionString(result.connectionString)
          connectionMutation.mutate(result.connectionString)
        }
      })
      .catch((error) => {
        console.warn('Failed to load connection:', error)
      })
  }

  const handleTableSelect = (tableName: string) => {
    console.log('[handleTableSelect] Selected table:', tableName)
    console.log('[handleTableSelect] Current tabs:', tabs)
    console.log('[handleTableSelect] Current activeTabId:', activeTabId)
    
    // Check if table is already open in a tab
    const existingTab = tabs.find(tab => tab.tableName === tableName)
    
    if (existingTab) {
      console.log('[handleTableSelect] Found existing tab:', existingTab)
      // Switch to existing tab
      setActiveTabId(existingTab.id)
    } else {
      // Create new tab
      const newTab: TableTab = {
        id: `${tableName}_${Date.now()}`,
        tableName,
        searchTerm: '',
        page: 1,
        pageSize: 100
      }
      console.log('[handleTableSelect] Creating new tab:', newTab)
      setTabs(prev => {
        const newTabs = [...prev, newTab]
        console.log('[handleTableSelect] New tabs array:', newTabs)
        return newTabs
      })
      setActiveTabId(newTab.id)
    }
    
    // Add to recent tables
    setRecentTables(prev => {
      const filtered = prev.filter(t => t.name !== tableName)
      return [{ name: tableName }, ...filtered].slice(0, 5) // Keep last 5
    })
  }
  
  const handleCloseTab = (tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId)
      // If closing active tab, switch to another tab or null
      if (activeTabId === tabId) {
        const newActiveTab = newTabs[newTabs.length - 1]
        setActiveTabId(newActiveTab?.id || null)
      }
      return newTabs
    })
  }
  

  const handleNewConnection = () => {
    setConnectionString('')
    setCurrentView('connect')
    // Reset any previous connection state
    connectionMutation.reset()
  }

  const handleShowConnections = () => {
    setCurrentView('connect')
  }

  // Expose menu handlers to main process via IPC
  useEffect(() => {
    if (window.electronAPI?.onMenuAction) {
      window.electronAPI.onMenuAction((action: MenuAction) => {
        switch (action) {
          case 'new-connection':
            handleNewConnection()
            break
          case 'show-connections':
            handleShowConnections()
            break
          case 'back-to-tables':
            // Close current tab
            if (activeTabId) {
              handleCloseTab(activeTabId)
            }
            break
        }
      })
    }
  }, [currentView])
  
  // Keyboard shortcuts for tab navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + W to close current tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault()
        if (activeTabId) {
          handleCloseTab(activeTabId)
        }
      }
      // Cmd/Ctrl + Tab to cycle forward through tabs
      else if ((e.metaKey || e.ctrlKey) && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        const currentIndex = tabs.findIndex(t => t.id === activeTabId)
        const nextIndex = (currentIndex + 1) % tabs.length
        if (tabs[nextIndex]) {
          setActiveTabId(tabs[nextIndex].id)
        }
      }
      // Cmd/Ctrl + Shift + Tab to cycle backward through tabs
      else if ((e.metaKey || e.ctrlKey) && e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        const currentIndex = tabs.findIndex(t => t.id === activeTabId)
        const prevIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1
        if (tabs[prevIndex]) {
          setActiveTabId(tabs[prevIndex].id)
        }
      }
      // Cmd/Ctrl + 1-9 to jump to specific tab
      else if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const tabIndex = parseInt(e.key) - 1
        if (tabs[tabIndex]) {
          setActiveTabId(tabs[tabIndex].id)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tabs, activeTabId, handleCloseTab])

  // Convert connections data to the format expected by DatabaseSidebar
  const connections = (connectionsData || []).map(conn => ({
    id: conn.id,
    name: conn.name,
    database: conn.database
  }))

  const currentConnection = connections.find(conn => 
    conn.database === currentDatabase
  )

  const getStatusVariant = () => {
    if (connectionMutation.isSuccess) return 'default' // Green-ish
    if (connectionMutation.isError) return 'destructive' // Red
    return 'default' // Default styling
  }

  const getButtonText = () => {
    if (connectionMutation.isPending) return 'Connecting...'
    if (connectionMutation.isSuccess) return 'Connected'
    return 'Connect'
  }

  const getStatusMessage = () => {
    if (connectionMutation.isPending) return 'Connecting...'
    if (connectionMutation.isSuccess) return `Connected to ${connectionMutation.data?.database}`
    if (connectionMutation.isError) return `Connection error: ${connectionMutation.error?.message}`
    return ''
  }

  const shouldShowStatus = () => {
    return connectionMutation.isPending || connectionMutation.isSuccess || connectionMutation.isError
  }

  // Explorer view with sidebar + main content
  if (currentView === 'explorer' && connectionMutation.isSuccess) {
    return (
      <div className="h-screen bg-background text-foreground flex flex-col">
        {/* Fixed header area */}
        <div className="flex-none">
          <TitleBar title={activeTabId && tabs.find(t => t.id === activeTabId) 
            ? `Datagres - ${tabs.find(t => t.id === activeTabId)!.tableName}` 
            : `Datagres - ${currentDatabase}`} />
        </div>
        
        {/* Main layout with resizable panels */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Sidebar Panel */}
            <ResizablePanel defaultSize={25} minSize={5} maxSize={95}>
              <DatabaseSidebar
                connections={connections}
                currentConnection={currentConnection}
                tables={tables}
                recentTables={recentTables}
                onConnectionChange={handleConnectionChange}
                onTableSelect={handleTableSelect}
                selectedTable={tabs.find(t => t.id === activeTabId)?.tableName || ''}
              />
            </ResizablePanel>
            
            {/* Resize handle */}
            <ResizableHandle />
            
            {/* Main content panel */}
            <ResizablePanel defaultSize={75} minSize={5}>
              {tabs.length > 0 ? (
                <Tabs value={activeTabId || ''} onValueChange={(value) => {
                  console.log('[Tabs] Tab changed to:', value)
                  setActiveTabId(value)
                }} className="h-full flex flex-col">
                  <div className="border-b bg-background">
                    <TabsList className="h-auto p-0 bg-transparent rounded-none w-full justify-start">
                      {tabs.map(tab => (
                        <div key={tab.id} className="relative group">
                          <TabsTrigger 
                            value={tab.id}
                            className="rounded-none border-r data-[state=active]:bg-muted data-[state=active]:shadow-none pr-8"
                          >
                            <span className="max-w-[150px] truncate">{tab.tableName}</span>
                          </TabsTrigger>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCloseTab(tab.id)
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </TabsList>
                  </div>
                  {tabs.map(tab => {
                    console.log('[TabsContent] Rendering tab content for:', tab)
                    return (
                      <TabsContent key={tab.id} value={tab.id} className="flex-1 mt-0 overflow-hidden">
                        <TableView
                          key={`${tab.id}_${tab.tableName}`}
                          tableName={tab.tableName}
                          connectionString={connectionString}
                          initialSearchTerm={tab.searchTerm}
                          initialPage={tab.page}
                          initialPageSize={tab.pageSize}
                        />
                      </TabsContent>
                    )
                  })}
                </Tabs>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Select a table to view data</h3>
                    <p className="text-muted-foreground">
                      Choose a table from the sidebar to start exploring your data
                    </p>
                  </div>
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    )
  }

  // Connection Form View (default)
  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      {/* Fixed header area */}
      <div className="flex-none">
        <TitleBar />
      </div>
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col items-center justify-center min-h-full p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Datagres - Database Explorer
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Paste connection string here"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                className="flex-1"
                disabled={connectionMutation.isPending}
              />
              <Button 
                onClick={handleConnect}
                disabled={connectionMutation.isPending}
                className={connectionMutation.isSuccess ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {getButtonText()}
              </Button>
            </div>

            {shouldShowStatus() && !connectionMutation.isSuccess && (
              <Alert variant={getStatusVariant()}>
                <AlertDescription data-testid="connection-status">
                  {getStatusMessage()}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Connection Manager */}
      <div className="mt-6 w-full max-w-md">
        <ConnectionManager 
          onConnectionSelect={handleConnectionSelect}
          currentConnectionString={connectionMutation.isSuccess ? connectionString : undefined}
        />
        </div>
        </div>
      </div>
    </div>
  )
}

export default App