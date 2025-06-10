import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SqlSettingsContextType {
  livePreview: boolean
  setLivePreview: (enabled: boolean) => void
}

const SqlSettingsContext = createContext<SqlSettingsContextType | null>(null)

export function SqlSettingsProvider({ children }: { children: ReactNode }) {
  const [livePreview, setLivePreview] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('sql-live-preview')
    return saved ? saved === 'true' : false
  })

  // Save to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sql-live-preview', String(livePreview))
  }, [livePreview])

  return (
    <SqlSettingsContext.Provider value={{ livePreview, setLivePreview }}>
      {children}
    </SqlSettingsContext.Provider>
  )
}

export function useSqlSettings() {
  const context = useContext(SqlSettingsContext)
  if (!context) {
    throw new Error('useSqlSettings must be used within SqlSettingsProvider')
  }
  return context
}