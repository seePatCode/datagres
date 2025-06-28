import { describe, it, expect } from 'vitest'
const {
  encodeConnectionComponent,
  decodeConnectionComponent,
  parseConnectionString,
  buildConnectionString,
  sanitizeConnectionString,
  validateConnectionString,
  getConnectionDisplayInfo
} = require('./connectionStringUtils')

describe('connectionStringUtils', () => {
  describe('encodeConnectionComponent', () => {
    it('should encode special characters', () => {
      expect(encodeConnectionComponent('p@ssw0rd!')).toBe('p%40ssw0rd!')
      expect(encodeConnectionComponent('my pass')).toBe('my%20pass')
      expect(encodeConnectionComponent('pass#word')).toBe('pass%23word')
      expect(encodeConnectionComponent("pass'word")).toBe('pass%27word')
    })

    it('should handle empty or null values', () => {
      expect(encodeConnectionComponent('')).toBe('')
      expect(encodeConnectionComponent(null)).toBe('')
      expect(encodeConnectionComponent(undefined)).toBe('')
    })
  })

  describe('decodeConnectionComponent', () => {
    it('should decode encoded characters', () => {
      expect(decodeConnectionComponent('p%40ssw0rd!')).toBe('p@ssw0rd!')
      expect(decodeConnectionComponent('my%20pass')).toBe('my pass')
      expect(decodeConnectionComponent('pass%23word')).toBe('pass#word')
    })

    it('should handle invalid encoding gracefully', () => {
      expect(decodeConnectionComponent('invalid%')).toBe('invalid%')
      expect(decodeConnectionComponent('test%ZZ')).toBe('test%ZZ')
    })
  })

  describe('parseConnectionString', () => {
    describe('URL format', () => {
      it('should parse standard PostgreSQL URL', () => {
        const result = parseConnectionString('postgresql://user:pass@localhost:5432/mydb')
        expect(result).toEqual({
          protocol: 'postgresql',
          username: 'user',
          password: 'pass',
          host: 'localhost',
          port: 5432,
          database: 'mydb',
          params: {},
          originalFormat: 'url'
        })
      })

      it('should parse postgres:// protocol', () => {
        const result = parseConnectionString('postgres://user:pass@host/db')
        expect(result).toEqual({
          protocol: 'postgres',
          username: 'user',
          password: 'pass',
          host: 'host',
          port: 5432,
          database: 'db',
          params: {},
          originalFormat: 'url'
        })
      })

      it('should handle URL with query parameters', () => {
        const result = parseConnectionString('postgresql://user:pass@host/db?sslmode=require&connect_timeout=30')
        expect(result.params).toEqual({
          sslmode: 'require',
          connect_timeout: '30'
        })
      })

      it('should handle special characters in password', () => {
        const result = parseConnectionString('postgresql://user:p%40ss%21@host/db')
        expect(result.password).toBe('p@ss!')
      })

      it('should handle IPv6 addresses', () => {
        const result = parseConnectionString('postgresql://user:pass@[2001:db8::1]:5432/db')
        // URL.hostname correctly removes brackets from IPv6 addresses
        expect(result.host).toBe('2001:db8::1')
        expect(result.port).toBe(5432)
      })

      it('should handle localhost IPv6', () => {
        const result = parseConnectionString('postgresql://user:pass@[::1]/db')
        // URL.hostname correctly removes brackets from IPv6 addresses
        expect(result.host).toBe('::1')
      })

      it('should handle missing port', () => {
        const result = parseConnectionString('postgresql://user:pass@host/db')
        expect(result.port).toBe(5432)
      })

      it('should handle missing password', () => {
        const result = parseConnectionString('postgresql://user@host/db')
        expect(result.username).toBe('user')
        expect(result.password).toBe('')
      })

      it('should handle Unix socket URLs', () => {
        const result = parseConnectionString('postgresql:///mydb?host=/var/run/postgresql')
        expect(result.database).toBe('mydb')
        expect(result.params.host).toBe('/var/run/postgresql')
      })
    })

    describe('Key-value format', () => {
      it('should parse basic key-value format', () => {
        const result = parseConnectionString('host=localhost port=5432 dbname=mydb user=admin')
        expect(result).toEqual({
          protocol: 'postgresql',
          username: 'admin',
          password: null,
          host: 'localhost',
          port: 5432,
          database: 'mydb',
          params: {},
          originalFormat: 'keyvalue'
        })
      })

      it('should handle quoted values', () => {
        const result = parseConnectionString('host=localhost dbname=mydb user=admin password="my pass"')
        expect(result.password).toBe('my pass')
      })

      it('should handle single quoted values', () => {
        const result = parseConnectionString("host=localhost dbname=mydb user=admin password='my pass'")
        expect(result.password).toBe('my pass')
      })

      it('should handle additional parameters', () => {
        const result = parseConnectionString('host=localhost dbname=mydb user=admin sslmode=require connect_timeout=30')
        expect(result.params).toEqual({
          sslmode: 'require',
          connect_timeout: '30'
        })
      })

      it('should handle hostaddr instead of host', () => {
        const result = parseConnectionString('hostaddr=192.168.1.1 dbname=mydb user=admin')
        expect(result.host).toBe('192.168.1.1')
      })

      it('should handle Unix socket paths', () => {
        const result = parseConnectionString('host=/var/run/postgresql dbname=mydb user=postgres')
        expect(result.host).toBe('/var/run/postgresql')
      })
    })

    describe('Edge cases', () => {
      it('should throw on empty string', () => {
        expect(() => parseConnectionString('')).toThrow('Connection string is required')
      })

      it('should throw on null/undefined', () => {
        expect(() => parseConnectionString(null)).toThrow('Connection string is required')
        expect(() => parseConnectionString(undefined)).toThrow('Connection string is required')
      })

      it('should throw on unrecognized format', () => {
        expect(() => parseConnectionString('not a connection string')).toThrow('Unrecognized connection string format')
      })

      it('should handle @ in password with URL format', () => {
        const result = parseConnectionString('postgresql://user:p%40ssw%40rd@host/db')
        expect(result.password).toBe('p@ssw@rd')
      })
    })

    describe('Cloud provider URLs', () => {
      it('should parse Heroku-style URL', () => {
        const result = parseConnectionString('postgres://abc:xyz@ec2-1-2-3-4.compute-1.amazonaws.com:5432/d123')
        expect(result.host).toBe('ec2-1-2-3-4.compute-1.amazonaws.com')
        expect(result.database).toBe('d123')
      })

      it('should parse Azure-style URL', () => {
        const result = parseConnectionString('postgres://user@server:pass@server.postgres.database.azure.com/db')
        expect(result.username).toBe('user@server')
        expect(result.password).toBe('pass')
        expect(result.host).toBe('server.postgres.database.azure.com')
      })
    })
  })

  describe('buildConnectionString', () => {
    describe('URL format', () => {
      it('should build basic URL', () => {
        const components = {
          username: 'user',
          password: 'pass',
          host: 'localhost',
          port: 5432,
          database: 'mydb'
        }
        expect(buildConnectionString(components, 'url')).toBe('postgresql://user:pass@localhost:5432/mydb')
      })

      it('should encode special characters', () => {
        const components = {
          username: 'user',
          password: 'p@ss!',
          host: 'localhost',
          port: 5432,
          database: 'mydb'
        }
        // Note: URLSearchParams doesn't encode ! character
        expect(buildConnectionString(components, 'url')).toBe('postgresql://user:p%40ss!@localhost:5432/mydb')
      })

      it('should handle missing password', () => {
        const components = {
          username: 'user',
          host: 'localhost',
          port: 5432,
          database: 'mydb'
        }
        expect(buildConnectionString(components, 'url')).toBe('postgresql://user@localhost:5432/mydb')
      })

      it('should include query parameters', () => {
        const components = {
          username: 'user',
          host: 'localhost',
          port: 5432,
          database: 'mydb',
          params: { sslmode: 'require', connect_timeout: '30' }
        }
        expect(buildConnectionString(components, 'url')).toBe('postgresql://user@localhost:5432/mydb?sslmode=require&connect_timeout=30')
      })
    })

    describe('Key-value format', () => {
      it('should build basic key-value string', () => {
        const components = {
          username: 'user',
          password: 'pass',
          host: 'localhost',
          port: 5432,
          database: 'mydb'
        }
        // Key-value format omits default port
        expect(buildConnectionString(components, 'keyvalue')).toBe('host=localhost dbname=mydb user=user password=pass')
      })

      it('should quote password with spaces', () => {
        const components = {
          username: 'user',
          password: 'my pass',
          host: 'localhost',
          database: 'mydb'
        }
        expect(buildConnectionString(components, 'keyvalue')).toBe("host=localhost dbname=mydb user=user password='my pass'")
      })

      it('should omit default port', () => {
        const components = {
          username: 'user',
          host: 'localhost',
          port: 5432,
          database: 'mydb'
        }
        expect(buildConnectionString(components, 'keyvalue')).toBe('host=localhost dbname=mydb user=user')
      })

      it('should include non-default port', () => {
        const components = {
          username: 'user',
          host: 'localhost',
          port: 5433,
          database: 'mydb'
        }
        expect(buildConnectionString(components, 'keyvalue')).toBe('host=localhost port=5433 dbname=mydb user=user')
      })
    })
  })

  describe('sanitizeConnectionString', () => {
    it('should hide password in URL format', () => {
      // Port is included in rebuilt URLs
      expect(sanitizeConnectionString('postgresql://user:secret@host/db')).toBe('postgresql://user:********@host:5432/db')
    })

    it('should hide password in key-value format', () => {
      expect(sanitizeConnectionString('host=localhost user=admin password=secret')).toBe('host=localhost user=admin password=********')
    })

    it('should preserve query parameters', () => {
      // Port is included in rebuilt URLs
      expect(sanitizeConnectionString('postgresql://user:secret@host/db?sslmode=require')).toBe('postgresql://user:********@host:5432/db?sslmode=require')
    })

    it('should handle connection strings without passwords', () => {
      // Port is included in rebuilt URLs
      expect(sanitizeConnectionString('postgresql://user@host/db')).toBe('postgresql://user@host:5432/db')
    })

    it('should handle malformed strings gracefully', () => {
      expect(sanitizeConnectionString('not-a-valid-string')).toBe('not-a-valid-string')
    })
  })

  describe('validateConnectionString', () => {
    it('should validate correct formats', () => {
      expect(validateConnectionString('postgresql://user:pass@host/db')).toEqual({ valid: true })
      expect(validateConnectionString('host=localhost dbname=mydb')).toEqual({ valid: true })
    })

    it('should reject empty strings', () => {
      expect(validateConnectionString('')).toEqual({ valid: false, error: 'Connection string is required' })
      expect(validateConnectionString('   ')).toEqual({ valid: false, error: 'Connection string cannot be empty' })
    })

    it('should reject invalid formats', () => {
      const result = validateConnectionString('not a connection string')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unrecognized connection string format')
    })
  })

  describe('getConnectionDisplayInfo', () => {
    it('should extract display information', () => {
      const info = getConnectionDisplayInfo('postgresql://user:pass@host:5433/mydb?sslmode=require')
      expect(info).toEqual({
        host: 'host',
        port: 5433,
        database: 'mydb',
        username: 'user',
        hasPassword: true,
        ssl: true
      })
    })

    it('should use defaults for missing values', () => {
      const info = getConnectionDisplayInfo('postgresql://user@host/')
      expect(info).toEqual({
        host: 'host',
        port: 5432,
        database: '',
        username: 'user',
        hasPassword: false,
        ssl: false
      })
    })

    it('should return null for invalid strings', () => {
      expect(getConnectionDisplayInfo('invalid')).toBe(null)
    })

    it('should detect SSL from different parameters', () => {
      expect(getConnectionDisplayInfo('postgresql://user@host/db?ssl=true').ssl).toBe(true)
      expect(getConnectionDisplayInfo('postgresql://user@host/db?sslmode=require').ssl).toBe(true)
      expect(getConnectionDisplayInfo('postgresql://user@host/db?sslmode=disable').ssl).toBe(false)
    })
  })
})