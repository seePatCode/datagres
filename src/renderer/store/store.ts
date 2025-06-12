import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import settingsReducer from './slices/settingsSlice'
import uiReducer from './slices/uiSlice'
import { persistenceMiddleware, loadPersistedState } from './middleware/persistence'

// Load persisted state
const preloadedState = loadPersistedState()

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    ui: uiReducer,
  },
  preloadedState,
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