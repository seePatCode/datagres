import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ConnectionManager } from "@/components/ui/connection-manager"
import { SaveConnectionDialog } from "@/components/ui/save-connection-dialog"
import { TitleBar } from "@/components/ui/title-bar"

interface ConnectionViewProps {
  connectionString: string
  setConnectionString: (value: string) => void
  connectionMutation: {
    isPending: boolean
    isSuccess: boolean
    isError: boolean
    error: Error | null
    data?: { database: string }
  }
  onConnect: () => void
  onConnectionSelect: (connectionString: string) => void
  onSavedConnectionSelect?: (connectionId: string) => void
  showSaveDialog: boolean
  setShowSaveDialog: (show: boolean) => void
  onSaveConnection: (name: string) => Promise<void>
  pendingConnectionString: string
  onNavigateBack?: () => void
  onNavigateForward?: () => void
  canGoBack?: boolean
  canGoForward?: boolean
}

export function ConnectionView({
  connectionString,
  setConnectionString,
  connectionMutation,
  onConnect,
  onConnectionSelect,
  onSavedConnectionSelect,
  showSaveDialog,
  setShowSaveDialog,
  onSaveConnection,
  pendingConnectionString,
  onNavigateBack,
  onNavigateForward,
  canGoBack,
  canGoForward
}: ConnectionViewProps) {
  const getStatusVariant = () => {
    if (connectionMutation.isSuccess) return 'default'
    if (connectionMutation.isError) return 'destructive'
    return 'default'
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
    <div className="h-screen bg-background text-foreground flex flex-col">
      {/* Fixed header area */}
      <div className="flex-none">
        <TitleBar 
          onNavigateBack={onNavigateBack}
          onNavigateForward={onNavigateForward}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
        />
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
                    variant={connectionMutation.isSuccess ? 'default' : 'primary'}
                    onClick={onConnect}
                    disabled={connectionMutation.isPending}
                    className={connectionMutation.isSuccess ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-600/50' : ''}
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
              onConnectionSelect={onConnectionSelect}
              onSavedConnectionSelect={onSavedConnectionSelect}
              currentConnectionString={connectionMutation.isSuccess ? connectionString : undefined}
            />
          </div>
        </div>
      </div>
      
      {/* Save Connection Dialog */}
      <SaveConnectionDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={onSaveConnection}
        defaultName={getDefaultConnectionName()}
      />
    </div>
  )
}