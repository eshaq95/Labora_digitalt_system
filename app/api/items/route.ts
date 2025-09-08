import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { name: 'asc' },
      include: { 
        defaultLocation: true,
        department: true,
        category: true,
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
    
    return Response.json(itemsWithStock)
  } catch (error) {
    console.error('Feil ved henting av varer:', error)
    return Response.json({ error: 'Kunne ikke laste varer' }, { status: 500 })
  }
}

export async function POST(req: Request) {
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
      return Response.json({ error: 'SKU og navn er påkrevd' }, { status: 400 })
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
    return Response.json(item, { status: 201 })
  } catch (error) {
    console.error('Feil ved opprettelse av vare:', error)
    return Response.json({ error: 'Kunne ikke opprette vare' }, { status: 500 })
  }
}

