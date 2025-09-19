import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/auth-middleware'
import { NextResponse } from 'next/server'
import { paginationSchema, createItemSchema, validateRequest } from '@/lib/validation-schemas'

export const GET = requireAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    
    // Validate pagination parameters
    const paginationResult = validateRequest(paginationSchema, {
      page: searchParams.get('page'),
      limit: searchParams.get('limit') || '50',
    })
    
    if (!paginationResult.success) {
      return NextResponse.json({ error: paginationResult.error }, { status: 400 })
    }
    
    const { page, limit } = paginationResult.data
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const department = searchParams.get('department') || ''
    
    const skip = (page - 1) * limit
    
    // Build where clause for filtering
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (category) {
      where.category = { name: category }
    }
    if (department) {
      where.department = { name: department }
    }
    
    // Get total count for pagination
    const totalCount = await prisma.item.count({ where })
    
    const items = await prisma.item.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: { 
        defaultLocation: { select: { name: true } },
        department: { select: { name: true } },
        category: { select: { name: true } },
        lots: {
          select: {
            quantity: true
          }
        },
        barcodes: {
          select: {
            id: true,
            barcode: true,
            type: true,
            isPrimary: true,
            description: true
          },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' }
          ]
        }
      },
    })
    
    // Beregn total lagerbeholdning for hver vare
    const itemsWithStock = items.map(item => ({
      ...item,
      currentStock: item.lots.reduce((sum, lot) => sum + lot.quantity, 0),
      // Sørg for at hmsCodes er inkludert
      hmsCodes: item.hmsCodes,
      // Fjern lots fra respons for å redusere payload størrelse
      lots: undefined
    }))
    
    return NextResponse.json({
      items: itemsWithStock,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    })
  } catch (error) {
    console.error('Feil ved henting av varer:', error)
    return NextResponse.json({ error: 'Kunne ikke laste varer' }, { status: 500 })
  }
})

export const POST = requireRole(['ADMIN', 'PURCHASER'])(async (req) => {
  try {
    const body = await req.json().catch(() => ({}))
    
    // Validate request body
    const validationResult = validateRequest(createItemSchema, body)
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 })
    }
    
    const validatedData = validationResult.data
    
    const item = await prisma.item.create({
      data: {
        sku: validatedData.sku,
        name: validatedData.name,
        barcode: validatedData.barcode || null,
        description: validatedData.description || null,
        categoryId: validatedData.categoryId,
        departmentId: validatedData.departmentId,
        unitOfMeasure: validatedData.unitOfMeasure,
        conversionFactor: validatedData.conversionFactor,
        minStock: validatedData.minStock,
        maxStock: validatedData.maxStock,
        salesPrice: validatedData.salesPrice || null,
        requiresLotTracking: validatedData.requiresLotTracking,
        requiresExpiryTracking: validatedData.requiresExpiryTracking,
        hmsCode: validatedData.hmsCode || null,
        casNumber: validatedData.casNumber || null,
        storageConditions: validatedData.storageConditions || null,
      },
      include: {
        defaultLocation: true,
        department: true,
        category: true
      }
    })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Feil ved opprettelse av vare:', error)
    return NextResponse.json({ error: 'Kunne ikke opprette vare' }, { status: 500 })
  }
})

