const { app, BrowserWindow, ipcMain } = require('electron')
const { Client } = require('pg')
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: process.env.NODE_ENV !== 'test', // Don't show during tests
    focusable: process.env.NODE_ENV !== 'test', // Don't steal focus during tests
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js')
    }
  })

  // In dev mode, load from Vite dev server. In production, load built files.
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
  
  // Show window after loading if not in test mode
  if (process.env.NODE_ENV !== 'test') {
    win.show()
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle database connection requests
ipcMain.handle('connect-database', async (event, connectionString) => {
  const client = new Client(connectionString)
  
  try {
    await client.connect()
    
    // Test the connection by querying the database name
    const result = await client.query('SELECT current_database()')
    const database = result.rows[0].current_database
    
    await client.end()
    
    return {
      success: true,
      database: database
    }
  } catch (error) {
    try {
      await client.end()
    } catch (endError) {
      // Ignore end errors
    }
    
    return {
      success: false,
      error: error.message
    }
  }
})