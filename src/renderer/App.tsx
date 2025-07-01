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
  const [showHelp, setShowHelp] = useState(false)
  
  // Use menu actions hook
  useMenuActions({
    currentView,
    activeTabId,
    onNewConnection: handleNewConnection,
    onShowConnections: handleShowConnections,
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
      <UpdateNotification />
      <Toaster />
    </>
  )
}

export default App