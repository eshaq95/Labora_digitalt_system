import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

// GET /api/items/[id]/barcodes - Get all barcodes for an item
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req)
    
    // Extract ID from URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.indexOf('items') + 1]
    
    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const barcodes = await prisma.itemBarcode.findMany({
      where: { itemId: id },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json(barcodes)
  } catch (error) {
    console.error('Error fetching barcodes:', error)
    return NextResponse.json({ error: 'Failed to fetch barcodes' }, { status: 500 })
  }
}

// POST /api/items/[id]/barcodes - Add a new barcode to an item
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req)
    
    // Extract ID from URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.indexOf('items') + 1]
    
    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const { barcode, type = 'GTIN', description, isPrimary = false } = await req.json()

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode is required' }, { status: 400 })
    }

    // Check if barcode already exists
    const existingBarcode = await prisma.itemBarcode.findUnique({
      where: { barcode }
    })

    if (existingBarcode) {
      return NextResponse.json({ error: 'Barcode already exists' }, { status: 409 })
    }

    // If this is set as primary, unset other primary barcodes for this item
    if (isPrimary) {
      await prisma.itemBarcode.updateMany({
        where: { itemId: id, isPrimary: true },
        data: { isPrimary: false }
      })
    }

    const newBarcode = await prisma.itemBarcode.create({
      data: {
        itemId: id,
        barcode,
        type,
        description,
        isPrimary
      }
    })

    return NextResponse.json(newBarcode, { status: 201 })
  } catch (error) {
    console.error('Error creating barcode:', error)
    return NextResponse.json({ error: 'Failed to create barcode' }, { status: 500 })
  }
}
