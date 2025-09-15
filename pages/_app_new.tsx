import type { AppProps } from 'next/app'
import { useState, useEffect } from 'react'
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ProfileDropdown } from '@/components/ui/profile-dropdown'
import { Tooltip } from '@/components/ui/tooltip'
import dynamic from 'next/dynamic'

// Code splitting for heavy components
const BarcodeScanner = dynamic(() => import('@/components/ui/barcode-scanner').then(mod => ({ default: mod.BarcodeScanner })), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>,
  ssr: false
})

const QuickConsumptionModal = dynamic(() => import('@/components/inventory/quick-consumption-modal').then(mod => ({ default: mod.QuickConsumptionModal })), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>,
  ssr: false
})
import { Package, Truck, Warehouse, ClipboardList, Receipt, Menu, X, Sparkles, BarChart3, Calculator, Scan } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanResult } from '@/app/api/scan-lookup/route'
import '../styles/globals.css'

// Moderne sidebar-navigasjon med logisk gruppering
const sidebarNavigation = [
  {
    title: 'Oversikt',
    items: [
      { href: '/', label: 'Dashboard', icon: Sparkles, description: 'Oversikt og nøkkeltall' }
    ]
  },
  {
    title: 'Innkjøp & Logistikk',
    items: [
      { href: '/orders', label: 'Bestillinger', icon: ClipboardList, description: 'Administrer innkjøpsordrer' },
      { href: '/receipts', label: 'Mottak', icon: Receipt, description: 'Registrer varemottak' }
    ]
  },
  {
    title: 'Lagerstyring',
    items: [
      { href: '/inventory', label: 'Lagerstatus', icon: BarChart3, description: 'Beholdning og partier' },
      { href: '/cycle-counting', label: 'Varetelling', icon: Calculator, description: 'Telling og justering' },
      { href: '/locations', label: 'Lokasjoner', icon: Warehouse, description: 'Lagerplasser og områder' }
    ]
  },
  {
    title: 'Masterdata',
    items: [
      { href: '/items', label: 'Varekartotek', icon: Package, description: 'Varer og produkter' },
      { href: '/suppliers', label: 'Leverandører', icon: Truck, description: 'Leverandører og avtaler' }
    ]
  }
]

function AppContent({ Component, pageProps }: AppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [quickConsumptionOpen, setQuickConsumptionOpen] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const router = useRouter()
  const { user, logout, loading } = useAuth()

  const handleScanSuccess = (result: ScanResult) => {
    setScanResult(result)
    setScannerOpen(false)
    
    // Only open quick consumption for items and lots
    if (result.type === 'ITEM' || result.type === 'LOT') {
      setQuickConsumptionOpen(true)
    } else if (result.type === 'LOCATION') {
      // For locations, navigate to inventory with location filter
      router.push(`/inventory?location=${result.data.id}`)
    }
  }

  const handleQuickConsumptionSuccess = () => {
    // Refresh current page data if needed
    router.reload()
  }

  // Client-side redirect logikk
  useEffect(() => {
    if (loading) return // Vent på auth-sjekk

    // Hvis ikke innlogget og ikke på login-siden, redirect til login
    if (!user && router.pathname !== '/login') {
      router.push('/login')
      return
    }

    // Hvis innlogget og på login-siden, redirect til dashboard
    if (user && router.pathname === '/login') {
      router.push('/')
      return
    }
  }, [user, loading, router])

  // Vis loading mens auth sjekkes eller redirect pågår
  if (loading || (!user && router.pathname !== '/login') || (user && router.pathname === '/login')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-slate-800">
            <Link href="/" className="flex items-center group">
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className="text-xl font-bold text-gray-900 dark:text-white transition-colors group-hover:text-blue-600"
              >
                Labora
              </motion.span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
            {sidebarNavigation.map((section) => (
              <div key={section.title}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="mt-3 space-y-1">
                  {section.items.map(({ href, label, icon: Icon, description }) => {
                    const isActive = router.pathname === href || (href !== '/' && router.pathname.startsWith(href))
                    return (
                      <Link key={href} href={href}>
                        <motion.div
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          <Icon className={`mr-3 h-5 w-5 transition-colors ${
                            isActive 
                              ? 'text-blue-500 dark:text-blue-400' 
                              : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                          }`} />
                          <div className="flex-1">
                            <div>{label}</div>
                            {description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {description}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Right side */}
            <div className="flex items-center gap-4 ml-auto">
              {/* Global Scan & Go Button */}
              {user && (
                <Tooltip content="Scan & Go - Hurtiguttak">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setScannerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Scan className="w-4 h-4" />
                    <span className="hidden sm:inline">Scan & Go</span>
                  </motion.button>
                </Tooltip>
              )}

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Profile Dropdown */}
              {user && (
                <ProfileDropdown user={user} onLogout={logout} />
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-gray-50 dark:bg-slate-950">
          <Component {...pageProps} />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Global Scan & Go Modals */}
      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="🚀 Scan & Go - Hurtiguttak"
        description="Skann strekkode, QR-kode eller Data Matrix med høy zoom for rask vareuttak"
      />

      <QuickConsumptionModal
        isOpen={quickConsumptionOpen}
        onClose={() => setQuickConsumptionOpen(false)}
        scanResult={scanResult}
        onSuccess={handleQuickConsumptionSuccess}
      />
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
