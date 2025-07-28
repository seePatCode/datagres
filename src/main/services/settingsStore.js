// Settings store for application preferences
let Store, store, storeLoadError, storeInitError

// Dynamic import for ESM module electron-store v10
async function loadElectronStore() {
  try {
    const module = await import('electron-store')
    Store = module.default
  } catch (error) {
    console.error('electron-store not available:', error.message)
    storeLoadError = error
  }
}

// Initialize store after async loading
async function initializeStore() {
  await loadElectronStore()
  
  try {
    // Initialize store if Store is available
    if (Store) {
      store = new Store({
        name: 'settings',
        defaults: {
          theme: 'dark',
          sqlLivePreview: false,
          ai: {
            provider: 'ollama',
            ollamaConfig: {
              model: 'qwen2.5-coder:latest',
              url: 'http://localhost:11434'
            },
            claudeCodeConfig: {
              cliPath: '' // User will set this via settings
            }
          }
        }
      })
    }
  } catch (error) {
    console.error('Failed to initialize settings store:', error)
    storeInitError = error
  }
}

// Initialize the store
let initPromise = initializeStore()

// Get AI settings
async function getAISettings() {
  await initPromise
  
  if (!store) {
    // Return defaults if store is not available
    return {
      provider: 'ollama',
      ollamaConfig: {
        model: 'qwen2.5-coder:latest',
        url: 'http://localhost:11434'
      },
      claudeCodeConfig: {}
    }
  }
  
  return store.get('ai')
}

// Update AI settings
async function setAISettings(settings) {
  await initPromise
  
  if (!store) {
    console.error('Cannot save AI settings: store not available')
    return false
  }
  
  store.set('ai', settings)
  return true
}

// Get a specific setting
async function getSetting(key) {
  await initPromise
  
  if (!store) {
    return null
  }
  
  return store.get(key)
}

// Set a specific setting
async function setSetting(key, value) {
  await initPromise
  
  if (!store) {
    console.error(`Cannot save setting ${key}: store not available`)
    return false
  }
  
  store.set(key, value)
  return true
}

module.exports = {
  getAISettings,
  setAISettings,
  getSetting,
  setSetting
}