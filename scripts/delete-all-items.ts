import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteAllItems() {
  console.log('🗑️  Starting deletion of all items...')
  
  try {
    // First, get count of items to delete
    const itemCount = await prisma.item.count()
    console.log(`📊 Found ${itemCount} items to delete`)
    
    if (itemCount === 0) {
      console.log('✅ No items to delete')
      return
    }
    
    // Delete related data first (to avoid foreign key constraints)
    console.log('🔗 Deleting related data...')
    
    // Delete inventory transactions
    const deletedTransactions = await prisma.inventoryTransaction.deleteMany()
    console.log(`  - Deleted ${deletedTransactions.count} inventory transactions`)
    
    // Delete inventory lots
    const deletedLots = await prisma.inventoryLot.deleteMany()
    console.log(`  - Deleted ${deletedLots.count} inventory lots`)
    
    // Delete supplier items
    const deletedSupplierItems = await prisma.supplierItem.deleteMany()
    console.log(`  - Deleted ${deletedSupplierItems.count} supplier items`)
    
    // Delete purchase order lines
    const deletedOrderLines = await prisma.purchaseOrderLine.deleteMany()
    console.log(`  - Deleted ${deletedOrderLines.count} purchase order lines`)
    
    // Delete receipt lines
    const deletedReceiptLines = await prisma.receiptLine.deleteMany()
    console.log(`  - Deleted ${deletedReceiptLines.count} receipt lines`)
    
    // Delete discounts
    const deletedDiscounts = await prisma.discount.deleteMany()
    console.log(`  - Deleted ${deletedDiscounts.count} discounts`)
    
    // Delete cycle counting lines
    const deletedCountingLines = await prisma.cycleCountingLine.deleteMany()
    console.log(`  - Deleted ${deletedCountingLines.count} cycle counting lines`)
    
    // Finally, delete all items
    console.log('📦 Deleting all items...')
    const deletedItems = await prisma.item.deleteMany()
    console.log(`✅ Successfully deleted ${deletedItems.count} items`)
    
    // Verify deletion
    const remainingItems = await prisma.item.count()
    if (remainingItems === 0) {
      console.log('🎉 All items successfully deleted!')
    } else {
      console.log(`⚠️  Warning: ${remainingItems} items still remain`)
    }
    
  } catch (error) {
    console.error('❌ Error deleting items:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllItems().catch(console.error)
