import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DemoPage from './pages/DemoPage'
import DocsPage from './pages/DocsPage'
import { Button } from '@/components/button'

function App() {
  return (
    <BrowserRouter basename="/datagres">
      <div className="dark min-h-screen bg-background">
        <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <img src="/datagres/icon.png" alt="Datagres" className="h-8 w-8" />
                <span className="text-xl font-bold">Datagres</span>
              </Link>
              <div className="flex gap-4">
                <Link to="/">
                  <Button variant="ghost" size="sm">Home</Button>
                </Link>
                <Link to="/demo">
                  <Button variant="ghost" size="sm">Interactive Demo</Button>
                </Link>
                <Link to="/docs">
                  <Button variant="ghost" size="sm">Documentation</Button>
                </Link>
              </div>
            </div>
            <div className="flex gap-4">
              <a href="https://github.com/seepatcode/datagres/releases" target="_blank" rel="noopener noreferrer">
                <Button size="sm">Download</Button>
              </a>
              <a href="https://github.com/seepatcode/datagres" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">GitHub</Button>
              </a>
            </div>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/docs" element={<DocsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App