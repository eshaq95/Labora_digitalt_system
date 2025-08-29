import { prisma } from '@/lib/prisma'

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  })
  return Response.json(categories)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { name, code, description } = body || {}
  
  if (!name || !code) {
    return Response.json({ error: 'name and code required' }, { status: 400 })
  }
  
  const category = await prisma.category.create({
    data: { name, code, description: description || null }
  })
  
  return Response.json(category, { status: 201 })
}
