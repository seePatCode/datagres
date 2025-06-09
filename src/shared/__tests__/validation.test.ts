import { describe, it, expect } from 'vitest'
import { 
  validateConnectionString, 
  validateConnectionStringWithError,
  normalizeConnectionString 
} from '../validation'

describe('Connection String Validation', () => {
  describe('validateConnectionString', () => {
    it('should accept connection strings without port', () => {
      const connStr = 'postgres://default:Q4xeSq6hPYWJ@ep-falling-star-a4016m1k-pooler.us-east-1.aws.neon.tech/verceldb'
      expect(validateConnectionString(connStr)).toBe(true)
    })

    it('should accept connection strings with port', () => {
      const connStr = 'postgres://user:pass@localhost:5432/mydb'
      expect(validateConnectionString(connStr)).toBe(true)
    })

    it('should accept postgresql:// protocol', () => {
      const connStr = 'postgresql://user:pass@localhost/mydb'
      expect(validateConnectionString(connStr)).toBe(true)
    })

    it('should accept connection without password', () => {
      const connStr = 'postgres://user@localhost/mydb'
      expect(validateConnectionString(connStr)).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(validateConnectionString('not-a-url')).toBe(false)
      expect(validateConnectionString('http://localhost/db')).toBe(false)
      expect(validateConnectionString('postgres://localhost')).toBe(true) // We now accept this
    })

    it('should accept connection strings with query parameters', () => {
      const connStr = 'postgres://user:pass@localhost/mydb?sslmode=require&connect_timeout=10'
      expect(validateConnectionString(connStr)).toBe(true)
    })
  })

  describe('validateConnectionStringWithError', () => {
    it('should accept connection strings without port', () => {
      const result = validateConnectionStringWithError('postgres://user:pass@localhost/mydb')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should provide specific error messages', () => {
      const noProtocol = validateConnectionStringWithError('user:pass@localhost/mydb')
      expect(noProtocol.valid).toBe(false)
      expect(noProtocol.error).toContain('must start with postgresql://')

      const invalidUrl = validateConnectionStringWithError('postgres://not a valid url')
      expect(invalidUrl.valid).toBe(false)
      expect(invalidUrl.error).toContain('Invalid URL format')
    })

    it('should accept any valid postgres URL', () => {
      // These would have failed before but should pass now
      const withQuery = validateConnectionStringWithError('postgres://user:pass@localhost/mydb?sslmode=require')
      expect(withQuery.valid).toBe(true)

      const noPort = validateConnectionStringWithError('postgres://user:pass@localhost/mydb')
      expect(noPort.valid).toBe(true)

      const complexDb = validateConnectionStringWithError('postgres://user:pass@localhost:5432/my-db!')
      expect(complexDb.valid).toBe(true)
    })
  })

  describe('normalizeConnectionString', () => {
    it('should add default port 5432 when missing', () => {
      const input = 'postgres://user:pass@localhost/mydb'
      const expected = 'postgres://user:pass@localhost:5432/mydb'
      expect(normalizeConnectionString(input)).toBe(expected)
    })

    it('should not modify connection strings that already have a port', () => {
      const input = 'postgres://user:pass@localhost:3000/mydb'
      expect(normalizeConnectionString(input)).toBe(input)
    })

    it('should handle Neon connection strings', () => {
      const input = 'postgres://default:Q4xeSq6hPYWJ@ep-falling-star-a4016m1k-pooler.us-east-1.aws.neon.tech/verceldb'
      const expected = 'postgres://default:Q4xeSq6hPYWJ@ep-falling-star-a4016m1k-pooler.us-east-1.aws.neon.tech:5432/verceldb'
      expect(normalizeConnectionString(input)).toBe(expected)
    })

    it('should handle connection strings without password', () => {
      const input = 'postgres://user@localhost/mydb'
      const expected = 'postgres://user@localhost:5432/mydb'
      expect(normalizeConnectionString(input)).toBe(expected)
    })

    it('should return invalid strings unchanged', () => {
      const invalid = 'not-a-connection-string'
      expect(normalizeConnectionString(invalid)).toBe(invalid)
    })
  })
})