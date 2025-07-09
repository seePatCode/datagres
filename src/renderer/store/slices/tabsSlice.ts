import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { Tab, TableTab, QueryTab, TableInfo } from '@shared/types'

// Extended types for internal state (includes pagination)
interface TableTabInternal extends TableTab {
  page: number
  pageSize: number
}

interface QueryTabInternal extends QueryTab {
  // Additional query tab state can go here
}

type TabInternal = TableTabInternal | QueryTabInternal

export interface TabsState {
  // Tabs keyed by connection string
  tabs: Record<string, TabInternal[]>
  // Active tab ID per connection
  activeTabId: Record<string, string | null>
  // Recent tables per connection
  recentTables: Record<string, TableInfo[]>
  // Starred tables per connection
  starredTables: Record<string, TableInfo[]>
  // Track last save time for cleanup
  lastSaved: Record<string, number>
}

const initialState: TabsState = {
  tabs: {},
  activeTabId: {},
  recentTables: {},
  starredTables: {},
  lastSaved: {},
}

export const tabsSlice = createSlice({
  name: 'tabs',
  initialState,
  reducers: {
    // Add a new tab
    addTab: (state, action: PayloadAction<{
      connectionString: string
      tab: Tab
    }>) => {
      const { connectionString, tab } = action.payload
      
      // Initialize connection data if needed
      if (!state.tabs[connectionString]) {
        state.tabs[connectionString] = []
        state.activeTabId[connectionString] = null
        state.recentTables[connectionString] = []
        state.starredTables[connectionString] = []
      }
      
      // Add pagination defaults for table tabs
      const tabWithDefaults: TabInternal = tab.type === 'table'
        ? { ...tab, page: 1, pageSize: 100 } as TableTabInternal
        : tab as QueryTabInternal
      
      state.tabs[connectionString].push(tabWithDefaults)
      state.activeTabId[connectionString] = tab.id
      state.lastSaved[connectionString] = Date.now()
    },
    
    // Remove a tab
    removeTab: (state, action: PayloadAction<{
      connectionString: string
      tabId: string
    }>) => {
      const { connectionString, tabId } = action.payload
      
      if (state.tabs[connectionString]) {
        state.tabs[connectionString] = state.tabs[connectionString].filter(t => t.id !== tabId)
        
        // Update active tab if needed
        if (state.activeTabId[connectionString] === tabId) {
          const remainingTabs = state.tabs[connectionString]
          state.activeTabId[connectionString] = remainingTabs[remainingTabs.length - 1]?.id || null
        }
        
        state.lastSaved[connectionString] = Date.now()
      }
    },
    
    // Update a tab
    updateTab: (state, action: PayloadAction<{
      connectionString: string
      tabId: string
      updates: Partial<TabInternal>
    }>) => {
      const { connectionString, tabId, updates } = action.payload
      const tabs = state.tabs[connectionString]
      
      if (tabs) {
        const tabIndex = tabs.findIndex(t => t.id === tabId)
        if (tabIndex !== -1) {
          state.tabs[connectionString][tabIndex] = {
            ...tabs[tabIndex],
            ...updates,
          } as TabInternal
          state.lastSaved[connectionString] = Date.now()
        }
      }
    },
    
    // Set active tab
    setActiveTab: (state, action: PayloadAction<{
      connectionString: string
      tabId: string | null
    }>) => {
      const { connectionString, tabId } = action.payload
      if (!state.activeTabId[connectionString]) {
        state.activeTabId[connectionString] = null
      }
      state.activeTabId[connectionString] = tabId
      state.lastSaved[connectionString] = Date.now()
    },
    
    // Add or select existing table tab
    selectOrAddTableTab: (state, action: PayloadAction<{
      connectionString: string
      tableName: string
    }>) => {
      const { connectionString, tableName } = action.payload
      
      // Initialize if needed
      if (!state.tabs[connectionString]) {
        state.tabs[connectionString] = []
        state.activeTabId[connectionString] = null
        state.recentTables[connectionString] = []
        state.starredTables[connectionString] = []
      }
      
      // Check if table tab already exists
      const existingTab = state.tabs[connectionString].find(
        tab => tab.type === 'table' && tab.tableName === tableName
      )
      
      if (existingTab) {
        // Switch to existing tab
        state.activeTabId[connectionString] = existingTab.id
      } else {
        // Create new tab
        const newTab: TableTabInternal = {
          id: `${tableName}_${Date.now()}`,
          type: 'table',
          tableName,
          searchTerm: '',
          page: 1,
          pageSize: 100
        }
        state.tabs[connectionString].push(newTab)
        state.activeTabId[connectionString] = newTab.id
      }
      
      // Update recent tables
      const recent = state.recentTables[connectionString] || []
      const filtered = recent.filter(t => t.name !== tableName)
      state.recentTables[connectionString] = [
        { name: tableName },
        ...filtered
      ].slice(0, 5)
      
      state.lastSaved[connectionString] = Date.now()
    },
    
    // Add new query tab
    addQueryTab: (state, action: PayloadAction<{
      connectionString: string
      initialQuery?: string
    }>) => {
      const { connectionString, initialQuery } = action.payload
      
      // Initialize if needed
      if (!state.tabs[connectionString]) {
        state.tabs[connectionString] = []
        state.activeTabId[connectionString] = null
        state.recentTables[connectionString] = []
        state.starredTables[connectionString] = []
      }
      
      const newTab: QueryTabInternal = {
        id: `query_${Date.now()}`,
        type: 'query',
        title: initialQuery ? 'AI Query' : 'Scratchpad',
        query: typeof initialQuery === 'string' ? initialQuery : '',
        isSaved: false
      }
      
      state.tabs[connectionString].push(newTab)
      state.activeTabId[connectionString] = newTab.id
      state.lastSaved[connectionString] = Date.now()
    },
    
    // Close all tabs
    closeAllTabs: (state, action: PayloadAction<{
      connectionString: string
    }>) => {
      const { connectionString } = action.payload
      if (state.tabs[connectionString]) {
        state.tabs[connectionString] = []
        state.activeTabId[connectionString] = null
        state.lastSaved[connectionString] = Date.now()
      }
    },
    
    // Close other tabs
    closeOtherTabs: (state, action: PayloadAction<{
      connectionString: string
      tabId: string
    }>) => {
      const { connectionString, tabId } = action.payload
      if (state.tabs[connectionString]) {
        state.tabs[connectionString] = state.tabs[connectionString].filter(t => t.id === tabId)
        state.activeTabId[connectionString] = tabId
        state.lastSaved[connectionString] = Date.now()
      }
    },
    
    // Clear tabs for a connection
    clearConnectionTabs: (state, action: PayloadAction<string>) => {
      const connectionString = action.payload
      delete state.tabs[connectionString]
      delete state.activeTabId[connectionString]
      delete state.recentTables[connectionString]
      delete state.starredTables[connectionString]
      delete state.lastSaved[connectionString]
    },
    
    // Toggle star status for a table
    toggleTableStar: (state, action: PayloadAction<{
      connectionString: string
      tableName: string
    }>) => {
      const { connectionString, tableName } = action.payload
      
      // Initialize if needed
      if (!state.starredTables) {
        state.starredTables = {}
      }
      if (!state.starredTables[connectionString]) {
        state.starredTables[connectionString] = []
      }
      
      const starred = state.starredTables[connectionString]
      const index = starred.findIndex(t => t.name === tableName)
      
      if (index === -1) {
        // Add to starred
        state.starredTables[connectionString].push({ name: tableName })
      } else {
        // Remove from starred
        state.starredTables[connectionString].splice(index, 1)
      }
      
      state.lastSaved[connectionString] = Date.now()
    },
    
    // Hydrate state from persistence
    hydrateTabsState: (state, action: PayloadAction<Partial<TabsState>>) => {
      const newState = action.payload
      
      // Only hydrate data that's less than 7 days old
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      Object.keys(newState.lastSaved || {}).forEach(connectionString => {
        const lastSaved = newState.lastSaved![connectionString]
        if (lastSaved > sevenDaysAgo) {
          // Restore this connection's data
          if (newState.tabs?.[connectionString]) {
            state.tabs[connectionString] = newState.tabs[connectionString]
          }
          if (newState.activeTabId?.[connectionString] !== undefined) {
            state.activeTabId[connectionString] = newState.activeTabId[connectionString]
          }
          if (newState.recentTables?.[connectionString]) {
            state.recentTables[connectionString] = newState.recentTables[connectionString]
          }
          if (newState.starredTables?.[connectionString]) {
            if (!state.starredTables) {
              state.starredTables = {}
            }
            state.starredTables[connectionString] = newState.starredTables[connectionString]
          }
          state.lastSaved[connectionString] = lastSaved
        }
      })
    },
    
    // Clean up old tab states
    cleanupOldTabStates: (state) => {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      Object.keys(state.lastSaved).forEach(connectionString => {
        if (state.lastSaved[connectionString] < sevenDaysAgo) {
          delete state.tabs[connectionString]
          delete state.activeTabId[connectionString]
          delete state.recentTables[connectionString]
          delete state.starredTables[connectionString]
          delete state.lastSaved[connectionString]
        }
      })
    },
  },
})

export const {
  addTab,
  removeTab,
  updateTab,
  setActiveTab,
  selectOrAddTableTab,
  addQueryTab,
  closeAllTabs,
  closeOtherTabs,
  clearConnectionTabs,
  toggleTableStar,
  hydrateTabsState,
  cleanupOldTabStates,
} = tabsSlice.actions

// Selectors
export const selectTabs = (connectionString: string) => (state: RootState) => 
  state.tabs.tabs[connectionString] || []

export const selectActiveTabId = (connectionString: string) => (state: RootState) =>
  state.tabs.activeTabId[connectionString] || null

export const selectActiveTab = (connectionString: string) => (state: RootState) => {
  const tabs = state.tabs.tabs[connectionString] || []
  const activeId = state.tabs.activeTabId[connectionString]
  return tabs.find(tab => tab.id === activeId) || null
}

export const selectRecentTables = (connectionString: string) => (state: RootState) =>
  state.tabs.recentTables[connectionString] || []

export const selectStarredTables = (connectionString: string) => (state: RootState) =>
  state.tabs.starredTables?.[connectionString] || []

export const isTableStarred = (connectionString: string, tableName: string) => (state: RootState) => {
  const starred = state.tabs.starredTables?.[connectionString] || []
  return starred.some(t => t.name === tableName)
}

export default tabsSlice.reducer