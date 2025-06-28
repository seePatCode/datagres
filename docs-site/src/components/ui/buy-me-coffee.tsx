import { motion } from 'framer-motion'
import { useState } from 'react'

export function BuyMeCoffee() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.a
      href="https://www.buymeacoffee.com/seepatcode"
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-block relative overflow-hidden rounded-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.img 
        src={`${import.meta.env.BASE_URL}black-bmc-button.png`}
        alt="Buy Me a Coffee"
        className="h-12 w-auto"
        animate={{ opacity: isHovered ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.img 
        src={`${import.meta.env.BASE_URL}violet-bmc-button.png`}
        alt="Buy Me a Coffee"
        className="h-12 w-auto absolute top-0 left-0"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-purple-600/20 blur-xl"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.a>
  )
}