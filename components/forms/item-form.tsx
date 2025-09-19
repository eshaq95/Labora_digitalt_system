import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { BarcodeManager } from './barcode-manager'
import { Package, AlertTriangle, Calendar, Hash, MapPin } from 'lucide-react'

type FormData = {
  name: string
  sku: string
  barcode: string
  manufacturer: string
  description: string
  departmentId: string
  categoryId: string
  supplierId: string
  defaultLocationId: string
  unit: string
  orderUnit: string
  conversionFactor: number | null | ''
  contentPerPack: string
  minStock: number | ''
  maxStock: number | null | ''
  salesPrice: number | null | ''
  requiresLotNumber: boolean
  expiryTracking: boolean
  hazardous: boolean
  hmsCode: string
  storageTemp: string
  notes: string
  // NYE FELTER:
  standingOrderDetails: string
}

type Item = {
  id: string
  name: string
  sku: string
  barcode?: string | null
  manufacturer?: string | null
  description?: string | null
  departmentId?: string | null
  categoryId?: string | null
  supplierId?: string | null
  defaultLocationId?: string | null
  unit: string
  orderUnit?: string | null
  conversionFactor?: number | null
  contentPerPack?: string | null
  minStock: number
  maxStock?: number | null
  salesPrice?: number | null
  requiresLotNumber: boolean
  expiryTracking: boolean
  hazardous: boolean
  hmsCode?: string | null
  storageTemp?: string | null
  notes?: string | null
  // NYE FELTER:
  standingOrderDetails?: string | null
  barcodes?: Array<{
    id: string
    barcode: string
    type: string
    isPrimary: boolean
    description?: string | null
  }>
}

type Department = { id: string; name: string; code: string }
type Category = { id: string; name: string; code: string }
type Supplier = { id: string; name: string; shortCode?: string | null }
type Location = { id: string; name: string; code?: string | null }

const UNITS = [
  { value: 'UNIT', label: 'Stk' },
  { value: 'BOX', label: 'Eske/Boks' },
  { value: 'BOTTLE', label: 'Flaske' },
  { value: 'TUBE', label: 'Rør' },
  { value: 'PLATE', label: 'Plate' },
  { value: 'KIT', label: 'Sett' },
  { value: 'LITER', label: 'Liter' },
  { value: 'MILLILITER', label: 'ml' },
  { value: 'GRAM', label: 'Gram' },
  { value: 'KILOGRAM', label: 'Kilo' },
  { value: 'PACK', label: 'Pakke' },
  { value: 'ROLL', label: 'Rull' },
  { value: 'BAG', label: 'Pose' },
  { value: 'PALLET', label: 'Pall' }
]

interface ItemFormProps {
  isOpen: boolean
  onClose: () => void
  editItem?: Item | null
  onSave: () => void
}

export function ItemForm({ isOpen, onClose, editItem, onSave }: ItemFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    sku: '',
    barcode: '',
    manufacturer: '',
    description: '',
    departmentId: '',
    categoryId: '',
    supplierId: '',
    defaultLocationId: '',
    unit: 'UNIT',
    orderUnit: '',
    conversionFactor: null,
    contentPerPack: '',
    minStock: 0,
    maxStock: null,
    salesPrice: null,
    requiresLotNumber: false,
    expiryTracking: false,
    hazardous: false,
    hmsCode: '',
    storageTemp: '',
    notes: '',
    // NYE FELTER:
    standingOrderDetails: ''
  })

  const [departments, setDepartments] = useState<Department[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [barcodeManagerOpen, setBarcodeManagerOpen] = useState(false)
  const { showToast } = useToast()

  // Load reference data
  useEffect(() => {
    Promise.all([
      fetch('/api/departments').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/suppliers').then(r => r.json()),
      fetch('/api/locations').then(r => r.json())
    ]).then(([depts, cats, supps, locs]) => {
      setDepartments(depts)
      setCategories(cats)
      setSuppliers(supps)
      setLocations(locs)
    }).catch(() => {
      showToast('error', 'Kunne ikke laste referansedata')
    })
  }, [])

  // Populate form when editing
  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name,
        sku: editItem.sku,
        barcode: editItem.barcode || '',
        manufacturer: editItem.manufacturer || '',
        description: editItem.description || '',
        departmentId: editItem.departmentId || '',
        categoryId: editItem.categoryId || '',
        supplierId: editItem.supplierId || '',
        defaultLocationId: editItem.defaultLocationId || '',
        unit: editItem.unit,
        orderUnit: editItem.orderUnit || '',
        conversionFactor: editItem.conversionFactor ?? null,
        contentPerPack: editItem.contentPerPack || '',
        minStock: editItem.minStock,
        maxStock: editItem.maxStock ?? null,
        salesPrice: editItem.salesPrice ?? null,
        requiresLotNumber: editItem.requiresLotNumber,
        expiryTracking: editItem.expiryTracking,
        hazardous: editItem.hazardous,
        hmsCode: editItem.hmsCode || '',
        storageTemp: editItem.storageTemp || '',
        notes: editItem.notes || '',
        // NYE FELTER:
        standingOrderDetails: editItem.standingOrderDetails || ''
      })
    } else {
      // Reset form for new item
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        manufacturer: '',
        description: '',
        departmentId: '',
        categoryId: '',
        supplierId: '',
        defaultLocationId: '',
        unit: 'UNIT',
        orderUnit: '',
        conversionFactor: null,
        contentPerPack: '',
        minStock: 0,
        maxStock: null,
        salesPrice: null,
        requiresLotNumber: false,
        expiryTracking: false,
        hazardous: false,
        hmsCode: '',
        storageTemp: '',
        notes: '',
        // NYE FELTER:
        standingOrderDetails: ''
      })
    }
  }, [editItem])

  // Auto-generate SKU from name
  useEffect(() => {
    if (formData.name && !editItem) {
      const autoSku = formData.name
        .trim()
        .toLowerCase()
        .replace(/[æøå]/g, (match) => ({ 'æ': 'ae', 'ø': 'o', 'å': 'a' }[match] || match))
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, sku: autoSku }))
    }
  }, [formData.name, editItem])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim() || !formData.sku.trim()) {
      showToast('error', 'Navn og SKU er påkrevd')
      return
    }

    setLoading(true)
    try {
      const url = editItem ? `/api/items/${editItem.id}` : '/api/items'
      const method = editItem ? 'PATCH' : 'POST'
      
      const payload = {
        ...formData,
        minStock: formData.minStock === '' ? 0 : Number(formData.minStock),
        maxStock: formData.maxStock === '' ? null : Number(formData.maxStock),
        salesPrice: formData.salesPrice === '' ? null : Number(formData.salesPrice),
        conversionFactor: formData.conversionFactor === '' ? null : Number(formData.conversionFactor),
        departmentId: formData.departmentId || null,
        categoryId: formData.categoryId || null,
        supplierId: formData.supplierId || null,
        defaultLocationId: formData.defaultLocationId || null,
        orderUnit: formData.orderUnit || null
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ukjent feil')
      }

      showToast('success', editItem ? 'Vare oppdatert' : 'Vare opprettet')
      onSave()
      onClose()
    } catch (error: any) {
      showToast('error', `Feil: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose} title={editItem ? 'Rediger vare' : 'Ny vare'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Grunnleggende informasjon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Varenavn <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="f.eks. BCYE Medium"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              SKU <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              placeholder="Auto-genereres fra navn"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Primær strekkode
            </label>
            <div className="flex gap-2">
              <Input
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder="Skann eller skriv inn strekkode"
                className="flex-1"
              />
              {editItem && (
                <Button
                  type="button"
                  onClick={() => setBarcodeManagerOpen(true)}
                  variant="outline"
                  className="px-3"
                  title="Administrer alle strekkoder"
                >
                  <Package className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Produsent</label>
            <Input
              value={formData.manufacturer}
              onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
              placeholder="Produsentnavn"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Salgspris (NOK)</label>
            <Input
              type="number"
              step="0.01"
              value={formData.salesPrice === null ? '' : formData.salesPrice}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                salesPrice: e.target.value === '' ? null : Number(e.target.value) 
              }))}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Beskrivelse</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detaljert beskrivelse av varen"
          />
        </div>

        {/* Kategorisering */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Avdeling</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.departmentId}
              onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
            >
              <option value="">Velg avdeling</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Kategori</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
            >
              <option value="">Velg kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Leverandør</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.supplierId}
              onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
            >
              <option value="">Velg leverandør</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} {supplier.shortCode && `(${supplier.shortCode})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Enheter og mengder */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Lagerenhet</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.unit}
              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
            >
              {UNITS.map(unit => (
                <option key={unit.value} value={unit.value}>{unit.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Bestillingsenhet</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.orderUnit}
              onChange={(e) => setFormData(prev => ({ ...prev, orderUnit: e.target.value }))}
            >
              <option value="">Samme som lagerenhet</option>
              {UNITS.map(unit => (
                <option key={unit.value} value={unit.value}>{unit.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Konverteringsfaktor</label>
            <Input
              type="number"
              value={formData.conversionFactor === null ? '' : formData.conversionFactor}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                conversionFactor: e.target.value === '' ? null : Number(e.target.value) 
              }))}
              placeholder="f.eks. 48"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Innhold per pakke</label>
            <Input
              value={formData.contentPerPack}
              onChange={(e) => setFormData(prev => ({ ...prev, contentPerPack: e.target.value }))}
              placeholder="f.eks. 10/pk"
            />
          </div>
        </div>

        {/* Lagerstyring */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Minstebeholdning <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.minStock === '' ? '' : formData.minStock}
              onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value === '' ? '' : Number(e.target.value) }))}
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Maksimum beholdning</label>
            <Input
              type="number"
              value={formData.maxStock === null ? '' : formData.maxStock}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                maxStock: e.target.value === '' ? null : Number(e.target.value) 
              }))}
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Standard lokasjon</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.defaultLocationId}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultLocationId: e.target.value }))}
            >
              <option value="">Velg standard lokasjon</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name} {location.code && `(${location.code})`}
                </option>
              ))}
            </select>
          </div>
        </div>



        {/* Sporingskrav */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            <AlertTriangle className="w-4 h-4" />
            Sporingskrav (Kritisk for laboratorium)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requiresLotNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, requiresLotNumber: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <Hash className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Krever lot/batch nummer</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.expiryTracking}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryTracking: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-sm">Krever utløpsdato</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.hazardous}
                onChange={(e) => setFormData(prev => ({ ...prev, hazardous: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm">Farlig vare (HMS)</span>
            </label>
          </div>
        </div>

        {/* HMS og lagring */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">HMS-kode</label>
            <Input
              value={formData.hmsCode}
              onChange={(e) => setFormData(prev => ({ ...prev, hmsCode: e.target.value }))}
              placeholder="f.eks. H315, P280"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Lagringstemperatur</label>
            <Input
              value={formData.storageTemp}
              onChange={(e) => setFormData(prev => ({ ...prev, storageTemp: e.target.value }))}
              placeholder="f.eks. 2-8°C, RT"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Notater</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Tilleggsnotater om varen"
          />
        </div>

        {/* NYE FELTER */}
        <div>
          <label className="block text-sm font-medium mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Fastbestilling
          </label>
          <Input
            value={formData.standingOrderDetails}
            onChange={(e) => setFormData(prev => ({ ...prev, standingOrderDetails: e.target.value }))}
            placeholder="f.eks. 'Labolytic - Hver 3. måned' eller 'Thermo Fisher - Automatisk'"
          />
          <p className="text-xs text-text-tertiary mt-1">
            Informasjon om stående ordre eller abonnement for denne varen
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Lagrer...' : (editItem ? 'Oppdater vare' : 'Opprett vare')}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Avbryt
          </Button>
        </div>
      </form>

      {/* Barcode Manager Modal */}
      {editItem && (
        <BarcodeManager
          itemId={editItem.id}
          isOpen={barcodeManagerOpen}
          onClose={() => setBarcodeManagerOpen(false)}
          onUpdate={() => {
            // Refresh the item data if needed
            onSave()
          }}
        />
      )}
    </Modal>
  )
}
