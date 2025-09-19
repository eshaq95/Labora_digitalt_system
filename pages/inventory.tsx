import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from '@/components/ui/table'
import { PageLayout } from '@/components/layout/page-layout'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { BarcodeScanner } from '@/components/ui/barcode-scanner'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, Clock, Filter, Scan } from 'lucide-react'
import { ScanResult } from '@/app/api/scan-lookup/route'

type InventoryLot = {
  id: string
  quantity: number
  lotNumber: string | null
  expiryDate: string | null
  item: {
    id: string
    sku: string
    name: string
    barcode: string | null
    category: string
    minStock: number
    expiryTracking: boolean
    hazardous: boolean
    barcodes: Array<{
      barcode: string
      type: string
      isPrimary: boolean
    }>
  }
  location: {
    id: string
    name: string
    type: string
  }
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryLot[]>([])
  const [allInventory, setAllInventory] = useState<InventoryLot[]>([]) // For accurate statistics
  const [lowStockCountFromAlerts, setLowStockCountFromAlerts] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'lowStock' | 'expiring'>('all')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    totalUnits: 0
  })
  const { showToast } = useToast()

  // Use inventory directly since filtering is now done server-side
  const filteredInventory = inventory

  // Calculate total units (quantity) on current page
  const totalUnitsOnPage = filteredInventory.reduce((sum, lot) => sum + lot.quantity, 0)

  async function load() {
    setLoading(true)
    try {
      // Load filtered lots for display with pagination
      const params = new URLSearchParams()
      if (filter === 'lowStock') params.set('lowStock', 'true')
      if (filter === 'expiring') params.set('expiringSoon', 'true')
      if (search.trim()) params.set('search', search.trim())
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      
      const res = await fetch(`/api/inventory?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      const lots = data.lots || data
      setInventory(Array.isArray(lots) ? lots : [])
      
      // Update pagination info if available
      if (data.pagination) {
        setPagination(data.pagination)
      }
      
      // Load ALL lots for accurate statistics (without filters)
      const allLotsRes = await fetch('/api/inventory?limit=10000', { cache: 'no-store' })
      const allLotsData = await allLotsRes.json()
      const allLots = allLotsData.lots || allLotsData
      setAllInventory(Array.isArray(allLots) ? allLots : [])

      // Fetch low stock count from alerts endpoint to include items with zero inventory
      try {
        const alertsRes = await fetch('/api/alerts', { cache: 'no-store' })
        if (alertsRes.ok) {
          const alerts = await alertsRes.json()
          setLowStockCountFromAlerts(Array.isArray(alerts.lowStock) ? alerts.lowStock.length : null)
        } else {
          setLowStockCountFromAlerts(null)
        }
      } catch {
        setLowStockCountFromAlerts(null)
      }
    } catch {
      showToast('error', 'Kunne ikke laste lagerstatus')
    } finally {
      setLoading(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Reset to page 1 when search changes
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }))
      } else {
        load()
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [search])

  useEffect(() => { load() }, [filter, pagination.page])
  
  // Reset to page 1 when filter changes
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
  }, [filter])

  const handleScanSuccess = (result: ScanResult) => {
    switch (result.type) {
      case 'LOT':
        // Finn og highlight det spesifikke partiet
        const lotId = result.data.id;
        const lotElement = document.getElementById(`lot-${lotId}`);
        if (lotElement) {
          lotElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          lotElement.classList.add('bg-blue-100', 'border-blue-300');
          setTimeout(() => {
            lotElement.classList.remove('bg-blue-100', 'border-blue-300');
          }, 3000);
        }
        showToast('success', `Parti funnet: ${result.data.item.name}`);
        break;
      
      case 'ITEM':
        // Filtrer på varen
        setSearch(result.data.name);
        showToast('success', `Viser lager for: ${result.data.name}`);
        break;
      
      case 'LOCATION':
        // Filtrer på lokasjon (vi kan utvide dette senere)
        showToast('success', `Lokasjon skannet: ${result.data.name}`);
        break;
      
      default:
        showToast('error', result.message || 'Ukjent kode');
    }
  };

  // Funksjon for å sjekke om en vare har lav TOTAL beholdning (for visning)
  const isLowStock = (lot: InventoryLot) => {
    const itemTotal = allInventory
      .filter(l => l.item.id === lot.item.id)
      .reduce((sum, l) => sum + l.quantity, 0)
    return itemTotal <= lot.item.minStock
  }
  
  const isExpiringSoon = (lot: InventoryLot) => {
    if (!lot.expiryDate) return false
    const expiryDate = new Date(lot.expiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiryDate <= thirtyDaysFromNow
  }

  // Beregn totale enheter (sum av alle quantities fra ALL inventory)
  const totalUnits = allInventory.reduce((sum, lot) => sum + lot.quantity, 0)
  
  // Beregn lav beholdning basert på ALL inventory for accurate statistics
  const itemStockMap = new Map<string, { total: number; minStock: number }>()
  allInventory.forEach(lot => {
    const existing = itemStockMap.get(lot.item.id) || { total: 0, minStock: lot.item.minStock }
    existing.total += lot.quantity
    itemStockMap.set(lot.item.id, existing)
  })
  
  // Antall VARER (ikke lots) med lav total beholdning
  // Konsistent med dashboard: onHand <= minStock
  const lowStockItems = Array.from(itemStockMap.entries()).filter(([_, stock]) => stock.total <= stock.minStock)
  const lowStockCount = lowStockCountFromAlerts ?? lowStockItems.length
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Totale enheter</p>
                  <p className="text-2xl font-bold">{totalUnits}</p>
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
                <div className="flex space-x-2 w-full sm:w-auto">
                  <SearchInput 
                    value={search} 
                    onChange={setSearch} 
                    placeholder="Søk i lager..." 
                    className="flex-1 sm:w-80"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setScannerOpen(true)}
                    className="flex items-center space-x-2"
                  >
                    <Scan className="h-4 w-4" />
                    <span className="hidden sm:inline">Skann</span>
                  </Button>
                </div>
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
                        <TableHead className="font-semibold">Strekkode</TableHead>
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
                          id={`lot-${lot.id}`}
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
                            <div className="space-y-1">
                              {lot.item.barcode && (
                                <div className="text-xs font-mono text-gray-700 dark:text-gray-300">
                                  {lot.item.barcode}
                                </div>
                              )}
                              {lot.item.barcodes && lot.item.barcodes.length > 0 && (
                                <div className="space-y-1">
                                  {lot.item.barcodes.map((bc, idx) => (
                                    <div key={idx} className="flex items-center gap-1">
                                      <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                                        {bc.barcode}
                                      </span>
                                      {bc.isPrimary && (
                                        <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded">
                                          Primær
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {!lot.item.barcode && (!lot.item.barcodes || lot.item.barcodes.length === 0) && (
                                <span className="text-xs text-gray-400 italic">Ingen strekkode</span>
                              )}
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
            
            {/* Pagination Controls */}
            {!loading && inventory.length > 0 && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={!pagination.hasPreviousPage}
                    className="px-3 py-1"
                  >
                    Forrige
                  </Button>
                  
                  {/* Page Numbers */}
                  {(() => {
                    const { page, totalPages } = pagination
                    const pages: (number | string)[] = []
                    
                    // Always show first page
                    if (totalPages > 1) pages.push(1)
                    
                    // Show pages around current page
                    const start = Math.max(2, page - 2)
                    const end = Math.min(totalPages - 1, page + 2)
                    
                    // Add ellipsis if needed
                    if (start > 2) pages.push('...')
                    
                    // Add middle pages
                    for (let i = start; i <= end; i++) {
                      if (i !== 1 && i !== totalPages) pages.push(i)
                    }
                    
                    // Add ellipsis if needed
                    if (end < totalPages - 1) pages.push('...')
                    
                    // Always show last page
                    if (totalPages > 1) pages.push(totalPages)
                    
                    return pages.map((pageNum, index) => (
                      pageNum === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
                      ) : (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum as number }))}
                          className="w-8 h-8 p-0 text-sm"
                        >
                          {pageNum}
                        </Button>
                      )
                    ))
                  })()}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-1"
                  >
                    Neste
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Barcode Scanner Modal */}
        <BarcodeScanner
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          title="Skann Lager"
          description="Skann strekkode eller QR-kode for å finne varer, partier eller lokasjoner"
        />
    </PageLayout>
  )
}
