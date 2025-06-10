import { useEffect } from 'react'
import type { TableTab } from '@shared/types'

interface UseKeyboardShortcutsOptions {
  tabs: TableTab[]
  activeTabId: string | null
  onCloseTab: (tabId: string) => void
  setActiveTabId: (tabId: string) => void
  onGoBack?: () => void
  onGoForward?: () => void
  canGoBack?: boolean
  canGoForward?: boolean
}

export function useKeyboardShortcuts({
  tabs,
  activeTabId,
  onCloseTab,
  setActiveTabId,
  onGoBack,
  onGoForward,
  canGoBack = false,
  canGoForward = false
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + [ to go back (Mac style, like Safari)
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault()
        if (canGoBack && onGoBack) {
          onGoBack()
        }
      }
      // Cmd/Ctrl + ] to go forward (Mac style, like Safari)
      else if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault()
        if (canGoForward && onGoForward) {
          onGoForward()
        }
      }
      // Cmd/Ctrl + W to close current tab
      else if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
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
  }, [tabs, activeTabId, onCloseTab, setActiveTabId, onGoBack, onGoForward, canGoBack, canGoForward])
}