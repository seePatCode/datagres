import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Plus, Database, Trash2, Edit2, Eye, EyeOff, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { SavedConnection } from '@shared/types'
import type { AppDispatch } from '@/store/store'
import { 
  selectSavedConnections,
  saveConnection,
  deleteConnection,
  updateConnectionName,
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
  const [editingName, setEditingName] = useState('')
  const [editingConnectionString, setEditingConnectionString] = useState('')
  const [showConnectionString, setShowConnectionString] = useState(false)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)
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
    setEditingName(connection.name)
    setEditDialogOpen(true)
    
    // Load the full connection string
    const result = await window.electronAPI.loadConnection(connection.id)
    if (result.success && result.connectionString) {
      setEditingConnectionString(result.connectionString)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingConnection || !editingName.trim()) {
      return
    }
    
    setIsLoading(true)
    const result = await dispatch(updateConnectionName({ 
      connectionId: editingConnection.id, 
      newName: editingName.trim() 
    }))
    
    if (result.meta.requestStatus === 'fulfilled') {
      handleCancelEdit()
    }
    setIsLoading(false)
  }

  const handleCancelEdit = () => {
    setEditDialogOpen(false)
    setEditingConnection(null)
    setEditingName('')
    setEditingConnectionString('')
    setShowConnectionString(false)
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(editingConnectionString)
    setCopiedToClipboard(true)
    setTimeout(() => setCopiedToClipboard(false), 2000)
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
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No saved connections yet.</p>
            <p className="text-sm">Connect to a database and save it for quick access.</p>
          </div>
        ) : (
          <div className="space-y-2" data-testid="saved-connections-list">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
                data-testid="saved-connection-item"
              >
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleLoadConnection(connection.id)}>
                  <div className="font-medium truncate" data-testid="connection-name">
                    {connection.name}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {connection.username}@{connection.host}:{connection.port}/{connection.database}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last used: {new Date(connection.lastUsed).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartEdit(connection)
                    }}
                    data-testid="edit-connection-button"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteConnection(connection.id)
                    }}
                    data-testid="delete-connection-button"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Edit Connection Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Connection</DialogTitle>
            <DialogDescription>
              Update the connection name or view the connection string
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Connection Name</Label>
              <Input
                id="edit-name"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Connection name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="connection-string">Connection String</Label>
              <div className="relative">
                <Input
                  id="connection-string"
                  type={showConnectionString ? "text" : "password"}
                  value={editingConnectionString}
                  readOnly
                  className="pr-20 font-mono text-sm"
                />
                <div className="absolute right-1 top-1 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowConnectionString(!showConnectionString)}
                    className="h-8 w-8 p-0"
                  >
                    {showConnectionString ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyToClipboard}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {copiedToClipboard && (
                <p className="text-sm text-muted-foreground">Copied to clipboard!</p>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={!editingName.trim() || isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}