import { useEffect } from 'react'
import type { MenuAction, AppView } from '@shared/types'

interface UseMenuActionsOptions {
  currentView: AppView
  activeTabId: string | null
  onNewConnection: () => void
  onShowConnections: () => void
  onCloseTab: (tabId: string) => void
}

export function useMenuActions({
  currentView,
  activeTabId,
  onNewConnection,
  onShowConnections,
  onCloseTab
}: UseMenuActionsOptions) {
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
        }
      }

      const cleanup = window.electronAPI.onMenuAction(handleMenuAction)
      
      // Return the cleanup function
      return cleanup
    }
  }, [currentView, activeTabId, onNewConnection, onShowConnections, onCloseTab])
}