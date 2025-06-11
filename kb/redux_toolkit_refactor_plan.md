# Redux Toolkit State Management Refactoring Plan

## Problem Statement

The current state management architecture is causing significant issues:

### 1. **Infinite Update Loops**
- Bidirectional data flow between parent and child components
- `useEffect` hooks triggering cascading updates
- Search input causing "Maximum update depth exceeded" errors
- Child components updating parent state, which updates child props, creating cycles

### 2. **Callback Hell**
- Deep prop drilling of callbacks through multiple component layers
- Each state update requires a callback prop (onSearchChange, onPageChange, etc.)
- Difficult to trace data flow through the application
- Adding new state requires threading callbacks through entire component tree

### 3. **State Duplication**
- Same state tracked in multiple places (useTabs hook, TableView local state, localStorage)
- Synchronization issues between different state stores
- Race conditions when multiple components update the same state

### 4. **Memory Leaks**
- Event listeners not properly cleaned up (menu actions)
- Multiple listeners registered for the same events
- MaxListenersExceededWarning in console

### 5. **Poor Developer Experience**
- Hard to debug state changes
- Unclear data flow
- Difficult to add new features without breaking existing functionality

## Why Redux Toolkit?

### LLM Compatibility
- **Massive training data**: Redux has been the React standard since 2015
- **Well-documented patterns**: Thousands of tutorials, Stack Overflow answers
- **Electron-specific examples**: Libraries like `electron-redux` have clear patterns
- **TypeScript support**: Extensive examples with proper typing

### Technical Benefits
- **Redux Toolkit (RTK)** reduces boilerplate by 75% compared to classic Redux
- **RTK Query** provides TanStack Query-like features for async state
- **Redux DevTools** for time-travel debugging
- **Predictable state updates** via actions and reducers
- **Middleware support** for persistence, logging, etc.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Components    │────▶│   Redux Store    │────▶│ Electron Store  │
│                 │     │                  │     │  (Persistence)  │
│ - Dispatch      │     │ - Tab State      │     │                 │
│   Actions       │     │ - UI State       │     │ - Auto-save     │
│ - Use Selectors │◀────│ - App State      │◀────│ - Load on init  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌──────────────────┐
                        │  RTK Query       │
                        │                  │
                        │ - Table Data     │
                        │ - Schemas        │
                        │ - Connections    │
                        └──────────────────┘
```

## Implementation Plan

### Phase 1: Setup Redux Toolkit Infrastructure

#### 1.1 Install Dependencies
```bash
pnpm add @reduxjs/toolkit react-redux
pnpm add -D @types/react-redux
```

#### 1.2 Create Store Configuration
```typescript
// src/renderer/store/store.ts
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { tabsReducer } from './slices/tabsSlice'
import { uiReducer } from './slices/uiSlice'
import { databaseApi } from './api/databaseApi'
import { persistenceMiddleware } from './middleware/persistence'

export const store = configureStore({
  reducer: {
    tabs: tabsReducer,
    ui: uiReducer,
    [databaseApi.reducerPath]: databaseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths for persistence
        ignoredPaths: ['register', 'rehydrate'],
      },
    })
    .concat(databaseApi.middleware)
    .concat(persistenceMiddleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

setupListeners(store.dispatch)
```

#### 1.3 Create Persistence Middleware
```typescript
// src/renderer/store/middleware/persistence.ts
import { Middleware } from '@reduxjs/toolkit'

export const persistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action)
  
  // Persist specific slices after actions
  if (action.type.startsWith('tabs/') || action.type.startsWith('ui/')) {
    const state = store.getState()
    window.electronAPI.saveState({
      tabs: state.tabs,
      ui: state.ui,
    })
  }
  
  return result
}
```

### Phase 2: Create Redux Slices

#### 2.1 Tabs Slice
```typescript
// src/renderer/store/slices/tabsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Tab, TableTab, QueryTab } from '@shared/types'

interface TabsState {
  tabs: Record<string, Tab[]> // Keyed by connectionString
  activeTabId: string | null
  recentTables: Record<string, string[]> // Keyed by connectionString
}

const initialState: TabsState = {
  tabs: {},
  activeTabId: null,
  recentTables: {},
}

export const tabsSlice = createSlice({
  name: 'tabs',
  initialState,
  reducers: {
    // Tab management
    addTab: (state, action: PayloadAction<{ connectionString: string; tab: Tab }>) => {
      const { connectionString, tab } = action.payload
      if (!state.tabs[connectionString]) {
        state.tabs[connectionString] = []
      }
      state.tabs[connectionString].push(tab)
      state.activeTabId = tab.id
    },
    
    removeTab: (state, action: PayloadAction<{ connectionString: string; tabId: string }>) => {
      const { connectionString, tabId } = action.payload
      if (state.tabs[connectionString]) {
        state.tabs[connectionString] = state.tabs[connectionString].filter(t => t.id !== tabId)
        if (state.activeTabId === tabId) {
          const remainingTabs = state.tabs[connectionString]
          state.activeTabId = remainingTabs[remainingTabs.length - 1]?.id || null
        }
      }
    },
    
    updateTab: (state, action: PayloadAction<{ 
      connectionString: string; 
      tabId: string; 
      updates: Partial<Tab> 
    }>) => {
      const { connectionString, tabId, updates } = action.payload
      const tabs = state.tabs[connectionString]
      if (tabs) {
        const tabIndex = tabs.findIndex(t => t.id === tabId)
        if (tabIndex !== -1) {
          state.tabs[connectionString][tabIndex] = {
            ...tabs[tabIndex],
            ...updates,
          }
        }
      }
    },
    
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTabId = action.payload
    },
    
    // Recent tables
    addRecentTable: (state, action: PayloadAction<{ 
      connectionString: string; 
      tableName: string 
    }>) => {
      const { connectionString, tableName } = action.payload
      if (!state.recentTables[connectionString]) {
        state.recentTables[connectionString] = []
      }
      const recent = state.recentTables[connectionString]
      const filtered = recent.filter(t => t !== tableName)
      state.recentTables[connectionString] = [tableName, ...filtered].slice(0, 5)
    },
    
    // Bulk operations
    clearTabs: (state, action: PayloadAction<string>) => {
      const connectionString = action.payload
      state.tabs[connectionString] = []
      state.activeTabId = null
    },
    
    // Hydration from persistence
    hydrateState: (state, action: PayloadAction<TabsState>) => {
      return action.payload
    },
  },
})

export const { 
  addTab, 
  removeTab, 
  updateTab, 
  setActiveTab,
  addRecentTable,
  clearTabs,
  hydrateState,
} = tabsSlice.actions

export const tabsReducer = tabsSlice.reducer

// Selectors
export const selectTabs = (state: RootState, connectionString: string) => 
  state.tabs.tabs[connectionString] || []

export const selectActiveTab = (state: RootState) => state.tabs.activeTabId

export const selectRecentTables = (state: RootState, connectionString: string) =>
  state.tabs.recentTables[connectionString] || []
```

#### 2.2 UI Slice
```typescript
// src/renderer/store/slices/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  sidebarWidth: number
  currentView: 'connect' | 'explorer'
  showSaveDialog: boolean
  pendingConnectionString: string
}

const initialState: UIState = {
  sidebarWidth: 25,
  currentView: 'connect',
  showSaveDialog: false,
  pendingConnectionString: '',
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebarWidth = action.payload
    },
    setCurrentView: (state, action: PayloadAction<UIState['currentView']>) => {
      state.currentView = action.payload
    },
    setShowSaveDialog: (state, action: PayloadAction<boolean>) => {
      state.showSaveDialog = action.payload
    },
    setPendingConnectionString: (state, action: PayloadAction<string>) => {
      state.pendingConnectionString = action.payload
    },
  },
})

export const { 
  setSidebarWidth, 
  setCurrentView, 
  setShowSaveDialog,
  setPendingConnectionString,
} = uiSlice.actions

export const uiReducer = uiSlice.reducer
```

### Phase 3: Create RTK Query API

#### 3.1 Database API Slice
```typescript
// src/renderer/store/api/databaseApi.ts
import { createApi } from '@reduxjs/toolkit/query/react'

export const databaseApi = createApi({
  reducerPath: 'databaseApi',
  baseQuery: async (args) => {
    // Custom base query that uses IPC
    try {
      const result = await window.electronAPI[args.method](...args.params)
      return { data: result }
    } catch (error) {
      return { error: { message: error.message } }
    }
  },
  tagTypes: ['Tables', 'TableData', 'Schema', 'Connections'],
  endpoints: (builder) => ({
    // Table data
    getTableData: builder.query({
      query: ({ connectionString, tableName, options }) => ({
        method: 'fetchTableData',
        params: [connectionString, tableName, options],
      }),
      providesTags: ['TableData'],
    }),
    
    // Table schema
    getTableSchema: builder.query({
      query: ({ connectionString, tableName }) => ({
        method: 'fetchTableSchema',
        params: [connectionString, tableName],
      }),
      providesTags: ['Schema'],
    }),
    
    // Update table data
    updateTableData: builder.mutation({
      query: ({ connectionString, request }) => ({
        method: 'updateTableData',
        params: [connectionString, request],
      }),
      invalidatesTags: ['TableData'],
    }),
  }),
})

export const {
  useGetTableDataQuery,
  useGetTableSchemaQuery,
  useUpdateTableDataMutation,
} = databaseApi
```

### Phase 4: Refactor Components

#### 4.1 Setup Provider in App
```typescript
// src/renderer/main.tsx
import { Provider } from 'react-redux'
import { store } from './store/store'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
)
```

#### 4.2 Refactor TableView Component
```typescript
// src/renderer/components/ui/table-view.tsx
import { useSelector, useDispatch } from 'react-redux'
import { updateTab } from '@/store/slices/tabsSlice'
import { useGetTableDataQuery, useGetTableSchemaQuery } from '@/store/api/databaseApi'

interface TableViewProps {
  tabId: string
  tableName: string
  connectionString: string
}

export function TableView({ tabId, tableName, connectionString }: TableViewProps) {
  const dispatch = useDispatch()
  
  // Get tab state from Redux
  const tab = useSelector(state => 
    selectTabs(state, connectionString).find(t => t.id === tabId)
  )
  
  // Use RTK Query for data fetching
  const { data: tableData, isLoading } = useGetTableDataQuery({
    connectionString,
    tableName,
    options: {
      searchTerm: tab?.searchTerm,
      page: tab?.page,
      pageSize: tab?.pageSize,
    }
  })
  
  const { data: schema } = useGetTableSchemaQuery({ connectionString, tableName })
  
  // Dispatch actions instead of callbacks
  const handleSearchChange = (searchTerm: string) => {
    dispatch(updateTab({ connectionString, tabId, updates: { searchTerm } }))
  }
  
  const handlePageChange = (page: number) => {
    dispatch(updateTab({ connectionString, tabId, updates: { page } }))
  }
  
  // Clean component with no prop drilling
  return (
    <div>
      <SQLWhereEditor
        value={tab?.searchTerm || ''}
        onChange={handleSearchChange}
        schema={schema}
      />
      {/* Rest of component */}
    </div>
  )
}
```

#### 4.3 Refactor App Component
```typescript
// src/renderer/App.tsx
import { useSelector, useDispatch } from 'react-redux'
import { setCurrentView } from '@/store/slices/uiSlice'

function App() {
  const dispatch = useDispatch()
  const currentView = useSelector(state => state.ui.currentView)
  
  // No state management, just dispatching actions
  return currentView === 'explorer' ? <ExplorerView /> : <ConnectionView />
}
```

### Phase 5: Persistence Integration

#### 5.1 IPC Handlers for State
```javascript
// main/index.js
const Store = require('electron-store')
const store = new Store()

ipcMain.handle('save-state', async (event, state) => {
  store.set('appState', state)
  return true
})

ipcMain.handle('load-state', async () => {
  return store.get('appState', null)
})
```

#### 5.2 Hydrate Store on App Start
```typescript
// src/renderer/store/store.ts
// Load persisted state on startup
window.electronAPI.loadState().then((persistedState) => {
  if (persistedState) {
    store.dispatch(hydrateState(persistedState.tabs))
    // Hydrate other slices...
  }
})
```

### Phase 6: Testing Strategy

#### 6.1 Redux Slice Tests
```typescript
// store/slices/__tests__/tabsSlice.test.ts
import { tabsReducer, addTab, updateTab } from '../tabsSlice'

describe('tabsSlice', () => {
  it('should add a new tab', () => {
    const initialState = { tabs: {}, activeTabId: null, recentTables: {} }
    
    const newTab = {
      id: 'tab1',
      type: 'table' as const,
      tableName: 'users',
      searchTerm: '',
      page: 1,
      pageSize: 100,
    }
    
    const state = tabsReducer(
      initialState, 
      addTab({ connectionString: 'test', tab: newTab })
    )
    
    expect(state.tabs.test).toHaveLength(1)
    expect(state.activeTabId).toBe('tab1')
  })
})
```

#### 6.2 Integration Tests
```typescript
// e2e/redux-state.spec.ts
test('Redux state persists across restarts', async () => {
  // Open a table
  await page.click('[data-testid=table-users]')
  
  // Type in search
  await page.fill('[data-testid=search-input]', 'active = true')
  
  // Restart app
  await electronApp.restart()
  
  // Verify state restored
  expect(await page.inputValue('[data-testid=search-input]')).toBe('active = true')
})
```

## Migration Checklist

- [ ] Install Redux Toolkit and React-Redux
- [ ] Create store configuration
- [ ] Create tabs slice with actions and reducers
- [ ] Create UI slice for app-level state
- [ ] Set up RTK Query for async operations
- [ ] Create persistence middleware
- [ ] Add IPC handlers for state persistence
- [ ] Wrap app with Redux Provider
- [ ] Refactor TableView to use Redux
- [ ] Refactor ExplorerView to use Redux
- [ ] Remove useTabs hook
- [ ] Remove all callback props
- [ ] Remove useEffect state syncing
- [ ] Add comprehensive tests
- [ ] Set up Redux DevTools
- [ ] Document Redux patterns for team

## Benefits Over Current Architecture

1. **No Infinite Loops**: Unidirectional data flow via actions
2. **No Callbacks**: Components dispatch actions instead
3. **No Prop Drilling**: Components connect directly to store
4. **Better DevTools**: Redux DevTools for debugging
5. **LLM Friendly**: Massive documentation and examples
6. **Type Safety**: Excellent TypeScript support
7. **Predictable**: Clear action → reducer → state flow
8. **Testable**: Easy to test reducers and selectors

## Timeline Estimate

- Day 1: Redux setup and infrastructure
- Day 2: Create slices and RTK Query setup
- Day 3: Refactor major components
- Day 4: Persistence and testing
- Day 5: Cleanup and documentation

Total: 5 days

## Success Criteria

1. **All state in Redux**: No component-level state management
2. **Clean components**: No callbacks or prop drilling
3. **Full persistence**: State survives app restarts
4. **Redux DevTools working**: Can inspect all state changes
5. **All tests passing**: Unit and integration tests
6. **Performance maintained**: No degradation vs current

## Next Steps

1. Get team buy-in on Redux Toolkit approach
2. Create feature branch `refactor/redux-toolkit`
3. Install dependencies and set up store
4. Begin incremental migration starting with tabs state