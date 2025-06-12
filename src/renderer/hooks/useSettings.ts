import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { setTheme, setSqlLivePreview, selectTheme, selectSqlLivePreview } from '@/store/slices/settingsSlice'
import type { AppDispatch } from '@/store/store'

// Hook to replace useTheme from ThemeProvider
export function useTheme() {
  const dispatch = useDispatch<AppDispatch>()
  const theme = useSelector(selectTheme)
  
  // Listen for system theme changes when using 'system' theme
  useEffect(() => {
    if (theme !== 'system') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(e.matches ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])
  
  return {
    theme,
    setTheme: (newTheme: 'dark' | 'light' | 'system') => dispatch(setTheme(newTheme))
  }
}

// Hook to replace useSqlSettings from SqlSettingsContext
export function useSqlSettings() {
  const dispatch = useDispatch<AppDispatch>()
  const livePreview = useSelector(selectSqlLivePreview)
  
  return {
    livePreview,
    setLivePreview: (enabled: boolean) => dispatch(setSqlLivePreview(enabled))
  }
}