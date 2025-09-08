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
  // NYE FELTER:
  discountPercentage: number | null
  priceEvaluationStatus: string
  lastVerifiedBy: string
  supplierRole: string
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
  // NYE FELTER:
  discountPercentage?: number | null
  priceEvaluationStatus?: string | null
  lastVerifiedBy?: string | null
  supplierRole?: string | null
}

interface SupplierItemFormProps {
  isOpen?: boolean
  onClose?: () => void
  editSupplierItem?: SupplierItem | null
  onSave: () => void
  onCancel?: () => void
  preselectedItem?: { id: string; name: string }
  preselectedSupplier?: { id: string; name: string }
  // Legacy props for backwards compatibility
  supplierId?: string
}

export function SupplierItemForm({ 
  isOpen, 
  onClose, 
  editSupplierItem, 
  onSave,
  onCancel,
  preselectedItem,
  preselectedSupplier,
  supplierId
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
    packSize: null,
    // NYE FELTER:
    discountPercentage: null,
    priceEvaluationStatus: '',
    lastVerifiedBy: '',
    supplierRole: 'PRIMARY'
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
        packSize: editSupplierItem.packSize ?? null,
        // NYE FELTER:
        discountPercentage: editSupplierItem.discountPercentage ?? null,
        priceEvaluationStatus: editSupplierItem.priceEvaluationStatus || '',
        lastVerifiedBy: editSupplierItem.lastVerifiedBy || '',
        supplierRole: editSupplierItem.supplierRole || 'PRIMARY'
      })
    } else {
      // Reset form and apply preselections
      setFormData({
        itemId: preselectedItem?.id || '',
        supplierId: preselectedSupplier?.id || supplierId || '',
        supplierPartNumber: '',
        productUrl: '',
        listPrice: null,
        negotiatedPrice: 0,
        discountCodeRequired: '',
        agreementReference: '',
        priceValidUntil: '',
        isPrimarySupplier: false,
        minimumOrderQty: null,
        packSize: null,
        // NYE FELTER:
        discountPercentage: null,
        priceEvaluationStatus: '',
        lastVerifiedBy: '',
        supplierRole: 'PRIMARY'
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
        priceValidUntil: formData.priceValidUntil || null,
        // NYE FELTER:
        discountPercentage: formData.discountPercentage || null,
        priceEvaluationStatus: formData.priceEvaluationStatus || null,
        lastVerifiedBy: formData.lastVerifiedBy || null,
        supplierRole: formData.supplierRole || 'PRIMARY'
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
      if (onClose) onClose()
    } catch (error: any) {
      showToast('error', `Feil: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const isOutdated = editSupplierItem && editSupplierItem.lastVerifiedDate ? 
    new Date(editSupplierItem.lastVerifiedDate) < new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) : false

  return (
    <Modal open={isOpen || false} onClose={onClose || (() => {})} title={editSupplierItem ? 'Rediger leverandørpris' : 'Ny leverandørpris'} size="lg">
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

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Lagrer...' : (editSupplierItem ? 'Oppdater pris' : 'Opprett leverandørpris')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel || onClose}>
            Avbryt
          </Button>
        </div>
      </form>
    </Modal>
  )
}
