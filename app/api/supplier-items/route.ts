import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get('itemId')
  const supplierId = searchParams.get('supplierId')
  const outdatedOnly = searchParams.get('outdatedOnly') === 'true'

  const where: any = {}
  if (itemId) where.itemId = itemId
  if (supplierId) where.supplierId = supplierId
  
  // Filter for outdated prices (older than 6 months)
  if (outdatedOnly) {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    where.lastVerifiedDate = { lt: sixMonthsAgo }
  }

  const supplierItems = await prisma.supplierItem.findMany({
    where,
    include: {
      item: true,
      supplier: true
    },
    orderBy: [
      { isPrimarySupplier: 'desc' },
      { negotiatedPrice: 'asc' }
    ]
  })
  
  return Response.json(supplierItems)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { 
    itemId, 
    supplierId, 
    supplierPartNumber,
    listPrice,
    negotiatedPrice,
    discountCodeRequired,
    agreementReference,
    priceValidUntil,
    isPrimarySupplier,
    minimumOrderQty,
    packSize,
    productUrl
  } = body || {}
  
  if (!itemId || !supplierId || !supplierPartNumber || !negotiatedPrice) {
    return Response.json({ 
      error: 'itemId, supplierId, supplierPartNumber og negotiatedPrice er påkrevd' 
    }, { status: 400 })
  }

  try {
    // If setting as primary, remove primary flag from other suppliers for this item
    if (isPrimarySupplier) {
      await prisma.supplierItem.updateMany({
        where: { itemId, isPrimarySupplier: true },
        data: { isPrimarySupplier: false }
      })
    }

    const supplierItem = await prisma.supplierItem.create({
      data: {
        itemId,
        supplierId,
        supplierPartNumber,
        listPrice: listPrice ? Number(listPrice) : null,
        negotiatedPrice: Number(negotiatedPrice),
        discountCodeRequired: discountCodeRequired || null,
        agreementReference: agreementReference || null,
        priceValidUntil: priceValidUntil ? new Date(priceValidUntil) : null,
        isPrimarySupplier: Boolean(isPrimarySupplier),
        minimumOrderQty: minimumOrderQty ? Number(minimumOrderQty) : null,
        packSize: packSize ? Number(packSize) : null,
        productUrl: productUrl || null
      },
      include: {
        item: true,
        supplier: true
      }
    })
    
    return Response.json(supplierItem, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return Response.json({ 
        error: 'Denne kombinasjonen av vare og leverandør eksisterer allerede' 
      }, { status: 409 })
    }
    
    return Response.json({ 
      error: 'Kunne ikke opprette leverandør-vare kobling' 
    }, { status: 500 })
  }
}
