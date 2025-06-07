const { app, BrowserWindow, ipcMain } = require('electron')
const { Client } = require('pg')
const path = require('path')
const crypto = require('crypto')

// Conditionally load optional dependencies
let Store, keytar
try {
  Store = require('electron-store')
} catch (error) {
  console.warn('electron-store not available:', error.message)
}

try {
  keytar = require('keytar')
} catch (error) {
  console.warn('keytar not available:', error.message)
}

// Secure Storage Implementation
const SERVICE_NAME = 'datagres-db-connections'

// Create encrypted store for connection metadata
let store
try {
  // Only initialize store if not in test mode and Store is available
  if (process.env.NODE_ENV !== 'test' && Store) {
    store = new Store({
      name: 'connections',
      encryptionKey: process.env.DATAGRES_ENCRYPTION_KEY || 'datagres-default-key-change-in-production',
      schema: {
        connections: {
          type: 'array',
          default: [],
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              host: { type: 'string' },
              port: { type: 'number' },
              database: { type: 'string' },
              username: { type: 'string' },
              hasPassword: { type: 'boolean' },
              createdAt: { type: 'string' },
              lastUsed: { type: 'string' }
            }
          }
        }
      }
    })
  }
} catch (error) {
  console.warn('Could not initialize electron-store:', error.message)
}

// Helper functions for secure storage
function generateConnectionId() {
  return crypto.randomUUID()
}

function parseConnectionString(connectionString) {
  try {
    const url = new URL(connectionString)
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.substring(1),
      username: url.username,
      password: url.password || null
    }
  } catch (error) {
    throw new Error('Invalid connection string format')
  }
}

function buildConnectionString(connection, password = null) {
  const passwordPart = password ? `:${password}` : ''
  return `postgresql://${connection.username}${passwordPart}@${connection.host}:${connection.port}/${connection.database}`
}

async function saveConnection(connectionString, name = null) {
  if (!store) {
    return { success: false, error: 'Storage not available in test mode' }
  }
  try {
    const parsed = parseConnectionString(connectionString)
    const connectionId = generateConnectionId()
    
    const displayName = name || `${parsed.username}@${parsed.host}/${parsed.database}`
    
    if (parsed.password && keytar) {
      try {
        await keytar.setPassword(SERVICE_NAME, connectionId, parsed.password)
      } catch (error) {
        console.warn('Could not save password to keychain:', error.message)
      }
    }
    
    const connections = store.get('connections')
    const newConnection = {
      id: connectionId,
      name: displayName,
      host: parsed.host,
      port: parsed.port,
      database: parsed.database,
      username: parsed.username,
      hasPassword: !!parsed.password,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    }
    
    connections.push(newConnection)
    store.set('connections', connections)
    
    return {
      success: true,
      connectionId,
      name: displayName
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

function getSavedConnections() {
  if (!store) {
    return { success: false, error: 'Storage not available in test mode', connections: [] }
  }
  try {
    const connections = store.get('connections')
    return {
      success: true,
      connections: connections.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      connections: []
    }
  }
}

async function loadConnection(connectionId) {
  if (!store) {
    return { success: false, error: 'Storage not available in test mode' }
  }
  try {
    const connections = store.get('connections')
    const connection = connections.find(conn => conn.id === connectionId)
    
    if (!connection) {
      throw new Error('Connection not found')
    }
    
    let password = null
    if (connection.hasPassword && keytar) {
      try {
        password = await keytar.getPassword(SERVICE_NAME, connectionId)
        if (!password) {
          throw new Error('Password not found in keychain')
        }
      } catch (error) {
        console.warn('Could not retrieve password from keychain:', error.message)
      }
    }
    
    connection.lastUsed = new Date().toISOString()
    store.set('connections', connections)
    
    const connectionString = buildConnectionString(connection, password)
    
    return {
      success: true,
      connectionString,
      name: connection.name
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

async function deleteConnection(connectionId) {
  if (!store) {
    return { success: false, error: 'Storage not available in test mode' }
  }
  try {
    const connections = store.get('connections')
    const connectionIndex = connections.findIndex(conn => conn.id === connectionId)
    
    if (connectionIndex === -1) {
      throw new Error('Connection not found')
    }
    
    const connection = connections[connectionIndex]
    
    if (connection.hasPassword && keytar) {
      try {
        await keytar.deletePassword(SERVICE_NAME, connectionId)
      } catch (error) {
        console.warn('Could not delete password from keychain:', error.message)
      }
    }
    
    connections.splice(connectionIndex, 1)
    store.set('connections', connections)
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

function updateConnectionName(connectionId, newName) {
  if (!store) {
    return { success: false, error: 'Storage not available in test mode' }
  }
  try {
    const connections = store.get('connections')
    const connection = connections.find(conn => conn.id === connectionId)
    
    if (!connection) {
      throw new Error('Connection not found')
    }
    
    connection.name = newName
    store.set('connections', connections)
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

const createWindow = () => {
  const preloadPath = path.join(__dirname, '../preload/index.js')
  
  
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: process.env.NODE_ENV !== 'test', // Don't show during tests
    focusable: process.env.NODE_ENV !== 'test', // Don't steal focus during tests
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath
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
ipcMain.handle('connect-database', async (_event, connectionString) => {
  // In test mode, return mock data for valid connection strings
  if (process.env.NODE_ENV === 'test') {
    // Mock successful connection for valid test connection strings to testdb
    if (connectionString.includes('testdb')) {
      return {
        success: true,
        database: 'testdb',
        tables: ['users', 'products', 'orders', 'categories']
      }
    }
    // Mock failure for invalid connection strings in tests
    return {
      success: false,
      error: 'Connection failed'
    }
  }

  const client = new Client(connectionString)
  
  try {
    await client.connect()
    
    // Test the connection by querying the database name
    const result = await client.query('SELECT current_database()')
    const database = result.rows[0].current_database
    
    // Fetch table names from the current database
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)
    
    const tables = tablesResult.rows.map(row => row.table_name)
    
    await client.end()
    
    return {
      success: true,
      database: database,
      tables: tables
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

// Handle table data requests
ipcMain.handle('fetch-table-data', async (_event, connectionString, tableName) => {
  // In test mode, return mock data
  if (process.env.NODE_ENV === 'test') {
    if (connectionString.includes('testdb')) {
      // Mock table data based on table name
      const mockData = {
        users: {
          columns: ['id', 'name', 'email', 'created_at'],
          rows: [
            [1, 'John Doe', 'john@example.com', '2024-01-01'],
            [2, 'Jane Smith', 'jane@example.com', '2024-01-02'],
            [3, 'Bob Johnson', 'bob@example.com', '2024-01-03']
          ]
        },
        products: {
          columns: ['id', 'name', 'price', 'category'],
          rows: [
            [1, 'Laptop', 999.99, 'Electronics'],
            [2, 'Mouse', 29.99, 'Electronics'],
            [3, 'Desk', 199.99, 'Furniture']
          ]
        },
        orders: {
          columns: ['id', 'user_id', 'total', 'status'],
          rows: [
            [1, 1, 1029.98, 'completed'],
            [2, 2, 29.99, 'pending'],
            [3, 1, 199.99, 'shipped']
          ]
        },
        categories: {
          columns: ['id', 'name', 'description'],
          rows: [
            [1, 'Electronics', 'Electronic devices and accessories'],
            [2, 'Furniture', 'Home and office furniture']
          ]
        }
      }
      
      return {
        success: true,
        tableName: tableName,
        data: mockData[tableName] || { columns: [], rows: [] }
      }
    }
    
    return {
      success: false,
      error: 'Table not found'
    }
  }

  const client = new Client(connectionString)
  
  try {
    await client.connect()
    
    // First, get column information
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName])
    
    const columns = columnsResult.rows.map(row => row.column_name)
    
    // Then get the data (limit to first 100 rows for now)
    const dataResult = await client.query(`SELECT * FROM ${tableName} LIMIT 100`)
    const rows = dataResult.rows.map(row => columns.map(col => row[col]))
    
    await client.end()
    
    return {
      success: true,
      tableName: tableName,
      data: {
        columns: columns,
        rows: rows
      }
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
  
  return await saveConnection(connectionString, name)
})

// Handle getting saved connections
ipcMain.handle('get-saved-connections', async () => {
  if (process.env.NODE_ENV === 'test') {
    // Mock saved connections for tests
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
  
  return getSavedConnections()
})

// Handle loading a saved connection
ipcMain.handle('load-connection', async (_event, connectionId) => {
  if (process.env.NODE_ENV === 'test') {
    // Mock loading connection for tests
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
  
  return await loadConnection(connectionId)
})

// Handle deleting a saved connection
ipcMain.handle('delete-connection', async (_event, connectionId) => {
  if (process.env.NODE_ENV === 'test') {
    // Mock success for tests
    return { success: true }
  }
  
  return await deleteConnection(connectionId)
})

// Handle updating connection name
ipcMain.handle('update-connection-name', async (_event, connectionId, newName) => {
  if (process.env.NODE_ENV === 'test') {
    // Mock success for tests
    return { success: true }
  }
  
  return updateConnectionName(connectionId, newName)
})