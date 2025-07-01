import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { AISettings, AIProvider } from '@shared/types'

// This will replace ThemeProvider and SqlSettingsContext
export interface SettingsState {
  theme: 'dark' | 'light' | 'system'
  sqlLivePreview: boolean
  ai: AISettings
}

// Load initial state from localStorage to match current behavior
const loadInitialState = (): SettingsState => {
  // Check if we're in browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    const theme = (localStorage.getItem('datagres-ui-theme') as 'dark' | 'light' | 'system') || 'dark'
    const sqlLivePreview = localStorage.getItem('sql-live-preview') === 'true'
    
    // Load AI settings
    const savedAISettings = localStorage.getItem('datagres-ai-settings')
    let ai: AISettings = {
      provider: 'ollama',
      ollamaConfig: {
        model: 'qwen2.5-coder:latest',
        url: 'http://localhost:11434'
      },
      claudeCodeConfig: {}
    }
    
    if (savedAISettings) {
      try {
        ai = JSON.parse(savedAISettings)
        console.log('Loaded AI settings from localStorage:', ai)
      } catch (e) {
        console.error('Failed to parse AI settings:', e)
      }
    }
    
    return {
      theme,
      sqlLivePreview,
      ai,
    }
  }
  
  // Default state for tests or non-browser environments
  return {
    theme: 'dark',
    sqlLivePreview: false,
    ai: {
      provider: 'ollama',
      ollamaConfig: {
        model: 'qwen2.5-coder:latest',
        url: 'http://localhost:11434'
      },
      claudeCodeConfig: {}
    }
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
    setAIProvider: (state, action: PayloadAction<AIProvider>) => {
      state.ai.provider = action.payload
      // Persist to localStorage
      localStorage.setItem('datagres-ai-settings', JSON.stringify(state.ai))
    },
    setAISettings: (state, action: PayloadAction<AISettings>) => {
      state.ai = action.payload
      // Persist to localStorage
      localStorage.setItem('datagres-ai-settings', JSON.stringify(state.ai))
    },
  },
})

export const { setTheme, setSqlLivePreview, setAIProvider, setAISettings } = settingsSlice.actions

// Selectors
export const selectTheme = (state: RootState) => state.settings.theme
export const selectSqlLivePreview = (state: RootState) => state.settings.sqlLivePreview
export const selectAISettings = (state: RootState) => state.settings.ai
export const selectAIProvider = (state: RootState) => state.settings.ai.provider

export default settingsSlice.reducer