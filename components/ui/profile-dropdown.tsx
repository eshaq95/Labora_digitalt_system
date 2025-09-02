import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'

type User = {
  id: string
  email: string
  name: string
  role: string
}

type ProfileDropdownProps = {
  user: User
  onLogout: () => void
}

export function ProfileDropdown({ user, onLogout }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Lukk dropdown når man klikker utenfor
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrator'
      case 'PURCHASER': return 'Innkjøper'
      case 'LAB_USER': return 'Lab-bruker'
      case 'VIEWER': return 'Leser'
      default: return role
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'PURCHASER': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'LAB_USER': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'VIEWER': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-text-secondary">{getRoleDisplayName(user.role)}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 mt-2 w-64 bg-neutral-50 dark:bg-slate-700 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden backdrop-blur-md"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-text-primary">{user.name}</div>
                  <div className="text-sm text-text-secondary">{user.email}</div>
                  <div className={`inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  // TODO: Implementer innstillinger
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-neutral-200 dark:hover:bg-slate-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Innstillinger
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false)
                  onLogout()
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logg ut
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
