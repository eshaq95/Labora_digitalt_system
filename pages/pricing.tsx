import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from '@/components/ui/table'
import { PageHeader } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { SupplierItemForm } from '@/components/forms/supplier-item-form'
import { motion } from 'framer-motion'
import { Plus, DollarSign, AlertTriangle, Calendar, Star, Edit, Trash2, ExternalLink } from 'lucide-react'

type SupplierItem = {
  id: string
  itemId: string
  supplierId: string
  supplierPartNumber: string
  listPrice?: number | null
  negotiatedPrice: number
  currency: string
  discountCodeRequired?: string | null
  agreementReference?: string | null
  priceValidUntil?: string | null
  lastVerifiedDate: string
  isPrimarySupplier: boolean
  minimumOrderQty?: number | null
  packSize?: number | null
  productUrl?: string | null
  item: { id: string; name: string; sku: string }
  supplier: { id: string; name: string; shortCode?: string | null }
}

export default function PricingPage() {
  const [supplierItems, setSupplierItems] = useState<SupplierItem[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editSupplierItem, setEditSupplierItem] = useState<SupplierItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'outdated' | 'primary'>('all')
  const { showToast } = useToast()

  const filteredSupplierItems = useMemo(() => {
    let items = supplierItems.filter(si => 
      si.item.name.toLowerCase().includes(search.toLowerCase()) ||
      si.item.sku.toLowerCase().includes(search.toLowerCase()) ||
      si.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      si.supplierPartNumber.toLowerCase().includes(search.toLowerCase())
    )

    if (filter === 'outdated') {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      items = items.filter(si => new Date(si.lastVerifiedDate) < sixMonthsAgo)
    } else if (filter === 'primary') {
      items = items.filter(si => si.isPrimarySupplier)
    }

    return items
  }, [supplierItems, search, filter])

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter === 'outdated') params.set('outdatedOnly', 'true')
      
      const res = await fetch(`/api/supplier-items?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      setSupplierItems(Array.isArray(data) ? data : [])
    } catch {
      showToast('error', 'Kunne ikke laste priser')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  async function remove(supplierItem: SupplierItem) {
    if (!confirm(`Slette pris for "${supplierItem.item.name}" hos ${supplierItem.supplier.name}?`)) return
    try {
      await fetch(`/api/supplier-items/${supplierItem.id}`, { method: 'DELETE' })
      showToast('success', 'Leverandørpris slettet')
      await load()
    } catch {
      showToast('error', 'Kunne ikke slette pris')
    }
  }

  function openEdit(supplierItem: SupplierItem) {
    setEditSupplierItem(supplierItem)
    setModalOpen(true)
  }

  function openCreate() {
    setEditSupplierItem(null)
    setModalOpen(true)
  }

  function isOutdated(supplierItem: SupplierItem): boolean {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    return new Date(supplierItem.lastVerifiedDate) < sixMonthsAgo
  }

  function isExpiringSoon(supplierItem: SupplierItem): boolean {
    if (!supplierItem.priceValidUntil) return false
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return new Date(supplierItem.priceValidUntil) <= thirtyDaysFromNow
  }

  const outdatedCount = supplierItems.filter(isOutdated).length
  const expiringCount = supplierItems.filter(isExpiringSoon).length

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Prisadministrasjon" 
          subtitle="Administrer leverandørpriser, rabattkoder og avtaler"
          actions={
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Ny leverandørpris
            </Button>
          }
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-gray-200/60 dark:border-gray-800/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Totale priser</p>
                  <p className="text-2xl font-bold">{supplierItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/60 dark:border-gray-800/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Utdaterte priser</p>
                  <p className="text-2xl font-bold">{outdatedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/60 dark:border-gray-800/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Utløper snart</p>
                  <p className="text-2xl font-bold">{expiringCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/60 dark:border-gray-800/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Primære leverandører</p>
                  <p className="text-2xl font-bold">{supplierItems.filter(si => si.isPrimarySupplier).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gray-200/60 dark:border-gray-800/60 bg-white/70 dark:bg-gray-900/60 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Prisregister
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
                    variant={filter === 'outdated' ? 'default' : 'ghost'}
                    onClick={() => setFilter('outdated')}
                    className="h-8 px-3 text-xs"
                  >
                    Utdaterte
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === 'primary' ? 'default' : 'ghost'}
                    onClick={() => setFilter('primary')}
                    className="h-8 px-3 text-xs"
                  >
                    Primære
                  </Button>
                </div>
                <SearchInput 
                  value={search} 
                  onChange={setSearch} 
                  placeholder="Søk i priser..." 
                  className="w-full sm:w-80"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredSupplierItems.length === 0 ? (
              <EmptyState 
                title={search ? 'Ingen treff' : 'Ingen priser registrert'}
                description={search ? 'Prøv et annet søk' : 'Opprett din første leverandørpris'}
                action={!search ? <Button onClick={openCreate}>Opprett pris</Button> : undefined}
              />
            ) : (
              <div className="rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableHead className="font-semibold">Vare</TableHead>
                        <TableHead className="font-semibold">Leverandør</TableHead>
                        <TableHead className="font-semibold">Art.nr</TableHead>
                        <TableHead className="font-semibold">Listepris</TableHead>
                        <TableHead className="font-semibold">Labora pris</TableHead>
                        <TableHead className="font-semibold">Rabattkode</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Handlinger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSupplierItems.map((supplierItem, index) => (
                        <motion.tr
                          key={supplierItem.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-sm">{supplierItem.item.name}</div>
                              <div className="text-xs text-gray-500 font-mono">{supplierItem.item.sku}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {supplierItem.isPrimarySupplier && (
                                <Star className="w-4 h-4 text-yellow-500" />
                              )}
                              <div>
                                <div className="font-medium text-sm">{supplierItem.supplier.name}</div>
                                {supplierItem.supplier.shortCode && (
                                  <div className="text-xs text-gray-500">{supplierItem.supplier.shortCode}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-2">
                              <span>{supplierItem.supplierPartNumber}</span>
                              {supplierItem.productUrl && (
                                <a 
                                  href={supplierItem.productUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {supplierItem.listPrice ? (
                              <div className="text-sm">
                                <span className="line-through text-gray-500">
                                  {Number(supplierItem.listPrice).toFixed(2)} {supplierItem.currency}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-sm text-green-600 dark:text-green-400">
                              {Number(supplierItem.negotiatedPrice).toFixed(2)} {supplierItem.currency}
                            </div>
                            {supplierItem.listPrice && (
                              <div className="text-xs text-green-600">
                                {Math.round((1 - Number(supplierItem.negotiatedPrice) / Number(supplierItem.listPrice)) * 100)}% rabatt
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {supplierItem.discountCodeRequired ? (
                              <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono">
                                {supplierItem.discountCodeRequired}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">Ingen kode</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {supplierItem.isPrimarySupplier && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full">
                                  <Star className="w-3 h-3 mr-1" />
                                  Primær
                                </span>
                              )}
                              {isOutdated(supplierItem) && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Utdatert
                                </span>
                              )}
                              {isExpiringSoon(supplierItem) && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-full">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Utløper snart
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(supplierItem)}
                                className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => remove(supplierItem)}
                                className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
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

        <SupplierItemForm 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          editSupplierItem={editSupplierItem}
          onSave={load}
        />
      </div>
    </div>
  )
}
