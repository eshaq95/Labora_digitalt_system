import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { BarcodeScanner } from '@/components/ui/barcode-scanner';
import { EntityQRCode } from '@/components/ui/qr-code-generator';
import { ScanResult } from '@/app/api/scan-lookup/route';
import { Scan, QrCode, Package, MapPin, Archive, CheckCircle } from 'lucide-react';

export default function ScannerDemoPage() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);

  const handleScanSuccess = (result: ScanResult) => {
    setLastScanResult(result);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'LOT': return <Archive className="h-5 w-5 text-blue-600" />;
      case 'ITEM': return <Package className="h-5 w-5 text-green-600" />;
      case 'LOCATION': return <MapPin className="h-5 w-5 text-purple-600" />;
      default: return <Scan className="h-5 w-5 text-gray-600" />;
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'LOT': return 'border-blue-200 bg-blue-50';
      case 'ITEM': return 'border-green-200 bg-green-50';
      case 'LOCATION': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  // Eksempel-data for QR-kode generering
  const exampleItems = [
    { type: 'location' as const, id: 'loc_123', name: 'Hovedlager A1', info: 'Hovedlager' },
    { type: 'item' as const, id: 'item_456', name: 'Pipettespisser 200µl', info: 'PIP0123' },
    { type: 'lot' as const, id: 'lot_789', name: 'Batch ABC123', info: 'Utløper: 2025-12-31' }
  ];

  return (
    <PageLayout title="Scanner & QR-kode Demo" description="Test hybrid strekkode/QR-kode systemet">
      <div className="space-y-6">
        
        {/* Scanner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scan className="h-5 w-5" />
              <span>Hybrid Scanner</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Systemet støtter både tradisjonelle 1D strekkoder og moderne 2D QR-koder. 
              Skann leverandørenes eksisterende strekkoder eller våre egne QR-koder for presis identifikasjon.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => setScannerOpen(true)}
                className="flex items-center space-x-2"
              >
                <Scan className="h-4 w-4" />
                <span>Åpne Scanner</span>
              </Button>
              
              <div className="text-sm text-gray-500">
                <strong>Støttede formater:</strong> QR-kode, EAN-13, Code 128, Code 39, UPC-A/E
              </div>
            </div>

            {/* Last Scan Result */}
            {lastScanResult && (
              <div className={`p-4 border rounded-lg ${getResultColor(lastScanResult.type)}`}>
                <div className="flex items-start space-x-3">
                  {getResultIcon(lastScanResult.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Skannet!</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {lastScanResult.message}
                    </p>
                    
                    {lastScanResult.data && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <h4 className="font-medium text-sm text-gray-800 mb-2">
                          {lastScanResult.type === 'LOT' ? 'Parti-informasjon' :
                           lastScanResult.type === 'ITEM' ? 'Vare-informasjon' :
                           lastScanResult.type === 'LOCATION' ? 'Lokasjon-informasjon' : 'Data'}
                        </h4>
                        <pre className="text-xs text-gray-600 overflow-auto">
                          {JSON.stringify(lastScanResult.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Generation Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5" />
              <span>QR-kode Generering</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              Generer QR-koder for intern merking av lokasjoner, partier og varer. 
              Disse kan skrives ut og festes på fysiske objekter for rask identifikasjon.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {exampleItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <EntityQRCode
                    type={item.type}
                    id={item.id}
                    name={item.name}
                    additionalInfo={item.info}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Implementation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Implementeringsdetaljer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Supported Formats */}
              <div>
                <h3 className="font-medium text-sm text-gray-800 mb-3">Støttede Formater</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span><strong>QR-koder (2D):</strong> Intern merking, høy datakapasitet</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span><strong>EAN-13/8:</strong> Leverandørenes produktkoder</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span><strong>Code 128/39:</strong> Industrielle strekkoder</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span><strong>UPC-A/E:</strong> Amerikanske produktkoder</span>
                  </li>
                </ul>
              </div>

              {/* Smart Resolution */}
              <div>
                <h3 className="font-medium text-sm text-gray-800 mb-3">Smart Oppslag</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span><strong>1. Parti-ID:</strong> Direkte til spesifikt parti</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span><strong>2. Vare-koder:</strong> SKU eller leverandør-strekkode</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span><strong>3. Lokasjon:</strong> Hylle- eller skap-koder</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span><strong>Feilhåndtering:</strong> Ukjente koder rapporteres</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Usage Instructions */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Bruksanvisning</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                <li>Klikk "Åpne Scanner" for å starte skanning</li>
                <li>Velg mellom kamera-skanning eller manuell input</li>
                <li>Skann en kode eller skriv den inn manuelt</li>
                <li>Systemet identifiserer automatisk hva koden representerer</li>
                <li>Få umiddelbar tilbakemelding og relevant informasjon</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Scanner Modal */}
        <BarcodeScanner
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          title="Hybrid Scanner Demo"
          description="Test både kamera-skanning og manuell input av strekkoder og QR-koder"
        />
      </div>
    </PageLayout>
  );
}
