import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for å godkjenne varetelling og justere lager
const approveCountingSchema = z.object({
  approvedBy: z.string(), // I ekte app: fra session
  adjustmentNotes: z.string().optional()
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { approvedBy, adjustmentNotes } = approveCountingSchema.parse(body)

    // Hent session med alle linjer
    const session = await prisma.cycleCountingSession.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            lot: {
              include: {
                item: { select: { name: true, sku: true, unit: true } }
              }
            }
          }
        }
      }
    })

    if (!session) {
      return Response.json({ error: 'Varetelling ikke funnet' }, { status: 404 })
    }

    if (session.status === 'APPROVED') {
      return Response.json({ error: 'Varetelling er allerede godkjent' }, { status: 400 })
    }

    if (session.status !== 'COMPLETED') {
      return Response.json({ error: 'Kan kun godkjenne fullførte varetellinger' }, { status: 400 })
    }

    // Blokker godkjenning hvis omtelling kreves
    const hasPendingRecounts = session.lines.some(l => l.needsRecount)
    if (hasPendingRecounts) {
      return Response.json({ error: 'Det finnes linjer som krever omtelling før godkjenning' }, { status: 400 })
    }

    // Sjekk bruker og rettigheter
    const user = await prisma.user.findUnique({
      where: { id: approvedBy }
    })

    if (!user) {
      return Response.json({ error: 'Ugyldig bruker' }, { status: 400 })
    }

    if (user.role !== 'ADMIN' && user.role !== 'PURCHASER') {
      return Response.json({ error: 'Ikke tilgang til å godkjenne varetelling' }, { status: 403 })
    }

    // Utfør justeringer atomisk
    const result = await prisma.$transaction(async (tx) => {
      const adjustments: Array<{
        item: string
        sku: string
        oldQuantity: number
        newQuantity: number
        adjustment: number
        unit: string
      }> = []
      let totalAdjustments = 0

      // Gå gjennom alle linjer med avvik
      for (const line of session.lines) {
        if (!line.countedQuantity || line.discrepancy === 0) continue

        const lot = line.lot
        const adjustment = line.discrepancy // positiv = mer enn forventet, negativ = mindre

        // Oppdater inventory lot
        const updatedLot = await tx.inventoryLot.update({
          where: { id: lot.id },
          data: { quantity: lot.quantity + adjustment }
        })

        // Opprett adjustment transaction
        const transaction = await tx.inventoryTransaction.create({
          data: {
            type: 'ADJUSTMENT',
            inventoryLotId: lot.id,
            quantityChange: adjustment,
            quantityBefore: lot.quantity,
            quantityAfter: lot.quantity + adjustment,
            reasonCode: line.reasonCode || 'CYCLE_COUNT_ADJUSTMENT',
            notes: `Varetelling justering: ${line.notes || 'Ingen merknad'}. ${adjustmentNotes || ''}`,
            userId: approvedBy,
            countingSessionId: session.id
          }
        })

        adjustments.push({
          item: lot.item.name,
          sku: lot.item.sku,
          oldQuantity: lot.quantity,
          newQuantity: lot.quantity + adjustment,
          adjustment,
          unit: lot.item.unit
        })

        totalAdjustments++
      }

      // Oppdater session som godkjent
      const approvedSession = await tx.cycleCountingSession.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy,
          approvedAt: new Date()
        },
        include: {
          planner: { select: { name: true } },
          counter: { select: { name: true } },
          approver: { select: { name: true } }
        }
      })

      return { session: approvedSession, adjustments, totalAdjustments }
    })

    console.log(`✅ Varetelling godkjent: ${result.totalAdjustments} justeringer utført`)

    return Response.json({
      message: 'Varetelling godkjent og lagerjusteringer utført',
      session: result.session,
      adjustments: result.adjustments,
      totalAdjustments: result.totalAdjustments
    })

  } catch (error: any) {
    console.error('Feil ved godkjenning av varetelling:', error)
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Ugyldig input', 
        details: error.issues 
      }, { status: 400 })
    }

    return Response.json({ 
      error: 'Kunne ikke godkjenne varetelling' 
    }, { status: 500 })
  }
}
