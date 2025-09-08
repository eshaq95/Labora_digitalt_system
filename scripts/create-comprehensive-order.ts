import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function createComprehensiveOrder() {
  console.log('📋 Creating comprehensive example orders...')
  
  try {
    // Get the user
    let user = await prisma.user.findFirst()
    if (!user) {
      console.log('❌ No user found. Please run the previous script first.')
      return
    }
    
    // Get items from each main category
    const hmsItems = await prisma.item.findMany({
      where: { category: { name: 'HMS' } },
      include: {
        category: true,
        department: true,
        supplierItems: { include: { supplier: true }, take: 1 }
      }
    })
    
    const mikroUtstyrItems = await prisma.item.findMany({
      where: { category: { name: 'Mikro utstyr' } },
      include: {
        category: true,
        department: true,
        supplierItems: { include: { supplier: true }, take: 1 }
      },
      take: 8
    })
    
    const mikroKjemiItems = await prisma.item.findMany({
      where: { category: { name: 'Mikro kjemikalier og forbruksvarer' } },
      include: {
        category: true,
        department: true,
        supplierItems: { include: { supplier: true }, take: 1 }
      },
      take: 12
    })
    
    const kjemiGassItems = await prisma.item.findMany({
      where: { category: { name: 'Kjemi kjemikalier og gass' } },
      include: {
        category: true,
        department: true,
        supplierItems: { include: { supplier: true }, take: 1 }
      }
    })
    
    console.log(`📊 Found items:`)
    console.log(`  🟣 HMS: ${hmsItems.length} items`)
    console.log(`  🟡 Mikro utstyr: ${mikroUtstyrItems.length} items`)
    console.log(`  🔴 Mikro kjemi: ${mikroKjemiItems.length} items`)
    console.log(`  🟢 Kjemi gass: ${kjemiGassItems.length} items`)
    
    // Combine all items
    const allSelectedItems = [
      ...hmsItems,
      ...mikroUtstyrItems.slice(0, 8),
      ...mikroKjemiItems.slice(0, 12),
      ...kjemiGassItems
    ].filter(item => item.supplierItems.length > 0) // Only items with suppliers
    
    console.log(`\n🎯 Selected ${allSelectedItems.length} items for orders`)
    
    // Group by supplier
    const itemsBySupplier = allSelectedItems.reduce((acc, item) => {
      const supplierId = item.supplierItems[0].supplierId
      const supplierName = item.supplierItems[0].supplier.name
      
      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplier: item.supplierItems[0].supplier,
          items: []
        }
      }
      acc[supplierId].items.push(item)
      return acc
    }, {} as Record<string, { supplier: any, items: any[] }>)
    
    console.log(`\n🏢 Grouped into ${Object.keys(itemsBySupplier).length} suppliers:`)
    Object.values(itemsBySupplier).forEach(group => {
      console.log(`  - ${group.supplier.name}: ${group.items.length} items`)
    })
    
    // Create orders for each supplier
    const createdOrders = []
    let orderCount = await prisma.purchaseOrder.count() + 1
    
    for (const [supplierId, supplierGroup] of Object.entries(itemsBySupplier)) {
      if (supplierGroup.items.length === 0) continue
      
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount).padStart(4, '0')}`
      
      // Create realistic quantities based on item type
      const orderLines = supplierGroup.items.map(item => {
        let quantity = 1
        const itemName = item.name.toLowerCase()
        
        // Realistic quantities based on item type
        if (itemName.includes('tips') || itemName.includes('spiss')) {
          quantity = 2 // 2 boxes of tips
        } else if (itemName.includes('hansker') || itemName.includes('glove')) {
          quantity = 5 // 5 boxes of gloves
        } else if (itemName.includes('petrifilm') || itemName.includes('plate')) {
          quantity = 3 // 3 packs of plates
        } else if (itemName.includes('tempo') || itemName.includes('kit')) {
          quantity = 2 // 2 kits
        } else if (itemName.includes('agar') || itemName.includes('medium')) {
          quantity = 4 // 4 bottles/packs of media
        } else if (itemName.includes('pipette') || itemName.includes('tube')) {
          quantity = 10 // 10 packs of consumables
        } else if (itemName.includes('pcr')) {
          quantity = 5 // 5 packs of PCR supplies
        } else {
          quantity = Math.floor(Math.random() * 3) + 2 // 2-4 for other items
        }
        
        const supplierItem = item.supplierItems[0]
        const unitPrice = supplierItem.negotiatedPrice || 
                         supplierItem.listPrice || 
                         new Decimal(Math.floor(Math.random() * 500) + 50) // Random price if none
        
        return {
          itemId: item.id,
          quantityOrdered: quantity,
          unitPrice,
          departmentId: item.departmentId,
          notes: `Månedlig forbruk - ${item.category?.name}`
        }
      })
      
      // Calculate total value
      const totalValue = orderLines.reduce((sum, line) => {
        return sum + (line.unitPrice.toNumber() * line.quantityOrdered)
      }, 0)
      
      // Set priority based on total value and item types
      let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM'
      if (totalValue > 10000) priority = 'HIGH'
      if (supplierGroup.items.some(item => item.category?.name === 'HMS')) priority = 'HIGH'
      if (supplierGroup.items.some(item => item.name.toLowerCase().includes('critical'))) priority = 'URGENT'
      
      // Expected delivery date
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() + Math.floor(Math.random() * 10) + 5) // 5-15 days
      
      const order = await prisma.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId,
          priority,
          expectedDate,
          requestedBy: user.id,
          notes: `Månedlig bestilling fra ${supplierGroup.supplier.name}. Inneholder ${orderLines.length} varer fra kategoriene: ${[...new Set(supplierGroup.items.map(i => i.category?.name))].join(', ')}. Total verdi: ${totalValue.toFixed(2)} NOK.`,
          status: 'REQUESTED',
          lines: {
            create: orderLines
          }
        },
        include: {
          supplier: true,
          lines: {
            include: {
              item: {
                include: {
                  category: true,
                  department: true
                }
              }
            }
          }
        }
      })
      
      createdOrders.push(order)
      orderCount++
      
      console.log(`\n✅ Created order ${order.orderNumber}`)
      console.log(`   🏢 Supplier: ${order.supplier.name}`)
      console.log(`   📦 Items: ${order.lines.length}`)
      console.log(`   ⚡ Priority: ${order.priority}`)
      console.log(`   📅 Expected: ${order.expectedDate?.toLocaleDateString('no-NO')}`)
      console.log(`   💰 Total value: ${totalValue.toFixed(2)} NOK`)
      
      // Show some order lines
      console.log(`   📋 Items:`)
      order.lines.slice(0, 5).forEach(line => {
        const total = line.unitPrice ? new Decimal(line.unitPrice).mul(line.quantityOrdered) : new Decimal(0)
        console.log(`     • ${line.quantityOrdered}x ${line.item.name} - ${total.toFixed(2)} NOK`)
      })
      if (order.lines.length > 5) {
        console.log(`     ... and ${order.lines.length - 5} more items`)
      }
    }
    
    // Update some orders to different statuses for demonstration
    if (createdOrders.length > 0) {
      // Approve first order
      await prisma.purchaseOrder.update({
        where: { id: createdOrders[0].id },
        data: {
          status: 'APPROVED',
          approvedBy: user.id,
          approvedDate: new Date()
        }
      })
      console.log(`📋 Approved order ${createdOrders[0].orderNumber}`)
      
      // Set second order as ORDERED if exists
      if (createdOrders.length > 1) {
        await prisma.purchaseOrder.update({
          where: { id: createdOrders[1].id },
          data: {
            status: 'ORDERED',
            approvedBy: user.id,
            approvedDate: new Date(Date.now() - 86400000), // Yesterday
            orderedDate: new Date(),
            supplierOrderNumber: `SUP-${Math.floor(Math.random() * 10000)}`
          }
        })
        console.log(`📤 Sent order ${createdOrders[1].orderNumber} to supplier`)
      }
    }
    
    console.log(`\n🎉 Successfully created ${createdOrders.length} comprehensive orders!`)
    
    // Final summary
    const totalOrders = await prisma.purchaseOrder.count()
    const totalOrderLines = await prisma.purchaseOrderLine.count()
    const totalValue = await prisma.purchaseOrderLine.aggregate({
      _sum: {
        unitPrice: true
      }
    })
    
    console.log(`\n📊 Complete Order System Summary:`)
    console.log(`  📋 Total orders: ${totalOrders}`)
    console.log(`  📦 Total order lines: ${totalOrderLines}`)
    console.log(`  💰 Total value: ${totalValue._sum.unitPrice?.toFixed(2) || '0'} NOK`)
    
    // Orders by status
    const ordersByStatus = await prisma.purchaseOrder.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    console.log(`\n📈 Orders by status:`)
    const statusNames = {
      'REQUESTED': 'Forespurt',
      'APPROVED': 'Godkjent', 
      'ORDERED': 'Bestilt',
      'PARTIAL': 'Delvis mottatt',
      'RECEIVED': 'Fullført',
      'CANCELLED': 'Kansellert'
    }
    
    ordersByStatus.forEach(group => {
      console.log(`  - ${statusNames[group.status as keyof typeof statusNames]}: ${group._count.id}`)
    })
    
    // Orders by priority
    const ordersByPriority = await prisma.purchaseOrder.groupBy({
      by: ['priority'],
      _count: { id: true }
    })
    
    console.log(`\n⚡ Orders by priority:`)
    const priorityNames = {
      'LOW': 'Lav',
      'MEDIUM': 'Medium',
      'HIGH': 'Høy',
      'URGENT': 'Kritisk'
    }
    
    ordersByPriority.forEach(group => {
      console.log(`  - ${priorityNames[group.priority as keyof typeof priorityNames]}: ${group._count.id}`)
    })
    
  } catch (error) {
    console.error('❌ Error creating comprehensive orders:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createComprehensiveOrder().catch(console.error)
