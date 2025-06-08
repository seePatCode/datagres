import { describe, it, expect } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { testMocks, isTestMode } = require('../testMocks')

describe('testMocks', () => {
  describe('isTestMode', () => {
    it('should return true when NODE_ENV is test', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'test'
      expect(isTestMode()).toBe(true)
      process.env.NODE_ENV = originalEnv
    })

    it('should return false when NODE_ENV is not test', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      expect(isTestMode()).toBe(false)
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('mock responses', () => {
    it('should return correct save connection mock', () => {
      const result = testMocks.saveConnection('My Connection')
      expect(result).toEqual({
        success: true,
        connectionId: 'test-connection-id',
        name: 'My Connection'
      })
    })

    it('should return correct saved connections mock', () => {
      const result = testMocks.getSavedConnections()
      expect(result.success).toBe(true)
      expect(result.connections).toHaveLength(2)
      expect(result.connections[0].id).toBe('test-connection-1')
      expect(result.connections[1].id).toBe('test-connection-2')
    })

    it('should return correct load connection mock for valid id', () => {
      const result = testMocks.loadConnection('test-connection-1')
      expect(result).toEqual({
        success: true,
        connectionString: 'postgresql://testuser:testpass@localhost:5432/testdb',
        name: 'Test Database 1'
      })
    })

    it('should return error for invalid connection id', () => {
      const result = testMocks.loadConnection('invalid-id')
      expect(result).toEqual({
        success: false,
        error: 'Connection not found'
      })
    })

    it('should return success for delete connection', () => {
      const result = testMocks.deleteConnection()
      expect(result).toEqual({ success: true })
    })

    it('should return success for update connection name', () => {
      const result = testMocks.updateConnectionName()
      expect(result).toEqual({ success: true })
    })
  })
})