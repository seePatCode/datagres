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
  totalRows?: number
  page?: number
  pageSize?: number
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

// Search and filter options
export interface SearchOptions {
  searchTerm?: string
  searchColumns?: string[]
  filters?: Array<{
    column: string
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is_null' | 'is_not_null'
    value?: any
  }>
  orderBy?: Array<{
    column: string
    direction: 'asc' | 'desc'
  }>
  page?: number
  pageSize?: number
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

export interface ColumnInfo {
  name: string
  dataType: string
  nullable: boolean
  isPrimaryKey?: boolean
  defaultValue?: string
}

export interface TableSchema {
  tableName: string
  columns: ColumnInfo[]
}

export interface FetchTableSchemaResponse extends APIResponse {
  schema?: TableSchema
}

export interface UpdateTableDataRequest {
  tableName: string
  updates: Array<{
    rowIndex: number
    columnName: string
    value: any
    primaryKeyColumns: Record<string, any> // For WHERE clause
  }>
}

export interface UpdateTableDataResponse extends APIResponse {
  updatedCount?: number
}

export interface ExecuteSQLRequest {
  query: string
}

export interface ExecuteSQLResponse extends APIResponse {
  data?: {
    columns: string[]
    rows: any[][]
    rowCount: number
  }
  queryTime?: number
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
  fetchTableData: (connectionString: string, tableName: string, searchOptions?: SearchOptions) => Promise<FetchTableDataResponse>
  fetchTableSchema: (connectionString: string, tableName: string) => Promise<FetchTableSchemaResponse>
  updateTableData: (connectionString: string, request: UpdateTableDataRequest) => Promise<UpdateTableDataResponse>
  executeSQL: (connectionString: string, request: ExecuteSQLRequest) => Promise<ExecuteSQLResponse>
  
  // Connection management
  saveConnection: (connectionString: string, name: string) => Promise<SaveConnectionResponse>
  getSavedConnections: () => Promise<GetSavedConnectionsResponse>
  loadConnection: (connectionId: string) => Promise<LoadConnectionResponse>
  deleteConnection: (connectionId: string) => Promise<APIResponse>
  updateConnectionName: (connectionId: string, newName: string) => Promise<APIResponse>
  
  // Theme updates
  updateTheme?: (theme: 'dark' | 'light' | 'system') => Promise<APIResponse>
  
  // Window controls (optional as they may not be available in tests)
  minimize?: () => Promise<void>
  maximize?: () => Promise<void>
  close?: () => Promise<void>
  
  // Menu actions
  onMenuAction?: (callback: (action: MenuAction) => void) => (() => void)
}

// Menu action types
export type MenuAction = 
  | 'new-connection'
  | 'show-connections'
  | 'back-to-tables'
  | 'set-theme-dark'
  | 'set-theme-light'
  | 'set-theme-system'
  | 'show-about'

// View states
export type AppView = 'connect' | 'explorer' | 'about'

// Tab state
export interface TableTab {
  id: string
  type: 'table'
  tableName: string
  searchTerm: string
  page?: number
  pageSize?: number
}

export interface QueryTab {
  id: string
  type: 'query'
  title: string
  query: string
  isSaved?: boolean
}

export type Tab = TableTab | QueryTab