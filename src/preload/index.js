// Preload script for exposing APIs to renderer process
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  connectDatabase: (connectionString) => ipcRenderer.invoke('connect-database', connectionString),
  fetchTableData: (connectionString, tableName) => ipcRenderer.invoke('fetch-table-data', connectionString, tableName),
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
    ipcRenderer.on('menu-action', (event, action) => {
      callback(action)
    })
  }
})