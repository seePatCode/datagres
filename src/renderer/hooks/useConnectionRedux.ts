import { useSelector, useDispatch } from 'react-redux'
import { useCallback, useEffect } from 'react'
import {
  connectToDatabase,
  fetchSavedConnections,
  loadAndConnectToSavedConnection,
  saveConnection,
  deleteConnection,
  updateConnectionName,
  setConnectionString,
  setIsSwitchingConnection,
  setIsAutoConnecting,
  setHasAttemptedAutoConnect,
  resetConnection,
  clearConnectionError,
  selectActiveConnection,
  selectConnectionString,
  selectCurrentDatabase,
  selectTables,
  selectSavedConnections,
  selectIsSwitchingConnection,
  selectIsAutoConnecting,
  selectHasAttemptedAutoConnect,
  selectConnectionStatus,
  selectConnectionError,
  selectCurrentConnection,
} from '@/store/slices/connectionSlice'
import type { AppDispatch } from '@/store/store'

interface UseConnectionOptions {
  onConnectionSuccess?: (connectionInfo?: { savedConnectionId?: string }) => void
}

export function useConnection(options: UseConnectionOptions = {}) {
  const dispatch = useDispatch<AppDispatch>()
  
  // Select state from Redux
  const activeConnection = useSelector(selectActiveConnection)
  const connectionString = useSelector(selectConnectionString)
  const currentDatabase = useSelector(selectCurrentDatabase)
  const tables = useSelector(selectTables)
  const savedConnections = useSelector(selectSavedConnections)
  const isSwitchingConnection = useSelector(selectIsSwitchingConnection)
  const isAutoConnecting = useSelector(selectIsAutoConnecting)
  const hasAttemptedAutoConnect = useSelector(selectHasAttemptedAutoConnect)
  const connectionStatus = useSelector(selectConnectionStatus)
  const connectionError = useSelector(selectConnectionError)
  const currentConnection = useSelector(selectCurrentConnection)
  
  // Convert connections to the format expected by DatabaseSidebar
  const connections = savedConnections.map(conn => ({
    id: conn.id,
    name: conn.name,
    database: conn.database
  }))
  
  // Load saved connections on mount
  useEffect(() => {
    dispatch(fetchSavedConnections())
  }, [dispatch])
  
  // Auto-connect to the most recently used connection on startup
  useEffect(() => {
    if (!hasAttemptedAutoConnect && savedConnections.length > 0) {
      dispatch(setHasAttemptedAutoConnect(true))
      
      // Delay auto-connection slightly to let UI render first
      setTimeout(async () => {
        try {
          // Find the most recently used connection (connections are already sorted by lastUsed)
          const mostRecentConnection = savedConnections[0]
          
          // Use the existing loadAndConnect thunk which handles savedConnectionId
          const result = await dispatch(loadAndConnectToSavedConnection(mostRecentConnection.id)).unwrap()
          options.onConnectionSuccess?.({ savedConnectionId: result.savedConnectionId })
        } catch (error) {
          // Error is handled in the slice
        }
      }, 100) // 100ms delay to let UI render first
    } else if (!hasAttemptedAutoConnect) {
      dispatch(setHasAttemptedAutoConnect(true))
    }
  }, [savedConnections, hasAttemptedAutoConnect, dispatch, options])
  
  // Actions
  const handleSetConnectionString = useCallback((value: string) => {
    dispatch(setConnectionString(value))
  }, [dispatch])
  
  const handleConnect = useCallback(async () => {
    try {
      const result = await dispatch(connectToDatabase({ connectionString })).unwrap()
      options.onConnectionSuccess?.({ savedConnectionId: result.savedConnectionId })
    } catch (error) {
      // Error is handled in the slice
    }
  }, [connectionString, dispatch, options])
  
  const handleConnectionSelect = useCallback(async (newConnectionString: string) => {
    dispatch(setConnectionString(newConnectionString))
    
    try {
      // This is a fresh connection string, not from a saved connection
      const result = await dispatch(connectToDatabase({ connectionString: newConnectionString })).unwrap()
      options.onConnectionSuccess?.({ savedConnectionId: result.savedConnectionId })
    } catch (error) {
      // Error is handled in the slice
    }
  }, [dispatch, options])
  
  const handleConnectionChange = useCallback(async (connectionId: string) => {
    try {
      const result = await dispatch(loadAndConnectToSavedConnection(connectionId)).unwrap()
      options.onConnectionSuccess?.({ savedConnectionId: result.savedConnectionId })
    } catch (error) {
      // Error is handled in the slice
    }
  }, [dispatch, options])
  
  const handleResetConnection = useCallback(() => {
    dispatch(resetConnection())
  }, [dispatch])
  
  const handleSaveConnection = useCallback(async (connectionString: string, name: string) => {
    try {
      await dispatch(saveConnection({ connectionString, name })).unwrap()
      // Refresh saved connections
      dispatch(fetchSavedConnections())
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to save connection' }
    }
  }, [dispatch])
  
  const handleDeleteConnection = useCallback(async (connectionId: string) => {
    try {
      await dispatch(deleteConnection(connectionId)).unwrap()
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete connection' }
    }
  }, [dispatch])
  
  const handleUpdateConnectionName = useCallback(async (connectionId: string, newName: string) => {
    try {
      await dispatch(updateConnectionName({ connectionId, newName })).unwrap()
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update connection' }
    }
  }, [dispatch])
  
  
  const refetchConnections = useCallback(() => {
    dispatch(fetchSavedConnections())
  }, [dispatch])
  
  // Create mutation-like object to match existing API
  const connectionMutation = {
    isPending: connectionStatus === 'connecting',
    isSuccess: connectionStatus === 'connected',
    isError: connectionStatus === 'error',
    error: connectionError ? new Error(connectionError) : null,
    data: connectionStatus === 'connected' ? { database: currentDatabase } : undefined,
    mutate: handleConnect,
    reset: handleResetConnection,
  }
  
  return {
    // State
    activeConnection,
    connectionString,
    setConnectionString: handleSetConnectionString,
    currentDatabase,
    tables,
    isAutoConnecting,
    isSwitchingConnection,
    connections,
    currentConnection,
    
    // Mutation object (for compatibility)
    connectionMutation,
    
    // Actions
    handleConnect,
    handleConnectionSelect,
    handleConnectionChange,
    resetConnection: handleResetConnection,
    refetchConnections,
    
    // Additional actions for other components
    saveConnection: handleSaveConnection,
    deleteConnection: handleDeleteConnection,
    updateConnectionName: handleUpdateConnectionName,
  }
}