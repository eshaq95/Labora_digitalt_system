import { prisma } from '@/lib/prisma'

export async function GET() {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } })
  return Response.json(suppliers)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { name, website, contactName, contactEmail, contactPhone, orderingMethod, freeShippingThreshold, shippingCost } = body || {}
  if (typeof name !== 'string' || !name.trim()) {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }
  const supplier = await prisma.supplier.create({
    data: {
      name: name.trim(),
      website: website || null,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      orderingMethod: orderingMethod || null,
      freeShippingThreshold: freeShippingThreshold ?? null,
      standardShippingCost: shippingCost ?? null,
    },
  })
  return Response.json(supplier, { status: 201 })
}

