const { app, ipcMain } = require('electron')

// Import services
const connectionStore = require('./services/connectionStore')
const databaseService = require('./services/databaseService')
const { createApplicationMenu, updateMenuTheme } = require('./services/menuBuilder')
const { createMainWindow, setupWindowControlHandlers } = require('./services/windowManager')
const { testMocks, isTestMode } = require('./services/testMocks')
const aiService = require('./services/aiService')

// Set app name as early as possible
app.setName('Datagres')

app.whenReady().then(async () => {
  await connectionStore.initialize()
  const mainWindow = createMainWindow()
  
  // Get current theme from renderer's localStorage when ready
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`localStorage.getItem('datagres-ui-theme') || 'dark'`)
      .then(theme => {
        createApplicationMenu(mainWindow, theme)
      })
      .catch(() => {
        createApplicationMenu(mainWindow, 'dark')
      })
  })
  
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

// Handle SQL execution
ipcMain.handle('execute-sql', async (_event, connectionString, request) => {
  return await databaseService.executeSQL(connectionString, request)
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

// Handle theme updates
ipcMain.handle('update-theme', async (_event, theme) => {
  const mainWindow = require('electron').BrowserWindow.getFocusedWindow()
  if (mainWindow) {
    updateMenuTheme(mainWindow, theme)
  }
  return { success: true }
})

// Handle AI SQL generation
ipcMain.handle('generate-sql', async (_event, prompt, tableInfo) => {
  if (isTestMode()) {
    return {
      success: true,
      sql: `SELECT * FROM ${tableInfo.tableName} WHERE status = 'active'`,
      method: 'test'
    }
  }
  
  try {
    const result = await aiService.generateSQL(prompt, tableInfo)
    return result
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})

// Handle shell command execution for Ollama setup
ipcMain.handle('execute-shell-command', async (_event, command) => {
  const { exec } = require('child_process')
  const { promisify } = require('util')
  const execAsync = promisify(exec)
  
  try {
    // Only allow specific Ollama-related commands for security
    const allowedCommands = [
      'brew install ollama',
      'brew services start ollama',
      'ollama pull qwen2.5-coder:latest',
      'open https://ollama.com/download'
    ]
    
    if (!allowedCommands.includes(command)) {
      throw new Error('Command not allowed')
    }
    
    console.log(`Executing command: ${command}`)
    const { stdout, stderr } = await execAsync(command)
    
    return {
      success: true,
      output: stdout || stderr || 'Command executed successfully'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})
