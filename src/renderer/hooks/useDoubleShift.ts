import { useEffect, useRef } from 'react'

interface UseDoubleShiftOptions {
  onDoubleShift: () => void
  timeout?: number // Time between shifts in milliseconds
}

export function useDoubleShift({ onDoubleShift, timeout = 300 }: UseDoubleShiftOptions) {
  const lastShiftTime = useRef<number>(0)
  const shiftCount = useRef<number>(0)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        const currentTime = Date.now()
        
        // Reset count if too much time has passed
        if (currentTime - lastShiftTime.current > timeout) {
          shiftCount.current = 0
        }
        
        shiftCount.current++
        lastShiftTime.current = currentTime
        
        if (shiftCount.current === 2) {
          shiftCount.current = 0
          onDoubleShift()
        }
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      // Reset on any non-shift key press
      if (event.key !== 'Shift') {
        shiftCount.current = 0
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [onDoubleShift, timeout])
}