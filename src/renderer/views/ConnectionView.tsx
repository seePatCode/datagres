import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ConnectionManager } from "@/components/ui/connection-manager"
import { SaveConnectionDialog } from "@/components/ui/save-connection-dialog"
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
  selectShowSaveDialog,
  selectPendingConnectionString,
  selectCanGoBack,
  selectCanGoForward,
  hideSaveConnectionDialog,
  navigateBack,
  navigateForward,
  setCurrentView,
  pushNavigationEntry,
  showSaveConnectionDialog,
} from '@/store/slices/uiSlice'

export function ConnectionView() {
  const dispatch = useDispatch<AppDispatch>()
  
  // Local state for form
  const [connectionString, setConnectionString] = useState('')
  
  // Redux state
  const activeConnection = useSelector(selectActiveConnection)
  const connectionStatus = useSelector(selectConnectionStatus)
  const connectionError = useSelector(selectConnectionError)
  const showSaveDialog = useSelector(selectShowSaveDialog)
  const pendingConnectionString = useSelector(selectPendingConnectionString)
  const canGoBack = useSelector(selectCanGoBack)
  const canGoForward = useSelector(selectCanGoForward)
  
  const isConnecting = connectionStatus === 'connecting'
  const isConnected = connectionStatus === 'connected'
  const isError = connectionStatus === 'error'
  
  const handleConnect = () => {
    dispatch(connectToDatabase({ connectionString })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(setCurrentView('explorer'))
        dispatch(pushNavigationEntry({ type: 'view', viewName: 'explorer' }))
        
        // Show save dialog only if this connection isn't already saved
        const savedId = (result.payload as any)?.savedConnectionId
        if (!savedId) {
          dispatch(showSaveConnectionDialog(connectionString))
        }
      }
    })
  }
  
  const handleConnectionSelect = (connString: string) => {
    setConnectionString(connString)
    // Connect with the new connection string
    dispatch(connectToDatabase({ connectionString: connString })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(setCurrentView('explorer'))
        dispatch(pushNavigationEntry({ type: 'view', viewName: 'explorer' }))
        
        // Show save dialog only if this connection isn't already saved
        const savedId = (result.payload as any)?.savedConnectionId
        if (!savedId) {
          dispatch(showSaveConnectionDialog(connString))
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
  
  const handleSaveConnection = async (name: string) => {
    const result = await dispatch(saveConnection({ connectionString: pendingConnectionString, name }))
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(hideSaveConnectionDialog())
      // Refresh the saved connections list to show the newly saved connection
      dispatch(loadSavedConnections())
    }
  }
  
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

  const getDefaultConnectionName = () => {
    try {
      const url = new URL(pendingConnectionString)
      const username = url.username || 'user'
      const host = url.hostname || 'localhost'
      const database = url.pathname.substring(1) || 'database'
      return `${username}@${host}/${database}`
    } catch {
      return 'New Connection'
    }
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
      
      <SaveConnectionDialog
        open={showSaveDialog}
        onOpenChange={() => dispatch(hideSaveConnectionDialog())}
        onSave={handleSaveConnection}
        defaultName={getDefaultConnectionName()}
      />
    </div>
  )
}