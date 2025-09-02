import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Finn avtaler som utløper innen 30 dager
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const expiringAgreements = await prisma.supplierItem.findMany({
      where: {
        priceValidUntil: {
          lte: thirtyDaysFromNow,
          gte: new Date() // Ikke allerede utløpt
        }
      },
      include: {
        item: { select: { name: true } },
        supplier: { select: { name: true } }
      },
      orderBy: { priceValidUntil: 'asc' },
      take: 10
    })

    // Finn priser som ikke er verifisert på over 6 måneder
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const outdatedPrices = await prisma.supplierItem.findMany({
      where: {
        lastVerifiedDate: {
          lt: sixMonthsAgo
        }
      },
      include: {
        item: { select: { name: true } },
        supplier: { select: { name: true } }
      },
      orderBy: { lastVerifiedDate: 'asc' },
      take: 10
    })

    return Response.json({
      expiringAgreements: expiringAgreements.map(item => ({
        id: item.id,
        itemName: item.item.name,
        supplierName: item.supplier.name,
        agreementReference: item.agreementReference,
        expiryDate: item.priceValidUntil,
        daysUntilExpiry: item.priceValidUntil 
          ? Math.ceil((item.priceValidUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null
      })),
      outdatedPrices: outdatedPrices.map(item => ({
        id: item.id,
        itemName: item.item.name,
        supplierName: item.supplier.name,
        lastVerified: item.lastVerifiedDate,
        daysSinceVerified: Math.ceil((new Date().getTime() - item.lastVerifiedDate.getTime()) / (1000 * 60 * 60 * 24))
      }))
    })
  } catch (error) {
    console.error('Error fetching price alerts:', error)
    return Response.json({ error: 'Kunne ikke hente prisvarsler' }, { status: 500 })
  }
}
