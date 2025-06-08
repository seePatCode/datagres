import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    // Vite config for main process
    plugins: [
      externalizeDepsPlugin()
    ],
    build: {
      outDir: 'out/main',
      rollupOptions: {
        output: {
          format: 'cjs',
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js'
        }
      }
    }
  },
  preload: {
    // Vite config for preload scripts
    plugins: [
      externalizeDepsPlugin()
    ],
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        output: {
          format: 'cjs',
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js'
        }
      }
    }
  },
  renderer: {
    // Vite config for renderer process
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve('src/renderer')
      }
    },
    build: {
      outDir: 'out/renderer'
    },
    publicDir: resolve('public')
  }
})