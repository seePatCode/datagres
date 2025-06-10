import { useState } from 'react'
import type { ElectronAPI, AppView } from '@shared/types'
import { ConnectionView } from '@/views/ConnectionView'
import { ExplorerView } from '@/views/ExplorerView'
import { useConnection } from '@/hooks/useConnection'
import { useTabs } from '@/hooks/useTabs'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useMenuActions } from '@/hooks/useMenuActions'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}


function App() {
  const [currentView, setCurrentView] = useState<AppView>('connect')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [pendingConnectionString, setPendingConnectionString] = useState('')
  
  // Use custom hooks
  const {
    tabs,
    activeTabId,
    recentTables,
    setActiveTabId,
    handleTableSelect,
    handleCloseTab,
    handleCloseAllTabs,
    handleCloseOtherTabs,
    resetTabs,
  } = useTabs()

  const {
    connectionString,
    setConnectionString,
    currentDatabase,
    tables,
    isAutoConnecting,
    isSwitchingConnection,
    connections,
    currentConnection,
    connectionMutation,
    handleConnect,
    handleConnectionSelect,
    handleConnectionChange: connectionHandleConnectionChange,
    resetConnection,
    refetchConnections,
  } = useConnection({
    onConnectionSuccess: () => {
      setCurrentView('explorer')
      
      // If this is a new connection (not from auto-connect or switching), show save dialog
      if (!isAutoConnecting && !isSwitchingConnection) {
        setPendingConnectionString(connectionString)
        setShowSaveDialog(true)
      }
    },
    onSwitchingConnectionStart: () => {
      // Clear tabs when switching connections
      resetTabs()
    }
  })


  // Wrapper for connection change to handle tab clearing
  const handleConnectionChange = (connectionId: string) => {
    connectionHandleConnectionChange(connectionId)
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


  const handleNewConnection = () => {
    setCurrentView('connect')
    resetConnection()
    resetTabs()
  }

  const handleShowConnections = () => {
    setCurrentView('connect')
  }

  // Use menu actions hook
  useMenuActions({
    currentView,
    activeTabId,
    onNewConnection: handleNewConnection,
    onShowConnections: handleShowConnections,
    onCloseTab: handleCloseTab
  })

  // Use keyboard shortcuts hook
  useKeyboardShortcuts({
    tabs,
    activeTabId,
    onCloseTab: handleCloseTab,
    setActiveTabId
  })


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