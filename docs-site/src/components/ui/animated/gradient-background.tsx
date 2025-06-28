import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GradientBackgroundProps {
  className?: string
  children?: React.ReactNode
}

export function GradientBackground({ className, children }: GradientBackgroundProps) {
  return (
    <div className={cn("relative overflow-hidden w-full", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-transparent" />
      <motion.div
        className="absolute -inset-[10px] opacity-50"
        style={{
          background:
            "radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export function MouseGradient() {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-30 opacity-0 transition-opacity duration-300"
      animate={{
        background: [
          "radial-gradient(600px at 0px 0px, rgba(139, 92, 246, 0.15), transparent 80%)",
        ],
      }}
      onMouseMove={(e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget
        const rect = target.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        target.style.background = `radial-gradient(600px at ${x}px ${y}px, rgba(139, 92, 246, 0.15), transparent 80%)`
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.background = ""
      }}
    />
  )
}