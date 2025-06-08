/**
 * Centralized application configuration
 * This module consolidates all configuration values used across the application
 */

const path = require('path')

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'
const isProduction = !isDevelopment && !isTest

const config = {
  // Application metadata
  app: {
    name: 'Datagres',
    version: require('../../package.json').version
  },

  // Database configuration
  database: {
    defaultPort: 5432,
    queryLimit: 100,
    connectionTimeout: 30000, // 30 seconds
    supportedProtocols: ['postgresql', 'postgres']
  },

  // Storage configuration
  storage: {
    encryptionKey: process.env.STORAGE_ENCRYPTION_KEY || '9a8b7c6d5e4f3g2h1i0j',
    keytarService: 'DatagresPasswordManager',
    storeDefaults: {
      connections: []
    }
  },

  // Window configuration
  window: {
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#171A1F',
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : undefined,
    frame: process.platform !== 'darwin' ? false : undefined
  },

  // Paths
  paths: {
    preload: path.join(__dirname, '../../preload/index.js'),
    renderer: isDevelopment 
      ? (process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173')
      : path.join(__dirname, '../../renderer/index.html')
  },

  // Environment flags
  env: {
    isDevelopment,
    isTest,
    isProduction,
    showWindow: !isTest,
    focusable: !isTest
  },

  // Logging configuration
  logging: {
    enabled: true,
    level: isDevelopment ? 'debug' : 'info',
    timestamps: true
  }
}

// Freeze config to prevent accidental modifications
module.exports = Object.freeze(config)