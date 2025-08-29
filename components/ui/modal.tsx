import { ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [open])

  const sizeClasses = {
    xs: 'max-w-sm',
    sm: 'max-w-md', 
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    full: 'max-w-4xl'
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 dark:bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`w-full ${sizeClasses[size]} bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-xl shadow-2xl border border-gray-200/60 dark:border-gray-700 my-4 sm:my-8`}
            >
              {title && (
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/60 dark:border-gray-800/60">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="p-4 sm:p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
