import { useState } from 'react'
import { BarcodeScanner } from '@/components/ui/barcode-scanner'
import { Button } from '@/components/ui/button'
import { ScanResult } from '@/app/api/scan-lookup/route'

export default function TestScannerPage() {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)

  const handleScanSuccess = (result: ScanResult) => {
    console.log('Scan result:', result)
    setLastResult(result)
    setScannerOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Scanner Test</h1>
          <p className="text-gray-600 mt-2">Test QR/barcode scanning functionality</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <Button 
            onClick={() => setScannerOpen(true)}
            className="w-full"
          >
            Open Scanner
          </Button>

          {lastResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold">Last Scan Result:</h3>
              <pre className="mt-2 text-sm overflow-auto">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <BarcodeScanner
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          title="Test Scanner"
          description="Scan any QR code or barcode"
        />
      </div>
    </div>
  )
}
