import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { generateUniqueConnectionName } from '@/utils/connectionNameGenerator'
import { useSelector, useDispatch } from 'react-redux'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ConnectionManager } from "@/components/ui/connection-manager"
// SaveConnectionDialog removed - connections are now auto-saved
import { ConnectionStringPreview } from "@/components/ui/connection-string-preview"
import { TitleBar } from "@/components/ui/title-bar"
import type { AppDispatch } from '@/store/store'
import {
  connectToDatabase,
  loadAndConnectToSavedConnection,
  saveConnection,
  loadSavedConnections,
  selectActiveConnection,
  selectConnectionStatus,
  selectConnectionError,
} from '@/store/slices/connectionSlice'
import {
  selectCanGoBack,
  selectCanGoForward,
  navigateBack,
  navigateForward,
  setCurrentView,
  pushNavigationEntry,
} from '@/store/slices/uiSlice'

export function ConnectionView() {
  const dispatch = useDispatch<AppDispatch>()
  const { toast } = useToast()
  
  // Local state for form
  const [connectionString, setConnectionString] = useState('')
  
  // Redux state
  const activeConnection = useSelector(selectActiveConnection)
  const connectionStatus = useSelector(selectConnectionStatus)
  const connectionError = useSelector(selectConnectionError)
  // Removed showSaveDialog and pendingConnectionString - connections are now auto-saved
  const canGoBack = useSelector(selectCanGoBack)
  const canGoForward = useSelector(selectCanGoForward)
  
  const isConnecting = connectionStatus === 'connecting'
  const isConnected = connectionStatus === 'connected'
  const isError = connectionStatus === 'error'
  
  const handleConnect = () => {
    dispatch(connectToDatabase({ connectionString })).then(async (result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(setCurrentView('explorer'))
        dispatch(pushNavigationEntry({ type: 'view', viewName: 'explorer' }))
        
        // Auto-save the connection if it isn't already saved
        const savedId = (result.payload as any)?.savedConnectionId
        if (!savedId) {
          // Generate default name
          const defaultName = getDefaultConnectionName(connectionString)
          // Auto-save with default name
          const saveResult = await dispatch(saveConnection({ connectionString, name: defaultName }))
          if (saveResult.meta.requestStatus === 'fulfilled') {
            // Show subtle notification
            toast({
              description: `Connection saved as "${defaultName}"`,
              duration: 3000,
            })
            // Refresh connections list
            dispatch(loadSavedConnections())
          }
        }
      }
    })
  }
  
  const handleConnectionSelect = (connString: string) => {
    setConnectionString(connString)
    // Connect with the new connection string
    dispatch(connectToDatabase({ connectionString: connString })).then(async (result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(setCurrentView('explorer'))
        dispatch(pushNavigationEntry({ type: 'view', viewName: 'explorer' }))
        
        // Auto-save the connection if it isn't already saved
        const savedId = (result.payload as any)?.savedConnectionId
        if (!savedId) {
          // Generate default name
          const defaultName = getDefaultConnectionName(connString)
          // Auto-save with default name
          const saveResult = await dispatch(saveConnection({ connectionString: connString, name: defaultName }))
          if (saveResult.meta.requestStatus === 'fulfilled') {
            // Show subtle notification
            toast({
              description: `Connection saved as "${defaultName}"`,
              duration: 3000,
            })
            // Refresh connections list
            dispatch(loadSavedConnections())
          }
        }
      }
    })
  }
  
  const handleSavedConnectionSelect = (connectionId: string) => {
    dispatch(loadAndConnectToSavedConnection(connectionId)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(setCurrentView('explorer'))
        dispatch(pushNavigationEntry({ type: 'view', viewName: 'explorer' }))
      }
    })
  }
  
  // handleSaveConnection removed - connections are now auto-saved
  
  const handleNavigateBack = () => dispatch(navigateBack())
  const handleNavigateForward = () => dispatch(navigateForward())
  
  const getStatusVariant = () => {
    if (isConnected) return 'default'
    if (isError) return 'destructive'
    return 'secondary'
  }

  const getStatusText = () => {
    if (isConnecting) return '🔄 Connecting...'
    if (isConnected && activeConnection) return `✅ Connected to ${activeConnection.database}`
    if (isError) return '❌ Connection failed'
    return '○ Not connected'
  }

  const getDefaultConnectionName = (connStr: string) => {
    return generateUniqueConnectionName(connStr)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TitleBar 
        title="Datagres - Connect to Database"
        onNavigateBack={canGoBack ? handleNavigateBack : undefined}
        onNavigateForward={canGoForward ? handleNavigateForward : undefined}
        canGoBack={!!canGoBack}
        canGoForward={!!canGoForward}
      />
      
      <div className="container mx-auto p-8 max-w-4xl">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">PostgreSQL Connection</h2>
              <p className="text-sm text-muted-foreground">
                Enter your PostgreSQL connection string or select a saved connection
              </p>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleConnect(); }} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="postgresql://username:password@host:port/database"
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  disabled={isConnecting}
                  className="font-mono"
                  data-testid="connection-string-input"
                />
                <p className="text-xs text-muted-foreground">
                  Example: postgresql://myuser:mypassword@localhost:5432/mydatabase
                </p>
              </div>
              
              {connectionString && (
                <ConnectionStringPreview 
                  connectionString={connectionString}
                  className="mb-4"
                />
              )}
              
              <div className="flex items-center gap-2">
                <Button 
                  type="submit" 
                  disabled={!connectionString.trim() || isConnecting}
                  data-testid="connect-button"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
                <div className={`px-3 py-1 rounded-md text-sm ${
                  isConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                  isError ? 'bg-destructive/10 text-destructive' : 
                  'bg-muted text-muted-foreground'
                }`}>
                  {getStatusText()}
                </div>
              </div>
            </form>
            
            {isError && connectionError && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>
                  {connectionError}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <ConnectionManager
          onConnectionSelect={handleConnectionSelect}
          onSavedConnectionSelect={handleSavedConnectionSelect}
          currentConnectionString={connectionString}
        />
      </div>
      
      {/* SaveConnectionDialog removed - connections are now auto-saved */}
    </div>
  )
}