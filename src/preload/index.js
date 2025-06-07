// Preload script for exposing APIs to renderer process
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  connectDatabase: (connectionString) => ipcRenderer.invoke('connect-database', connectionString),
  fetchTableData: (connectionString, tableName) => ipcRenderer.invoke('fetch-table-data', connectionString, tableName)
})