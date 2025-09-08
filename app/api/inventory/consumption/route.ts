import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for vareuttak/forbruk
const consumptionSchema = z.object({
  inventoryLotId: z.string(),
  quantity: z.number().positive(),
  reasonCode: z.string().optional(),
  notes: z.string().optional(),
  userId: z.string() // I en ekte app ville dette komme fra session
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { inventoryLotId, quantity, reasonCode, notes, userId } = consumptionSchema.parse(body)

    // Hent inventory lot og sjekk tilgjengelighet
    const lot = await prisma.inventoryLot.findUnique({
      where: { id: inventoryLotId },
      include: {
        item: { select: { name: true, unit: true } },
        location: { select: { name: true } }
      }
    })

    if (!lot) {
      return Response.json({ error: 'Inventory lot ikke funnet' }, { status: 404 })
    }

    if (lot.quantity < quantity) {
      return Response.json({ 
        error: `Ikke nok på lager. Tilgjengelig: ${lot.quantity}, forespurt: ${quantity}` 
      }, { status: 400 })
    }

    // Sjekk at bruker eksisterer
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return Response.json({ error: 'Ugyldig bruker' }, { status: 400 })
    }

    // Utfør transaksjonen atomisk
    const result = await prisma.$transaction(async (tx) => {
      // Oppdater inventory lot
      const updatedLot = await tx.inventoryLot.update({
        where: { id: inventoryLotId },
        data: { quantity: lot.quantity - quantity }
      })

      // Opprett transaction record for full sporbarhet
      const transaction = await tx.inventoryTransaction.create({
        data: {
          type: 'CONSUMPTION',
          inventoryLotId,
          quantityChange: -quantity, // Negativt for uttak
          quantityBefore: lot.quantity,
          quantityAfter: lot.quantity - quantity,
          reasonCode: reasonCode || 'CONSUMPTION',
          notes,
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

    console.log(`✅ Vareuttak registrert: ${quantity} ${lot.item.unit.toLowerCase()} av ${lot.item.name} (${user.name})`)

    return Response.json({
      message: 'Vareuttak registrert',
      transaction: result.transaction,
      newQuantity: result.updatedLot.quantity
    })

  } catch (error: any) {
    console.error('Feil ved vareuttak:', error)
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Ugyldig input', 
        details: error.issues 
      }, { status: 400 })
    }

    return Response.json({ 
      error: 'Kunne ikke registrere vareuttak' 
    }, { status: 500 })
  }
}

// Hent forbrukshistorikk
export async function GET(req: Request) {
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

    return Response.json(transactions)

  } catch (error) {
    console.error('Feil ved henting av forbrukshistorikk:', error)
    return Response.json({ 
      error: 'Kunne ikke hente forbrukshistorikk' 
    }, { status: 500 })
  }
}
