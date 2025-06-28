import { motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { useState } from 'react'

export function LaunchBanner() {
  const [isVisible, setIsVisible] = useState(true)
  
  if (!isVisible) return null
  
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="relative bg-gradient-to-r from-violet-600 to-blue-600 text-white"
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-center text-sm md:text-base">
        <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
        <span className="font-medium">
          Launch Week Special: Free forever* • 
          <a href="https://github.com/seepatcode/datagres/releases" className="underline ml-1 hover:no-underline">
            Download now
          </a>
          <span className="text-xs ml-2 opacity-80">(*it's always free 😉)</span>
        </span>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Close banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}