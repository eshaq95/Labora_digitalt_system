import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import * as fs from 'fs'

const prisma = new PrismaClient()

// JSON structure mapping
interface VarekartotekItem {
  "HMS": string | null; // This is actually the Name field
  "Unnamed: 1": string | null; // Subitems
  "Unnamed: 2": string | null; // 1.Bestill antall
  "Unnamed: 3": string | null; // 2.Velg prioritet
  "Unnamed: 4": string | null; // 3.Klikk her
  "Unnamed: 5": string | null; // Best.nr.
  "Unnamed: 6": string | null; // Leverandør
  "Unnamed: 7": string | null; // Valg leverandør
  "Unnamed: 8": string | null; // Produsent
  "Unnamed: 9": string | null; // Pris inkl. rabatt
  "Unnamed: 10": string | null; // % rabatt
  "Unnamed: 11": string | null; // Pris-sjekk Sign.
  "Unnamed: 12": string | null; // Prisavtale
  "Unnamed: 13": string | null; // Vurdering pris
  "Unnamed: 14": string | null; // Varetelling
  "Unnamed: 15": string | null; // Avd.
  "Unnamed: 16": string | null; // Kategori
  "Unnamed: 17": string | null; // Forpakning
  "Unnamed: 18": string | null; // Enhet per pk
  "Unnamed: 19": string | null; // Fastbestilling
  "Unnamed: 20": string | null; // Kartotek ID
  "Unnamed: 21": string | null; // Plassering
  "Unnamed: 22": string | null; // Link /vedlegg
  "Unnamed: 23": string | null; // Kommentar
  "Unnamed: 24": string | null; // Merking/Sertifikat
  "Unnamed: 25": string | null; // Sikkerhet*
  "Unnamed: 26": string | null; // EK ref.
  "Unnamed: 27": string | null; // Last Updated
}

interface VarekartotekData {
  varekartotek: VarekartotekItem[];
}

// Helper functions
function generateSKU(name: string, index: number): string {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
  return `${prefix}${String(index + 1).padStart(4, '0')}`
}

function parsePrice(priceString: string | null): number | null {
  if (!priceString || priceString.trim() === '' || priceString === '0') return null
  
  const cleaned = priceString
    .replace(/[^\d,.-]/g, '')
    .replace(',', '.')
  
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}

function parseDiscountPercentage(discountString: string | null): number | null {
  if (!discountString || discountString.trim() === '' || discountString === '?') return null
  
  const cleaned = discountString.replace(/[^\d,.-]/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}

function parseQuantityPerPackage(packageString: string | null): number | null {
  if (!packageString || packageString.trim() === '') return null
  
  const matches = packageString.match(/(\d+(?:[,.]?\d+)?)/g)
  if (matches && matches.length > 0) {
    const firstNumber = parseFloat(matches[0].replace(',', '.'))
    return isNaN(firstNumber) ? null : firstNumber
  }
  
  return null
}

function extractInitialsFromSignature(signature: string | null): string | null {
  if (!signature || signature.trim() === '') return null
  
  const match = signature.match(/([A-Z]{2,4})$/i)
  return match ? match[1].toUpperCase() : null
}

function parseSupplierRole(roleString: string | null): string | null {
  if (!roleString || roleString.trim() === '') return null
  
  const role = roleString.toLowerCase()
  if (role.includes('primær')) return 'Primær leverandør'
  if (role.includes('reserve')) return 'Reserve leverandør'
  if (role.includes('annet')) return 'Annet'
  if (role.includes('finnes billigere')) return 'Finnes Billigere'
  
  return roleString
}

function parseHMSCodes(safetyString: string | null): string | null {
  if (!safetyString || safetyString.trim() === '' || safetyString === 'n/a' || safetyString === 'ingen') {
    return null
  }
  
  return safetyString.trim()
}

function parseStandingOrder(fastbestillingString: string | null, leverandorString: string | null): string | null {
  if (!fastbestillingString || fastbestillingString.toLowerCase() === 'nei') return null
  
  if (fastbestillingString.toLowerCase() === 'ja' || fastbestillingString.toLowerCase().includes('fastbestilling')) {
    return leverandorString ? `Fastbestilling hos ${leverandorString}` : 'Fastbestilling'
  }
  
  if (leverandorString && fastbestillingString === leverandorString) {
    return `Fastbestilling hos ${leverandorString}`
  }
  
  return fastbestillingString
}

// Smart category mapping based on the actual data patterns
function mapCategoryName(kategori: string | null, avdeling: string | null): string {
  if (!kategori) return 'Forbruksvarer' // Default
  
  // Direct mappings for known categories
  const directMappings: { [key: string]: string } = {
    'HMS': 'HMS og Sikkerhet',
    'Gasser': 'Kjemikalier',
    'Medier / kjemikalier': 'Medier og Reagenser', 
    'Forbruksutstyr / kit': 'Forbruksvarer',
    'Vaskemiddel': 'Kjemikalier',
    'Utstyr / reservedeler': 'Utstyr og Instrumenter'
  }
  
  // Check direct mappings first
  if (directMappings[kategori]) {
    return directMappings[kategori]
  }
  
  // Smart inference based on category content
  const lowerKat = kategori.toLowerCase()
  
  if (lowerKat.includes('kjemikalier') || lowerKat.includes('chemical')) return 'Kjemikalier'
  if (lowerKat.includes('medier') || lowerKat.includes('media') || lowerKat.includes('agar')) return 'Medier og Reagenser'
  if (lowerKat.includes('utstyr') || lowerKat.includes('equipment') || lowerKat.includes('instrument')) return 'Utstyr og Instrumenter'
  if (lowerKat.includes('forbruk') || lowerKat.includes('consumable') || lowerKat.includes('kit')) return 'Forbruksvarer'
  if (lowerKat.includes('hms') || lowerKat.includes('safety') || lowerKat.includes('sikkerhet')) return 'HMS og Sikkerhet'
  
  // Return original if no mapping found
  return kategori
}

function mapDepartmentName(avd: string | null): string {
  if (!avd) return 'Mikrobiologi' // Default based on most items
  
  const mapping: { [key: string]: string } = {
    'Mikro': 'Mikrobiologi',
    'Kjemi': 'Kjemi'
  }
  
  return mapping[avd] || avd
}

function isValidItem(item: VarekartotekItem): boolean {
  // Skip header rows and empty rows
  if (!item.HMS || item.HMS === 'Name') return false
  
  // Skip rows that are just section headers or empty
  if (!item.HMS.trim() || item.HMS.trim().length < 2) return false
  
  // Skip rows that look like section dividers or group headers
  const name = item.HMS.toLowerCase()
  if (name.includes('mikro kjemikalier') || 
      name.includes('kjemi kjemikalier') ||
      name.includes('mikro utstyr') ||
      name === 'hms') return false
  
  return true
}

async function main() {
  console.log('🚀 Starting comprehensive import from VAREKARTOTEK JSON file...')
  
  try {
    // Read the JSON file
    const jsonPath = '/Users/eshaqrahmani/Desktop/Trainee/Labora-Digit/VAREKARTOTEK_1756284046.json'
    console.log(`📖 Reading JSON file: ${jsonPath}`)
    
    const rawData = fs.readFileSync(jsonPath, 'utf-8')
    const data: VarekartotekData = JSON.parse(rawData)
    
    console.log(`📊 Found ${data.varekartotek.length} total rows in JSON file`)
    
    // Filter valid items
    const validItems = data.varekartotek.filter(isValidItem)
    console.log(`📦 Found ${validItems.length} valid items to import`)
    
    // Get reference data
    const [departments, categories, locations, suppliers] = await Promise.all([
      prisma.department.findMany(),
      prisma.category.findMany(),
      prisma.location.findMany(),
      prisma.supplier.findMany()
    ])
    
    console.log(`📊 Database reference data: ${departments.length} departments, ${categories.length} categories, ${locations.length} locations, ${suppliers.length} suppliers`)
    
    let itemsCreated = 0
    let supplierItemsCreated = 0
    let locationsCreated = 0
    let suppliersCreated = 0
    let categoriesCreated = 0
    let departmentsCreated = 0
    let errors: string[] = []
    let skipped = 0
    
    // Process in batches to avoid overwhelming the database
    const batchSize = 50
    for (let batchStart = 0; batchStart < validItems.length; batchStart += batchSize) {
      const batch = validItems.slice(batchStart, batchStart + batchSize)
      const batchNumber = Math.floor(batchStart / batchSize) + 1
      const totalBatches = Math.ceil(validItems.length / batchSize)
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (items ${batchStart + 1}-${Math.min(batchStart + batchSize, validItems.length)})`)
      
      for (let i = 0; i < batch.length; i++) {
        const itemData = batch[i]
        const globalIndex = batchStart + i
        
        try {
          // Extract data using the mapped field names
          const name = itemData.HMS?.trim()
          const bestNr = itemData["Unnamed: 5"]?.trim() || null
          const leverandor = itemData["Unnamed: 6"]?.trim() || null
          const valgLeverandor = itemData["Unnamed: 7"]?.trim() || null
          const produsent = itemData["Unnamed: 8"]?.trim() || null
          const prisInklRabatt = itemData["Unnamed: 9"]?.trim() || null
          const prosentRabatt = itemData["Unnamed: 10"]?.trim() || null
          const prisSjekkSign = itemData["Unnamed: 11"]?.trim() || null
          const prisavtale = itemData["Unnamed: 12"]?.trim() || null
          const vurderingPris = itemData["Unnamed: 13"]?.trim() || null
          const avd = itemData["Unnamed: 15"]?.trim() || null
          const kategori = itemData["Unnamed: 16"]?.trim() || null
          const forpakning = itemData["Unnamed: 17"]?.trim() || null
          const enhetPerPk = itemData["Unnamed: 18"]?.trim() || null
          const fastbestilling = itemData["Unnamed: 19"]?.trim() || null
          const kartotekId = itemData["Unnamed: 20"]?.trim() || null
          const plassering = itemData["Unnamed: 21"]?.trim() || null
          const kommentar = itemData["Unnamed: 23"]?.trim() || null
          const merkingSertifikat = itemData["Unnamed: 24"]?.trim() || null
          const sikkerhet = itemData["Unnamed: 25"]?.trim() || null
          
          if (!name || name.length < 2) {
            skipped++
            continue
          }
          
          console.log(`  📦 Processing: ${name}`)
          
          // Find or create department
          const mappedDeptName = mapDepartmentName(avd)
          let department = departments.find(d => 
            d.name.toLowerCase().includes(mappedDeptName.toLowerCase())
          )
          
          if (!department) {
            department = await prisma.department.create({
              data: {
                name: mappedDeptName,
                code: mappedDeptName.substring(0, 5).toUpperCase()
              }
            })
            departments.push(department)
            departmentsCreated++
            console.log(`    ➕ Created department: ${department.name}`)
          }
          
          // Find or create category
          const mappedCatName = mapCategoryName(kategori, avd)
          let category = categories.find(c => 
            c.name.toLowerCase().includes(mappedCatName.toLowerCase()) ||
            mappedCatName.toLowerCase().includes(c.name.toLowerCase())
          )
          
          if (!category) {
            category = await prisma.category.create({
              data: {
                name: mappedCatName,
                code: mappedCatName.substring(0, 8).toUpperCase().replace(/[^A-Z]/g, ''),
                description: `${mappedCatName} - Automatisk opprettet fra varekartotek`
              }
            })
            categories.push(category)
            categoriesCreated++
            console.log(`    ➕ Created category: ${category.name}`)
          }
          
          // Find or create location
          let location = null
          if (plassering && plassering.trim() !== '') {
            location = locations.find(l => 
              l.name.toLowerCase().includes(plassering.toLowerCase()) ||
              plassering.toLowerCase().includes(l.name.toLowerCase())
            )
            if (!location) {
              location = await prisma.location.create({
                data: {
                  name: plassering,
                  notes: `Lokasjon: ${plassering}`
                }
              })
              locations.push(location)
              locationsCreated++
              console.log(`    ➕ Created location: ${location.name}`)
            }
          }
          
          // Generate SKU
          const sku = generateSKU(name, globalIndex)
          
          // Parse data
          const hmsCodes = parseHMSCodes(sikkerhet)
          const standingOrderDetails = parseStandingOrder(fastbestilling, leverandor)
          const salesPrice = parsePrice(prisInklRabatt)
          
          // Create Item
          const item = await prisma.item.create({
            data: {
              sku,
              name,
              manufacturer: produsent || null,
              departmentId: department.id,
              categoryId: category.id,
              defaultLocationId: location?.id || null,
              unit: 'UNIT',
              orderUnit: 'PACK',
              conversionFactor: parseQuantityPerPackage(enhetPerPk || forpakning) || 1,
              minStock: 10,
              maxStock: 100,
              salesPrice: salesPrice ? new Decimal(salesPrice) : null,
              currency: 'NOK',
              hazardous: hmsCodes !== null,
              expiryTracking: kategori?.toLowerCase().includes('medier') || kategori?.toLowerCase().includes('kjemikalier') || false,
              requiresLotNumber: kategori?.toLowerCase().includes('medier') || kategori?.toLowerCase().includes('kjemikalier') || false,
              externalId: kartotekId,
              hmsCodes,
              certificationInfo: merkingSertifikat || null,
              internalReference: null,
              standingOrderDetails,
              notes: [kommentar, merkingSertifikat].filter(Boolean).join('; ') || null
            }
          })
          
          itemsCreated++
          console.log(`    ✅ Created item: ${item.name} (SKU: ${item.sku})`)
          
          // Create SupplierItem if supplier data exists
          if (leverandor && leverandor.trim() !== '') {
            // Find or create supplier
            let supplier = suppliers.find(s => 
              s.name.toLowerCase().includes(leverandor.toLowerCase()) ||
              leverandor.toLowerCase().includes(s.name.toLowerCase())
            )
            
            if (!supplier) {
              supplier = await prisma.supplier.create({
                data: {
                  name: leverandor,
                  orderMethod: 'Web',
                  notes: `Automatisk opprettet for vare: ${name}`
                }
              })
              suppliers.push(supplier)
              suppliersCreated++
              console.log(`    ➕ Created supplier: ${supplier.name}`)
            }
            
            // Create SupplierItem
            try {
              const supplierItem = await prisma.supplierItem.create({
                data: {
                  itemId: item.id,
                  supplierId: supplier.id,
                  supplierPartNumber: bestNr,
                  listPrice: salesPrice ? new Decimal(salesPrice) : null,
                  negotiatedPrice: salesPrice ? new Decimal(salesPrice) : null,
                  currency: 'NOK',
                  agreementReference: prisavtale,
                  packageDescription: forpakning,
                  quantityPerPackage: parseQuantityPerPackage(enhetPerPk || forpakning) ? new Decimal(parseQuantityPerPackage(enhetPerPk || forpakning)!) : null,
                  discountPercentage: parseDiscountPercentage(prosentRabatt) ? new Decimal(parseDiscountPercentage(prosentRabatt)!) : null,
                  priceEvaluationStatus: vurderingPris,
                  lastVerifiedBy: extractInitialsFromSignature(prisSjekkSign),
                  supplierRole: parseSupplierRole(valgLeverandor),
                  isPrimarySupplier: valgLeverandor?.toLowerCase().includes('primær') || false,
                  minimumOrderQty: 1,
                  packSize: parseQuantityPerPackage(enhetPerPk || forpakning) || 1
                }
              })
              
              supplierItemsCreated++
              console.log(`    ✅ Created supplier item for: ${supplier.name}`)
            } catch (supplierError) {
              console.log(`    ⚠️  Could not create supplier item: ${supplierError}`)
            }
          }
          
        } catch (error) {
          const errorMsg = `Error processing item ${itemData.HMS}: ${error}`
          errors.push(errorMsg)
          console.error(`    ❌ ${errorMsg}`)
        }
      }
      
      // Small delay between batches to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Progress update
      const progress = Math.round(((batchStart + batch.length) / validItems.length) * 100)
      console.log(`📊 Progress: ${progress}% (${batchStart + batch.length}/${validItems.length})`)
    }
    
    console.log('\n🎉 Labora Varekartotek Import completed!')
    console.log(`📊 Final Summary:`)
    console.log(`  - Items created: ${itemsCreated}`)
    console.log(`  - Supplier items created: ${supplierItemsCreated}`)
    console.log(`  - New departments created: ${departmentsCreated}`)
    console.log(`  - New categories created: ${categoriesCreated}`)
    console.log(`  - New locations created: ${locationsCreated}`)
    console.log(`  - New suppliers created: ${suppliersCreated}`)
    console.log(`  - Items skipped: ${skipped}`)
    console.log(`  - Errors: ${errors.length}`)
    
    if (errors.length > 0) {
      console.log('\n❌ Sample errors encountered:')
      errors.slice(0, 5).forEach(error => console.log(`  - ${error}`))
      if (errors.length > 5) {
        console.log(`  ... and ${errors.length - 5} more errors`)
      }
    }
    
    // Show categorization summary
    console.log('\n📊 Items by Department and Category:')
    const summary = await prisma.item.findMany({
      include: {
        department: { select: { name: true } },
        category: { select: { name: true } }
      }
    })
    
    const grouped = summary.reduce((acc, item) => {
      const dept = item.department?.name || 'Ingen avdeling'
      const cat = item.category?.name || 'Ingen kategori'
      const key = `${dept} - ${cat}`
      if (!acc[key]) acc[key] = 0
      acc[key]++
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(grouped)
      .sort(([,a], [,b]) => b - a)
      .forEach(([key, count]) => {
        console.log(`  ${key}: ${count} varer`)
      })
    
  } catch (error) {
    console.error('💥 Fatal error during JSON import:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)
