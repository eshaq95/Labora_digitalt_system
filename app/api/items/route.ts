import { prisma } from '@/lib/prisma'

export async function GET() {
  const items = await prisma.item.findMany({
    orderBy: { name: 'asc' },
    include: { 
      supplier: true,
      defaultLocation: true,
      department: true,
      categoryRef: true
    },
  })
  return Response.json(items)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { 
    sku, name, manufacturer, description,
    category, departmentId, categoryId, 
    unit, orderUnit, conversionFactor, contentPerPack,
    minStock, maxStock, salesPrice, currency,
    requiresLotNumber, expiryTracking, hazardous,
    hmsCode, storageTemp, notes,
    supplierId, defaultLocationId
  } = body || {}
  
  if (!sku || !name) {
    return Response.json({ error: 'SKU og navn er påkrevd' }, { status: 400 })
  }
  
  const item = await prisma.item.create({
    data: {
      sku,
      name,
      manufacturer: manufacturer || null,
      description: description || null,
      category: category || 'ANNET',
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
      supplierId: supplierId || null,
      defaultLocationId: defaultLocationId || null,
    },
    include: {
      supplier: true,
      defaultLocation: true,
      department: true,
      categoryRef: true
    }
  })
  return Response.json(item, { status: 201 })
}

