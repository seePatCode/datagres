import { Middleware, AnyAction, isAction } from '@reduxjs/toolkit'
import type { StoreState } from '../types'

// Keys to persist
const PERSISTED_KEYS = ['settings', 'tabs', 'connection'] as const

// Middleware to persist state changes
export const persistenceMiddleware: Middleware<{}, StoreState> = (store) => (next) => (action) => {
  const result = next(action)
  
  // Check if it's a Redux action
  if (isAction(action)) {
    // Only persist for specific slices
    const actionPrefix = action.type.split('/')[0]
    if (PERSISTED_KEYS.includes(actionPrefix as any)) {
      const state = store.getState() as StoreState
      
      // Special handling for tabs state - use electron-store
      if (actionPrefix === 'tabs' && window.electronAPI?.setTabsState) {
        window.electronAPI.setTabsState(state.tabs).catch((error: any) => {
          console.error('Failed to persist tabs state:', error)
        })
      } else {
        // Save other state to localStorage
        try {
          localStorage.setItem(`redux-${actionPrefix}`, JSON.stringify(state[actionPrefix as keyof StoreState]))
        } catch (error) {
          // Silently fail - persistence is not critical
        }
      }
    }
    
    // Update menu when theme changes
    if (action.type === 'settings/setTheme' && window.electronAPI?.updateTheme) {
      window.electronAPI.updateTheme((action as AnyAction).payload)
    }
  }
  
  return result
}

// Helper to load persisted state
export const loadPersistedState = async (): Promise<Partial<StoreState>> => {
  const persistedState: Partial<StoreState> = {}
  
  // Load tabs state from electron-store
  if (window.electronAPI?.getTabsState) {
    try {
      const result = await window.electronAPI.getTabsState()
      if (result.success && result.state) {
        persistedState.tabs = result.state
      }
    } catch (error) {
      console.error('Failed to load tabs state:', error)
    }
  }
  
  // Load other state from localStorage
  PERSISTED_KEYS.forEach(key => {
    if (key !== 'tabs') {  // Skip tabs as we loaded it from electron-store
      try {
        const item = localStorage.getItem(`redux-${key}`)
        if (item) {
          persistedState[key as keyof StoreState] = JSON.parse(item)
        }
      } catch (error) {
        // Silently fail - will use default state
      }
    }
  })
  
  return persistedState
}