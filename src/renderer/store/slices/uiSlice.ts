import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { AppView } from '@shared/types'

export interface UIState {
  // Main view state
  currentView: AppView
  
  // Dialog states
  showSaveDialog: boolean
  pendingConnectionString: string
  
  // Navigation state
  navigationHistory: NavigationEntry[]
  navigationIndex: number
  
  // Persistence state
  isHydrated: boolean
}

export interface NavigationEntry {
  type: 'view' | 'tab'
  viewName?: string
  tabId?: string
  timestamp: number
}

const initialState: UIState = {
  currentView: 'connect',
  showSaveDialog: false,
  pendingConnectionString: '',
  navigationHistory: [{ type: 'view', viewName: 'connect', timestamp: Date.now() }],
  navigationIndex: 0,
  isHydrated: false,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCurrentView: (state, action: PayloadAction<AppView>) => {
      state.currentView = action.payload
    },
    
    showSaveConnectionDialog: (state, action: PayloadAction<string>) => {
      state.showSaveDialog = true
      state.pendingConnectionString = action.payload
    },
    
    hideSaveConnectionDialog: (state) => {
      state.showSaveDialog = false
      state.pendingConnectionString = ''
    },
    
    setHydrated: (state) => {
      state.isHydrated = true
    },
    
    // Navigation actions
    pushNavigationEntry: (state, action: PayloadAction<Omit<NavigationEntry, 'timestamp'>>) => {
      // Remove any forward history when pushing new entry
      state.navigationHistory = state.navigationHistory.slice(0, state.navigationIndex + 1)
      
      // Add new entry
      state.navigationHistory.push({
        ...action.payload,
        timestamp: Date.now()
      })
      state.navigationIndex = state.navigationHistory.length - 1
    },
    
    navigateBack: (state) => {
      if (state.navigationIndex > 0) {
        state.navigationIndex--
        const entry = state.navigationHistory[state.navigationIndex]
        if (entry.type === 'view' && entry.viewName) {
          state.currentView = entry.viewName as AppView
        }
      }
    },
    
    navigateForward: (state) => {
      if (state.navigationIndex < state.navigationHistory.length - 1) {
        state.navigationIndex++
        const entry = state.navigationHistory[state.navigationIndex]
        if (entry.type === 'view' && entry.viewName) {
          state.currentView = entry.viewName as AppView
        }
      }
    },
    
    clearNavigationHistory: (state) => {
      state.navigationHistory = [{ type: 'view', viewName: 'connect', timestamp: Date.now() }]
      state.navigationIndex = 0
    }
  },
})

export const {
  setCurrentView,
  showSaveConnectionDialog,
  hideSaveConnectionDialog,
  setHydrated,
  pushNavigationEntry,
  navigateBack,
  navigateForward,
  clearNavigationHistory,
} = uiSlice.actions

// Selectors
export const selectCurrentView = (state: RootState) => state.ui.currentView
export const selectShowSaveDialog = (state: RootState) => state.ui.showSaveDialog
export const selectPendingConnectionString = (state: RootState) => state.ui.pendingConnectionString
export const selectCanGoBack = (state: RootState) => state.ui.navigationIndex > 0
export const selectCanGoForward = (state: RootState) => state.ui.navigationIndex < state.ui.navigationHistory.length - 1
export const selectCurrentNavigationEntry = (state: RootState) => 
  state.ui.navigationHistory[state.ui.navigationIndex]
export const selectIsHydrated = (state: RootState) => state.ui.isHydrated

export default uiSlice.reducer