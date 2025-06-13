import { useState, useEffect } from 'react'
import { Eye, EyeOff, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface EditConnectionDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  connectionName: string
  connectionString: string
  isLoading: boolean
  onSave: (newName: string) => void
  onCancel: () => void
}

export function EditConnectionDialog({
  isOpen,
  onOpenChange,
  connectionName: initialName,
  connectionString,
  isLoading,
  onSave,
  onCancel,
}: EditConnectionDialogProps) {
  const [editingName, setEditingName] = useState(initialName)
  const [showConnectionString, setShowConnectionString] = useState(false)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  // Reset state when dialog opens with new connection
  useEffect(() => {
    if (isOpen) {
      setEditingName(initialName)
      setShowConnectionString(false)
      setCopiedToClipboard(false)
    }
  }, [isOpen, initialName])

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(connectionString)
    setCopiedToClipboard(true)
    setTimeout(() => setCopiedToClipboard(false), 2000)
  }

  const handleSave = () => {
    if (editingName.trim()) {
      onSave(editingName.trim())
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                value={connectionString}
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
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!editingName.trim() || isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}