import { Middleware, AnyAction, isAction } from '@reduxjs/toolkit'
import type { StoreState } from '../types'

// Keys to persist
const PERSISTED_KEYS = ['settings', 'tabs', 'connection'] as const

// Track if store has been hydrated
let isHydrated = false

// Middleware to persist state changes
export const persistenceMiddleware: Middleware<{}, StoreState> = (store) => (next) => (action) => {
  const result = next(action)
  
  // Mark as hydrated when we receive the setHydrated action
  if (isAction(action) && action.type === 'ui/setHydrated') {
    isHydrated = true
    console.log('[Persistence] Store marked as hydrated, persistence enabled')
  }
  
  // Check if it's a Redux action and store is hydrated
  if (isAction(action) && isHydrated) {
    // Only persist for specific slices
    const actionPrefix = action.type.split('/')[0]
    if (PERSISTED_KEYS.includes(actionPrefix as any)) {
      const state = store.getState() as StoreState
      
      // Special handling for tabs state - use electron-store
      if (actionPrefix === 'tabs' && window.electronAPI?.setTabsState) {
        window.electronAPI.setTabsState(state.tabs).catch((error: any) => {
          console.error('Failed to persist tabs state:', error)
        })
      } else if (actionPrefix === 'connection' && window.electronAPI?.setConnectionState) {
        // Special handling for connection state - use electron-store
        window.electronAPI.setConnectionState(state.connection).catch((error: any) => {
          console.error('Failed to persist connection state:', error)
        })
        console.log(`[Persistence] Saved ${actionPrefix} state to electron-store:`, state.connection)
      } else {
        // Save other state to localStorage
        try {
          const stateData = state[actionPrefix as keyof StoreState]
          localStorage.setItem(`redux-${actionPrefix}`, JSON.stringify(stateData))
          console.log(`[Persistence] Saved ${actionPrefix} state:`, stateData)
        } catch (error) {
          console.error(`[Persistence] Failed to save ${actionPrefix} state:`, error)
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
  console.log('[Persistence] Loading persisted state...')
  
  // Debug: Check what's in localStorage before loading
  console.log('[Persistence] Current localStorage keys:', Object.keys(localStorage))
  console.log('[Persistence] redux-connection value:', localStorage.getItem('redux-connection'))
  
  const persistedState: Partial<StoreState> = {}
  
  // Load tabs state from electron-store
  if (window.electronAPI?.getTabsState) {
    try {
      const result = await window.electronAPI.getTabsState()
      if (result.success && result.state) {
        persistedState.tabs = result.state
        console.log('[Persistence] Loaded tabs state:', result.state)
      }
    } catch (error) {
      console.error('[Persistence] Failed to load tabs state:', error)
    }
  }
  
  // Load connection state from electron-store
  if (window.electronAPI?.getConnectionState) {
    try {
      const result = await window.electronAPI.getConnectionState()
      if (result.success && result.state) {
        persistedState.connection = result.state
        console.log('[Persistence] Loaded connection state from electron-store:', result.state)
      }
    } catch (error) {
      console.error('[Persistence] Failed to load connection state:', error)
    }
  }
  
  // Load other state from localStorage
  PERSISTED_KEYS.forEach(key => {
    if (key !== 'tabs' && key !== 'connection') {  // Skip tabs and connection as we loaded them from electron-store
      try {
        const item = localStorage.getItem(`redux-${key}`)
        if (item) {
          const parsedState = JSON.parse(item)
          persistedState[key as keyof StoreState] = parsedState
          console.log(`[Persistence] Loaded ${key} state from localStorage:`, parsedState)
        } else {
          console.log(`[Persistence] No saved ${key} state found`)
        }
      } catch (error) {
        console.error(`[Persistence] Failed to load ${key} state:`, error)
      }
    }
  })
  
  console.log('[Persistence] Final persisted state:', persistedState)
  return persistedState
}