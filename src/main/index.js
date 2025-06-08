const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('path')

// Import services
const connectionStore = require('./services/connectionStore')
const databaseService = require('./services/databaseService')

// Set app name as early as possible
app.setName('Datagres')


const createWindow = () => {
  const preloadPath = path.join(__dirname, '../preload/index.js')
  
  
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Datagres - Database Explorer',
    backgroundColor: '#171A1F', // Dark background with navy tint to prevent white flash
    ...(process.platform === 'darwin' 
      ? { titleBarStyle: 'hidden' } // macOS: Hide title but keep traffic lights
      : { frame: false }), // Windows/Linux: Completely frameless
    show: process.env.NODE_ENV !== 'test', // Don't show during tests
    focusable: process.env.NODE_ENV !== 'test', // Don't steal focus during tests
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      // Allow local resources in development
      webSecurity: process.env.NODE_ENV !== 'development'
    }
  })

  // Maximize the window on startup (except during tests)
  if (process.env.NODE_ENV !== 'test') {
    win.maximize()
  }

  // HMR for renderer process
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] [MAIN] Loading Vite dev server...`)
    win.loadURL(process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173')
  } else {
    console.log(`[${new Date().toISOString()}] [MAIN] Loading built renderer...`)
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
  
  // Add event listeners to track loading
  win.webContents.on('did-start-loading', () => {
    console.log(`[${new Date().toISOString()}] [MAIN] Window started loading`)
  })
  
  win.webContents.on('did-finish-load', () => {
    console.log(`[${new Date().toISOString()}] [MAIN] Window finished loading`)
  })
  
  win.webContents.on('dom-ready', () => {
    console.log(`[${new Date().toISOString()}] [MAIN] DOM ready`)
  })
  
  // Show window after loading if not in test mode
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] [MAIN] Showing window`)
    win.show()
  }

  return win
}

const createNativeMenu = (mainWindow) => {
  const isMac = process.platform === 'darwin'

  const template = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: 'Datagres',
      submenu: [
        { label: 'About Datagres', role: 'about' },
        { type: 'separator' },
        { label: 'Hide Datagres', role: 'hide' },
        { label: 'Hide Others', role: 'hideothers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', role: 'quit' }
      ]
    }] : []),
    
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Connection',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-connection')
          }
        },
        {
          label: 'Saved Connections',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            mainWindow.webContents.send('menu-action', 'show-connections')
          }
        },
        { type: 'separator' },
        ...(isMac ? [] : [{ label: 'Exit', role: 'quit' }])
      ]
    },
    
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', role: 'undo' },
        { label: 'Redo', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', role: 'cut' },
        { label: 'Copy', role: 'copy' },
        { label: 'Paste', role: 'paste' },
        ...(isMac ? [
          { label: 'Select All', role: 'selectall' }
        ] : [
          { label: 'Select All', role: 'selectall' },
          { type: 'separator' },
          { label: 'Preferences', accelerator: 'CmdOrCtrl+,' }
        ])
      ]
    },
    
    // View menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Back to Tables',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow.webContents.send('menu-action', 'back-to-tables')
          }
        },
        { type: 'separator' },
        { label: 'Reload', role: 'reload' },
        { label: 'Force Reload', role: 'forceReload' },
        { label: 'Toggle Developer Tools', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', role: 'resetZoom' },
        { label: 'Zoom In', role: 'zoomIn' },
        { label: 'Zoom Out', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', role: 'togglefullscreen' }
      ]
    },
    
    // Window menu (macOS only)
    ...(isMac ? [{
      label: 'Window',
      submenu: [
        { label: 'Close', role: 'close' },
        { label: 'Minimize', role: 'minimize' },
        { label: 'Zoom', role: 'zoom' },
        { type: 'separator' },
        { label: 'Bring All to Front', role: 'front' }
      ]
    }] : []),
    
    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Datagres',
          click: () => {
            // Could open an about dialog or webpage
            console.log('About Datagres')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(async () => {
  console.log(`[${new Date().toISOString()}] [MAIN] App ready, initializing store...`)
  await connectionStore.initialize()
  console.log(`[${new Date().toISOString()}] [MAIN] Store initialized, creating window...`)
  const mainWindow = createWindow()
  console.log(`[${new Date().toISOString()}] [MAIN] Window created, setting up native menu...`)
  createNativeMenu(mainWindow)
  console.log(`[${new Date().toISOString()}] [MAIN] Native menu created, startup complete`)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWindow = createWindow()
      createNativeMenu(newWindow)
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
ipcMain.handle('fetch-table-data', async (_event, connectionString, tableName) => {
  return await databaseService.fetchTableData(connectionString, tableName)
})

// Handle saving database connections
ipcMain.handle('save-connection', async (_event, connectionString, name) => {
  if (process.env.NODE_ENV === 'test') {
    // Mock success for tests
    return {
      success: true,
      connectionId: 'test-connection-id',
      name: name || 'Test Connection'
    }
  }
  
  return await connectionStore.saveConnection(connectionString, name)
})

// Handle getting saved connections
ipcMain.handle('get-saved-connections', async () => {
  console.log(`[${new Date().toISOString()}] [MAIN] get-saved-connections called`)
  if (process.env.NODE_ENV === 'test') {
    // Mock saved connections for tests
    console.log(`[${new Date().toISOString()}] [MAIN] Returning mock connections for test mode`)
    return {
      success: true,
      connections: [
        {
          id: 'test-connection-1',
          name: 'Test Database 1',
          host: 'localhost',
          port: 5432,
          database: 'testdb1',
          username: 'testuser',
          hasPassword: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          lastUsed: '2024-01-02T00:00:00.000Z'
        },
        {
          id: 'test-connection-2', 
          name: 'Test Database 2',
          host: 'localhost',
          port: 5432,
          database: 'testdb2',
          username: 'testuser',
          hasPassword: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          lastUsed: '2024-01-01T12:00:00.000Z'
        }
      ]
    }
  }
  
  const result = connectionStore.getSavedConnections()
  console.log(`[${new Date().toISOString()}] [MAIN] getSavedConnections result:`, result.success ? `${result.connections?.length} connections` : result.error)
  return result
})

// Handle loading a saved connection
ipcMain.handle('load-connection', async (_event, connectionId) => {
  console.log(`[${new Date().toISOString()}] [MAIN] load-connection called for ID:`, connectionId)
  if (process.env.NODE_ENV === 'test') {
    // Mock loading connection for tests
    console.log(`[${new Date().toISOString()}] [MAIN] Test mode - mocking connection load`)
    if (connectionId === 'test-connection-1') {
      return {
        success: true,
        connectionString: 'postgresql://testuser:testpass@localhost:5432/testdb',
        name: 'Test Database 1'
      }
    }
    return {
      success: false,
      error: 'Connection not found'
    }
  }
  
  const result = await connectionStore.loadConnection(connectionId)
  console.log(`[${new Date().toISOString()}] [MAIN] loadConnection result:`, result.success ? 'Success' : result.error)
  return result
})

// Handle deleting a saved connection
ipcMain.handle('delete-connection', async (_event, connectionId) => {
  if (process.env.NODE_ENV === 'test') {
    // Mock success for tests
    return { success: true }
  }
  
  return await connectionStore.deleteConnection(connectionId)
})

// Handle updating connection name
ipcMain.handle('update-connection-name', async (_event, connectionId, newName) => {
  if (process.env.NODE_ENV === 'test') {
    // Mock success for tests
    return { success: true }
  }
  
  return connectionStore.updateConnectionName(connectionId, newName)
})

// Handle window controls
ipcMain.handle('window-minimize', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    win.minimize()
  }
})

ipcMain.handle('window-maximize', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  }
})

ipcMain.handle('window-close', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    win.close()
  }
})