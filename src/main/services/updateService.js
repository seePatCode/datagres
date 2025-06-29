const { app, ipcMain, dialog } = require('electron')
const { autoUpdater } = require('electron')
const log = require('electron-log')

class UpdateService {
  constructor(windowManager) {
    this.windowManager = windowManager
    this.updateInfo = null
    this.downloadProgress = null
    this.isManualCheck = false
    
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
      // Only send to renderer for automatic checks (not manual)
      if (!this.isManualCheck) {
        this.sendToRenderer('update-checking')
      }
    })

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info)
      this.updateInfo = info
      this.sendToRenderer('update-available', info)
    })

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info)
      
      // Only send to renderer for automatic checks
      if (!this.isManualCheck) {
        this.sendToRenderer('update-not-available', info)
      }
      
      // Show dialog when manually checking for updates
      if (this.isManualCheck) {
        const { dialog } = require('electron')
        const mainWindow = this.windowManager.getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'No Updates Available',
            message: `You're running the latest version of Datagres!`,
            detail: `Current version: ${app.getVersion()}`,
            buttons: ['OK']
          })
        }
        this.isManualCheck = false
      }
    })

    autoUpdater.on('error', (err) => {
      log.error('Update error:', err)
      
      // Only send to renderer for automatic checks
      if (!this.isManualCheck) {
        this.sendToRenderer('update-error', err.message)
      }
      
      // Show error dialog if manual check
      if (this.isManualCheck) {
        const { dialog } = require('electron')
        const mainWindow = this.windowManager.getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'Update Check Failed',
            message: 'Unable to check for updates',
            detail: err.message,
            buttons: ['OK']
          })
        }
        this.isManualCheck = false
      }
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
        
        // Manually trigger an update check
        log.info('Manually triggering update check...')
        this.isManualCheck = true
        
        // Don't send checking status for manual checks - dialog only
        
        // Since update-electron-app handles the autoUpdater setup,
        // we can trigger a check by calling checkForUpdates
        try {
          autoUpdater.checkForUpdates()
          log.info('Update check triggered successfully')
          
          // The result will come through the event handlers
          return { 
            success: true, 
            message: 'Checking for updates...' 
          }
        } catch (checkError) {
          log.error('Failed to trigger update check:', checkError)
          
          // If manual check fails, show informational dialog
          const { dialog } = require('electron')
          const mainWindow = this.windowManager.getMainWindow()
          if (mainWindow && !mainWindow.isDestroyed()) {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Update Check',
              message: 'Unable to check for updates right now.',
              detail: `Current version: ${app.getVersion()}\n\nDatagres automatically checks for updates every hour.`,
              buttons: ['OK']
            })
          }
          
          return { 
            success: false, 
            error: 'Update check failed' 
          }
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