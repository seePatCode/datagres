import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { ThemeProvider } from './components/theme-provider'
import { SqlSettingsProvider } from './contexts/SqlSettingsContext'
import './index.css'
import App from './App'

// Renderer startup

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
      <ThemeProvider defaultTheme="system">
        <QueryClientProvider client={queryClient}>
          <SqlSettingsProvider>
            <App />
          </SqlSettingsProvider>
        </QueryClientProvider>
      </ThemeProvider>
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