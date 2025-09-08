import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function importSampleItems() {
  console.log('📦 Importing sample items for testing dynamic filtering...')
  
  try {
    // Get reference data
    const [departments, categories, locations] = await Promise.all([
      prisma.department.findMany(),
      prisma.category.findMany(),
      prisma.location.findMany()
    ])
    
    console.log(`📊 Found ${departments.length} departments, ${categories.length} categories, ${locations.length} locations`)
    
    // Find or create required departments and categories
    let mikroDept = departments.find(d => d.name.includes('Mikrobiologi'))
    let kjemiDept = departments.find(d => d.name.includes('Kjemi'))
    
    if (!mikroDept) {
      mikroDept = await prisma.department.create({
        data: { name: 'Mikrobiologi', code: 'MIKRO' }
      })
      console.log('✅ Created Mikrobiologi department')
    }
    
    if (!kjemiDept) {
      kjemiDept = await prisma.department.create({
        data: { name: 'Kjemi', code: 'KJEMI' }
      })
      console.log('✅ Created Kjemi department')
    }
    
    // Find or create categories
    let hmsCategory = categories.find(c => c.name === 'HMS')
    let utstyrCategory = categories.find(c => c.name.includes('Utstyr'))
    let kjemikalierCategory = categories.find(c => c.name.includes('Kjemikalier'))
    let forbruksCategory = categories.find(c => c.name.includes('Forbruksvarer'))
    
    if (!hmsCategory) {
      hmsCategory = await prisma.category.create({
        data: { name: 'HMS', code: 'HMS', description: 'Helse, miljø og sikkerhet' }
      })
    }
    
    if (!utstyrCategory) {
      utstyrCategory = await prisma.category.create({
        data: { name: 'Utstyr og Instrumenter', code: 'UTSTYR', description: 'Laboratorieutstyr og instrumenter' }
      })
    }
    
    if (!kjemikalierCategory) {
      kjemikalierCategory = await prisma.category.create({
        data: { name: 'Kjemikalier', code: 'KJEMI', description: 'Kjemikalier og reagenser' }
      })
    }
    
    if (!forbruksCategory) {
      forbruksCategory = await prisma.category.create({
        data: { name: 'Forbruksvarer', code: 'FORBRUK', description: 'Forbruksmaterialer' }
      })
    }
    
    // Sample items representing the 4 main categories from Monday
    const sampleItems = [
      // HMS items
      {
        sku: 'HMS001',
        name: 'Kjemisk resistente hansker',
        departmentId: mikroDept.id,
        categoryId: hmsCategory.id,
        hmsCodes: 'XN',
        hazardous: true
      },
      {
        sku: 'HMS002', 
        name: 'Sikkerhetsskilt - Brannfarlig',
        departmentId: kjemiDept.id,
        categoryId: hmsCategory.id,
        hmsCodes: 'F',
        hazardous: true
      },
      
      // Mikro Utstyr items
      {
        sku: 'MU001',
        name: 'Mikroskop objektiv 40x',
        departmentId: mikroDept.id,
        categoryId: utstyrCategory.id,
        manufacturer: 'Zeiss'
      },
      {
        sku: 'MU002',
        name: 'Pipette 100-1000μl',
        departmentId: mikroDept.id,
        categoryId: utstyrCategory.id,
        manufacturer: 'Eppendorf'
      },
      {
        sku: 'MU003',
        name: 'Autoklav indikatorstrips',
        departmentId: mikroDept.id,
        categoryId: utstyrCategory.id
      },
      
      // Mikro Kjemi & Forbruk items
      {
        sku: 'MKF001',
        name: 'Tryptic Soy Agar',
        departmentId: mikroDept.id,
        categoryId: forbruksCategory.id,
        expiryTracking: true
      },
      {
        sku: 'MKF002',
        name: 'Petri skåler 90mm',
        departmentId: mikroDept.id,
        categoryId: forbruksCategory.id
      },
      {
        sku: 'MKF003',
        name: 'Bakteriologiske øser',
        departmentId: mikroDept.id,
        categoryId: forbruksCategory.id
      },
      {
        sku: 'MKF004',
        name: 'Gram farging kit',
        departmentId: mikroDept.id,
        categoryId: kjemikalierCategory.id,
        expiryTracking: true
      },
      
      // Kjemi & Gass items
      {
        sku: 'KG001',
        name: 'Saltsyre 37% HCl',
        departmentId: kjemiDept.id,
        categoryId: kjemikalierCategory.id,
        hmsCodes: 'C',
        hazardous: true,
        expiryTracking: true
      },
      {
        sku: 'KG002',
        name: 'Nitrogen gass 99.9%',
        departmentId: kjemiDept.id,
        categoryId: kjemikalierCategory.id,
        hazardous: true
      }
    ]
    
    console.log(`📦 Creating ${sampleItems.length} sample items...`)
    
    for (const itemData of sampleItems) {
      const item = await prisma.item.create({
        data: {
          ...itemData,
          unit: 'UNIT',
          minStock: 10,
          maxStock: 100,
          requiresLotNumber: itemData.expiryTracking || false,
          currency: 'NOK'
        }
      })
      console.log(`  ✅ Created: ${item.name} (${item.sku})`)
    }
    
    console.log('\n🎉 Sample items imported successfully!')
    
    // Show summary
    const summary = await prisma.item.groupBy({
      by: ['departmentId', 'categoryId'],
      _count: { id: true },
      include: {
        department: true,
        category: true
      }
    })
    
    console.log('\n📊 Summary by department and category:')
    for (const group of summary) {
      console.log(`  ${group._count.id} items`)
    }
    
  } catch (error) {
    console.error('❌ Error importing sample items:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importSampleItems().catch(console.error)
