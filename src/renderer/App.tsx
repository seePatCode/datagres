import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

declare global {
  interface Window {
    electronAPI: {
      connectDatabase: (connectionString: string) => Promise<{success: boolean, database?: string, tables?: string[], error?: string}>
    }
  }
}

const validateConnectionString = (connectionString: string): boolean => {
  // PostgreSQL connection string validation (password optional)
  const pgRegex = /^postgresql:\/\/([^:@]+(:([^@]*))?@)?[^:\/]+:\d+\/[\w-]+$/
  return pgRegex.test(connectionString)
}

function App() {
  const [connectionString, setConnectionString] = useState('')

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
  })

  const handleConnect = () => {
    connectionMutation.mutate(connectionString)
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

  // Show tables list if successfully connected, otherwise show connection form
  if (connectionMutation.isSuccess && connectionMutation.data?.tables) {
    return (
      <div className="flex flex-col min-h-screen bg-background font-sans p-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Connected to {connectionMutation.data.database}
          </h2>
        </div>
        
        <Card className="w-full max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Tables</h3>
            <div data-testid="tables-list" className="space-y-2">
              {connectionMutation.data.tables.length > 0 ? (
                connectionMutation.data.tables.map((table) => (
                  <div 
                    key={table}
                    data-testid="table-item"
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
      </div>
    )
  }

  // Show connection form
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

            {shouldShowStatus() && (
              <Alert variant={getStatusVariant()}>
                <AlertDescription data-testid="connection-status">
                  {getStatusMessage()}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default App