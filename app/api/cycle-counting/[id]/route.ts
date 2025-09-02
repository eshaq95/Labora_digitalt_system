import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for å oppdatere telling
const updateCountingSchema = z.object({
  lines: z.array(z.object({
    id: z.string(),
    countedQuantity: z.number().int().min(0),
    notes: z.string().optional()
  })),
  countedBy: z.string(), // I ekte app: fra session
  status: z.enum(['IN_PROGRESS', 'COMPLETED']).optional()
})

// Hent detaljer for en varetelling
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await prisma.cycleCountingSession.findUnique({
      where: { id: params.id },
      include: {
        location: { select: { name: true } },
        category: { select: { name: true } },
        department: { select: { name: true } },
        planner: { select: { name: true, email: true } },
        counter: { select: { name: true, email: true } },
        approver: { select: { name: true, email: true } },
        lines: {
          include: {
            lot: {
              include: {
                item: { select: { name: true, sku: true, unit: true } },
                location: { select: { name: true } }
              }
            },
            counter: { select: { name: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!session) {
      return Response.json({ error: 'Varetelling ikke funnet' }, { status: 404 })
    }

    return Response.json(session)

  } catch (error) {
    console.error('Feil ved henting av varetelling:', error)
    return Response.json({ 
      error: 'Kunne ikke hente varetelling' 
    }, { status: 500 })
  }
}

// Oppdater telling (registrer talt antall)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { lines, countedBy, status } = updateCountingSchema.parse(body)

    // Sjekk at session eksisterer
    const session = await prisma.cycleCountingSession.findUnique({
      where: { id: params.id }
    })

    if (!session) {
      return Response.json({ error: 'Varetelling ikke funnet' }, { status: 404 })
    }

    if (session.status === 'APPROVED') {
      return Response.json({ error: 'Kan ikke endre godkjent varetelling' }, { status: 400 })
    }

    // Sjekk bruker
    const user = await prisma.user.findUnique({
      where: { id: countedBy }
    })

    if (!user) {
      return Response.json({ error: 'Ugyldig bruker' }, { status: 400 })
    }

    // Oppdater counting lines
    const result = await prisma.$transaction(async (tx) => {
      const updatedLines = []
      let discrepancies = 0

      for (const lineUpdate of lines) {
        const line = await tx.cycleCountingLine.findUnique({
          where: { id: lineUpdate.id }
        })

        if (!line) continue

        const discrepancy = lineUpdate.countedQuantity - line.systemQuantity
        if (discrepancy !== 0) discrepancies++

        const updatedLine = await tx.cycleCountingLine.update({
          where: { id: lineUpdate.id },
          data: {
            countedQuantity: lineUpdate.countedQuantity,
            discrepancy,
            notes: lineUpdate.notes,
            countedAt: new Date(),
            countedBy
          }
        })

        updatedLines.push(updatedLine)
      }

      // Oppdater session
      const updatedSession = await tx.cycleCountingSession.update({
        where: { id: params.id },
        data: {
          countedBy,
          countedItems: lines.length,
          discrepancies,
          status: status || (lines.length > 0 ? 'IN_PROGRESS' : session.status),
          ...(status === 'COMPLETED' && { completedAt: new Date() })
        }
      })

      return { session: updatedSession, lines: updatedLines, discrepancies }
    })

    console.log(`✅ Varetelling oppdatert: ${result.lines.length} items talt, ${result.discrepancies} avvik`)

    return Response.json({
      message: 'Telling oppdatert',
      session: result.session,
      discrepancies: result.discrepancies
    })

  } catch (error: any) {
    console.error('Feil ved oppdatering av varetelling:', error)
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Ugyldig input', 
        details: error.errors 
      }, { status: 400 })
    }

    return Response.json({ 
      error: 'Kunne ikke oppdatere varetelling' 
    }, { status: 500 })
  }
}
