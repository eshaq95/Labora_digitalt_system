import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Link from 'next/link'
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ProfileDropdown } from '@/components/ui/profile-dropdown'
import { Tooltip } from '@/components/ui/tooltip'
import { Package, Truck, Warehouse, ClipboardList, Receipt, Menu, X, Sparkles, BarChart3, Calculator } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Optimalisert navigasjonsstruktur - redusert fra 8 til 6 menypunkter
const navItems = [
  // ARBEIDSFLYT
  { href: '/orders', label: 'Bestillinger', icon: ClipboardList },
  { href: '/receipts', label: 'Mottak', icon: Receipt },
  
  // LAGERSTYRING  
  { href: '/inventory', label: 'Lagerstatus', icon: BarChart3 },
  { href: '/items', label: 'Varekartotek', icon: Package },
  { href: '/cycle-counting', label: 'Varetelling', icon: Calculator },
  
  // GRUNNDATA
  { href: '/suppliers', label: 'Leverandører', icon: Truck },
  { href: '/locations', label: 'Lokasjoner', icon: Warehouse },
]

function AppContent({ Component, pageProps }: AppProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { user, logout, loading } = useAuth()

  // Client-side redirect logikk
  React.useEffect(() => {
    if (loading) return // Vent på auth-sjekk

    // Hvis ikke innlogget og ikke på login-siden
    if (!user && router.pathname !== '/login') {
      router.push('/login')
      return
    }

    // Hvis innlogget og på login-siden
    if (user && router.pathname === '/login') {
      router.push('/')
      return
    }
  }, [user, loading, router])

  // Vis loading mens auth sjekkes eller redirect pågår
  if (loading || (!user && router.pathname !== '/login') || (user && router.pathname === '/login')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-bg-primary dark:bg-slate-950">
        {/* Modern Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center group">
                <motion.span 
                  whileHover={{ scale: 1.05 }}
                  className="text-xl font-bold text-text-primary transition-colors group-hover:text-blue-600"
                >
                  Labora
                </motion.span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const isActive = router.pathname.startsWith(href)
                  return (
                    <Tooltip key={href} content={label}>
                      <Link href={href}>
                        <motion.div
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="hidden xl:inline">{label}</span>
                        </motion.div>
                      </Link>
                    </Tooltip>
                  )
                })}
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-3">
                {/* Profile Dropdown */}
                {user && (
                  <ProfileDropdown user={user} onLogout={logout} />
                )}
                
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface transition-all duration-200"
                >
                  <motion.div
                    animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </motion.div>
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="lg:hidden border-t border-border mt-4 pt-4 pb-4"
                >
                  <div className="space-y-2">
                    {navItems.map(({ href, label, icon: Icon }, index) => {
                      const isActive = router.pathname.startsWith(href)
                      return (
                        <motion.div
                          key={href}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Link
                            href={href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                              isActive
                                ? '!bg-blue-600 text-white !text-white shadow-md [&>*]:!text-white'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            style={isActive ? { backgroundColor: '#2563eb !important', color: '#ffffff !important' } : {}}
                          >
                            <Icon className="w-5 h-5" />
                            {label}
                          </Link>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Theme Toggle - Fixed Top Right */}
        <div className="fixed top-20 right-6 z-50">
          <ThemeToggle />
        </div>

        {/* Page Content */}
        <main className="relative min-h-screen bg-bg-primary dark:bg-slate-950">
          <Component {...pageProps} />
        </main>
      </div>
  )
}

export default function MyApp(props: AppProps) {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent {...props} />
      </AuthProvider>
    </ToastProvider>
  )
}