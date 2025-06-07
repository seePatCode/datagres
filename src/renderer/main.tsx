import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './components/theme-provider'
import './index.css'
import App from './App.tsx'

console.log(`[${new Date().toISOString()}] [RENDERER] main.tsx starting execution`)
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