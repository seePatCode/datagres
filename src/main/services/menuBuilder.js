const { Menu } = require('electron')

/**
 * Creates and sets the application menu
 * @param {BrowserWindow} mainWindow - The main application window
 * @param {string} currentTheme - The current theme setting ('dark', 'light', or 'system')
 */
function createApplicationMenu(mainWindow, currentTheme = 'dark') {
  const isMac = process.platform === 'darwin'

  const template = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: 'Datagres',
      submenu: [
        { label: 'About Datagres', role: 'about' },
        { type: 'separator' },
        { 
          label: 'Preferences...', 
          accelerator: 'Cmd+,',
          click: () => {
            mainWindow.webContents.send('menu-action', 'show-settings')
          }
        },
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
        {
          label: 'Connect via AWS SSM',
          click: () => {
            mainWindow.webContents.send('menu-action', 'aws-ssm-connect')
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
          { 
            label: 'Preferences', 
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              mainWindow.webContents.send('menu-action', 'show-settings')
            }
          }
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
        { label: 'Toggle Developer Tools', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', role: 'resetZoom' },
        { label: 'Zoom In', role: 'zoomIn' },
        { label: 'Zoom Out', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Theme',
          submenu: [
            {
              label: 'Dark',
              type: 'radio',
              checked: currentTheme === 'dark',
              click: () => {
                mainWindow.webContents.send('menu-action', 'set-theme-dark')
              }
            },
            {
              label: 'Light',
              type: 'radio',
              checked: currentTheme === 'light',
              click: () => {
                mainWindow.webContents.send('menu-action', 'set-theme-light')
              }
            },
            {
              label: 'System',
              type: 'radio',
              checked: currentTheme === 'system',
              click: () => {
                mainWindow.webContents.send('menu-action', 'set-theme-system')
              }
            }
          ]
        }
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
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => {
            mainWindow.webContents.send('menu-action', 'show-help')
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click: () => {
            mainWindow.webContents.send('menu-action', 'check-for-updates')
          }
        },
        { type: 'separator' },
        {
          label: 'About Datagres',
          click: () => {
            mainWindow.webContents.send('menu-action', 'show-about')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

/**
 * Updates the menu with the current theme
 * @param {BrowserWindow} mainWindow - The main application window  
 * @param {string} theme - The current theme
 */
function updateMenuTheme(mainWindow, theme) {
  createApplicationMenu(mainWindow, theme)
}

module.exports = {
  createApplicationMenu,
  updateMenuTheme
}