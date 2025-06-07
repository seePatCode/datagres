import { useState, useEffect } from 'react'
import { Minus, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TitleBarProps {
  title?: string
}

export function TitleBar({ title = 'Datagres' }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [platform, setPlatform] = useState<string>('darwin')

  useEffect(() => {
    // Detect platform for different window control styles
    setPlatform(navigator.platform.toLowerCase().includes('mac') ? 'darwin' : 'win32')
  }, [])

  const handleMinimize = () => {
    // Note: We'll need to expose these in the preload script
    if (window.electronAPI?.minimize) {
      window.electronAPI.minimize()
    }
  }

  const handleMaximize = () => {
    if (window.electronAPI?.maximize) {
      window.electronAPI.maximize()
      setIsMaximized(!isMaximized)
    }
  }

  const handleClose = () => {
    if (window.electronAPI?.close) {
      window.electronAPI.close()
    }
  }

  // macOS style traffic lights
  if (platform === 'darwin') {
    return (
      <div className="h-8 bg-background border-b border-border flex items-center justify-between px-3 select-none">
        {/* Left side - Traffic lights */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleClose}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            aria-label="Close"
          />
          <button
            onClick={handleMinimize}
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
            aria-label="Minimize"
          />
          <button
            onClick={handleMaximize}
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
            aria-label="Maximize"
          />
        </div>

        {/* Center - Title (draggable area) */}
        <div 
          className="flex-1 text-center text-sm font-medium text-foreground cursor-default"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          {title}
        </div>

        {/* Right side - Empty for balance */}
        <div className="w-[62px]" />
      </div>
    )
  }

  // Windows/Linux style controls
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