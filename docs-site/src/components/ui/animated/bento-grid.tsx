import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string
  children?: ReactNode
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[22rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  )
}

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  gradient,
}: {
  className?: string
  title?: string | ReactNode
  description?: string | ReactNode
  header?: ReactNode
  icon?: ReactNode
  gradient?: string
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, translateY: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={cn(
        "relative row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] bg-white border border-transparent",
        "backdrop-blur-sm bg-white/10",
        className
      )}
    >
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover/bento:opacity-100 transition-opacity duration-500">
        <div
          className={cn(
            "absolute inset-0 rounded-xl",
            gradient || "bg-gradient-to-br from-violet-600/20 via-transparent to-blue-600/20"
          )}
        />
      </div>
      <div className="relative z-10 h-full flex flex-col">
        {header}
        <div className="group-hover/bento:translate-x-2 transition duration-200 flex-1">
          {icon}
          <div className="font-sans font-bold text-neutral-200 mb-2 mt-2">
            {title}
          </div>
          <div className="font-sans font-normal text-xs text-neutral-300">
            {description}
          </div>
        </div>
      </div>
    </motion.div>
  )
}