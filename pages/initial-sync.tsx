import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLayout } from '@/components/layout/page-layout'
import { BarcodeScanner } from '@/components/ui/barcode-scanner'
import { useToast } from '@/components/ui/toast'
import { motion, AnimatePresence } from 'framer-motion'
import { parseGS1Code, formatGS1Data } from '@/lib/gs1-parser'
import { 
  Scan, 
  Package, 
  MapPin, 
  Calendar, 
  Hash, 
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react'

type Item = {
  id: string
  name: string
  sku: string
  unit: string
  category?: string
  department?: string
}

type Location = {
  id: string
  name: string
  code: string
}

type SyncStep = 'scan' | 'identify' | 'count' | 'batch' | 'location' | 'confirm'

export default function InitialSyncPage() {
  const [currentStep, setCurrentStep] = useState<SyncStep>('scan')
  const [scannedCode, setScannedCode] = useState('')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form data
  const [quantity, setQuantity] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  
  const { showToast } = useToast()

  // Load reference data
  useEffect(() => {
    Promise.all([
      fetch('/api/items?limit=1000').then(r => r.json()),
      fetch('/api/locations').then(r => r.json())
    ]).then(([itemsResponse, locs]) => {
      setItems(itemsResponse.items || itemsResponse)
      setLocations(locs)
    }).catch(() => {
      showToast('error', 'Kunne ikke laste referansedata')
    })
  }, [])

  const handleScan = async (code: string) => {
    setScannedCode(code)
    setScannerOpen(false)
    setLoading(true)

    try {
      // Parse GS1 data first
      const gs1Data = parseGS1Code(code)
      console.log('GS1 parsed:', gs1Data)

      // Auto-fill batch and expiry if available from GS1
      if (gs1Data.isGS1) {
        if (gs1Data.lotNumber) {
          setBatchNumber(gs1Data.lotNumber)
          showToast('success', `Lotnummer automatisk fylt: ${gs1Data.lotNumber}`)
        }
        if (gs1Data.expiryDate) {
          setExpiryDate(gs1Data.expiryDate.toISOString().split('T')[0])
          showToast('success', `Utløpsdato automatisk fylt: ${gs1Data.expiryDate.toLocaleDateString('nb-NO')}`)
        }
      }

      // Check if code is already registered
      const response = await fetch(`/api/scan-lookup?code=${encodeURIComponent(code)}`)
      const result = await response.json()

      if (result.type === 'ITEM' && result.data) {
        // Code already registered - go directly to counting
        setSelectedItem(result.data)
        setCurrentStep('count')
        showToast('success', `Strekkode allerede registrert for ${result.data.name}`)
      } else if (result.type === 'SSCC_ERROR') {
        // SSCC code detected
        showToast('error', result.message)
        setCurrentStep('scan')
      } else {
        // Unknown code - need identification
        setCurrentStep('identify')
        showToast('info', gs1Data.isGS1 
          ? `GS1-kode detektert: ${formatGS1Data(gs1Data)}. Vennligst identifiser varen.`
          : 'Ukjent strekkode - vennligst identifiser varen'
        )
      }
    } catch (error) {
      showToast('error', 'Feil ved oppslag av strekkode')
      setCurrentStep('identify')
    } finally {
      setLoading(false)
    }
  }

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item)
    setCurrentStep('count')
  }

  const handleNext = () => {
    switch (currentStep) {
      case 'count':
        if (!quantity || parseInt(quantity) <= 0) {
          showToast('error', 'Vennligst oppgi gyldig antall')
          return
        }
        setCurrentStep('batch')
        break
      case 'batch':
        setCurrentStep('location')
        break
      case 'location':
        if (!selectedLocation) {
          showToast('error', 'Vennligst velg lokasjon')
          return
        }
        setCurrentStep('confirm')
        break
      case 'confirm':
        handleSubmit()
        break
    }
  }

  const handleSubmit = async () => {
    if (!selectedItem || !selectedLocation) return

    setLoading(true)
    try {
      // 1. Register barcode if not already registered
      if (currentStep === 'confirm' && scannedCode) {
        // For GS1 codes, save only the GTIN part
        const gs1Data = parseGS1Code(scannedCode)
        const barcodeToSave = gs1Data.isGS1 && gs1Data.gtin ? gs1Data.gtin : scannedCode
        
        await fetch(`/api/items/${selectedItem.id}/barcode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ barcode: barcodeToSave })
        })
      }

      // 2. Create inventory lot
      const lotResponse = await fetch('/api/inventory/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          itemId: selectedItem.id,
          locationId: selectedLocation.id,
          quantity: parseInt(quantity),
          batchNumber: batchNumber || null,
          expiryDate: expiryDate || null,
          source: 'INITIAL_SYNC'
        })
      })

      if (!lotResponse.ok) {
        throw new Error('Kunne ikke registrere lagerbeholdning')
      }

      showToast('success', `${selectedItem.name} registrert med ${quantity} stk`)
      
      // Reset for next item
      resetForm()
      
    } catch (error: any) {
      showToast('error', error.message || 'Feil ved registrering')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCurrentStep('scan')
    setScannedCode('')
    setSelectedItem(null)
    setQuantity('')
    setBatchNumber('')
    setExpiryDate('')
    setSelectedLocation(null)
    setSearchQuery('')
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <PageLayout
      title="Initial Synkronisering"
      subtitle="Bygg opp lagerbeholdning med strekkoderegistrering"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Progress Indicator */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {[
                { step: 'scan', label: 'Skann', icon: Scan },
                { step: 'identify', label: 'Identifiser', icon: Search },
                { step: 'count', label: 'Tell', icon: Package },
                { step: 'batch', label: 'Batch', icon: Hash },
                { step: 'location', label: 'Lokasjon', icon: MapPin },
                { step: 'confirm', label: 'Bekreft', icon: CheckCircle }
              ].map(({ step, label, icon: Icon }, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === step 
                      ? 'bg-blue-500 text-white' 
                      : ['scan', 'identify', 'count', 'batch', 'location'].indexOf(currentStep) > index
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="ml-2 text-sm font-medium">{label}</span>
                  {index < 5 && <div className="w-8 h-0.5 bg-gray-200 mx-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {currentStep === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="w-5 h-5" />
                    Skann Strekkode
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Skann strekkoden på varen du vil registrere i lageret.
                  </p>
                  
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => setScannerOpen(true)}
                      className="flex-1"
                      size="lg"
                    >
                      <Scan className="w-4 h-4 mr-2" />
                      Åpne Kamera
                    </Button>
                    
                    <div className="flex-1">
                      <Input
                        placeholder="Eller skriv inn strekkode manuelt"
                        value={scannedCode}
                        onChange={(e) => setScannedCode(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && scannedCode) {
                            handleScan(scannedCode)
                          }
                        }}
                      />
                    </div>
                  </div>

                  {scannedCode && (
                    <Button 
                      onClick={() => handleScan(scannedCode)}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Søker...' : 'Fortsett med denne koden'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'identify' && (
            <motion.div
              key="identify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Identifiser Vare
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-800">Ukjent strekkode: {scannedCode}</p>
                        {(() => {
                          const gs1Data = parseGS1Code(scannedCode)
                          return gs1Data.isGS1 ? (
                            <div className="mt-2">
                              <div className="flex items-center gap-1 mb-1">
                                <Zap className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">GS1-kode detektert</span>
                              </div>
                              <p className="text-sm text-blue-600">{formatGS1Data(gs1Data)}</p>
                            </div>
                          ) : null
                        })()}
                        <p className="text-sm text-amber-700 mt-1">Vennligst identifiser varen fra listen nedenfor</p>
                      </div>
                    </div>
                  </div>

                  <Input
                    placeholder="Søk etter varenavn eller SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {filteredItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleItemSelect(item)}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600">
                          SKU: {item.sku} • {item.unit}
                          {item.category && ` • ${item.category}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'count' && selectedItem && (
            <motion.div
              key="count"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Tell Beholdning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{selectedItem.name}</p>
                        <p className="text-sm text-green-700">SKU: {selectedItem.sku}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Antall på lager ({selectedItem.unit})
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Oppgi antall..."
                      className="text-lg"
                    />
                  </div>

                  <Button 
                    onClick={handleNext}
                    disabled={!quantity || parseInt(quantity) <= 0}
                    className="w-full"
                  >
                    Fortsett til Batch-info
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'batch' && (
            <motion.div
              key="batch"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    Batch/Lot Informasjon
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const gs1Data = parseGS1Code(scannedCode)
                    return gs1Data.isGS1 ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">GS1-data automatisk fylt</p>
                            <p className="text-sm text-green-700">Batch og utløpsdato er hentet fra strekkoden</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">
                        Registrer batch/lotnummer og utløpsdato hvis tilgjengelig.
                      </p>
                    )
                  })()}

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Batch/Lotnummer (valgfritt)
                      {batchNumber && parseGS1Code(scannedCode).isGS1 && (
                        <span className="ml-2 text-xs text-green-600 font-normal">• Auto-fylt fra GS1</span>
                      )}
                    </label>
                    <Input
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="F.eks. LOT123456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Utløpsdato (valgfritt)
                      {expiryDate && parseGS1Code(scannedCode).isGS1 && (
                        <span className="ml-2 text-xs text-green-600 font-normal">• Auto-fylt fra GS1</span>
                      )}
                    </label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleNext} className="w-full">
                    Fortsett til Lokasjon
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'location' && (
            <motion.div
              key="location"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Velg Lokasjon
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Hvor befinner denne varen seg?
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {locations.map(location => (
                      <div
                        key={location.id}
                        onClick={() => setSelectedLocation(location)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedLocation?.id === location.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-gray-600">{location.code}</div>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={handleNext}
                    disabled={!selectedLocation}
                    className="w-full"
                  >
                    Fortsett til Bekreftelse
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'confirm' && selectedItem && selectedLocation && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Bekreft Registrering
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="font-medium">Vare:</span> {selectedItem.name}
                    </div>
                    <div>
                      <span className="font-medium">Strekkode:</span> {scannedCode}
                    </div>
                    <div>
                      <span className="font-medium">Antall:</span> {quantity} {selectedItem.unit}
                    </div>
                    {batchNumber && (
                      <div>
                        <span className="font-medium">Batch:</span> {batchNumber}
                      </div>
                    )}
                    {expiryDate && (
                      <div>
                        <span className="font-medium">Utløper:</span> {new Date(expiryDate).toLocaleDateString('nb-NO')}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Lokasjon:</span> {selectedLocation.name}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? 'Registrerer...' : 'Registrer og Fortsett'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={resetForm}
                      className="flex-1"
                    >
                      Avbryt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanner Modal */}
        <BarcodeScanner
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={handleScan}
        />
      </div>
    </PageLayout>
  )
}
