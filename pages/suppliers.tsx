import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from '@/components/ui/table'
import { PageHeader } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Truck } from 'lucide-react'

type Supplier = {
  id: string
  name: string
  website?: string | null
  contactName?: string | null
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', website: '' })
  const { showToast } = useToast()

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(search.toLowerCase()) ||
    supplier.website?.toLowerCase().includes(search.toLowerCase()) ||
    supplier.contactName?.toLowerCase().includes(search.toLowerCase())
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
          website: formData.website || null 
        }) 
      })
      
      showToast('success', editSupplier ? 'Leverandør oppdatert' : 'Leverandør opprettet')
      setModalOpen(false)
      setEditSupplier(null)
      setFormData({ name: '', website: '' })
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
    setFormData({ name: supplier.name, website: supplier.website || '' })
    setModalOpen(true)
  }

  function openCreate() {
    setEditSupplier(null)
    setFormData({ name: '', website: '' })
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8 px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader 
          title="Leverandører" 
          subtitle="Administrer leverandører og kontaktinformasjon"
          actions={
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Ny leverandør
            </Button>
          }
        />

        <Card className="border-gray-200/60 dark:border-gray-800/60 bg-white/70 dark:bg-gray-900/60 backdrop-blur">
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
                        <TableHead className="font-semibold">Nettside</TableHead>
                        <TableHead className="font-semibold">Kontakt</TableHead>
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
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>
                            {supplier.website ? (
                              <a 
                                className="text-blue-600 hover:text-blue-800 underline text-sm" 
                                href={supplier.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                Besøk nettside
                              </a>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-500">{supplier.contactName || '—'}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
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
        >
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Navn</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                placeholder="Leverandørnavn" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nettside</label>
              <Input 
                value={formData.website} 
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))} 
                placeholder="https://..." 
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editSupplier ? 'Oppdater' : 'Opprett'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Avbryt
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  )
}


