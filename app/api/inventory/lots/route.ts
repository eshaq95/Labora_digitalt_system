import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const lotSchema = z.object({
  itemId: z.string().min(1, 'Vare ID er påkrevd'),
  locationId: z.string().min(1, 'Lokasjon ID er påkrevd'),
  quantity: z.number().positive('Antall må være positivt'),
  batchNumber: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable()
})

export const POST = requireAuth(async (req) => {
  try {
    const body = await req.json()
    console.log('📦 Inventory lot API received body:', body)
    
    const { itemId, locationId, quantity, batchNumber, expiryDate } = lotSchema.parse(body)
    
    console.log('📦 Parsed values:')
    console.log('  - batchNumber:', batchNumber, 'Type:', typeof batchNumber)
    console.log('  - expiryDate:', expiryDate, 'Type:', typeof expiryDate)

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

    // Helper: normalize a YYYY-MM-DD to start-of-day UTC (date-only semantics)
    const toUtcDayRange = (dateStr?: string | null) => {
      if (!dateStr) return { start: null as Date | null, end: null as Date | null }
      const [y, m, d] = dateStr.split('-').map((x) => parseInt(x, 10))
      const start = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0, 0))
      const end = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0, 0))
      return { start, end }
    }
    const { start: expiryStartUTC, end: expiryEndUTC } = toUtcDayRange(expiryDate)

    // Check if a lot with same item, location, lotNumber, and expiryDate already exists
    const existingLot = await prisma.inventoryLot.findFirst({
      where: {
        itemId,
        locationId,
        lotNumber: batchNumber,
        ...(expiryStartUTC && expiryEndUTC
          ? { expiryDate: { gte: expiryStartUTC, lt: expiryEndUTC } }
          : { expiryDate: null })
      },
      include: {
        item: { select: { name: true, sku: true } },
        location: { select: { name: true, code: true } }
      }
    })

    let lot
    let previousQuantity = 0
    if (existingLot) {
      // Update existing lot by adding the quantity
      console.log(`📦 Found existing lot ${existingLot.id}, adding ${quantity} to existing ${existingLot.quantity}`)
      previousQuantity = existingLot.quantity
      lot = await prisma.inventoryLot.update({
        where: { id: existingLot.id },
        data: { quantity: existingLot.quantity + quantity },
        include: {
          item: { select: { name: true, sku: true } },
          location: { select: { name: true, code: true } }
        }
      })
    } else {
      // Create new lot
      const lotCreateData = {
        itemId,
        locationId,
        quantity,
        lotNumber: batchNumber,
        expiryDate: expiryStartUTC
      }
      
      console.log('📦 Creating new lot with data:', lotCreateData)
      
      lot = await prisma.inventoryLot.create({
        data: lotCreateData,
        include: {
          item: { select: { name: true, sku: true } },
          location: { select: { name: true, code: true } }
        }
      })
      previousQuantity = 0
    }

    // Create inventory transaction for audit trail
    await prisma.inventoryTransaction.create({
      data: {
        inventoryLotId: lot.id,
        type: 'INITIAL_COUNT',
        quantityChange: quantity,
        quantityBefore: previousQuantity,
        quantityAfter: previousQuantity + quantity,
        userId
      }
    })

    return NextResponse.json(lot, { status: 201 })
  } catch (error: any) {
    console.error('❌ Error creating inventory lot:', error)
    console.error('❌ Error stack:', error.stack)
    
    // Check if it's a Zod validation error
    if (error.name === 'ZodError') {
      console.error('❌ Zod validation errors:', error.errors)
      return NextResponse.json({ 
        error: 'Ugyldig data',
        details: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
      }, { status: 400 })
    }
    
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
