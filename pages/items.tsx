import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from '@/components/ui/table'
import { PageHeader } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { ExcelImport } from '@/components/ui/excel-import'
import { ItemForm } from '@/components/forms/item-form'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Package, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/router'

type Item = { 
  id: string; 
  sku: string; 
  name: string; 
  manufacturer?: string | null;
  category: string;
  department?: { name: string } | null;
  categoryRef?: { name: string } | null;
  unit: string;
  orderUnit?: string | null;
  conversionFactor?: number | null;
  minStock: number;
  maxStock?: number | null;
  salesPrice?: number | null;
  hazardous: boolean;
  expiryTracking: boolean;
  requiresLotNumber: boolean;
  defaultLocationId?: string | null;
  defaultLocation?: { name: string } | null;
  supplier?: { name: string } | null 
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  const router = useRouter()

  const filteredItems = useMemo(() => 
    items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.department?.name.toLowerCase().includes(search.toLowerCase()) ||
      item.categoryRef?.name.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier?.name.toLowerCase().includes(search.toLowerCase())
    ), [items, search]
  )

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/items', { cache: 'no-store' })
      setItems(await res.json())
    } catch {
      showToast('error', 'Kunne ikke laste varer')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function remove(item: Item) {
    if (!confirm(`Slette "${item.name}"?`)) return
    try {
      await fetch(`/api/items/${item.id}`, { method: 'DELETE' })
      showToast('success', 'Vare slettet')
      await load()
    } catch {
      showToast('error', 'Kunne ikke slette vare')
    }
  }

  function openEdit(item: Item) {
    setEditItem(item)
    setModalOpen(true)
  }

  function openCreate() {
    setEditItem(null)
    setModalOpen(true)
  }

  function createOrderFromItem(item: Item) {
    // Navigate to orders page with pre-filled item info
    router.push(`/orders?suggestItem=${item.id}&suggestName=${encodeURIComponent(item.name)}`)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8 px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader 
          title="Varer" 
          subtitle="Administrer varekartotek med minimumsbeholdning"
          actions={
            <div className="flex gap-2">
              <ExcelImport onImportComplete={load} />
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Ny vare
              </Button>
            </div>
          }
        />

        <Card className="border-gray-200/60 dark:border-gray-800/60 bg-white/70 dark:bg-gray-900/60 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Vareregister
              </CardTitle>
              <SearchInput 
                value={search} 
                onChange={setSearch} 
                placeholder="Søk i varer..." 
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
            ) : filteredItems.length === 0 ? (
              <EmptyState 
                title={search ? 'Ingen treff' : 'Ingen varer ennå'}
                description={search ? 'Prøv et annet søk' : 'Opprett din første vare'}
                action={!search ? <Button onClick={openCreate}>Opprett vare</Button> : undefined}
              />
            ) : (
              <div className="rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableHead className="font-semibold w-40">SKU</TableHead>
                        <TableHead className="font-semibold min-w-60">Navn</TableHead>
                        <TableHead className="font-semibold w-28">Kategori</TableHead>
                        <TableHead className="font-semibold w-36">Leverandør</TableHead>
                        <TableHead className="font-semibold w-32">Status</TableHead>
                        <TableHead className="font-semibold text-right w-24">Min. beholdning</TableHead>
                        <TableHead className="font-semibold text-right w-24">Handlinger</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {filteredItems.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <TableCell className="font-mono text-sm text-gray-600 dark:text-gray-400 w-40">
                          <div className="truncate" title={item.sku}>{item.sku}</div>
                        </TableCell>
                                                       <TableCell className="min-w-60">
                                 <div className="space-y-1">
                                   <div className="font-medium text-sm leading-tight">{item.name}</div>
                                   {item.department && (
                                     <div className="text-xs text-gray-500 dark:text-gray-400">{item.department.name}</div>
                                   )}
                                   {item.manufacturer && (
                                     <div className="text-xs text-gray-400 dark:text-gray-500">Prod: {item.manufacturer}</div>
                                   )}
                                 </div>
                               </TableCell>
                        <TableCell className="w-28">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            item.category === 'HMS' ? 'bg-red-50 text-red-700 border border-red-200' :
                            item.category === 'KJEMI' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            item.category === 'FISKEHELSE' ? 'bg-labora-100 text-labora-800 border border-labora-200' :
                            item.category === 'MIKRO' ? 'bg-green-50 text-green-700 border border-green-200' :
                            item.category === 'IT' ? 'bg-surface text-muted border border-line' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {item.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted w-36">
                          <div className="truncate text-sm" title={item.supplier?.name || '—'}>
                            {item.supplier?.name || '—'}
                          </div>
                        </TableCell>
                        <TableCell className="w-36">
                          <div className="flex flex-col gap-1">
                            {item.hazardous && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg whitespace-nowrap">
                                ⚠️ Farlig
                              </span>
                            )}
                            {item.expiryTracking && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg whitespace-nowrap">
                                📅 Utløp
                              </span>
                            )}
                            {item.requiresLotNumber && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg whitespace-nowrap">
                                🏷️ Lot
                              </span>
                            )}
                            {!item.hazardous && !item.expiryTracking && !item.requiresLotNumber && (
                              <span className="text-xs text-muted">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium w-24">{item.minStock}</TableCell>
                        <TableCell className="text-right w-32">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => createOrderFromItem(item)}
                              className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 hover:text-green-700 dark:hover:text-green-400"
                              title="Lag bestillingsforslag"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(item)}
                              className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => remove(item)}
                              className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 hover:text-red-700 dark:hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        <ItemForm 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          editItem={editItem}
          onSave={load}
        />
      </div>
    </div>
  )
}


