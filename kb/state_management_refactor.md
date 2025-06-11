# State Management Refactoring Plan

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

## Options for Improvement

### Option 1: Redux-Style Global Store
**Approach**: Implement Redux or Zustand for centralized state management

**Pros:**
- Single source of truth
- Predictable state updates via actions
- Time-travel debugging
- Well-established patterns

**Cons:**
- Additional complexity and boilerplate
- Another state management system alongside TanStack Query
- Need to sync between Redux and server state
- Overkill for our app's complexity

### Option 2: Lift All State to App Component
**Approach**: Move all state to the top-level App component and pass down as props

**Pros:**
- Simple to understand
- No additional libraries
- Clear data flow

**Cons:**
- Massive prop drilling
- App component becomes bloated
- Still need callbacks for updates
- Doesn't solve the fundamental callback issue

### Option 3: TanStack Query for All State Management (Recommended)
**Approach**: Use TanStack Query not just for server state, but for all application state

**Pros:**
- Already in the codebase - no new dependencies
- Unified approach for all state (server + UI)
- Built-in optimistic updates
- Excellent DevTools
- Mutations provide event-like semantics
- Query invalidation provides reactive updates
- Natural caching and persistence

**Cons:**
- Unconventional use of TanStack Query
- Team needs to understand the pattern
- May seem like over-engineering initially

## Why TanStack Query for All State

### 1. **We Already Have It**
- No new dependencies or learning curve
- Team already familiar with queries and mutations
- Consistent patterns throughout the app

### 2. **Electron Apps Are Different**
- In Electron, "client state" is persisted to disk (electron-store)
- The disk IS our backend for UI state
- TanStack Query's caching model maps perfectly to this

### 3. **Solves Our Core Problems**
- **No callbacks**: Components fire mutations instead
- **No prop drilling**: Components subscribe to query keys
- **No loops**: Unidirectional data flow via mutations
- **No duplication**: Query cache is the single source of truth

### 4. **Event-Driven Architecture**
- Mutations act as commands/events
- Query invalidation acts as event propagation
- Natural command pattern implementation

## Implementation Plan

### Phase 1: Infrastructure Setup

#### 1.1 Create State Management Layer
```typescript
// src/renderer/state/queries.ts
export const queryKeys = {
  tabs: (connectionString: string) => ['tabs', connectionString],
  appState: () => ['app-state'],
  tableState: (tableId: string) => ['table-state', tableId],
}

// src/renderer/state/mutations.ts
export const mutations = {
  updateTab: () => {...},
  closeTab: () => {...},
  updateTableSearch: () => {...},
}
```

#### 1.2 Enhance IPC Layer for State Persistence
```typescript
// main/handlers/stateHandlers.js
ipcMain.handle('state:load', async (event, key) => {
  return store.get(key)
})

ipcMain.handle('state:save', async (event, key, value) => {
  store.set(key, value)
  return value
})

ipcMain.handle('state:delete', async (event, key) => {
  store.delete(key)
})
```

### Phase 2: Refactor Tab State

#### 2.1 Remove useTabs Hook
- Delete the existing `useTabs` hook
- Remove all localStorage calls
- Remove all callbacks and state updates

#### 2.2 Create Tab State Query
```typescript
// hooks/useTabsQuery.ts
export function useTabsQuery(connectionString: string) {
  return useQuery({
    queryKey: queryKeys.tabs(connectionString),
    queryFn: () => window.electronAPI.state.load(`tabs:${connectionString}`),
    staleTime: Infinity,
  })
}
```

#### 2.3 Create Tab Mutations
```typescript
// hooks/useTabMutations.ts
export function useUpdateTabMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ connectionString, tabId, updates }) => {
      const tabs = await window.electronAPI.state.load(`tabs:${connectionString}`)
      const updated = tabs.map(tab => 
        tab.id === tabId ? { ...tab, ...updates } : tab
      )
      return window.electronAPI.state.save(`tabs:${connectionString}`, updated)
    },
    onSuccess: (data, { connectionString }) => {
      queryClient.invalidateQueries(queryKeys.tabs(connectionString))
    }
  })
}
```

### Phase 3: Refactor Components

#### 3.1 TableView Component
- Remove all callbacks (onSearchChange, onPageChange, etc.)
- Remove local state that duplicates tab state
- Use mutations for all updates

```typescript
function TableView({ tabId, tableName, connectionString }) {
  const { data: tab } = useTabQuery(tabId)
  const updateTab = useUpdateTabMutation()
  
  const handleSearchChange = (searchTerm: string) => {
    updateTab.mutate({ connectionString, tabId, updates: { searchTerm } })
  }
  
  // No props for state, no callbacks
  return <SQLWhereEditor value={tab?.searchTerm} onChange={handleSearchChange} />
}
```

#### 3.2 ExplorerView Component
- Remove all state management props
- Remove update callbacks
- Simply render based on query data

#### 3.3 App Component
- Remove all tab state management
- Remove all callbacks
- Focus only on routing between views

### Phase 4: Testing Strategy

#### 4.1 Unit Tests
```typescript
// state/__tests__/tabMutations.test.ts
describe('Tab Mutations', () => {
  it('should update tab search term', async () => {
    const { result } = renderHook(() => useUpdateTabMutation())
    
    act(() => {
      result.current.mutate({
        connectionString: 'test',
        tabId: '123',
        updates: { searchTerm: 'WHERE active = true' }
      })
    })
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })
})
```

#### 4.2 Integration Tests
```typescript
// e2e/stateManagement.spec.ts
test('search state persists across app restarts', async () => {
  // Type in search box
  await page.fill('[data-testid=table-search]', 'WHERE id > 100')
  
  // Restart app
  await electronApp.close()
  await electronApp.launch()
  
  // Verify search is restored
  expect(await page.inputValue('[data-testid=table-search]')).toBe('WHERE id > 100')
})
```

#### 4.3 Component Tests
- Test that components fire mutations correctly
- Test optimistic updates
- Test error handling

### Phase 5: Migration Checklist

- [ ] Create state management infrastructure
- [ ] Add IPC handlers for state persistence
- [ ] Create query keys and mutation factories
- [ ] Refactor useTabs to use TanStack Query
- [ ] Update TableView to use mutations
- [ ] Update ExplorerView to remove callbacks
- [ ] Update App to remove state management
- [ ] Remove all useEffect state syncing
- [ ] Add comprehensive tests
- [ ] Update TypeScript types
- [ ] Test app restart persistence
- [ ] Test connection switching
- [ ] Performance testing

### Phase 6: Cleanup

- [ ] Remove old localStorage code
- [ ] Remove unused callbacks and props
- [ ] Remove useMenuActions memory leak fix (redesign it properly)
- [ ] Update documentation
- [ ] Add developer guide for new patterns

## Success Criteria

1. **No infinite loops** - App remains responsive during all interactions
2. **Clean component code** - No callbacks, minimal props
3. **Predictable state updates** - All changes go through mutations
4. **DevTools visibility** - All state visible in React Query DevTools
5. **Performance** - No unnecessary re-renders
6. **Persistence** - State survives app restarts
7. **Developer experience** - Easy to add new features

## Risks and Mitigations

### Risk 1: Team Confusion
**Mitigation**: Create clear documentation and examples

### Risk 2: Performance Issues
**Mitigation**: Use React Query's built-in optimization features (select, structural sharing)

### Risk 3: Complex Debugging
**Mitigation**: Leverage React Query DevTools, add comprehensive logging

## Timeline Estimate

- Phase 1-2: 2 days (Infrastructure and tab state)
- Phase 3: 2 days (Component refactoring)
- Phase 4: 1 day (Testing)
- Phase 5-6: 1 day (Migration and cleanup)

Total: ~6 days of development

## Next Steps

1. Review and approve this plan
2. Create feature branch `refactor/tanstack-state-management`
3. Begin with Phase 1 infrastructure
4. Incremental PRs for each phase