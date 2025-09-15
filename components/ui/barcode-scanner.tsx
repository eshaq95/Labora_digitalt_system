'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from './button';
import { Input } from './input';
import { Modal } from './modal';
import { Camera, Keyboard, Loader2, X } from 'lucide-react';
import { ScanResult } from '@/app/api/scan-lookup/route';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: ScanResult) => void;
  title?: string;
  description?: string;
}

export function BarcodeScanner({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  title = "Skann Strekkode eller QR-kode",
  description = "Bruk kameraet eller skriv inn koden manuelt"
}: BarcodeScannerProps) {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementId = 'qr-reader';

  // Lookup funksjon som kaller vår smart resolver
  const lookupCode = async (code: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/scan-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scannedCode: code }),
      });

      const result: ScanResult = await response.json();
      
      if (result.type === 'UNKNOWN') {
        setError(result.message || 'Ukjent kode');
      } else {
        onScanSuccess(result);
        onClose();
      }
    } catch (err) {
      console.error('Lookup error:', err);
      setError('Feil ved oppslag. Sjekk nettverksforbindelsen.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle camera scanning
  const initializeScanner = () => {
    console.log('Initializing scanner...');
    
    if (scannerRef.current) {
      console.log('Clearing existing scanner');
      scannerRef.current.clear();
    }

    const scanner = new Html5QrcodeScanner(
      scannerElementId,
      {
        fps: 15, // Higher FPS for better scanning with zoom
        qrbox: function(viewfinderWidth, viewfinderHeight) {
          // Much smaller qrbox for maximum zoom effect
          const minEdgePercentage = 0.3; // 30% of the smaller dimension for maximum zoom
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: Math.max(qrboxSize, 150), // Minimum 150px for very focused scanning
            height: Math.max(qrboxSize, 150),
          };
        },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        aspectRatio: 1.777778, // 16:9 aspect ratio
        disableFlip: false,
        // Support all common formats including Data Matrix
        formatsToSupport: [
          // 2D Codes
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          // 1D Barcodes
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        // Add camera constraints for better focus and zoom
        videoConstraints: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 1920, min: 1280 }, // Higher resolution for better zoom
          height: { ideal: 1080, min: 720 },
          focusMode: "continuous",
          zoom: { ideal: 3.0, min: 2.0 }, // Request 3x zoom, minimum 2x
          advanced: [
            { focusMode: "continuous" },
            { zoom: { ideal: 3.0, min: 2.0 } }
          ]
        },
      },
      true // verbose - enable for debugging
    );

    scanner.render(
      (decodedText) => {
        // Suksess - kode skannet
        console.log('QR/Barcode scanned successfully:', decodedText);
        lookupCode(decodedText);
      },
      (errorMessage) => {
        // Feil ved skanning (dette er normalt og skjer kontinuerlig)
        // Men vi loggar för debugging
        if (errorMessage.includes('QR code parse error') || errorMessage.includes('No MultiFormat Readers')) {
          console.warn('Scanner error:', errorMessage);
        }
      }
    );

    scannerRef.current = scanner;
  };

  // Check camera permissions and capabilities
  const checkCameraPermission = async () => {
    try {
      console.log('Checking camera permissions...');
      
      // First check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not supported');
        setCameraPermission('denied');
        setScanMode('manual');
        return;
      }

      // Try to get camera access with high resolution constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 }
        } 
      });
      
      console.log('Camera permission granted');
      setCameraPermission('granted');
      
      // Stop stream immediately - we're just testing permissions
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.label);
        track.stop();
      });
    } catch (err) {
      console.error('Camera permission error:', err);
      setCameraPermission('denied');
      setScanMode('manual');
    }
  };

  // Håndter manuell input
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      lookupCode(manualCode.trim());
    }
  };

  // Cleanup ved unmount eller lukking
  useEffect(() => {
    if (!isOpen && scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
  }, [isOpen]);

  // Initialiser scanner når modal åpnes og kamera-modus er valgt
  useEffect(() => {
    if (isOpen && scanMode === 'camera' && cameraPermission === 'granted') {
      // Liten delay for å sikre at DOM-elementet er tilgjengelig
      const timer = setTimeout(() => {
        initializeScanner();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, scanMode, cameraPermission]);

  // Sjekk tillatelser når komponenten mounter
  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      checkCameraPermission();
    }
  }, [isOpen, scanMode]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setError(null);
    setManualCode('');
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{description}</p>

        {/* Mode Toggle */}
        <div className="flex space-x-2">
          <Button
            type="button"
            variant={scanMode === 'camera' ? 'default' : 'outline'}
            onClick={() => setScanMode('camera')}
            className="flex items-center space-x-2"
            disabled={cameraPermission === 'denied'}
          >
            <Camera className="h-4 w-4" />
            <span>Kamera</span>
          </Button>
          <Button
            type="button"
            variant={scanMode === 'manual' ? 'default' : 'outline'}
            onClick={() => setScanMode('manual')}
            className="flex items-center space-x-2"
          >
            <Keyboard className="h-4 w-4" />
            <span>Manuell</span>
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Camera Permission Denied */}
        {cameraPermission === 'denied' && scanMode === 'camera' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700">
              Kamera-tilgang er nektet. Bruk manuell input eller gi tillatelse til kamera i nettleserinnstillingene.
            </p>
          </div>
        )}

        {/* Camera Scanner */}
        {scanMode === 'camera' && cameraPermission === 'granted' && (
          <div className="space-y-4">
            <div 
              id={scannerElementId} 
              className="w-full"
              style={{ minHeight: '300px' }}
            />
            <p className="text-xs text-gray-500 text-center">
              Støtter både QR-koder og tradisjonelle strekkoder (EAN, Code 128, etc.)
            </p>
          </div>
        )}

        {/* Manual Input */}
        {scanMode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Skriv inn strekkode eller QR-kode
              </label>
              <Input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Skriv eller skann inn koden her..."
                className="font-mono"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Tips: Bruk en ekstern skanner som "keyboard wedge" for rask input
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                type="submit"
                disabled={!manualCode.trim() || isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Søk opp kode</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setManualCode('')}
              >
                Tøm
              </Button>
            </div>
          </form>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-gray-600">Søker opp kode...</span>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Lukk
          </Button>
        </div>
      </div>
    </Modal>
  );
}
