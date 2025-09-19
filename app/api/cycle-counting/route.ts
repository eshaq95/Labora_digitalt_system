import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for å opprette ny varetelling
const createCountingSessionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  locationId: z.string().optional(),
  categoryId: z.string().optional(),
  departmentId: z.string().optional(),
  plannedDate: z.string().transform(str => new Date(str)),
  plannedBy: z.string(), // I ekte app: fra session
  // Improvements
  isBlind: z.boolean().optional().default(false),
  recountThresholdPercent: z.number().int().min(0).max(100).optional().default(10),
  requireRecountAboveThreshold: z.boolean().optional().default(true)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createCountingSessionSchema.parse(body)

    // Sjekk at bruker eksisterer og har riktige rettigheter
    const user = await prisma.user.findUnique({
      where: { id: data.plannedBy }
    })

    if (!user) {
      return Response.json({ error: 'Ugyldig bruker' }, { status: 400 })
    }

    if (user.role !== 'ADMIN' && user.role !== 'PURCHASER') {
      return Response.json({ error: 'Ikke tilgang til å planlegge varetelling' }, { status: 403 })
    }

    // Opprett counting session og generer counting lines
    const result = await prisma.$transaction(async (tx) => {
      // Opprett session
      const session = await tx.cycleCountingSession.create({
        data,
        include: {
          location: { select: { name: true } },
          category: { select: { name: true } },
          department: { select: { name: true } },
          planner: { select: { name: true, email: true } }
        }
      })

      // Finn inventory lots som skal telles basert på filter
      const where: any = {}
      if (data.locationId) where.locationId = data.locationId
      if (data.categoryId) where.item = { categoryId: data.categoryId }
      if (data.departmentId) where.item = { departmentId: data.departmentId }

      const lots = await tx.inventoryLot.findMany({
        where,
        include: {
          item: { select: { name: true, sku: true } },
          location: { select: { name: true } }
        }
      })

      // Opprett counting lines for hver lot
      const countingLines = await Promise.all(
        lots.map(lot => 
          tx.cycleCountingLine.create({
            data: {
              sessionId: session.id,
              inventoryLotId: lot.id,
              systemQuantity: lot.quantity
            }
          })
        )
      )

      // Oppdater statistikk på session
      await tx.cycleCountingSession.update({
        where: { id: session.id },
        data: { totalItems: lots.length }
      })

      return { session, countingLines: countingLines.length }
    })

    console.log(`✅ Varetelling opprettet: ${result.session.name} (${result.countingLines} items)`)

    return Response.json({
      message: 'Varetelling opprettet',
      session: result.session,
      totalItems: result.countingLines
    })

  } catch (error: any) {
    console.error('Feil ved opprettelse av varetelling:', error)
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Ugyldig input', 
        details: error.issues 
      }, { status: 400 })
    }

    return Response.json({ 
      error: 'Kunne ikke opprette varetelling' 
    }, { status: 500 })
  }
}

// Hent alle varetellinger
export async function GET() {
  try {
    const sessions = await prisma.cycleCountingSession.findMany({
      include: {
        location: { select: { name: true } },
        category: { select: { name: true } },
        department: { select: { name: true } },
        planner: { select: { name: true, email: true } },
        counter: { select: { name: true, email: true } },
        approver: { select: { name: true, email: true } },
        _count: {
          select: {
            lines: true,
            transactions: true
          }
        }
      },
      orderBy: { plannedDate: 'desc' }
    })

    return Response.json(sessions)

  } catch (error) {
    console.error('Feil ved henting av varetellinger:', error)
    return Response.json({ 
      error: 'Kunne ikke hente varetellinger' 
    }, { status: 500 })
  }
}
