import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectTheme } from '@/store/slices/settingsSlice'

export function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const theme = useSelector(selectTheme)
  
  // Apply theme on mount and when it changes
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])
  
  return <>{children}</>
}