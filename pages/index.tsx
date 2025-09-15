import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PageLayout } from '@/components/layout/page-layout'
import { StatHeader } from '@/components/ui/stat-header'
import { StatusChip } from '@/components/ui/status-chip'
import { LowStockTable } from '@/components/ui/compact-table'
import { motion } from 'framer-motion'
import { AlertTriangle, Clock, Package, TrendingUp, BarChart3, FileText, ExternalLink } from 'lucide-react'

type AlertLow = { itemId: string; name: string; minStock: number; onHand: number; department?: string; location?: string }
type Expiring = { id: string; item: { name: string } | null; location: { name: string } | null; expiryDate: string | null; quantity: number }
type ExpiringAgreement = { id: string; itemName: string; supplierName: string; agreementReference: string | null; expiryDate: string | null; daysUntilExpiry: number | null }
type OutdatedPrice = { id: string; itemName: string; supplierName: string; lastVerified: string; daysSinceVerified: number }



export default function Home() {
  const [low, setLow] = useState<AlertLow[]>([])
  const [expiring, setExpiring] = useState<Expiring[]>([])
  const [expiringAgreements, setExpiringAgreements] = useState<ExpiringAgreement[]>([])
  const [outdatedPrices, setOutdatedPrices] = useState<OutdatedPrice[]>([])
  const [stats, setStats] = useState({ totalItems: 0, pendingOrders: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all data in parallel - more efficient
        const [alertsRes, priceAlertsRes, itemsRes, ordersRes] = await Promise.all([
          fetch('/api/alerts'),
          fetch('/api/price-alerts'),
          fetch('/api/items?limit=1000'), // Get more items for accurate stats
          fetch('/api/orders')
        ])
        
        // Process responses efficiently
        const [alertsData, priceAlertsData, itemsData, ordersData] = await Promise.all([
          alertsRes.ok ? alertsRes.json().catch(() => ({ lowStock: [], expiring: [] })) : { lowStock: [], expiring: [] },
          priceAlertsRes.ok ? priceAlertsRes.json().catch(() => ({ expiringAgreements: [], outdatedPrices: [] })) : { expiringAgreements: [], outdatedPrices: [] },
          itemsRes.ok ? itemsRes.json().catch(() => []) : [],
          ordersRes.ok ? ordersRes.json().catch(() => []) : []
        ])
        
        // Update state in batch
        setLow(Array.isArray(alertsData.lowStock) ? alertsData.lowStock : [])
        setExpiring(Array.isArray(alertsData.expiring) ? alertsData.expiring : [])
        setExpiringAgreements(Array.isArray(priceAlertsData.expiringAgreements) ? priceAlertsData.expiringAgreements : [])
        setOutdatedPrices(Array.isArray(priceAlertsData.outdatedPrices) ? priceAlertsData.outdatedPrices : [])
        
        // Handle new paginated response structures
        const items = itemsData.items || itemsData
        const orders = ordersData.orders || ordersData
        
        // Use totalCount from pagination for accurate stats, fallback to array length
        const totalItems = itemsData.pagination?.totalCount || (Array.isArray(items) ? items.length : 0)
        // Calculate pending orders from available data
        const pendingOrders = Array.isArray(orders) 
          ? orders.filter((o: any) => o.status === 'REQUESTED' || o.status === 'APPROVED' || o.status === 'ORDERED').length 
          : (ordersData.pagination?.totalCount || 0)
          
        setStats({ totalItems, pendingOrders })
        
      } catch (error) {
        console.error('Kunne ikke laste dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

    fetchDashboardData()
  }, [])

  // Convert to low stock table format
  const lowStockItems = low.map(item => ({
    id: item.itemId,
    name: item.name,
    location: item.location || 'Ukjent lokasjon',
    currentStock: item.onHand,
    minStock: item.minStock,
    department: item.department,
    isCritical: item.onHand === 0
  }))

  if (loading) {
    return (
      <PageLayout
        title="Lagersystem"
        subtitle="Oversikt over beholdning og kritiske varsler"
        className="bg-slate-50"
      >
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </PageLayout>
    )
  }

  

  return (
    <PageLayout
      title="Lagersystem"
      subtitle="Oversikt over beholdning og kritiske varsler"
      className="bg-slate-50"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {/* Primary Action */}
        <div className="mb-6">
          <Button
            onClick={() => window.location.href = '/scan'}
            className="px-6 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-150 font-medium"
          >
            <Package className="h-5 w-5 mr-2" />
            Scan & Go
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatHeader
            title="Totalt varer"
            value={stats.totalItems}
            subtitle="Registrerte varer"
            icon={<Package className="h-4 w-4" />}
          />
          <StatHeader
            title="Lav beholdning"
            value={low.length}
            subtitle={low.length > 0 ? "Under minimum" : "Alt OK"}
            icon={<AlertTriangle className="h-4 w-4" />}
            status={low.length > 0 ? "warning" : "success"}
          />
          <StatHeader
            title="Nær utløp"
            value={expiring.length}
            subtitle={expiring.length > 0 ? "Se detaljer" : "Ingen varsler"}
            icon={<Clock className="h-4 w-4" />}
            status={expiring.length > 0 ? "danger" : "success"}
          />
          <StatHeader
            title="Pågående bestillinger"
            value={stats.pendingOrders}
            subtitle={stats.pendingOrders > 0 ? "Venter behandling" : "Alle ferdig"}
            icon={<TrendingUp className="h-4 w-4" />}
            status="success"
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alert */}
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Lav beholdning</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">
                Varer under minimum nivå
              </p>
            </div>
            <div className="p-4">
              {low.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Alle varer har god beholdning</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ingen varer under minimum nivå</p>
                </div>
              ) : (
                <div>
                  <LowStockTable 
                    items={lowStockItems.slice(0, 7)}
                    onItemClick={(item) => window.location.href = `/inventory?highlight=${item.id}`}
                  />
                  {low.length > 7 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Viser {Math.min(7, low.length)} av {low.length} varer
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = '/inventory?lowStock=true'}
                        className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 h-auto p-0"
                      >
                        Vis alle <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Hurtighandlinger</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">
                Vanlige oppgaver
              </p>
            </div>
            <div className="p-4 space-y-3">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/inventory?expiring=true'}
                className="w-full justify-between text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Vis varer etter utløpsdato
                </div>
                {expiring.length > 0 && (
                  <StatusChip variant="danger" size="sm">
                    {expiring.length}
                  </StatusChip>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/orders'}
                className="w-full justify-start text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <FileText className="h-4 w-4 mr-2" />
                Opprett ny bestilling
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/receipts'}
                className="w-full justify-start text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Package className="h-4 w-4 mr-2" />
                Registrer varemottak
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </PageLayout>
  )
}
