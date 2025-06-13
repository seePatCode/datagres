import { useSelector, useDispatch } from 'react-redux'
import { useCallback, useEffect, useRef } from 'react'
import {
  addTab,
  removeTab,
  updateTab,
  setActiveTab,
  selectOrAddTableTab,
  addQueryTab,
  closeAllTabs,
  closeOtherTabs,
  clearConnectionTabs,
  hydrateTabsState,
  cleanupOldTabStates,
  selectTabs,
  selectActiveTabId,
  selectActiveTab,
  selectRecentTables,
} from '@/store/slices/tabsSlice'
import type { AppDispatch } from '@/store/store'
import type { TableTab, QueryTab } from '@shared/types'

interface UseTabsOptions {
  onTabChange?: (tabId: string) => void
  connectionString?: string
}

export function useTabs(options: UseTabsOptions = {}) {
  const dispatch = useDispatch<AppDispatch>()
  const { connectionString = '', onTabChange } = options
  
  // Get state from Redux
  const tabs = useSelector(selectTabs(connectionString))
  const activeTabId = useSelector(selectActiveTabId(connectionString))
  const recentTables = useSelector(selectRecentTables(connectionString))
  
  // Track the previous connection string
  const prevConnectionRef = useRef(connectionString)
  const isInitialMount = useRef(true)
  
  // Handle connection string changes
  useEffect(() => {
    if (!connectionString) return
    
    // If connection string changed, clear tabs for the old connection
    if (prevConnectionRef.current && prevConnectionRef.current !== connectionString) {
      // The new connection's tabs will be loaded from persisted state automatically
      prevConnectionRef.current = connectionString
    }
  }, [connectionString])
  
  // Set initial mount flag
  useEffect(() => {
    isInitialMount.current = false
  }, [])
  
  // Clean up old tab states periodically
  useEffect(() => {
    const cleanupKey = 'datagres-tab-cleanup-last-run'
    const lastCleanup = localStorage.getItem(cleanupKey)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
    
    if (!lastCleanup || parseInt(lastCleanup) < oneDayAgo) {
      dispatch(cleanupOldTabStates())
      localStorage.setItem(cleanupKey, Date.now().toString())
    }
  }, [dispatch])
  
  // Actions
  const handleTableSelect = useCallback((tableName: string) => {
    if (!connectionString) return
    
    dispatch(selectOrAddTableTab({ connectionString, tableName }))
    
    // Get the active tab ID after the action
    const state = (window as any).__REDUX_STORE__.getState()
    const newActiveTabId = state.tabs.activeTabId[connectionString]
    if (newActiveTabId) {
      onTabChange?.(newActiveTabId)
    }
  }, [connectionString, dispatch, onTabChange])
  
  const handleCloseTab = useCallback((tabId: string) => {
    if (!connectionString) return
    
    dispatch(removeTab({ connectionString, tabId }))
  }, [connectionString, dispatch])
  
  const handleCloseAllTabs = useCallback(() => {
    if (!connectionString) return
    
    dispatch(closeAllTabs({ connectionString }))
  }, [connectionString, dispatch])
  
  const handleCloseOtherTabs = useCallback((tabId: string) => {
    if (!connectionString) return
    
    dispatch(closeOtherTabs({ connectionString, tabId }))
  }, [connectionString, dispatch])
  
  const resetTabs = useCallback(() => {
    if (!connectionString) return
    
    dispatch(clearConnectionTabs(connectionString))
  }, [connectionString, dispatch])
  
  const getActiveTab = useCallback(() => {
    return tabs.find(tab => tab.id === activeTabId) || null
  }, [tabs, activeTabId])
  
  const setActiveTabId = useCallback((tabId: string) => {
    if (!connectionString || tabId === activeTabId) return
    
    dispatch(setActiveTab({ connectionString, tabId }))
    onTabChange?.(tabId)
  }, [connectionString, activeTabId, dispatch, onTabChange])
  
  const handleNewQueryTab = useCallback(() => {
    if (!connectionString) return
    
    dispatch(addQueryTab({ connectionString }))
    
    // Get the new tab ID after the action
    const state = (window as any).__REDUX_STORE__.getState()
    const newActiveTabId = state.tabs.activeTabId[connectionString]
    if (newActiveTabId) {
      onTabChange?.(newActiveTabId)
    }
  }, [connectionString, dispatch, onTabChange])
  
  const updateQueryTab = useCallback((tabId: string, updates: Partial<QueryTab>) => {
    if (!connectionString) return
    
    dispatch(updateTab({ connectionString, tabId, updates }))
  }, [connectionString, dispatch])
  
  const updateTableTab = useCallback((tabId: string, updates: Partial<TableTab>) => {
    if (!connectionString) return
    
    // Include pagination updates
    const tabUpdates = {
      ...updates,
      // Ensure we maintain the extended properties
      ...(updates as any)
    }
    
    dispatch(updateTab({ connectionString, tabId, updates: tabUpdates }))
  }, [connectionString, dispatch])
  
  return {
    // State
    tabs,
    activeTabId,
    recentTables,
    
    // Actions
    setActiveTabId,
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