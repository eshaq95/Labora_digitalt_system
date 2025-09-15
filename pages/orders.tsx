import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from '@/components/ui/table'
import { PageLayout } from '@/components/layout/page-layout'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { OrderForm } from '@/components/forms/order-form'
import { motion } from 'framer-motion'
import { Plus, ClipboardList, Package, CheckCircle, Clock, Truck, AlertCircle } from 'lucide-react'
import { useOrders, useUpdateOrderStatus, type Order } from '@/lib/hooks/useOrders'
import { useOptimisticStatus } from '@/lib/hooks/useOptimisticUpdates'
import { useDebouncedSearch } from '@/lib/hooks/useDebounce'
import { useRouter } from 'next/router'

// Order type is now imported from useOrders hook

const orderStatuses = {
  REQUESTED: 'Forespurt',
  APPROVED: 'Godkjent', 
  ORDERED: 'Bestilt',
  PARTIAL: 'Delvis mottatt',
  RECEIVED: 'Fullført',
  CANCELLED: 'Kansellert'
}

const priorityConfig = {
  LOW: { label: 'Normal', color: 'bg-gray-100 text-gray-700', icon: Clock },
  MEDIUM: { label: 'Viktig', color: 'bg-blue-100 text-blue-700', icon: Package },
  HIGH: { label: 'Haster', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  URGENT: { label: 'Kritisk', color: 'bg-red-100 text-red-700', icon: AlertCircle }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  const router = useRouter()
  const { suggestItem, suggestName } = router.query

  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    order.supplier?.name.toLowerCase().includes(search.toLowerCase()) ||
    orderStatuses[order.status as keyof typeof orderStatuses]?.toLowerCase().includes(search.toLowerCase())
  )

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' })
      const data = await res.json()
      // Handle new paginated response structure
      const orders = data.orders || data
      setOrders(Array.isArray(orders) ? orders : [])
    } catch {
      showToast('error', 'Kunne ikke laste bestillinger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    load()
    
    // Handle suggested item from items page
    const { suggestItem, suggestName } = router.query
    if (suggestItem && suggestName) {
      showToast('success', `Forslag: Opprett bestilling for "${suggestName}"`)
    }
  }, [router.query])

  function openCreate() {
    setModalOpen(true)
  }

  // Function to change order status
  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      showToast('success', 'Status oppdatert')
      await load()
    } catch {
      showToast('error', 'Kunne ikke oppdatere status')
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'REQUESTED': return 'bg-gray-100 text-gray-700'
      case 'APPROVED': return 'bg-blue-100 text-blue-700'
      case 'ORDERED': return 'bg-amber-100 text-amber-700'
      case 'PARTIAL': return 'bg-orange-100 text-orange-700'
      case 'RECEIVED': return 'bg-green-100 text-green-700'
      case 'CANCELLED': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  function getNextStatus(currentStatus: string): string | null {
    switch (currentStatus) {
      case 'REQUESTED': return 'APPROVED'
      case 'APPROVED': return 'ORDERED'
      case 'ORDERED': return 'PARTIAL'
      case 'PARTIAL': return 'RECEIVED'
      default: return null
    }
  }

  function registerReceipt(orderId: string) {
    // Navigate to receipts page with order ID
    router.push(`/receipts?orderId=${orderId}`)
  }

  return (
    <PageLayout
      title="Bestillinger"
      subtitle="Administrer innkjøpsbestillinger og ordrer"
      actions={
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Ny bestilling
        </Button>
      }
    >

      <Card className="border-border bg-surface">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Bestillingsregister
              </CardTitle>
              <SearchInput 
                value={search} 
                onChange={setSearch} 
                placeholder="Søk i bestillinger..." 
                className="w-full sm:w-80"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <EmptyState 
                title={search ? 'Ingen treff' : 'Ingen bestillinger ennå'}
                description={search ? 'Prøv et annet søk' : 'Opprett din første bestilling'}
                action={!search ? <Button onClick={openCreate}>Opprett bestilling</Button> : undefined}
              />
            ) : (
              <div className="rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableHead className="font-semibold">Bestillingsnr.</TableHead>
                        <TableHead className="font-semibold">Leverandør</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Prioritet</TableHead>
                        <TableHead className="font-semibold">Forespurt av</TableHead>
                        <TableHead className="font-semibold">Forventet</TableHead>
                        <TableHead className="font-semibold text-right">Handlinger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order, index) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <TableCell className="font-medium font-mono text-sm">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell>
                            {order.supplier?.name || <span className="text-gray-500">—</span>}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(order.status)}`}>
                              {orderStatuses[order.status] || order.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {priorityConfig[order.priority] ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${priorityConfig[order.priority].color}`}>
                                {(() => {
                                  const IconComponent = priorityConfig[order.priority].icon
                                  return <IconComponent className="w-3 h-3" />
                                })()}
                                {priorityConfig[order.priority].label}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {order.requester?.name || 'Ukjent bruker'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {order.requestedDate ? new Date(order.requestedDate).toLocaleDateString('nb-NO', {
                                  day: '2-digit',
                                  month: '2-digit', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : '—'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString('nb-NO') : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {getNextStatus(order.status) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                                  className="text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {getNextStatus(order.status) === 'APPROVED' ? 'Godkjenn' :
                                   getNextStatus(order.status) === 'ORDERED' ? 'Bestill' :
                                   getNextStatus(order.status) === 'PARTIAL' ? 'Delvis' :
                                   'Fullfør'}
                                </Button>
                              )}
                              {(order.status === 'ORDERED' || order.status === 'PARTIAL') && (
                                <Button
                                  size="sm"
                                  onClick={() => registerReceipt(order.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                >
                                  <Package className="w-3 h-3 mr-1" />
                                  Mottak
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <OrderForm 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          onSave={load}
          suggestedItem={suggestItem && suggestName ? { id: suggestItem as string, name: suggestName as string } : undefined}
        />
    </PageLayout>
  )
}