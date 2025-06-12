# Redux Phase 4: Connection State Migration Plan (Updated)

## Overview
Migrate connection-related state from local component state and React Query to Redux Toolkit, building on patterns established in Phase 3.

## Lessons Learned from Phase 3
1. **Custom hooks are essential** - The useUI hook pattern worked perfectly for encapsulating Redux logic
2. **Preserve existing APIs** - Components shouldn't need major changes when migrating to Redux
3. **Handle edge cases early** - Missing dependencies and undefined references cause runtime errors
4. **State persistence needs careful handling** - Connection-specific state requires proper scoping
5. **Test incrementally** - Verify each piece works before moving to the next

## Current State Analysis
Currently managed by React Query and local state:
- `connectionMutation` - Active connection status and data
- `savedConnections` - List of saved connections (via React Query)
- `isSwitchingConnection` - UI state for connection switching
- `originalConnectionString` - Preserves exact user input
- Connection test results and error states

## Implementation Plan

### 1. Create Connection Slice (`connectionSlice.ts`)
```typescript
interface ConnectionState {
  // Active connection
  activeConnection: {
    connectionString: string;
    originalConnectionString: string;
    database: string;
    status: 'idle' | 'connecting' | 'connected' | 'error';
    error?: string;
  } | null;
  
  // Saved connections
  savedConnections: SavedConnection[];
  savedConnectionsStatus: 'idle' | 'loading' | 'success' | 'error';
  
  // UI state
  isSwitchingConnection: boolean;
  testConnectionStatus: 'idle' | 'testing' | 'success' | 'error';
  testConnectionError?: string;
}
```

### 2. Create useConnection Hook
Following the useUI pattern:
- Encapsulate all connection logic
- Provide clean API matching current usage
- Handle async operations with createAsyncThunk
- Manage side effects (IPC calls) properly

### 3. Migration Strategy
1. **Start with read operations** - Get saved connections working first
2. **Add connection management** - Connect, disconnect, test
3. **Implement save/update/delete** - CRUD operations for saved connections
4. **Handle edge cases** - Connection switching, error states
5. **Remove React Query gradually** - Keep both working during transition

### 4. Key Considerations
- **Async Operations**: Use createAsyncThunk for all IPC calls
- **Error Handling**: Comprehensive error states for better UX
- **State Persistence**: Active connection should persist across app restarts
- **Security**: Connection strings remain encrypted in electron-store
- **Backward Compatibility**: Ensure existing saved connections still work

### 5. Implementation Order
1. Create connectionSlice.ts with initial state
2. Implement saved connections loading (createAsyncThunk)
3. Create useConnection hook with read operations
4. Update App.tsx to use useConnection for saved connections
5. Implement connection/disconnection logic
6. Add save/update/delete operations
7. Migrate test connection functionality
8. Handle connection switching state
9. Add persistence for active connection
10. Remove React Query dependencies

### 6. Testing Strategy
- Verify each async thunk works correctly
- Test error scenarios (failed connections, network issues)
- Ensure saved connections CRUD operations work
- Test connection switching doesn't cause UI flashes
- Verify persistence across app restarts

### 7. Benefits
- **Eliminate prop drilling**: No more passing connection props through component tree
- **Better error handling**: Centralized error state management
- **Improved debugging**: Redux DevTools for connection state
- **Easier testing**: Pure reducers and predictable state updates
- **Performance**: Better control over re-renders

### 8. Potential Challenges
- **Async complexity**: Managing loading states for multiple operations
- **Migration period**: Keeping both React Query and Redux working together
- **IPC error handling**: Ensuring all error cases are covered
- **State synchronization**: Keeping UI in sync during connection changes

## Success Criteria
- All connection operations work through Redux
- No React Query dependencies for connection state
- Clean, intuitive useConnection hook API
- No regressions in functionality
- Improved error handling and user feedback