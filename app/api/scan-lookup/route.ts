import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ScanRequestSchema = z.object({
  scannedCode: z.string().min(1, 'Skannet kode kan ikke være tom')
});

export type ScanResult = {
  type: 'LOT' | 'ITEM' | 'LOCATION' | 'UNKNOWN';
  data?: any;
  message?: string;
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
    // Dette dekker både interne SKU-er og leverandørens 1D strekkoder
    console.log('🏷️ Checking for item...');
    const item = await prisma.item.findFirst({
      where: {
        OR: [
          { barcode: scannedString },
          { sku: scannedString }
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
        inventoryLots: {
          include: {
            location: true
          },
          orderBy: {
            expiryDate: 'asc'
          }
        }
      }
    });

    if (item) {
      console.log('✅ Found item:', item.name);
      return {
        type: 'ITEM',
        data: item,
        message: `Vare funnet: ${item.name} (${item.sku})`
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
    const { scannedCode } = ScanRequestSchema.parse(body);

    // Rens input (fjern whitespace, konverter til uppercase hvis nødvendig)
    const cleanedCode = scannedCode.trim();

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
