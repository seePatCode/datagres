import { useEffect } from 'react'
import type { TableTab } from '@shared/types'

interface UseKeyboardShortcutsOptions {
  tabs: TableTab[]
  activeTabId: string | null
  onCloseTab: (tabId: string) => void
  setActiveTabId: (tabId: string) => void
}

export function useKeyboardShortcuts({
  tabs,
  activeTabId,
  onCloseTab,
  setActiveTabId
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + W to close current tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault()
        if (activeTabId) {
          onCloseTab(activeTabId)
        }
      }
      // Cmd/Ctrl + Tab to cycle forward through tabs
      else if ((e.metaKey || e.ctrlKey) && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        const currentIndex = tabs.findIndex(t => t.id === activeTabId)
        const nextIndex = (currentIndex + 1) % tabs.length
        if (tabs[nextIndex]) {
          setActiveTabId(tabs[nextIndex].id)
        }
      }
      // Cmd/Ctrl + Shift + Tab to cycle backward through tabs
      else if ((e.metaKey || e.ctrlKey) && e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        const currentIndex = tabs.findIndex(t => t.id === activeTabId)
        const prevIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1
        if (tabs[prevIndex]) {
          setActiveTabId(tabs[prevIndex].id)
        }
      }
      // Cmd/Ctrl + 1-9 to jump to specific tab
      else if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const tabIndex = parseInt(e.key) - 1
        if (tabs[tabIndex]) {
          setActiveTabId(tabs[tabIndex].id)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tabs, activeTabId, onCloseTab, setActiveTabId])
}