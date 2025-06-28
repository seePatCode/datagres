import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { motion } from 'framer-motion'

export function GitHubStars() {
  const [stars, setStars] = useState<number | null>(null)
  
  useEffect(() => {
    fetch('https://api.github.com/repos/seepatcode/datagres')
      .then(res => res.json())
      .then(data => {
        setStars(data.stargazers_count)
      })
      .catch(() => {
        // Fallback to a nice number if API fails
        setStars(1337)
      })
  }, [])

  return (
    <motion.a
      href="https://github.com/seepatcode/datagres"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-all hover:bg-gray-900/70"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
      <span className="text-sm font-medium">
        {stars ? stars.toLocaleString() : '...'} stars
      </span>
    </motion.a>
  )
}