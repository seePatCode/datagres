import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { SavedConnection, TableInfo, SchemaInfo } from '@shared/types'
import { validateConnectionString } from '@shared/validation'

export interface ConnectionState {
  // Active connection
  activeConnection: {
    connectionString: string
    originalConnectionString: string
    database: string
    status: 'idle' | 'connecting' | 'connected' | 'error'
    error?: string
    savedConnectionId?: string // Track if this connection came from a saved connection
  } | null
  
  // Connection tables
  tables: TableInfo[]  // For backward compatibility
  schemas: SchemaInfo[]  // New: organized by schema
  
  // Saved connections
  savedConnections: SavedConnection[]
  savedConnectionsStatus?: 'idle' | 'loading' | 'success' | 'error'
  savedConnectionsError?: string
  
  // Test connection
  testConnectionStatus?: 'idle' | 'testing' | 'success' | 'error'
  testConnectionError?: string
}

const initialState: ConnectionState = {
  activeConnection: null,
  tables: [],
  schemas: [],
  savedConnections: [],
}

// Async thunks
export const fetchSavedConnections = createAsyncThunk(
  'connection/fetchSaved',
  async () => {
    const result = await window.electronAPI.getSavedConnections()
    if (!result.success) {
      throw new Error(result.error || 'Failed to load connections')
    }
    return result.connections
  }
)

export const connectToDatabase = createAsyncThunk(
  'connection/connect',
  async ({ connectionString, savedConnectionId }: { connectionString: string; savedConnectionId?: string }) => {
    const trimmedConnection = connectionString.trim()
    
    if (!trimmedConnection) {
      throw new Error('Please enter a connection string')
    }

    if (!validateConnectionString(trimmedConnection)) {
      throw new Error('Invalid connection string format')
    }

    const result = await window.electronAPI.connectDatabase(trimmedConnection)
    
    if (!result.success) {
      throw new Error(result.error || 'Connection failed')
    }
    
    return {
      connectionString: trimmedConnection,
      originalConnectionString: trimmedConnection,
      database: result.database || '',
      tables: (result.tables || []).map(name => ({ name })),
      schemas: result.schemas || [],
      savedConnectionId
    }
  }
)

export const loadAndConnectToSavedConnection = createAsyncThunk(
  'connection/loadAndConnect',
  async (connectionId: string, { dispatch }) => {
    const loadResult = await window.electronAPI.loadConnection(connectionId)
    
    if (!loadResult.success || !loadResult.connectionString) {
      throw new Error(loadResult.error || 'Failed to load connection')
    }
    
    // Connect to the loaded connection, passing the savedConnectionId
    const connectResult = await dispatch(connectToDatabase({
      connectionString: loadResult.connectionString,
      savedConnectionId: connectionId
    })).unwrap()
    
    return connectResult
  }
)

export const saveConnection = createAsyncThunk(
  'connection/save',
  async ({ connectionString, name }: { connectionString: string; name: string }) => {
    const result = await window.electronAPI.saveConnection(connectionString, name)
    if (!result.success) {
      throw new Error(result.error || 'Failed to save connection')
    }
    return { 
      connectionId: result.connectionId, 
      connectionString,
      name 
    }
  }
)

export const deleteConnection = createAsyncThunk(
  'connection/delete',
  async (connectionId: string) => {
    const result = await window.electronAPI.deleteConnection(connectionId)
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete connection')
    }
    return connectionId
  }
)

export const updateConnectionName = createAsyncThunk(
  'connection/updateName',
  async ({ connectionId, newName }: { connectionId: string; newName: string }) => {
    const result = await window.electronAPI.updateConnectionName(connectionId, newName)
    if (!result.success) {
      throw new Error(result.error || 'Failed to update connection name')
    }
    return { connectionId, newName }
  }
)

export const loadSavedConnections = createAsyncThunk(
  'connection/loadSavedConnections',
  async () => {
    const result = await window.electronAPI.getSavedConnections()
    if (!result.success) {
      throw new Error(result.error || 'Failed to load saved connections')
    }
    return result.connections || []
  }
)

// Note: testConnection is removed as it's not in the ElectronAPI interface

export const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setConnectionString: (state, action: PayloadAction<string>) => {
      if (!state.activeConnection) {
        state.activeConnection = {
          connectionString: action.payload,
          originalConnectionString: action.payload,
          database: '',
          status: 'idle'
        }
      } else {
        state.activeConnection.connectionString = action.payload
        state.activeConnection.originalConnectionString = action.payload
      }
    },
    
    resetConnection: (state) => {
      state.activeConnection = null
      state.tables = []
      state.schemas = []
      state.testConnectionStatus = 'idle'
      state.testConnectionError = undefined
    },
    
    clearConnectionError: (state) => {
      if (state.activeConnection) {
        state.activeConnection.error = undefined
      }
    },
    
    hydrateConnectionState: (state, action: PayloadAction<ConnectionState>) => {
      // Hydrate the entire connection state from persisted storage
      return action.payload
    },
  },
  extraReducers: (builder) => {
    // Fetch saved connections
    builder
      .addCase(fetchSavedConnections.pending, (state) => {
        state.savedConnectionsStatus = 'loading'
      })
      .addCase(fetchSavedConnections.fulfilled, (state, action) => {
        state.savedConnectionsStatus = 'success'
        state.savedConnections = action.payload || []
        state.savedConnectionsError = undefined
      })
      .addCase(fetchSavedConnections.rejected, (state, action) => {
        state.savedConnectionsStatus = 'error'
        state.savedConnectionsError = action.error.message
      })
    
    // Connect to database
    builder
      .addCase(connectToDatabase.pending, (state) => {
        if (!state.activeConnection) {
          state.activeConnection = {
            connectionString: '',
            originalConnectionString: '',
            database: '',
            status: 'connecting'
          }
        } else {
          state.activeConnection.status = 'connecting'
          state.activeConnection.error = undefined
        }
      })
      .addCase(connectToDatabase.fulfilled, (state, action) => {
        state.activeConnection = {
          connectionString: action.payload.connectionString,
          originalConnectionString: action.payload.originalConnectionString,
          database: action.payload.database,
          status: 'connected',
          error: undefined,
          savedConnectionId: action.payload.savedConnectionId
        }
        state.tables = action.payload.tables
        state.schemas = action.payload.schemas || []
      })
      .addCase(connectToDatabase.rejected, (state, action) => {
        if (state.activeConnection) {
          state.activeConnection.status = 'error'
          state.activeConnection.error = action.error.message
        }
        // Don't clear these flags here - they will be cleared by the hook
        // state.isAutoConnecting = false  
        // state.isSwitchingConnection = false
      })
    
    // Load and connect to saved connection
    builder
      .addCase(loadAndConnectToSavedConnection.fulfilled, (state, action) => {
        // Connection state is already updated by connectToDatabase
        // Don't clear isSwitchingConnection here - it will be cleared by the hook after callbacks run
      })
      .addCase(loadAndConnectToSavedConnection.rejected, (state) => {
        // Don't clear isSwitchingConnection here - it will be cleared by the hook
        // state.isSwitchingConnection = false
      })
    
    // Save connection
    builder
      .addCase(saveConnection.fulfilled, (state, action) => {
        // Mark the current connection as saved
        if (state.activeConnection && action.meta.arg.connectionString === state.activeConnection.connectionString) {
          state.activeConnection.savedConnectionId = action.payload.connectionId
        }
        // Note: We don't update savedConnections here because we need to fetch
        // the full connection details from the backend. This will be done
        // by dispatching loadSavedConnections after save.
      })
    
    // Delete connection
    builder
      .addCase(deleteConnection.fulfilled, (state, action) => {
        state.savedConnections = state.savedConnections.filter(
          conn => conn.id !== action.payload
        )
      })
    
    // Update connection name
    builder
      .addCase(updateConnectionName.fulfilled, (state, action) => {
        const connection = state.savedConnections.find(
          conn => conn.id === action.payload.connectionId
        )
        if (connection) {
          connection.name = action.payload.newName
        }
      })
    
    // Load saved connections
    builder
      .addCase(loadSavedConnections.fulfilled, (state, action) => {
        state.savedConnections = action.payload
      })
  },
})

export const {
  setConnectionString,
  resetConnection,
  clearConnectionError,
  hydrateConnectionState,
} = connectionSlice.actions

// Selectors
export const selectActiveConnection = (state: RootState) => state.connection.activeConnection
export const selectConnectionString = (state: RootState) => state.connection.activeConnection?.connectionString || ''
export const selectCurrentDatabase = (state: RootState) => state.connection.activeConnection?.database || ''
export const selectTables = (state: RootState) => state.connection.tables
export const selectSchemas = (state: RootState) => state.connection.schemas
export const selectSavedConnections = (state: RootState) => state.connection.savedConnections
export const selectConnectionStatus = (state: RootState) => state.connection.activeConnection?.status || 'idle'
export const selectConnectionError = (state: RootState) => state.connection.activeConnection?.error
export const selectCurrentConnection = (state: RootState) => {
  const database = state.connection.activeConnection?.database
  if (!database) return null
  
  return state.connection.savedConnections.find(conn => conn.database === database) || null
}


export default connectionSlice.reducer