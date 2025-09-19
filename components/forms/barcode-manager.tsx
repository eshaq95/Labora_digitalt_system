import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit, Trash2, Star, StarOff } from 'lucide-react'

type Barcode = {
  id: string
  barcode: string
  type: string
  isPrimary: boolean
  description?: string | null
}

type BarcodeManagerProps = {
  itemId: string
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function BarcodeManager({ itemId, isOpen, onClose, onUpdate }: BarcodeManagerProps) {
  const [barcodes, setBarcodes] = useState<Barcode[]>([])
  const [loading, setLoading] = useState(false)
  const [editingBarcode, setEditingBarcode] = useState<Barcode | null>(null)
  const [newBarcode, setNewBarcode] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newType, setNewType] = useState('GTIN')
  const { showToast } = useToast()

  // Fetch barcodes when modal opens
  useEffect(() => {
    if (isOpen && itemId) {
      fetchBarcodes()
    }
  }, [isOpen, itemId])

  const fetchBarcodes = async () => {
    try {
      const response = await fetch(`/api/items/${itemId}/barcodes`)
      if (response.ok) {
        const data = await response.json()
        setBarcodes(data)
      }
    } catch (error) {
      console.error('Error fetching barcodes:', error)
      showToast('error', 'Kunne ikke laste strekkoder')
    }
  }

  const addBarcode = async () => {
    if (!newBarcode.trim()) {
      showToast('error', 'Strekkode er påkrevd')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/items/${itemId}/barcodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: newBarcode.trim(),
          type: newType,
          description: newDescription.trim() || null,
          isPrimary: barcodes.length === 0 // First barcode is primary by default
        })
      })

      if (response.ok) {
        showToast('success', 'Strekkode lagt til')
        setNewBarcode('')
        setNewDescription('')
        setNewType('GTIN')
        fetchBarcodes()
        onUpdate()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Kunne ikke legge til strekkode')
      }
    } catch (error) {
      console.error('Error adding barcode:', error)
      showToast('error', 'Kunne ikke legge til strekkode')
    } finally {
      setLoading(false)
    }
  }

  const updateBarcode = async (barcodeId: string, updates: Partial<Barcode>) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/items/${itemId}/barcodes/${barcodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        showToast('success', 'Strekkode oppdatert')
        fetchBarcodes()
        onUpdate()
        setEditingBarcode(null)
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Kunne ikke oppdatere strekkode')
      }
    } catch (error) {
      console.error('Error updating barcode:', error)
      showToast('error', 'Kunne ikke oppdatere strekkode')
    } finally {
      setLoading(false)
    }
  }

  const deleteBarcode = async (barcodeId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne strekkoden?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/items/${itemId}/barcodes/${barcodeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('success', 'Strekkode slettet')
        fetchBarcodes()
        onUpdate()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Kunne ikke slette strekkode')
      }
    } catch (error) {
      console.error('Error deleting barcode:', error)
      showToast('error', 'Kunne ikke slette strekkode')
    } finally {
      setLoading(false)
    }
  }

  const setPrimary = async (barcodeId: string) => {
    await updateBarcode(barcodeId, { isPrimary: true })
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Administrer strekkoder" size="lg">
      <div className="space-y-6">
        {/* Add new barcode */}
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-medium mb-3">Legg til ny strekkode</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Strekkode</label>
                <Input
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  placeholder="Skann eller skriv inn strekkode"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GTIN">GTIN</option>
                  <option value="EAN">EAN</option>
                  <option value="UPC">UPC</option>
                  <option value="INTERNAL">Intern</option>
                  <option value="SUPPLIER">Leverandør</option>
                  <option value="QR">QR-kode</option>
                  <option value="OTHER">Annet</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Beskrivelse (valgfri)</label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="f.eks. Leverandørens strekkode"
              />
            </div>
            <Button onClick={addBarcode} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til
            </Button>
          </div>
        </div>

        {/* Existing barcodes */}
        <div>
          <h3 className="font-medium mb-3">Eksisterende strekkoder ({barcodes.length})</h3>
          {barcodes.length === 0 ? (
            <p className="text-gray-500 text-sm">Ingen strekkoder registrert</p>
          ) : (
            <div className="space-y-2">
              {barcodes.map((barcode) => (
                <div
                  key={barcode.id}
                  className={`border rounded-lg p-3 ${
                    barcode.isPrimary ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200'
                  }`}
                >
                  {editingBarcode?.id === barcode.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Strekkode</label>
                          <Input
                            value={editingBarcode.barcode}
                            onChange={(e) => setEditingBarcode({ ...editingBarcode, barcode: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Type</label>
                          <select
                            value={editingBarcode.type}
                            onChange={(e) => setEditingBarcode({ ...editingBarcode, type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="GTIN">GTIN</option>
                            <option value="EAN">EAN</option>
                            <option value="UPC">UPC</option>
                            <option value="INTERNAL">Intern</option>
                            <option value="SUPPLIER">Leverandør</option>
                            <option value="QR">QR-kode</option>
                            <option value="OTHER">Annet</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Beskrivelse</label>
                        <Input
                          value={editingBarcode.description || ''}
                          onChange={(e) => setEditingBarcode({ ...editingBarcode, description: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateBarcode(editingBarcode.id, editingBarcode)}
                          disabled={loading}
                          size="sm"
                        >
                          Lagre
                        </Button>
                        <Button
                          onClick={() => setEditingBarcode(null)}
                          variant="outline"
                          size="sm"
                        >
                          Avbryt
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{barcode.barcode}</span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {barcode.type}
                          </span>
                          {barcode.isPrimary && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Primær
                            </span>
                          )}
                        </div>
                        {barcode.description && (
                          <p className="text-sm text-gray-600 mt-1">{barcode.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!barcode.isPrimary && (
                          <Button
                            onClick={() => setPrimary(barcode.id)}
                            variant="outline"
                            size="sm"
                            title="Sett som primær"
                          >
                            <StarOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => setEditingBarcode(barcode)}
                          variant="outline"
                          size="sm"
                          title="Rediger"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteBarcode(barcode.id)}
                          variant="outline"
                          size="sm"
                          title="Slett"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
