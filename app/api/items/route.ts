import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/auth-middleware'
import { NextResponse } from 'next/server'

export const GET = requireAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
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
    const { 
      sku, name, manufacturer, description,
      departmentId, categoryId, 
      unit, orderUnit, conversionFactor, contentPerPack,
      minStock, maxStock, salesPrice, currency,
      requiresLotNumber, expiryTracking, hazardous,
      hmsCode, storageTemp, notes,
      defaultLocationId
    } = body || {}
    
    if (!sku || !name) {
      return NextResponse.json({ error: 'SKU og navn er påkrevd' }, { status: 400 })
    }
    
    const item = await prisma.item.create({
      data: {
        sku,
        name,
        manufacturer: manufacturer || null,
        description: description || null,
        // Fjernet category enum - bruker kun relasjoner nå
        departmentId: departmentId || null,
        categoryId: categoryId || null,
        unit: unit || 'UNIT',
        orderUnit: orderUnit || null,
        conversionFactor: conversionFactor ? Number(conversionFactor) : null,
        contentPerPack: contentPerPack || null,
        minStock: Math.max(0, Number(minStock ?? 0)),
        maxStock: maxStock ? Number(maxStock) : null,
        salesPrice: salesPrice ? Number(salesPrice) : null,
        currency: currency || 'NOK',
        requiresLotNumber: Boolean(requiresLotNumber),
        expiryTracking: Boolean(expiryTracking),
        hazardous: Boolean(hazardous),
        hmsCode: hmsCode || null,
        storageTemp: storageTemp || null,
        notes: notes || null,
        defaultLocationId: defaultLocationId || null,
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

