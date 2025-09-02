import { prisma } from '@/lib/prisma'

export async function GET(req: Request, ctx: any) {
  const { id } = ctx.params
  try {
    const supplier = await prisma.supplier.findUnique({ 
      where: { id },
      include: {
        supplierItems: {
          include: { item: true }
        }
      }
    })
    if (!supplier) {
      return Response.json({ error: 'Leverandør ikke funnet' }, { status: 404 })
    }
    return Response.json(supplier)
  } catch {
    return Response.json({ error: 'Feil ved henting av leverandør' }, { status: 500 })
  }
}

export async function PATCH(req: Request, ctx: any) {
  const { id } = ctx.params
  const body = await req.json().catch(() => ({}))
  
  // Extract and validate data
  const { 
    name,
    // New CSV-based fields
    orderMethod, website, orderEmail, contactPerson, phone, username, password, notes,
    // Legacy fields (for backward compatibility)  
    contactName, contactEmail, contactPhone, orderingMethod,
    // Freight fields
    freeShippingThreshold, standardShippingCost, shippingNotes, orderingInstructions
  } = body || {}
  
  try {
    const updateData: any = {}
    
    // Only update fields that are provided
    if (name !== undefined) updateData.name = name?.trim()
    if (orderMethod !== undefined) updateData.orderMethod = orderMethod || null
    if (website !== undefined) updateData.website = website || null
    if (orderEmail !== undefined) updateData.orderEmail = orderEmail || null
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson || null
    if (phone !== undefined) updateData.phone = phone || null
    if (username !== undefined) updateData.username = username || null
    if (password !== undefined) updateData.password = password || null
    if (notes !== undefined) updateData.notes = notes || null
    
    // Legacy fields (fallback)
    if (contactName !== undefined) updateData.contactName = contactName || null
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail || null
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone || null
    if (orderingMethod !== undefined) updateData.orderingMethod = orderingMethod || null
    
    // Freight fields
    if (freeShippingThreshold !== undefined) updateData.freeShippingThreshold = freeShippingThreshold ? Number(freeShippingThreshold) : null
    if (standardShippingCost !== undefined) updateData.standardShippingCost = standardShippingCost ? Number(standardShippingCost) : null
    if (shippingNotes !== undefined) updateData.shippingNotes = shippingNotes || null
    if (orderingInstructions !== undefined) updateData.orderingInstructions = orderingInstructions || null
    
    const updated = await prisma.supplier.update({ 
      where: { id }, 
      data: updateData,
      include: {
        supplierItems: {
          include: { item: true }
        }
      }
    })
    return Response.json(updated)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return Response.json({ error: 'Leverandør ikke funnet' }, { status: 404 })
    }
    return Response.json({ error: 'Feil ved oppdatering av leverandør' }, { status: 500 })
  }
}

export async function DELETE(_: Request, ctx: any) {
  const { id } = ctx.params
  try {
    await prisma.supplier.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

