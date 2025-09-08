import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // Hent inventory lot
    const lot = await prisma.inventoryLot.findUnique({
      where: { id },
      include: {
        item: true,
        location: true
      }
    });

    if (!lot) {
      return NextResponse.json(
        { error: 'Parti ikke funnet' },
        { status: 404 }
      );
    }

    // QR-koden inneholder lot ID for presis identifikasjon
    const qrCodeData = lot.id;

    // Generer QR-kode som PNG
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // High error correction for lot tracking
    });

    const filename = `lot-${lot.item.sku}-${lot.lotNumber || 'no-lot'}-qr.png`;

    return new NextResponse(qrCodeBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Lot QR code generation error:', error);
    return NextResponse.json(
      { error: 'Feil ved generering av QR-kode for parti' },
      { status: 500 }
    );
  }
}
