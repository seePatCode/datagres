const { BrowserWindow, ipcMain, app, nativeImage } = require('electron')
const path = require('path')

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

// Store reference to main window
let mainWindow = null


/**
 * Creates the main application window
 * @returns {BrowserWindow} The created window instance
 */
function createMainWindow() {
  // Preload script path - use webpack-provided constant when available
  // MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY is defined by @electron-forge/plugin-webpack
  let preloadPath
  
  // Check if the webpack constant is defined (it will be in packaged builds)
  if (typeof MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY !== 'undefined') {
    preloadPath = MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
  } else {
    // Fallback for development or non-webpack builds
    preloadPath = path.join(__dirname, '../../.webpack/renderer/main_window/preload.js')
  }
  
  // Determine icon path based on environment
  let iconPath
  if (app.isPackaged) {
    // In production, Electron Forge handles the icon automatically
    // We don't need to set it manually for packaged apps
    iconPath = undefined
  } else {
    // In development, use the build directory
    iconPath = path.join(__dirname, '../../../build/icon.png')
  }
  
  const windowOptions = {
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
  }
  
  // Only set icon if we have a path and the file exists
  if (iconPath) {
    try {
      if (require('fs').existsSync(iconPath)) {
        windowOptions.icon = iconPath
      }
    } catch (e) {
      console.warn('Could not set window icon:', e.message)
    }
  }
  
  const win = new BrowserWindow(windowOptions)

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

  // Store reference to main window
  mainWindow = win

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

/**
 * Gets the main application window
 * @returns {BrowserWindow|null} The main window instance or null
 */
function getMainWindow() {
  return mainWindow
}

module.exports = {
  createMainWindow,
  setupWindowControlHandlers,
  getMainWindow
}