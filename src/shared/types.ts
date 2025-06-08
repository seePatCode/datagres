/**
 * Shared type definitions for IPC communication between main and renderer processes
 */

// Response types for all IPC operations
export interface APIResponse {
  success: boolean
  error?: string
}

export interface ConnectDatabaseResponse extends APIResponse {
  database?: string
  tables?: string[]
}

export interface FetchTableDataResponse extends APIResponse {
  tableName?: string
  data?: {
    columns: string[]
    rows: any[][]
  }
}

export interface SaveConnectionResponse extends APIResponse {
  connectionId?: string
  name?: string
}

export interface GetSavedConnectionsResponse extends APIResponse {
  connections?: SavedConnection[]
}

export interface LoadConnectionResponse extends APIResponse {
  connectionString?: string
  name?: string
}

// Data models
export interface SavedConnection {
  id: string
  name: string
  host: string
  port: number
  database: string
  username: string
  hasPassword: boolean
  createdAt: string
  lastUsed: string
}

export interface TableInfo {
  name: string
  rowCount?: number
}

export interface ParsedConnectionInfo {
  host: string
  port: number
  database: string
  username: string
  password: string | null
}

// Complete API interface for window.electronAPI
export interface ElectronAPI {
  // Database operations
  connectDatabase: (connectionString: string) => Promise<ConnectDatabaseResponse>
  fetchTableData: (connectionString: string, tableName: string) => Promise<FetchTableDataResponse>
  
  // Connection management
  saveConnection: (connectionString: string, name: string) => Promise<SaveConnectionResponse>
  getSavedConnections: () => Promise<GetSavedConnectionsResponse>
  loadConnection: (connectionId: string) => Promise<LoadConnectionResponse>
  deleteConnection: (connectionId: string) => Promise<APIResponse>
  updateConnectionName: (connectionId: string, newName: string) => Promise<APIResponse>
  
  // Window controls (optional as they may not be available in tests)
  minimize?: () => Promise<void>
  maximize?: () => Promise<void>
  close?: () => Promise<void>
  
  // Menu actions
  onMenuAction?: (callback: (action: string) => void) => void
}

// Menu action types
export type MenuAction = 
  | 'new-connection'
  | 'show-connections'
  | 'back-to-tables'

// View states
export type AppView = 'connect' | 'explorer'