import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store/store'
import { removeTab, updateTab, setActiveTab, addTab } from '@/store/slices/tabsSlice'
import type { Tab } from '@shared/types'

export function useTabManagement(connectionString: string) {
  const dispatch = useDispatch<AppDispatch>()

  const handleCloseTab = useCallback((tabId: string) => {
    dispatch(removeTab({ connectionString, tabId }))
  }, [dispatch, connectionString])

  const handleUpdateTab = useCallback((tabId: string, updates: any) => {
    dispatch(updateTab({ connectionString, tabId, updates }))
  }, [dispatch, connectionString])

  const handleSetActiveTab = useCallback((tabId: string | null) => {
    dispatch(setActiveTab({ connectionString, tabId }))
  }, [dispatch, connectionString])

  const handleAddTab = useCallback((tab: Tab) => {
    dispatch(addTab({ connectionString, tab }))
  }, [dispatch, connectionString])

  return {
    closeTab: handleCloseTab,
    updateTab: handleUpdateTab,
    setActiveTab: handleSetActiveTab,
    addTab: handleAddTab
  }
}