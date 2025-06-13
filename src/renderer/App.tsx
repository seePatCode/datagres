import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { ElectronAPI } from '@shared/types'
import { ConnectionView } from '@/views/ConnectionView'
import { ExplorerView } from '@/views/ExplorerView'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useMenuActions } from '@/hooks/useMenuActions'
import type { AppDispatch } from '@/store/store'
import {
  connectToDatabase,
  loadAndConnectToSavedConnection,
  saveConnection,
  resetConnection,
  loadSavedConnections,
  selectActiveConnection,
  selectSavedConnections,
  selectConnectionStatus,
  selectConnectionError,
} from '@/store/slices/connectionSlice'
import {
  selectTabs,
  selectActiveTabId,
  setActiveTab,
  removeTab,
} from '@/store/slices/tabsSlice'
import {
  setCurrentView,
  showSaveConnectionDialog,
  hideSaveConnectionDialog,
  pushNavigationEntry,
  navigateBack,
  navigateForward,
  selectCurrentView,
  selectShowSaveDialog,
  selectPendingConnectionString,
  selectCanGoBack,
  selectCanGoForward,
} from '@/store/slices/uiSlice'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

function App() {
  const dispatch = useDispatch<AppDispatch>()
  
  // Load saved connections on app startup
  useEffect(() => {
    dispatch(loadSavedConnections())
  }, [dispatch])
  
  // UI state
  const currentView = useSelector(selectCurrentView)
  const showSaveDialog = useSelector(selectShowSaveDialog)
  const pendingConnectionString = useSelector(selectPendingConnectionString)
  const canGoBack = useSelector(selectCanGoBack)
  const canGoForward = useSelector(selectCanGoForward)
  
  // Connection state
  const activeConnection = useSelector(selectActiveConnection)
  const savedConnections = useSelector(selectSavedConnections)
  const connectionStatus = useSelector(selectConnectionStatus)
  const connectionError = useSelector(selectConnectionError)
  const isConnecting = connectionStatus === 'connecting'
  const connectionString = activeConnection?.connectionString || ''
  
  // Tab state (for keyboard shortcuts)
  const tabs = useSelector(selectTabs(connectionString))
  const activeTabId = useSelector(selectActiveTabId(connectionString))
  
  // Local state for connection form
  const [localConnectionString, setLocalConnectionString] = useState('')
  
  // Navigation handlers
  const handleGoBack = () => dispatch(navigateBack())
  const handleGoForward = () => dispatch(navigateForward())
  
  // Connection handlers
  const handleConnect = (connString: string) => {
    dispatch(connectToDatabase({ connectionString: connString })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(setCurrentView('explorer'))
        dispatch(pushNavigationEntry({ type: 'view', viewName: 'explorer' }))
        
        // Show save dialog only if this connection isn't already saved
        const savedId = (result.payload as any)?.savedConnectionId
        if (!savedId) {
          dispatch(showSaveConnectionDialog(connString))
        }
      }
    })
  }
  
  const handleConnectionSelect = (savedConnection: any) => {
    dispatch(loadAndConnectToSavedConnection(savedConnection.id)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(setCurrentView('explorer'))
        dispatch(pushNavigationEntry({ type: 'view', viewName: 'explorer' }))
      }
    })
  }
  
  const handleConnectionChange = (connectionId: string) => {
    dispatch(loadAndConnectToSavedConnection(connectionId)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(setCurrentView('explorer'))
        dispatch(pushNavigationEntry({ type: 'view', viewName: 'explorer' }))
      }
    })
  }
  
  const handleSaveConnection = async (name: string) => {
    const result = await dispatch(saveConnection({ connectionString: pendingConnectionString, name }))
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(hideSaveConnectionDialog())
    }
  }
  
  const handleNewConnection = () => {
    dispatch(setCurrentView('connect'))
    dispatch(pushNavigationEntry({ type: 'view', viewName: 'connect' }))
    dispatch(resetConnection())
  }
  
  const handleShowConnections = () => {
    dispatch(setCurrentView('connect'))
    dispatch(pushNavigationEntry({ type: 'view', viewName: 'connect' }))
  }
  
  // Use menu actions hook
  useMenuActions({
    currentView,
    activeTabId,
    onNewConnection: handleNewConnection,
    onShowConnections: handleShowConnections,
    onCloseTab: (tabId: string) => {
      if (connectionString) {
        dispatch(removeTab({ connectionString, tabId }))
      }
    }
  })
  
  // Use keyboard shortcuts hook
  useKeyboardShortcuts({
    tabs,
    activeTabId,
    onCloseTab: (tabId) => dispatch(removeTab({ connectionString, tabId })),
    setActiveTabId: (tabId) => dispatch(setActiveTab({ connectionString, tabId })),
    onGoBack: handleGoBack,
    onGoForward: handleGoForward,
    canGoBack: !!canGoBack,
    canGoForward: !!canGoForward,
  })
  
  // Render appropriate view
  if (currentView === 'explorer') {
    return <ExplorerView />
  }
  
  return (
    <ConnectionView
      connectionString={localConnectionString}
      setConnectionString={setLocalConnectionString}
      connectionMutation={{
        isPending: isConnecting,
        isSuccess: activeConnection?.status === 'connected',
        isError: activeConnection?.status === 'error',
        error: connectionError ? new Error(connectionError) : null,
        data: activeConnection ? { database: activeConnection.database } : undefined
      }}
      onConnect={() => handleConnect(localConnectionString)}
      onConnectionSelect={handleConnectionSelect}
      onSavedConnectionSelect={handleConnectionChange}
      showSaveDialog={showSaveDialog}
      setShowSaveDialog={() => dispatch(hideSaveConnectionDialog())}
      onSaveConnection={handleSaveConnection}
      pendingConnectionString={pendingConnectionString}
      onNavigateBack={handleGoBack}
      onNavigateForward={handleGoForward}
      canGoBack={!!canGoBack}
      canGoForward={!!canGoForward}
    />
  )
}

export default App