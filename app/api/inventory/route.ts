import { prisma } from '@/lib/prisma'

// Get current inventory status with filtering options
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')
    const locationId = searchParams.get('locationId')
    const lowStock = searchParams.get('lowStock') === 'true'
    const expiringSoon = searchParams.get('expiringSoon') === 'true'
    
    const where: any = {
      quantity: { gt: 0 }, // Only show items with stock
    }
    
    if (itemId) {
      where.itemId = itemId
    }
    
    if (locationId) {
      where.locationId = locationId
    }
    
    if (expiringSoon) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      where.expiryDate = {
        lte: thirtyDaysFromNow,
        not: null,
      }
    }
    
    let inventoryLots = await prisma.inventoryLot.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
            category: true,
            minStock: true,
            expiryTracking: true,
            hazardous: true,
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      },
      orderBy: [
        { expiryDate: 'asc' },
        { item: { name: 'asc' } },
      ]
    })
    
    // Filter for low stock if requested
    if (lowStock) {
      inventoryLots = inventoryLots.filter(lot => 
        lot.quantity <= lot.item.minStock
      )
    }
    
    return Response.json(inventoryLots)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return Response.json({ 
      error: 'Kunne ikke hente lagerstatus' 
    }, { status: 500 })
  }
}
