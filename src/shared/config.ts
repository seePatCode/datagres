/**
 * Centralized configuration for the application
 */

export const CONFIG = {
  // Database settings
  database: {
    defaultPort: 5432,
    defaultQueryLimit: 100,
    connectionTimeout: 30000, // 30 seconds
    maxConnectionRetries: 3
  },

  // Storage settings
  storage: {
    encryptionKey: '9a8b7c6d5e4f3g2h1i0j', // Should be in env variable in production
    keytarService: 'DatagresPasswordManager',
    maxSavedConnections: 50
  },

  // UI settings
  ui: {
    autoConnectDelay: 100, // milliseconds
    recentTablesLimit: 5,
    defaultTablePageSize: 50,
    maxColumnWidth: 300,
    minColumnWidth: 60,
    defaultColumnWidth: 120
  },

  // Window settings
  window: {
    defaultWidth: 1400,
    defaultHeight: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#171A1F'
  },

  // Development settings
  dev: {
    viteServerUrl: process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173',
    enableDevTools: process.env.NODE_ENV === 'development'
  }
} as const

// Type-safe config getter with path support
export function getConfig<T = any>(path: string): T {
  const keys = path.split('.')
  let value: any = CONFIG
  
  for (const key of keys) {
    value = value[key]
    if (value === undefined) {
      throw new Error(`Config key not found: ${path}`)
    }
  }
  
  return value as T
}