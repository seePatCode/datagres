// Preload script for exposing APIs to renderer process
const { contextBridge, ipcRenderer } = require('electron')
const { parseConnectionString, sanitizeConnectionString, getConnectionDisplayInfo } = require('../main/utils/connectionStringUtils')

contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  appVersion: ipcRenderer.invoke('get-app-version'),
  // Database operations
  connectDatabase: (connectionString) => ipcRenderer.invoke('connect-database', connectionString),
  fetchTableData: (connectionString, tableName, searchOptions) => ipcRenderer.invoke('fetch-table-data', connectionString, tableName, searchOptions),
  fetchTableSchema: (connectionString, tableName, schemaName) => ipcRenderer.invoke('fetch-table-schema', connectionString, tableName, schemaName),
  updateTableData: (connectionString, request) => ipcRenderer.invoke('update-table-data', connectionString, request),
  executeSQL: (connectionString, request) => ipcRenderer.invoke('execute-sql', connectionString, request),
  saveConnection: (connectionString, name) => ipcRenderer.invoke('save-connection', connectionString, name),
  getSavedConnections: () => ipcRenderer.invoke('get-saved-connections'),
  loadConnection: (connectionId) => ipcRenderer.invoke('load-connection', connectionId),
  deleteConnection: (connectionId) => ipcRenderer.invoke('delete-connection', connectionId),
  updateConnectionName: (connectionId, newName) => ipcRenderer.invoke('update-connection-name', connectionId, newName),
  // AI SQL generation
  generateSQL: (prompt, tableInfo) => ipcRenderer.invoke('generate-sql', prompt, tableInfo),
  // AI Settings
  getAISettings: () => ipcRenderer.invoke('get-ai-settings'),
  setAISettings: (settings) => ipcRenderer.invoke('set-ai-settings', settings),
  // General settings
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  // Execute shell command for setup
  executeShellCommand: (command) => ipcRenderer.invoke('execute-shell-command', command),
  // AWS SSM tunnel setup
  setupAwsSsmTunnel: (options) => ipcRenderer.invoke('setup-aws-ssm-tunnel', options),
  // Theme updates
  updateTheme: (theme) => ipcRenderer.invoke('update-theme', theme),
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  // Menu actions
  onMenuAction: (callback) => {
    const handler = (event, action) => {
      callback(action)
    }
    ipcRenderer.on('menu-action', handler)
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('menu-action', handler)
    }
  },
  // Connection string utilities (sync, no IPC needed)
  connectionStringUtils: {
    parse: parseConnectionString,
    sanitize: sanitizeConnectionString,
    getDisplayInfo: getConnectionDisplayInfo
  },
  // Auto-update API
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getUpdateStatus: () => ipcRenderer.invoke('get-update-status'),
  onUpdateEvent: (callback) => {
    const channels = [
      'update-checking',
      'update-available',
      'update-not-available',
      'update-error',
      'update-download-progress',
      'update-downloaded'
    ]
    
    const handlers = {}
    channels.forEach(channel => {
      handlers[channel] = (event, data) => callback(channel, data)
      ipcRenderer.on(channel, handlers[channel])
    })
    
    // Return cleanup function
    return () => {
      channels.forEach(channel => {
        ipcRenderer.removeListener(channel, handlers[channel])
      })
    }
  }
})