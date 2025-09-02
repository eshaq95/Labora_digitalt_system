import { prisma } from '@/lib/prisma'

export async function GET() {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } })
  return Response.json(suppliers)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { 
    name, 
    // New CSV-based fields
    orderMethod, website, orderEmail, contactPerson, phone, username, password, notes,
    // Legacy fields (for backward compatibility)
    contactName, contactEmail, contactPhone, orderingMethod,
    // Freight fields
    freeShippingThreshold, standardShippingCost, shippingNotes, orderingInstructions
  } = body || {}
  
  if (typeof name !== 'string' || !name.trim()) {
    return Response.json({ error: 'Leverandørnavn er påkrevd' }, { status: 400 })
  }
  
  const supplier = await prisma.supplier.create({
    data: {
      name: name.trim(),
      // New CSV-based fields
      orderMethod: orderMethod || null,
      website: website || null,
      orderEmail: orderEmail || null,
      contactPerson: contactPerson || null,
      phone: phone || null,
      username: username || null,
      password: password || null,
      notes: notes || null,
      // Legacy fields (fallback for backward compatibility)
      contactName: contactName || contactPerson || null,
      contactEmail: contactEmail || orderEmail || null,
      contactPhone: contactPhone || phone || null,
      orderingMethod: orderingMethod || orderMethod || null,
      // Freight fields
      freeShippingThreshold: freeShippingThreshold ? Number(freeShippingThreshold) : null,
      standardShippingCost: standardShippingCost ? Number(standardShippingCost) : null,
      shippingNotes: shippingNotes || null,
      orderingInstructions: orderingInstructions || null,
    },
  })
  return Response.json(supplier, { status: 201 })
}

