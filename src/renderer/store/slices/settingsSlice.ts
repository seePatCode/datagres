import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'

// This will replace ThemeProvider and SqlSettingsContext
export interface SettingsState {
  theme: 'dark' | 'light' | 'system'
  sqlLivePreview: boolean
}

// Load initial state from localStorage to match current behavior
const loadInitialState = (): SettingsState => {
  // Check if we're in browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    const theme = (localStorage.getItem('datagres-ui-theme') as 'dark' | 'light' | 'system') || 'dark'
    const sqlLivePreview = localStorage.getItem('sql-live-preview') === 'true'
    
    return {
      theme,
      sqlLivePreview,
    }
  }
  
  // Default state for tests or non-browser environments
  return {
    theme: 'dark',
    sqlLivePreview: false,
  }
}

const initialState: SettingsState = loadInitialState()

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<SettingsState['theme']>) => {
      state.theme = action.payload
      // Persist to localStorage to maintain compatibility
      localStorage.setItem('datagres-ui-theme', action.payload)
      
      // Apply theme to document immediately (only in browser environment)
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        
        if (action.payload === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          root.classList.add(systemTheme)
        } else {
          root.classList.add(action.payload)
        }
      }
    },
    setSqlLivePreview: (state, action: PayloadAction<boolean>) => {
      state.sqlLivePreview = action.payload
      // Persist to localStorage to maintain compatibility
      localStorage.setItem('sql-live-preview', String(action.payload))
    },
  },
})

export const { setTheme, setSqlLivePreview } = settingsSlice.actions

// Selectors
export const selectTheme = (state: RootState) => state.settings.theme
export const selectSqlLivePreview = (state: RootState) => state.settings.sqlLivePreview

export default settingsSlice.reducer