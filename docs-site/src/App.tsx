import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DocsPage from './pages/DocsPage'
import { Button } from '@/components/button'

function App() {
  return (
    <BrowserRouter basename="/datagres">
      <div className="dark min-h-screen bg-background text-foreground">
        <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <img src="/datagres/icon.png" alt="Datagres" className="h-7 w-7" />
                <span className="text-lg font-semibold">Datagres</span>
              </Link>
              <div className="flex gap-1">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="h-8 text-sm">Home</Button>
                </Link>
                <Link to="/docs">
                  <Button variant="ghost" size="sm" className="h-8 text-sm">Documentation</Button>
                </Link>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="https://github.com/seepatcode/datagres/releases" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="h-8 text-sm">Download</Button>
              </a>
              <a href="https://github.com/seepatcode/datagres" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="h-8 text-sm">GitHub</Button>
              </a>
            </div>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/docs" element={<DocsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App