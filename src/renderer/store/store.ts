// @ts-nocheck
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import settingsReducer from './slices/settingsSlice'
import uiReducer, { setHydrated } from './slices/uiSlice'
import connectionReducer, { hydrateConnectionState } from './slices/connectionSlice'
import tabsReducer, { hydrateTabsState } from './slices/tabsSlice'
import { persistenceMiddleware, loadPersistedState } from './middleware/persistence'

// Create store without preloaded state first
export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    ui: uiReducer,
    connection: connectionReducer,
    tabs: tabsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(persistenceMiddleware as any),
})

// Load persisted state asynchronously and hydrate the store
loadPersistedState().then(persistedState => {
  console.log('[Store] Hydrating store with persisted state')
  
  // Hydrate tabs state if available
  if (persistedState.tabs) {
    console.log('[Store] Hydrating tabs state')
    store.dispatch(hydrateTabsState(persistedState.tabs))
  }
  
  // Hydrate connection state if available
  if (persistedState.connection) {
    console.log('[Store] Hydrating connection state:', persistedState.connection)
    store.dispatch(hydrateConnectionState(persistedState.connection))
  }
  
  // Mark store as hydrated
  console.log('[Store] Marking store as hydrated')
  store.dispatch(setHydrated())
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