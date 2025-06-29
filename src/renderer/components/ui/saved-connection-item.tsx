import { Database, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import type { SavedConnection } from '@shared/types'

interface SavedConnectionItemProps {
  connection: SavedConnection
  onLoad: (connectionId: string) => void
  onEdit: (connection: SavedConnection) => void
  onDelete: (connectionId: string) => void
}

export function SavedConnectionItem({ 
  connection, 
  onLoad, 
  onEdit, 
  onDelete 
}: SavedConnectionItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
          data-testid="saved-connection-item"
        >
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onLoad(connection.id)}>
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
                onEdit(connection)
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
                onDelete(connection.id)
              }}
              data-testid="delete-connection-button"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onLoad(connection.id)}>
          <Database className="mr-2 h-4 w-4" />
          Connect
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onEdit(connection)}>
          <Edit2 className="mr-2 h-4 w-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={() => onDelete(connection.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export function EmptyConnectionsState() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p>No saved connections yet.</p>
      <p className="text-sm">Connect to a database and save it for quick access.</p>
    </div>
  )
}