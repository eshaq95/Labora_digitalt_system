import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ToastProvider } from '@/components/ui/toast'
import { Package, Truck, Warehouse, ClipboardList, Receipt, Menu, X, Sparkles, BarChart3, DollarSign } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/items', label: 'Varer', icon: Package },
  { href: '/suppliers', label: 'Leverandører', icon: Truck },
  { href: '/locations', label: 'Lokasjoner', icon: Warehouse },
  { href: '/orders', label: 'Bestillinger', icon: ClipboardList },
  { href: '/receipts', label: 'Mottak', icon: Receipt },
  { href: '/inventory', label: 'Lagerstatus', icon: BarChart3 },
  { href: '/pricing', label: 'Priser', icon: DollarSign },
]

export default function MyApp({ Component, pageProps }: AppProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg-primary">
        {/* Modern Navigation */}
        <nav className="sticky top-0 z-50 nav-modern">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                                   {/* Logo */}
                     <Link href="/" className="flex items-center group">
                       <span className="text-2xl font-bold text-slate-900 dark:text-white transition-all duration-300 group-hover:scale-105 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                         Labora
                       </span>
                     </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const isActive = router.pathname.startsWith(href)
                  return (
                    <Link key={href} href={href}>
                      <motion.div
                        whileTap={{ scale: 0.95 }}
                        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                          isActive
                            ? '!bg-blue-600 text-white !text-white shadow-md shadow-blue-600/25 [&>*]:!text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        style={isActive ? { backgroundColor: '#2563eb !important', color: '#ffffff !important' } : {}}
                      >
                        <Icon className="w-4 h-4" />
                        {label}

                      </motion.div>
                    </Link>
                  )
                })}
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-3">
                <ThemeToggle />
                
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

        {/* Page Content */}
        <main className="relative">
          <Component {...pageProps} />
        </main>
      </div>
    </ToastProvider>
  )
}