import { useEffect } from 'react'
import type { ElectronAPI } from '@shared/types'
import { ConnectionView } from '@/views/ConnectionView'
import { ExplorerView } from '@/views/ExplorerView'
import { useConnection } from '@/hooks/useConnectionRedux'
import { useTabs } from '@/hooks/useTabs'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useMenuActions } from '@/hooks/useMenuActions'
import { useUI } from '@/hooks/useUI'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}


function App() {
  // UI state from Redux
  const {
    currentView,
    showSaveDialog,
    pendingConnectionString,
    canGoBack,
    canGoForward,
    setView,
    showSaveConnection,
    hideSaveConnection,
    goBack,
    goForward,
    pushNavigation,
  } = useUI()
  
  // Handle navigation history actions
  const handleGoBack = () => {
    const entry = goBack()
    if (entry && entry.type === 'tab' && entry.tabId) {
      setActiveTabId(entry.tabId)
    }
  }
  
  const handleGoForward = () => {
    const entry = goForward()
    if (entry && entry.type === 'tab' && entry.tabId) {
      setActiveTabId(entry.tabId)
    }
  }
  
  // Use custom hooks

  const {
    activeConnection,
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
    saveConnection,
  } = useConnection({
    onConnectionSuccess: () => {
      setView('explorer')
      
      // Show save dialog only if this connection isn't already saved
      if (!activeConnection?.savedConnectionId) {
        showSaveConnection(connectionString)
      }
    },
  })

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
    handleNewQueryTab,
    updateQueryTab,
    updateTableTab,
  } = useTabs({
    onTabChange: (tabId) => {
      pushNavigation({ type: 'tab', tabId })
    },
    connectionString: connectionString || undefined
  })

  // Wrapper for connection change to handle tab clearing
  const handleConnectionChange = (connectionId: string) => {
    connectionHandleConnectionChange(connectionId)
  }

  const handleSaveConnection = async (name: string) => {
    const result = await saveConnection(pendingConnectionString, name)
    if (result.success) {
      hideSaveConnection()
    }
  }


  const handleNewConnection = () => {
    setView('connect')
    // Only reset the connection form state, not the tabs
    // Tabs will be managed per-connection by useTabs
    resetConnection()
  }

  const handleShowConnections = () => {
    setView('connect')
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
    setActiveTabId,
    onGoBack: handleGoBack,
    onGoForward: handleGoForward,
    canGoBack,
    canGoForward,
  })


  // Render appropriate view based on current state
  if (currentView === 'explorer') {
    return (
      <ExplorerView
        currentDatabase={currentDatabase}
        tables={tables}
        recentTables={recentTables}
        connections={connections}
        currentConnection={currentConnection || undefined}
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
        setShowSaveDialog={hideSaveConnection}
        onSaveConnection={handleSaveConnection}
        setActiveTabId={setActiveTabId}
        onNavigateBack={handleGoBack}
        onNavigateForward={handleGoForward}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onNewQueryTab={handleNewQueryTab}
        onUpdateQueryTab={updateQueryTab}
        onUpdateTableTab={updateTableTab}
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
      onSavedConnectionSelect={handleConnectionChange}
      showSaveDialog={showSaveDialog}
      setShowSaveDialog={hideSaveConnection}
      onSaveConnection={handleSaveConnection}
      pendingConnectionString={pendingConnectionString}
      onNavigateBack={handleGoBack}
      onNavigateForward={handleGoForward}
      canGoBack={canGoBack}
      canGoForward={canGoForward}
    />
  )
}


export default App