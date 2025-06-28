import { motion } from 'framer-motion'
import { BuyMeCoffee } from '@/components/ui/buy-me-coffee'
import { GitHubStars } from '@/components/ui/github-stars'
import { Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-8">
          {/* Buy Me a Coffee Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-4"
          >
            <p className="text-sm text-gray-400">
              Enjoying Datagres? Support the development
            </p>
            <BuyMeCoffee />
          </motion.div>
          
          {/* Divider */}
          <div className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
          
          {/* Links and Info */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-6 text-sm">
              <a href="https://github.com/seepatcode/datagres" className="text-gray-400 hover:text-white transition-colors">
                GitHub
              </a>
              <a href="https://github.com/seepatcode/datagres/releases" className="text-gray-400 hover:text-white transition-colors">
                Releases
              </a>
              <a href="https://github.com/seepatcode/datagres/issues" className="text-gray-400 hover:text-white transition-colors">
                Issues
              </a>
            </div>
            
            <GitHubStars />
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Made with</span>
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              <span>for developers who value their time</span>
            </div>
            
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} Datagres. Free and open source forever. No catch. No trials. Just free.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}