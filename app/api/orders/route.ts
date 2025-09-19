import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/auth-middleware'
import { NextResponse } from 'next/server'
import { paginationSchema, createOrderSchema, validateRequest } from '@/lib/validation-schemas'

export const GET = requireAuth(async (req) => {
  const { searchParams } = new URL(req.url)
  
  // Validate pagination parameters
  const paginationResult = validateRequest(paginationSchema, {
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  })
  
  if (!paginationResult.success) {
    return NextResponse.json({ error: paginationResult.error }, { status: 400 })
  }
  
  const { page, limit } = paginationResult.data
  const status = searchParams.get('status') || ''
  
  const skip = (page - 1) * limit
  
  const where: any = {}
  if (status) {
    where.status = status
  }
  
  const totalCount = await prisma.purchaseOrder.count({ where })
  
  const orders = await prisma.purchaseOrder.findMany({
    where,
    skip,
    take: limit,
    orderBy: { requestedDate: 'desc' },
    include: { 
      supplier: { select: { name: true } },
      requester: { select: { name: true, email: true } },
      lines: { 
        select: {
          quantityOrdered: true,
          unitPrice: true,
          item: { select: { name: true, sku: true } },
          requestedDepartment: { select: { name: true } }
        }
      } 
    },
  })
  
  return NextResponse.json({
    orders,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPreviousPage: page > 1
    }
  })
})

export const POST = requireRole(['ADMIN', 'PURCHASER'])(async (req) => {
  try {
    const body = await req.json().catch(() => ({}))
    
    // Validate request body
    const validationResult = validateRequest(createOrderSchema, body)
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 })
    }
    
    const { supplierId, priority, expectedDate, notes, lines } = validationResult.data

    // Get user ID from auth middleware
    const userId = req.user?.userId
    if (!userId) {
      return NextResponse.json({ error: 'Bruker ikke autentisert' }, { status: 401 })
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
        requestedBy: userId,
        notes: notes || null,
        status: 'REQUESTED',
        lines: {
        create: lines.map((line) => ({
          itemId: line.itemId,
          quantityOrdered: line.quantityOrdered,
          unitPrice: line.unitPrice || null,
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
  return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json({ 
      error: 'Kunne ikke opprette bestilling', 
      details: error.message 
    }, { status: 500 })
  }
})


