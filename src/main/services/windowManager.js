const { BrowserWindow, ipcMain } = require('electron')
const path = require('path')

/**
 * Creates the main application window
 * @returns {BrowserWindow} The created window instance
 */
function createMainWindow() {
  // Preload script path - electron-vite handles this automatically
  const preloadPath = path.join(__dirname, '../preload/index.js')
  console.log(`[${new Date().toISOString()}] [MAIN] Preload path: ${preloadPath}`)
  
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
    win.loadFile(path.join(__dirname, '../../renderer/index.html'))
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

  // Log any preload errors
  win.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error(`[${new Date().toISOString()}] [MAIN] Preload error:`, error)
  })

  // Check if API is exposed
  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript('typeof window.electronAPI').then(result => {
      console.log(`[${new Date().toISOString()}] [MAIN] window.electronAPI type:`, result)
    })
  })

  return win
}

/**
 * Sets up IPC handlers for window control operations
 */
function setupWindowControlHandlers() {
  // Handle window minimize
  ipcMain.handle('window-minimize', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      win.minimize()
    }
  })

  // Handle window maximize/unmaximize
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

  // Handle window close
  ipcMain.handle('window-close', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      win.close()
    }
  })
}

module.exports = {
  createMainWindow,
  setupWindowControlHandlers
}