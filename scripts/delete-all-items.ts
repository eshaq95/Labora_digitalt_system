import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteAllItems() {
  try {
    console.log('Sletter alle varer og relaterte data...')
    
    // Først sjekk antall varer
    const itemCount = await prisma.item.count()
    console.log(`Fant ${itemCount} varer i databasen`)
    
    if (itemCount === 0) {
      console.log('Ingen varer å slette')
      return
    }
    
    // Slett relaterte data først (i riktig rekkefølge)
    console.log('Sletter relaterte data...')
    
    // Slett inventory transactions
    const transactionResult = await prisma.inventoryTransaction.deleteMany({})
    console.log(`Slettet ${transactionResult.count} inventory transactions`)
    
    // Slett inventory lots
    const lotResult = await prisma.inventoryLot.deleteMany({})
    console.log(`Slettet ${lotResult.count} inventory lots`)
    
    // Slett cycle counting lines
    const cycleCountResult = await prisma.cycleCountingLine.deleteMany({})
    console.log(`Slettet ${cycleCountResult.count} cycle counting lines`)
    
    // Slett purchase order lines
    const orderLineResult = await prisma.purchaseOrderLine.deleteMany({})
    console.log(`Slettet ${orderLineResult.count} purchase order lines`)
    
    // Slett receipt lines
    const receiptLineResult = await prisma.receiptLine.deleteMany({})
    console.log(`Slettet ${receiptLineResult.count} receipt lines`)
    
    // Slett supplier items
    const supplierItemResult = await prisma.supplierItem.deleteMany({})
    console.log(`Slettet ${supplierItemResult.count} supplier items`)
    
    // Nå kan vi slette alle varer
    console.log('Sletter alle varer...')
    const result = await prisma.item.deleteMany({})
    
    console.log(`Slettet ${result.count} varer fra varekartoteket`)
    console.log('✅ Alle varer og relaterte data er nå slettet!')
    
  } catch (error) {
    console.error('Feil ved sletting av varer:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllItems()