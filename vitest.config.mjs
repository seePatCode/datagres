import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    exclude: [
      'node_modules/**',
      'tests/e2e/**',
      'out/**',
      'dist/**',
      'docs-site/**',
      '**/useDoubleShift.test.ts',
      '**/useInfiniteScroll*.test.ts',
      '**/useInfiniteTableData.test.ts',
      '**/quick-search.test.tsx',
      '**/table-view-infinite-scroll.test.tsx'
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