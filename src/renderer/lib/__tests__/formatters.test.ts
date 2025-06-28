import { describe, it, expect } from 'vitest'
import { formatCellValue, formatCellTooltip, isJsonValue } from '../formatters'

describe('formatters', () => {
  describe('formatCellValue', () => {
    it('should format null values as NULL', () => {
      expect(formatCellValue(null)).toBe('NULL')
      expect(formatCellValue(undefined)).toBe('NULL')
    })

    it('should format string values as-is', () => {
      expect(formatCellValue('hello')).toBe('hello')
      expect(formatCellValue('')).toBe('')
    })

    it('should format numbers as strings', () => {
      expect(formatCellValue(123)).toBe('123')
      expect(formatCellValue(0)).toBe('0')
      expect(formatCellValue(-42.5)).toBe('-42.5')
    })

    it('should format booleans as strings', () => {
      expect(formatCellValue(true)).toBe('true')
      expect(formatCellValue(false)).toBe('false')
    })

    it('should format JSON objects with pretty printing', () => {
      const obj = { name: 'John', age: 30 }
      expect(formatCellValue(obj)).toBe('{\n  "name": "John",\n  "age": 30\n}')
    })

    it('should format JSON arrays with pretty printing', () => {
      const arr = ['apple', 'banana', 'cherry']
      expect(formatCellValue(arr)).toBe('[\n  "apple",\n  "banana",\n  "cherry"\n]')
    })

    it('should format nested JSON objects', () => {
      const nested = {
        user: {
          name: 'Alice',
          preferences: {
            theme: 'dark',
            notifications: true
          }
        }
      }
      const expected = `{
  "user": {
    "name": "Alice",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  }
}`
      expect(formatCellValue(nested)).toBe(expected)
    })
  })

  describe('formatCellTooltip', () => {
    it('should format JSON objects without pretty printing', () => {
      const obj = { name: 'John', age: 30 }
      expect(formatCellTooltip(obj)).toBe('{"name":"John","age":30}')
    })

    it('should format JSON arrays without pretty printing', () => {
      const arr = ['apple', 'banana', 'cherry']
      expect(formatCellTooltip(arr)).toBe('["apple","banana","cherry"]')
    })
  })

  describe('isJsonValue', () => {
    it('should return true for objects', () => {
      expect(isJsonValue({ name: 'John' })).toBe(true)
      expect(isJsonValue({ })).toBe(false) // empty object
    })

    it('should return true for arrays', () => {
      expect(isJsonValue(['apple', 'banana'])).toBe(true)
      expect(isJsonValue([])).toBe(true) // empty array is still JSON
    })

    it('should return false for primitives', () => {
      expect(isJsonValue(null)).toBe(false)
      expect(isJsonValue(undefined)).toBe(false)
      expect(isJsonValue('string')).toBe(false)
      expect(isJsonValue(123)).toBe(false)
      expect(isJsonValue(true)).toBe(false)
    })
  })
})