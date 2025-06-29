import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useTheme } from './useSettings'
import { setCurrentView } from '@/store/slices/uiSlice'
import type { MenuAction, AppView } from '@shared/types'
import type { AppDispatch } from '@/store/store'

interface UseMenuActionsOptions {
  currentView: AppView
  activeTabId: string | null
  onNewConnection: () => void
  onShowConnections: () => void
  onCloseTab: (tabId: string) => void
  onShowHelp?: () => void
}

export function useMenuActions({
  currentView,
  activeTabId,
  onNewConnection,
  onShowConnections,
  onCloseTab,
  onShowHelp
}: UseMenuActionsOptions) {
  const dispatch = useDispatch<AppDispatch>()
  const { setTheme } = useTheme()
  
  useEffect(() => {
    if (window.electronAPI?.onMenuAction) {
      const handleMenuAction = (action: MenuAction) => {
        switch (action) {
          case 'new-connection':
            onNewConnection()
            break
          case 'show-connections':
            onShowConnections()
            break
          case 'back-to-tables':
            // Close current tab
            if (activeTabId) {
              onCloseTab(activeTabId)
            }
            break
          case 'set-theme-dark':
            setTheme('dark')
            break
          case 'set-theme-light':
            setTheme('light')
            break
          case 'set-theme-system':
            setTheme('system')
            break
          case 'show-help':
            onShowHelp?.()
            break
          case 'show-about':
            dispatch(setCurrentView('about'))
            break
          case 'check-for-updates':
            if (window.electronAPI?.checkForUpdates) {
              window.electronAPI.checkForUpdates()
            }
            break
        }
      }

      const cleanup = window.electronAPI.onMenuAction(handleMenuAction)
      
      // Return the cleanup function
      return cleanup
    }
  }, [currentView, activeTabId, onNewConnection, onShowConnections, onCloseTab, setTheme, onShowHelp, dispatch])
}