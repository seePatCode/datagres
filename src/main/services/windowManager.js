const { BrowserWindow, ipcMain } = require('electron')
const path = require('path')


/**
 * Creates the main application window
 * @returns {BrowserWindow} The created window instance
 */
function createMainWindow() {
  // Preload script path - in development, use webpack output
  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_RENDERER_URL
  const preloadPath = isDev 
    ? path.join(__dirname, '../../.webpack/renderer/main_window/preload.js')
    : path.join(__dirname, '../preload/index.js')
  
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
      // Security settings for development
      webSecurity: !isDev,
      allowRunningInsecureContent: false
    }
  })

  // Maximize the window on startup (except during tests)
  if (process.env.NODE_ENV !== 'test') {
    win.maximize()
  }

  // Load the app
  if (isDev) {
    win.loadURL('http://localhost:9001/main_window')
  } else {
    win.loadFile(path.join(__dirname, '../../.webpack/renderer/main_window/index.html'))
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