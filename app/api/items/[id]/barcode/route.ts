import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const barcodeSchema = z.object({
  barcode: z.string().min(1, 'Strekkode er påkrevd')
})

export const POST = requireAuth(async (req, { params }) => {
  try {
    const { id } = params
    const body = await req.json()
    const { barcode } = barcodeSchema.parse(body)

    // Check if barcode already exists on another item
    const existingItem = await prisma.item.findFirst({
      where: {
        barcode,
        id: { not: id }
      }
    })

    if (existingItem) {
      return NextResponse.json({ 
        error: `Strekkode allerede registrert på ${existingItem.name}` 
      }, { status: 400 })
    }

    // Update item with barcode
    const updatedItem = await prisma.item.update({
      where: { id },
      data: { barcode }
    })

    return NextResponse.json(updatedItem)
  } catch (error: any) {
    console.error('Error updating barcode:', error)
    return NextResponse.json({ 
      error: 'Kunne ikke oppdatere strekkode',
      details: error.message 
    }, { status: 500 })
  }
})
