import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved ? saved === 'dark' : prefersDark
    setDark(isDark)
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  if (!mounted) return null

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
      onClick={toggle}
      className="relative p-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-border hover:border-border-hover transition-all duration-300 shadow-sm hover:shadow-md"
    >
      <motion.div
        animate={{ 
          rotate: dark ? 180 : 0,
          scale: dark ? 0.8 : 1 
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative w-5 h-5"
      >
        {dark ? (
          <Moon className="w-5 h-5 text-labora" />
        ) : (
          <Sun className="w-5 h-5 text-warning-500" />
        )}
      </motion.div>
      
      {/* Glow effect for dark mode */}
      {dark && (
        <div className="absolute inset-0 bg-labora/10 rounded-xl blur-md -z-10" />
      )}
    </motion.button>
  )
}