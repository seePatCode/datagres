import { Middleware, AnyAction, isAction } from '@reduxjs/toolkit'
import type { StoreState } from '../types'

// Keys to persist
const PERSISTED_KEYS = ['settings', 'tabs'] as const

// Middleware to persist state changes
export const persistenceMiddleware: Middleware<{}, StoreState> = (store) => (next) => (action) => {
  const result = next(action)
  
  // Check if it's a Redux action
  if (isAction(action)) {
    // Only persist for specific slices
    const actionPrefix = action.type.split('/')[0]
    if (PERSISTED_KEYS.includes(actionPrefix as any)) {
      const state = store.getState() as StoreState
      
      // Save to localStorage for now (will move to electron-store later)
      try {
        localStorage.setItem(`redux-${actionPrefix}`, JSON.stringify(state[actionPrefix as keyof StoreState]))
      } catch (error) {
        console.error(`Failed to persist ${actionPrefix}:`, error)
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
export const loadPersistedState = (): Partial<StoreState> => {
  const persistedState: Partial<StoreState> = {}
  
  PERSISTED_KEYS.forEach(key => {
    try {
      const item = localStorage.getItem(`redux-${key}`)
      if (item) {
        persistedState[key as keyof StoreState] = JSON.parse(item)
      }
    } catch (error) {
      console.error(`Failed to load ${key}:`, error)
    }
  })
  
  return persistedState
}