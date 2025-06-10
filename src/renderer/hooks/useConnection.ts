import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { validateConnectionString } from '@shared/validation'
import type { TableInfo } from '@shared/types'

interface UseConnectionOptions {
  onConnectionSuccess?: (data: any) => void
  onAutoConnectStart?: () => void
  onAutoConnectEnd?: () => void
  onSwitchingConnectionStart?: () => void
  onSwitchingConnectionEnd?: () => void
}

export function useConnection(options: UseConnectionOptions = {}) {
  const [connectionString, setConnectionString] = useState('')
  const [currentDatabase, setCurrentDatabase] = useState<string>('')
  const [tables, setTables] = useState<TableInfo[]>([])
  const [hasAttemptedAutoConnect, setHasAttemptedAutoConnect] = useState(false)
  const [isAutoConnecting, setIsAutoConnecting] = useState(false)
  const [isSwitchingConnection, setIsSwitchingConnection] = useState(false)

  // Get saved connections to find the most recently used one
  const { data: connectionsData, refetch: refetchConnections } = useQuery({
    queryKey: ['saved-connections'],
    queryFn: async () => {
      console.log(`[${new Date().toISOString()}] Starting to fetch saved connections`)
      const result = await window.electronAPI.getSavedConnections()
      console.log(`[${new Date().toISOString()}] Finished fetching saved connections:`, result.success ? `${result.connections?.length} connections` : result.error)
      if (!result.success) {
        throw new Error(result.error || 'Failed to load connections')
      }
      return result.connections
    }
  })

  const connectionMutation = useMutation({
    mutationFn: async (connectionString: string) => {
      console.log(`[${new Date().toISOString()}] Starting database connection attempt`)
      const trimmedConnection = connectionString.trim()
      
      if (!trimmedConnection) {
        throw new Error('Please enter a connection string')
      }

      if (!validateConnectionString(trimmedConnection)) {
        throw new Error('Invalid connection string format')
      }

      console.log(`[${new Date().toISOString()}] Calling electronAPI.connectDatabase`)
      const result = await window.electronAPI.connectDatabase(trimmedConnection)
      console.log(`[${new Date().toISOString()}] Database connection result:`, result.success ? `Connected to ${result.database}, ${result.tables?.length} tables` : result.error)
      
      if (!result.success) {
        throw new Error(result.error || 'Connection failed')
      }
      
      return result
    },
    onSuccess: (data) => {
      console.log(`[${new Date().toISOString()}] Connection successful`)
      console.log('Connection data:', data)
      setCurrentDatabase(data.database || '')
      setTables((data.tables || []).map(name => ({ name })))
      setIsAutoConnecting(false)
      setIsSwitchingConnection(false)
      
      // Call the success callback if provided
      options.onConnectionSuccess?.(data)
    },
    onError: (error) => {
      console.log(`[${new Date().toISOString()}] Connection failed:`, error.message)
      setIsAutoConnecting(false)
      setIsSwitchingConnection(false)
    }
  })

  // Auto-connect to the most recently used connection on startup (delayed for better UX)
  useEffect(() => {
    if (!hasAttemptedAutoConnect && connectionsData && connectionsData.length > 0) {
      setHasAttemptedAutoConnect(true)
      setIsAutoConnecting(true)
      options.onAutoConnectStart?.()
      
      // Delay auto-connection slightly to let UI render first
      setTimeout(() => {
        // Find the most recently used connection (connections are already sorted by lastUsed)
        const mostRecentConnection = connectionsData[0]
        
        // Load and connect to the most recent connection
        window.electronAPI.loadConnection(mostRecentConnection.id)
          .then((result) => {
            if (result.success && result.connectionString) {
              setConnectionString(result.connectionString)
              connectionMutation.mutate(result.connectionString)
            } else {
              setIsAutoConnecting(false)
              options.onAutoConnectEnd?.()
            }
          })
          .catch((error) => {
            console.warn('Failed to auto-connect to last used database:', error)
            setIsAutoConnecting(false)
            options.onAutoConnectEnd?.()
          })
      }, 100) // 100ms delay to let UI render first
    } else if (!hasAttemptedAutoConnect) {
      setHasAttemptedAutoConnect(true)
    }
  }, [connectionsData, hasAttemptedAutoConnect, connectionMutation])

  const handleConnect = () => {
    connectionMutation.mutate(connectionString)
  }

  const handleConnectionSelect = (newConnectionString: string) => {
    setConnectionString(newConnectionString)
    // Set switching flag to prevent save dialog from appearing
    setIsSwitchingConnection(true)
    options.onSwitchingConnectionStart?.()
    // Auto-connect when a saved connection is selected
    connectionMutation.mutate(newConnectionString)
  }

  const handleConnectionChange = (connectionId: string) => {
    console.log('[handleConnectionChange] Switching to connection:', connectionId)
    
    // Set switching flag to prevent UI flash
    setIsSwitchingConnection(true)
    options.onSwitchingConnectionStart?.()
    
    // Load and connect to selected connection
    window.electronAPI.loadConnection(connectionId)
      .then((result) => {
        console.log('[handleConnectionChange] Loaded connection:', result)
        if (result.success && result.connectionString) {
          setConnectionString(result.connectionString)
          connectionMutation.mutate(result.connectionString)
        }
      })
      .catch((error) => {
        console.warn('Failed to load connection:', error)
        setIsSwitchingConnection(false)
        options.onSwitchingConnectionEnd?.()
      })
  }

  const resetConnection = () => {
    setConnectionString('')
    connectionMutation.reset()
    setCurrentDatabase('')
    setTables([])
  }

  // Convert connections data to the format expected by DatabaseSidebar
  const connections = (connectionsData || []).map(conn => ({
    id: conn.id,
    name: conn.name,
    database: conn.database
  }))

  const currentConnection = connections.find(conn => 
    conn.database === currentDatabase
  )

  return {
    // State
    connectionString,
    setConnectionString,
    currentDatabase,
    tables,
    isAutoConnecting,
    isSwitchingConnection,
    connections,
    currentConnection,
    
    // Mutation
    connectionMutation,
    
    // Actions
    handleConnect,
    handleConnectionSelect,
    handleConnectionChange,
    resetConnection,
    refetchConnections,
  }
}