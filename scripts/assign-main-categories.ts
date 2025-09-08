import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function assignMainCategories() {
  console.log('🎨 Assigning main categories to items based on JSON order...')
  
  try {
    // Get all items ordered by creation time (which should match JSON import order)
    const allItems = await prisma.item.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, createdAt: true }
    })
    
    console.log(`📦 Found ${allItems.length} items to categorize`)
    
    // Based on your specification:
    // HMS: 2 items (first 2)
    // Mikro utstyr: 45 items (next 45, items 3-47) 
    // Mikro kjemikalier og forbruksvarer: 239 items (next 239, items 48-286)
    // Kjemi kjemikalier og gass: 2 items (last 2, items 287-288)
    
    const categories = [
      { name: 'HMS', count: 2, color: '#9333EA' },
      { name: 'MIKRO_UTSTYR', count: 45, color: '#F59E0B' },
      { name: 'MIKRO_KJEMI', count: 239, color: '#EF4444' },
      { name: 'KJEMI_GASS', count: 2, color: '#10B981' }
    ]
    
    let currentIndex = 0
    let updated = 0
    
    for (const category of categories) {
      const itemsToUpdate = allItems.slice(currentIndex, currentIndex + category.count)
      
      console.log(`\n🏷️  Updating ${itemsToUpdate.length} items to category: ${category.name}`)
      console.log(`   Items ${currentIndex + 1} to ${currentIndex + itemsToUpdate.length}`)
      
      if (itemsToUpdate.length > 0) {
        // Show first few item names for verification
        console.log(`   First items: ${itemsToUpdate.slice(0, 3).map(i => i.name).join(', ')}${itemsToUpdate.length > 3 ? '...' : ''}`)
        
        // Update all items in this category
        const result = await prisma.item.updateMany({
          where: {
            id: {
              in: itemsToUpdate.map(item => item.id)
            }
          },
          data: {
            mainCategory: category.name
          }
        })
        
        updated += result.count
        console.log(`   ✅ Updated ${result.count} items`)
      }
      
      currentIndex += category.count
    }
    
    // Verify the results
    console.log('\n📊 Verification - Items by main category:')
    const verification = await prisma.item.groupBy({
      by: ['mainCategory'],
      _count: {
        id: true
      },
      orderBy: {
        mainCategory: 'asc'
      }
    })
    
    verification.forEach(group => {
      const categoryInfo = categories.find(c => c.name === group.mainCategory)
      console.log(`  ${group.mainCategory || 'NULL'}: ${group._count.id} items ${categoryInfo ? `(Expected: ${categoryInfo.count})` : ''}`)
    })
    
    console.log(`\n🎉 Successfully updated ${updated} items with main categories!`)
    
  } catch (error) {
    console.error('❌ Error assigning main categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

assignMainCategories().catch(console.error)
