import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './components/theme-provider'
import './index.css'
import App from './App.tsx'

console.log(`[${new Date().toISOString()}] [RENDERER] main.tsx starting execution`)
console.log(`[${new Date().toISOString()}] [RENDERER] Loading screen should be visible now`)
console.time('renderer-startup')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

console.log(`[${new Date().toISOString()}] [RENDERER] QueryClient created, starting React render`)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)

console.log(`[${new Date().toISOString()}] [RENDERER] React render initiated`)
console.timeEnd('renderer-startup')

// Smooth transition from loading screen to app with minimum display time
const minDisplayTime = 1000 // 1 second for smooth app startup

const hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen')
  if (loadingScreen) {
    console.log(`[${new Date().toISOString()}] [RENDERER] Hiding loading screen`)
    loadingScreen.classList.add('loading-exit')
    setTimeout(() => {
      loadingScreen.remove()
      document.body.style.overflow = 'auto'
      console.log(`[${new Date().toISOString()}] [RENDERER] Loading screen removed`)
    }, 300) // Match the animation duration
  }
}

// Wait for React to render, then enforce minimum display time
setTimeout(() => {
  console.log(`[${new Date().toISOString()}] [RENDERER] React ready, starting ${minDisplayTime}ms minimum display timer`)
  setTimeout(() => {
    hideLoadingScreen()
  }, minDisplayTime)
}, 100) // Small delay to ensure React has rendered