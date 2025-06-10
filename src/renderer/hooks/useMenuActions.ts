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

      window.electronAPI.onMenuAction(handleMenuAction)
      
      // Cleanup function - electron doesn't provide a way to remove the listener
      // but returning a function here follows React conventions
      return () => {
        // In a real implementation, we'd want to remove the listener
        // For now, this is just a placeholder
      }
    }
  }, [currentView, activeTabId, onNewConnection, onShowConnections, onCloseTab])
}