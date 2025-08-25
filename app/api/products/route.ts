// app/api/products/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    })
    return Response.json(products)
  } catch (err) {
    console.error('GET /api/products error:', err)
    return Response.json(
      { error: 'Failed to fetch products', details: String(err) },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, stock } = await req.json().catch(() => ({}))
    if (typeof name !== 'string' || !name.trim() || typeof stock !== 'number') {
      return Response.json(
        { error: 'Invalid body. Expect { name: string, stock: number }' },
        { status: 400 },
      )
    }

    const created = await prisma.product.create({
      data: { name: name.trim(), stock },
    })

    return Response.json(created, { status: 201 })
  } catch (err) {
    console.error('POST /api/products error:', err)
    return Response.json(
      { error: 'Failed to create product', details: String(err) },
      { status: 500 },
    )
  }
}
