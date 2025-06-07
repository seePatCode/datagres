import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

declare global {
  interface Window {
    electronAPI: {
      connectDatabase: (connectionString: string) => Promise<{success: boolean, database?: string, error?: string}>
    }
  }
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error'

function App() {
  const [connectionString, setConnectionString] = useState('')
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [connectedDatabase, setConnectedDatabase] = useState('')

  const validateConnectionString = (connectionString: string): boolean => {
    // PostgreSQL connection string validation (password optional)
    const pgRegex = /^postgresql:\/\/([^:@]+(:([^@]*))?@)?[^:\/]+:\d+\/[\w-]+$/
    return pgRegex.test(connectionString)
  }

  const handleConnect = async () => {
    const trimmedConnection = connectionString.trim()
    
    if (!trimmedConnection) {
      setStatus('error')
      setStatusMessage('Please enter a connection string')
      return
    }

    if (!validateConnectionString(trimmedConnection)) {
      setStatus('error')
      setStatusMessage('Invalid connection string format')
      return
    }

    setStatus('connecting')
    setStatusMessage('Connecting...')

    try {
      const result = await window.electronAPI.connectDatabase(trimmedConnection)
      
      if (result.success) {
        setStatus('connected')
        setStatusMessage(`Connected to ${result.database}`)
        setConnectedDatabase(result.database || '')
      } else {
        setStatus('error')
        setStatusMessage(`Connection failed: ${result.error}`)
      }
    } catch (error) {
      setStatus('error')
      setStatusMessage(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getStatusVariant = () => {
    switch (status) {
      case 'connected': return 'default' // Green-ish
      case 'error': return 'destructive' // Red
      default: return 'default' // Default styling
    }
  }

  const getButtonText = () => {
    switch (status) {
      case 'connecting': return 'Connecting...'
      case 'connected': return 'Connected'
      default: return 'Connect'
    }
  }

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
                disabled={status === 'connecting'}
              />
              <Button 
                onClick={handleConnect}
                disabled={status === 'connecting'}
                className={status === 'connected' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {getButtonText()}
              </Button>
            </div>

            {status !== 'idle' && (
              <Alert variant={getStatusVariant()}>
                <AlertDescription data-testid="connection-status">
                  {statusMessage}
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