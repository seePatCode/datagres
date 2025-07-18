import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { ElectronAPI } from '@shared/types'
import { ConnectionView } from '@/views/ConnectionView'
import { ExplorerView } from '@/views/ExplorerView'
import { AboutView } from '@/views/AboutView'
import { SettingsView } from '@/views/SettingsView'
import { HelpDialog } from '@/components/ui/help-dialog'
import { UpdateNotification } from '@/components/ui/update-notification'
import { Toaster } from '@/components/ui/toaster'
import { AwsSsmWizard } from '@/components/ui/aws-ssm-wizard'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useMenuActions } from '@/hooks/useMenuActions'
import { useTabManagement } from '@/hooks/useTabManagement'
import type { AppDispatch } from '@/store/store'
import {
  loadSavedConnections,
  selectActiveConnection,
  resetConnection,
  setConnectionString,
  loadAndConnectToSavedConnection,
  connectToDatabase,
} from '@/store/slices/connectionSlice'
import {
  selectTabs,
  selectActiveTabId,
  setActiveTab,
  closeAllTabs,
  closeOtherTabs,
} from '@/store/slices/tabsSlice'
import {
  setCurrentView,
  pushNavigationEntry,
  navigateBack,
  navigateForward,
  selectCurrentView,
  selectCanGoBack,
  selectCanGoForward,
  selectIsHydrated,
} from '@/store/slices/uiSlice'
import { loadSettings } from '@/store/slices/settingsSlice'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

function App() {
  const dispatch = useDispatch<AppDispatch>()
  
  // Load saved connections and settings on app startup
  useEffect(() => {
    dispatch(loadSavedConnections())
    
    // Load all settings from main process
    Promise.all([
      window.electronAPI.getAISettings(),
      window.electronAPI.getSetting('theme'),
      window.electronAPI.getSetting('sqlLivePreview')
    ]).then(([aiResult, theme, sqlLivePreview]) => {
      const settings: any = {
        theme: theme || 'dark',
        sqlLivePreview: sqlLivePreview === true,
        ai: aiResult.success && aiResult.settings ? aiResult.settings : {
          provider: 'ollama' as const,
          ollamaConfig: {
            model: 'qwen2.5-coder:latest',
            url: 'http://localhost:11434'
          },
          claudeCodeConfig: {}
        }
      }
      dispatch(loadSettings(settings))
    })
  }, [dispatch])
  
  // UI state
  const currentView = useSelector(selectCurrentView)
  const canGoBack = useSelector(selectCanGoBack)
  const canGoForward = useSelector(selectCanGoForward)
  const isHydrated = useSelector(selectIsHydrated)
  
  // Connection state (for keyboard shortcuts)
  const activeConnection = useSelector(selectActiveConnection)
  const connectionString = activeConnection?.connectionString || ''
  const tabs = useSelector(selectTabs(connectionString))
  const activeTabId = useSelector(selectActiveTabId(connectionString))
  
  // Auto-reconnect to last database on startup
  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false)
  
  useEffect(() => {
    console.log('[App] Auto-reconnect check:', {
      isHydrated,
      hasAttemptedReconnect,
      currentView,
      activeConnection,
    })
    
    // Wait for store to be hydrated before attempting reconnect
    if (!isHydrated) {
      console.log('[App] Waiting for store to hydrate...')
      return
    }
    
    // Only attempt once and only on the connect view
    if (!hasAttemptedReconnect && currentView === 'connect' && activeConnection && activeConnection.connectionString) {
      // We have a persisted connection
      console.log('[App] Attempting auto-reconnect with:', activeConnection)
      setHasAttemptedReconnect(true)
      
      // Try to reconnect using the saved connection ID or connection string
      if (activeConnection.savedConnectionId) {
        console.log('[App] Reconnecting using saved connection ID:', activeConnection.savedConnectionId)
        dispatch(loadAndConnectToSavedConnection(activeConnection.savedConnectionId)).then((result) => {
          console.log('[App] Saved connection reconnect result:', result)
          if (result.meta.requestStatus === 'fulfilled') {
            console.log('[App] Reconnect successful, switching to explorer view')
            dispatch(setCurrentView('explorer'))
            dispatch(pushNavigationEntry({ type: 'view', viewName: 'explorer' }))
          }
        })
      } else if (activeConnection.connectionString) {
        console.log('[App] Reconnecting using connection string:', activeConnection.connectionString)
        dispatch(connectToDatabase({ 
          connectionString: activeConnection.connectionString 
        })).then((result) => {
          console.log('[App] Connection string reconnect result:', result)
          if (result.meta.requestStatus === 'fulfilled') {
            console.log('[App] Reconnect successful, switching to explorer view')
            dispatch(setCurrentView('explorer'))
            dispatch(pushNavigationEntry({ type: 'view', viewName: 'explorer' }))
          }
        })
      }
    }
  }, [isHydrated, activeConnection, currentView, hasAttemptedReconnect, dispatch])
  
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
  
  const handleAwsSsmConnect = () => {
    setShowAwsSsmWizard(true)
  }
  
  const handleAwsSsmConnection = (connectionString: string) => {
    // Treat it like a regular connection once the tunnel is established
    dispatch(setConnectionString(connectionString))
    dispatch(pushNavigationEntry({ type: 'view', viewName: 'explorer' }))
    dispatch(setCurrentView('explorer'))
  }
  
  const { closeTab: handleCloseTab } = useTabManagement(connectionString || '')
  const [showHelp, setShowHelp] = useState(false)
  const [showAwsSsmWizard, setShowAwsSsmWizard] = useState(false)
  
  // Use menu actions hook
  useMenuActions({
    currentView,
    activeTabId,
    onNewConnection: handleNewConnection,
    onShowConnections: handleShowConnections,
    onAwsSsmConnect: handleAwsSsmConnect,
    onCloseTab: handleCloseTab,
    onShowHelp: () => setShowHelp(true)
  })
  
  // Use keyboard shortcuts hook
  useKeyboardShortcuts({
    tabs,
    activeTabId,
    onCloseTab: handleCloseTab,
    onCloseAllTabs: () => {
      if (connectionString) {
        dispatch(closeAllTabs({ connectionString }))
      }
    },
    onCloseOtherTabs: (tabId) => {
      if (connectionString) {
        dispatch(closeOtherTabs({ connectionString, tabId }))
      }
    },
    setActiveTabId: (tabId) => dispatch(setActiveTab({ connectionString, tabId })),
    onGoBack: handleGoBack,
    onGoForward: handleGoForward,
    canGoBack: !!canGoBack,
    canGoForward: !!canGoForward,
    onShowHelp: () => setShowHelp(true)
  })
  
  // Render appropriate view
  return (
    <>
      {currentView === 'explorer' ? (
        <ExplorerView onShowHelp={() => setShowHelp(true)} />
      ) : currentView === 'about' ? (
        <AboutView />
      ) : currentView === 'settings' ? (
        <SettingsView />
      ) : (
        <ConnectionView />
      )}
      <HelpDialog open={showHelp} onOpenChange={setShowHelp} />
      <AwsSsmWizard 
        isOpen={showAwsSsmWizard} 
        onClose={() => setShowAwsSsmWizard(false)}
        onConnect={handleAwsSsmConnection}
      />
      <UpdateNotification />
      <Toaster />
    </>
  )
}

export default App