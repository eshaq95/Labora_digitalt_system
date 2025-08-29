import { prisma } from '@/lib/prisma'

export async function GET() {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
  })
  return Response.json(departments)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { name, code } = body || {}
  
  if (!name || !code) {
    return Response.json({ error: 'name and code required' }, { status: 400 })
  }
  
  const department = await prisma.department.create({
    data: { name, code }
  })
  
  return Response.json(department, { status: 201 })
}
