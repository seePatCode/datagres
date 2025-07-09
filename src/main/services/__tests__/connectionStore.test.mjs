import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock electron-store before importing connectionStore
vi.mock('electron-store', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      get: vi.fn().mockReturnValue([]),
      set: vi.fn()
    }))
  }
})

// Mock keytar
vi.mock('keytar', () => ({
  setPassword: vi.fn().mockResolvedValue(true),
  getPassword: vi.fn().mockResolvedValue('testpass'),
  deletePassword: vi.fn().mockResolvedValue(true)
}))

// Dynamically import connectionStore to handle CommonJS module
let connectionStore
beforeEach(async () => {
  connectionStore = await import('../connectionStore')
  vi.clearAllMocks()
})

describe('connectionStore', () => {
  describe('parseConnectionString', () => {
    it('should parse valid PostgreSQL connection string', async () => {
      const result = connectionStore.parseConnectionString(
        'postgresql://user:pass@localhost:5432/testdb'
      )
      
      expect(result).toEqual({
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'user',
        password: 'pass'
      })
    })

    it('should parse connection string without password', async () => {
      const result = connectionStore.parseConnectionString(
        'postgresql://user@localhost:5432/testdb'
      )
      
      expect(result).toEqual({
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'user',
        password: ''
      })
    })

    it('should use default port 5432 when not specified', async () => {
      const result = connectionStore.parseConnectionString(
        'postgresql://user@localhost/testdb'
      )
      
      expect(result).toEqual({
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'user',
        password: ''
      })
    })

    it('should throw error for invalid connection string', async () => {
      expect(() => {
        connectionStore.parseConnectionString('invalid-string')
      }).toThrow('Invalid connection string format')
    })
  })

  describe('buildConnectionString', () => {
    it('should build connection string with password', async () => {
      const connection = {
        username: 'user',
        host: 'localhost',
        port: 5432,
        database: 'testdb'
      }
      
      const result = connectionStore.buildConnectionString(connection, 'pass')
      expect(result).toBe('postgresql://user:pass@localhost:5432/testdb')
    })

    it('should build connection string without password', async () => {
      const connection = {
        username: 'user',
        host: 'localhost',
        port: 5432,
        database: 'testdb'
      }
      
      const result = connectionStore.buildConnectionString(connection)
      expect(result).toBe('postgresql://user@localhost:5432/testdb')
    })
  })

  // Note: More complex integration tests for save/load/delete operations
  // would require mocking the entire electron-store initialization flow.
  // For 80/20 coverage, the parsing and building functions are the most
  // critical to test as they contain the core business logic.
})