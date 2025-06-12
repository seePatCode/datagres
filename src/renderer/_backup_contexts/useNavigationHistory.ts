import { useState, useCallback, useRef } from 'react'

interface NavigationEntry {
  type: 'view' | 'tab'
  viewName?: string
  tabId?: string
  timestamp: number
}

interface UseNavigationHistoryOptions {
  maxHistorySize?: number
}

export function useNavigationHistory(options: UseNavigationHistoryOptions = {}) {
  const { maxHistorySize = 50 } = options
  
  // Use ref to maintain history across renders without causing re-renders
  const historyRef = useRef<NavigationEntry[]>([])
  const currentIndexRef = useRef<number>(-1)
  
  // State to trigger re-renders when navigation occurs
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  
  const updateNavigationState = useCallback(() => {
    setCanGoBack(currentIndexRef.current > 0)
    setCanGoForward(currentIndexRef.current < historyRef.current.length - 1)
  }, [])
  
  const pushEntry = useCallback((entry: Omit<NavigationEntry, 'timestamp'>) => {
    const newEntry: NavigationEntry = {
      ...entry,
      timestamp: Date.now()
    }
    
    // If we're not at the end of history, remove everything after current position
    if (currentIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1)
    }
    
    // Add new entry
    historyRef.current.push(newEntry)
    
    // Limit history size
    if (historyRef.current.length > maxHistorySize) {
      historyRef.current = historyRef.current.slice(-maxHistorySize)
      currentIndexRef.current = historyRef.current.length - 1
    } else {
      currentIndexRef.current++
    }
    
    updateNavigationState()
  }, [maxHistorySize, updateNavigationState])
  
  const goBack = useCallback(() => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--
      updateNavigationState()
      return historyRef.current[currentIndexRef.current]
    }
    return null
  }, [updateNavigationState])
  
  const goForward = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++
      updateNavigationState()
      return historyRef.current[currentIndexRef.current]
    }
    return null
  }, [updateNavigationState])
  
  const getCurrentEntry = useCallback(() => {
    return historyRef.current[currentIndexRef.current] || null
  }, [])
  
  const getHistory = useCallback(() => {
    return {
      entries: [...historyRef.current],
      currentIndex: currentIndexRef.current
    }
  }, [])
  
  return {
    pushEntry,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    getCurrentEntry,
    getHistory
  }
}