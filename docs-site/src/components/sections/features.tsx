import { motion } from 'framer-motion'
import { Zap, Keyboard, Lock, Database, Sparkles } from 'lucide-react'
import { BentoGrid, BentoGridItem } from '@/components/ui/animated/bento-grid'

const features = [
  {
    title: "Instant Connection",
    description: "Connect in under 2 seconds. No JDBC drivers, no connection pools to configure.",
    icon: <Zap className="h-8 w-8 text-violet-500" />,
    className: "md:col-span-1",
    gradient: "bg-gradient-to-br from-violet-600/20 to-purple-600/20",
    header: (
      <div className="flex items-center justify-center h-32 rounded-lg bg-gradient-to-br from-violet-600/10 to-purple-600/10">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl"
        >
          ⚡
        </motion.div>
      </div>
    ),
  },
  {
    title: "Keyboard First",
    description: "Built for speed. Quick search for tables AND connections. Switch databases instantly.",
    icon: <Keyboard className="h-8 w-8 text-blue-500" />,
    className: "md:col-span-1",
    gradient: "bg-gradient-to-br from-blue-600/20 to-cyan-600/20",
    header: (
      <div className="flex items-center justify-center h-32 rounded-lg bg-gradient-to-br from-blue-600/10 to-cyan-600/10">
        <div className="space-y-2">
          <kbd className="px-2 py-1 text-xs rounded bg-gray-800 border border-gray-700">⇧⇧</kbd>
          <kbd className="px-2 py-1 text-xs rounded bg-gray-800 border border-gray-700 ml-2">⌘K</kbd>
        </div>
      </div>
    ),
  },
  {
    title: "Bank-Level Security",
    description: "Passwords in OS keychain. SSL auto-detection. Code-signed and notarized.",
    icon: <Lock className="h-8 w-8 text-green-500" />,
    className: "md:col-span-1",
    gradient: "bg-gradient-to-br from-green-600/20 to-emerald-600/20",
    header: (
      <div className="flex items-center justify-center h-32 rounded-lg bg-gradient-to-br from-green-600/10 to-emerald-600/10">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <Lock className="h-16 w-16 text-green-500/50" />
        </motion.div>
      </div>
    ),
  },
  {
    title: "AI-Powered SQL",
    description: "Generate complex queries in plain English. Runs locally for complete privacy.",
    icon: <Sparkles className="h-8 w-8 text-purple-500" />,
    className: "md:col-span-2",
    gradient: "bg-gradient-to-br from-purple-600/20 to-pink-600/20",
    header: (
      <div className="flex items-center justify-center h-32 rounded-lg bg-gradient-to-br from-purple-600/10 to-pink-600/10">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0] 
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="relative"
        >
          <Sparkles className="h-16 w-16 text-purple-500/50" />
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 blur-xl bg-purple-500/30"
          />
        </motion.div>
      </div>
    ),
  },
  {
    title: "Zero Configuration",
    description: "No JDBC drivers. No workspace setup. Just paste your connection string and go.",
    icon: <Database className="h-8 w-8 text-orange-500" />,
    className: "md:col-span-1",
    gradient: "bg-gradient-to-br from-orange-600/20 to-red-600/20",
    header: (
      <div className="flex items-center justify-center h-32 rounded-lg bg-gradient-to-br from-orange-600/10 to-red-600/10">
        <div className="text-6xl">🚀</div>
      </div>
    ),
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Why Developers Love Datagres
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Built from the ground up for modern development workflows
          </p>
        </motion.div>

        <BentoGrid className="mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <BentoGridItem
                className={feature.className}
                title={feature.title}
                description={feature.description}
                header={feature.header}
                icon={feature.icon}
                gradient={feature.gradient}
              />
            </motion.div>
          ))}
        </BentoGrid>
      </div>
    </section>
  )
}