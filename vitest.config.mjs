import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      'node_modules/**',
      'tests/e2e/**',
      'out/**',
      'dist/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'out/',
        'dist/',
        '*.config.js',
        '*.config.mjs'
      ]
    }
  }
})