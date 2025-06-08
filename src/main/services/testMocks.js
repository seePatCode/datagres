/**
 * Test mock responses for IPC handlers
 * Centralizes all test-specific logic for cleaner main process code
 */

const testMocks = {
  // Mock response for save-connection
  saveConnection: (name) => ({
    success: true,
    connectionId: 'test-connection-id',
    name: name || 'Test Connection'
  }),

  // Mock response for get-saved-connections
  getSavedConnections: () => ({
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
  }),

  // Mock response for load-connection
  loadConnection: (connectionId) => {
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
  },

  // Mock response for delete-connection
  deleteConnection: () => ({ success: true }),

  // Mock response for update-connection-name
  updateConnectionName: () => ({ success: true })
}

/**
 * Check if we're in test mode
 */
function isTestMode() {
  return process.env.NODE_ENV === 'test'
}

module.exports = {
  testMocks,
  isTestMode
}