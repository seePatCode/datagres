/**
 * IPC Handler Registry - Provides a clean, declarative way to register IPC handlers
 * with built-in error handling, logging, and test mode support
 */

const { ipcMain } = require('electron')
const { isTestMode } = require('./testMocks')

class IPCRegistry {
  constructor() {
    this.handlers = new Map()
    this.middlewares = []
  }

  /**
   * Register a new IPC handler with automatic error handling and logging
   * @param {string} channel - The IPC channel name
   * @param {Function} handler - The handler function
   * @param {Function} [testHandler] - Optional test mode handler
   */
  register(channel, handler, testHandler = null) {
    const wrappedHandler = async (event, ...args) => {
      const startTime = Date.now()
      const timestamp = new Date().toISOString()
      
      try {
        // Use test handler if in test mode and available
        const actualHandler = (isTestMode() && testHandler) ? testHandler : handler
        
        // Apply middlewares
        for (const middleware of this.middlewares) {
          const result = await middleware(channel, args)
          if (result !== undefined) return result
        }
        
        // Execute the handler
        const result = await actualHandler(event, ...args)
        
        return result
      } catch (error) {
        // Log error for debugging
        console.error(`[${timestamp}] [IPC] ${channel} failed:`, error.message)
        
        // Return consistent error format
        return {
          success: false,
          error: error.message || 'An unexpected error occurred'
        }
      }
    }
    
    // Register with Electron
    ipcMain.handle(channel, wrappedHandler)
    this.handlers.set(channel, { handler, testHandler })
  }

  /**
   * Register multiple handlers at once
   * @param {Array} handlers - Array of handler configurations
   */
  registerAll(handlers) {
    handlers.forEach(({ channel, handler, testHandler }) => {
      this.register(channel, handler, testHandler)
    })
  }

  /**
   * Add middleware to all handlers
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middlewares.push(middleware)
  }

  /**
   * Remove all registered handlers
   */
  removeAll() {
    this.handlers.forEach((_, channel) => {
      ipcMain.removeHandler(channel)
    })
    this.handlers.clear()
  }
}

// Create singleton instance
const ipcRegistry = new IPCRegistry()

module.exports = ipcRegistry