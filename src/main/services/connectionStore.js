const crypto = require('crypto')
const { parseConnectionString: parseConnectionStringUtil, buildConnectionString: buildConnectionStringUtil } = require('../utils/connectionStringUtils')

// Service name for keychain storage
const SERVICE_NAME = 'datagres-db-connections'

// Module-level variables for store
let Store, keytar, store, storeLoadError, storeInitError

// Dynamic import for ESM module electron-store v10
async function loadElectronStore() {
  try {
    const module = await import('electron-store')
    Store = module.default
  } catch (error) {
    console.error('electron-store not available:', error.message)
    storeLoadError = error
  }
}

// Load keytar synchronously
function loadKeytar() {
  try {
    keytar = require('keytar')
  } catch (error) {
    console.warn('keytar not available:', error.message)
    // keytar is optional, so just warn
  }
}

// Initialize store after async loading
async function initializeStore() {
  await loadElectronStore()
  
  try {
    // Initialize store if Store is available
    if (Store) {
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
                lastUsed: { type: 'string' },
                originalConnectionString: { type: 'string' }
              }
            }
          }
        }
      })
    }
  } catch (error) {
    console.warn('Could not initialize electron-store:', error.message)
    storeInitError = error
  }
}

// Helper functions
function generateConnectionId() {
  return crypto.randomUUID()
}

function parseConnectionString(connectionString) {
  try {
    const parsed = parseConnectionStringUtil(connectionString)
    return {
      host: parsed.host,
      port: parsed.port,
      database: parsed.database,
      username: parsed.username,
      password: parsed.password
    }
  } catch (error) {
    throw new Error(`Invalid connection string format: ${error.message}`)
  }
}

function buildConnectionString(connection, password = null) {
  return buildConnectionStringUtil({
    username: connection.username,
    password: password,
    host: connection.host,
    port: connection.port,
    database: connection.database
  }, 'url')
}

// Public API functions
async function saveConnection(connectionString, name = null) {
  if (!store) {
    const actualError = storeInitError || storeLoadError
    const errorMsg = actualError ? `Store error: ${actualError.message}` : 'Store not initialized - electron-store may not be available'
    console.error(errorMsg, actualError)
    return { success: false, error: errorMsg }
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
      lastUsed: new Date().toISOString(),
      originalConnectionString: connectionString
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
    console.error('Store not initialized - electron-store may not be available')
    return { success: true, connections: [] } // Return empty list instead of error
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
    const actualError = storeInitError || storeLoadError
    const errorMsg = actualError ? `Store error: ${actualError.message}` : 'Store not initialized - electron-store may not be available'
    console.error(errorMsg, actualError)
    return { success: false, error: errorMsg }
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
    
    // Use original connection string if available, otherwise build from components
    let connectionString
    if (connection.originalConnectionString) {
      // If we have the original connection string, use it
      // But we still need to handle the password separately if it was stored in keychain
      if (connection.hasPassword && password) {
        // Parse the original connection string and inject the password
        try {
          const parsed = parseConnectionStringUtil(connection.originalConnectionString)
          parsed.password = password
          connectionString = buildConnectionStringUtil(parsed, parsed.originalFormat || 'url')
        } catch (error) {
          // Fallback to building from components if parsing fails
          connectionString = buildConnectionString(connection, password)
        }
      } else {
        connectionString = connection.originalConnectionString
      }
    } else {
      // Fallback for older saved connections without originalConnectionString
      connectionString = buildConnectionString(connection, password)
    }
    
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
    const actualError = storeInitError || storeLoadError
    const errorMsg = actualError ? `Store error: ${actualError.message}` : 'Store not initialized - electron-store may not be available'
    console.error(errorMsg, actualError)
    return { success: false, error: errorMsg }
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
    const actualError = storeInitError || storeLoadError
    const errorMsg = actualError ? `Store error: ${actualError.message}` : 'Store not initialized - electron-store may not be available'
    console.error(errorMsg, actualError)
    return { success: false, error: errorMsg }
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

// Initialize module
async function initialize() {
  loadKeytar()
  await initializeStore()
}

module.exports = {
  initialize,
  saveConnection,
  getSavedConnections,
  loadConnection,
  deleteConnection,
  updateConnectionName,
  parseConnectionString,
  buildConnectionString
}