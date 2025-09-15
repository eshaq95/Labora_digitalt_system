import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { NextResponse } from 'next/server'


// Schema for vareuttak/forbruk - updated to match frontend parameters
const consumptionSchema = z.object({
  lotId: z.string().min(1, 'Lot ID er påkrevd'),
  quantity: z.number().positive('Antall må være positivt'),
  reason: z.string().optional(),
  notes: z.string().optional()
})

export const POST = requireAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { lotId, quantity, reason, notes } = consumptionSchema.parse(body)
    
    // Get user from auth middleware
    const userId = req.user?.userId
    if (!userId) {
      return NextResponse.json({ error: 'Bruker ikke autentiseret' }, { status: 401 })
    }


    
    // Hent inventory lot og sjekk tilgjengelighet
    const lot = await prisma.inventoryLot.findUnique({
      where: { id: lotId },
      include: {
        item: { select: { name: true, unit: true } },
        location: { select: { name: true } }
      }
    })

    if (!lot) {
      return NextResponse.json({ error: 'Inventory lot ikke funnet' }, { status: 404 })
    }

    if (lot.quantity < quantity) {
      return NextResponse.json({ 
        error: `Ikke nok på lager. Tilgjengelig: ${lot.quantity}, forespurt: ${quantity}` 
      }, { status: 400 })
    }

    // Utfør transaksjonen atomisk
    const result = await prisma.$transaction(async (tx) => {
      // Oppdater inventory lot
      const updatedLot = await tx.inventoryLot.update({
        where: { id: lotId },
        data: { quantity: lot.quantity - quantity }
      })

      // Opprett transaction record for full sporbarhet
      const transaction = await tx.inventoryTransaction.create({
        data: {
          type: 'CONSUMPTION',
          inventoryLotId: lotId,
          quantityChange: -quantity, // Negativt for uttak
          quantityBefore: lot.quantity,
          quantityAfter: lot.quantity - quantity,
          reasonCode: reason || 'CONSUMPTION',
          notes: notes || 'Hurtiguttak via skanning',
          userId
        },
        include: {
          user: { select: { name: true, email: true } },
          lot: {
            include: {
              item: { select: { name: true, sku: true } },
              location: { select: { name: true } }
            }
          }
        }
      })

      return { updatedLot, transaction }
    })

    console.log(`✅ Vareuttak registrert: ${quantity} ${lot.item.unit.toLowerCase()} av ${lot.item.name} (${req.user?.email || 'Ukjent bruker'})`)

    return NextResponse.json({
      message: 'Vareuttak registrert',
      transaction: result.transaction,
      newQuantity: result.updatedLot.quantity
    })

  } catch (error: any) {
    console.error('❌ Feil ved vareuttak:', error)
    console.error('Error stack:', error.stack)
    
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.issues)
      return NextResponse.json({ 
        error: 'Ugyldig input', 
        details: error.issues 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Kunne ikke registrere vareuttak',
      details: error.message 
    }, { status: 500 })
  }
})

// Hent forbrukshistorikk
export const GET = requireAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      type: 'CONSUMPTION'
    }

    if (itemId) {
      where.lot = { itemId }
    }

    if (userId) {
      where.userId = userId
    }

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        lot: {
          include: {
            item: { select: { name: true, sku: true } },
            location: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json(transactions)

  } catch (error) {
    console.error('Feil ved henting av forbrukshistorikk:', error)
    return NextResponse.json({ 
      error: 'Kunne ikke hente forbrukshistorikk' 
    }, { status: 500 })
  }
})
