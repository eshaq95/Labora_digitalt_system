import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed Departments
  const departments = [
    { name: 'Mikrobiologi', code: 'MIKRO' },
    { name: 'Kjemi', code: 'KJEMI' },
    { name: 'HMS', code: 'HMS' },
    { name: 'Fiskehelse', code: 'FISKEHELSE' },
    { name: 'Kryo', code: 'KRYO' },
    { name: 'Mottak', code: 'MOTTAK' },
    { name: 'Administrasjon', code: 'ADMIN' },
    { name: 'IT', code: 'IT' },
    { name: 'Felles', code: 'FELLES' }
  ]

  console.log('📁 Creating departments...')
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept
    })
  }

  // Seed Categories
  const categories = [
    { name: 'Medier og Kjemikalier', code: 'MEDIA_CHEM', description: 'Vekstmedier, reagenser, kjemikalier' },
    { name: 'Utstyr og Instrumenter', code: 'EQUIPMENT', description: 'Laboratorieapparater, instrumenter' },
    { name: 'Forbruksutstyr', code: 'CONSUMABLES', description: 'Engangsartikler, pipettespisser, rør' },
    { name: 'Sikkerhetsutstyr', code: 'SAFETY', description: 'HMS-utstyr, verneutstyr' },
    { name: 'IT og Elektronikk', code: 'IT_ELECTRONICS', description: 'Datautstyr, elektroniske komponenter' },
    { name: 'Kontormaterialer', code: 'OFFICE', description: 'Papir, skrivesaker, kontorrekvisita' },
    { name: 'Vedlikehold og Rengjøring', code: 'MAINTENANCE', description: 'Rengjøringsmidler, vedlikeholdsutstyr' }
  ]

  console.log('🏷️ Creating categories...')
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: {},
      create: cat
    })
  }

  // Seed Locations
  const locations = [
    { name: 'Hovedlager', code: 'MAIN', type: 'MAIN' },
    { name: 'Kjølerom A', code: 'COLD_A', type: 'COLD' },
    { name: 'Kjølerom B', code: 'COLD_B', type: 'COLD' },
    { name: 'Medieskap', code: 'MEDIA_CAB', type: 'MAIN' },
    { name: 'Kjemikalieskap', code: 'CHEM_CAB', type: 'MAIN' },
    { name: 'Giftskap', code: 'POISON_CAB', type: 'OTHER' },
    { name: 'Brannskap', code: 'FIRE_CAB', type: 'OTHER' },
    { name: 'Fryser -20°C', code: 'FREEZER_20', type: 'COLD' },
    { name: 'Fryser -80°C', code: 'FREEZER_80', type: 'COLD' }
  ]

  console.log('📍 Creating locations...')
  for (const loc of locations) {
    await prisma.location.upsert({
      where: { code: loc.code || loc.name },
      update: {},
      create: {
        name: loc.name,
        code: loc.code,
        type: loc.type as any
      }
    })
  }

  // Seed some example suppliers with freight optimization
  const suppliers = [
    { 
      name: 'VWR International', 
      shortCode: 'VWR',
      website: 'https://no.vwr.com',
      orderingMethod: 'Portal og E-post',
      freeShippingThreshold: 2500.00,
      standardShippingCost: 295.00,
      shippingNotes: 'Miljøgebyr 50kr på kjemikalier',
      orderingInstructions: 'Husk å oppgi Labora kontonummer: LAB-2024 ved bestilling'
    },
    { 
      name: 'Thermo Fisher Scientific', 
      shortCode: 'THERMO',
      website: 'https://www.thermofisher.com',
      orderingMethod: 'Portal',
      freeShippingThreshold: 3000.00,
      standardShippingCost: 350.00,
      orderingInstructions: 'Bruk alltid Labforum-avtalen referanse: LF2025'
    },
    { 
      name: 'Sigma-Aldrich', 
      shortCode: 'SIGMA',
      website: 'https://www.sigmaaldrich.com',
      orderingMethod: 'Portal',
      freeShippingThreshold: 2000.00,
      standardShippingCost: 250.00
    },
    { 
      name: 'Bio-Rad Laboratories', 
      shortCode: 'BIORAD',
      website: 'https://www.bio-rad.com',
      orderingMethod: 'E-post og Telefon',
      freeShippingThreshold: 4000.00,
      standardShippingCost: 400.00,
      shippingNotes: 'Kjølefrakt +150kr for temperatursensitive produkter'
    }
  ]

  console.log('🚚 Creating suppliers...')
  for (const supplier of suppliers) {
    // Since name is no longer unique, use findFirst and create if not found
    const existing = await prisma.supplier.findFirst({
      where: { name: supplier.name }
    })
    
    if (!existing) {
      await prisma.supplier.create({
        data: supplier
      })
    }
  }

  // Seed some example SupplierItems (if we have items)
  const existingItems = await prisma.item.findMany({ take: 5 })
  const createdSuppliers = await prisma.supplier.findMany()
  
  if (existingItems.length > 0 && createdSuppliers.length > 0) {
    console.log('💰 Creating example supplier pricing...')
    
    const examplePricing = [
      {
        item: existingItems[0],
        supplier: createdSuppliers.find(s => s.shortCode === 'VWR'),
        supplierPartNumber: '09991274',
        listPrice: 1250.00,
        negotiatedPrice: 995.00,
        discountCodeRequired: 'Ref: LAB2024',
        agreementReference: 'Labforum 2025',
        isPrimarySupplier: true,
        minimumOrderQty: 2
      },
      {
        item: existingItems[1],
        supplier: createdSuppliers.find(s => s.shortCode === 'THERMO'),
        supplierPartNumber: 'TF-4521',
        listPrice: 850.00,
        negotiatedPrice: 680.00,
        discountCodeRequired: 'LF2025',
        agreementReference: 'Labforum 2025',
        isPrimarySupplier: true
      },
      {
        item: existingItems[0],
        supplier: createdSuppliers.find(s => s.shortCode === 'SIGMA'),
        supplierPartNumber: 'S-1234',
        listPrice: 1300.00,
        negotiatedPrice: 1150.00,
        isPrimarySupplier: false // Alternative supplier
      }
    ]

    for (const pricing of examplePricing) {
      if (pricing.supplier && pricing.item) {
        try {
          await prisma.supplierItem.upsert({
            where: {
              itemId_supplierId: {
                itemId: pricing.item.id,
                supplierId: pricing.supplier.id
              }
            },
            update: {},
            create: {
              itemId: pricing.item.id,
              supplierId: pricing.supplier.id,
              supplierPartNumber: pricing.supplierPartNumber,
              listPrice: pricing.listPrice,
              negotiatedPrice: pricing.negotiatedPrice,
              discountCodeRequired: pricing.discountCodeRequired || null,
              agreementReference: pricing.agreementReference || null,
              isPrimarySupplier: pricing.isPrimarySupplier,
              minimumOrderQty: pricing.minimumOrderQty || null
            }
          })
        } catch (error) {
          console.log(`Skipping duplicate pricing for ${pricing.item.name}`)
        }
      }
    }
  }

  console.log('✅ Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
