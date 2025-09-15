import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const lotSchema = z.object({
  itemId: z.string().min(1, 'Vare ID er påkrevd'),
  locationId: z.string().min(1, 'Lokasjon ID er påkrevd'),
  quantity: z.number().positive('Antall må være positivt'),
  batchNumber: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  source: z.enum(['INITIAL_SYNC', 'RECEIPT', 'ADJUSTMENT']).default('RECEIPT')
})

export const POST = requireAuth(async (req) => {
  try {
    const body = await req.json()
    const { itemId, locationId, quantity, batchNumber, expiryDate, source } = lotSchema.parse(body)

    const userId = req.user?.userId
    if (!userId) {
      return NextResponse.json({ error: 'Bruker ikke autentisert' }, { status: 401 })
    }

    // Verify item and location exist
    const [item, location] = await Promise.all([
      prisma.item.findUnique({ where: { id: itemId } }),
      prisma.location.findUnique({ where: { id: locationId } })
    ])

    if (!item) {
      return NextResponse.json({ error: 'Vare ikke funnet' }, { status: 404 })
    }

    if (!location) {
      return NextResponse.json({ error: 'Lokasjon ikke funnet' }, { status: 404 })
    }

    // Create inventory lot
    const lot = await prisma.inventoryLot.create({
      data: {
        itemId,
        locationId,
        quantity,
        batchNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        source,
        createdBy: userId
      },
      include: {
        item: { select: { name: true, sku: true } },
        location: { select: { name: true, code: true } }
      }
    })

    // Create inventory transaction for audit trail
    await prisma.inventoryTransaction.create({
      data: {
        lotId: lot.id,
        type: source === 'INITIAL_SYNC' ? 'INITIAL_COUNT' : 'RECEIPT',
        quantity,
        reason: source === 'INITIAL_SYNC' ? 'Initial synkronisering' : 'Varemottak',
        performedBy: userId
      }
    })

    return NextResponse.json(lot, { status: 201 })
  } catch (error: any) {
    console.error('Error creating inventory lot:', error)
    return NextResponse.json({ 
      error: 'Kunne ikke opprette lagerlot',
      details: error.message 
    }, { status: 500 })
  }
})

export const GET = requireAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')
    const locationId = searchParams.get('locationId')

    const where: any = {}
    if (itemId) where.itemId = itemId
    if (locationId) where.locationId = locationId

    const lots = await prisma.inventoryLot.findMany({
      where,
      include: {
        item: { select: { name: true, sku: true } },
        location: { select: { name: true, code: true } }
      },
      orderBy: [
        { expiryDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(lots)
  } catch (error: any) {
    console.error('Error fetching inventory lots:', error)
    return NextResponse.json({ 
      error: 'Kunne ikke hente lagerlots',
      details: error.message 
    }, { status: 500 })
  }
})
