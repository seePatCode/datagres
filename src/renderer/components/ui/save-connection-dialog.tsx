import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SaveConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => void
  defaultName?: string
}

export function SaveConnectionDialog({ 
  open, 
  onOpenChange, 
  onSave,
  defaultName = ''
}: SaveConnectionDialogProps) {
  const [connectionName, setConnectionName] = useState(defaultName)
  
  const handleSave = () => {
    if (connectionName.trim()) {
      onSave(connectionName.trim())
      setConnectionName('')
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && connectionName.trim()) {
      handleSave()
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Connection</DialogTitle>
          <DialogDescription>
            Give this database connection a name to save it for future use.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="col-span-3"
              placeholder="e.g. Production DB"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!connectionName.trim()}
          >
            Save Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}