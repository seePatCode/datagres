import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Info, Cloud, Terminal } from 'lucide-react'

interface AwsSsmWizardProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (connectionString: string) => void
}

type WizardStep = 'container' | 'command' | 'connecting'

export function AwsSsmWizard({ isOpen, onClose, onConnect }: AwsSsmWizardProps) {
  const [step, setStep] = useState<WizardStep>('container')
  const [containerId, setContainerId] = useState('')
  const [psqlCommand, setPsqlCommand] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = () => {
    if (step === 'container' && containerId.trim()) {
      setError(null)
      setStep('command')
    }
  }

  const handleConnect = async () => {
    if (!psqlCommand.trim()) return

    setIsConnecting(true)
    setError(null)
    setStep('connecting')

    try {
      // Parse the psql command to extract connection details
      const result = await window.electronAPI.setupAwsSsmTunnel({
        containerId: containerId.trim(),
        psqlCommand: psqlCommand.trim()
      })

      if (result.success && result.connectionString) {
        onConnect(result.connectionString)
        handleClose()
      } else {
        setError(result.error || 'Failed to establish SSM tunnel')
        setStep('command')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setStep('command')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleClose = () => {
    setStep('container')
    setContainerId('')
    setPsqlCommand('')
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === 'container' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Connect via AWS SSM - Step 1
              </DialogTitle>
              <DialogDescription>
                Enter the ECS container ID you normally connect to
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="container-id">Container ID</Label>
                <Input
                  id="container-id"
                  placeholder="i-1234567890abcdef0 or ecs-task-id"
                  value={containerId}
                  onChange={(e) => setContainerId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                />
                <p className="text-xs text-muted-foreground">
                  💡 This is the container you normally SSM into
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!containerId.trim()}
              >
                Next
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'command' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Connect via AWS SSM - Step 2
              </DialogTitle>
              <DialogDescription>
                What database command do you run inside the container?
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="psql-command">Database Command</Label>
                <Input
                  id="psql-command"
                  placeholder="psql -h prod-db.region.rds.amazonaws.com -U myuser -d mydb"
                  value={psqlCommand}
                  onChange={(e) => setPsqlCommand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Just paste the exact command you normally use
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setStep('container')}
              >
                Back
              </Button>
              <Button 
                onClick={handleConnect} 
                disabled={!psqlCommand.trim() || isConnecting}
              >
                Connect
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'connecting' && (
          <>
            <DialogHeader>
              <DialogTitle>Establishing SSM Tunnel</DialogTitle>
            </DialogHeader>
            
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground text-center">
                Setting up secure connection through AWS SSM...
              </p>
              <div className="text-xs text-muted-foreground space-y-1 text-center">
                <p>1. Connecting to container {containerId}</p>
                <p>2. Establishing port forward</p>
                <p>3. Configuring local connection</p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}