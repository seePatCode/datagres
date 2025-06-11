// Preload script for exposing APIs to renderer process
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  connectDatabase: (connectionString) => ipcRenderer.invoke('connect-database', connectionString),
  fetchTableData: (connectionString, tableName, searchOptions) => ipcRenderer.invoke('fetch-table-data', connectionString, tableName, searchOptions),
  fetchTableSchema: (connectionString, tableName) => ipcRenderer.invoke('fetch-table-schema', connectionString, tableName),
  updateTableData: (connectionString, request) => ipcRenderer.invoke('update-table-data', connectionString, request),
  executeSQL: (connectionString, request) => ipcRenderer.invoke('execute-sql', connectionString, request),
  saveConnection: (connectionString, name) => ipcRenderer.invoke('save-connection', connectionString, name),
  getSavedConnections: () => ipcRenderer.invoke('get-saved-connections'),
  loadConnection: (connectionId) => ipcRenderer.invoke('load-connection', connectionId),
  deleteConnection: (connectionId) => ipcRenderer.invoke('delete-connection', connectionId),
  updateConnectionName: (connectionId, newName) => ipcRenderer.invoke('update-connection-name', connectionId, newName),
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
  }
})