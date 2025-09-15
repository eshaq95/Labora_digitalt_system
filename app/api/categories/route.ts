import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/auth-middleware'
import { NextResponse } from 'next/server'

export const GET = requireAuth(async (req) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(categories)
})

export const POST = requireRole(['ADMIN', 'PURCHASER'])(async (req) => {
  const body = await req.json().catch(() => ({}))
  const { name, code, description } = body || {}
  
  if (!name || !code) {
    return NextResponse.json({ error: 'name and code required' }, { status: 400 })
  }
  
  const category = await prisma.category.create({
    data: { name, code, description: description || null }
  })
  
  return NextResponse.json(category, { status: 201 })
})
