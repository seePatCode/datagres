import { useState, useEffect } from 'react'
import { Minus, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TitleBarProps {
  title?: string
}

export function TitleBar({ title = 'Datagres' }: TitleBarProps) {
  const [isMacOS, setIsMacOS] = useState(false)

  useEffect(() => {
    // Detect macOS
    setIsMacOS(navigator.platform.toLowerCase().includes('mac'))
  }, [])

  const handleMinimize = () => {
    if (window.electronAPI?.minimize) {
      window.electronAPI.minimize()
    }
  }

  const handleMaximize = () => {
    if (window.electronAPI?.maximize) {
      window.electronAPI.maximize()
    }
  }

  const handleClose = () => {
    if (window.electronAPI?.close) {
      window.electronAPI.close()
    }
  }

  if (isMacOS) {
    // macOS: Title bar with padding for native traffic lights
    return (
      <div className="h-8 bg-background border-b border-border flex items-center select-none">
        {/* Title with left padding for traffic lights */}
        <div 
          className="flex-1 pl-20 pr-3 text-sm font-medium text-foreground cursor-default text-center"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          {title}
        </div>
      </div>
    )
  }

  // Windows/Linux: Custom window controls
  return (
    <div className="h-8 bg-background border-b border-border flex items-center justify-between select-none">
      {/* Left side - Title (draggable area) */}
      <div 
        className="flex-1 px-3 text-sm font-medium text-foreground cursor-default"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {title}
      </div>

      {/* Right side - Window controls */}
      <div className="flex">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-12 rounded-none hover:bg-muted"
          onClick={handleMinimize}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-12 rounded-none hover:bg-muted"
          onClick={handleMaximize}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-12 rounded-none hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleClose}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}