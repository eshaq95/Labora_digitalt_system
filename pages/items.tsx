import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from '@/components/ui/table'
import { PageLayout } from '@/components/layout/page-layout'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { ExcelImport } from '@/components/ui/excel-import'
import { ItemForm } from '@/components/forms/item-form'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Package, ShoppingCart, Upload, Eye } from 'lucide-react'
import { useRouter } from 'next/router'
// import { useItems, useDeleteItem, type Item } from '@/lib/hooks/useItems'
// import { useDebouncedSearch } from '@/lib/hooks/useDebounce'



// HMS-kode hjelpefunksjoner
function getHMSIcon(hmsCodes: string): string {
  const codes = hmsCodes.toUpperCase()
  if (codes.includes('F')) return '🔥' // Brannfarlig
  if (codes.includes('O')) return '💥' // Oksyderende
  if (codes.includes('T+') || codes.includes('T')) return '☠️' // Giftig
  if (codes.includes('XN')) return '⚠️' // Helseskadelig
  if (codes.includes('C')) return '🧪' // Etsende
  return '⚠️' // Generisk varsel
}

function getHMSDescription(hmsCodes: string): string {
  const codes = hmsCodes.toUpperCase()
  const descriptions: string[] = []
  if (codes.includes('F')) descriptions.push('Brannfarlig')
  if (codes.includes('O')) descriptions.push('Oksyderende')
  if (codes.includes('T+')) descriptions.push('Meget giftig')
  else if (codes.includes('T')) descriptions.push('Giftig')
  if (codes.includes('XN')) descriptions.push('Helseskadelig')
  if (codes.includes('C')) descriptions.push('Etsende')
  if (codes.includes('N')) descriptions.push('Miljøfarlig')
  return descriptions.join(', ') || 'Farlig gods'
}


// Item type is now imported from useItems hook

// Hurtigvalg (Presets) basert på faktiske importerte kategorier og avdelinger
const QUICK_FILTERS = [
  {
    id: 'all',
    name: 'Alle',
    icon: '📦',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    filters: { department: null, category: null }
  },
  {
    id: 'hms',
    name: 'HMS',
    icon: '⚠️',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    filters: { department: null, category: 'HMS' }
  },
  {
    id: 'utstyr',
    name: 'Utstyr og Instrumenter',
    icon: '🔬',
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    filters: { department: null, category: 'Utstyr og Instrumenter' }
  },
  {
    id: 'kjemikalier',
    name: 'Medier / kjemikalier',
    icon: '🧪',
    color: 'bg-red-100 text-red-700 border-red-300',
    filters: { department: null, category: 'Medier / kjemikalier' }
  },
  {
    id: 'mikro',
    name: 'Mikrobiologi',
    icon: '🦠',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    filters: { department: 'Mikrobiologi', category: null }
  },
  {
    id: 'kjemi',
    name: 'Kjemi',
    icon: '⚗️',
    color: 'bg-green-100 text-green-700 border-green-300',
    filters: { department: 'Kjemi', category: null }
  },
  {
    id: 'gasser',
    name: 'Gasser',
    icon: '💨',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    filters: { department: null, category: 'Gasser' }
  }
]

type Item = { 
  id: string; 
  sku: string; 
  name: string; 
  manufacturer?: string | null;
  department?: { name: string } | null;
  category?: { name: string } | null;
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
  currentStock: number;
  hmsCodes?: string | null;
  // Barcode fields (legacy single barcode and new multiple barcodes)
  barcode?: string | null;
  barcodes?: { id: string; barcode: string; type: string; isPrimary: boolean; description?: string | null }[];
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('all')
  const [groupBy, setGroupBy] = useState<'department' | 'category' | null>('department')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  const { showToast } = useToast()
  const router = useRouter()
  
  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      })
      
      if (search) params.set('search', search)
      if (selectedDepartment) params.set('department', selectedDepartment)
      if (selectedCategory) params.set('category', selectedCategory)
      
      const res = await fetch(`/api/items?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      
      if (data.items) {
        // New paginated response
        setItems(data.items)
        setTotalItems(data.pagination?.totalCount || 0)
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        // Fallback for old response format
        setItems(data)
        setTotalItems(data.length)
        setTotalPages(1)
      }
    } catch {
      showToast('error', 'Kunne ikke laste varer')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    load() 
  }, [currentPage, itemsPerPage, search, selectedDepartment, selectedCategory])

  // Hent unike avdelinger og kategorier for dropdown-filtre
  const departments = useMemo(() => {
    if (!Array.isArray(items)) return []
    return Array.from(new Set(items.map(item => item.department?.name).filter(Boolean))).sort()
  }, [items])
  
  const categories = useMemo(() => {
    if (!Array.isArray(items)) return []
    return Array.from(new Set(items.map(item => item.category?.name).filter(Boolean))).sort()
  }, [items])

  // Filtrering basert på søk, avdeling og kategori
  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return []
    
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
        item.department?.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.name.toLowerCase().includes(search.toLowerCase())
      
      const matchesDepartment = !selectedDepartment || item.department?.name === selectedDepartment
      const matchesCategory = !selectedCategory || item.category?.name === selectedCategory
      
      return matchesSearch && matchesDepartment && matchesCategory
    })
  }, [items, search, selectedDepartment, selectedCategory])

  // Gruppering av filtrerte varer
  const groupedItems = useMemo(() => {
    if (!groupBy) return { 'Alle varer': filteredItems }

    return filteredItems.reduce((acc, item) => {
      let key = 'Ukategorisert'

      if (groupBy === 'department') {
        key = item.department?.name || 'Ingen avdeling'
      } else if (groupBy === 'category') {
        key = item.category?.name || 'Ingen kategori'
      }

      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(item)
      return acc
    }, {} as Record<string, Item[]>)
  }, [filteredItems, groupBy])

  // Funksjon for å sette hurtigfilter
  function applyQuickFilter(filterId: string) {
    const filter = QUICK_FILTERS.find(f => f.id === filterId)
    if (!filter) return

    setActiveQuickFilter(filterId)
    setSelectedDepartment(filter.filters.department)
    setSelectedCategory(filter.filters.category)
  }

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

  // Pagination functions
  function goToPage(page: number) {
    setCurrentPage(page)
  }

  function changeItemsPerPage(newLimit: number) {
    setItemsPerPage(newLimit)
    setCurrentPage(1) // Reset to first page when changing limit
  }

  function createOrderFromItem(item: Item) {
    // Navigate to orders page with pre-filled item info
    router.push(`/orders?suggestItem=${item.id}&suggestName=${encodeURIComponent(item.name)}`)
  }

  async function handleCsvImport(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const file = formData.get('file') as File
    
    if (!file) {
      showToast('error', 'Velg en fil å importere')
      return
    }

    setImporting(true)
    try {
      const importFormData = new FormData()
      importFormData.append('file', file)
      
      const response = await fetch('/api/items/import/csv', {
        method: 'POST',
        body: importFormData
      })
      
      const result = await response.json()
      
      if (response.ok) {
        showToast('success', result.message)
        setImportModalOpen(false)
        await load()
      } else {
        showToast('error', result.error || 'Import feilet')
        if (result.details) {
          console.error('Import details:', result.details)
        }
      }
    } catch (error) {
      showToast('error', 'Noe gikk galt under import')
      console.error('Import error:', error)
    } finally {
      setImporting(false)
    }
  }

  return (
    <PageLayout
      title="Varer"
      subtitle="Administrer varekartotek med minimumsbeholdning"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importer CSV
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Ny vare
          </Button>
        </div>
      }
    >

      <Card className="border-border bg-surface">
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
            
            {/* Hurtigvalg (Presets) */}
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hurtigvalg:</div>
              <div className="flex flex-wrap gap-2">
                {QUICK_FILTERS.map((filter) => (
                  <motion.button
                    key={filter.id}
                    onClick={() => applyQuickFilter(filter.id)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      activeQuickFilter === filter.id 
                        ? filter.color + ' shadow-md' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="mr-1">{filter.icon}</span>
                    {filter.name}
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Avanserte filtre */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Avdeling:
                </label>
                <select
                  value={selectedDepartment || ''}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value || null)
                    setActiveQuickFilter('') // Clear quick filter when manually filtering
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Alle avdelinger</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Kategori:
                </label>
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value || null)
                    setActiveQuickFilter('') // Clear quick filter when manually filtering
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Alle kategorier</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Grupper etter:
                </label>
                <select
                  value={groupBy || ''}
                  onChange={(e) => setGroupBy(e.target.value as 'department' | 'category' | null || null)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Ingen gruppering</option>
                  <option value="department">Avdeling</option>
                  <option value="category">Kategori</option>
                </select>
              </div>
            </div>
            
            {/* Aktive filtre */}
            {(selectedDepartment || selectedCategory) && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 dark:text-gray-400">Aktive filtre:</span>
                {selectedDepartment && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Avd: {selectedDepartment}
                    <button 
                      onClick={() => setSelectedDepartment(null)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200">
                    Kat: {selectedCategory}
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className="ml-1 text-green-500 hover:text-green-700"
                    >
                      ×
                    </button>
                  </span>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSelectedDepartment(null)
                    setSelectedCategory(null)
                    setActiveQuickFilter('all')
                  }}
                  className="text-xs"
                >
                  Fjern alle filtre
                </Button>
              </div>
            )}
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
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <TableHead className="font-semibold w-32 px-4 py-3 text-left">SKU</TableHead>
                        <TableHead className="font-semibold min-w-48 px-4 py-3 text-left">Navn</TableHead>
                        <TableHead className="font-semibold w-32 px-4 py-3 text-left hidden md:table-cell">Strekkode</TableHead>
                        <TableHead className="font-semibold w-24 px-4 py-3 text-left hidden lg:table-cell">Kategori</TableHead>
                        <TableHead className="font-semibold w-28 px-4 py-3 text-left hidden xl:table-cell">Avdeling</TableHead>
                        <TableHead className="font-semibold w-28 px-4 py-3 text-left">Status</TableHead>
                        <TableHead className="font-semibold w-24 px-4 py-3 text-right">Beholdning</TableHead>
                        <TableHead className="font-semibold w-20 px-4 py-3 text-right">Handlinger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {Object.entries(groupedItems).map(([groupName, itemsInGroup]) => (
                      <React.Fragment key={groupName}>
                        {/* GRUPPE OVERSKRIFT */}
                        {groupBy && Object.keys(groupedItems).length > 1 && (
                          <TableRow className="bg-gray-100 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-700">
                            <TableCell colSpan={8} className="font-bold text-lg py-3 px-4">
                              {groupName} ({itemsInGroup.length} varer)
                            </TableCell>
                          </TableRow>
                        )}

                        {/* VARER I GRUPPEN */}
                        {itemsInGroup.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800"
                      >
                        <TableCell className="font-mono text-sm text-gray-600 dark:text-gray-400 w-32 px-4 py-3">
                          <div className="truncate" title={item.sku}>{item.sku}</div>
                        </TableCell>
                        <TableCell className="min-w-48 px-4 py-3">
                          <div className="space-y-1">
                            <div className="font-medium text-sm leading-tight">{item.name}</div>
                            <div className="flex flex-wrap gap-1 text-xs">
                              {item.department && (
                                <span className="text-gray-500 dark:text-gray-400 lg:hidden">{item.department.name}</span>
                              )}
                              {item.manufacturer && (
                                <span className="text-gray-400 dark:text-gray-500">Prod: {item.manufacturer}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="w-32 px-4 py-3 hidden md:table-cell">
                          <div className="space-y-1">
                            {item.barcode && (
                              <div className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate" title={item.barcode}>
                                {item.barcode}
                              </div>
                            )}
                            {item.barcodes && item.barcodes.length > 0 && (
                              <div className="space-y-1">
                                {item.barcodes.slice(0, 2).map((bc, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate" title={bc.barcode}>
                                      {bc.barcode}
                                    </span>
                                    {bc.isPrimary && (
                                      <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded">
                                        P
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {item.barcodes.length > 2 && (
                                  <div className="text-xs text-gray-400">
                                    +{item.barcodes.length - 2} flere
                                  </div>
                                )}
                              </div>
                            )}
                            {!item.barcode && (!item.barcodes || item.barcodes.length === 0) && (
                              <span className="text-xs text-gray-400 italic">Ingen</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="w-24 px-4 py-3 hidden lg:table-cell">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200">
                            {item.category?.name || 'Ukategorisert'}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted w-28 px-4 py-3 hidden xl:table-cell">
                          <div className="truncate text-sm">
                            {item.department?.name || '—'}
                          </div>
                        </TableCell>
                        <TableCell className="w-28 px-4 py-3">
                          <div className="flex flex-col items-start gap-1">
                            {/* Lagerstatus først (viktigst) */}
                            {item.currentStock === 0 ? (
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-full whitespace-nowrap">
                                🚫 Tomt
                              </span>
                            ) : item.currentStock <= item.minStock ? (
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full whitespace-nowrap">
                                ⚠️ Lav
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full whitespace-nowrap">
                                ✅ OK
                              </span>
                            )}
                            
                            {/* HMS og andre egenskaper */}
                            <div className="flex items-center gap-1">
                              {item.hmsCodes && (
                                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded" title={`HMS: ${item.hmsCodes} - ${getHMSDescription(item.hmsCodes)}`}>
                                  {getHMSIcon(item.hmsCodes)}
                                </span>
                              )}
                              {item.expiryTracking && (
                                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded" title="Utløpsdato-sporing">
                                  📅
                                </span>
                              )}
                              {item.requiresLotNumber && (
                                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded" title="Krever lotnummer">
                                  🏷️
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right w-24 px-4 py-3">
                          <div className="font-medium">
                            <div className={item.currentStock <= item.minStock ? 'text-red-600 font-bold' : ''}>
                              {item.currentStock}
                            </div>
                            <div className="text-gray-500 text-xs">min {item.minStock}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right w-20 px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/items/${item.id}`)}
                              className="h-7 w-7 p-0 hover:bg-labora-50 dark:hover:bg-labora-900/20 hover:border-labora-300 dark:hover:border-labora-600 hover:text-labora-700 dark:hover:text-labora-400"
                              title="Vis detaljer"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => createOrderFromItem(item)}
                              className="h-7 w-7 p-0 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 hover:text-green-700 dark:hover:text-green-400 hidden sm:flex"
                              title="Lag bestillingsforslag"
                            >
                              <ShoppingCart className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(item)}
                              className="h-7 w-7 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 hidden md:flex"
                              title="Rediger"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => remove(item)}
                              className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 hover:text-red-700 dark:hover:text-red-400 hidden lg:flex"
                              title="Slett"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              </div>
              
            )}
            
            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Items per page selector */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Vis:</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => changeItemsPerPage(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                    <option value={1000}>Alle (kan være tregt)</option>
                  </select>
                  <span>av {totalItems} varer</span>
                </div>
                
                {/* Page navigation */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="h-8 px-2"
                    >
                      Første
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 px-2"
                    >
                      Forrige
                    </Button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="h-8 w-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2"
                    >
                      Neste
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2"
                    >
                      Siste
                    </Button>
                  </div>
                )}
                
                {/* Page info */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {totalPages > 1 ? `Side ${currentPage} av ${totalPages}` : `${totalItems} varer totalt`}
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

        {/* CSV Import Modal */}
        <Modal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          title="Importer varekartotek fra CSV"
          size="lg"
        >
          <form onSubmit={handleCsvImport} className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">VAREKARTOTEK.csv Format</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                Filen må inneholde følgende kolonner for å importere både varer og leverandørpriser:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">Vareinfo (Item):</h5>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• <strong>Kartotek ID</strong> - Unik ID</li>
                    <li>• <strong>Name</strong> - Varenavn (påkrevd)</li>
                    <li>• <strong>Produsent</strong> - Produsent</li>
                    <li>• <strong>Avd.</strong> - Avdeling</li>
                    <li>• <strong>Kategori</strong> - Kategori</li>
                    <li>• <strong>Sikkerhet*</strong> - HMS-koder</li>
                    <li>• <strong>Merking/Sertifikat</strong> - Sertifikater</li>
                    <li>• <strong>Plassering</strong> - Standard lokasjon</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">Leverandørinfo (SupplierItem):</h5>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• <strong>Leverandør</strong> - Leverandørnavn</li>
                    <li>• <strong>Best.nr.</strong> - Artikkelnummer</li>
                    <li>• <strong>Pris inkl. rabatt</strong> - Faktisk pris</li>
                    <li>• <strong>Prisavtale</strong> - Avtale referanse</li>
                    <li>• <strong>Forpakning</strong> - Pakningsbeskrivelse</li>
                    <li>• <strong>Enhet per pk</strong> - Antall per pakke</li>
                    <li>• <strong>Link /vedlegg</strong> - Produktlenke</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Viktig:</strong> Arbeidsflyt-kolonner som "1.Bestill antall", "2.Velg prioritet", "Varetelling" 
                  blir ignorert - de tilhører bestillingssystemet, ikke varekartotek.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Velg VAREKARTOTEK CSV-fil <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                name="file"
                accept=".csv,.xlsx,.xls"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Støtter CSV (.csv) og Excel (.xlsx, .xls) filer
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={importing} className="flex-1">
                {importing ? 'Importerer varer og priser...' : 'Importer varekartotek'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setImportModalOpen(false)}
                disabled={importing}
              >
                Avbryt
              </Button>
            </div>
          </form>
        </Modal>
    </PageLayout>
  )
}


