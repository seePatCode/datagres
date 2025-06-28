import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { hydrateTabsState } from './store/slices/tabsSlice'
import { ThemeInitializer } from './components/ThemeInitializer'
import { Toaster } from './components/ui/toaster'
import './index.css'
import App from './App'

// Renderer startup

// Load persisted tab state on startup
const persistedTabs = localStorage.getItem('redux-tabs')
if (persistedTabs) {
  try {
    const tabsState = JSON.parse(persistedTabs)
    store.dispatch(hydrateTabsState(tabsState))
  } catch (error) {
    // Silently ignore hydration errors - tabs will start fresh
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// QueryClient created, starting React render

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeInitializer>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster />
        </QueryClientProvider>
      </ThemeInitializer>
    </Provider>
  </StrictMode>,
)

// React render initiated

// Smooth transition from loading screen to app with minimum display time
const minDisplayTime = 1000 // 1 second for smooth app startup

const hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen')
  if (loadingScreen) {
    loadingScreen.classList.add('loading-exit')
    setTimeout(() => {
      loadingScreen.remove()
      document.body.style.overflow = 'auto'
    }, 300) // Match the animation duration
  }
}

// Wait for React to render, then enforce minimum display time
setTimeout(() => {
  setTimeout(() => {
    hideLoadingScreen()
  }, minDisplayTime)
}, 100) // Small delay to ensure React has rendered