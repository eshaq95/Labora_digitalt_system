import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as readline from 'readline'

const prisma = new PrismaClient()

// Mapping av avdelinger fra CSV til vårt system
const departmentMapping: Record<string, string> = {
  'Mikro': 'MIKRO',
  'Kjemi': 'KJEMI',
  'M/K': 'MIKRO_KJEMI',
  'Felles': 'FELLES',
  'Fiskehelse': 'FISKEHELSE'
}

// Mapping av kategorier fra CSV til vårt system
const categoryMapping: Record<string, string> = {
  'HMS': 'HMS',
  'Utstyr / reservedeler': 'UTSTYR',
  'Medier / kjemikalier': 'KJEMIKALIER',
  'Gasser': 'GASSER',
  'Arbeidsklær': 'ARBEIDSKLÆR',
  'Kontor/forbruk': 'KONTOR',
  'Lab / prøvetakingsutstyr': 'LAB_UTSTYR',
  'Fiskehelse varekartotek': 'FISKEHELSE'
}

interface CSVRow {
  Name: string
  'Best.nr.': string
  'Leverandør': string
  'Produsent': string
  'Pris inkl. rabatt': string
  'Avd.': string
  'Kategori': string
  'Forpakning': string
  'Enhet per pk': string
  'Kartotek ID': string
  'Plassering': string
  'Kommentar': string
  'Merking/Sertifikat': string
  'Sikkerhet*': string
  'EK ref.': string
  '% rabatt': string
  'Prisavtale': string
  'Vurdering pris': string
}

async function createDepartmentsAndCategories() {
  console.log('Oppretter avdelinger og kategorier...')
  
  // Opprett avdelinger
  const departments = [
    { code: 'MIKRO', name: 'Mikrobiologi' },
    { code: 'KJEMI', name: 'Kjemi' },
    { code: 'MIKRO_KJEMI', name: 'Mikro/Kjemi' },
    { code: 'FELLES', name: 'Felles' },
    { code: 'FISKEHELSE', name: 'Fiskehelse' }
  ]
  
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept
    })
  }
  
  // Opprett kategorier
  const categories = [
    { code: 'HMS', name: 'HMS', description: 'Helse, miljø og sikkerhet' },
    { code: 'UTSTYR', name: 'Utstyr og Instrumenter', description: 'Laboratorieutstyr og reservedeler' },
    { code: 'KJEMIKALIER', name: 'Medier / kjemikalier', description: 'Kjemikalier og medier' },
    { code: 'GASSER', name: 'Gasser', description: 'Industrielle gasser' },
    { code: 'ARBEIDSKLÆR', name: 'Arbeidsklær', description: 'Arbeidsklær og verneutstyr' },
    { code: 'KONTOR', name: 'Kontor/forbruk', description: 'Kontormateriell og forbruksvarer' },
    { code: 'LAB_UTSTYR', name: 'Lab / prøvetakingsutstyr', description: 'Laboratorie- og prøvetakingsutstyr' },
    { code: 'FISKEHELSE', name: 'Fiskehelse varekartotek', description: 'Fiskehelse spesifikke varer' }
  ]
  
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: {},
      create: cat
    })
  }
  
  console.log('✅ Avdelinger og kategorier opprettet')
}

async function findOrCreateSupplier(supplierName: string): Promise<string | null> {
  if (!supplierName || supplierName.trim() === '') return null
  
  const name = supplierName.trim()
  
  // Prøv å finne eksisterende leverandør
  let supplier = await prisma.supplier.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive'
      }
    }
  })
  
  if (!supplier) {
    // Opprett ny leverandør
    try {
      supplier = await prisma.supplier.create({
        data: {
          name,
          generalEmail: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
          phone: null,
          website: null,
          notes: `Auto-opprettet fra varekartotek import`
        }
      })
      console.log(`Opprettet ny leverandør: ${name}`)
    } catch (error) {
      console.warn(`Kunne ikke opprette leverandør: ${name}`, error)
      return null
    }
  }
  
  return supplier.id
}

function parsePrice(priceStr: string): number | null {
  if (!priceStr || priceStr.trim() === '') return null
  
  // Fjern komma og konverter til tall
  const cleanPrice = priceStr.replace(',', '.')
  const price = parseFloat(cleanPrice)
  return isNaN(price) ? null : price
}

function parseDiscount(discountStr: string): number | null {
  if (!discountStr || discountStr.trim() === '') return null
  
  // Parse prosent-strenger som "25%" eller "25"
  const cleaned = discountStr.replace(/[^\d.,]/g, '').replace(',', '.')
  const discount = parseFloat(cleaned)
  return isNaN(discount) ? null : discount
}

function generateSKU(name: string, kartotekId: string): string {
  if (kartotekId && kartotekId.trim()) {
    // Bruk kartotek ID hvis tilgjengelig
    return kartotekId.trim().substring(0, 20)
  }
  
  // Generer SKU fra navn
  const words = name.trim().split(/\s+/).slice(0, 3)
  const acronym = words.map(word => word.substring(0, 3).toUpperCase()).join('')
  const timestamp = Date.now().toString().slice(-6)
  return `${acronym}${timestamp}`.substring(0, 20)
}

function mapHazardCodes(hazardStr: string): string | null {
  if (!hazardStr || hazardStr.trim() === '' || hazardStr.toLowerCase() === 'ingen') {
    return null
  }
  return hazardStr.trim()
}

async function importItemsWithSuppliers() {
  console.log('Starter import av varer med leverandører og priser...')
  
  const departments = await prisma.department.findMany()
  const categories = await prisma.category.findMany()
  
  const deptMap = new Map(departments.map(d => [d.code, d.id]))
  const catMap = new Map(categories.map(c => [c.code, c.id]))
  
  let imported = 0
  let skipped = 0
  let errors = 0
  let supplierItemsCreated = 0
  
  const fileStream = fs.createReadStream('VAREKARTOTEK_Full.csv')
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  
  const items: any[] = []
  
  for await (const line of rl) {
    // Hopp over tomme linjer og header-informasjon
    if (!line.trim() || 
        line.startsWith('VAREKARTOTEK') || 
        line.startsWith('"*') ||
        line.includes(';;;;;;;;;;;;;;;;;;;;;;;;') ||
        line.startsWith('Name;Subitems')) {
      continue
    }
    
    // Split på semikolon
    const columns = line.split(';')
    
    // Sjekk om dette er en vare-linje
    if (columns[0] && 
        columns[0].trim() !== '' && 
        !columns[0].includes(';;;;;;;;;;;;;;;;;;;;;;;') &&
        columns.length > 15) {
      
      const itemData = {
        Name: columns[0]?.trim(),
        'Best.nr.': columns[5]?.trim(),
        'Leverandør': columns[6]?.trim(),
        'Produsent': columns[8]?.trim(),
        'Pris inkl. rabatt': columns[9]?.trim(),
        '% rabatt': columns[10]?.trim(),
        'Prisavtale': columns[12]?.trim(),
        'Vurdering pris': columns[13]?.trim(),
        'Avd.': columns[15]?.trim(),
        'Kategori': columns[16]?.trim(),
        'Forpakning': columns[17]?.trim(),
        'Enhet per pk': columns[18]?.trim(),
        'Kartotek ID': columns[20]?.trim(),
        'Plassering': columns[21]?.trim(),
        'Kommentar': columns[23]?.trim(),
        'Merking/Sertifikat': columns[24]?.trim(),
        'Sikkerhet*': columns[25]?.trim(),
        'EK ref.': columns[26]?.trim()
      }
      
      // Kun legg til hvis det har et gyldig navn
      if (itemData.Name && itemData.Name !== 'Name') {
        items.push(itemData)
      }
    }
  }
  
  console.log(`Fant ${items.length} varer å importere`)
  
  for (const row of items) {
    try {
      const name = row.Name
      if (!name || name === '') {
        skipped++
        continue
      }
      
      // Mapp avdeling og kategori
      const deptCode = departmentMapping[row['Avd.']] || 'FELLES'
      const catCode = categoryMapping[row['Kategori']] || 'UTSTYR'
      
      const departmentId = deptMap.get(deptCode)
      const categoryId = catMap.get(catCode)
      
      if (!departmentId || !categoryId) {
        console.warn(`Kunne ikke finne avdeling eller kategori for: ${name} (Avd: "${row['Avd.']}", Kat: "${row['Kategori']}")`)
        errors++
        continue
      }
      
      // Generer SKU
      const sku = generateSKU(name, row['Kartotek ID'])
      
      // Parse pris
      const salesPrice = parsePrice(row['Pris inkl. rabatt'])
      
      // Parse HMS koder
      const hmsCodes = mapHazardCodes(row['Sikkerhet*'])
      
      // Sjekk om varen allerede eksisterer (basert på SKU)
      let item = await prisma.item.findUnique({
        where: { sku }
      })
      
      if (!item) {
        // Opprett varen
        item = await prisma.item.create({
          data: {
            sku,
            name,
            description: row['Kommentar'] || null,
            manufacturer: row['Produsent'] || null,
            externalId: row['Best.nr.'] || null,
            hmsCodes,
            certificationInfo: row['Merking/Sertifikat'] || null,
            internalReference: row['EK ref.'] || null,
            departmentId,
            categoryId,
            unit: 'UNIT',
            orderUnit: 'PACK',
            conversionFactor: parseInt(row['Enhet per pk']) || 1,
            contentPerPack: row['Forpakning'] || null,
            salesPrice,
            currency: 'NOK',
            minStock: 10,
            maxStock: 100,
            requiresLotNumber: false,
            expiryTracking: false,
            hazardous: !!hmsCodes,
            notes: row['Plassering'] || null
          }
        })
        imported++
      }
      
      // Håndter leverandør og priser
      if (row['Leverandør'] && row['Leverandør'].trim() !== '') {
        const supplierId = await findOrCreateSupplier(row['Leverandør'])
        
        if (supplierId) {
          // Sjekk om SupplierItem allerede eksisterer
          const existingSupplierItem = await prisma.supplierItem.findUnique({
            where: {
              itemId_supplierId: {
                itemId: item.id,
                supplierId: supplierId
              }
            }
          })
          
          if (!existingSupplierItem) {
            // Opprett SupplierItem med pris og andre detaljer
            await prisma.supplierItem.create({
              data: {
                itemId: item.id,
                supplierId: supplierId,
                supplierPartNumber: row['Best.nr.'] || 'N/A',
                negotiatedPrice: salesPrice || 0,
                currency: 'NOK',
                discountPercentage: parseDiscount(row['% rabatt']),
                agreementReference: row['Prisavtale'] || null,
                priceEvaluationStatus: row['Vurdering pris'] || null,
                packageDescription: row['Forpakning'] || null,
                quantityPerPackage: parseInt(row['Enhet per pk']) || 1,
                lastVerifiedDate: new Date(),
                isPrimarySupplier: true
              }
            })
            supplierItemsCreated++
          }
        }
      }
      
      if (imported % 50 === 0) {
        console.log(`Importert ${imported} varer, ${supplierItemsCreated} leverandør-koblinger...`)
      }
      
    } catch (error) {
      console.error(`Feil ved import av vare "${row.Name}":`, error)
      errors++
    }
  }
  
  console.log(`\n✅ Import fullført!`)
  console.log(`📊 Statistikk:`)
  console.log(`   - Importert: ${imported} varer`)
  console.log(`   - Leverandør-koblinger: ${supplierItemsCreated}`)
  console.log(`   - Hoppet over: ${skipped} varer`)
  console.log(`   - Feil: ${errors} varer`)
}

async function main() {
  try {
    console.log('🚀 Starter fullstendig import av VAREKARTOTEK_Full.csv')
    console.log('   - Varer med leverandører og priser')
    
    await createDepartmentsAndCategories()
    await importItemsWithSuppliers()
    
    // Vis statistikk
    const totalItems = await prisma.item.count()
    const totalSuppliers = await prisma.supplier.count()
    const totalSupplierItems = await prisma.supplierItem.count()
    
    console.log(`\n📈 Total oversikt:`)
    console.log(`   - ${totalItems} varer i systemet`)
    console.log(`   - ${totalSuppliers} leverandører i systemet`)
    console.log(`   - ${totalSupplierItems} leverandør-vare koblinger`)
    
  } catch (error) {
    console.error('❌ Feil under import:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
