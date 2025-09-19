import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { AlertTriangle, Package, User } from 'lucide-react'

type InventoryLot = {
  id: string
  quantity: number
  lotNumber?: string
  expiryDate?: string
  item: {
    name: string
    sku: string
    unit: string
    requiresLotNumber: boolean
    expiryTracking: boolean
  }
  location: {
    name: string
  }
}

type Props = {
  lot: InventoryLot
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ConsumptionForm({ lot, open, onClose, onSuccess }: Props) {
  const [quantity, setQuantity] = useState<number | ''>(1)
  const [reasonCode, setReasonCode] = useState<string>('ANALYSIS')
  const [notes, setNotes] = useState<string>('')
  const [userId] = useState<string>('cm4gvr9sg0001i6yp0g2q8ey5') // I ekte app: fra session
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const reasonCodes = [
    { value: 'ANALYSIS', label: 'Analyse/Testing' },
    { value: 'PRODUCTION', label: 'Produksjon' },
    { value: 'QUALITY_CONTROL', label: 'Kvalitetskontroll' },
    { value: 'RESEARCH', label: 'Forskning' },
    { value: 'MAINTENANCE', label: 'Vedlikehold' },
    { value: 'DAMAGED', label: 'Skadet/Ødelagt' },
    { value: 'EXPIRED', label: 'Utløpt' },
    { value: 'OTHER', label: 'Annet' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (quantity !== '' && quantity > lot.quantity) {
      showToast('error', 'Ikke nok på lager')
      return
    }

    if (quantity === '' || quantity <= 0) {
      showToast('error', 'Antall må være større enn 0')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/inventory/consumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          inventoryLotId: lot.id,
          quantity: typeof quantity === 'number' ? quantity : 0,
          reasonCode,
          notes,
          userId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke registrere vareuttak')
      }

      showToast('success', `Vareuttak registrert: ${quantity} ${lot.item.unit.toLowerCase()}`)
      onSuccess()
      onClose()
      
      // Reset form
      setQuantity(1)
      setNotes('')
      setReasonCode('ANALYSIS')

    } catch (error: any) {
      console.error('Feil ved vareuttak:', error)
      showToast('error', error.message || 'Kunne ikke registrere vareuttak')
    } finally {
      setLoading(false)
    }
  }

  const isLowStock = lot.quantity <= 5
  const willBeLowStock = (lot.quantity - quantity) <= 5

  return (
    <Modal open={open} onClose={onClose} title="Registrer vareuttak" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Lot Information */}
        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-text-secondary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-text-primary">{lot.item.name}</h3>
              <div className="text-sm text-text-secondary space-y-1 mt-1">
                <div>SKU: {lot.item.sku}</div>
                <div>Lokasjon: {lot.location.name}</div>
                {lot.lotNumber && <div>Lot: {lot.lotNumber}</div>}
                {lot.expiryDate && (
                  <div>Utløper: {new Date(lot.expiryDate).toLocaleDateString('nb-NO')}</div>
                )}
                <div className={`font-medium ${isLowStock ? 'text-amber-600' : 'text-text-primary'}`}>
                  Tilgjengelig: {lot.quantity} {lot.item.unit.toLowerCase()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning for low stock */}
        {(isLowStock || willBeLowStock) && (
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-amber-800 dark:text-amber-200">
                {isLowStock ? 'Lav beholdning' : 'Vil bli lav beholdning'}
              </div>
              <div className="text-amber-700 dark:text-amber-300">
                {willBeLowStock && `Etter uttak: ${lot.quantity - quantity} ${lot.item.unit.toLowerCase()}`}
              </div>
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Antall å ta ut <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              type="number"
              min="1"
              max={lot.quantity}
              value={quantity === '' ? '' : quantity}
              onChange={(e) => {
                const v = e.target.value
                setQuantity(v === '' ? '' : Number(v))
              }}
              className="pr-16"
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
              {lot.item.unit.toLowerCase()}
            </div>
          </div>
        </div>

        {/* Reason Code */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Årsak til uttak <span className="text-red-500">*</span>
          </label>
          <select
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-bg-primary text-text-primary focus:ring-2 focus:ring-labora focus:border-transparent"
            required
          >
            {reasonCodes.map(reason => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Kommentarer/Detaljer
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg bg-bg-primary text-text-primary focus:ring-2 focus:ring-labora focus:border-transparent resize-none"
            placeholder="F.eks. Analyse ID, prosjekt, eller andre detaljer..."
          />
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <User className="w-4 h-4" />
          <span>Registreres av: Lab Tekniker</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Registrerer...' : 'Registrer uttak'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
