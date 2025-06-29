// @ts-nocheck
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import settingsReducer from './slices/settingsSlice'
import uiReducer from './slices/uiSlice'
import connectionReducer from './slices/connectionSlice'
import tabsReducer from './slices/tabsSlice'
import { persistenceMiddleware, loadPersistedState } from './middleware/persistence'

// Load persisted state
const preloadedState = loadPersistedState()

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    ui: uiReducer,
    connection: connectionReducer,
    tabs: tabsReducer,
  },
  preloadedState: preloadedState as any,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(persistenceMiddleware as any),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch)

// Expose store for debugging and special cases
if (typeof window !== 'undefined') {
  (window as any).__REDUX_STORE__ = store
}