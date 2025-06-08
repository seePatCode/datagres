import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    // Vite config for main process
    plugins: [
      externalizeDepsPlugin({
        // Exclude our internal modules from externalization
        exclude: [
          './services/connectionStore',
          './services/databaseService',
          './utils/menuBuilder',
          './services/windowManager'
        ]
      })
    ],
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: {
          index: resolve('src/main/index.js')
        },
        output: {
          format: 'cjs',
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          // Ensure all our code is bundled into a single file
          inlineDynamicImports: true
        }
      },
      // Ensure services are bundled
      commonjsOptions: {
        include: [/src\/main/, /node_modules/],
        transformMixedEsModules: true
      },
      // Resolve aliases for cleaner imports
      resolve: {
        alias: {
          '@services': resolve('src/main/services'),
          '@utils': resolve('src/main/utils')
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