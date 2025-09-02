import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from '@/components/ui/table'
import { PageLayout } from '@/components/layout/page-layout'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { ReceiptForm } from '@/components/forms/receipt-form'
import { motion } from 'framer-motion'
import { Plus, Receipt, Package, Clock, User } from 'lucide-react'
import { useRouter } from 'next/router'

type ReceiptType = { 
  id: string; 
  receivedAt: string;
  receivedBy?: string | null;
  order?: { orderNumber: string } | null;
  supplier?: { name: string } | null;
  lines: { 
    item: { name: string } | null; 
    location: { name: string } | null; 
    quantity: number;
    lotNumber?: string | null;
    expiryDate?: string | null;
  }[]
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptType[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  const router = useRouter()
  const { orderId } = router.query

  const filteredReceipts = receipts.filter(receipt => 
    receipt.lines.some(line => 
      line.item?.name.toLowerCase().includes(search.toLowerCase()) ||
      line.location?.name.toLowerCase().includes(search.toLowerCase())
    ) ||
    new Date(receipt.receivedAt).toLocaleDateString('nb-NO').includes(search)
  )

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/receipts', { cache: 'no-store' })
      const data = await res.json()
      setReceipts(Array.isArray(data) ? data : [])
    } catch {
      showToast('error', 'Kunne ikke laste mottak')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setModalOpen(true)
  }

  return (
    <PageLayout
      title="Mottak"
      subtitle="Registrer varemottak og lagerbevegelser"
      actions={
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nytt mottak
        </Button>
      }
    >

      <Card className="border-border bg-surface">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Mottaksregister
              </CardTitle>
              <SearchInput 
                value={search} 
                onChange={setSearch} 
                placeholder="Søk i mottak..." 
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
            ) : filteredReceipts.length === 0 ? (
              <EmptyState 
                title={search ? 'Ingen treff' : 'Ingen mottak ennå'}
                description={search ? 'Prøv et annet søk' : 'Registrer ditt første varemottak'}
                action={!search ? <Button onClick={openCreate}>Registrer mottak</Button> : undefined}
              />
            ) : (
              <div className="rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableHead className="font-semibold">Mottaksdato</TableHead>
                        <TableHead className="font-semibold">Mottatt av</TableHead>
                        <TableHead className="font-semibold">Bestilling</TableHead>
                        <TableHead className="font-semibold">Varer mottatt</TableHead>
                        <TableHead className="font-semibold">Sporing</TableHead>
                        <TableHead className="font-semibold text-right">Antall linjer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReceipts.map((receipt, index) => (
                        <motion.tr
                          key={receipt.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <div>
                                <div className="text-sm">
                                  {new Date(receipt.receivedAt).toLocaleDateString('nb-NO')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(receipt.receivedAt).toLocaleTimeString('nb-NO', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{receipt.receivedBy || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {receipt.order ? (
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                                  {receipt.order.orderNumber}
                                </span>
                              </div>
                            ) : receipt.supplier ? (
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {receipt.supplier.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">Manuell registrering</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {receipt.lines.slice(0, 2).map((line, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">
                                    {line.item?.name || 'Ukjent vare'}
                                  </span>
                                  <span className="text-gray-400">•</span>
                                  <span className="font-mono text-blue-600 dark:text-blue-400">
                                    {line.quantity}
                                  </span>
                                </div>
                              ))}
                              {receipt.lines.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{receipt.lines.length - 2} flere...
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {receipt.lines.some(line => line.lotNumber) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                  🏷️ Lot
                                </span>
                              )}
                              {receipt.lines.some(line => line.expiryDate) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                                  📅 Utløp
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                              {receipt.lines.length} {receipt.lines.length === 1 ? 'linje' : 'linjer'}
                            </span>
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

      <ReceiptForm 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSave={load}
        orderId={orderId as string}
      />
    </PageLayout>
  )
}