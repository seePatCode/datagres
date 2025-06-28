import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

interface DemoCalloutProps {
  message: string
  isVisible: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export function DemoCallout({ message, isVisible, position = 'top-right' }: DemoCalloutProps) {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          className={`absolute ${positionClasses[position]} z-50`}
        >
          <div className="bg-gradient-to-r from-violet-600 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            <span className="text-sm font-medium">{message}</span>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-violet-600 rotate-45" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface DemoTimerProps {
  startTime: number | null
  isRunning: boolean
}

export function DemoTimer({ startTime, isRunning }: DemoTimerProps) {
  const [elapsed, setElapsed] = useState(0)
  
  useEffect(() => {
    if (!isRunning || !startTime) return
    
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 100)
    
    return () => clearInterval(interval)
  }, [isRunning, startTime])
  
  if (!isRunning) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-gray-900/90 backdrop-blur border border-gray-800 px-6 py-3 rounded-full">
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-white">
            {elapsed}s
          </div>
          <div className="text-xs text-gray-400">Time to browse</div>
        </div>
      </div>
    </motion.div>
  )
}

import { useState, useEffect } from 'react'