import { prisma } from '@/lib/prisma'

export async function GET() {
  const orders = await prisma.purchaseOrder.findMany({
    orderBy: { requestedDate: 'desc' },
    include: { 
      supplier: true, 
      lines: { 
        include: { 
          item: true,
          requestedDepartment: true
        } 
      } 
    },
  })
  return Response.json(orders)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { supplierId, priority, expectedDate, notes, requestedBy, lines } = body || {}
  
  if (!supplierId || !Array.isArray(lines) || lines.length === 0) {
    return Response.json({ error: 'Leverandør og minst én varelinje er påkrevd' }, { status: 400 })
  }

  // Auto-generate order number
  const orderCount = await prisma.purchaseOrder.count()
  const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`

  const order = await prisma.purchaseOrder.create({
    data: {
      orderNumber,
      supplierId,
      priority: priority || 'MEDIUM',
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      requestedBy: requestedBy || 'System User',
      notes: notes || null,
      status: 'REQUESTED',
      lines: {
        create: lines.map((line: any) => ({
          itemId: line.itemId,
          quantityOrdered: Number(line.quantityOrdered),
          unitPrice: line.unitPrice ? Number(line.unitPrice) : null,
          departmentId: line.departmentId || null,
          notes: line.notes || null,
          currency: 'NOK'
        }))
      },
    },
    include: { 
      supplier: true, 
      lines: { 
        include: { 
          item: true,
          requestedDepartment: true
        } 
      } 
    },
  })
  return Response.json(order, { status: 201 })
}


