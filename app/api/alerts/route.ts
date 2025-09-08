import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Low stock: items where sum(lots.quantity) < item.minStock
    const lots = await prisma.inventoryLot.groupBy({
      by: ['itemId'],
      _sum: { quantity: true },
    })
    const totals: Record<string, number> = Object.fromEntries(lots.map((l) => [l.itemId, l._sum.quantity || 0]))
    const items = await prisma.item.findMany({ select: { id: true, name: true, minStock: true } })
    const lowStock = items
      .map((i) => ({ itemId: i.id, name: i.name, minStock: i.minStock, onHand: totals[i.id] || 0 }))
      .filter((r) => r.onHand < r.minStock)

    // Expiry soon: lots with expiry within 30 days
    const soon = new Date()
    soon.setDate(soon.getDate() + 30)
    const expiring = await prisma.inventoryLot.findMany({
      where: { 
        expiryDate: { 
          lte: soon,
          gte: new Date() // Ikke allerede utløpt
        } 
      },
      include: { item: true, location: true },
      orderBy: { expiryDate: 'asc' },
      take: 10
    })

    return Response.json({ lowStock, expiring })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return Response.json({ error: 'Kunne ikke hente varsler' }, { status: 500 })
  }
}







