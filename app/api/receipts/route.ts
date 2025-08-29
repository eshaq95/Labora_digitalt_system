import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  const receipts = await prisma.receipt.findMany({
    orderBy: { receivedAt: 'desc' },
    include: { 
      lines: { include: { item: true, location: true } }, 
      order: true,
      supplier: true
    },
  })
  return Response.json(receipts)
}

// Validation schema for receipt registration
const receiptLineSchema = z.object({
  itemId: z.string().min(1, 'Item ID er påkrevd'),
  locationId: z.string().min(1, 'Lokasjon ID er påkrevd'),
  quantity: z.number().int().positive('Antall må være et positivt tall'),
  lotNumber: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional().refine(date => {
    if (!date) return true;
    return !isNaN(Date.parse(date));
  }, { message: "Ugyldig datoformat" }),
})

const receiptSchema = z.object({
  orderId: z.string().nullable().optional(),
  receivedBy: z.string().min(1, 'Mottaker er påkrevd'),
  notes: z.string().nullable().optional(),
  lines: z.array(receiptLineSchema).min(1, 'Minst én varelinje er påkrevd'),
})

// Creates a receipt and updates inventory lots accordingly
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    
    // Validate input with Zod
    const validatedData = receiptSchema.parse(body)
    const { orderId, receivedBy, notes, lines } = validatedData
  const result = await prisma.$transaction(async (tx) => {
    const receipt = await tx.receipt.create({
      data: {
        orderId: orderId || null,
        receivedBy: receivedBy || null,
        notes: notes || null,
        lines: {
          create: lines.map((l: any) => ({
            itemId: l.itemId,
            locationId: l.locationId,
            lotNumber: l.lotNumber || null,
            expiryDate: l.expiryDate ? new Date(l.expiryDate) : null,
            quantity: Number(l.quantity || 0),
          })),
        },
      },
      include: { lines: true },
    })

    // Upsert inventory lots per line
    for (const line of receipt.lines) {
      // Find existing lot with same item, location, lot number, and expiry date
      const existingLot = await tx.inventoryLot.findFirst({
        where: {
          itemId: line.itemId,
          locationId: line.locationId,
          lotNumber: line.lotNumber,
          expiryDate: line.expiryDate,
        },
      })

      if (existingLot) {
        // Update existing lot
        await tx.inventoryLot.update({
          where: { id: existingLot.id },
          data: {
            quantity: existingLot.quantity + line.quantity,
          },
        })
      } else {
        // Create new lot
        await tx.inventoryLot.create({
          data: {
            itemId: line.itemId,
            locationId: line.locationId,
            lotNumber: line.lotNumber,
            expiryDate: line.expiryDate,
            quantity: line.quantity,
          },
        })
      }
    }

    // Optionally mark order as RECEIVED if all items are considered delivered
    if (orderId) {
      await tx.purchaseOrder.update({ where: { id: orderId }, data: { status: 'RECEIVED' } })
    }

    return receipt
  })
  return Response.json(result, { status: 201 })
  
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Valideringsfeil', 
        details: error.issues 
      }, { status: 400 })
    }
    
    console.error('Feil ved registrering av varemottak:', error)
    return Response.json({ 
      error: 'Intern serverfeil: Kunne ikke registrere varemottak' 
    }, { status: 500 })
  }
}

