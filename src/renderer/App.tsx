import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { ElectronAPI } from '@shared/types'
import { ConnectionView } from '@/views/ConnectionView'
import { ExplorerView } from '@/views/ExplorerView'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useMenuActions } from '@/hooks/useMenuActions'
import { useTabManagement } from '@/hooks/useTabManagement'
import type { AppDispatch } from '@/store/store'
import {
  loadSavedConnections,
  selectActiveConnection,
  resetConnection,
} from '@/store/slices/connectionSlice'
import {
  selectTabs,
  selectActiveTabId,
  setActiveTab,
} from '@/store/slices/tabsSlice'
import {
  setCurrentView,
  pushNavigationEntry,
  navigateBack,
  navigateForward,
  selectCurrentView,
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
  const canGoBack = useSelector(selectCanGoBack)
  const canGoForward = useSelector(selectCanGoForward)
  
  // Connection state (for keyboard shortcuts)
  const activeConnection = useSelector(selectActiveConnection)
  const connectionString = activeConnection?.connectionString || ''
  const tabs = useSelector(selectTabs(connectionString))
  const activeTabId = useSelector(selectActiveTabId(connectionString))
  
  // Navigation handlers
  const handleGoBack = () => dispatch(navigateBack())
  const handleGoForward = () => dispatch(navigateForward())
  
  // Menu action handlers
  const handleNewConnection = () => {
    dispatch(setCurrentView('connect'))
    dispatch(pushNavigationEntry({ type: 'view', viewName: 'connect' }))
    dispatch(resetConnection())
  }
  
  const handleShowConnections = () => {
    dispatch(setCurrentView('connect'))
    dispatch(pushNavigationEntry({ type: 'view', viewName: 'connect' }))
  }
  
  const { closeTab: handleCloseTab } = useTabManagement(connectionString || '')
  
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
  
  return <ConnectionView />
}

export default App