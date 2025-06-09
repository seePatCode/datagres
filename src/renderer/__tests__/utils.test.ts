import { describe, test, expect } from 'vitest'

// Test the connection name generation logic
describe('getDefaultConnectionName', () => {
  // Copy the function from App.tsx for testing
  const getDefaultConnectionName = (connectionString: string) => {
    try {
      const url = new URL(connectionString)
      const username = url.username || 'user'
      const host = url.hostname || 'localhost'
      const database = url.pathname.substring(1) || 'database'
      return `${username}@${host}/${database}`
    } catch {
      return 'New Connection'
    }
  }

  test('generates name from full connection string', () => {
    const result = getDefaultConnectionName('postgresql://myuser:password@db.example.com:5432/mydb')
    expect(result).toBe('myuser@db.example.com/mydb')
  })

  test('uses default username when missing', () => {
    const result = getDefaultConnectionName('postgresql://db.example.com/mydb')
    expect(result).toBe('user@db.example.com/mydb')
  })

  test('uses default host when missing', () => {
    const result = getDefaultConnectionName('postgresql:///mydb')
    expect(result).toBe('user@localhost/mydb')
  })

  test('handles localhost connections', () => {
    const result = getDefaultConnectionName('postgresql://admin@localhost/testdb')
    expect(result).toBe('admin@localhost/testdb')
  })

  test('returns default for invalid connection strings', () => {
    expect(getDefaultConnectionName('invalid-string')).toBe('New Connection')
    expect(getDefaultConnectionName('')).toBe('New Connection')
    expect(getDefaultConnectionName('not-a-url')).toBe('New Connection')
  })

  test('handles connection strings with query parameters', () => {
    const result = getDefaultConnectionName('postgresql://user@host/db?sslmode=require&connect_timeout=10')
    expect(result).toBe('user@host/db')
  })
})