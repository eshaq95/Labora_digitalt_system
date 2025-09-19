import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth, requireRole } from '@/lib/auth-middleware'
import { NextResponse } from 'next/server'

export const GET = requireAuth(async (req) => {
  const receipts = await prisma.receipt.findMany({
    orderBy: { receivedAt: 'desc' },
    include: { 
      lines: { include: { item: true, location: true } }, 
      order: true,
      supplier: true,
      receiver: { select: { id: true, name: true } }
    },
  })
  return NextResponse.json(receipts)
})

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
  receivedBy: z.string().optional().default(''),
  notes: z.string().nullable().optional(),
  lines: z.array(receiptLineSchema).min(1, 'Minst én varelinje er påkrevd'),
})

// Creates a receipt and updates inventory lots accordingly
export const POST = requireRole(['ADMIN', 'PURCHASER', 'LAB_USER'])(async (req) => {
  try {
    const body = await req.json().catch(() => ({}))
    
    // Validate input with Zod
    const validatedData = receiptSchema.parse(body)
    let { orderId, receivedBy, notes, lines } = validatedData
    
    // If no receivedBy is provided, use the first admin user as fallback
    if (!receivedBy || receivedBy.trim() === '') {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN', isActive: true },
        select: { id: true }
      })
      
      if (adminUser) {
        receivedBy = adminUser.id
        console.log('🔄 Using fallback admin user for receivedBy:', adminUser.id)
      } else {
        return NextResponse.json({ 
          error: 'Ingen gyldig bruker funnet for mottak-registrering' 
        }, { status: 400 })
      }
    } else {
      console.log('✅ Using provided receivedBy user:', receivedBy)
    }
  const result = await prisma.$transaction(async (tx) => {
    const receipt = await tx.receipt.create({
      data: {
        ...(orderId && { orderId }),
        receivedBy,
        ...(notes && { notes }),
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
      include: { lines: true, receiver: { select: { id: true, name: true } } },
    })

    // Upsert inventory lots per line
    for (const line of receipt.lines) {
      // Helper: normalize date to UTC day range for consistent matching
      const toUtcDayRange = (date: Date | null) => {
        if (!date) return { start: null as Date | null, end: null as Date | null }
        const y = date.getFullYear()
        const m = date.getMonth()
        const d = date.getDate()
        const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0))
        const end = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0))
        return { start, end }
      }
      
      const { start: expiryStartUTC, end: expiryEndUTC } = toUtcDayRange(line.expiryDate)
      
      // Find existing lot with same item, location, lot number, and expiry date
      const existingLot = await tx.inventoryLot.findFirst({
        where: {
          itemId: line.itemId,
          locationId: line.locationId,
          lotNumber: line.lotNumber,
          ...(expiryStartUTC && expiryEndUTC
            ? { expiryDate: { gte: expiryStartUTC, lt: expiryEndUTC } }
            : { expiryDate: null })
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
            expiryDate: expiryStartUTC,
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
    return NextResponse.json(result, { status: 201 })
  
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Valideringsfeil', 
        details: error.issues 
      }, { status: 400 })
    }
    
    console.error('Feil ved registrering av varemottak:', error)
    return NextResponse.json({ 
      error: 'Intern serverfeil: Kunne ikke registrere varemottak' 
    }, { status: 500 })
  }
})

