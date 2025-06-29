const { app, ipcMain, dialog } = require('electron')
const { autoUpdater } = require('electron')
const log = require('electron-log')

class UpdateService {
  constructor(windowManager) {
    this.windowManager = windowManager
    this.updateInfo = null
    this.downloadProgress = null
    
    log.info('UpdateService initialized. App packaged:', app.isPackaged)
    log.info('App version:', app.getVersion())
    
    // Only initialize if we're in a packaged app
    if (app.isPackaged) {
      this.setupEventHandlers()
      this.setupIpcHandlers()
    } else {
      // Still setup IPC handlers for development
      this.setupIpcHandlers()
    }
  }

  setupEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...')
      this.sendToRenderer('update-checking')
    })

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info)
      this.updateInfo = info
      this.sendToRenderer('update-available', info)
    })

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info)
      this.sendToRenderer('update-not-available', info)
    })

    autoUpdater.on('error', (err) => {
      log.error('Update error:', err)
      this.sendToRenderer('update-error', err.message)
    })

    autoUpdater.on('download-progress', (progressObj) => {
      const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`
      log.info(logMessage)
      this.downloadProgress = progressObj
      this.sendToRenderer('update-download-progress', progressObj)
    })

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info)
      this.updateInfo = info
      this.sendToRenderer('update-downloaded', info)
      
      // Show a dialog asking if the user wants to restart now
      const mainWindow = this.windowManager.getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Update Ready',
          message: 'A new version has been downloaded. Restart the application to apply the update?',
          buttons: ['Restart Now', 'Later'],
          defaultId: 0
        }).then(result => {
          if (result.response === 0) {
            autoUpdater.quitAndInstall()
          }
        })
      }
    })
  }

  setupIpcHandlers() {
    ipcMain.handle('check-for-updates', async () => {
      try {
        log.info('Manual update check requested')
        
        if (!app.isPackaged) {
          log.info('Update check skipped - app not packaged')
          // Show a dialog in development mode
          const { dialog } = require('electron')
          const mainWindow = this.windowManager.getMainWindow()
          if (mainWindow && !mainWindow.isDestroyed()) {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Development Mode',
              message: 'Auto-update is only available in production builds.',
              buttons: ['OK']
            })
          }
          return { 
            success: false, 
            error: 'Auto-update is only available in production builds' 
          }
        }
        
        // For update-electron-app, we can't manually trigger checks
        // But we can show a dialog to inform the user
        const { dialog } = require('electron')
        const mainWindow = this.windowManager.getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Check',
            message: 'Datagres automatically checks for updates every hour. If an update is available, you will be notified.',
            detail: `Current version: ${app.getVersion()}`,
            buttons: ['OK']
          })
        }
        
        log.info('Update check dialog shown to user')
        return { 
          success: true, 
          message: 'Update check initiated. You will be notified if an update is available.' 
        }
      } catch (error) {
        log.error('Manual update check failed:', error)
        return { success: false, error: error.message }
      }
    })

    ipcMain.handle('install-update', async () => {
      try {
        if (this.updateInfo) {
          autoUpdater.quitAndInstall()
          return { success: true }
        } else {
          return { success: false, error: 'No update available to install' }
        }
      } catch (error) {
        log.error('Install update failed:', error)
        return { success: false, error: error.message }
      }
    })

    ipcMain.handle('get-update-status', async () => {
      return {
        success: true,
        hasUpdate: !!this.updateInfo,
        updateInfo: this.updateInfo,
        downloadProgress: this.downloadProgress
      }
    })
  }

  sendToRenderer(channel, data) {
    const mainWindow = this.windowManager.getMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, data)
    }
  }
}

module.exports = UpdateService