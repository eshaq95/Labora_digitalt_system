import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DetailPageLayout } from '@/components/layout/page-layout'
import { Modal } from '@/components/ui/modal'
import dynamic from 'next/dynamic'

// Code splitting for forms - only load when needed
const SupplierItemForm = dynamic(() => import('@/components/forms/supplier-item-form').then(mod => ({ default: mod.SupplierItemForm })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>,
  ssr: false
})

const ConsumptionForm = dynamic(() => import('@/components/forms/consumption-form').then(mod => ({ default: mod.ConsumptionForm })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>,
  ssr: false
})
import { motion } from 'framer-motion'
import { 
  Package, ArrowLeft, Edit, Plus, Truck, DollarSign, 
  Calendar, CheckCircle, AlertCircle, Star, ExternalLink,
  Minus, History, TrendingDown 
} from 'lucide-react'

type Item = {
  id: string
  sku: string
  name: string
  description?: string
  manufacturer?: string
  unit: string
  minStock: number
  maxStock?: number
  requiresLotNumber: boolean
  expiryTracking: boolean
  hazardous: boolean
  storageTemp?: string
  notes?: string
  department?: { name: string }
  category?: { name: string }
  defaultLocation?: { name: string }
}

type SupplierItem = {
  id: string
  itemId: string
  supplierId: string
  supplierPartNumber: string
  listPrice?: number
  negotiatedPrice: number
  currency: string
  discountCodeRequired?: string
  agreementReference?: string
  priceValidUntil?: string
  lastVerifiedDate: string
  isPrimarySupplier: boolean
  minimumOrderQty?: number
  packSize?: number
  productUrl?: string
  // NYE FELTER:
  discountPercentage?: number | null
  priceEvaluationStatus?: string | null
  lastVerifiedBy?: string | null
  supplierRole?: string | null
  supplier: {
    id: string
    name: string
    website?: string
  }
}

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
    type: string
  }
}

export default function ItemDetailPage() {
  const router = useRouter()
  const { id } = router.query
  
  const [item, setItem] = useState<Item | null>(null)
  const [supplierItems, setSupplierItems] = useState<SupplierItem[]>([])
  const [inventoryLots, setInventoryLots] = useState<InventoryLot[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'inventory' | 'suppliers' | 'transactions'>('details')
  const [showSupplierItemForm, setShowSupplierItemForm] = useState(false)
  const [editingSupplierItem, setEditingSupplierItem] = useState<SupplierItem | null>(null)
  const [showConsumptionForm, setShowConsumptionForm] = useState(false)
  const [selectedLot, setSelectedLot] = useState<InventoryLot | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  
  // Lazy loading states for each tab
  const [suppliersLoaded, setSuppliersLoaded] = useState(false)
  const [inventoryLoaded, setInventoryLoaded] = useState(false)
  const [transactionsLoaded, setTransactionsLoaded] = useState(false)
  const [tabLoading, setTabLoading] = useState<string | null>(null)

  // Initial load - only fetch basic item data
  useEffect(() => {
    if (!id) return
    
    const fetchBasicData = async () => {
      try {
        const itemRes = await fetch(`/api/items/${id}`)
        
        if (itemRes.ok) {
          const itemData = await itemRes.json()
          setItem(itemData)
        }
      } catch (error) {
        console.error('Kunne ikke laste varedetaljer:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBasicData()
  }, [id])

  // Lazy load suppliers data when suppliers tab is accessed
  const loadSuppliersData = async () => {
    if (suppliersLoaded || !id) return
    
    setTabLoading('suppliers')
    try {
      const res = await fetch(`/api/supplier-items?itemId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setSupplierItems(Array.isArray(data) ? data : [])
        setSuppliersLoaded(true)
      }
    } catch (error) {
      console.error('Kunne ikke laste leverandørdata:', error)
    } finally {
      setTabLoading(null)
    }
  }

  // Lazy load inventory data when inventory tab is accessed
  const loadInventoryData = async () => {
    if (inventoryLoaded || !id) return
    
    setTabLoading('inventory')
    try {
      const res = await fetch(`/api/inventory?itemId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setInventoryLots(Array.isArray(data.lots) ? data.lots : [])
        setInventoryLoaded(true)
      }
    } catch (error) {
      console.error('Kunne ikke laste lagerdata:', error)
    } finally {
      setTabLoading(null)
    }
  }

  // Lazy load transactions data when transactions tab is accessed
  const loadTransactionsData = async () => {
    if (transactionsLoaded || !id) return
    
    setTabLoading('transactions')
    try {
      const res = await fetch(`/api/inventory/consumption?itemId=${id}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data)
        setTransactionsLoaded(true)
      }
    } catch (error) {
      console.error('Kunne ikke laste transaksjonsdata:', error)
    } finally {
      setTabLoading(null)
    }
  }

  // Handle tab changes and trigger lazy loading
  const handleTabChange = (tab: 'details' | 'inventory' | 'suppliers' | 'transactions') => {
    setActiveTab(tab)
    
    // Trigger lazy loading based on selected tab
    switch (tab) {
      case 'suppliers':
        loadSuppliersData()
        break
      case 'inventory':
        loadInventoryData()
        break
      case 'transactions':
        loadTransactionsData()
        break
    }
  }

  const handleAddSupplier = () => {
    setEditingSupplierItem(null)
    setShowSupplierItemForm(true)
  }

  const handleEditSupplierItem = (supplierItem: SupplierItem) => {
    setEditingSupplierItem(supplierItem)
    setShowSupplierItemForm(true)
  }

  const refreshSupplierItems = async () => {
    try {
      const res = await fetch(`/api/supplier-items?itemId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setSupplierItems(Array.isArray(data) ? data : [])
        setSuppliersLoaded(true) // Mark as loaded after refresh
      }
    } catch (error) {
      console.error('Kunne ikke oppdatere leverandørpriser:', error)
    }
  }

  const handleConsumption = (lot: InventoryLot) => {
    setSelectedLot(lot)
    setShowConsumptionForm(true)
  }

  const refreshData = async () => {
    if (!id) return
    
    // Only refresh data for tabs that have been loaded
    try {
      const promises: Promise<void>[] = []
      
      if (inventoryLoaded) {
        promises.push(
          fetch(`/api/inventory?itemId=${id}`).then(async (res) => {
            if (res.ok) {
              const data = await res.json()
              setInventoryLots(Array.isArray(data.lots) ? data.lots : [])
            }
          })
        )
      }
      
      if (transactionsLoaded) {
        promises.push(
          fetch(`/api/inventory/consumption?itemId=${id}&limit=20`).then(async (res) => {
            if (res.ok) {
              const data = await res.json()
              setTransactions(data)
            }
          })
        )
      }
      
      if (promises.length > 0) {
        await Promise.all(promises)
      }
    } catch (error) {
      console.error('Kunne ikke oppdatere data:', error)
    }
  }

  const totalStock = inventoryLots.reduce((sum, lot) => sum + lot.quantity, 0)
  const isLowStock = item && totalStock < item.minStock

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface rounded w-1/3"></div>
            <div className="h-96 bg-surface rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">Vare ikke funnet</h2>
            <p className="text-text-secondary mb-6">Varen du leter etter eksisterer ikke eller er slettet.</p>
            <Button onClick={() => router.push('/items')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake til varekartotek
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DetailPageLayout
      title={item.name}
      subtitle={`SKU: ${item.sku} • ${item.manufacturer || 'Ukjent produsent'}`}
      backHref="/items"
      actions={
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Rediger vare
        </Button>
      }
    >

        {/* Stock Status Banner */}
        {isLowStock && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Kritisk beholdning: {totalStock} stk (minimum: {item.minStock} stk)
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Varen trenger påfyll snarest
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="flex space-x-8">
              {[
                { key: 'details', label: 'Varedetaljer', icon: Package },
                { key: 'inventory', label: 'Lagerstatus', icon: Package },
                { key: 'suppliers', label: 'Leverandører og Priser', icon: DollarSign },
                { key: 'transactions', label: 'Transaksjonshistorikk', icon: History }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => handleTabChange(key as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === key
                      ? 'border-labora text-labora'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-hover'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Grunnleggende informasjon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-secondary">SKU</label>
                      <p className="text-text-primary font-mono">{item.sku}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Kategori</label>
                      <p className="text-text-primary">{item.category?.name || 'Ukategorisert'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Avdeling</label>
                      <p className="text-text-primary">{item.department?.name || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Enhet</label>
                      <p className="text-text-primary">{item.unit}</p>
                    </div>
                  </div>
                  {item.description && (
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Beskrivelse</label>
                      <p className="text-text-primary">{item.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Storage & Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle>Lager og sporing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Minstebeholdning</label>
                      <p className="text-text-primary">{item.minStock} stk</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Maksimum</label>
                      <p className="text-text-primary">{item.maxStock || '—'} stk</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Standard lokasjon</label>
                      <p className="text-text-primary">{item.defaultLocation?.name || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Lagringstemperatur</label>
                      <p className="text-text-primary">{item.storageTemp || '—'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {item.requiresLotNumber && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-md">
                        <CheckCircle className="w-3 h-3" />
                        Krever lotnummer
                      </span>
                    )}
                    {item.expiryTracking && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-md">
                        <Calendar className="w-3 h-3" />
                        Utløpsdato-sporing
                      </span>
                    )}
                    {item.hazardous && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs font-medium rounded-md">
                        <AlertCircle className="w-3 h-3" />
                        Farlig gods
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Lagerstatus</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-text-primary">{totalStock} stk</div>
                      <div className="text-sm text-text-secondary">Total beholdning</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tabLoading === 'inventory' ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-text-secondary">Laster lagerdata...</p>
                    </div>
                  ) : inventoryLots.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-text-primary mb-2">Ingen lagerbeholdning</h3>
                      <p className="text-text-secondary">Denne varen har ingen registrerte lots på lager.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inventoryLots.map((lot, index) => (
                        <motion.div
                          key={lot.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-surface hover:bg-surface-hover rounded-xl border border-border transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-3 h-3 bg-success rounded-full"></div>
                            <div>
                              <div className="font-medium text-text-primary">
                                {lot.location.name}
                              </div>
                              <div className="text-sm text-text-secondary">
                                {lot.location.type === 'COLD' ? '❄️ Kjølelager' : 
                                 lot.location.type === 'REMOTE' ? '📦 Fjernlager' : 
                                 '🏢 Hovedlager'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right space-y-1">
                              <div className="text-lg font-semibold text-text-primary">
                                {lot.quantity} stk
                              </div>
                              {lot.lotNumber && (
                                <div className="text-xs text-text-tertiary">
                                  Lot: {lot.lotNumber}
                                </div>
                              )}
                              {lot.expiryDate && (
                                <div className="text-xs text-text-tertiary">
                                  Utløper: {new Date(lot.expiryDate).toLocaleDateString('nb-NO')}
                                </div>
                              )}
                            </div>
                            {lot.quantity > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConsumption(lot)}
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                              >
                                <Minus className="w-3.5 h-3.5 mr-1" />
                                Ta ut
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Suppliers & Pricing Tab */}
          {activeTab === 'suppliers' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Leverandører og Priser</span>
                    <Button onClick={handleAddSupplier} disabled={tabLoading === 'suppliers'}>
                      <Plus className="w-4 h-4 mr-2" />
                      Koble til leverandør
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tabLoading === 'suppliers' ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-text-secondary">Laster leverandørdata...</p>
                    </div>
                  ) : supplierItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Truck className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-text-primary mb-2">Ingen leverandører koblet</h3>
                      <p className="text-text-secondary mb-6">
                        Koble denne varen til leverandører for å administrere priser og avtaler.
                      </p>
                      <Button onClick={handleAddSupplier}>
                        <Plus className="w-4 h-4 mr-2" />
                        Legg til leverandør
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {supplierItems.map((supplierItem, index) => (
                        <motion.div
                          key={supplierItem.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-surface hover:bg-surface-hover rounded-xl border border-border transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {supplierItem.isPrimarySupplier && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-text-primary">
                                  {supplierItem.supplier.name}
                                </span>
                                {supplierItem.productUrl && (
                                  <a 
                                    href={supplierItem.productUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-labora hover:text-labora-700"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              <div className="text-sm text-text-secondary">
                                Art.nr: {supplierItem.supplierPartNumber}
                              </div>
                              {supplierItem.discountCodeRequired && (
                                <div className="text-xs text-amber-600 dark:text-amber-400">
                                  Rabattkode: {supplierItem.discountCodeRequired}
                                </div>
                              )}
                              
                              {/* NYE FELTER */}
                              <div className="flex items-center gap-3 mt-2">
                                {supplierItem.supplierRole && supplierItem.supplierRole !== 'PRIMARY' && (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded">
                                    {supplierItem.supplierRole === 'SECONDARY' ? 'Sekundær' : 'Reserve'}
                                  </span>
                                )}
                                {supplierItem.priceEvaluationStatus && (
                                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded ${
                                    supplierItem.priceEvaluationStatus === 'OK' ? 'bg-green-50 text-green-700 border-green-200' :
                                    supplierItem.priceEvaluationStatus === 'Finnes Billigere' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-gray-50 text-gray-700 border-gray-200'
                                  }`}>
                                    {supplierItem.priceEvaluationStatus}
                                  </span>
                                )}
                                {supplierItem.lastVerifiedBy && (
                                  <span className="text-xs text-text-tertiary">
                                    Verifisert av: {supplierItem.lastVerifiedBy}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            {/* Price Info */}
                            <div className="text-right">
                              <div className="text-lg font-semibold text-text-primary">
                                {Number(supplierItem.negotiatedPrice).toFixed(2)} {supplierItem.currency}
                              </div>
                              {supplierItem.listPrice && Number(supplierItem.listPrice) !== Number(supplierItem.negotiatedPrice) && (
                                <div className="text-sm text-text-tertiary line-through">
                                  {Number(supplierItem.listPrice).toFixed(2)} {supplierItem.currency}
                                </div>
                              )}
                              {supplierItem.discountPercentage && (
                                <div className="text-xs text-green-600 dark:text-green-400">
                                  -{supplierItem.discountPercentage}% rabatt
                                </div>
                              )}
                              {supplierItem.priceValidUntil && (
                                <div className="text-xs text-text-tertiary">
                                  Gyldig til: {new Date(supplierItem.priceValidUntil).toLocaleDateString('nb-NO')}
                                </div>
                              )}
                            </div>
                            
                            {/* Actions */}
                            <div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditSupplierItem(supplierItem)}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Rediger
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Transactions History Tab */}
          {activeTab === 'transactions' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Transaksjonshistorikk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tabLoading === 'transactions' ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-text-secondary">Laster transaksjonshistorikk...</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingDown className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-text-primary mb-2">Ingen transaksjoner</h3>
                      <p className="text-text-secondary">Ingen registrerte uttak eller justeringer for denne varen.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((transaction, index) => (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 bg-surface hover:bg-surface-hover rounded-xl border border-border transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${
                              transaction.type === 'CONSUMPTION' ? 'bg-red-500' :
                              transaction.type === 'RECEIPT' ? 'bg-green-500' :
                              transaction.type === 'ADJUSTMENT' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`}></div>
                            <div>
                              <div className="font-medium text-text-primary">
                                {transaction.type === 'CONSUMPTION' ? 'Vareuttak' :
                                 transaction.type === 'RECEIPT' ? 'Mottak' :
                                 transaction.type === 'ADJUSTMENT' ? 'Justering' :
                                 transaction.type}
                              </div>
                              <div className="text-sm text-text-secondary">
                                {transaction.lot.location.name} • {transaction.user.name}
                              </div>
                              {transaction.notes && (
                                <div className="text-xs text-text-tertiary mt-1">
                                  {transaction.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className={`text-lg font-semibold ${
                              transaction.quantityChange > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.quantityChange > 0 ? '+' : ''}{transaction.quantityChange} stk
                            </div>
                            <div className="text-xs text-text-tertiary">
                              {new Date(transaction.createdAt).toLocaleDateString('nb-NO')} {new Date(transaction.createdAt).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {transaction.reasonCode && (
                              <div className="text-xs text-text-secondary">
                                {transaction.reasonCode}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Supplier Item Form Modal */}
        <Modal
          open={showSupplierItemForm}
          onClose={() => {
            setShowSupplierItemForm(false)
            setEditingSupplierItem(null)
          }}
          title={editingSupplierItem ? 'Rediger leverandørpris' : 'Koble til leverandør'}
          size="lg"
        >
          <SupplierItemForm
            editSupplierItem={editingSupplierItem}
            preselectedItem={{ id: item.id, name: item.name }}
            onSave={() => {
              setShowSupplierItemForm(false)
              setEditingSupplierItem(null)
              refreshSupplierItems()
            }}
            onCancel={() => {
              setShowSupplierItemForm(false)
              setEditingSupplierItem(null)
            }}
          />
        </Modal>

        {/* Consumption Form Modal */}
        {selectedLot && (
          <ConsumptionForm
            lot={selectedLot}
            open={showConsumptionForm}
            onClose={() => {
              setShowConsumptionForm(false)
              setSelectedLot(null)
            }}
            onSuccess={() => {
              refreshData()
            }}
          />
        )}
    </DetailPageLayout>
  )
}
