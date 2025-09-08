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
import { EntityQRCode } from '@/components/ui/qr-code-generator'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Warehouse, QrCode } from 'lucide-react'

type Location = { 
  id: string; 
  name: string; 
  type: string 
}

const locationTypes = {
  MAIN: 'Hovedlager',
  COLD: 'Kjølelager',
  REMOTE: 'Fjernlager',
  OTHER: 'Annet'
}




export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editLocation, setEditLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', type: 'MAIN' })
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedLocationForQR, setSelectedLocationForQR] = useState<Location | null>(null)
  const { showToast } = useToast()

  const filteredLocations = locations.filter(location => 
    location.name.toLowerCase().includes(search.toLowerCase()) ||
    locationTypes[location.type as keyof typeof locationTypes]?.toLowerCase().includes(search.toLowerCase())
  )

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/locations', { cache: 'no-store' })
      const data = await res.json()
      setLocations(Array.isArray(data) ? data : [])
    } catch {
      showToast('error', 'Kunne ikke laste lokasjoner')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) return
    
    try {
      const url = editLocation ? `/api/locations/${editLocation.id}` : '/api/locations'
      const method = editLocation ? 'PATCH' : 'POST'
      
      await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(formData) 
      })
      
      showToast('success', editLocation ? 'Lokasjon oppdatert' : 'Lokasjon opprettet')
      setModalOpen(false)
      setEditLocation(null)
      setFormData({ name: '', type: 'MAIN' })
      await load()
    } catch {
      showToast('error', 'Noe gikk galt')
    }
  }

  async function remove(location: Location) {
    if (!confirm(`Slette "${location.name}"?`)) return
    try {
      await fetch(`/api/locations/${location.id}`, { method: 'DELETE' })
      showToast('success', 'Lokasjon slettet')
      await load()
    } catch {
      showToast('error', 'Kunne ikke slette lokasjon')
    }
  }

  function openEdit(location: Location) {
    setEditLocation(location)
    setFormData({ name: location.name, type: location.type })
    setModalOpen(true)
  }

  function openCreate() {
    setEditLocation(null)
    setFormData({ name: '', type: 'MAIN' })
    setModalOpen(true)
  }

  return (
    <PageLayout
      title="Lokasjoner"
      subtitle="Administrer lagerlokasjoner og lagringssteder"
      actions={
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Ny lokasjon
        </Button>
      }
    >

      <Card className="border-border bg-surface">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="w-5 h-5" />
                Lokasjonsregister
              </CardTitle>
              <SearchInput 
                value={search} 
                onChange={setSearch} 
                placeholder="Søk i lokasjoner..." 
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
            ) : filteredLocations.length === 0 ? (
              <EmptyState 
                title={search ? 'Ingen treff' : 'Ingen lokasjoner ennå'}
                description={search ? 'Prøv et annet søk' : 'Opprett din første lokasjon'}
                action={!search ? <Button onClick={openCreate}>Opprett lokasjon</Button> : undefined}
              />
            ) : (
              <div className="rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableHead className="font-semibold">Navn</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold text-right">Handlinger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLocations.map((location, index) => (
                        <motion.tr
                          key={location.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <TableCell className="font-medium">{location.name}</TableCell>
                          <TableCell>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                              location.type === 'MAIN' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              location.type === 'COLD' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                              location.type === 'REMOTE' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                              'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}>
                              {locationTypes[location.type as keyof typeof locationTypes] || location.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedLocationForQR(location);
                                  setQrModalOpen(true);
                                }}
                                className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 hover:text-green-700 dark:hover:text-green-400"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(location)}
                                className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => remove(location)}
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
          title={editLocation ? 'Rediger lokasjon' : 'Ny lokasjon'}
        >
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Navn</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                placeholder="Lokasjonsnavn" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select 
                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200" 
                value={formData.type} 
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="MAIN">Hovedlager</option>
                <option value="COLD">Kjølelager</option>
                <option value="REMOTE">Fjernlager</option>
                <option value="OTHER">Annet</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editLocation ? 'Oppdater' : 'Opprett'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Avbryt
              </Button>
            </div>
          </form>
        </Modal>

        {/* QR Code Modal */}
        <Modal 
          isOpen={qrModalOpen} 
          onClose={() => setQrModalOpen(false)} 
          title={`QR-kode for ${selectedLocationForQR?.name}`}
        >
          {selectedLocationForQR && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Skriv ut denne QR-koden og fest den på lokasjonen for enkel skanning.
              </p>
              <EntityQRCode
                type="location"
                id={selectedLocationForQR.id}
                name={selectedLocationForQR.name}
                additionalInfo={locationTypes[selectedLocationForQR.type as keyof typeof locationTypes]}
              />
            </div>
          )}
        </Modal>
    </PageLayout>
  )
}