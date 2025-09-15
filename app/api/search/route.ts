import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { NextResponse, NextRequest } from 'next/server'

type SearchItem = {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon?: string;
  section: "Varer" | "Bestillinger" | "Leverandører" | "Lager";
}

export const GET = requireAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.trim()
    
    console.log('🔍 Search API called with query:', query)
    console.log('👤 User authenticated:', (req as any).user?.email)
    
    if (!query || query.length < 2) {
      console.log('❌ Query too short or empty')
      return NextResponse.json({ items: [] })
    }

    const items: SearchItem[] = []

    // Search Items/Varer
    const itemsResults = await prisma.item.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        category: { select: { name: true } },
        department: { select: { name: true } }
      },
      take: 8
    })

    items.push(...itemsResults.map(item => ({
      id: `item-${item.id}`,
      label: item.name,
      sublabel: `${item.sku} • ${item.category?.name || 'Ingen kategori'}`,
      href: `/items/${item.id}`,
      icon: '📦',
      section: 'Varer' as const
    })))

    // Search Orders/Bestillinger
    const ordersResults = await prisma.purchaseOrder.findMany({
      where: {
        OR: [
          { orderNumber: { contains: query, mode: 'insensitive' } },
          { supplier: { name: { contains: query, mode: 'insensitive' } } }
        ]
      },
      include: {
        supplier: { select: { name: true } }
      },
      take: 6
    })

    items.push(...ordersResults.map(order => ({
      id: `order-${order.id}`,
      label: `Bestilling ${order.orderNumber}`,
      sublabel: `${order.supplier?.name || 'Ukjent leverandør'} • ${order.status}`,
      href: `/orders?search=${order.orderNumber}`,
      icon: '🧾',
      section: 'Bestillinger' as const
    })))

    // Search Suppliers/Leverandører
    console.log('🚚 Searching suppliers for:', query)
    const suppliersResults = await prisma.supplier.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { contactEmail: { contains: query, mode: 'insensitive' } },
          { orderEmail: { contains: query, mode: 'insensitive' } },
          { shortCode: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        category: { select: { name: true } }
      },
      take: 6
    })
    
    console.log('📊 Found suppliers:', suppliersResults.length, suppliersResults.map(s => s.name))

    items.push(...suppliersResults.map(supplier => ({
      id: `supplier-${supplier.id}`,
      label: supplier.name,
      sublabel: `${supplier.category?.name || 'Ingen kategori'} • ${supplier.contactEmail || 'Ingen e-post'}`,
      href: `/suppliers/${supplier.id}`,
      icon: '🚚',
      section: 'Leverandører' as const
    })))

    // Search Inventory/Lager
    const inventoryResults = await prisma.inventoryLot.findMany({
      where: {
        OR: [
          { item: { name: { contains: query, mode: 'insensitive' } } },
          { item: { sku: { contains: query, mode: 'insensitive' } } },
          { lotNumber: { contains: query, mode: 'insensitive' } },
          { location: { name: { contains: query, mode: 'insensitive' } } }
        ],
        quantity: { gt: 0 }
      },
      include: {
        item: { select: { name: true, sku: true } },
        location: { select: { name: true } }
      },
      take: 6
    })

    items.push(...inventoryResults.map(lot => ({
      id: `lot-${lot.id}`,
      label: lot.item.name,
      sublabel: `${lot.location.name} • ${lot.quantity} stk • Lot: ${lot.lotNumber || 'N/A'}`,
      href: `/inventory?highlight=${lot.id}`,
      icon: '📊',
      section: 'Lager' as const
    })))

    console.log('✅ Returning', items.length, 'total items')
    return NextResponse.json({ items })
  } catch (error) {
    console.error('❌ Search error:', error)
    return NextResponse.json({ 
      error: 'Søk feilet',
      items: [] 
    }, { status: 500 })
  }
})
