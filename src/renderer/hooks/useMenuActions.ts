import { useEffect } from 'react'
import { useTheme } from './useSettings'
import type { MenuAction, AppView } from '@shared/types'

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
        }
      }

      const cleanup = window.electronAPI.onMenuAction(handleMenuAction)
      
      // Return the cleanup function
      return cleanup
    }
  }, [currentView, activeTabId, onNewConnection, onShowConnections, onCloseTab, setTheme, onShowHelp])
}