'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from './button';
import { Download, Printer, Copy, Check } from 'lucide-react';

interface QRCodeGeneratorProps {
  data: string;
  label?: string;
  size?: number;
  className?: string;
}

export function QRCodeGenerator({ 
  data, 
  label, 
  size = 200, 
  className = '' 
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateQRCode();
  }, [data, size]);

  const generateQRCode = async () => {
    try {
      setError(null);
      const url = await QRCode.toDataURL(data, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' // Medium error correction (15% recovery)
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('QR Code generation error:', err);
      setError('Kunne ikke generere QR-kode');
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${data.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!qrCodeUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR-kode: ${label || data}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                margin: 20px;
              }
              .qr-container {
                display: inline-block;
                border: 2px solid #000;
                padding: 20px;
                margin: 20px;
              }
              .qr-label {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .qr-data {
                font-size: 10px;
                font-family: monospace;
                margin-top: 10px;
                word-break: break-all;
              }
              @media print {
                body { margin: 0; }
                .qr-container { 
                  border: 1px solid #000;
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              ${label ? `<div class="qr-label">${label}</div>` : ''}
              <img src="${qrCodeUrl}" alt="QR Code" />
              <div class="qr-data">${data}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-md ${className}`}>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!qrCodeUrl) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* QR Code Display */}
      <div className="flex flex-col items-center space-y-2">
        {label && (
          <h3 className="text-sm font-medium text-gray-700">{label}</h3>
        )}
        <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
          <img 
            src={qrCodeUrl} 
            alt="QR Code" 
            className="block"
            style={{ width: size, height: size }}
          />
        </div>
        <p className="text-xs text-gray-500 font-mono break-all max-w-xs text-center">
          {data}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="flex items-center space-x-1"
        >
          <Download className="h-4 w-4" />
          <span>Last ned</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="flex items-center space-x-1"
        >
          <Printer className="h-4 w-4" />
          <span>Skriv ut</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center space-x-1"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Kopiert!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Kopier kode</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Utility component for generating QR codes for specific entities
interface EntityQRCodeProps {
  type: 'location' | 'lot' | 'item';
  id: string;
  name: string;
  additionalInfo?: string;
}

export function EntityQRCode({ type, id, name, additionalInfo }: EntityQRCodeProps) {
  const getLabel = () => {
    switch (type) {
      case 'location':
        return `Lokasjon: ${name}`;
      case 'lot':
        return `Parti: ${name}`;
      case 'item':
        return `Vare: ${name}`;
      default:
        return name;
    }
  };

  const getDescription = () => {
    if (additionalInfo) {
      return `${getLabel()} - ${additionalInfo}`;
    }
    return getLabel();
  };

  return (
    <QRCodeGenerator
      data={id}
      label={getDescription()}
      size={150}
    />
  );
}
