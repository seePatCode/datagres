const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: process.env.NODE_ENV !== 'test', // Don't show during tests
    focusable: process.env.NODE_ENV !== 'test' // Don't steal focus during tests
  })

  win.loadFile('index.html')
  
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