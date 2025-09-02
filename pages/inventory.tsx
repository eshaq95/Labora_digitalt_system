import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from '@/components/ui/table'
import { PageLayout } from '@/components/layout/page-layout'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, Clock, Filter } from 'lucide-react'

type InventoryLot = {
  id: string
  quantity: number
  lotNumber: string | null
  expiryDate: string | null
  item: {
    id: string
    sku: string
    name: string
    category: string
    minStock: number
    expiryTracking: boolean
    hazardous: boolean
  }
  location: {
    id: string
    name: string
    type: string
  }
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryLot[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'lowStock' | 'expiring'>('all')
  const { showToast } = useToast()

  const filteredInventory = inventory.filter(lot => 
    lot.item.name.toLowerCase().includes(search.toLowerCase()) ||
    lot.item.sku.toLowerCase().includes(search.toLowerCase()) ||
    lot.location.name.toLowerCase().includes(search.toLowerCase()) ||
    lot.lotNumber?.toLowerCase().includes(search.toLowerCase())
  )

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter === 'lowStock') params.set('lowStock', 'true')
      if (filter === 'expiring') params.set('expiringSoon', 'true')
      
      const res = await fetch(`/api/inventory?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      setInventory(Array.isArray(data) ? data : [])
    } catch {
      showToast('error', 'Kunne ikke laste lagerstatus')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const isLowStock = (lot: InventoryLot) => lot.quantity <= lot.item.minStock
  const isExpiringSoon = (lot: InventoryLot) => {
    if (!lot.expiryDate) return false
    const expiryDate = new Date(lot.expiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiryDate <= thirtyDaysFromNow
  }

  const totalItems = inventory.length
  const lowStockCount = inventory.filter(isLowStock).length
  const expiringCount = inventory.filter(isExpiringSoon).length

  return (
    <PageLayout
      title="Lagerstatus"
      subtitle="Oversikt over beholdning og sporbarhet"
    >

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Totale lagerenheter</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lav beholdning</p>
                  <p className="text-2xl font-bold">{lowStockCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Utløper snart</p>
                  <p className="text-2xl font-bold">{expiringCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-surface">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Lagerregister
              </CardTitle>
              <div className="flex gap-2 items-center">
                {/* Filter buttons */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    onClick={() => setFilter('all')}
                    className="h-8 px-3 text-xs"
                  >
                    Alle
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === 'lowStock' ? 'default' : 'ghost'}
                    onClick={() => setFilter('lowStock')}
                    className="h-8 px-3 text-xs"
                  >
                    Lav beholdning
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === 'expiring' ? 'default' : 'ghost'}
                    onClick={() => setFilter('expiring')}
                    className="h-8 px-3 text-xs"
                  >
                    Utløper snart
                  </Button>
                </div>
                <SearchInput 
                  value={search} 
                  onChange={setSearch} 
                  placeholder="Søk i lager..." 
                  className="w-full sm:w-80"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredInventory.length === 0 ? (
              <EmptyState 
                title={search ? 'Ingen treff' : 'Ingen lagerbeholdning'}
                description={search ? 'Prøv et annet søk' : 'Registrer varemottak for å se lagerstatus'}
              />
            ) : (
              <div className="rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableHead className="font-semibold">Vare</TableHead>
                        <TableHead className="font-semibold">Lokasjon</TableHead>
                        <TableHead className="font-semibold">Beholdning</TableHead>
                        <TableHead className="font-semibold">Lot/Batch</TableHead>
                        <TableHead className="font-semibold">Utløpsdato</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((lot, index) => (
                        <motion.tr
                          key={lot.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{lot.item.name}</div>
                              <div className="text-xs text-gray-500 font-mono">{lot.item.sku}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              lot.location.type === 'MAIN' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              lot.location.type === 'COLD' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                              lot.location.type === 'REMOTE' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                              'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}>
                              {lot.location.name}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{lot.quantity}</span>
                              <span className="text-xs text-gray-500">/ min {lot.item.minStock}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lot.lotNumber ? (
                              <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {lot.lotNumber}
                              </span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {lot.expiryDate ? (
                              <span className={`text-sm ${
                                isExpiringSoon(lot) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {new Date(lot.expiryDate).toLocaleDateString('nb-NO')}
                              </span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {isLowStock(lot) && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Lav beholdning
                                </span>
                              )}
                              {isExpiringSoon(lot) && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-full">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Utløper snart
                                </span>
                              )}
                              {lot.item.hazardous && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-full">
                                  ⚠️ Farlig
                                </span>
                              )}
                              {!isLowStock(lot) && !isExpiringSoon(lot) && !lot.item.hazardous && (
                                <span className="text-xs text-green-600 dark:text-green-400">OK</span>
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
    </PageLayout>
  )
}
