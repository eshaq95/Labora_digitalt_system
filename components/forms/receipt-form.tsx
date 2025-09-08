import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { BarcodeScanner } from '@/components/ui/barcode-scanner'
import { Plus, Trash2, Package, AlertTriangle, Calendar, Hash, Split, Scan } from 'lucide-react'
import { ScanResult } from '@/app/api/scan-lookup/route'

type ReceiptLine = {
  itemId: string
  item?: { 
    name: string; 
    unit: string; 
    requiresLotNumber: boolean; 
    expiryTracking: boolean; 
    hazardous: boolean;
    defaultLocationId?: string;
  }
  locationId: string
  location?: { name: string }
  quantity: number
  lotNumber?: string
  expiryDate?: string
}

type FormData = {
  orderId?: string
  receivedBy: string
  receivedAt: string
  notes: string
  lines: ReceiptLine[]
}

type Item = { 
  id: string; 
  name: string; 
  unit: string; 
  requiresLotNumber: boolean; 
  expiryTracking: boolean; 
  hazardous: boolean;
  defaultLocationId?: string;
}
type Location = { id: string; name: string; code?: string | null }

interface ReceiptFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  orderId?: string
}

export function ReceiptForm({ isOpen, onClose, onSave, orderId }: ReceiptFormProps) {
  const [formData, setFormData] = useState<FormData>({
    orderId,
    receivedBy: 'System User',
    receivedAt: new Date().toISOString().split('T')[0],
    notes: '',
    lines: []
  })

  const [items, setItems] = useState<Item[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null)
  const { showToast } = useToast()

  // Load reference data
  useEffect(() => {
    Promise.all([
      fetch('/api/items').then(r => r.json()),
      fetch('/api/locations').then(r => r.json())
    ]).then(([itms, locs]) => {
      setItems(itms)
      setLocations(locs)
    }).catch(() => {
      showToast('error', 'Kunne ikke laste referansedata')
    })
  }, [])

  // Load order details if orderId provided
  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(r => r.json())
        .then(order => {
          // Pre-populate lines from order
          const orderLines = order.lines?.map((line: any) => ({
            itemId: line.itemId,
            item: line.item,
            locationId: line.item?.defaultLocationId || '',
            quantity: line.quantityOrdered - line.quantityReceived,
            lotNumber: '',
            expiryDate: ''
          })) || []
          
          setFormData(prev => ({
            ...prev,
            orderId: order.id,
            lines: orderLines
          }))
        })
        .catch(() => {
          showToast('error', 'Kunne ikke laste bestillingsdetaljer')
        })
    }
  }, [orderId])

  function addLine() {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, {
        itemId: '',
        locationId: '',
        quantity: 1,
        lotNumber: '',
        expiryDate: ''
      }]
    }))
  }

  function removeLine(index: number) {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }))
  }

  function updateLine(index: number, field: string, value: any) {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => {
        if (i === index) {
          const updated = { ...line, [field]: value }
          
          // Auto-populate item details and default location
          if (field === 'itemId' && value) {
            const item = items.find(item => item.id === value)
            if (item) {
              updated.item = item
              // Set default location if available and not already set
              if (item.defaultLocationId && !line.locationId) {
                updated.locationId = item.defaultLocationId
              }
            }
          }
          
          return updated
        }
        return line
      })
    }))
  }

  function splitLine(index: number) {
    const line = formData.lines[index]
    if (line.quantity <= 1) return
    
    const splitQuantity = Math.floor(line.quantity / 2)
    const remainingQuantity = line.quantity - splitQuantity
    
    setFormData(prev => ({
      ...prev,
      lines: [
        ...prev.lines.slice(0, index),
        { ...line, quantity: remainingQuantity },
        { ...line, quantity: splitQuantity, lotNumber: '', expiryDate: '' },
        ...prev.lines.slice(index + 1)
      ]
    }))
  }

  const handleScanSuccess = (result: ScanResult) => {
    if (result.type === 'ITEM') {
      const item = result.data;
      
      if (currentLineIndex !== null) {
        // Update existing line
        updateLine(currentLineIndex, 'itemId', item.id);
      } else {
        // Add new line with scanned item
        const newLine: ReceiptLine = {
          itemId: item.id,
          locationId: item.defaultLocationId || '',
          quantity: 1,
          lotNumber: '',
          expiryDate: ''
        };
        
        setFormData(prev => ({
          ...prev,
          lines: [...prev.lines, newLine]
        }));
      }
      
      showToast('success', `Vare lagt til: ${item.name}`);
      setCurrentLineIndex(null);
    } else if (result.type === 'LOCATION') {
      if (currentLineIndex !== null) {
        updateLine(currentLineIndex, 'locationId', result.data.id);
        showToast('success', `Lokasjon valgt: ${result.data.name}`);
        setCurrentLineIndex(null);
      }
    } else {
      showToast('error', result.message || 'Ukjent kode');
    }
  }

  const openScannerForLine = (lineIndex: number) => {
    setCurrentLineIndex(lineIndex);
    setScannerOpen(true);
  }

  const openScannerForNewItem = () => {
    setCurrentLineIndex(null);
    setScannerOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (formData.lines.length === 0) {
      showToast('error', 'Minst én varelinje må legges til')
      return
    }
    
    // Validate all lines
    for (let i = 0; i < formData.lines.length; i++) {
      const line = formData.lines[i]
      
      if (!line.itemId || !line.locationId || line.quantity <= 0) {
        showToast('error', `Linje ${i + 1}: Vare, lokasjon og antall må fylles ut`)
        return
      }
      
      // Validate tracking requirements
      if (line.item?.requiresLotNumber && !line.lotNumber?.trim()) {
        showToast('error', `Linje ${i + 1}: Lot/batch nummer er påkrevd for ${line.item.name}`)
        return
      }
      
      if (line.item?.expiryTracking && !line.expiryDate) {
        showToast('error', `Linje ${i + 1}: Utløpsdato er påkrevd for ${line.item.name}`)
        return
      }
    }

    setLoading(true)
    try {
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: formData.orderId || null,
          receivedBy: formData.receivedBy,
          receivedAt: formData.receivedAt,
          notes: formData.notes || null,
          lines: formData.lines.map(line => ({
            itemId: line.itemId,
            locationId: line.locationId,
            quantity: line.quantity,
            lotNumber: line.lotNumber?.trim() || null,
            expiryDate: line.expiryDate || null
          }))
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ukjent feil')
      }

      showToast('success', 'Varemottak registrert og lagerbeholdning oppdatert')
      onSave()
      onClose()
    } catch (error: any) {
      showToast('error', `Feil: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Registrer varemottak" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mottaksinformasjon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Mottatt dato</label>
            <Input
              type="date"
              value={formData.receivedAt}
              onChange={(e) => setFormData(prev => ({ ...prev, receivedAt: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Mottatt av</label>
            <Input
              value={formData.receivedBy}
              onChange={(e) => setFormData(prev => ({ ...prev, receivedBy: e.target.value }))}
              placeholder="Ditt navn"
              required
            />
          </div>
        </div>

        {/* Varelinjer */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold">Mottatte varer</h4>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={openScannerForNewItem}>
                <Scan className="w-4 h-4 mr-1" />
                Skann vare
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="w-4 h-4 mr-1" />
                Legg til manuelt
              </Button>
            </div>
          </div>

          {formData.lines.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Ingen varer lagt til ennå</p>
                <div className="flex space-x-2 mt-3">
                  <Button type="button" variant="outline" size="sm" onClick={openScannerForNewItem}>
                    <Scan className="w-4 h-4 mr-1" />
                    Skann vare
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={addLine}>
                    <Plus className="w-4 h-4 mr-1" />
                    Legg til manuelt
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {formData.lines.map((line, index) => (
                <Card key={index} className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Første rad: Vare, Lokasjon, Antall */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Vare <span className="text-red-500">*</span>
                          </label>
                          <select
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            value={line.itemId}
                            onChange={(e) => updateLine(index, 'itemId', e.target.value)}
                            required
                          >
                            <option value="">Velg vare</option>
                            {items.map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Lokasjon <span className="text-red-500">*</span>
                          </label>
                          <select
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            value={line.locationId}
                            onChange={(e) => updateLine(index, 'locationId', e.target.value)}
                            required
                          >
                            <option value="">Velg lokasjon</option>
                            {locations.map(location => (
                              <option key={location.id} value={location.id}>
                                {location.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Antall <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="number"
                            className="text-sm"
                            value={line.quantity}
                            onChange={(e) => updateLine(index, 'quantity', Number(e.target.value))}
                            min="1"
                            required
                          />
                        </div>
                      </div>

                      {/* Andre rad: Sporingsfelt (vises kun hvis påkrevd) */}
                      {line.item && (line.item.requiresLotNumber || line.item.expiryTracking) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                          {line.item.requiresLotNumber && (
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                <Hash className="w-3 h-3 inline mr-1" />
                                Lot/Batch nummer <span className="text-red-500">*</span>
                              </label>
                              <Input
                                className="text-sm"
                                value={line.lotNumber || ''}
                                onChange={(e) => updateLine(index, 'lotNumber', e.target.value)}
                                placeholder="LOT123456"
                                required
                              />
                            </div>
                          )}
                          {line.item.expiryTracking && (
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                Utløpsdato <span className="text-red-500">*</span>
                              </label>
                              <Input
                                type="date"
                                className="text-sm"
                                value={line.expiryDate || ''}
                                onChange={(e) => updateLine(index, 'expiryDate', e.target.value)}
                                required
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tredje rad: Vareinfo og handlinger */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                        {line.item && (
                          <div className="flex items-center gap-2 text-xs">
                            <Package className="w-3 h-3 text-gray-500" />
                            <span>Enhet: {line.item.unit}</span>
                            {line.item.hazardous && (
                              <>
                                <span className="text-gray-400">•</span>
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                <span className="text-red-600">Farlig vare</span>
                              </>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          {line.quantity > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => splitLine(index)}
                              className="text-xs"
                            >
                              <Split className="w-3 h-3 mr-1" />
                              Splitt
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLine(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Notater */}
        <div>
          <label className="block text-sm font-medium mb-2">Notater</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Tilleggsnotater for mottaket"
          />
        </div>

        {/* Advarsel om arbeidsflyt */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-800 dark:text-green-200 mb-1">
                Automatisk lagerbeholdning
              </p>
              <p className="text-green-700 dark:text-green-300 text-xs">
                Lagerbeholdning oppdateres automatisk basert på vare + lokasjon + lot + utløp
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading || formData.lines.length === 0} className="flex-1">
            {loading ? 'Registrerer...' : 'Registrer mottak'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Avbryt
          </Button>
        </div>
      </form>

      {/* Barcode Scanner for Receipt Items */}
      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => {
          setScannerOpen(false);
          setCurrentLineIndex(null);
        }}
        onScanSuccess={handleScanSuccess}
        title="Skann vare eller lokasjon"
        description="Skann leverandørens strekkode eller QR-kode for lokasjon"
      />
    </Modal>
  )
}
