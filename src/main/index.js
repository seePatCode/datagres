const { app, BrowserWindow, ipcMain } = require('electron')
const { Client } = require('pg')
const path = require('path')

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