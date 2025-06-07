import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataTable } from "@/components/ui/data-table"
import { ConnectionManager } from "@/components/ui/connection-manager"

declare global {
  interface Window {
    electronAPI: {
      connectDatabase: (connectionString: string) => Promise<{success: boolean, database?: string, tables?: string[], error?: string}>
      fetchTableData: (connectionString: string, tableName: string) => Promise<{success: boolean, tableName?: string, data?: {columns: string[], rows: any[][]}, error?: string}>
      saveConnection: (connectionString: string, name: string) => Promise<{success: boolean, connectionId?: string, name?: string, error?: string}>
      getSavedConnections: () => Promise<{success: boolean, connections?: any[], error?: string}>
      loadConnection: (connectionId: string) => Promise<{success: boolean, connectionString?: string, name?: string, error?: string}>
      deleteConnection: (connectionId: string) => Promise<{success: boolean, error?: string}>
      updateConnectionName: (connectionId: string, newName: string) => Promise<{success: boolean, error?: string}>
    }
  }
}

const validateConnectionString = (connectionString: string): boolean => {
  // PostgreSQL connection string validation (password optional)
  const pgRegex = /^postgresql:\/\/([^:@]+(:([^@]*))?@)?[^:\/]+:\d+\/[\w-]+$/
  return pgRegex.test(connectionString)
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
  const [currentView, setCurrentView] = useState<'connect' | 'tables' | 'tableData'>('connect')
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [hasAttemptedAutoConnect, setHasAttemptedAutoConnect] = useState(false)

  // Get saved connections to find the most recently used one
  const { data: connectionsData } = useQuery({
    queryKey: ['saved-connections'],
    queryFn: async () => {
      const result = await window.electronAPI.getSavedConnections()
      if (!result.success) {
        throw new Error(result.error || 'Failed to load connections')
      }
      return result.connections
    }
  })

  const connectionMutation = useMutation({
    mutationFn: async (connectionString: string) => {
      const trimmedConnection = connectionString.trim()
      
      if (!trimmedConnection) {
        throw new Error('Please enter a connection string')
      }

      if (!validateConnectionString(trimmedConnection)) {
        throw new Error('Invalid connection string format')
      }


      const result = await window.electronAPI.connectDatabase(trimmedConnection)
      
      if (!result.success) {
        throw new Error(result.error || 'Connection failed')
      }
      
      return result
    },
    onSuccess: () => {
      setCurrentView('tables')
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
      setCurrentView('tableData')
    }
  })

  const handleConnect = () => {
    connectionMutation.mutate(connectionString)
  }

  // Auto-connect to the most recently used connection on startup
  useEffect(() => {
    if (!hasAttemptedAutoConnect && connectionsData && connectionsData.length > 0) {
      setHasAttemptedAutoConnect(true)
      
      // Find the most recently used connection (connections are already sorted by lastUsed)
      const mostRecentConnection = connectionsData[0]
      
      // Load and connect to the most recent connection
      window.electronAPI.loadConnection(mostRecentConnection.id)
        .then((result) => {
          if (result.success && result.connectionString) {
            setConnectionString(result.connectionString)
            connectionMutation.mutate(result.connectionString)
          }
        })
        .catch((error) => {
          console.warn('Failed to auto-connect to last used database:', error)
        })
    }
  }, [connectionsData, hasAttemptedAutoConnect, connectionMutation])

  const handleConnectionSelect = (newConnectionString: string) => {
    setConnectionString(newConnectionString)
    setCurrentView('connect')
    // Auto-connect when a saved connection is selected
    connectionMutation.mutate(newConnectionString)
  }

  const handleTableClick = (tableName: string) => {
    tableDataMutation.mutate(tableName)
  }

  const handleBackToTables = () => {
    setCurrentView('tables')
    setSelectedTable('')
  }

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

  // Render different views based on current state
  if (currentView === 'tableData' && tableDataMutation.isSuccess && tableDataMutation.data?.data) {
    // Table Data View
    return (
      <div className="flex flex-col min-h-screen bg-background font-sans p-4">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={handleBackToTables}
              data-testid="back-to-tables"
            >
              ← Back to Tables
            </Button>
            <h2 className="text-2xl font-semibold text-foreground" data-testid="table-header">
              {selectedTable}
            </h2>
          </div>
        </div>
        
        <Card className="w-full max-w-6xl mx-auto">
          <CardContent className="pt-6">
            <div data-testid="table-data">
              <DataTable
                columns={createColumns(tableDataMutation.data.data.columns)}
                data={tableDataMutation.data.data.rows}
                tableName={selectedTable}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentView === 'tables' && connectionMutation.isSuccess && connectionMutation.data?.tables) {
    // Tables List View
    return (
      <div className="flex flex-col min-h-screen bg-background font-sans p-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Connected to {connectionMutation.data.database}
          </h2>
        </div>
        
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Tables</h3>
              <div data-testid="tables-list" className="space-y-2">
                {connectionMutation.data.tables.length > 0 ? (
                  connectionMutation.data.tables.map((table) => (
                    <div 
                      key={table}
                      data-testid="table-item"
                      onClick={() => handleTableClick(table)}
                      className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <span className="font-medium">{table}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-center py-8">
                    No tables found in this database
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Connection Manager - also shown in tables view */}
          <ConnectionManager 
            onConnectionSelect={handleConnectionSelect}
            currentConnectionString={connectionString}
          />
        </div>
      </div>
    )
  }

  // Connection Form View (default)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background font-sans p-4">
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
  )
}

export default App