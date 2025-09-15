import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/auth-middleware'

export const GET = requireAuth(async (req) => {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
  })
  return Response.json(departments)
})

export const POST = requireRole(['ADMIN', 'PURCHASER'])(async (req) => {
  const body = await req.json().catch(() => ({}))
  const { name, code } = body || {}
  
  if (!name || !code) {
    return Response.json({ error: 'name and code required' }, { status: 400 })
  }
  
  const department = await prisma.department.create({
    data: { name, code }
  })
  
  return Response.json(department, { status: 201 })
})
