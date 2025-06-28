import { motion } from 'framer-motion'

const testimonials = [
  {
    quote: "Finally, a DB tool that respects my time",
    author: "Senior Backend Engineer",
    company: "YC Startup"
  },
  {
    quote: "Switched from DBeaver. Never looking back",
    author: "Data Engineer",
    company: "Series B SaaS"
  },
  {
    quote: "The Cmd+K AI feature alone is worth it",
    author: "Full Stack Developer",
    company: "FAANG"
  }
]

export function Testimonials() {
  return (
    <div className="flex flex-wrap justify-center gap-6 mt-8">
      {testimonials.map((testimonial, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          viewport={{ once: true }}
          className="max-w-sm"
        >
          <blockquote className="text-center">
            <p className="text-gray-400 italic">"{testimonial.quote}"</p>
            <footer className="mt-2 text-sm text-gray-500">
              — {testimonial.author}, {testimonial.company}
            </footer>
          </blockquote>
        </motion.div>
      ))}
    </div>
  )
}