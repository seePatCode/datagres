import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { ElectronAPI, AppView, TableInfo, MenuAction, TableTab } from '@shared/types'
import { validateConnectionString } from '@shared/validation'
import { ConnectionView } from '@/views/ConnectionView'
import { ExplorerView } from '@/views/ExplorerView'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}


function App() {
  
  const [connectionString, setConnectionString] = useState('')
  const [currentView, setCurrentView] = useState<AppView>('connect')
  const [currentDatabase, setCurrentDatabase] = useState<string>('')
  const [tables, setTables] = useState<TableInfo[]>([])
  const [recentTables, setRecentTables] = useState<TableInfo[]>([])
  const [hasAttemptedAutoConnect, setHasAttemptedAutoConnect] = useState(false)
  const [isAutoConnecting, setIsAutoConnecting] = useState(false)
  const [isSwitchingConnection, setIsSwitchingConnection] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [pendingConnectionString, setPendingConnectionString] = useState('')
  
  // Tab management
  const [tabs, setTabs] = useState<TableTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  
  // Debug logging for tab state
  useEffect(() => {
    console.log('[Tab State Changed] tabs:', tabs)
    console.log('[Tab State Changed] activeTabId:', activeTabId)
  }, [tabs, activeTabId])

  // Get saved connections to find the most recently used one
  const { data: connectionsData, refetch: refetchConnections } = useQuery({
    queryKey: ['saved-connections'],
    queryFn: async () => {
      console.log(`[${new Date().toISOString()}] Starting to fetch saved connections`)
      console.timeEnd('app-component-mount')
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
      console.log(`[${new Date().toISOString()}] Connection successful, switching to explorer view`)
      console.log('Connection data:', data)
      setCurrentView('explorer')
      setCurrentDatabase(data.database || '')
      setTables((data.tables || []).map(name => ({ name })))
      setIsAutoConnecting(false)
      setIsSwitchingConnection(false)
      
      // If this is a new connection (not from auto-connect or switching), show save dialog
      if (!isAutoConnecting && !isSwitchingConnection) {
        setPendingConnectionString(connectionString)
        setShowSaveDialog(true)
      }
    },
    onError: (error) => {
      console.log(`[${new Date().toISOString()}] Connection failed:`, error.message)
      setIsAutoConnecting(false)
      setIsSwitchingConnection(false)
    }
  })


  const handleConnect = () => {
    connectionMutation.mutate(connectionString)
  }

  // Auto-connect to the most recently used connection on startup (delayed for better UX)
  useEffect(() => {
    if (!hasAttemptedAutoConnect && connectionsData && connectionsData.length > 0) {
      setHasAttemptedAutoConnect(true)
      setIsAutoConnecting(true)
      
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
          }
        })
        .catch((error) => {
          console.warn('Failed to auto-connect to last used database:', error)
          setIsAutoConnecting(false)
        })
      }, 100) // 100ms delay to let UI render first
    } else if (!hasAttemptedAutoConnect) {
      setHasAttemptedAutoConnect(true)
    }
  }, [connectionsData, hasAttemptedAutoConnect, connectionMutation])

  const handleConnectionSelect = (newConnectionString: string) => {
    setConnectionString(newConnectionString)
    // Set switching flag to prevent save dialog from appearing
    setIsSwitchingConnection(true)
    // Auto-connect when a saved connection is selected
    connectionMutation.mutate(newConnectionString)
  }

  const handleSaveConnection = async (name: string) => {
    try {
      const result = await window.electronAPI.saveConnection(pendingConnectionString, name)
      if (result.success) {
        console.log('Connection saved successfully:', result)
        setShowSaveDialog(false)
        setPendingConnectionString('')
        // Refresh the connections list
        refetchConnections()
      } else {
        console.error('Failed to save connection:', result.error)
      }
    } catch (error) {
      console.error('Error saving connection:', error)
    }
  }

  const handleConnectionChange = (connectionId: string) => {
    console.log('[handleConnectionChange] Switching to connection:', connectionId)
    
    // Set switching flag to prevent UI flash
    setIsSwitchingConnection(true)
    
    // Clear current state when switching connections
    setTabs([])
    setActiveTabId(null)
    setRecentTables([])
    
    // Load and connect to selected connection
    window.electronAPI.loadConnection(connectionId)
      .then((result) => {
        console.log('[handleConnectionChange] Loaded connection:', result)
        if (result.success && result.connectionString) {
          setConnectionString(result.connectionString)
          // Don't reset mutation state to avoid flashing
          connectionMutation.mutate(result.connectionString)
        }
      })
      .catch((error) => {
        console.warn('Failed to load connection:', error)
        setIsSwitchingConnection(false)
      })
  }


  const handleTableSelect = (tableName: string) => {
    console.log('[handleTableSelect] Selected table:', tableName)
    console.log('[handleTableSelect] Current tabs:', tabs)
    console.log('[handleTableSelect] Current activeTabId:', activeTabId)
    
    // Check if table is already open in a tab
    const existingTab = tabs.find(tab => tab.tableName === tableName)
    
    if (existingTab) {
      console.log('[handleTableSelect] Found existing tab:', existingTab)
      // Switch to existing tab
      setActiveTabId(existingTab.id)
    } else {
      // Create new tab
      const newTab: TableTab = {
        id: `${tableName}_${Date.now()}`,
        tableName,
        searchTerm: '',
        page: 1,
        pageSize: 100
      }
      console.log('[handleTableSelect] Creating new tab:', newTab)
      setTabs(prev => {
        const newTabs = [...prev, newTab]
        console.log('[handleTableSelect] New tabs array:', newTabs)
        return newTabs
      })
      setActiveTabId(newTab.id)
    }
    
    // Add to recent tables
    setRecentTables(prev => {
      const filtered = prev.filter(t => t.name !== tableName)
      return [{ name: tableName }, ...filtered].slice(0, 5) // Keep last 5
    })
  }
  
  const handleCloseTab = (tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId)
      // If closing active tab, switch to another tab or null
      if (activeTabId === tabId) {
        const newActiveTab = newTabs[newTabs.length - 1]
        setActiveTabId(newActiveTab?.id || null)
      }
      return newTabs
    })
  }

  const handleCloseAllTabs = () => {
    setTabs([])
    setActiveTabId(null)
  }

  const handleCloseOtherTabs = (tabId: string) => {
    setTabs(prev => prev.filter(tab => tab.id === tabId))
    setActiveTabId(tabId)
  }
  

  const handleNewConnection = () => {
    setConnectionString('')
    setCurrentView('connect')
    // Reset any previous connection state
    connectionMutation.reset()
    // Clear all connection-related state
    setCurrentDatabase('')
    setTables([])
    setTabs([])
    setActiveTabId(null)
    setRecentTables([])
  }

  const handleShowConnections = () => {
    setCurrentView('connect')
  }

  // Expose menu handlers to main process via IPC
  useEffect(() => {
    if (window.electronAPI?.onMenuAction) {
      window.electronAPI.onMenuAction((action: MenuAction) => {
        switch (action) {
          case 'new-connection':
            handleNewConnection()
            break
          case 'show-connections':
            handleShowConnections()
            break
          case 'back-to-tables':
            // Close current tab
            if (activeTabId) {
              handleCloseTab(activeTabId)
            }
            break
        }
      })
    }
  }, [currentView])
  
  // Keyboard shortcuts for tab navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + W to close current tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault()
        if (activeTabId) {
          handleCloseTab(activeTabId)
        }
      }
      // Cmd/Ctrl + Tab to cycle forward through tabs
      else if ((e.metaKey || e.ctrlKey) && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        const currentIndex = tabs.findIndex(t => t.id === activeTabId)
        const nextIndex = (currentIndex + 1) % tabs.length
        if (tabs[nextIndex]) {
          setActiveTabId(tabs[nextIndex].id)
        }
      }
      // Cmd/Ctrl + Shift + Tab to cycle backward through tabs
      else if ((e.metaKey || e.ctrlKey) && e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        const currentIndex = tabs.findIndex(t => t.id === activeTabId)
        const prevIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1
        if (tabs[prevIndex]) {
          setActiveTabId(tabs[prevIndex].id)
        }
      }
      // Cmd/Ctrl + 1-9 to jump to specific tab
      else if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const tabIndex = parseInt(e.key) - 1
        if (tabs[tabIndex]) {
          setActiveTabId(tabs[tabIndex].id)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tabs, activeTabId, handleCloseTab])

  // Convert connections data to the format expected by DatabaseSidebar
  const connections = (connectionsData || []).map(conn => ({
    id: conn.id,
    name: conn.name,
    database: conn.database
  }))

  const currentConnection = connections.find(conn => 
    conn.database === currentDatabase
  )


  // Render appropriate view based on current state
  if (currentView === 'explorer') {
    return (
      <ExplorerView
        currentDatabase={currentDatabase}
        tables={tables}
        recentTables={recentTables}
        connections={connections}
        currentConnection={currentConnection}
        tabs={tabs}
        activeTabId={activeTabId}
        connectionString={connectionString}
        showSaveDialog={showSaveDialog}
        pendingConnectionString={pendingConnectionString}
        onConnectionChange={handleConnectionChange}
        onTableSelect={handleTableSelect}
        onCloseTab={handleCloseTab}
        onCloseAllTabs={handleCloseAllTabs}
        onCloseOtherTabs={handleCloseOtherTabs}
        setShowSaveDialog={setShowSaveDialog}
        onSaveConnection={handleSaveConnection}
        setActiveTabId={setActiveTabId}
      />
    )
  }

  return (
    <ConnectionView
      connectionString={connectionString}
      setConnectionString={setConnectionString}
      connectionMutation={{
        isPending: connectionMutation.isPending,
        isSuccess: connectionMutation.isSuccess,
        isError: connectionMutation.isError,
        error: connectionMutation.error,
        data: connectionMutation.data ? { database: connectionMutation.data.database || '' } : undefined
      }}
      onConnect={handleConnect}
      onConnectionSelect={handleConnectionSelect}
      showSaveDialog={showSaveDialog}
      setShowSaveDialog={setShowSaveDialog}
      onSaveConnection={handleSaveConnection}
      pendingConnectionString={pendingConnectionString}
    />
  )
}

export default App