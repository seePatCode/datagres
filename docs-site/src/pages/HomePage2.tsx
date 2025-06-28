import { motion } from 'framer-motion'
import { HeroSection } from '@/components/sections/hero'
import { FeaturesSection } from '@/components/sections/features'
import { DemoSection } from '@/components/sections/demo'
import { Button } from '@/components/button'
import { Card } from '@/components/card'
import { FloatingCard } from '@/components/ui/animated/floating-card'
import { AnimatedText } from '@/components/ui/animated/text'
import { Database, ArrowRight, XCircle } from 'lucide-react'

export default function HomePage2() {

  return (
    <div className="min-h-screen">
      <HeroSection />
      
      {/* Pain Points Section - Modern Design */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 text-white">
              Still Using Legacy Database Tools?
            </h2>
            <p className="text-xl text-gray-400">
              Here's what you're dealing with every day
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "30+ seconds to start",
                description: "Waiting for Java, loading drivers, initializing workspace",
                icon: "⏱️",
              },
              {
                title: "JDBC driver hell",
                description: "Download, configure, troubleshoot, update, repeat",
                icon: "🔧",
              },
              {
                title: "Complex for simple tasks",
                description: "5 clicks and 3 dialogs just to view table data",
                icon: "🤯",
              },
              {
                title: "Memory hungry beasts",
                description: "1GB+ RAM for a database viewer? Really?",
                icon: "🦣",
              },
            ].map((pain, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <FloatingCard floatDelay={index * 0.2}>
                  <Card className="p-6 bg-red-950/20 border-red-900/30 hover:border-red-800/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{pain.icon}</div>
                      <div>
                        <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          {pain.title}
                        </h3>
                        <p className="text-sm text-gray-400">{pain.description}</p>
                      </div>
                    </div>
                  </Card>
                </FloatingCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Interactive Demo Section - Your Original Demo */}
      <DemoSection />

      {/* Performance Metrics - Modern Cards */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Performance That Scales
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { value: "< 2s", label: "Connection Time", icon: "⚡" },
              { value: "1M+", label: "Rows Handled", icon: "📊" },
              { value: "60 FPS", label: "Smooth Scrolling", icon: "🎯" },
            ].map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <FloatingCard floatDelay={index * 0.3}>
                  <Card className="p-8 text-center bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700 hover:border-violet-700/50 transition-all duration-300">
                    <div className="text-5xl mb-4">{metric.icon}</div>
                    <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400 mb-2">
                      {metric.value}
                    </div>
                    <p className="text-gray-400">{metric.label}</p>
                  </Card>
                </FloatingCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Modern Design */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-violet-950/20 to-transparent" />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="absolute inset-0 overflow-hidden"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/20 rounded-full blur-3xl" />
        </motion.div>
        
        <div className="container mx-auto px-4 relative text-center">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ type: "spring", duration: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-8"
          >
            <Database className="h-20 w-20 text-white/80" />
          </motion.div>
          
          <AnimatedText
            text="Ready to Explore Your Data?"
            className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
          />
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto"
          >
            Join the bajillions of developers who've switched to the fastest PostgreSQL explorer
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
            className="flex gap-4 justify-center"
          >
            <a href="https://github.com/seepatcode/datagres/releases">
              <Button 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 text-lg px-8 py-6"
              >
                Download for Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            <a href="https://github.com/seepatcode/datagres">
              <Button 
                size="lg" 
                variant="outline"
                className="border-gray-700 hover:border-gray-600 hover:bg-gray-900/50 transition-all duration-300 text-lg px-8 py-6"
              >
                Star on GitHub
              </Button>
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}