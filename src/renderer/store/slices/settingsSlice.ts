import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { AISettings, AIProvider } from '@shared/types'

// This will replace ThemeProvider and SqlSettingsContext
export interface SettingsState {
  theme: 'dark' | 'light' | 'system'
  sqlLivePreview: boolean
  ai: AISettings
}

// Default initial state - will be replaced by settings from main process
const getDefaultState = (): SettingsState => {
  return {
    theme: 'dark',
    sqlLivePreview: false,
    ai: {
      provider: 'ollama',
      ollamaConfig: {
        model: 'qwen2.5-coder:latest',
        url: 'http://localhost:11434'
      },
      claudeCodeConfig: {
        cliPath: ''
      }
    }
  }
}

const initialState: SettingsState = getDefaultState()

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<SettingsState['theme']>) => {
      state.theme = action.payload
      
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
        
        // Sync to main process
        window.electronAPI.setSetting('theme', action.payload)
      }
    },
    setSqlLivePreview: (state, action: PayloadAction<boolean>) => {
      state.sqlLivePreview = action.payload
      
      // Sync to main process
      if (typeof window !== 'undefined') {
        window.electronAPI.setSetting('sqlLivePreview', action.payload)
      }
    },
    setAIProvider: (state, action: PayloadAction<AIProvider>) => {
      state.ai.provider = action.payload
      
      // Sync to main process - create a plain object to avoid serialization issues
      if (typeof window !== 'undefined') {
        const plainAISettings: AISettings = {
          provider: state.ai.provider,
          ollamaConfig: state.ai.ollamaConfig ? { ...state.ai.ollamaConfig } : undefined,
          claudeCodeConfig: state.ai.claudeCodeConfig ? { ...state.ai.claudeCodeConfig } : undefined
        }
        window.electronAPI.setAISettings(plainAISettings)
      }
    },
    setAISettings: (state, action: PayloadAction<AISettings>) => {
      state.ai = action.payload
      
      // Sync to main process - create a plain object to avoid serialization issues
      if (typeof window !== 'undefined') {
        const plainAISettings: AISettings = {
          provider: action.payload.provider,
          ollamaConfig: action.payload.ollamaConfig ? { ...action.payload.ollamaConfig } : undefined,
          claudeCodeConfig: action.payload.claudeCodeConfig ? { ...action.payload.claudeCodeConfig } : undefined
        }
        window.electronAPI.setAISettings(plainAISettings)
      }
    },
    // Add a new action to load all settings at once
    loadSettings: (state, action: PayloadAction<SettingsState>) => {
      Object.assign(state, action.payload)
      
      // Apply theme immediately
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        
        if (state.theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          root.classList.add(systemTheme)
        } else {
          root.classList.add(state.theme)
        }
      }
    },
  },
})

export const { setTheme, setSqlLivePreview, setAIProvider, setAISettings, loadSettings } = settingsSlice.actions

// Selectors
export const selectTheme = (state: RootState) => state.settings.theme
export const selectSqlLivePreview = (state: RootState) => state.settings.sqlLivePreview
export const selectAISettings = (state: RootState) => state.settings.ai
export const selectAIProvider = (state: RootState) => state.settings.ai.provider

export default settingsSlice.reducer