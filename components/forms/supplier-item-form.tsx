import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { AlertTriangle, DollarSign, Calendar, Link, Star } from 'lucide-react'

type FormData = {
  itemId: string
  supplierId: string
  supplierPartNumber: string
  productUrl: string
  listPrice: number | null
  negotiatedPrice: number
  discountCodeRequired: string
  agreementReference: string
  priceValidUntil: string
  isPrimarySupplier: boolean
  minimumOrderQty: number | null
  packSize: number | null
}

type Item = { id: string; name: string; sku: string }
type Supplier = { id: string; name: string; shortCode?: string | null }
type SupplierItem = {
  id: string
  itemId: string
  supplierId: string
  supplierPartNumber: string
  productUrl?: string | null
  listPrice?: number | null
  negotiatedPrice: number
  discountCodeRequired?: string | null
  agreementReference?: string | null
  priceValidUntil?: string | null
  isPrimarySupplier: boolean
  minimumOrderQty?: number | null
  packSize?: number | null
  lastVerifiedDate: string
}

interface SupplierItemFormProps {
  isOpen: boolean
  onClose: () => void
  editSupplierItem?: SupplierItem | null
  onSave: () => void
  preselectedItem?: { id: string; name: string }
  preselectedSupplier?: { id: string; name: string }
}

export function SupplierItemForm({ 
  isOpen, 
  onClose, 
  editSupplierItem, 
  onSave,
  preselectedItem,
  preselectedSupplier
}: SupplierItemFormProps) {
  const [formData, setFormData] = useState<FormData>({
    itemId: '',
    supplierId: '',
    supplierPartNumber: '',
    productUrl: '',
    listPrice: null,
    negotiatedPrice: 0,
    discountCodeRequired: '',
    agreementReference: '',
    priceValidUntil: '',
    isPrimarySupplier: false,
    minimumOrderQty: null,
    packSize: null
  })

  const [items, setItems] = useState<Item[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  // Load reference data
  useEffect(() => {
    Promise.all([
      fetch('/api/items').then(r => r.json()),
      fetch('/api/suppliers').then(r => r.json())
    ]).then(([itms, supps]) => {
      setItems(itms)
      setSuppliers(supps)
    }).catch(() => {
      showToast('error', 'Kunne ikke laste referansedata')
    })
  }, [])

  // Populate form when editing or preselecting
  useEffect(() => {
    if (editSupplierItem) {
      setFormData({
        itemId: editSupplierItem.itemId,
        supplierId: editSupplierItem.supplierId,
        supplierPartNumber: editSupplierItem.supplierPartNumber,
        productUrl: editSupplierItem.productUrl || '',
        listPrice: editSupplierItem.listPrice ?? null,
        negotiatedPrice: editSupplierItem.negotiatedPrice ?? 0,
        discountCodeRequired: editSupplierItem.discountCodeRequired || '',
        agreementReference: editSupplierItem.agreementReference || '',
        priceValidUntil: editSupplierItem.priceValidUntil ? editSupplierItem.priceValidUntil.split('T')[0] : '',
        isPrimarySupplier: editSupplierItem.isPrimarySupplier,
        minimumOrderQty: editSupplierItem.minimumOrderQty ?? null,
        packSize: editSupplierItem.packSize ?? null
      })
    } else {
      // Reset form and apply preselections
      setFormData({
        itemId: preselectedItem?.id || '',
        supplierId: preselectedSupplier?.id || '',
        supplierPartNumber: '',
        productUrl: '',
        listPrice: null,
        negotiatedPrice: 0,
        discountCodeRequired: '',
        agreementReference: '',
        priceValidUntil: '',
        isPrimarySupplier: false,
        minimumOrderQty: null,
        packSize: null
      })
    }
  }, [editSupplierItem, preselectedItem, preselectedSupplier])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.itemId || !formData.supplierId || !formData.supplierPartNumber || formData.negotiatedPrice <= 0) {
      showToast('error', 'Vare, leverandør, artikkelnummer og pris er påkrevd')
      return
    }

    setLoading(true)
    try {
      const url = editSupplierItem ? `/api/supplier-items/${editSupplierItem.id}` : '/api/supplier-items'
      const method = editSupplierItem ? 'PATCH' : 'POST'
      
      const payload = {
        ...formData,
        listPrice: formData.listPrice || null,
        negotiatedPrice: Number(formData.negotiatedPrice),
        minimumOrderQty: formData.minimumOrderQty || null,
        packSize: formData.packSize || null,
        priceValidUntil: formData.priceValidUntil || null
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

      showToast('success', editSupplierItem ? 'Pris oppdatert' : 'Leverandørpris opprettet')
      onSave()
      onClose()
    } catch (error: any) {
      showToast('error', `Feil: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const isOutdated = editSupplierItem && editSupplierItem.lastVerifiedDate ? 
    new Date(editSupplierItem.lastVerifiedDate) < new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) : false

  return (
    <Modal open={isOpen} onClose={onClose} title={editSupplierItem ? 'Rediger leverandørpris' : 'Ny leverandørpris'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Advarsel om utdaterte priser */}
        {isOutdated && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  ⚠️ Pris ikke verifisert på over 6 måneder
                </p>
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                  Sist verifisert: {new Date(editSupplierItem!.lastVerifiedDate).toLocaleDateString('nb-NO')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grunnleggende kobling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Vare <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.itemId}
              onChange={(e) => setFormData(prev => ({ ...prev, itemId: e.target.value }))}
              required
              disabled={!!preselectedItem}
            >
              <option value="">Velg vare</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Leverandør <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              value={formData.supplierId}
              onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
              required
              disabled={!!preselectedSupplier}
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

        {/* Leverandør-spesifikk informasjon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Leverandørens artikkelnummer <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.supplierPartNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, supplierPartNumber: e.target.value }))}
              placeholder="f.eks. 09991274"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Produktlink</label>
            <Input
              type="url"
              value={formData.productUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, productUrl: e.target.value }))}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Prisstruktur */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-green-800 dark:text-green-200 mb-3">
            <DollarSign className="w-4 h-4" />
            Prisstruktur (NOK)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Listepris (før rabatt)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.listPrice || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  listPrice: e.target.value ? Number(e.target.value) : null 
                }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Laboras pris (etter rabatt) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.negotiatedPrice}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  negotiatedPrice: Number(e.target.value) 
                }))}
                placeholder="0.00"
                required
              />
            </div>
          </div>
        </div>

        {/* Avtaler og koder */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3">
            <AlertTriangle className="w-4 h-4" />
            Avtaler og rabattkoder (Kritisk!)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Påkrevd rabattkode</label>
              <Input
                value={formData.discountCodeRequired}
                onChange={(e) => setFormData(prev => ({ ...prev, discountCodeRequired: e.target.value }))}
                placeholder="f.eks. Ref: 09991274"
              />
              <p className="text-xs text-blue-600 mt-1">
                Koden som MÅ oppgis ved bestilling for å få riktig pris
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Avtalereferanse</label>
              <Input
                value={formData.agreementReference}
                onChange={(e) => setFormData(prev => ({ ...prev, agreementReference: e.target.value }))}
                placeholder="f.eks. Labforum 2025"
              />
            </div>
          </div>
        </div>

        {/* Gyldighet og metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Pris gyldig til
            </label>
            <Input
              type="date"
              value={formData.priceValidUntil}
              onChange={(e) => setFormData(prev => ({ ...prev, priceValidUntil: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Minimum bestillingsantall</label>
            <Input
              type="number"
              value={formData.minimumOrderQty || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                minimumOrderQty: e.target.value ? Number(e.target.value) : null 
              }))}
              placeholder="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Pakningsstørrelse</label>
            <Input
              type="number"
              value={formData.packSize || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                packSize: e.target.value ? Number(e.target.value) : null 
              }))}
              placeholder="f.eks. 48"
            />
          </div>
        </div>

        {/* Primær leverandør */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isPrimarySupplier}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrimarySupplier: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <Star className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium">Sett som primær leverandør</span>
          </label>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 ml-6">
            Primær leverandør vises først i bestillinger og får automatiske forslag
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Lagrer...' : (editSupplierItem ? 'Oppdater pris' : 'Opprett leverandørpris')}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Avbryt
          </Button>
        </div>
      </form>
    </Modal>
  )
}
