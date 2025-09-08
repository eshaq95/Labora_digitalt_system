import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function createExampleOrder() {
  console.log('📋 Creating example purchase order...')
  
  try {
    // First, ensure we have a user to create the order
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'lab.manager@labora.no',
          name: 'Lab Manager',
          password: 'hashed_password_here', // In real app, this would be properly hashed
          role: 'PURCHASER'
        }
      })
      console.log('✅ Created example user: Lab Manager')
    }
    
    // Get some items from different categories for a realistic order
    const items = await prisma.item.findMany({
      include: {
        category: true,
        department: true,
        supplierItems: {
          include: { supplier: true },
          take: 1
        }
      },
      take: 20
    })
    
    console.log(`📦 Found ${items.length} items to choose from`)
    
    // Select items for our example order - mix of different categories
    const orderItems = [
      // HMS items
      items.find(i => i.name.includes('hansker') || i.name.includes('Hansker')),
      // Mikro utstyr
      items.find(i => i.name.includes('Pipette') || i.name.includes('pipette')),
      items.find(i => i.name.includes('PCR') && i.name.includes('plate')),
      // Mikro kjemikalier og forbruksvarer
      items.find(i => i.name.includes('Petrifilm')),
      items.find(i => i.name.includes('TEMPO')),
      items.find(i => i.name.includes('agar')),
      items.find(i => i.name.includes('Tips') || i.name.includes('tips')),
      // Kjemi kjemikalier
      items.find(i => i.name.includes('Saltsyre') || i.name.includes('HCl'))
    ].filter(Boolean) // Remove any undefined items
    
    console.log(`🎯 Selected ${orderItems.length} items for the order:`)
    orderItems.forEach(item => {
      console.log(`  - ${item!.name} (${item!.category?.name})`)
    })
    
    // Group items by supplier for realistic ordering
    const itemsBySupplier = orderItems.reduce((acc, item) => {
      if (!item || !item.supplierItems[0]) return acc
      
      const supplierId = item.supplierItems[0].supplierId
      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplier: item.supplierItems[0].supplier,
          items: []
        }
      }
      acc[supplierId].items.push(item)
      return acc
    }, {} as Record<string, { supplier: any, items: any[] }>)
    
    console.log(`🏢 Items grouped by ${Object.keys(itemsBySupplier).length} suppliers`)
    
    // Create orders for each supplier
    const createdOrders = []
    let orderCount = 1
    
    for (const [supplierId, supplierGroup] of Object.entries(itemsBySupplier)) {
      if (supplierGroup.items.length === 0) continue
      
      // Generate order number
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount).padStart(4, '0')}`
      
      // Create realistic order lines
      const orderLines = supplierGroup.items.map(item => {
        const supplierItem = item.supplierItems[0]
        const baseQuantity = Math.floor(Math.random() * 5) + 1 // 1-5 units
        const quantity = item.name.toLowerCase().includes('pack') || 
                        item.name.toLowerCase().includes('kit') ? 
                        baseQuantity : baseQuantity * 5 // More for consumables
        
        return {
          itemId: item.id,
          quantityOrdered: quantity,
          unitPrice: supplierItem.negotiatedPrice || supplierItem.listPrice || new Decimal(100),
          departmentId: item.departmentId,
          notes: `Bestilt for ${item.department?.name || 'laboratoriet'}`
        }
      })
      
      // Calculate expected delivery date (7-14 days from now)
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() + Math.floor(Math.random() * 7) + 7)
      
      // Create the order
      const order = await prisma.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId,
          priority: orderCount === 1 ? 'HIGH' : 'MEDIUM', // First order is high priority
          expectedDate,
          requestedBy: user.id,
          notes: `Månedlig bestilling av laboratorieutstyr og forbruksvarer fra ${supplierGroup.supplier.name}. Bestillingen inneholder ${orderLines.length} forskjellige varer for drift av mikrobiologi- og kjemilaboratoriet.`,
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
              },
              requestedDepartment: true
            }
          }
        }
      })
      
      createdOrders.push(order)
      orderCount++
      
      console.log(`✅ Created order ${order.orderNumber} for ${supplierGroup.supplier.name}`)
      console.log(`   - ${order.lines.length} items`)
      console.log(`   - Priority: ${order.priority}`)
      console.log(`   - Expected: ${order.expectedDate?.toLocaleDateString('no-NO')}`)
      
      // Show order details
      order.lines.forEach(line => {
        const totalPrice = line.unitPrice ? 
          new Decimal(line.unitPrice).mul(line.quantityOrdered) : 
          new Decimal(0)
        console.log(`     • ${line.quantityOrdered}x ${line.item.name} - ${totalPrice.toFixed(2)} NOK`)
      })
    }
    
    // Create one additional order with mixed status for demonstration
    if (createdOrders.length > 0) {
      const firstOrder = createdOrders[0]
      
      // Update first order to APPROVED status
      await prisma.purchaseOrder.update({
        where: { id: firstOrder.id },
        data: {
          status: 'APPROVED',
          approvedBy: user.id,
          approvedDate: new Date()
        }
      })
      
      console.log(`📋 Updated ${firstOrder.orderNumber} to APPROVED status`)
    }
    
    console.log(`\n🎉 Successfully created ${createdOrders.length} example orders!`)
    
    // Show summary
    const totalOrders = await prisma.purchaseOrder.count()
    const totalOrderLines = await prisma.purchaseOrderLine.count()
    
    console.log(`\n📊 Order System Summary:`)
    console.log(`  - Total orders: ${totalOrders}`)
    console.log(`  - Total order lines: ${totalOrderLines}`)
    console.log(`  - Suppliers involved: ${Object.keys(itemsBySupplier).length}`)
    
    // Show orders by status
    const ordersByStatus = await prisma.purchaseOrder.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    console.log(`\n📈 Orders by status:`)
    ordersByStatus.forEach(group => {
      const statusNames = {
        'REQUESTED': 'Forespurt',
        'APPROVED': 'Godkjent',
        'ORDERED': 'Bestilt',
        'PARTIAL': 'Delvis mottatt',
        'RECEIVED': 'Fullført',
        'CANCELLED': 'Kansellert'
      }
      console.log(`  - ${statusNames[group.status as keyof typeof statusNames]}: ${group._count.id}`)
    })
    
  } catch (error) {
    console.error('❌ Error creating example order:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createExampleOrder().catch(console.error)
