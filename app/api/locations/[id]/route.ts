import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, ctx: any) {
  const { id } = ctx.params
  const data = await req.json().catch(() => ({}))
  try {
    const updated = await prisma.location.update({ where: { id }, data })
    return Response.json(updated)
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(_: Request, ctx: any) {
  const { id } = ctx.params
  try {
    await prisma.location.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

