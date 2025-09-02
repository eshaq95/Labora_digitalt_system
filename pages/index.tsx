import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLayout } from '@/components/layout/page-layout'
import { motion } from 'framer-motion'
import { AlertTriangle, Clock, TrendingUp, Package, Zap, BarChart3, Activity, DollarSign, FileText } from 'lucide-react'

type AlertLow = { itemId: string; name: string; minStock: number; onHand: number }
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
    ;(async () => {
      try {
        // Fetch alerts
        const [alertsRes, priceAlertsRes] = await Promise.all([
          fetch('/api/alerts', { cache: 'no-store' }),
          fetch('/api/price-alerts', { cache: 'no-store' })
        ])
        
        const alertsData = await alertsRes.json()
        const priceAlertsData = await priceAlertsRes.json()
        
        setLow(Array.isArray(alertsData.lowStock) ? alertsData.lowStock : [])
        setExpiring(Array.isArray(alertsData.expiring) ? alertsData.expiring : [])
        setExpiringAgreements(Array.isArray(priceAlertsData.expiringAgreements) ? priceAlertsData.expiringAgreements : [])
        setOutdatedPrices(Array.isArray(priceAlertsData.outdatedPrices) ? priceAlertsData.outdatedPrices : [])
        
        // Fetch stats
        const [itemsRes, ordersRes] = await Promise.all([
          fetch('/api/items', { cache: 'no-store' }),
          fetch('/api/orders', { cache: 'no-store' })
        ])
        
        const itemsData = await itemsRes.json()
        const ordersData = await ordersRes.json()
        
        const totalItems = Array.isArray(itemsData) ? itemsData.length : 0
                       const pendingOrders = Array.isArray(ordersData) 
                 ? ordersData.filter((o: any) => o.status === 'REQUESTED' || o.status === 'APPROVED' || o.status === 'ORDERED').length 
                 : 0
          
        setStats({ totalItems, pendingOrders })
        
      } catch (error) {
        console.error('Kunne ikke laste dashboard data:', error)
    } finally {
      setLoading(false)
    }
    })()
  }, [])

  const dashboardStats = [
    {
      title: "Totalt varer",
      value: stats.totalItems.toString(),
      icon: Package,
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      change: stats.totalItems > 0 ? "Registrerte varer" : "Ingen varer",
      trend: "up"
    },
    {
      title: "Kritisk beholdning",
      value: low.length.toString(),
      icon: AlertTriangle,
      color: "from-amber-500 to-orange-600",
      bgColor: "from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20",
      change: low.length > 0 ? "Krever handling" : "Alt OK",
      trend: low.length > 0 ? "down" : "up"
    },
    {
      title: "Nær utløp",
      value: expiring.length.toString(),
      icon: Clock,
      color: "from-red-500 to-red-600",
      bgColor: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
      change: expiring.length > 0 ? "Se detaljer" : "Ingen varsler",
      trend: expiring.length > 0 ? "down" : "up"
    },
    {
      title: "Pågående bestillinger",
      value: stats.pendingOrders.toString(),
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
      change: stats.pendingOrders > 0 ? "Venter behandling" : "Alle ferdig",
      trend: stats.pendingOrders > 0 ? "up" : "down"
    }
  ]

  return (
    <PageLayout
      title="Lagersystem"
      subtitle="Moderne oversikt over beholdning og kritiske varsler"
      className="bg-gradient-to-br from-neutral-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden group hover:scale-105 transition-all duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-50`} />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-text-secondary">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-text-primary">
                        {stat.value}
                      </p>
                      <div className="flex items-center gap-1">
                        <Activity className={`w-3 h-3 ${stat.trend === 'up' ? 'text-success' : 'text-error'}`} />
                        <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-success' : 'text-error'}`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Low Stock Alert */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="h-full">
          <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Kritisk beholdning</h3>
                    <p className="text-sm text-text-secondary font-normal">
                      Varer som trenger påfyll
                    </p>
                  </div>
                </CardTitle>
          </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-surface rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : low.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-text-primary font-medium">Alle varer har god beholdning</p>
                    <p className="text-text-secondary text-sm mt-1">Ingen kritiske varsler for øyeblikket</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {low.slice(0, 5).map((item, index) => (
                      <motion.div
                        key={item.itemId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                          <span className="font-medium text-text-primary">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                            {item.onHand} / {item.minStock}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            Minimum
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Expiring Items Alert */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Nær utløpsdato</h3>
                    <p className="text-sm text-text-secondary font-normal">
                      Varer som utløper snart
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-surface rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : expiring.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-text-primary font-medium">Ingen varer nær utløp</p>
                    <p className="text-text-secondary text-sm mt-1">Alle datoer ser bra ut</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expiring.slice(0, 5).map((lot, index) => (
                      <motion.div
                        key={lot.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-50 dark:from-red-900/10 dark:to-red-900/10 rounded-xl border border-red-200 dark:border-red-800/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <div>
                            <div className="font-medium text-text-primary">
                              {lot.item?.name || 'Ukjent vare'}
                            </div>
                            <div className="text-xs text-text-tertiary">
                              {lot.location?.name || 'Ukjent lokasjon'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-red-700 dark:text-red-400">
                            {lot.quantity} stk
                          </div>
                          <div className="text-xs text-text-tertiary">
                            {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString('nb-NO') : '—'}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
          </CardContent>
        </Card>
          </motion.div>

          {/* Price & Agreement Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="h-full">
          <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Pris- og avtalevarsler</h3>
                    <p className="text-sm text-text-secondary font-normal">
                      Avtaler og priser som trenger oppfølging
                    </p>
                  </div>
                </CardTitle>
          </CardHeader>
              <CardContent className="space-y-4">
            {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-surface rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : (expiringAgreements.length === 0 && outdatedPrices.length === 0) ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-text-primary font-medium">Alle avtaler er oppdaterte</p>
                    <p className="text-text-secondary text-sm mt-1">Ingen prisvarsler for øyeblikket</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Expiring Agreements */}
                    {expiringAgreements.slice(0, 3).map((agreement, index) => (
                      <motion.div
                        key={`agreement-${agreement.id}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/10 dark:to-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <div>
                            <div className="font-medium text-text-primary">
                              {agreement.supplierName}
                            </div>
                            <div className="text-xs text-text-tertiary">
                              {agreement.agreementReference || 'Avtale utløper'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                            {agreement.daysUntilExpiry} dager
                          </div>
                          <div className="text-xs text-text-tertiary">
                            igjen
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Outdated Prices */}
                    {outdatedPrices.slice(0, 2).map((price, index) => (
                      <motion.div
                        key={`price-${price.id}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (expiringAgreements.length + index) * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-50 dark:from-amber-900/10 dark:to-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                          <div>
                            <div className="font-medium text-text-primary">
                              {price.itemName}
                            </div>
                            <div className="text-xs text-text-tertiary">
                              {price.supplierName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                            {price.daysSinceVerified} dager
                          </div>
                          <div className="text-xs text-text-tertiary">
                            siden sjekk
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
            )}
          </CardContent>
        </Card>
          </motion.div>
        </div>
      </motion.div>
    </PageLayout>
  )
}