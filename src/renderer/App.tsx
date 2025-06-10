import { useState, useEffect } from 'react'
import type { ElectronAPI, AppView } from '@shared/types'
import { ConnectionView } from '@/views/ConnectionView'
import { ExplorerView } from '@/views/ExplorerView'
import { useConnection } from '@/hooks/useConnection'
import { useTabs } from '@/hooks/useTabs'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useMenuActions } from '@/hooks/useMenuActions'
import { useNavigationHistory } from '@/hooks/useNavigationHistory'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}


function App() {
  const [currentView, setCurrentView] = useState<AppView>('connect')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [pendingConnectionString, setPendingConnectionString] = useState('')
  
  // Navigation history
  const {
    pushEntry,
    goBack,
    goForward,
    canGoBack,
    canGoForward
  } = useNavigationHistory()
  
  // Initialize navigation history
  useEffect(() => {
    pushEntry({ type: 'view', viewName: 'connect' })
  }, [])
  
  // Handle navigation history actions
  const handleGoBack = () => {
    const entry = goBack()
    if (entry) {
      if (entry.type === 'view') {
        setCurrentView(entry.viewName as AppView)
      } else if (entry.type === 'tab' && entry.tabId) {
        setActiveTabId(entry.tabId)
      }
    }
  }
  
  const handleGoForward = () => {
    const entry = goForward()
    if (entry) {
      if (entry.type === 'view') {
        setCurrentView(entry.viewName as AppView)
      } else if (entry.type === 'tab' && entry.tabId) {
        setActiveTabId(entry.tabId)
      }
    }
  }
  
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
    handleNewQueryTab,
    updateQueryTab,
  } = useTabs({
    onTabChange: (tabId) => {
      pushEntry({ type: 'tab', tabId })
    }
  })

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
      pushEntry({ type: 'view', viewName: 'explorer' })
      
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
        setShowSaveDialog(false)
        setPendingConnectionString('')
        // Refresh the connections list
        refetchConnections()
      } else {
        // Handle error silently or with user notification
      }
    } catch (error) {
      // Handle error silently or with user notification
    }
  }


  const handleNewConnection = () => {
    setCurrentView('connect')
    pushEntry({ type: 'view', viewName: 'connect' })
    resetConnection()
    resetTabs()
  }

  const handleShowConnections = () => {
    setCurrentView('connect')
    pushEntry({ type: 'view', viewName: 'connect' })
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
        onNavigateBack={handleGoBack}
        onNavigateForward={handleGoForward}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onNewQueryTab={handleNewQueryTab}
        onUpdateQueryTab={updateQueryTab}
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
      onNavigateBack={handleGoBack}
      onNavigateForward={handleGoForward}
      canGoBack={canGoBack}
      canGoForward={canGoForward}
    />
  )
}

export default App