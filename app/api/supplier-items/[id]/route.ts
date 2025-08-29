import { prisma } from '@/lib/prisma'

export async function GET(_: Request, ctx: any) {
  const { id } = ctx.params
  try {
    const supplierItem = await prisma.supplierItem.findUnique({ 
      where: { id },
      include: {
        item: true,
        supplier: true
      }
    })
    if (!supplierItem) {
      return Response.json({ error: 'SupplierItem not found' }, { status: 404 })
    }
    return Response.json(supplierItem)
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function PATCH(req: Request, ctx: any) {
  const { id } = ctx.params
  const data = await req.json().catch(() => ({}))
  
  // Process numeric fields
  if (data.listPrice !== undefined) data.listPrice = data.listPrice ? Number(data.listPrice) : null
  if (data.negotiatedPrice !== undefined) data.negotiatedPrice = Number(data.negotiatedPrice)
  if (data.minimumOrderQty !== undefined) data.minimumOrderQty = data.minimumOrderQty ? Number(data.minimumOrderQty) : null
  if (data.packSize !== undefined) data.packSize = data.packSize ? Number(data.packSize) : null
  if (data.priceValidUntil !== undefined) data.priceValidUntil = data.priceValidUntil ? new Date(data.priceValidUntil) : null
  
  try {
    // If setting as primary, remove primary flag from other suppliers for this item
    if (data.isPrimarySupplier) {
      const current = await prisma.supplierItem.findUnique({ where: { id } })
      if (current) {
        await prisma.supplierItem.updateMany({
          where: { 
            itemId: current.itemId, 
            isPrimarySupplier: true,
            id: { not: id }
          },
          data: { isPrimarySupplier: false }
        })
      }
    }

    const updated = await prisma.supplierItem.update({ 
      where: { id }, 
      data,
      include: {
        item: true,
        supplier: true
      }
    })
    return Response.json(updated)
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(_: Request, ctx: any) {
  const { id } = ctx.params
  try {
    await prisma.supplierItem.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}
