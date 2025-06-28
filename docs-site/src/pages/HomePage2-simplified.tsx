import { motion } from 'framer-motion'
import { HeroSection } from '@/components/sections/hero'
import { DemoSection } from '@/components/sections/demo'
import { Button } from '@/components/button'
import { Card } from '@/components/card'
import { AnimatedText } from '@/components/ui/animated/text'
import { ArrowRight, XCircle } from 'lucide-react'
import { GitHubStars } from '@/components/ui/github-stars'
import { LaunchBanner } from '@/components/ui/launch-banner'
import { Testimonials } from '@/components/ui/testimonials'

export default function HomePage2() {
  return (
    <div className="min-h-screen">
      <LaunchBanner />
      <HeroSection />
      
      {/* Pain Points Section - Simplified to 3 key frustrations */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              Legacy Database Tools Are Killing Your Productivity
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "30+ seconds just to start",
                icon: "⏱️",
              },
              {
                title: "JDBC driver configuration hell",
                icon: "🔧",
              },
              {
                title: "5 clicks to view a table",
                icon: "😤",
              },
            ].map((pain, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card className="p-6 bg-red-950/20 border-red-900/30 text-center hover:bg-red-950/30 hover:border-red-900/50 transition-all duration-300 cursor-default group">
                  <motion.div 
                    className="text-4xl mb-3"
                    whileHover={{ rotate: [-5, 5, -5, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    {pain.icon}
                  </motion.div>
                  <h3 className="font-semibold text-white flex items-center justify-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500 group-hover:text-red-400 transition-colors" />
                    {pain.title}
                  </h3>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Top 4 Only */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Built for Modern Development
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                title: "15 Second Connection",
                description: "Paste. Connect. Browse. That's it.",
                icon: "⚡",
                gradient: "from-violet-600/20 to-purple-600/20",
              },
              {
                title: "Keyboard First",
                description: "Cmd+K for AI SQL. Quick navigation shortcuts.",
                icon: "⌨️",
                gradient: "from-blue-600/20 to-cyan-600/20",
              },
              {
                title: "100MB vs 1GB+",
                description: "Lightweight and fast. Not a memory hog.",
                icon: "🚀",
                gradient: "from-green-600/20 to-emerald-600/20",
              },
              {
                title: "Privacy-First AI",
                description: "SQL generation runs locally. Your data stays yours.",
                icon: "🔒",
                gradient: "from-purple-600/20 to-pink-600/20",
              },
              {
                title: "Secure Credentials",
                description: "OS keychain storage. Auto-reconnect on startup.",
                icon: "🔐",
                gradient: "from-yellow-600/20 to-orange-600/20",
              },
              {
                title: "Edit In-Place",
                description: "Edit data directly. Smart JSON formatting.",
                icon: "✏️",
                gradient: "from-pink-600/20 to-red-600/20",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <Card className={`p-8 bg-gradient-to-br ${feature.gradient} border-gray-800 hover:border-gray-700 transition-all group relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <motion.div 
                    className="text-4xl mb-4 relative z-10"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2 text-white relative z-10">{feature.title}</h3>
                  <p className="text-gray-400 relative z-10">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section - The Star of the Show */}
      <DemoSection />

      {/* Simple CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-violet-950/20 to-transparent" />
        
        <div className="container mx-auto px-4 relative text-center">
          <AnimatedText
            text="Ready to Save 30 Seconds Every Connection?"
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
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
            className="flex flex-col items-center gap-6"
          >
            <a href="https://github.com/seepatcode/datagres/releases">
              <Button 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 text-lg px-8 py-6"
              >
                Download Datagres Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
            
            {/* GitHub Stars Component */}
            <GitHubStars />
          </motion.div>
          
          {/* Testimonials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <Testimonials />
          </motion.div>
        </div>
      </section>
    </div>
  )
}