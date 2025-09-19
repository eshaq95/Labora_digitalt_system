import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseGS1Code, extractGTIN, isSSCCCode, formatGS1Data } from '@/lib/gs1-parser';
import { scanLookupSchema, validateRequest } from '@/lib/validation-schemas';

export type ScanResult = {
  type: 'LOT' | 'ITEM' | 'LOCATION' | 'UNKNOWN' | 'SSCC_ERROR';
  data?: any;
  message?: string;
  gs1Data?: any; // GS1 parsed data hvis relevant
};

/**
 * Smart Scan Resolver - Den sentrale logikken for å tolke skannede koder
 * Støtter både 1D strekkoder og 2D QR-koder
 * 
 * Prioritert rekkefølge:
 * 1. InventoryLot ID (mest spesifikt - QR-koder ved mottak)
 * 2. Item barcode/SKU (leverandør strekkoder)
 * 3. Location code/QR (hylle-merking)
 */
async function resolveScannedCode(scannedString: string): Promise<ScanResult> {
  try {
    console.log('🔍 Resolving scanned code:', scannedString);
    
    // 0. Parse GS1-kode hvis relevant
    const gs1Data = parseGS1Code(scannedString);
    console.log('📊 GS1 Parse result:', gs1Data);
    
    // 0.1. Sjekk for SSCC-koder (logistikk) - disse skal ikke brukes for vareidentifikasjon
    if (isSSCCCode(scannedString)) {
      return {
        type: 'SSCC_ERROR',
        gs1Data,
        message: `Dette er en Kolli-kode (SSCC: ${gs1Data.sscc}). Vennligst skann koden på selve produktet, ikke transportetiketten.`
      };
    }
    
    // 1. Sjekk om det er en unik ID for et parti (mest spesifikt først)
    // Dette er typisk QR-koder vi har generert ved mottak
    console.log('📦 Checking for inventory lot...');
    const lot = await prisma.inventoryLot.findUnique({
      where: { id: scannedString },
      include: {
        item: {
          include: {
            category: true,
            department: true
          }
        },
        location: true
      }
    });
    
    if (lot) {
      return {
        type: 'LOT',
        data: lot,
        message: `Parti funnet: ${lot.item.name} (Lot: ${lot.lotNumber || 'N/A'})`
      };
    }

    // 2. Sjekk om det er en Vare (SKU eller leverandør-strekkode)
    // For GS1-koder: bruk kun GTIN-delen for oppslag
    // For vanlige koder: bruk hele strengen
    console.log('🏷️ Checking for item...');
    const searchCode = gs1Data.isGS1 && gs1Data.gtin ? gs1Data.gtin : scannedString;
    console.log('🔍 Using search code:', searchCode);
    
    // First try direct item lookup (legacy barcode field and SKU)
    let item = await prisma.item.findFirst({
      where: {
        OR: [
          { barcode: searchCode },
          { sku: searchCode }
        ]
      },
      include: {
        category: true,
        department: true,
        supplierItems: {
          include: {
            supplier: true
          }
        },
        lots: {
          where: {
            quantity: { gt: 0 } // Kun partier med beholdning
          },
          include: {
            location: true
          },
          orderBy: [
            { expiryDate: 'asc' }, // FEFO: First Expired, First Out
            { createdAt: 'asc' }   // Deretter eldste først
          ]
        }
      }
    });

    // If not found, try ItemBarcode table
    if (!item) {
      console.log('🔍 Searching in ItemBarcode table...');
      const itemBarcode = await prisma.itemBarcode.findUnique({
        where: { barcode: searchCode },
        include: {
          item: {
            include: {
              category: true,
              department: true,
              supplierItems: {
                include: {
                  supplier: true
                }
              },
              lots: {
                where: {
                  quantity: { gt: 0 }
                },
                include: {
                  location: true
                },
                orderBy: [
                  { expiryDate: 'asc' },
                  { createdAt: 'asc' }
                ]
              }
            }
          }
        }
      });
      
      if (itemBarcode) {
        item = itemBarcode.item;
        console.log('✅ Found item via ItemBarcode:', item.name);
      }
    }

    if (item) {
      console.log('✅ Found item:', item.name);
      
      // Hvis dette er en GS1-kode med batch-info, prøv å finne spesifikk lot
      let specificLot = null;
      if (gs1Data.isGS1 && gs1Data.lotNumber) {
        console.log('🔍 Looking for specific lot:', gs1Data.lotNumber);
        specificLot = await prisma.inventoryLot.findFirst({
          where: {
            itemId: item.id,
            lotNumber: gs1Data.lotNumber,
            quantity: { gt: 0 }
          },
          include: {
            location: true
          }
        });
      }
      
      return {
        type: 'ITEM',
        data: item,
        gs1Data: gs1Data.isGS1 ? gs1Data : undefined,
        specificLot,
        message: gs1Data.isGS1 
          ? `Vare funnet via GS1: ${item.name} ${gs1Data.lotNumber ? `(Lot: ${gs1Data.lotNumber})` : ''}`
          : `Vare funnet: ${item.name} (${item.sku})`
      };
    }
    console.log('❌ No item found');

    // 3. Sjekk om det er en lokasjon (code eller QR-kode)
    // Dette er typisk QR-koder på hyller og skap
    const location = await prisma.location.findFirst({
      where: {
        OR: [
          { code: scannedString },
          { id: scannedString }
        ]
      },
      include: {
        lots: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    if (location) {
      return {
        type: 'LOCATION',
        data: location,
        message: `Lokasjon funnet: ${location.name}`
      };
    }

    // 4. Ingen treff - ukjent kode
    return {
      type: 'UNKNOWN',
      message: `Ukjent kode: "${scannedString}". Sjekk at koden er riktig eller registrer den i systemet.`
    };

  } catch (error) {
    console.error('❌ Feil ved oppslag av skannet kode:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
    return {
      type: 'UNKNOWN',
      message: `Feil ved oppslag: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = validateRequest(scanLookupSchema, { code: body.scannedCode || body.code });
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    // Rens input (fjern whitespace, konverter til uppercase hvis nødvendig)
    const cleanedCode = validationResult.data.code.trim();

    const result = await resolveScannedCode(cleanedCode);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Scan lookup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          type: 'UNKNOWN',
          message: 'Ugyldig forespørsel: ' + error.issues.map(i => i.message).join(', ')
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        type: 'UNKNOWN',
        message: 'Intern serverfeil ved skanning'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing med query parameter
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { 
        type: 'UNKNOWN',
        message: 'Mangler "code" parameter'
      },
      { status: 400 }
    );
  }

  const result = await resolveScannedCode(code);
  return NextResponse.json(result);
}
