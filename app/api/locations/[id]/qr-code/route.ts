import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // Hent lokasjon
    const location = await prisma.location.findUnique({
      where: { id }
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Lokasjon ikke funnet' },
        { status: 404 }
      );
    }

    // Generer eller oppdater QR-kode hvis den ikke finnes
    let qrCodeData = location.qrCode || location.id;
    
    if (!location.qrCode) {
      // Oppdater lokasjon med QR-kode data
      await prisma.location.update({
        where: { id },
        data: { qrCode: location.id }
      });
      qrCodeData = location.id;
    }

    // Generer QR-kode som PNG
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    return new NextResponse(qrCodeBuffer as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="location-${location.name}-qr.png"`,
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('QR code generation error:', error);
    return NextResponse.json(
      { error: 'Feil ved generering av QR-kode' },
      { status: 500 }
    );
  }
}
