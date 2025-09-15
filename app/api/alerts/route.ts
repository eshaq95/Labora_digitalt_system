import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { NextResponse } from 'next/server'

export const GET = requireAuth(async (req) => {
  try {
    // Low stock: items where sum(lots.quantity) < item.minStock
    const lots = await prisma.inventoryLot.groupBy({
      by: ['itemId'],
      _sum: { quantity: true },
    })
    const totals: Record<string, number> = Object.fromEntries(lots.map((l) => [l.itemId, l._sum.quantity || 0]))
    const items = await prisma.item.findMany({ 
      select: { 
        id: true, 
        name: true, 
        minStock: true,
        department: { select: { name: true } },
        defaultLocation: { select: { name: true } }
      } 
    })
    const lowStock = items
      .map((i) => ({ 
        itemId: i.id, 
        name: i.name, 
        minStock: i.minStock, 
        onHand: totals[i.id] || 0,
        department: i.department?.name,
        location: i.defaultLocation?.name
      }))
      .filter((r) => r.onHand <= r.minStock)
    
    console.log(`🔍 Debug alerts: Total items: ${items.length}, Low stock items: ${lowStock.length}`)
    console.log(`📊 Sample low stock items:`, lowStock.slice(0, 5).map(i => `${i.name}: ${i.onHand}/${i.minStock}`))

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

    return NextResponse.json({ lowStock, expiring })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Kunne ikke hente varsler' }, { status: 500 })
  }
})







