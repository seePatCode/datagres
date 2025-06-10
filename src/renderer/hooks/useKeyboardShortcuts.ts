import { useEffect } from 'react'
import type { Tab } from '@shared/types'

interface UseKeyboardShortcutsOptions {
  tabs: Tab[]
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
  canGoForward = false,
  onExecuteQuery
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow navigation shortcuts to work even when focused in editor
      const isNavigationShortcut = (e.metaKey || e.ctrlKey) && (e.key === '[' || e.key === ']')
      
      // Cmd/Ctrl + [ to go back (Mac style, like Safari)
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault()
        e.stopPropagation() // Stop the event from reaching Monaco
        if (canGoBack && onGoBack) {
          onGoBack()
        }
        return false // Prevent default browser behavior
      }
      // Cmd/Ctrl + ] to go forward (Mac style, like Safari)
      else if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault()
        e.stopPropagation() // Stop the event from reaching Monaco
        if (canGoForward && onGoForward) {
          onGoForward()
        }
        return false // Prevent default browser behavior
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
    
    // Use capture phase to intercept events before Monaco editor
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [tabs, activeTabId, onCloseTab, setActiveTabId, onGoBack, onGoForward, canGoBack, canGoForward])
}