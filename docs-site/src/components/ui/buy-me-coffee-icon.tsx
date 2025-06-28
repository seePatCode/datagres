import { motion } from 'framer-motion'

export function BuyMeCoffeeIcon() {
  return (
    <motion.a
      href="https://www.buymeacoffee.com/seepatcode"
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gray-900/50 border border-gray-800 hover:border-violet-600/50 transition-all group"
    >
      <motion.img 
        src={`${import.meta.env.BASE_URL}bmc-logo.png`}
        alt="Buy Me a Coffee"
        className="h-5 w-5"
        whileHover={{ rotate: -10 }}
        transition={{ type: "spring", stiffness: 300 }}
      />
      <span className="text-sm text-gray-400 group-hover:text-violet-400 transition-colors">
        Support
      </span>
    </motion.a>
  )
}