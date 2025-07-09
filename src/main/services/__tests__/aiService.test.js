// Unit tests for AI Service SQL error fixing functionality
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock the settingsStore before importing aiService
vi.mock('../settingsStore', () => ({
  getAISettings: vi.fn().mockReturnValue({
    model: 'qwen2.5-coder:latest',
    enabled: true
  }),
  setAISettings: vi.fn(),
  getSetting: vi.fn(),
  setSetting: vi.fn()
}));

const { generateSQL } = require('../aiService');

// Mock fetch for testing
global.fetch = vi.fn();

describe.skip('AI Service - SQL Error Fixing', () => {
  beforeEach(() => {
    fetch.mockClear();
  });
  
  describe('Error Fix Detection', () => {
    test('detects SQL error fix requests correctly', async () => {
      const errorFixPrompt = `Fix this SQL query that has an error.
      
Original query:
SELECT * FROM commits c JOIN users u ON c.user_id = u.id

Error message:
column c.user_id does not exist

Provide a corrected version of the query that fixes the error.`;
      
      // Mock successful Ollama response
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          response: 'SELECT * FROM commits c JOIN users u ON c.author_id = u.id',
          done: true
        })
      });
      
      const result = await generateSQL(errorFixPrompt, {
        tableName: 'commits',
        allSchemas: [
          {
            tableName: 'commits',
            columns: [
              { name: 'id', dataType: 'integer' },
              { name: 'message', dataType: 'text' },
              { name: 'author_id', dataType: 'integer' }
            ]
          },
          {
            tableName: 'users',
            columns: [
              { name: 'id', dataType: 'integer' },
              { name: 'name', dataType: 'varchar' },
              { name: 'email', dataType: 'varchar' }
            ]
          }
        ]
      });
      
      expect(result.success).toBe(true);
      expect(result.sql).toContain('c.author_id');
      expect(result.method).toBe('ollama');
    });
    
    test('handles regular SQL generation differently from error fixes', async () => {
      const regularPrompt = 'Show all users who committed today';
      
      // Mock successful Ollama response
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          response: 'SELECT DISTINCT u.* FROM users u JOIN commits c ON u.id = c.author_id WHERE DATE(c.created_at) = CURRENT_DATE',
          done: true
        })
      });
      
      const result = await generateSQL(regularPrompt, {
        tableName: 'users',
        allSchemas: []
      });
      
      expect(result.success).toBe(true);
      expect(result.sql).toContain('CURRENT_DATE');
    });
  });
  
  describe('Error Handling', () => {
    test('handles Ollama connection errors gracefully', async () => {
      const prompt = 'Fix this SQL query that has an error.';
      
      // Mock connection failure
      fetch.mockRejectedValueOnce(new Error('fetch failed'));
      
      const result = await generateSQL(prompt, { tableName: 'test' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Ollama is not running');
    });
    
    test('handles missing model errors', async () => {
      const prompt = 'SELECT * FROM users';
      
      // Mock model not found response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'model "qwen2.5-coder:latest" not found'
      });
      
      const result = await generateSQL(prompt, { tableName: 'users' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('AI model not installed');
    });
  });
  
  describe('SQL Extraction', () => {
    test('extracts SQL from responses with extra text', async () => {
      const prompt = 'Fix the SQL error';
      
      // Mock response with explanatory text
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          response: `The error occurs because the column name is wrong. Here's the fixed query:

SELECT * FROM users WHERE status = 'active'

This should work correctly now.`,
          done: true
        })
      });
      
      const result = await generateSQL(prompt, { tableName: 'users' });
      
      expect(result.success).toBe(true);
      expect(result.sql).toBe("SELECT * FROM users WHERE status = 'active'");
      // Should not include the explanatory text
      expect(result.sql).not.toContain('error occurs');
      expect(result.sql).not.toContain('should work');
    });
    
    test('handles multi-line SQL queries correctly', async () => {
      const prompt = 'Complex query';
      
      // Mock response with multi-line SQL
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          response: `SELECT 
    u.name,
    COUNT(c.id) as commit_count
FROM users u
LEFT JOIN commits c ON u.id = c.author_id
GROUP BY u.id, u.name
ORDER BY commit_count DESC;`,
          done: true
        })
      });
      
      const result = await generateSQL(prompt, { tableName: 'users' });
      
      expect(result.success).toBe(true);
      expect(result.sql).toContain('SELECT');
      expect(result.sql).toContain('GROUP BY');
      expect(result.sql).toContain('ORDER BY');
    });
  });
});