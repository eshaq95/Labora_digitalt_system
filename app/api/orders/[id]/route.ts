import { prisma } from '@/lib/prisma'

export async function GET(_: Request, ctx: any) {
  const { id } = await ctx.params
  try {
    const order = await prisma.purchaseOrder.findUnique({ 
      where: { id },
      include: {
        supplier: true,
        lines: { 
          include: { 
            item: true,
            requestedDepartment: true
          } 
        }
      }
    })
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }
    return Response.json(order)
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function PATCH(req: Request, ctx: any) {
  const { id } = await ctx.params
  const data = await req.json().catch(() => ({}))
  
  try {
    const updated = await prisma.purchaseOrder.update({ 
      where: { id }, 
      data: {
        ...data,
        // Update status timestamps
        ...(data.status === 'APPROVED' && { approvedDate: new Date(), approvedBy: data.approvedBy || 'System' }),
        ...(data.status === 'ORDERED' && { orderedDate: new Date() })
      },
      include: {
        supplier: true,
        lines: { 
          include: { 
            item: true,
            requestedDepartment: true
          } 
        }
      }
    })
    return Response.json(updated)
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(_: Request, ctx: any) {
  const { id } = await ctx.params
  try {
    await prisma.purchaseOrder.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}
