const { app, ipcMain } = require('electron')

// Import services
const connectionStore = require('./services/connectionStore')
const databaseService = require('./services/databaseService')
const { createApplicationMenu } = require('./services/menuBuilder')
const { createMainWindow, setupWindowControlHandlers } = require('./services/windowManager')
const { testMocks, isTestMode } = require('./services/testMocks')

// Set app name as early as possible
app.setName('Datagres')

app.whenReady().then(async () => {
  await connectionStore.initialize()
  const mainWindow = createMainWindow()
  createApplicationMenu(mainWindow)
  setupWindowControlHandlers()

  app.on('activate', () => {
    if (require('electron').BrowserWindow.getAllWindows().length === 0) {
      const newWindow = createMainWindow()
      createApplicationMenu(newWindow)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle database connection requests
ipcMain.handle('connect-database', async (_event, connectionString) => {
  return await databaseService.connectDatabase(connectionString)
})

// Handle table data requests
ipcMain.handle('fetch-table-data', async (_event, connectionString, tableName, searchOptions) => {
  return await databaseService.fetchTableData(connectionString, tableName, searchOptions)
})

// Handle table schema requests
ipcMain.handle('fetch-table-schema', async (_event, connectionString, tableName) => {
  return await databaseService.fetchTableSchema(connectionString, tableName)
})

// Handle table data updates
ipcMain.handle('update-table-data', async (_event, connectionString, request) => {
  return await databaseService.updateTableData(connectionString, request)
})


// Handle saving database connections
ipcMain.handle('save-connection', async (_event, connectionString, name) => {
  if (isTestMode()) {
    return testMocks.saveConnection(name)
  }
  
  return await connectionStore.saveConnection(connectionString, name)
})

// Handle getting saved connections
ipcMain.handle('get-saved-connections', async () => {
  if (isTestMode()) {
    return testMocks.getSavedConnections()
  }
  
  return connectionStore.getSavedConnections()
})

// Handle loading a saved connection
ipcMain.handle('load-connection', async (_event, connectionId) => {
  if (isTestMode()) {
    return testMocks.loadConnection(connectionId)
    
  }
  
  return await connectionStore.loadConnection(connectionId)
})

// Handle deleting a saved connection
ipcMain.handle('delete-connection', async (_event, connectionId) => {
  if (isTestMode()) {
    return testMocks.deleteConnection()
  }
  
  return await connectionStore.deleteConnection(connectionId)
})

// Handle updating connection name
ipcMain.handle('update-connection-name', async (_event, connectionId, newName) => {
  if (isTestMode()) {
    return testMocks.updateConnectionName()
  }
  
  return connectionStore.updateConnectionName(connectionId, newName)
})
