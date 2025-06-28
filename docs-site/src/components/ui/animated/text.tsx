import { motion, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedTextProps {
  text: string
  className?: string
  delay?: number
  duration?: number
}

const textVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
}

export function AnimatedText({ text, className, delay = 0, duration = 0.5 }: AnimatedTextProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{
        duration,
        delay,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      variants={textVariants}
      className={cn(className)}
    >
      {text}
    </motion.div>
  )
}

interface TypewriterTextProps {
  text: string
  className?: string
  delay?: number
  speed?: number
}

export function TypewriterText({ text, className, delay = 0, speed = 0.05 }: TypewriterTextProps) {
  const letters = Array.from(text)
  
  const container = {
    hidden: { opacity: 0 },
    visible: () => ({
      opacity: 1,
      transition: { staggerChildren: speed, delayChildren: delay },
    }),
  }

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  }

  return (
    <motion.h1
      variants={container}
      initial="hidden"
      animate="visible"
      className={cn("inline-flex overflow-visible", className)}
      style={{ paddingBottom: '0.2em' }}
    >
      {letters.map((letter, index) => (
        <motion.span variants={child} key={index} className="inline-block overflow-visible">
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.h1>
  )
}