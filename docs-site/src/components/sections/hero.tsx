import { motion } from 'framer-motion'
import { ArrowRight, Database, Sparkles } from 'lucide-react'
import { Button } from '@/components/button'
import { TypewriterText, AnimatedText } from '@/components/ui/animated/text'
import { GradientBackground } from '@/components/ui/animated/gradient-background'
import { DownloadCounter } from '@/components/ui/download-counter'

export function HeroSection() {
  return (
    <GradientBackground className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-7xl mx-auto px-4 py-32">
        <div className="flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 1.5,
          }}
          className="relative inline-block mb-8"
        >
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 opacity-20 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 opacity-30 blur-2xl"
          />
          <Database className="relative h-32 w-32 text-white drop-shadow-2xl" />
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="h-8 w-8 text-yellow-400" />
          </motion.div>
        </motion.div>

        <div className="mb-8 relative">
          <div className="pb-6 pt-2">
            <TypewriterText
              text="Datagres"
              className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-violet-400 gradient-text-fix"
              delay={0.5}
            />
          </div>
        </div>
        
        <AnimatedText
          text="The Lightning-Fast PostgreSQL Explorer"
          className="mx-auto mb-8 max-w-2xl text-xl md:text-2xl text-gray-400"
          delay={1}
        />
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mx-auto mb-12 max-w-xl text-lg text-gray-500"
        >
          Connect and browse data in under 15 seconds. Built for developers who value speed and keyboard efficiency.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="flex gap-4 justify-center"
        >
          <a href="https://github.com/seepatcode/datagres/releases">
            <Button 
              size="lg" 
              className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300"
            >
              Download Now 
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.div>
            </Button>
          </a>
          <a href="https://github.com/seepatcode/datagres">
            <Button 
              size="lg" 
              variant="outline"
              className="border-gray-700 hover:border-gray-600 hover:bg-gray-900/50 transition-all duration-300"
            >
              View on GitHub
            </Button>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="mt-8 flex justify-center"
        >
          <DownloadCounter />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500"
        >
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Zero Config</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Keyboard First</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>OS Keychain Security</span>
          </div>
        </motion.div>
        </div>
      </div>
    </GradientBackground>
  )
}