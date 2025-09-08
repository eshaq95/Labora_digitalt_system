import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DetailPageLayout } from '@/components/layout/page-layout'
import { Modal } from '@/components/ui/modal'
import { SupplierItemForm } from '@/components/forms/supplier-item-form'
import { motion } from 'framer-motion'
import { 
  Truck, ArrowLeft, Edit, Plus, Globe, Mail, Phone, 
  User, DollarSign, Package, FileText, ExternalLink,
  Star, Calendar, AlertCircle, Upload
} from 'lucide-react'

type Supplier = {
  id: string
  name: string
  orderMethod?: string
  website?: string
  orderEmail?: string
  contactPerson?: string
  phone?: string
  username?: string
  notes?: string
  freeShippingThreshold?: number
  standardShippingCost?: number
  orderingInstructions?: string
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
  item: {
    id: string
    name: string
    sku: string
    unit: string
  }
}

type PurchaseOrder = {
  id: string
  orderNumber: string
  status: string
  requestedDate: string
  expectedDate?: string
  requestedBy?: string
  totalAmount?: number
}

export default function SupplierDetailPage() {
  const router = useRouter()
  const { id } = router.query
  
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [supplierItems, setSupplierItems] = useState<SupplierItem[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'contact' | 'orders' | 'pricing'>('contact')
  const [showSupplierItemForm, setShowSupplierItemForm] = useState(false)
  const [editingSupplierItem, setEditingSupplierItem] = useState<SupplierItem | null>(null)

  useEffect(() => {
    if (!id) return
    
    const fetchData = async () => {
      try {
        const [supplierRes, supplierItemsRes, ordersRes] = await Promise.all([
          fetch(`/api/suppliers/${id}`),
          fetch(`/api/supplier-items?supplierId=${id}`),
          fetch(`/api/orders?supplierId=${id}`)
        ])

        if (supplierRes.ok) {
          const supplierData = await supplierRes.json()
          setSupplier(supplierData)
        }

        if (supplierItemsRes.ok) {
          const supplierItemsData = await supplierItemsRes.json()
          setSupplierItems(Array.isArray(supplierItemsData) ? supplierItemsData : [])
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          setOrders(Array.isArray(ordersData) ? ordersData.filter((o: any) => o.supplierId === id) : [])
        }
      } catch (error) {
        console.error('Kunne ikke laste leverandørdetaljer:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleAddSupplierItem = () => {
    setEditingSupplierItem(null)
    setShowSupplierItemForm(true)
  }

  const handleEditSupplierItem = (supplierItem: SupplierItem) => {
    setEditingSupplierItem(supplierItem)
    setShowSupplierItemForm(true)
  }

  const refreshSupplierItems = async () => {
    try {
      const res = await fetch(`/api/supplier-items?supplierId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setSupplierItems(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Kunne ikke oppdatere prisbok:', error)
    }
  }

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

  if (!supplier) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Truck className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">Leverandør ikke funnet</h2>
            <p className="text-text-secondary mb-6">Leverandøren du leter etter eksisterer ikke eller er slettet.</p>
            <Button onClick={() => router.push('/suppliers')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake til leverandører
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DetailPageLayout
      title={supplier.name}
      subtitle={`${supplierItems.length} produkter • ${orders.length} bestillinger`}
      backHref="/suppliers"
      actions={
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Rediger leverandør
        </Button>
      }
    >

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="flex space-x-8">
              {[
                { key: 'contact', label: 'Kontaktinfo', icon: User },
                { key: 'orders', label: 'Bestillinger', icon: Package },
                { key: 'pricing', label: 'Prisbok og Avtaler', icon: DollarSign }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
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
          {/* Contact Info Tab */}
          {activeTab === 'contact' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Contact Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Kontaktinformasjon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {supplier.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-text-secondary" />
                        <a 
                          href={supplier.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-labora hover:text-labora-700 hover:underline"
                        >
                          {supplier.website}
                        </a>
                      </div>
                    )}
                    {supplier.orderEmail && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-text-secondary" />
                        <a 
                          href={`mailto:${supplier.orderEmail}`}
                          className="text-labora hover:text-labora-700 hover:underline"
                        >
                          {supplier.orderEmail}
                        </a>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-text-secondary" />
                        <a 
                          href={`tel:${supplier.phone}`}
                          className="text-labora hover:text-labora-700 hover:underline"
                        >
                          {supplier.phone}
                        </a>
                      </div>
                    )}
                    {supplier.contactPerson && (
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-text-secondary" />
                        <span className="text-text-primary">{supplier.contactPerson}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ordering Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Bestillingsinformasjon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Bestillingsmetode</label>
                      <p className="text-text-primary">{supplier.orderMethod || '—'}</p>
                    </div>
                    {supplier.freeShippingThreshold && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Gratis frakt fra</label>
                        <p className="text-text-primary">{Number(supplier.freeShippingThreshold).toFixed(2)} NOK</p>
                      </div>
                    )}
                    {supplier.standardShippingCost && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Standard fraktkostnad</label>
                        <p className="text-text-primary">{Number(supplier.standardShippingCost).toFixed(2)} NOK</p>
                      </div>
                    )}
                    {supplier.orderingInstructions && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Bestillingsinstruksjoner</label>
                        <p className="text-text-primary bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/30">
                          {supplier.orderingInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {supplier.notes && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Notater og informasjon</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-text-primary">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {supplier.notes}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Bestillingshistorikk</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-text-primary mb-2">Ingen bestillinger</h3>
                      <p className="text-text-secondary">Ingen bestillinger er registrert hos denne leverandøren ennå.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 10).map((order, index) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-surface hover:bg-surface-hover rounded-xl border border-border transition-colors cursor-pointer"
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${
                              order.status === 'RECEIVED' ? 'bg-success' :
                              order.status === 'SHIPPED' ? 'bg-blue-500' :
                              order.status === 'ORDERED' ? 'bg-amber-500' :
                              'bg-text-tertiary'
                            }`}></div>
                            <div>
                              <div className="font-medium text-text-primary">
                                {order.orderNumber}
                              </div>
                              <div className="text-sm text-text-secondary">
                                {order.requestedBy && `Bestilt av: ${order.requestedBy}`}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-text-primary">
                              {order.status === 'DRAFT' ? 'Utkast' :
                               order.status === 'ORDERED' ? 'Bestilt' :
                               order.status === 'CONFIRMED' ? 'Bekreftet' :
                               order.status === 'SHIPPED' ? 'Sendt' :
                               order.status === 'RECEIVED' ? 'Mottatt' :
                               order.status}
                            </div>
                            <div className="text-xs text-text-tertiary">
                              {new Date(order.requestedDate).toLocaleDateString('nb-NO')}
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

          {/* Pricing & Agreements Tab */}
          {activeTab === 'pricing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Agreement Details */}
              {(supplier.freeShippingThreshold || supplier.orderingInstructions) && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Avtaledetaljer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {supplier.freeShippingThreshold && (
                        <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-xl border border-success-200 dark:border-success-800/30">
                          <div className="text-sm font-medium text-success-800 dark:text-success-200 mb-1">
                            Gratis frakt fra
                          </div>
                          <div className="text-xl font-bold text-success-900 dark:text-success-100">
                            {Number(supplier.freeShippingThreshold).toFixed(0)} NOK
                          </div>
                        </div>
                      )}
                      {supplier.standardShippingCost && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
                          <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                            Standard frakt
                          </div>
                          <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                            {Number(supplier.standardShippingCost).toFixed(2)} NOK
                          </div>
                        </div>
                      )}
                      {supplier.orderingInstructions && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                          <div className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            Viktig instruksjon
                          </div>
                          <div className="text-sm text-amber-900 dark:text-amber-100">
                            {supplier.orderingInstructions}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pricing Catalog */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Prisbok ({supplierItems.length} produkter)</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Importer prisliste
                      </Button>
                      <Button onClick={handleAddSupplierItem}>
                        <Plus className="w-4 h-4 mr-2" />
                        Legg til produkt
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {supplierItems.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-text-primary mb-2">Ingen produkter i prisboken</h3>
                      <p className="text-text-secondary mb-6">
                        Legg til produkter for å administrere priser og avtaler med denne leverandøren.
                      </p>
                      <Button onClick={handleAddSupplierItem}>
                        <Plus className="w-4 h-4 mr-2" />
                        Legg til første produkt
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {supplierItems.map((supplierItem, index) => (
                        <motion.div
                          key={supplierItem.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 bg-surface hover:bg-surface-hover rounded-xl border border-border transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {supplierItem.isPrimarySupplier && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-text-primary">
                                  {supplierItem.item.name}
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
                                SKU: {supplierItem.item.sku} • Art.nr: {supplierItem.supplierPartNumber}
                              </div>
                              {supplierItem.discountCodeRequired && (
                                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                  🎟️ Rabattkode: {supplierItem.discountCodeRequired}
                                </div>
                              )}
                              {supplierItem.agreementReference && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                  📋 Avtale: {supplierItem.agreementReference}
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
                              <div className="text-xs text-text-tertiary">
                                per {supplierItem.item.unit.toLowerCase()}
                              </div>
                              {supplierItem.priceValidUntil && (
                                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                  <Calendar className="w-3 h-3 inline mr-1" />
                                  Utløper: {new Date(supplierItem.priceValidUntil).toLocaleDateString('nb-NO')}
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
        </div>

        {/* Supplier Item Form Modal */}
        <Modal
          open={showSupplierItemForm}
          onClose={() => {
            setShowSupplierItemForm(false)
            setEditingSupplierItem(null)
          }}
          title={editingSupplierItem ? 'Rediger produktpris' : 'Legg til produkt i prisbok'}
          size="lg"
        >
          <SupplierItemForm
            editSupplierItem={editingSupplierItem}
            supplierId={supplier.id}
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
    </DetailPageLayout>
  )
}
