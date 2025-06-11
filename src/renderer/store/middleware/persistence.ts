import { Middleware } from '@reduxjs/toolkit'
import type { RootState } from '../store'

// Keys to persist
const PERSISTED_KEYS = ['settings'] as const

// Middleware to persist state changes
export const persistenceMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action)
  
  // Only persist for specific slices
  const actionPrefix = action.type.split('/')[0]
  if (PERSISTED_KEYS.includes(actionPrefix as any)) {
    const state = store.getState()
    
    // Save to localStorage for now (will move to electron-store later)
    try {
      localStorage.setItem(`redux-${actionPrefix}`, JSON.stringify(state[actionPrefix as keyof RootState]))
    } catch (error) {
      console.error(`Failed to persist ${actionPrefix}:`, error)
    }
  }
  
  return result
}

// Helper to load persisted state
export const loadPersistedState = () => {
  const persistedState: Partial<RootState> = {}
  
  PERSISTED_KEYS.forEach(key => {
    try {
      const item = localStorage.getItem(`redux-${key}`)
      if (item) {
        persistedState[key as keyof RootState] = JSON.parse(item)
      }
    } catch (error) {
      console.error(`Failed to load ${key}:`, error)
    }
  })
  
  return persistedState
}