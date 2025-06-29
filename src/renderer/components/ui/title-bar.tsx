import { useState, useEffect } from 'react'
import { Minus, Square, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import '@/styles/title-bar.css'

interface TitleBarProps {
  title?: string
  onNavigateBack?: () => void
  onNavigateForward?: () => void
  canGoBack?: boolean
  canGoForward?: boolean
}

export function TitleBar({ 
  title = 'Datagres',
  onNavigateBack,
  onNavigateForward,
  canGoBack = false,
  canGoForward = false
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
      <div 
        className="title-bar macos h-8 bg-background border-b border-border flex items-center select-none"
      >
        {/* Left side - Traffic lights space + Navigation */}
        <div className="flex items-center no-drag">
          {/* Space for traffic lights */}
          <div className="w-[70px]" />
          
          {/* Navigation buttons */}
          <div className="flex items-center gap-1 px-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 w-6 p-0 rounded-sm title-bar-button",
                !canGoBack && "opacity-50 cursor-not-allowed"
              )}
              onClick={onNavigateBack}
              disabled={!canGoBack}
              title="Go back (⌘[)"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 w-6 p-0 rounded-sm title-bar-button",
                !canGoForward && "opacity-50 cursor-not-allowed"
              )}
              onClick={onNavigateForward}
              disabled={!canGoForward}
              title="Go forward (⌘])"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Center - Title (draggable area) */}
        <div className="flex-1 text-sm font-medium text-foreground text-center pr-[70px]">
          {title}
        </div>
      </div>
    )
  }

  // Windows/Linux: Custom window controls
  return (
    <div 
      className="title-bar windows h-8 bg-background border-b border-border flex items-center justify-between select-none"
    >
      {/* Left side - Navigation buttons */}
      <div className="flex items-center no-drag">
        <div className="flex items-center gap-1 px-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 p-0 rounded-sm title-bar-button",
              !canGoBack && "opacity-50 cursor-not-allowed"
            )}
            onClick={onNavigateBack}
            disabled={!canGoBack}
            title="Go back (Ctrl+[)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 p-0 rounded-sm title-bar-button",
              !canGoForward && "opacity-50 cursor-not-allowed"
            )}
            onClick={onNavigateForward}
            disabled={!canGoForward}
            title="Go forward (Ctrl+])"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Center - Title (draggable area) */}
      <div className="flex-1 text-sm font-medium text-foreground text-center px-3">
        {title}
      </div>

      {/* Right side - Window controls */}
      <div className="flex items-center no-drag">
        <div className="flex">
          <Button
          variant="ghost"
          size="sm"
          className="h-8 w-12 rounded-none hover:bg-muted title-bar-button"
          onClick={handleMinimize}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-12 rounded-none hover:bg-muted title-bar-button"
          onClick={handleMaximize}
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-12 rounded-none hover:bg-destructive hover:text-destructive-foreground title-bar-button"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
        </div>
      </div>
    </div>
  )
}