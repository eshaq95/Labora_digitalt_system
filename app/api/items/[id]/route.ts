import { prisma } from '@/lib/prisma'

export async function GET(_: Request, ctx: any) {
  const { id } = ctx.params
  try {
    const item = await prisma.item.findUnique({ 
      where: { id },
      include: {
        supplier: true,
        defaultLocation: true,
        department: true,
        categoryRef: true
      }
    })
    if (!item) {
      return Response.json({ error: 'Item not found' }, { status: 404 })
    }
    return Response.json(item)
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function PATCH(req: Request, ctx: any) {
  const { id } = ctx.params
  const data = await req.json().catch(() => ({}))
  
  // Process numeric fields
  if (data.minStock !== undefined) data.minStock = Number(data.minStock)
  if (data.maxStock !== undefined) data.maxStock = data.maxStock ? Number(data.maxStock) : null
  if (data.listPrice !== undefined) data.listPrice = data.listPrice ? Number(data.listPrice) : null
  if (data.agreementPrice !== undefined) data.agreementPrice = data.agreementPrice ? Number(data.agreementPrice) : null
  if (data.conversionFactor !== undefined) data.conversionFactor = data.conversionFactor ? Number(data.conversionFactor) : null
  
  try {
    const updated = await prisma.item.update({ 
      where: { id }, 
      data,
      include: {
        supplier: true,
        defaultLocation: true,
        department: true,
        categoryRef: true
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
    await prisma.item.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

