import { useEffect, useState, useMemo } from 'react'
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
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const { showToast } = useToast()
  const router = useRouter()

  const filteredItems = useMemo(() => 
    items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.department?.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(search.toLowerCase())
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
          <ExcelImport onImportComplete={load} />
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
                        <TableHead className="font-semibold w-36">Avdeling</TableHead>
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
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200">
                            {item.category?.name || 'Ukategorisert'}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted w-36">
                          <div className="truncate text-sm">
                            {item.department?.name || '—'}
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
                        <TableCell className="text-right w-40">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/items/${item.id}`)}
                              className="h-8 w-8 p-0 hover:bg-labora-50 dark:hover:bg-labora-900/20 hover:border-labora-300 dark:hover:border-labora-600 hover:text-labora-700 dark:hover:text-labora-400"
                              title="Vis detaljer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
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


