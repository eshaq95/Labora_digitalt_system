import { prisma } from '@/lib/prisma'

export async function GET() {
  const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } })
  return Response.json(locations)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { name, type, notes } = body || {}
  if (typeof name !== 'string' || !name.trim()) {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }
  const location = await prisma.location.create({
    data: { name: name.trim(), type: type || 'MAIN', notes: notes || null },
  })
  return Response.json(location, { status: 201 })
}

