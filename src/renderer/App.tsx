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
import type { ElectronAPI, AppView, TableInfo, MenuAction } from '@shared/types'
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
  console.log(`[${new Date().toISOString()}] App component initializing`)
  console.time('app-component-mount')
  
  const [connectionString, setConnectionString] = useState('')
  const [currentView, setCurrentView] = useState<AppView>('connect')
  const [currentDatabase, setCurrentDatabase] = useState<string>('')
  const [tables, setTables] = useState<TableInfo[]>([])
  const [recentTables, setRecentTables] = useState<TableInfo[]>([])
  const [currentTableData, setCurrentTableData] = useState<{columns: string[], rows: any[][]} | null>(null)
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [hasAttemptedAutoConnect, setHasAttemptedAutoConnect] = useState(false)
  const [isAutoConnecting, setIsAutoConnecting] = useState(false)

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

  const tableDataMutation = useMutation({
    mutationFn: async (tableName: string) => {
      const result = await window.electronAPI.fetchTableData(connectionString, tableName)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch table data')
      }
      
      return result
    },
    onSuccess: (data) => {
      setSelectedTable(data.tableName || '')
      setCurrentTableData(data.data || null)
      // Add to recent tables
      const tableName = data.tableName || ''
      setRecentTables(prev => {
        const filtered = prev.filter(t => t.name !== tableName)
        return [{ name: tableName }, ...filtered].slice(0, 5) // Keep last 5
      })
    }
  })

  const handleConnect = () => {
    connectionMutation.mutate(connectionString)
  }

  // Auto-connect to the most recently used connection on startup (delayed for better UX)
  useEffect(() => {
    if (!hasAttemptedAutoConnect && connectionsData && connectionsData.length > 0) {
      console.log(`[${new Date().toISOString()}] Starting auto-connection process`)
      setHasAttemptedAutoConnect(true)
      setIsAutoConnecting(true)
      
      // Delay auto-connection slightly to let UI render first
      setTimeout(() => {
      
      // Find the most recently used connection (connections are already sorted by lastUsed)
      const mostRecentConnection = connectionsData[0]
      console.log(`[${new Date().toISOString()}] Loading most recent connection:`, mostRecentConnection.name)
      
      // Load and connect to the most recent connection
      window.electronAPI.loadConnection(mostRecentConnection.id)
        .then((result) => {
          console.log(`[${new Date().toISOString()}] Load connection result:`, result.success ? 'Success' : result.error)
          if (result.success && result.connectionString) {
            setConnectionString(result.connectionString)
            console.log(`[${new Date().toISOString()}] Triggering auto-connection to database`)
            connectionMutation.mutate(result.connectionString)
          } else {
            console.log(`[${new Date().toISOString()}] Auto-connection aborted - no valid connection string`)
            setIsAutoConnecting(false)
          }
        })
        .catch((error) => {
          console.warn(`[${new Date().toISOString()}] Failed to auto-connect to last used database:`, error)
          setIsAutoConnecting(false)
        })
      }, 100) // 100ms delay to let UI render first
    } else if (!hasAttemptedAutoConnect) {
      console.log(`[${new Date().toISOString()}] No saved connections found, skipping auto-connect`)
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
    tableDataMutation.mutate(tableName)
  }

  const handleTableRefresh = () => {
    if (selectedTable) {
      tableDataMutation.mutate(selectedTable)
    }
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
            if (selectedTable) {
              setSelectedTable('')
              setCurrentTableData(null)
            }
            break
        }
      })
    }
  }, [currentView])

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
          <TitleBar title={selectedTable ? `Datagres - ${selectedTable}` : `Datagres - ${currentDatabase}`} />
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
                selectedTable={selectedTable}
              />
            </ResizablePanel>
            
            {/* Resize handle */}
            <ResizableHandle />
            
            {/* Main content panel */}
            <ResizablePanel defaultSize={75} minSize={5}>
              {selectedTable && currentTableData ? (
                <TableView
                  tableName={selectedTable}
                  data={currentTableData}
                  onRefresh={handleTableRefresh}
                  isLoading={tableDataMutation.isPending}
                />
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