import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, Download, RefreshCw } from 'lucide-react'

interface UpdateProgress {
  bytesPerSecond: number
  percent: number
  transferred: number
  total: number
}

export function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!window.electronAPI?.onUpdateEvent) {
      return
    }
    
    const cleanup = window.electronAPI.onUpdateEvent((channel: string, data: any) => {
      switch (channel) {
        case 'update-checking':
          setUpdateStatus('checking')
          // Don't show the toast for checking - too annoying
          setShow(false)
          break
        case 'update-available':
          setUpdateStatus('available')
          setUpdateInfo(data)
          setShow(true) // Always show when update is available
          break
        case 'update-not-available':
          setUpdateStatus('not-available')
          // Don't show anything when no update is available
          setShow(false)
          break
        case 'update-error':
          setUpdateStatus('error')
          setUpdateInfo(data)
          // Don't show error toasts for automatic checks
          setShow(false)
          break
        case 'update-download-progress':
          setUpdateStatus('downloading')
          setDownloadProgress(data)
          break
        case 'update-downloaded':
          setUpdateStatus('downloaded')
          setUpdateInfo(data)
          break
      }
    })

    return cleanup
  }, [])

  const handleInstall = async () => {
    if (window.electronAPI?.installUpdate) {
      await window.electronAPI.installUpdate()
    }
  }

  const handleDismiss = () => {
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <Alert className="relative border bg-background">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        {updateStatus === 'available' && (
          <AlertDescription className="pr-8">
            <div className="flex items-center gap-2 mb-2">
              <Download className="h-4 w-4" />
              New version available: {updateInfo?.version}
            </div>
            <p className="text-sm text-muted-foreground">
              The update will be downloaded in the background.
            </p>
          </AlertDescription>
        )}

        {updateStatus === 'downloading' && downloadProgress && (
          <AlertDescription className="pr-8">
            <div className="flex items-center gap-2 mb-2">
              <Download className="h-4 w-4 animate-pulse" />
              Downloading update... {downloadProgress.percent.toFixed(0)}%
            </div>
            <Progress value={downloadProgress.percent} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              {(downloadProgress.bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s
            </p>
          </AlertDescription>
        )}

        {updateStatus === 'downloaded' && (
          <AlertDescription className="pr-8">
            <div className="flex items-center gap-2 mb-3">
              <Download className="h-4 w-4 text-green-500" />
              Update ready to install!
            </div>
            <Button onClick={handleInstall} size="sm" className="w-full">
              Restart and Install Update
            </Button>
          </AlertDescription>
        )}

      </Alert>
    </div>
  )
}