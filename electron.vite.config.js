import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    // Vite config for main process
    build: {
      outDir: 'out/main'
    }
  },
  preload: {
    // Vite config for preload scripts
    build: {
      outDir: 'out/preload'
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
    }
  }
})