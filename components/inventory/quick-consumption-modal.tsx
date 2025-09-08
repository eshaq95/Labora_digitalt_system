'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { ScanResult } from '@/app/api/scan-lookup/route';
import { 
  Package, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  User,
  Loader2,
  ArrowRight
} from 'lucide-react';

interface QuickConsumptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanResult: ScanResult | null;
  onSuccess?: () => void;
}

interface InventoryLot {
  id: string;
  quantity: number;
  lotNumber: string | null;
  expiryDate: string | null;
  location: {
    id: string;
    name: string;
    type: string;
  };
}

interface ItemData {
  id: string;
  sku: string;
  name: string;
  unit: string;
  minStock: number;
  lots: InventoryLot[];
  category?: { name: string };
  department?: { name: string };
}

export function QuickConsumptionModal({ 
  isOpen, 
  onClose, 
  scanResult, 
  onSuccess 
}: QuickConsumptionModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('ANALYSIS');
  const [notes, setNotes] = useState('');
  const [selectedLot, setSelectedLot] = useState<InventoryLot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && scanResult) {
      setQuantity(1);
      setReason('ANALYSIS');
      setNotes('');
      
      // Auto-select lot based on scan result type
      if (scanResult.type === 'LOT') {
        // Specific lot was scanned - use it directly
        setSelectedLot(scanResult.data);
      } else if (scanResult.type === 'ITEM' && scanResult.data.lots?.length > 0) {
        // Item was scanned - auto-select FEFO lot (first in sorted array)
        setSelectedLot(scanResult.data.lots[0]);
      } else {
        setSelectedLot(null);
      }
    }
  }, [isOpen, scanResult]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLot) {
      showToast('error', 'Ingen parti valgt');
      return;
    }

    if (quantity <= 0 || quantity > selectedLot.quantity) {
      showToast('error', `Ugyldig mengde. Tilgjengelig: ${selectedLot.quantity}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/inventory/consumption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lotId: selectedLot.id,
          quantity: quantity,
          reason: reason,
          notes: notes || `Hurtiguttak via skanning`
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Feil ved registrering av uttak');
      }

      const result = await response.json();
      
      showToast('success', `✅ ${quantity} ${getItemData()?.unit || 'stk'} registrert som uttak`);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Consumption error:', error);
      showToast('error', error instanceof Error ? error.message : 'Feil ved registrering av uttak');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getItemData = (): ItemData | null => {
    if (scanResult?.type === 'LOT') {
      return scanResult.data.item;
    } else if (scanResult?.type === 'ITEM') {
      return scanResult.data;
    }
    return null;
  };

  const isExpiringSoon = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30; // Utløper innen 30 dager
  };

  const isLowStock = (lot: InventoryLot): boolean => {
    const item = getItemData();
    return item ? lot.quantity <= item.minStock : false;
  };

  const itemData = getItemData();

  if (!scanResult || !itemData) {
    return null;
  }

  return (
    <Modal 
      open={isOpen} 
      onClose={onClose} 
      title="🚀 Hurtiguttak - Scan & Go"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Item Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Package className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900">{itemData.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-blue-700 mt-1">
                <span className="font-mono">{itemData.sku}</span>
                {itemData.category && (
                  <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                    {itemData.category.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lot Selection */}
        {scanResult.type === 'ITEM' && itemData.lots.length > 1 && (
          <div>
            <label className="block text-sm font-medium mb-3">
              Velg parti (FEFO - Eldste først)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {itemData.lots.map((lot) => (
                <div
                  key={lot.id}
                  onClick={() => setSelectedLot(lot)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedLot?.id === lot.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedLot?.id === lot.id ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{lot.location.name}</span>
                          {lot.lotNumber && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                              {lot.lotNumber}
                            </span>
                          )}
                        </div>
                        {lot.expiryDate && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className={`text-xs ${
                              isExpiringSoon(lot.expiryDate) 
                                ? 'text-red-600 font-medium' 
                                : 'text-gray-500'
                            }`}>
                              Utløper: {new Date(lot.expiryDate).toLocaleDateString('nb-NO')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{lot.quantity} {itemData.unit}</div>
                      {isLowStock(lot) && (
                        <div className="flex items-center text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Lav beholdning
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Lot Info (for single lot or LOT scan) */}
        {selectedLot && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Valgt parti</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Lokasjon:</span>
                <div className="font-medium">{selectedLot.location.name}</div>
              </div>
              <div>
                <span className="text-gray-600">Tilgjengelig:</span>
                <div className="font-medium">{selectedLot.quantity} {itemData.unit}</div>
              </div>
              {selectedLot.lotNumber && (
                <div>
                  <span className="text-gray-600">Lot-nummer:</span>
                  <div className="font-mono text-sm">{selectedLot.lotNumber}</div>
                </div>
              )}
              {selectedLot.expiryDate && (
                <div>
                  <span className="text-gray-600">Utløpsdato:</span>
                  <div className={`font-medium ${
                    isExpiringSoon(selectedLot.expiryDate) ? 'text-red-600' : ''
                  }`}>
                    {new Date(selectedLot.expiryDate).toLocaleDateString('nb-NO')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Mengde å ta ut
          </label>
          <div className="flex items-center space-x-3">
            <Input
              type="number"
              min="1"
              max={selectedLot?.quantity || 1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-24"
              autoFocus
            />
            <span className="text-sm text-gray-600">{itemData.unit}</span>
            <span className="text-xs text-gray-500">
              (Maks: {selectedLot?.quantity || 0})
            </span>
          </div>
        </div>

        {/* Reason Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Årsak til uttak
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ANALYSIS">Analyse</option>
            <option value="PRODUCTION">Produksjon</option>
            <option value="QUALITY_CONTROL">Kvalitetskontroll</option>
            <option value="RESEARCH">Forskning</option>
            <option value="MAINTENANCE">Vedlikehold</option>
            <option value="DAMAGED">Skadet/Kassert</option>
            <option value="OTHER">Annet</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Notater (valgfritt)
          </label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="F.eks. prosjektnummer, batch-ID..."
          />
        </div>

        {/* Warnings */}
        {selectedLot && isExpiringSoon(selectedLot.expiryDate) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Advarsel: Dette partiet utløper snart!
              </span>
            </div>
          </div>
        )}

        {selectedLot && isLowStock(selectedLot) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Advarsel: Lav beholdning etter uttak!
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t">
          <Button
            type="submit"
            disabled={!selectedLot || isSubmitting}
            className="flex-1 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                <span>Registrer uttak</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Avbryt
          </Button>
        </div>
      </form>
    </Modal>
  );
}
