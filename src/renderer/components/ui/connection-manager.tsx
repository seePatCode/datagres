import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Plus, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SavedConnectionItem, EmptyConnectionsState } from '@/components/ui/saved-connection-item'
import { EditConnectionDialog } from '@/components/ui/edit-connection-dialog'
import type { SavedConnection } from '@shared/types'
import type { AppDispatch } from '@/store/store'
import { 
  selectSavedConnections,
  saveConnection,
  deleteConnection,
  updateConnectionName,
  loadSavedConnections,
} from '@/store/slices/connectionSlice'

interface ConnectionManagerProps {
  onConnectionSelect: (connectionString: string) => void
  onSavedConnectionSelect?: (connectionId: string) => void
  currentConnectionString?: string
}

export function ConnectionManager({ onConnectionSelect, onSavedConnectionSelect, currentConnectionString }: ConnectionManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [connectionName, setConnectionName] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState<SavedConnection | null>(null)
  const [editingConnectionString, setEditingConnectionString] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get data from Redux
  const dispatch = useDispatch<AppDispatch>()
  const connections = useSelector(selectSavedConnections)

  const handleSaveConnection = async () => {
    if (!currentConnectionString || !connectionName.trim()) {
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    const result = await dispatch(saveConnection({ 
      connectionString: currentConnectionString, 
      name: connectionName.trim() 
    }))
    
    if (result.meta.requestStatus === 'fulfilled') {
      setIsDialogOpen(false)
      setConnectionName('')
      // Refresh the saved connections list to show the newly saved connection
      dispatch(loadSavedConnections())
    } else {
      setError('Failed to save connection')
    }
    
    setIsLoading(false)
  }

  const handleLoadConnection = (connectionId: string) => {
    // Use the dedicated handler for saved connections if available
    if (onSavedConnectionSelect) {
      onSavedConnectionSelect(connectionId)
    } else {
      // Fallback to loading and using connection string
      window.electronAPI.loadConnection(connectionId).then((result) => {
        if (result.success && result.connectionString) {
          onConnectionSelect(result.connectionString)
        }
      })
    }
  }

  const handleDeleteConnection = async (connectionId: string) => {
    if (confirm('Are you sure you want to delete this connection? This will also remove any saved passwords.')) {
      await dispatch(deleteConnection(connectionId))
    }
  }

  const handleStartEdit = async (connection: SavedConnection) => {
    setEditingConnection(connection)
    setEditDialogOpen(true)
    
    // Load the full connection string
    const result = await window.electronAPI.loadConnection(connection.id)
    if (result.success && result.connectionString) {
      setEditingConnectionString(result.connectionString)
    }
  }

  const handleSaveEdit = async (newName: string) => {
    if (!editingConnection) return
    
    setIsLoading(true)
    const result = await dispatch(updateConnectionName({ 
      connectionId: editingConnection.id, 
      newName
    }))
    
    if (result.meta.requestStatus === 'fulfilled') {
      handleCancelEdit()
    }
    setIsLoading(false)
  }

  const handleCancelEdit = () => {
    setEditDialogOpen(false)
    setEditingConnection(null)
    setEditingConnectionString('')
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Saved Connections
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                disabled={!currentConnectionString}
                data-testid="save-connection-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Save Current
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Connection</DialogTitle>
                <DialogDescription>
                  Give this connection a name for easy access later. Your password will be stored securely in your system keychain.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Connection name (e.g., Production DB)"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  data-testid="connection-name-input"
                />
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveConnection}
                    disabled={!connectionName.trim() || isLoading}
                    data-testid="confirm-save-button"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {connections.length === 0 ? (
          <EmptyConnectionsState />
        ) : (
          <div className="space-y-2" data-testid="saved-connections-list">
            {connections.map((connection) => (
              <SavedConnectionItem
                key={connection.id}
                connection={connection}
                onLoad={handleLoadConnection}
                onEdit={handleStartEdit}
                onDelete={handleDeleteConnection}
              />
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Edit Connection Dialog */}
      <EditConnectionDialog
        isOpen={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        connectionName={editingConnection?.name || ''}
        connectionString={editingConnectionString}
        isLoading={isLoading}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
      />
    </Card>
  )
}