// Handle Squirrel events for Windows auto-updater
// This must be at the very beginning of the main process
if (require('electron-squirrel-startup')) {
  require('electron').app.quit();
}

const { app, ipcMain } = require('electron')

// Import services
const connectionStore = require('./services/connectionStore')
const databaseService = require('./services/databaseService')
const { createApplicationMenu, updateMenuTheme } = require('./services/menuBuilder')
const { createMainWindow, setupWindowControlHandlers, getMainWindow } = require('./services/windowManager')
const { testMocks, isTestMode } = require('./services/testMocks')
const aiService = require('./services/aiService')
const settingsStore = require('./services/settingsStore')
const UpdateService = require('./services/updateService')

// Initialize auto-updater
const { updateElectronApp } = require('update-electron-app')
const log = require('electron-log')

// Configure logging for auto-updater
log.transports.file.level = 'info'
log.transports.console.level = 'info'

// Log app startup info
log.info('=== Datagres Starting ===')
log.info('App version:', app.getVersion())
log.info('Electron version:', process.versions.electron)
log.info('Node version:', process.versions.node)
log.info('Platform:', process.platform)
log.info('App packaged:', app.isPackaged)
log.info('Test mode:', isTestMode())

// Initialize auto-updater with GitHub releases
if (!isTestMode() && app.isPackaged) {
  log.info('Initializing auto-updater for GitHub releases')
  try {
    updateElectronApp({
      repo: 'seepatcode/datagres',
      updateInterval: '1 hour',
      logger: log,
      notifyUser: false
    })
    log.info('Auto-updater initialized successfully')
  } catch (error) {
    log.error('Failed to initialize auto-updater:', error)
  }
} else {
  log.info('Auto-updater skipped:', isTestMode() ? 'test mode' : 'development mode')
}

// Set app name as early as possible
app.setName('Datagres')

// Set dock icon for macOS (only needed in development)
if (process.platform === 'darwin' && app.dock && !app.isPackaged) {
  const path = require('path')
  try {
    const iconPath = path.join(__dirname, '../../build/icon.png')
    if (require('fs').existsSync(iconPath)) {
      app.dock.setIcon(iconPath)
    }
  } catch (e) {
    console.warn('Could not set dock icon:', e.message)
  }
}

app.whenReady().then(async () => {
  await connectionStore.initialize()
  const mainWindow = createMainWindow()
  
  // Initialize update service with windowManager
  const updateService = new UpdateService({ getMainWindow })
  
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

// Handle app version request
ipcMain.handle('get-app-version', async () => {
  return app.getVersion()
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
ipcMain.handle('fetch-table-schema', async (_event, connectionString, tableName, schemaName) => {
  return await databaseService.fetchTableSchema(connectionString, tableName, schemaName)
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
    // Check if this is a SQL error fix request
    if (prompt.toLowerCase().includes('fix this sql') && prompt.toLowerCase().includes('error')) {
      // Extract the original query and fix common test errors
      if (prompt.includes('c.user_id')) {
        // Fix the specific column error from commits/users join
        return {
          success: true,
          sql: `SELECT * FROM commits c JOIN users u ON c.author_id = u.id`,
          method: 'test'
        }
      } else if (prompt.includes('invalid_column')) {
        // Fix invalid column reference
        return {
          success: true,
          sql: `SELECT * FROM commits c WHERE c.id = 1`,
          method: 'test'
        }
      }
    }
    
    // Default test response for regular SQL generation
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

// Settings handlers
ipcMain.handle('get-ai-settings', async () => {
  try {
    const settings = await settingsStore.getAISettings()
    return { success: true, settings }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('set-ai-settings', async (_event, settings) => {
  try {
    await settingsStore.setAISettings(settings)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-setting', async (_event, key) => {
  try {
    const value = await settingsStore.getSetting(key)
    return value
  } catch (error) {
    return null
  }
})

ipcMain.handle('set-setting', async (_event, key, value) => {
  try {
    await settingsStore.setSetting(key, value)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Handle shell command execution for Ollama setup
ipcMain.handle('execute-shell-command', async (_event, command) => {
  const { exec } = require('child_process')
  const { promisify } = require('util')
  const execAsync = promisify(exec)
  
  try {
    // Only allow specific commands for security
    const allowedCommands = [
      'brew install ollama',
      'brew services start ollama',
      'ollama pull qwen2.5-coder:latest',
      'open https://ollama.com/download',
      'which claude',
      'open https://claude.ai/code'
    ]
    
    if (!allowedCommands.includes(command)) {
      throw new Error('Command not allowed')
    }
    
    console.log(`Executing command: ${command}`)
    
    // For 'which claude', use login shell to get full PATH
    let actualCommand = command
    if (command === 'which claude') {
      const userShell = process.env.SHELL || '/bin/bash'
      actualCommand = `${userShell} -l -c "${command}"`
    }
    
    const { stdout, stderr } = await execAsync(actualCommand)
    
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
