import { useState, useEffect } from 'react'
import type { TableTab, TableInfo } from '@shared/types'

interface UseTabsOptions {
  onTabChange?: (tabId: string) => void
}

export function useTabs(options: UseTabsOptions = {}) {
  const [tabs, setTabs] = useState<TableTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [recentTables, setRecentTables] = useState<TableInfo[]>([])

  // Debug logging for tab state
  useEffect(() => {
    console.log('[Tab State Changed] tabs:', tabs)
    console.log('[Tab State Changed] activeTabId:', activeTabId)
  }, [tabs, activeTabId])

  const handleTableSelect = (tableName: string) => {
    console.log('[handleTableSelect] Selected table:', tableName)
    console.log('[handleTableSelect] Current tabs:', tabs)
    console.log('[handleTableSelect] Current activeTabId:', activeTabId)
    
    // Check if table is already open in a tab
    const existingTab = tabs.find(tab => tab.tableName === tableName)
    
    if (existingTab) {
      console.log('[handleTableSelect] Found existing tab:', existingTab)
      // Switch to existing tab
      setActiveTabId(existingTab.id)
      options.onTabChange?.(existingTab.id)
    } else {
      // Create new tab
      const newTab: TableTab = {
        id: `${tableName}_${Date.now()}`,
        tableName,
        searchTerm: '',
        page: 1,
        pageSize: 100
      }
      console.log('[handleTableSelect] Creating new tab:', newTab)
      setTabs(prev => {
        const newTabs = [...prev, newTab]
        console.log('[handleTableSelect] New tabs array:', newTabs)
        return newTabs
      })
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
  }

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
  }
}