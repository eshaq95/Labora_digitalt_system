import { useState } from 'react'
import { BarcodeScanner } from '@/components/ui/barcode-scanner'
import { SimpleScanner } from '@/components/ui/simple-scanner'
import { Button } from '@/components/ui/button'
import { ScanResult } from '@/app/api/scan-lookup/route'

export default function TestScannerPage() {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [simpleScannerOpen, setSimpleScannerOpen] = useState(false)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [lastSimpleResult, setLastSimpleResult] = useState<string | null>(null)

  const handleScanSuccess = (result: ScanResult) => {
    console.log('Advanced scan result:', result)
    setLastResult(result)
    setScannerOpen(false)
  }

  const handleSimpleScanSuccess = (code: string) => {
    console.log('Simple scan result:', code)
    setLastSimpleResult(code)
    setSimpleScannerOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Scanner Test</h1>
          <p className="text-gray-600 mt-2">Test QR/barcode scanning functionality</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => setScannerOpen(true)}
              className="w-full"
            >
              Advanced Scanner
            </Button>
            
            <Button 
              onClick={() => setSimpleScannerOpen(true)}
              className="w-full"
              variant="outline"
            >
              Simple Scanner
            </Button>
          </div>

          {lastResult && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">Advanced Scanner Result:</h3>
              <pre className="mt-2 text-sm overflow-auto text-blue-800">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </div>
          )}

          {lastSimpleResult && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900">Simple Scanner Result:</h3>
              <pre className="mt-2 text-sm overflow-auto text-green-800">
                {lastSimpleResult}
              </pre>
            </div>
          )}
        </div>

        <BarcodeScanner
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          title="Advanced Scanner"
          description="Scan any QR code or barcode"
        />

        <SimpleScanner
          isOpen={simpleScannerOpen}
          onClose={() => setSimpleScannerOpen(false)}
          onScanSuccess={handleSimpleScanSuccess}
          title="Simple Scanner"
          description="Basic QR code detection"
        />
      </div>
    </div>
  )
}
