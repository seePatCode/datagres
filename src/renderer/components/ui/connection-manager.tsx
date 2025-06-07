import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Database, Trash2, Edit2, Check, X } from 'lucide-react'
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

interface SavedConnection {
  id: string
  name: string
  host: string
  port: number
  database: string
  username: string
  hasPassword: boolean
  createdAt: string
  lastUsed: string
}

interface ConnectionManagerProps {
  onConnectionSelect: (connectionString: string) => void
  currentConnectionString?: string
}

export function ConnectionManager({ onConnectionSelect, currentConnectionString }: ConnectionManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [connectionName, setConnectionName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  
  const queryClient = useQueryClient()

  // Get saved connections
  const { data: connectionsData, isLoading } = useQuery({
    queryKey: ['saved-connections'],
    queryFn: async () => {
      const result = await window.electronAPI.getSavedConnections()
      if (!result.success) {
        throw new Error(result.error || 'Failed to load connections')
      }
      return result.connections
    }
  })

  // Save connection mutation
  const saveConnectionMutation = useMutation({
    mutationFn: async ({ connectionString, name }: { connectionString: string, name: string }) => {
      const result = await window.electronAPI.saveConnection(connectionString, name)
      if (!result.success) {
        throw new Error(result.error || 'Failed to save connection')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-connections'] })
      setIsDialogOpen(false)
      setConnectionName('')
    }
  })

  // Load connection mutation
  const loadConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const result = await window.electronAPI.loadConnection(connectionId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to load connection')
      }
      return result
    },
    onSuccess: (data) => {
      onConnectionSelect(data.connectionString)
    }
  })

  // Delete connection mutation
  const deleteConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const result = await window.electronAPI.deleteConnection(connectionId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete connection')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-connections'] })
    }
  })

  // Update connection name mutation
  const updateNameMutation = useMutation({
    mutationFn: async ({ connectionId, newName }: { connectionId: string, newName: string }) => {
      const result = await window.electronAPI.updateConnectionName(connectionId, newName)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update connection name')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-connections'] })
      setEditingId(null)
      setEditingName('')
    }
  })

  const handleSaveConnection = () => {
    if (!currentConnectionString || !connectionName.trim()) {
      return
    }
    saveConnectionMutation.mutate({
      connectionString: currentConnectionString,
      name: connectionName.trim()
    })
  }

  const handleLoadConnection = (connectionId: string) => {
    loadConnectionMutation.mutate(connectionId)
  }

  const handleDeleteConnection = (connectionId: string) => {
    if (confirm('Are you sure you want to delete this connection? This will also remove any saved passwords.')) {
      deleteConnectionMutation.mutate(connectionId)
    }
  }

  const handleStartEdit = (connection: SavedConnection) => {
    setEditingId(connection.id)
    setEditingName(connection.name)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) {
      return
    }
    updateNameMutation.mutate({
      connectionId: editingId,
      newName: editingName.trim()
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const connections = connectionsData || []

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
                {saveConnectionMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {saveConnectionMutation.error?.message}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveConnection}
                    disabled={!connectionName.trim() || saveConnectionMutation.isPending}
                    data-testid="confirm-save-button"
                  >
                    {saveConnectionMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading connections...
          </div>
        ) : connections.length === 0 ? (
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
                <div className="flex-1 min-w-0">
                  {editingId === connection.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8"
                        data-testid="edit-name-input"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSaveEdit}
                        data-testid="save-edit-button"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        data-testid="cancel-edit-button"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="cursor-pointer" onClick={() => handleLoadConnection(connection.id)}>
                      <div className="font-medium truncate" data-testid="connection-name">
                        {connection.name}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {connection.username}@{connection.host}:{connection.port}/{connection.database}
                        {connection.hasPassword && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded-md bg-black/20 border" style={{
                            borderColor: 'hsl(var(--accent-cyan))',
                            color: 'hsl(var(--accent-cyan))',
                            boxShadow: '0 0 4px hsla(var(--accent-cyan), 0.3)'
                          }}>
                            🔒 Saved
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last used: {new Date(connection.lastUsed).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
                {editingId !== connection.id && (
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
                )}
              </div>
            ))}
          </div>
        )}

        {(loadConnectionMutation.isError || deleteConnectionMutation.isError || updateNameMutation.isError) && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              {loadConnectionMutation.error?.message || 
               deleteConnectionMutation.error?.message || 
               updateNameMutation.error?.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}