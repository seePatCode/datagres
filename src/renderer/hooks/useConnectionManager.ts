/**
 * Custom hook for managing database connections
 * Separates connection logic from UI components
 */

import { useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SavedConnection } from '../../shared/types'

export function useConnectionManager() {
  const queryClient = useQueryClient()
  const [connectionString, setConnectionString] = useState('')
  const [currentDatabase, setCurrentDatabase] = useState('')

  // Query for saved connections
  const { 
    data: savedConnections, 
    isLoading: isLoadingConnections 
  } = useQuery({
    queryKey: ['saved-connections'],
    queryFn: async () => {
      const result = await window.electronAPI.getSavedConnections()
      if (!result.success) {
        throw new Error(result.error || 'Failed to load connections')
      }
      return result.connections || []
    }
  })

  // Connect to database mutation
  const connectionMutation = useMutation({
    mutationFn: async (connString: string) => {
      const result = await window.electronAPI.connectDatabase(connString)
      if (!result.success) {
        throw new Error(result.error || 'Connection failed')
      }
      return result
    },
    onSuccess: (data) => {
      setCurrentDatabase(data.database || '')
      queryClient.setQueryData(['current-connection'], {
        connectionString,
        database: data.database
      })
    }
  })

  // Save connection mutation
  const saveConnectionMutation = useMutation({
    mutationFn: async ({ connectionString, name }: { connectionString: string; name: string }) => {
      const result = await window.electronAPI.saveConnection(connectionString, name)
      if (!result.success) {
        throw new Error(result.error || 'Failed to save connection')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-connections'] })
    }
  })

  // Delete connection mutation
  const deleteConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const result = await window.electronAPI.deleteConnection(connectionId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete connection')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-connections'] })
    }
  })

  // Load connection handler
  const loadConnection = useCallback(async (connectionId: string) => {
    const result = await window.electronAPI.loadConnection(connectionId)
    if (result.success && result.connectionString) {
      setConnectionString(result.connectionString)
      return connectionMutation.mutateAsync(result.connectionString)
    }
    throw new Error(result.error || 'Failed to load connection')
  }, [connectionMutation])

  // Auto-connect to most recent connection
  const autoConnect = useCallback(async () => {
    if (savedConnections && savedConnections.length > 0) {
      const mostRecent = savedConnections[0]
      try {
        await loadConnection(mostRecent.id)
        return true
      } catch (error) {
        console.error('Auto-connect failed:', error)
        return false
      }
    }
    return false
  }, [savedConnections, loadConnection])

  return {
    // State
    connectionString,
    setConnectionString,
    currentDatabase,
    savedConnections: savedConnections || [],
    
    // Loading states
    isConnecting: connectionMutation.isPending,
    isConnected: connectionMutation.isSuccess,
    connectionError: connectionMutation.error,
    isLoadingConnections,
    
    // Actions
    connect: connectionMutation.mutate,
    connectAsync: connectionMutation.mutateAsync,
    saveConnection: saveConnectionMutation.mutate,
    deleteConnection: deleteConnectionMutation.mutate,
    loadConnection,
    autoConnect,
    
    // Connection data
    connectionData: connectionMutation.data
  }
}