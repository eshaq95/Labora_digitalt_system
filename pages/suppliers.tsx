import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from '@/components/ui/table'
import { PageLayout } from '@/components/layout/page-layout'
import { SearchInput } from '@/components/ui/search-input'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Truck, Upload, Eye } from 'lucide-react'
import { useRouter } from 'next/router'

type Supplier = {
  id: string
  name: string
  // New CSV-based fields
  orderMethod?: string | null
  website?: string | null
  orderEmail?: string | null
  contactPerson?: string | null
  phone?: string | null
  username?: string | null
  password?: string | null
  notes?: string | null
  // Legacy fields (for backward compatibility)
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  orderingMethod?: string | null
  // Freight fields
  freeShippingThreshold?: number | null
  standardShippingCost?: number | null
  shippingNotes?: string | null
  orderingInstructions?: string | null
}

export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [formData, setFormData] = useState({ 
    name: '', 
    orderMethod: '',
    website: '', 
    orderEmail: '',
    contactPerson: '',
    phone: '',
    username: '',
    password: '',
    notes: '',
    freeShippingThreshold: '',
    standardShippingCost: '',
    shippingNotes: '',
    orderingInstructions: ''
  })
  const { showToast } = useToast()

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(search.toLowerCase()) ||
    supplier.website?.toLowerCase().includes(search.toLowerCase()) ||
    supplier.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
    supplier.contactName?.toLowerCase().includes(search.toLowerCase()) ||
    supplier.orderMethod?.toLowerCase().includes(search.toLowerCase()) ||
    supplier.orderEmail?.toLowerCase().includes(search.toLowerCase())
  )

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/suppliers', { cache: 'no-store' })
      const data = await res.json()
      setSuppliers(Array.isArray(data) ? data : [])
    } catch {
      showToast('error', 'Kunne ikke laste leverandører')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) return
    
    try {
      const url = editSupplier ? `/api/suppliers/${editSupplier.id}` : '/api/suppliers'
      const method = editSupplier ? 'PATCH' : 'POST'
      
      await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          name: formData.name.trim(),
          orderMethod: formData.orderMethod || null,
          website: formData.website || null,
          orderEmail: formData.orderEmail || null,
          contactPerson: formData.contactPerson || null,
          phone: formData.phone || null,
          username: formData.username || null,
          password: formData.password || null,
          notes: formData.notes || null,
          freeShippingThreshold: formData.freeShippingThreshold ? Number(formData.freeShippingThreshold) : null,
          standardShippingCost: formData.standardShippingCost ? Number(formData.standardShippingCost) : null,
          shippingNotes: formData.shippingNotes || null,
          orderingInstructions: formData.orderingInstructions || null
        }) 
      })
      
      showToast('success', editSupplier ? 'Leverandør oppdatert' : 'Leverandør opprettet')
      setModalOpen(false)
      setEditSupplier(null)
      setFormData({ 
        name: '', 
        orderMethod: '',
        website: '', 
        orderEmail: '',
        contactPerson: '',
        phone: '',
        username: '',
        password: '',
        notes: '',
        freeShippingThreshold: '',
        standardShippingCost: '',
        shippingNotes: '',
        orderingInstructions: ''
      })
      await load()
    } catch {
      showToast('error', 'Noe gikk galt')
    }
  }

  async function remove(supplier: Supplier) {
    if (!confirm(`Slette "${supplier.name}"?`)) return
    try {
      await fetch(`/api/suppliers/${supplier.id}`, { method: 'DELETE' })
      showToast('success', 'Leverandør slettet')
      await load()
    } catch {
      showToast('error', 'Kunne ikke slette leverandør')
    }
  }

  function openEdit(supplier: Supplier) {
    setEditSupplier(supplier)
    setFormData({ 
      name: supplier.name,
      orderMethod: supplier.orderMethod || '',
      website: supplier.website || '',
      orderEmail: supplier.orderEmail || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      username: supplier.username || '',
      password: supplier.password || '',
      notes: supplier.notes || '',
      freeShippingThreshold: supplier.freeShippingThreshold?.toString() || '',
      standardShippingCost: supplier.standardShippingCost?.toString() || '',
      shippingNotes: supplier.shippingNotes || '',
      orderingInstructions: supplier.orderingInstructions || ''
    })
    setModalOpen(true)
  }

  function openCreate() {
    setEditSupplier(null)
    setFormData({ 
      name: '', 
      orderMethod: '',
      website: '', 
      orderEmail: '',
      contactPerson: '',
      phone: '',
      username: '',
      password: '',
      notes: '',
      freeShippingThreshold: '',
      standardShippingCost: '',
      shippingNotes: '',
      orderingInstructions: ''
    })
    setModalOpen(true)
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
      
      const response = await fetch('/api/suppliers/import/csv', {
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
      title="Leverandører"
      subtitle="Administrer leverandører og kontaktinformasjon"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importer CSV
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Ny leverandør
          </Button>
        </div>
      }
    >

      <Card className="border-border bg-surface">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Leverandørregister
              </CardTitle>
              <SearchInput 
                value={search} 
                onChange={setSearch} 
                placeholder="Søk i leverandører..." 
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
            ) : filteredSuppliers.length === 0 ? (
              <EmptyState 
                title={search ? 'Ingen treff' : 'Ingen leverandører ennå'}
                description={search ? 'Prøv et annet søk' : 'Opprett din første leverandør'}
                action={!search ? <Button onClick={openCreate}>Opprett leverandør</Button> : undefined}
              />
            ) : (
              <div className="rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableHead className="font-semibold">Navn</TableHead>
                        <TableHead className="font-semibold">Bestillingsmetode</TableHead>
                        <TableHead className="font-semibold">Kontakt</TableHead>
                        <TableHead className="font-semibold">Frakt</TableHead>
                        <TableHead className="font-semibold text-right">Handlinger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.map((supplier, index) => (
                        <motion.tr
                          key={supplier.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div>
                              <div>{supplier.name}</div>
                              {supplier.website && (
                                <a 
                                  className="text-blue-600 hover:text-blue-800 underline text-xs" 
                                  href={supplier.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  Nettside
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {supplier.orderMethod ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {supplier.orderMethod}
                                </span>
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              {supplier.contactPerson && (
                                <div className="font-medium">{supplier.contactPerson}</div>
                              )}
                              {supplier.orderEmail && (
                                <div className="text-gray-600 dark:text-gray-400">{supplier.orderEmail}</div>
                              )}
                              {supplier.phone && (
                                <div className="text-gray-600 dark:text-gray-400">{supplier.phone}</div>
                              )}
                              {!supplier.contactPerson && !supplier.orderEmail && !supplier.phone && (
                                <span className="text-gray-500">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {supplier.freeShippingThreshold ? (
                                <div className="flex items-center gap-1">
                                  <Truck className="w-3 h-3 text-green-600" />
                                  <span className="text-green-600 font-medium">
                                    {supplier.freeShippingThreshold} kr
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/suppliers/${supplier.id}`)}
                                className="h-8 w-8 p-0 hover:bg-labora-50 dark:hover:bg-labora-900/20 hover:border-labora-300 dark:hover:border-labora-600 hover:text-labora-700 dark:hover:text-labora-400"
                                title="Vis detaljer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(supplier)}
                                className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => remove(supplier)}
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

        <Modal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)}
          title={editSupplier ? 'Rediger leverandør' : 'Ny leverandør'}
          size="lg"
        >
          <form onSubmit={save} className="space-y-4">
            {/* Grunnleggende informasjon */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Leverandørnavn <span className="text-red-500">*</span>
              </label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                placeholder="Leverandørnavn" 
                required 
              />
            </div>

            {/* Bestillingsmetoder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bestillingsmetode</label>
                <select
                  value={formData.orderMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Velg metode</option>
                  <option value="Web">Web/Nettside</option>
                  <option value="E-post">E-post</option>
                  <option value="Telefon">Telefon</option>
                  <option value="Portal">Portal/System</option>
                  <option value="Annet">Annet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nettside/Webshop</label>
                <Input 
                  value={formData.website} 
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))} 
                  placeholder="https://..." 
                />
              </div>
            </div>

            {/* Kontaktinformasjon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bestilling E-post</label>
                <Input 
                  type="email"
                  value={formData.orderEmail} 
                  onChange={(e) => setFormData(prev => ({ ...prev, orderEmail: e.target.value }))} 
                  placeholder="bestilling@leverandor.no" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Vår kontaktperson</label>
                <Input 
                  value={formData.contactPerson} 
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))} 
                  placeholder="Navn på kontaktperson" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telefon</label>
              <Input 
                value={formData.phone} 
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} 
                placeholder="+47 xx xx xx xx" 
              />
            </div>

            {/* Innloggingsinformasjon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Brukernavn (webshop)</label>
                <Input 
                  value={formData.username} 
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} 
                  placeholder="Brukernavn for webshop" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Passord (webshop)</label>
                <Input 
                  type="password"
                  value={formData.password} 
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} 
                  placeholder="••••••••" 
                />
                <p className="text-xs text-amber-600 mt-1">⚠️ Vurder sikkerhet ved lagring av passord</p>
              </div>
            </div>

            {/* Fraktinformasjon */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Fraktbetingelser</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Grense for gratis frakt (NOK)</label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.freeShippingThreshold} 
                    onChange={(e) => setFormData(prev => ({ ...prev, freeShippingThreshold: e.target.value }))} 
                    placeholder="2500.00" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Standard fraktkostnad (NOK)</label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.standardShippingCost} 
                    onChange={(e) => setFormData(prev => ({ ...prev, standardShippingCost: e.target.value }))} 
                    placeholder="150.00" 
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium mb-1">Fraktnotater</label>
                <Input 
                  value={formData.shippingNotes} 
                  onChange={(e) => setFormData(prev => ({ ...prev, shippingNotes: e.target.value }))} 
                  placeholder="Spesielle betingelser, miljøgebyr, etc." 
                />
              </div>
            </div>

            {/* Bestillingsinstruksjoner */}
            <div>
              <label className="block text-sm font-medium mb-2">Bestillingsinstruksjoner</label>
              <Input 
                value={formData.orderingInstructions} 
                onChange={(e) => setFormData(prev => ({ ...prev, orderingInstructions: e.target.value }))} 
                placeholder="F.eks. 'Husk å alltid oppgi fakturareferanse XXX'" 
              />
            </div>

            {/* Notater */}
            <div>
              <label className="block text-sm font-medium mb-2">Notater</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Generelle notater, avtaledetaljer, produktinfo..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editSupplier ? 'Oppdater leverandør' : 'Opprett leverandør'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Avbryt
              </Button>
            </div>
          </form>
        </Modal>

        {/* CSV Import Modal */}
        <Modal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          title="Importer leverandører fra CSV"
          size="md"
        >
          <form onSubmit={handleCsvImport} className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">CSV Format</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                Filen må inneholde følgende kolonner:
              </p>
              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <li>• <strong>Name</strong> - Leverandørnavn (påkrevd)</li>
                <li>• <strong>Ordre via</strong> - Bestillingsmetode</li>
                <li>• <strong>Nettside</strong> - Webshop/nettside</li>
                <li>• <strong>Bestilling E-post</strong> - E-post for bestillinger</li>
                <li>• <strong>Vår kontaktperson</strong> - Kontaktperson</li>
                <li>• <strong>Telefon</strong> - Telefonnummer</li>
                <li>• <strong>Brukernavn</strong> - Webshop brukernavn</li>
                <li>• <strong>Passord</strong> - Webshop passord</li>
                <li>• <strong>Info om pris, frakt, avtale, rabatt</strong> - Avtaleinfo</li>
                <li>• <strong>Produkter</strong> - Produktinformasjon</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Velg CSV-fil <span className="text-red-500">*</span>
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
                {importing ? 'Importerer...' : 'Importer leverandører'}
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


