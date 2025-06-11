import { useState, useEffect, useRef } from 'react'
import type { Tab, TableTab, QueryTab, TableInfo } from '@shared/types'

const TAB_STATE_KEY = 'datagres-tab-state'
const RECENT_TABLES_KEY = 'datagres-recent-tables'

interface TabState {
  tabs: Tab[]
  activeTabId: string | null
  recentTables: TableInfo[]
  savedAt: number
}

interface UseTabsOptions {
  onTabChange?: (tabId: string) => void
  connectionString?: string // To associate tabs with connections
}

export function useTabs(options: UseTabsOptions = {}) {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [recentTables, setRecentTables] = useState<TableInfo[]>([])
  const [hasRestoredState, setHasRestoredState] = useState(false)
  const isInitialMount = useRef(true)

  // Load persisted state on mount
  useEffect(() => {
    if (!options.connectionString || hasRestoredState) return
    
    try {
      const savedStateJson = localStorage.getItem(`${TAB_STATE_KEY}-${options.connectionString}`)
      if (savedStateJson) {
        const savedState: TabState = JSON.parse(savedStateJson)
        
        // Only restore if saved within last 7 days
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        if (savedState.savedAt > sevenDaysAgo) {
          setTabs(savedState.tabs)
          setActiveTabId(savedState.activeTabId)
          setRecentTables(savedState.recentTables)
        }
      }
      
      // Also load recent tables (global, not per connection)
      const savedRecentTables = localStorage.getItem(RECENT_TABLES_KEY)
      if (savedRecentTables) {
        setRecentTables(JSON.parse(savedRecentTables))
      }
    } catch (error) {
      console.error('Failed to restore tab state:', error)
    }
    
    setHasRestoredState(true)
  }, [options.connectionString])

  // Save state whenever it changes (after initial mount and restore)
  useEffect(() => {
    // Skip if no connection string or haven't restored yet
    if (!options.connectionString || !hasRestoredState) {
      return
    }
    
    // Use a small delay to batch rapid changes
    const timeoutId = setTimeout(() => {
      const stateToSave: TabState = {
        tabs,
        activeTabId,
        recentTables,
        savedAt: Date.now()
      }
      
      try {
        localStorage.setItem(`${TAB_STATE_KEY}-${options.connectionString}`, JSON.stringify(stateToSave))
        localStorage.setItem(RECENT_TABLES_KEY, JSON.stringify(recentTables))
      } catch (error) {
        console.error('Failed to save tab state:', error)
      }
    }, 500) // 500ms delay to batch changes
    
    return () => clearTimeout(timeoutId)
  }, [tabs, activeTabId, recentTables, options.connectionString, hasRestoredState])

  const handleTableSelect = (tableName: string) => {
    // Check if table is already open in a tab
    const existingTab = tabs.find(tab => tab.type === 'table' && tab.tableName === tableName)
    
    if (existingTab) {
      // Switch to existing tab
      setActiveTabId(existingTab.id)
      options.onTabChange?.(existingTab.id)
    } else {
      // Create new tab
      const newTab: TableTab = {
        id: `${tableName}_${Date.now()}`,
        type: 'table',
        tableName,
        searchTerm: '',
        page: 1,
        pageSize: 100
      }
      setTabs(prev => [...prev, newTab])
      setActiveTabId(newTab.id)
      options.onTabChange?.(newTab.id)
    }
    
    // Add to recent tables
    setRecentTables(prev => {
      const filtered = prev.filter(t => t.name !== tableName)
      return [{ name: tableName }, ...filtered].slice(0, 5) // Keep last 5
    })
  }
  
  const handleCloseTab = (tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId)
      // If closing active tab, switch to another tab or null
      if (activeTabId === tabId) {
        const newActiveTab = newTabs[newTabs.length - 1]
        setActiveTabId(newActiveTab?.id || null)
      }
      return newTabs
    })
  }

  const handleCloseAllTabs = () => {
    setTabs([])
    setActiveTabId(null)
  }

  const handleCloseOtherTabs = (tabId: string) => {
    setTabs(prev => prev.filter(tab => tab.id === tabId))
    setActiveTabId(tabId)
  }

  const resetTabs = () => {
    setTabs([])
    setActiveTabId(null)
    setRecentTables([])
    
    // Also clear persisted state for this connection
    if (options.connectionString) {
      try {
        localStorage.removeItem(`${TAB_STATE_KEY}-${options.connectionString}`)
      } catch (error) {
        console.error('Failed to clear tab state:', error)
      }
    }
  }
  
  // Clean up old tab states on mount (once per session)
  useEffect(() => {
    try {
      const cleanupKey = 'datagres-tab-cleanup-last-run'
      const lastCleanup = localStorage.getItem(cleanupKey)
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
      
      if (!lastCleanup || parseInt(lastCleanup) < oneDayAgo) {
        // Clean up tab states older than 7 days
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        const keys = Object.keys(localStorage)
        
        keys.forEach(key => {
          if (key.startsWith(TAB_STATE_KEY)) {
            try {
              const state = JSON.parse(localStorage.getItem(key) || '{}')
              if (state.savedAt && state.savedAt < sevenDaysAgo) {
                localStorage.removeItem(key)
              }
            } catch {
              // Invalid state, remove it
              localStorage.removeItem(key)
            }
          }
        })
        
        localStorage.setItem(cleanupKey, Date.now().toString())
      }
    } catch (error) {
      console.error('Failed to clean up old tab states:', error)
    }
  }, [])

  const getActiveTab = () => {
    return tabs.find(tab => tab.id === activeTabId)
  }

  // Wrapper for setActiveTabId to track changes
  const handleSetActiveTabId = (tabId: string) => {
    if (tabId !== activeTabId) {
      setActiveTabId(tabId)
      options.onTabChange?.(tabId)
    }
  }


  const handleNewQueryTab = () => {
    const newTab: QueryTab = {
      id: `query_${Date.now()}`,
      type: 'query',
      title: 'New Query',
      query: '',
      isSaved: false
    }
    
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    options.onTabChange?.(newTab.id)
  }

  const updateQueryTab = (tabId: string, updates: Partial<QueryTab>) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId && tab.type === 'query' 
        ? { ...tab, ...updates } 
        : tab
    ))
  }
  
  const updateTableTab = (tabId: string, updates: Partial<TableTab>) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId && tab.type === 'table' 
        ? { ...tab, ...updates } 
        : tab
    ))
  }

  return {
    // State
    tabs,
    activeTabId,
    recentTables,
    
    // Actions
    setActiveTabId: handleSetActiveTabId,
    handleTableSelect,
    handleCloseTab,
    handleCloseAllTabs,
    handleCloseOtherTabs,
    resetTabs,
    getActiveTab,
    handleNewQueryTab,
    updateQueryTab,
    updateTableTab,
  }
}