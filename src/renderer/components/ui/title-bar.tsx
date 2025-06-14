import { useState, useEffect } from 'react'
import { Minus, Square, X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TitleBarProps {
  title?: string
  onNavigateBack?: () => void
  onNavigateForward?: () => void
  canGoBack?: boolean
  canGoForward?: boolean
  onShowHelp?: () => void
}

export function TitleBar({ 
  title = 'Datagres',
  onNavigateBack,
  onNavigateForward,
  canGoBack = false,
  canGoForward = false,
  onShowHelp
}: TitleBarProps) {
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
        {/* Left side - Traffic lights space + Navigation */}
        <div className="flex items-center">
          {/* Space for traffic lights */}
          <div className="w-[70px]" />
          
          {/* Navigation buttons */}
          <div className="flex items-center gap-1 px-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 w-6 p-0 rounded-sm",
                !canGoBack && "opacity-50 cursor-not-allowed"
              )}
              onClick={onNavigateBack}
              disabled={!canGoBack}
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              title="Go back (⌘[)"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 w-6 p-0 rounded-sm",
                !canGoForward && "opacity-50 cursor-not-allowed"
              )}
              onClick={onNavigateForward}
              disabled={!canGoForward}
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              title="Go forward (⌘])"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Center - Title */}
        <div 
          className="flex-1 text-sm font-medium text-foreground cursor-default text-center"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          {title}
        </div>
        
        {/* Right side - Help button */}
        <div className="flex items-center pr-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-sm"
            onClick={onShowHelp}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Keyboard shortcuts (⌘/)"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Windows/Linux: Custom window controls
  return (
    <div className="h-8 bg-background border-b border-border flex items-center justify-between select-none">
      {/* Left side - Navigation buttons */}
      <div className="flex items-center">
        <div className="flex items-center gap-1 px-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 p-0 rounded-sm",
              !canGoBack && "opacity-50 cursor-not-allowed"
            )}
            onClick={onNavigateBack}
            disabled={!canGoBack}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Go back (Ctrl+[)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 p-0 rounded-sm",
              !canGoForward && "opacity-50 cursor-not-allowed"
            )}
            onClick={onNavigateForward}
            disabled={!canGoForward}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Go forward (Ctrl+])"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Title (draggable area) */}
        <div 
          className="px-3 text-sm font-medium text-foreground cursor-default"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          {title}
        </div>
      </div>

      {/* Right side - Help button and window controls */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 mr-2 rounded-sm"
          onClick={onShowHelp}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title="Keyboard shortcuts (Ctrl+/)"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
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
    </div>
  )
}