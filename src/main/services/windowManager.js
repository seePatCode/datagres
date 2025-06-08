const { BrowserWindow, ipcMain } = require('electron')
const path = require('path')

/**
 * Creates the main application window
 * @returns {BrowserWindow} The created window instance
 */
function createMainWindow() {
  // Preload script path - electron-vite handles this automatically
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
    win.loadURL(process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../../renderer/index.html'))
  }
  
  // Show window after loading if not in test mode
  if (process.env.NODE_ENV !== 'test') {
    win.show()
  }

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