'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from './button';
import { Input } from './input';
import { Modal } from './modal';
import { Camera, Keyboard, Loader2, X } from 'lucide-react';

interface SimpleScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
  title?: string;
  description?: string;
}

export function SimpleScanner({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  title = "Simple QR Scanner",
  description = "Point camera at QR code"
}: SimpleScannerProps) {
  
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerElementId = 'simple-qr-reader';

  // Initialize Html5Qrcode scanner
  const initializeScanner = async () => {
    console.log('Initializing simple scanner...');
    
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
      }

      const html5QrCode = new Html5Qrcode(scannerElementId);
      html5QrCodeRef.current = html5QrCode;

      // Get available cameras
      const cameras = await Html5Qrcode.getCameras();
      console.log('Available cameras:', cameras);

      if (cameras && cameras.length > 0) {
        // Use back camera if available, otherwise use first camera
        const cameraId = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('environment')
        )?.id || cameras[0].id;

        console.log('Using camera:', cameraId);

        // Start scanning with better zoom settings
        await html5QrCode.start(
          cameraId,
          {
            fps: 15, // Higher FPS for better scanning with zoom
            qrbox: { width: 450, height: 450 }, // Maximum scanning area for largest view
            aspectRatio: 1.0,
            // Request higher resolution for better zoom (no mandatory minimums)
            width: { ideal: 1280 },
            height: { ideal: 720 },
            // Support all common formats including Data Matrix
            formatsToSupport: [
              // 2D Codes
              'QR_CODE',
              'DATA_MATRIX',
              // 1D Barcodes  
              'CODE_128',
              'CODE_39',
              'EAN_13',
              'EAN_8',
              'UPC_A',
              'UPC_E',
            ],
          },
          (decodedText, decodedResult) => {
            console.log('QR Code detected:', decodedText);
            onScanSuccess(decodedText);
            onClose();
          },
          (errorMessage) => {
            // This is called continuously when no QR code is detected
            // We don't need to log this as it's normal behavior
          }
        );

        console.log('Scanner started successfully');
      } else {
        throw new Error('No cameras found');
      }
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setError('Failed to initialize camera: ' + (err as Error).message);
      setCameraPermission('denied');
      setScanMode('manual');
    }
  };

  // Check camera permission
  const checkCameraPermission = async () => {
    try {
      console.log('Checking camera permissions...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission('granted');
      
      // Stop stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      console.log('Camera permission granted');
    } catch (err) {
      console.error('Camera permission denied:', err);
      setCameraPermission('denied');
      setScanMode('manual');
    }
  };

  // Handle manual input
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
      onClose();
    }
  };

  // Cleanup
  const cleanup = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
  };

  // Effects
  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && scanMode === 'camera' && cameraPermission === 'granted') {
      const timer = setTimeout(() => {
        initializeScanner();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, scanMode, cameraPermission]);

  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      checkCameraPermission();
    }
  }, [isOpen, scanMode]);

  const handleClose = () => {
    cleanup();
    setError(null);
    setManualCode('');
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title={title} size="full">
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
            <span>Camera</span>
          </Button>
          <Button
            type="button"
            variant={scanMode === 'manual' ? 'default' : 'outline'}
            onClick={() => setScanMode('manual')}
            className="flex items-center space-x-2"
          >
            <Keyboard className="h-4 w-4" />
            <span>Manual</span>
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
              Camera access denied. Please enable camera permissions and refresh the page.
            </p>
          </div>
        )}

        {/* Camera Scanner */}
        {scanMode === 'camera' && cameraPermission === 'granted' && (
          <div className="space-y-4">
            <div className="bg-black rounded-lg overflow-hidden">
              <div id={scannerElementId} className="w-full" style={{ minHeight: '500px' }}></div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Position the QR code within the scanning area
            </p>
          </div>
        )}

        {/* Manual Input */}
        {scanMode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter code manually:
              </label>
              <Input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter QR code or barcode..."
                className="w-full"
              />
            </div>
            <Button 
              type="submit" 
              disabled={!manualCode.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Code'
              )}
            </Button>
          </form>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
