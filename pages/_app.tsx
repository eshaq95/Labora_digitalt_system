import type { AppProps } from 'next/app'
import { useState, useEffect } from 'react'
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ProfileDropdown } from '@/components/ui/profile-dropdown'
import dynamic from 'next/dynamic'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Code splitting for heavy components
const BarcodeScanner = dynamic(() => import('@/components/ui/barcode-scanner').then(mod => ({ default: mod.BarcodeScanner })), {
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p className="text-slate-600 text-xs">Laster skanner...</p>
      </div>
    </div>
  ),
  ssr: false
})

const QuickConsumptionModal = dynamic(() => import('@/components/inventory/quick-consumption-modal').then(mod => ({ default: mod.QuickConsumptionModal })), {
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p className="text-slate-600 text-xs">Laster modal...</p>
      </div>
    </div>
  ),
  ssr: false
})
import { Package, Truck, Warehouse, ClipboardList, Receipt, Menu, X, Sparkles, BarChart3, Calculator, Scan, Camera, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanResult } from '@/app/api/scan-lookup/route'
import GlobalSearchModal from '@/components/ui/global-search-modal'
import '../styles/globals.css'

// Moderne sidebar-navigasjon med logisk gruppering
const sidebarNavigation = [
  {
    title: 'Oversikt',
    items: [
      { href: '/', label: 'Dashboard', icon: Sparkles }
    ]
  },
  {
    title: 'Innkjøp & Logistikk',
    items: [
      { href: '/orders', label: 'Bestillinger', icon: ClipboardList },
      { href: '/receipts', label: 'Mottak', icon: Receipt }
    ]
  },
  {
    title: 'Lagerstyring',
    items: [
      { href: '/inventory', label: 'Lagerstatus', icon: BarChart3 },
      { href: '/cycle-counting', label: 'Varetelling', icon: Calculator },
      { href: '/locations', label: 'Lokasjoner', icon: Warehouse },
      { href: '/initial-sync', label: 'Initial Synkronisering', icon: Scan }
    ]
  },
  {
    title: 'Masterdata',
    items: [
      { href: '/items', label: 'Varekartotek', icon: Package },
      { href: '/suppliers', label: 'Leverandører', icon: Truck }
    ]
  }
]

// Helper function to get count for navigation items
const getItemCount = (href: string, counts: { pendingOrders: number; pendingCounts: number; lowStock: number }) => {
  switch (href) {
    case '/orders':
      return counts.pendingOrders
    case '/cycle-counting':
      return counts.pendingCounts
    case '/inventory':
      return counts.lowStock > 0 ? counts.lowStock : undefined
    default:
      return undefined
  }
}

// React Query temporarily disabled
// function createQueryClient() {
//   return new QueryClient({
//     defaultOptions: {
//       queries: {
//         staleTime: 5 * 60 * 1000,
//         gcTime: 10 * 60 * 1000,
//         retry: (failureCount, error: any) => {
//           if (error?.status >= 400 && error?.status < 500) return false
//           return failureCount < 2
//         },
//         refetchOnWindowFocus: false,
//         refetchOnMount: true,
//       },
//       mutations: {
//         retry: 1,
//       },
//     },
//   })
// }

function AppContent({ Component, pageProps }: AppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [quickConsumptionOpen, setQuickConsumptionOpen] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [counts, setCounts] = useState({ pendingOrders: 0, pendingCounts: 0, lowStock: 0 })
  const [searchOpen, setSearchOpen] = useState(false)
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

  // Fetch sidebar counts
  const fetchCounts = async () => {
    if (!user) return
    
    try {
      const [ordersRes, alertsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/alerts')
      ])
      
      if (ordersRes.ok) {
        const orders = await ordersRes.json()
        const pendingOrders = Array.isArray(orders) 
          ? orders.filter((o: any) => o.status === 'REQUESTED' || o.status === 'APPROVED' || o.status === 'ORDERED').length 
          : 0
        
        setCounts(prev => ({ ...prev, pendingOrders }))
      }
      
      if (alertsRes.ok) {
        const alerts = await alertsRes.json()
        const lowStock = alerts.lowStock?.length || 0
        setCounts(prev => ({ ...prev, lowStock }))
      }
    } catch (error) {
      console.error('Error fetching sidebar counts:', error)
    }
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

  // Fetch counts when user is authenticated (with delay to avoid duplicate calls)
  useEffect(() => {
    if (user) {
      // Delay initial fetch to avoid conflict with dashboard page
      const initialTimeout = setTimeout(fetchCounts, 1000)
      // Refresh counts every 30 seconds
      const interval = setInterval(fetchCounts, 30000)
      return () => {
        clearTimeout(initialTimeout)
        clearInterval(interval)
      }
    }
  }, [user])

  // Global search keyboard shortcut (Cmd/Ctrl-K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // New search functionality
  const handleSearch = async (query: string) => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Search error:', error)
      throw error
    }
  }

  
  // Vis loading mens auth sjekkes eller redirect pågår
  if (loading || (!user && router.pathname !== '/login') || (user && router.pathname === '/login')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-60'} min-h-screen bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-slate-800 transform transition-all duration-150 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full px-3 py-4">
          {/* Logo */}
          <div className={`mb-12 ${sidebarCollapsed ? 'flex justify-center' : 'flex items-center justify-between px-2'}`}>
            {!sidebarCollapsed && (
              <Link href="/" className="flex items-center group">
                <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 transition-colors duration-150 group-hover:text-blue-600">
                  Labora
                </span>
              </Link>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto">
            <div className="flex flex-col space-y-0">
              {sidebarNavigation.map((section, sectionIndex) => (
                <div key={section.title} className="flex flex-col">
                  {/* Seksjonstittel */}
                  {!sidebarCollapsed && (
                    <div className="px-2 pt-3 pb-1 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {section.title}
                    </div>
                  )}
                  
                  {/* Meny-elementer - hver på sin egen rad */}
                  <div className="flex flex-col space-y-1">
                    {section.items.map(({ href, label, icon: Icon }) => {
                      const isActive = router.pathname === href || (href !== '/' && router.pathname.startsWith(href))
                      return (
                        <div key={href} className="w-full">
                          <Link href={href} className="block w-full">
                              <div
                                className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-md transition-colors duration-150 relative ${
                                  isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <Icon className={`h-5 w-5 flex-shrink-0 ${sidebarCollapsed ? 'mx-auto' : ''} ${
                                  isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'
                                }`} />
                                {!sidebarCollapsed && (
                                  <span className={`text-sm flex-1 whitespace-nowrap ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                    {label}
                                  </span>
                                )}
                                {/* Count badges */}
                                {(() => {
                                  const count = getItemCount(href, counts)
                                  if (!count || count === 0) return null
                                  
                                  return (
                                    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-2 text-xs font-semibold rounded-full ${
                                      href === '/orders' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        : href === '/inventory'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                    } ${sidebarCollapsed ? 'absolute -top-1 -right-1' : ''}`}>
                                      {count > 99 ? '99+' : count}
                                    </span>
                                  )
                                })()}
                              </div>
                            </Link>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Skillelinje mellom seksjoner */}
                  {sectionIndex < sidebarNavigation.length - 1 && (
                    <div className="my-3 border-t border-neutral-200 dark:border-slate-700" />
                  )}
                </div>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Center - Global Search */}
            <div className="flex-1 max-w-md mx-8">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 text-sm border border-slate-200 dark:border-slate-700"
              >
                <Search className="w-4 h-4" />
                <span className="flex-1 text-left">Søk i varer, bestillinger, leverandører...</span>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                  <span>⌘</span>K
                </kbd>
              </button>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Global Scan & Go Button */}
              {user && (
                <button
                  onClick={() => setScannerOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors duration-150"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan & Go</span>
                </button>
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

        {/* New Global Search Modal */}
        <GlobalSearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSearch={handleSearch}
          onNavigate={(href) => router.push(href)}
        />

        {/* Page Content */}
        <main className="flex-1 bg-slate-50 dark:bg-slate-950">
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
        description="Skann strekkode eller QR-kode for rask vareuttak"
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
