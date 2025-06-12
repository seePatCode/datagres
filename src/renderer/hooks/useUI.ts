import { useSelector, useDispatch } from 'react-redux'
import { useCallback } from 'react'
import {
  setCurrentView,
  showSaveConnectionDialog,
  hideSaveConnectionDialog,
  pushNavigationEntry,
  navigateBack,
  navigateForward,
  selectCurrentView,
  selectShowSaveDialog,
  selectPendingConnectionString,
  selectCanGoBack,
  selectCanGoForward,
  selectCurrentNavigationEntry,
} from '@/store/slices/uiSlice'
import type { AppDispatch } from '@/store/store'
import type { AppView } from '@shared/types'

export function useUI() {
  const dispatch = useDispatch<AppDispatch>()
  
  const currentView = useSelector(selectCurrentView)
  const showSaveDialog = useSelector(selectShowSaveDialog)
  const pendingConnectionString = useSelector(selectPendingConnectionString)
  const canGoBack = useSelector(selectCanGoBack)
  const canGoForward = useSelector(selectCanGoForward)
  const currentNavigationEntry = useSelector(selectCurrentNavigationEntry)
  
  const setView = useCallback((view: AppView) => {
    dispatch(setCurrentView(view))
    dispatch(pushNavigationEntry({ type: 'view', viewName: view }))
  }, [dispatch])
  
  const showSaveConnection = useCallback((connectionString: string) => {
    dispatch(showSaveConnectionDialog(connectionString))
  }, [dispatch])
  
  const hideSaveConnection = useCallback(() => {
    dispatch(hideSaveConnectionDialog())
  }, [dispatch])
  
  const goBack = useCallback(() => {
    dispatch(navigateBack())
    return currentNavigationEntry
  }, [dispatch, currentNavigationEntry])
  
  const goForward = useCallback(() => {
    dispatch(navigateForward())
    return currentNavigationEntry
  }, [dispatch, currentNavigationEntry])
  
  const pushNavigation = useCallback((entry: { type: 'view' | 'tab'; viewName?: string; tabId?: string }) => {
    dispatch(pushNavigationEntry(entry))
  }, [dispatch])
  
  return {
    // State
    currentView,
    showSaveDialog,
    pendingConnectionString,
    canGoBack,
    canGoForward,
    
    // Actions
    setView,
    showSaveConnection,
    hideSaveConnection,
    goBack,
    goForward,
    pushNavigation,
  }
}