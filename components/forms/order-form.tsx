import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent } from '@/components/ui/card'
import { OrderInstructionsAlert } from '@/components/ui/order-instructions-alert'
import { FreightOptimizer } from '@/components/ui/freight-optimizer'
import { Plus, Trash2, Package, Building, AlertTriangle, DollarSign, Star, Calendar, Clock } from 'lucide-react'

// Helper functions for price validation
function isPriceExpired(validUntil?: string | null): boolean {
  if (!validUntil) return false
  return new Date(validUntil) < new Date()
}

function isPriceExpiringSoon(validUntil?: string | null): boolean {
  if (!validUntil) return false
  const expiryDate = new Date(validUntil)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date()
}

type OrderLine = {
  itemId: string
  item?: { name: string; unit: string; supplier?: { name: string } }
  quantityOrdered: number | ''
  unitPrice?: number | undefined
  departmentId?: string
  department?: { name: string }
  notes?: string
  // Prisbok-informasjon
  supplierItem?: {
    negotiatedPrice: number
    discountCodeRequired?: string | null
    minimumOrderQty?: number | null
    isPrimarySupplier: boolean
    priceValidUntil?: string | null
    agreementReference?: string | null
  }
}




type FormData = {
  supplierId: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  expectedDate: string
  notes: string
  requestedBy: string
  lines: OrderLine[]
}

type Supplier = { 
  id: string; 
  name: string; 
  shortCode?: string | null;
  freeShippingThreshold?: number | null;
  standardShippingCost?: number | null;
  shippingNotes?: string | null;
  orderingInstructions?: string | null;
}
type Department = { id: string; name: string; code: string }
type Item = { id: string; name: string; unit: string; supplier?: { name: string } }

interface OrderFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  suggestedItem?: { id: string; name: string }
}

const PRIORITIES = [
  { value: 'LOW', label: 'Normal', color: 'text-gray-600' },
  { value: 'MEDIUM', label: 'Viktig', color: 'text-blue-600' },
  { value: 'HIGH', label: 'Haster', color: 'text-amber-600' },
  { value: 'URGENT', label: 'Kritisk', color: 'text-red-600' }
]

export function OrderForm({ isOpen, onClose, onSave, suggestedItem }: OrderFormProps) {
  const [formData, setFormData] = useState<FormData>({
    supplierId: '',
    priority: 'MEDIUM',
    expectedDate: '',
    notes: '',
    requestedBy: 'System User', // In production: get from auth
    lines: []
  })

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const { showToast } = useToast()

  // Calculate order total
  const orderTotal = formData.lines.reduce((sum, line) => {
    const price = line.unitPrice || line.supplierItem?.negotiatedPrice || 0
    const qty = typeof line.quantityOrdered === 'number' ? line.quantityOrdered : 0
    return sum + (price * qty)
  }, 0)

  // Get all discount codes and instructions for selected supplier
  const discountCodes = formData.lines
    .map(line => line.supplierItem?.discountCodeRequired)
    .filter((code): code is string => Boolean(code?.trim()))

  const supplierInstructions = selectedSupplier?.orderingInstructions

  // Load reference data
  useEffect(() => {
    Promise.all([
      fetch('/api/suppliers').then(r => r.json()),
      fetch('/api/departments').then(r => r.json())
    ]).then(([supps, depts]) => {
      // Ensure suppliers is always an array
      setSuppliers(Array.isArray(supps) ? supps : [])
      setDepartments(Array.isArray(depts) ? depts : [])
    }).catch((error) => {
      console.error('Error loading reference data:', error)
      showToast('error', 'Kunne ikke laste referansedata')
      // Set empty arrays as fallback
      setSuppliers([])
      setDepartments([])
    })
  }, [])

  // Load items when supplier is selected
  useEffect(() => {
    if (formData.supplierId) {
      setLoadingItems(true)
      // Clear existing item selections when supplier changes
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.map(line => ({
          ...line,
          itemId: '',
          item: undefined,
          supplierItem: undefined
        }))
      }))
      
      fetch(`/api/supplier-items?supplierId=${formData.supplierId}`)
        .then(r => r.json())
        .then(supplierItems => {
          // Extract items from supplier-item relationships
          const availableItems = supplierItems.map((si: any) => ({
            id: si.item.id,
            name: si.item.name,
            sku: si.item.sku,
            supplierPartNumber: si.supplierPartNumber,
            negotiatedPrice: si.negotiatedPrice,
            listPrice: si.listPrice
          }))
          setItems(availableItems)
        })
        .catch(() => {
          showToast('error', 'Kunne ikke laste varer for valgt leverandør')
          setItems([])
        })
        .finally(() => {
          setLoadingItems(false)
        })
    } else {
      setItems([])
      // Clear item selections when no supplier is selected
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.map(line => ({
          ...line,
          itemId: '',
          item: undefined,
          supplierItem: undefined
        }))
      }))
    }
  }, [formData.supplierId])

  // Update selected supplier when supplierId changes
  useEffect(() => {
    if (formData.supplierId && Array.isArray(suppliers)) {
      const supplier = suppliers.find(s => s.id === formData.supplierId)
      setSelectedSupplier(supplier || null)
    } else {
      setSelectedSupplier(null)
    }
  }, [formData.supplierId, suppliers])

  // Handle suggested item from items page
  useEffect(() => {
    if (suggestedItem && items.length > 0) {
      const item = items.find(i => i.id === suggestedItem.id)
      if (item) {
        // Auto-select supplier if item has one
        if (item.supplier && Array.isArray(suppliers)) {
          const supplier = suppliers.find(s => s.name === item.supplier?.name)
          if (supplier) {
            setFormData(prev => ({ ...prev, supplierId: supplier.id }))
          }
        }
        
        // Add item as first line
        setFormData(prev => ({
          ...prev,
        lines: [{
            itemId: item.id,
            item,
          quantityOrdered: 1,
            unitPrice: undefined,
            departmentId: '',
            notes: ''
          }]
        }))
      }
    }
  }, [suggestedItem, items, suppliers])

  function addLine() {
    setFormData(prev => ({
      ...prev,
        lines: [...prev.lines, {
        itemId: '',
        quantityOrdered: 1,
        unitPrice: undefined,
        departmentId: '',
        notes: ''
      }]
    }))
  }

  function removeLine(index: number) {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }))
  }

  async function updateLine(index: number, field: string, value: any) {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => {
        if (i === index) {
          const updated = { ...line, [field]: value }
          
          // Auto-populate item details when itemId changes
          if (field === 'itemId' && value) {
            const item = items.find(item => item.id === value)
            if (item) {
              updated.item = item
              
              // Fetch supplier-specific pricing
              if (formData.supplierId) {
                fetch(`/api/supplier-items?itemId=${value}&supplierId=${formData.supplierId}`)
                  .then(r => r.json())
                  .then(supplierItems => {
                    if (supplierItems.length > 0) {
                      const supplierItem = supplierItems[0]
                      updated.supplierItem = {
                        negotiatedPrice: Number(supplierItem.negotiatedPrice),
                        discountCodeRequired: supplierItem.discountCodeRequired,
                        minimumOrderQty: supplierItem.minimumOrderQty,
                        isPrimarySupplier: supplierItem.isPrimarySupplier
                      }
                      updated.unitPrice = Number(supplierItem.negotiatedPrice)
                      
                      // Update the line in state
                      setFormData(current => ({
                        ...current,
                        lines: current.lines.map((l, idx) => idx === index ? updated : l)
                      }))
                    }
                  })
                  .catch(() => {
                    // No pricing found - user will need to enter manually
                  })
              }
            }
          }
          
          return updated
        }
        return line
      })
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.supplierId) {
      showToast('error', 'Leverandør må velges')
      return
    }
    
    if (formData.lines.length === 0) {
      showToast('error', 'Minst én vare må legges til')
      return
    }
    
    // Validate all lines
    for (let i = 0; i < formData.lines.length; i++) {
      const line = formData.lines[i]
      if (!line.itemId || line.quantityOrdered === '' || line.quantityOrdered <= 0) {
        showToast('error', `Linje ${i + 1}: Vare og antall må fylles ut`)
        return
      }
    }

    setLoading(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          supplierId: formData.supplierId,
          priority: formData.priority,
          expectedDate: formData.expectedDate || null,
          notes: formData.notes,
          lines: formData.lines
        })
      })

      if (!response.ok) {
        let errorMessage = 'Ukjent feil'
        try {
          const error = await response.json()
          errorMessage = error.error || error.message || 'Ukjent feil'
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      // Try to parse response, but don't fail if it's empty
      let result = null
      try {
        result = await response.json()
      } catch {
        // Empty response is OK for successful creation
      }

      showToast('success', 'Bestilling opprettet')
      onSave()
      onClose()
    } catch (error: any) {
      showToast('error', `Feil: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Ny bestilling" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bestillingsinformasjon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Leverandør <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.supplierId}
              onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
              required
            >
              <option value="">Velg leverandør</option>
              {Array.isArray(suppliers) && suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} {supplier.shortCode && `(${supplier.shortCode})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Prioritet</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
            >
              {PRIORITIES.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ønsket leveringsdato</label>
            <Input
              type="date"
              value={formData.expectedDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Bestilt av</label>
            <Input
              value={formData.requestedBy}
              onChange={(e) => setFormData(prev => ({ ...prev, requestedBy: e.target.value }))}
              placeholder="Ditt navn"
            />
          </div>
        </div>

        {/* Bestillingslinjer */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold">Bestillingslinjer</h4>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="w-4 h-4 mr-1" />
              Legg til vare
            </Button>
          </div>

          {formData.lines.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Ingen varer lagt til ennå</p>
                <Button type="button" variant="outline" size="sm" onClick={addLine} className="mt-2">
                  Legg til første vare
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {formData.lines.map((line, index) => (
                <Card key={index} className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Vare</label>
                          <select
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            value={line.itemId}
                            onChange={(e) => updateLine(index, 'itemId', e.target.value)}
                            disabled={!formData.supplierId || loadingItems}
                            required
                          >
                            <option value="">
                              {!formData.supplierId 
                                ? 'Velg leverandør først' 
                                : loadingItems 
                                ? 'Laster varer...' 
                                : 'Velg vare'}
                            </option>
                            {items.map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name} {(item as any).supplierPartNumber ? `(${(item as any).supplierPartNumber})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Antall</label>
                          <Input
                            type="number"
                            className="text-sm"
                            value={line.quantityOrdered === '' ? '' : line.quantityOrdered}
                            onChange={(e) => updateLine(index, 'quantityOrdered', e.target.value === '' ? '' : Number(e.target.value))}
                            min="1"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Enhetspris</label>
                          <Input
                            type="number"
                            step="0.01"
                            className="text-sm"
                            value={line.unitPrice || ''}
                            onChange={(e) => updateLine(index, 'unitPrice', e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Valgfritt"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Avdeling</label>
                          <select
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            value={line.departmentId || ''}
                            onChange={(e) => updateLine(index, 'departmentId', e.target.value)}
                          >
                            <option value="">Velg avdeling</option>
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLine(index)}
                        className="mt-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {line.item && (
                      <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs space-y-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-3 h-3 text-gray-500" />
                          <span>Enhet: {line.item.unit}</span>
                          {line.item.supplier && (
                            <>
                              <span className="text-gray-400">•</span>
                              <Building className="w-3 h-3 text-gray-500" />
                              <span>Leverandør: {line.item.supplier.name}</span>
                            </>
                          )}
                        </div>
                        
                        {line.supplierItem && (
                          <div className={`flex items-center justify-between p-2 rounded ${
                            isPriceExpired(line.supplierItem.priceValidUntil)
                              ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                              : isPriceExpiringSoon(line.supplierItem.priceValidUntil)
                              ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
                              : 'bg-green-50 dark:bg-green-900/30'
                          }`}>
                            <div className="flex items-center gap-2">
                              <DollarSign className={`w-3 h-3 ${
                                isPriceExpired(line.supplierItem.priceValidUntil)
                                  ? 'text-red-600'
                                  : isPriceExpiringSoon(line.supplierItem.priceValidUntil)
                                  ? 'text-amber-600'
                                  : 'text-green-600'
                              }`} />
                              <span className={`font-medium ${
                                isPriceExpired(line.supplierItem.priceValidUntil)
                                  ? 'text-red-700 dark:text-red-300'
                                  : isPriceExpiringSoon(line.supplierItem.priceValidUntil)
                                  ? 'text-amber-700 dark:text-amber-300'
                                  : 'text-green-700 dark:text-green-300'
                              }`}>
                                {line.supplierItem.negotiatedPrice.toFixed(2)} NOK
                              </span>
                              {line.supplierItem.isPrimarySupplier && (
                                <Star className="w-3 h-3 text-yellow-500" />
                              )}
                              {isPriceExpired(line.supplierItem.priceValidUntil) && (
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                              )}
                              {isPriceExpiringSoon(line.supplierItem.priceValidUntil) && !isPriceExpired(line.supplierItem.priceValidUntil) && (
                                <Clock className="w-3 h-3 text-amber-600" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {line.supplierItem.discountCodeRequired && (
                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono">
                                  {line.supplierItem.discountCodeRequired}
                                </span>
                              )}
                              {line.supplierItem.agreementReference && (
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {line.supplierItem.agreementReference}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Price validation warnings */}
                        {line.supplierItem && isPriceExpired(line.supplierItem.priceValidUntil) && (
                          <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="font-medium">
                              Prisavtalen utløp {new Date(line.supplierItem.priceValidUntil!).toLocaleDateString('no-NO')}. 
                              Verifiser pris før bestilling.
                            </span>
                          </div>
                        )}
                        
                        {line.supplierItem && isPriceExpiringSoon(line.supplierItem.priceValidUntil) && !isPriceExpired(line.supplierItem.priceValidUntil) && (
                          <div className="flex items-center gap-2 p-2 bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-300">
                            <Clock className="w-3 h-3" />
                            <span>
                              Prisavtalen utløper {new Date(line.supplierItem.priceValidUntil!).toLocaleDateString('no-NO')}. 
                              Vurder å reforhandle snart.
                            </span>
                          </div>
                        )}
                        
                        {line.supplierItem?.minimumOrderQty && typeof line.quantityOrdered === 'number' && line.quantityOrdered < line.supplierItem.minimumOrderQty && (
                          <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 p-2 rounded">
                            ⚠️ Min. antall: {line.supplierItem.minimumOrderQty}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Proaktiv veiledning */}
        {selectedSupplier && (discountCodes.length > 0 || supplierInstructions) && (
          <OrderInstructionsAlert 
            codes={discountCodes}
            instructions={supplierInstructions}
            supplierName={selectedSupplier.name}
          />
        )}

        {/* Fraktoptimalisering */}
        {selectedSupplier && orderTotal > 0 && (
          <FreightOptimizer 
            orderTotal={orderTotal}
            supplier={selectedSupplier}
          />
        )}

        {/* Ordretotal */}
        {formData.lines.length > 0 && (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800 dark:text-green-200">Ordretotal</span>
                </div>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  {orderTotal.toFixed(2)} NOK
                </span>
              </div>
              {formData.lines.some(line => !line.unitPrice && !line.supplierItem) && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  ⚠️ Noen varer mangler prisinformasjon
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notater */}
        <div>
          <label className="block text-sm font-medium mb-2">Notater</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Tilleggsnotater for bestillingen"
          />
        </div>

        {/* Advarsel om arbeidsflyt */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                Bestillingsarbeidsflyt
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-xs">
                Status: Forespurt → Godkjent → Bestilt → Delvis mottatt → Fullført
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading || formData.lines.length === 0} className="flex-1">
            {loading ? 'Oppretter...' : 'Opprett bestilling'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Avbryt
          </Button>
        </div>
      </form>
    </Modal>
  )
}
