import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import HomePage2 from './pages/HomePage2-simplified'
import DocsPage from './pages/DocsPage'
import { Button } from '@/components/button'
import { motion } from 'framer-motion'

function App() {
  return (
    <BrowserRouter basename="/datagres">
      <div className="dark min-h-screen bg-gray-950 text-foreground">
        <motion.nav 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 z-50 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl"
        >
          <div className="container mx-auto px-4 flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-3 group">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <img src={`${import.meta.env.BASE_URL}icon.png`} alt="Datagres" className="h-8 w-8" />
                </motion.div>
                <span className="text-lg font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Datagres</span>
              </Link>
              <div className="flex gap-2">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="h-9 text-sm hover:text-white transition-colors">Home</Button>
                </Link>
                <Link to="/docs">
                  <Button variant="ghost" size="sm" className="h-9 text-sm hover:text-white transition-colors">Documentation</Button>
                </Link>
              </div>
            </div>
            <div className="flex gap-3">
              <a href="https://github.com/seepatcode/datagres/releases" target="_blank" rel="noopener noreferrer">
                <Button 
                  size="sm" 
                  className="h-9 text-sm bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-violet-500/20 transition-all duration-300"
                >
                  Download
                </Button>
              </a>
              <a href="https://github.com/seepatcode/datagres" target="_blank" rel="noopener noreferrer">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 text-sm border-gray-700 hover:border-gray-600 hover:bg-gray-900/50 transition-all duration-300"
                >
                  GitHub
                </Button>
              </a>
            </div>
          </div>
        </motion.nav>
        
        <div className="pt-16">
        
        <Routes>
          <Route path="/" element={<HomePage2 />} />
          <Route path="/original" element={<HomePage />} />
          <Route path="/docs" element={<DocsPage />} />
        </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App