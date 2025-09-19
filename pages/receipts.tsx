import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from '@/components/ui/table'
import { PageLayout } from '@/components/layout/page-layout'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import dynamic from 'next/dynamic'

// Dynamic imports for heavy components
const BarcodeScanner = dynamic(() => import('@/components/ui/barcode-scanner').then(mod => ({ default: mod.BarcodeScanner })), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>,
  ssr: false
})

// Code splitting for heavy form component
const ReceiptForm = dynamic(() => import('@/components/forms/receipt-form').then(mod => ({ default: mod.ReceiptForm })), {
  loading: () => (
    <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-xl border border-gray-200 dark:border-slate-700">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-center">
            <p className="text-gray-900 dark:text-white font-medium">Laster skjema...</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Vennligst vent mens vi laster inn mottaksskjemaet</p>
          </div>
        </div>
      </div>
    </div>
  ),
  ssr: false
})
import { motion } from 'framer-motion'
import { Plus, Receipt, Package, Clock, User, Scan } from 'lucide-react'
import { useRouter } from 'next/router'
import { ScanResult } from '@/app/api/scan-lookup/route'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { parseGS1Code } from '@/lib/gs1-parser'

type ReceiptType = { 
  id: string; 
  receivedAt: string;
  receivedBy?: string | null;
  receiver?: { name: string } | null;
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
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanHandled, setScanHandled] = useState(false)
  const scanHandledRef = useRef(false)
  const [prefilledItem, setPrefilledItem] = useState<any>(null)
  const [prefilledGS1Data, setPrefilledGS1Data] = useState<any>(null)
  const [unknownCode, setUnknownCode] = useState<string | null>(null)
  const [itemSelectOpen, setItemSelectOpen] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [itemSearch, setItemSearch] = useState('')
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null)
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
      // Handle new paginated response structure
      const receipts = data.receipts || data
      setReceipts(Array.isArray(receipts) ? receipts : [])
    } catch {
      showToast('error', 'Kunne ikke laste mottak')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setPrefilledItem(null)
    setPrefilledGS1Data(null)
    setModalOpen(true)
  }

  function openScanner() {
    // reset scan latch for a new session
    setScanHandled(false)
    scanHandledRef.current = false
    setScannerOpen(true)
  }

  const handleScanSuccess = (result: ScanResult) => {
    // Synchronous re-entrancy guard to avoid duplicate handling
    if (scanHandledRef.current) return
    scanHandledRef.current = true
    setScanHandled(true)
    setScannerOpen(false)
    
    if (result.type === 'ITEM' && result.data) {
      // Vare funnet - åpne mottak-skjema med forhåndsutfylt vare
      let message = `Vare funnet: ${result.data.name}`;
      
      // Add GS1 info to success message if available
      if (result.gs1Data?.isGS1) {
        const gs1Info: string[] = [];
        if (result.gs1Data.lotNumber) gs1Info.push(`Lot: ${result.gs1Data.lotNumber}`);
        if (result.gs1Data.expiryDate) {
          const expiryDate = new Date(result.gs1Data.expiryDate);
          gs1Info.push(`Utløper: ${expiryDate.toLocaleDateString('nb-NO')}`);
        }
        if (gs1Info.length > 0) {
          message += ` (${gs1Info.join(', ')})`;
        }
      }
      
      showToast('success', message)
      setPrefilledItem(result.data)
      setPrefilledGS1Data(result.gs1Data)
      setModalOpen(true)
    } else if (result.type === 'UNKNOWN') {
      // On-the-fly registration: let user identify item and bind barcode
      setLastScanResult(result)
      // Try to extract raw code from message if not provided
      const rawFromMessage = result.message?.match(/"([^\"]+)"/)?.[1]
      setUnknownCode(rawFromMessage || null)
      // Load items list (lazy)
      if (items.length === 0) {
        fetch('/api/items?limit=1000').then(r => r.json()).then(data => {
          setItems(data.items || data)
          setItemSelectOpen(true)
        }).catch(() => {
          showToast('error', 'Kunne ikke laste varer for kobling')
        })
      } else {
        setItemSelectOpen(true)
      }
      showToast('success', 'Ukjent kode – velg riktig vare for å koble strekkoden')
    } else if (result.type === 'SSCC_ERROR') {
      showToast('error', result.message || 'SSCC-kode kan ikke brukes for mottak')
    } else {
      showToast('error', 'Kunne ikke identifisere varen')
    }
  }

  const filteredItemsForSelect = items.filter((it: any) => {
    const q = itemSearch.toLowerCase()
    return it.name?.toLowerCase().includes(q) || it.sku?.toLowerCase().includes(q)
  })

  const linkBarcodeAndOpenReceipt = async (item: any) => {
    try {
      const raw = unknownCode || ''
      const gs1 = raw ? parseGS1Code(raw) : null
      const barcodeToSave = gs1?.isGS1 && gs1.gtin ? gs1.gtin : raw
      if (!barcodeToSave) {
        showToast('error', 'Fant ikke gyldig kode å koble')
        return
      }
      // Save barcode mapping
      const res = await fetch(`/api/items/${item.id}/barcodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: barcodeToSave, type: gs1?.isGS1 ? 'GTIN' : 'CUSTOM', isPrimary: true })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Kunne ikke koble strekkode')
      }
      showToast('success', 'Strekkode koblet til vare')
      setItemSelectOpen(false)
      setPrefilledItem(item)
      setPrefilledGS1Data(lastScanResult?.gs1Data || (gs1?.isGS1 ? gs1 : null))
      setModalOpen(true)
    } catch (e: any) {
      showToast('error', e.message || 'Feil ved kobling av strekkode')
    }
  }

  return (
    <PageLayout
      title="Mottak"
      subtitle="Registrer varemottak og lagerbevegelser"
      actions={
        <div className="flex gap-2">
          <Button onClick={openScanner} variant="outline">
            <Scan className="w-4 h-4 mr-2" />
            Skann vare
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nytt mottak
          </Button>
        </div>
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
                              <span className="text-sm">{receipt.receiver?.name || '—'}</span>
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
        onClose={() => {
          setModalOpen(false)
          setPrefilledItem(null)
          setPrefilledGS1Data(null)
        }} 
        onSave={load}
        orderId={orderId as string}
        prefilledItem={prefilledItem}
        prefilledGS1Data={prefilledGS1Data}
      />

      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Skann vare for mottak"
        description="Skann strekkode på varen du vil registrere mottak for"
      />

      {/* On-the-fly item selection for unknown codes */}
      <Modal open={itemSelectOpen} onClose={() => setItemSelectOpen(false)} title="Koble strekkode til vare" size="lg">
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {unknownCode ? (
              <span>Ukjent kode: <span className="font-mono text-gray-900 dark:text-gray-100">{unknownCode}</span></span>
            ) : (
              <span>Velg riktig vare fra listen</span>
            )}
          </div>
          <Input
            placeholder="Søk etter varenavn eller SKU..."
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
          />
          <div className="max-h-96 overflow-y-auto divide-y">
            {filteredItemsForSelect.map((it: any) => (
              <div key={it.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-gray-500">SKU: {it.sku}</div>
                </div>
                <Button onClick={() => linkBarcodeAndOpenReceipt(it)}>Velg</Button>
              </div>
            ))}
            {filteredItemsForSelect.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">Ingen treff</div>
            )}
          </div>
        </div>
      </Modal>
    </PageLayout>
  )
}