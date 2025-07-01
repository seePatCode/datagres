/**
 * Shared type definitions for IPC communication between main and renderer processes
 */

// Response types for all IPC operations
export interface APIResponse {
  success: boolean
  error?: string
}

export interface SchemaInfo {
  name: string
  tables: TableInfo[]
}

export interface ConnectDatabaseResponse extends APIResponse {
  database?: string
  tables?: string[]  // Keep for backward compatibility
  schemas?: SchemaInfo[]  // New: organized by schema
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
  originalConnectionString?: string
}

export interface TableInfo {
  name: string
  schema?: string  // New: schema this table belongs to
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
  schemaName?: string  // New: schema this table belongs to
  columns: ColumnInfo[]
}

export interface FetchTableSchemaResponse extends APIResponse {
  schema?: TableSchema
}

export interface UpdateTableDataRequest {
  tableName: string
  schemaName?: string  // New: schema for the table
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

export interface GenerateSQLRequest {
  prompt: string
  tableName: string
  schemaName?: string  // New: schema for the table
  columns: string[]
  allSchemas?: TableSchema[]  // Full schema context for all tables
}

export interface GenerateSQLResponse extends APIResponse {
  sql?: string
  method?: 'ai' | 'pattern' | 'fallback' | 'test'
  message?: string
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
  // App info
  appVersion?: Promise<string>
  
  // Database operations
  connectDatabase: (connectionString: string) => Promise<ConnectDatabaseResponse>
  fetchTableData: (connectionString: string, tableName: string, searchOptions?: SearchOptions) => Promise<FetchTableDataResponse>
  fetchTableSchema: (connectionString: string, tableName: string, schemaName?: string) => Promise<FetchTableSchemaResponse>
  updateTableData: (connectionString: string, request: UpdateTableDataRequest) => Promise<UpdateTableDataResponse>
  executeSQL: (connectionString: string, request: ExecuteSQLRequest) => Promise<ExecuteSQLResponse>
  
  // Connection management
  saveConnection: (connectionString: string, name: string) => Promise<SaveConnectionResponse>
  getSavedConnections: () => Promise<GetSavedConnectionsResponse>
  loadConnection: (connectionId: string) => Promise<LoadConnectionResponse>
  deleteConnection: (connectionId: string) => Promise<APIResponse>
  updateConnectionName: (connectionId: string, newName: string) => Promise<APIResponse>
  
  // AI SQL generation
  generateSQL: (prompt: string, tableInfo: GenerateSQLRequest) => Promise<GenerateSQLResponse>
  executeShellCommand: (command: string) => Promise<{ success: boolean; output?: string; error?: string }>
  
  // AI Settings
  getAISettings: () => Promise<{ success: boolean; settings?: AISettings; error?: string }>
  setAISettings: (settings: AISettings) => Promise<{ success: boolean; error?: string }>
  
  // General settings
  getSetting: (key: string) => Promise<any>
  setSetting: (key: string, value: any) => Promise<{ success: boolean; error?: string }>
  
  // Theme updates
  updateTheme?: (theme: 'dark' | 'light' | 'system') => Promise<APIResponse>
  
  // Window controls (optional as they may not be available in tests)
  minimize?: () => Promise<void>
  maximize?: () => Promise<void>
  close?: () => Promise<void>
  
  // Menu actions
  onMenuAction?: (callback: (action: MenuAction) => void) => (() => void)
  
  // Auto-update API
  checkForUpdates?: () => Promise<APIResponse>
  installUpdate?: () => Promise<APIResponse>
  getUpdateStatus?: () => Promise<APIResponse & { hasUpdate?: boolean; updateInfo?: any; downloadProgress?: any }>
  onUpdateEvent?: (callback: (channel: string, data: any) => void) => (() => void)
  
  // Connection string utilities
  connectionStringUtils: {
    parse: (connectionString: string) => {
      protocol: string
      username: string
      password: string | null
      host: string
      port: number
      database: string
      params: Record<string, string>
      originalFormat: 'url' | 'keyvalue'
    }
    sanitize: (connectionString: string) => string
    getDisplayInfo: (connectionString: string) => {
      host: string
      port: number
      database: string
      username: string
      hasPassword: boolean
      ssl: boolean
    } | null
  }
}

// Menu action types
export type MenuAction = 
  | 'new-connection'
  | 'show-connections'
  | 'back-to-tables'
  | 'set-theme-dark'
  | 'set-theme-light'
  | 'set-theme-system'
  | 'show-help'
  | 'show-about'
  | 'show-settings'
  | 'check-for-updates'

// View states
export type AppView = 'connect' | 'explorer' | 'about' | 'settings'

// Tab state
export interface TableTab {
  id: string
  type: 'table'
  tableName: string
  schemaName?: string  // New: schema for the table
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

// AI Provider Settings
export type AIProvider = 'ollama' | 'claude-code'

export interface AISettings {
  provider: AIProvider
  ollamaConfig?: {
    model: string
    url: string
  }
  claudeCodeConfig?: {
    // Add any Claude Code specific config here in the future
  }
}