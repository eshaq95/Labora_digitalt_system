import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

// PUT /api/items/[id]/barcodes/[barcodeId] - Update a barcode
export async function PUT(req: NextRequest) {
  try {
    await requireAuth(req)
    
    // Extract IDs from URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const itemId = pathParts[pathParts.indexOf('items') + 1]
    const barcodeId = pathParts[pathParts.indexOf('barcodes') + 1]
    
    if (!itemId || !barcodeId) {
      return NextResponse.json({ error: 'Item ID and Barcode ID are required' }, { status: 400 })
    }

    const { barcode, type, description, isPrimary } = await req.json()

    // Check if the barcode exists and belongs to this item
    const existingBarcode = await prisma.itemBarcode.findFirst({
      where: { id: barcodeId, itemId }
    })

    if (!existingBarcode) {
      return NextResponse.json({ error: 'Barcode not found' }, { status: 404 })
    }

    // If barcode value is being changed, check if new barcode already exists
    if (barcode && barcode !== existingBarcode.barcode) {
      const duplicateBarcode = await prisma.itemBarcode.findUnique({
        where: { barcode }
      })

      if (duplicateBarcode) {
        return NextResponse.json({ error: 'Barcode already exists' }, { status: 409 })
      }
    }

    // If this is set as primary, unset other primary barcodes for this item
    if (isPrimary) {
      await prisma.itemBarcode.updateMany({
        where: { itemId, isPrimary: true, id: { not: barcodeId } },
        data: { isPrimary: false }
      })
    }

    const updatedBarcode = await prisma.itemBarcode.update({
      where: { id: barcodeId },
      data: {
        ...(barcode && { barcode }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(isPrimary !== undefined && { isPrimary })
      }
    })

    return NextResponse.json(updatedBarcode)
  } catch (error) {
    console.error('Error updating barcode:', error)
    return NextResponse.json({ error: 'Failed to update barcode' }, { status: 500 })
  }
}

// DELETE /api/items/[id]/barcodes/[barcodeId] - Delete a barcode
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req)
    
    // Extract IDs from URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const itemId = pathParts[pathParts.indexOf('items') + 1]
    const barcodeId = pathParts[pathParts.indexOf('barcodes') + 1]
    
    if (!itemId || !barcodeId) {
      return NextResponse.json({ error: 'Item ID and Barcode ID are required' }, { status: 400 })
    }

    // Check if the barcode exists and belongs to this item
    const existingBarcode = await prisma.itemBarcode.findFirst({
      where: { id: barcodeId, itemId }
    })

    if (!existingBarcode) {
      return NextResponse.json({ error: 'Barcode not found' }, { status: 404 })
    }

    await prisma.itemBarcode.delete({
      where: { id: barcodeId }
    })

    return NextResponse.json({ message: 'Barcode deleted successfully' })
  } catch (error) {
    console.error('Error deleting barcode:', error)
    return NextResponse.json({ error: 'Failed to delete barcode' }, { status: 500 })
  }
}
