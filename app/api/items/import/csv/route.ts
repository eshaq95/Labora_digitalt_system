import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// CSV column mapping from VAREKARTOTEK.csv
const CSV_COLUMN_MAPPING = {
  // Core identification (Item model)
  'Kartotek ID': '_externalId',
  'Name': 'name',
  'Produsent': 'manufacturer',
  'Kommentar': 'notes',
  'Sikkerhet*': 'hmsCodes',
  'Merking/Sertifikat': 'certificationInfo',
  'EK ref.': 'internalReference',
  
  // Categorization (requires lookup)
  'Avd.': '_department',
  'Kategori': '_category', 
  'Plassering': '_location',
  
  // Supplier-specific data (SupplierItem model)
  'Leverandør': '_supplier',
  'Best.nr.': 'supplierPartNumber',
  'Pris inkl. rabatt': '_price',
  'Pris-sjekk Sign.': 'priceCheckSignature',
  'Prisavtale': 'agreementReference',
  '% rabatt': '_discountPercentage',        // OPPDATERT: Parse som prosent
  'Forpakning': 'packageDescription',
  'Enhet per pk': '_quantityPerPackage',
  'Link /vedlegg': 'productUrl',
  'Vurdering pris': 'priceEvaluationStatus', // NY: Ikke ignorer lenger
  'Valg leverandør': '_supplierRole',        // NY: Parse leverandørrolle
  
  // Item-specific data (Item model)
  'Fastbestilling': 'standingOrderDetails', // NY: Ikke ignorer lenger
  
  // Workflow columns to IGNORE (these belong in ordering system, not master data)
  '1.Bestill antall': null,
  '2.Velg prioritet': null,
  '3.Klikk her': null,
  'Varetelling': null,
  'Subitems': null,
  'Last Updated': null
}

// Helper functions for data transformation
function cleanPrice(priceString: string): number | null {
  if (!priceString || typeof priceString !== 'string') return null
  
  // Remove currency symbols, spaces, and convert comma to dot
  const cleaned = priceString
    .replace(/[^\d,.-]/g, '')  // Keep only digits, comma, dot, minus
    .replace(',', '.')         // Convert comma to dot
    .trim()
  
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) || parsed <= 0 ? null : parsed
}

function cleanQuantity(quantityString: string): number | null {
  if (!quantityString || typeof quantityString !== 'string') return null
  
  // Extract number from strings like "10 stk", "5stk/eske", etc.
  const match = quantityString.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return null
  
  const cleaned = match[1].replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) || parsed <= 0 ? null : parsed
}

function parseDate(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') return null
  
  // Try to parse various date formats like "18.06.25 ILK"
  const dateMatch = dateString.match(/(\d{2})\.(\d{2})\.(\d{2})/)
  if (dateMatch) {
    const [, day, month, year] = dateMatch
    // Assume 20xx for two-digit years
    const fullYear = parseInt(year) + 2000
    return new Date(fullYear, parseInt(month) - 1, parseInt(day))
  }
  
  return null
}

function parseDiscountPercentage(discountString: string): number | null {
  if (!discountString || typeof discountString !== 'string') return null
  
  // Parse strings like "30 %", "38,12 %", "?" 
  const cleaned = discountString.replace(/[^\d,.-]/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  
  if (isNaN(parsed) || parsed < 0 || parsed > 100) return null
  return parsed
}

function parseSupplierRole(roleString: string): string {
  if (!roleString || typeof roleString !== 'string') return 'PRIMARY'
  
  const cleaned = roleString.toLowerCase().trim()
  if (cleaned.includes('primær') || cleaned.includes('primary')) return 'PRIMARY'
  if (cleaned.includes('reserve') || cleaned.includes('secondary')) return 'SECONDARY'
  if (cleaned.includes('backup')) return 'BACKUP'
  
  return 'PRIMARY' // Default
}

function extractInitialsFromSignature(signature: string): string | null {
  if (!signature || typeof signature !== 'string') return null
  
  // Extract initials from strings like "18.06.25 ILK"
  const initialsMatch = signature.match(/[A-Z]{2,4}$/)
  return initialsMatch ? initialsMatch[0] : null
}

function generateSKU(name: string, manufacturer?: string): string {
  // Generate SKU from name and manufacturer
  const namePart = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 8)
    .toUpperCase()
  
  const mfgPart = manufacturer
    ? manufacturer.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()
    : ''
  
  const timestamp = Date.now().toString().slice(-4)
  
  return `${namePart}${mfgPart}${timestamp}`
}

async function findOrCreateDepartment(departmentName: string): Promise<string | null> {
  if (!departmentName || typeof departmentName !== 'string') return null
  
  const cleaned = departmentName.trim()
  if (!cleaned) return null
  
  // Try to find existing department by name (case insensitive)
  let department = await prisma.department.findFirst({
    where: {
      name: {
        equals: cleaned,
        mode: 'insensitive'
      }
    }
  })
  
  if (!department) {
    // Create new department with generated code
    const code = cleaned.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase()
    try {
      department = await prisma.department.create({
        data: {
          name: cleaned,
          code: code + '_' + Date.now().toString().slice(-4) // Ensure uniqueness
        }
      })
    } catch (error) {
      console.warn(`Could not create department: ${cleaned}`, error)
      return null
    }
  }
  
  return department.id
}

async function findOrCreateCategory(categoryName: string): Promise<string | null> {
  if (!categoryName || typeof categoryName !== 'string') return null
  
  const cleaned = categoryName.trim()
  if (!cleaned) return null
  
  // Try to find existing category by name (case insensitive)
  let category = await prisma.category.findFirst({
    where: {
      name: {
        equals: cleaned,
        mode: 'insensitive'
      }
    }
  })
  
  if (!category) {
    // Create new category with generated code
    const code = cleaned.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase()
    try {
      category = await prisma.category.create({
        data: {
          name: cleaned,
          code: code + '_' + Date.now().toString().slice(-4), // Ensure uniqueness
          description: `Auto-created from CSV import: ${cleaned}`
        }
      })
    } catch (error) {
      console.warn(`Could not create category: ${cleaned}`, error)
      return null
    }
  }
  
  return category.id
}

async function findOrCreateLocation(locationName: string): Promise<string | null> {
  if (!locationName || typeof locationName !== 'string') return null
  
  const cleaned = locationName.trim()
  if (!cleaned) return null
  
  // Try to find existing location by name (case insensitive)
  let location = await prisma.location.findFirst({
    where: {
      name: {
        equals: cleaned,
        mode: 'insensitive'
      }
    }
  })
  
  if (!location) {
    // Create new location
    const code = cleaned.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase()
    try {
      location = await prisma.location.create({
        data: {
          name: cleaned,
          code: code + '_' + Date.now().toString().slice(-4), // Ensure uniqueness
          type: 'OTHER' // Default type
        }
      })
    } catch (error) {
      console.warn(`Could not create location: ${cleaned}`, error)
      return null
    }
  }
  
  return location.id
}

async function findSupplier(supplierName: string): Promise<string | null> {
  if (!supplierName || typeof supplierName !== 'string') return null
  
  const cleaned = supplierName.trim()
  if (!cleaned) return null
  
  // Try to find existing supplier by name (case insensitive)
  const supplier = await prisma.supplier.findFirst({
    where: {
      name: {
        equals: cleaned,
        mode: 'insensitive'
      }
    }
  })
  
  return supplier?.id || null
}

function processItemRow(row: any): { itemData: any; supplierItemData: any; errors: string[] } {
  const errors: string[] = []
  
  // Skip empty rows or section headers
  if (!row.name || typeof row.name !== 'string' || !row.name.trim()) {
    throw new Error('Missing item name')
  }
  
  const name = row.name.trim()
  
  // Skip section headers like "HMS", "Mikro utstyr", etc.
  if (name.length < 3 || 
      name.toLowerCase().includes('utstyr') ||
      name.toLowerCase().includes('avdeling') ||
      ['hms', 'mikro', 'kjemi'].includes(name.toLowerCase())) {
    throw new Error('Section header or invalid name')
  }
  
  // Process Item data
  const itemData = {
    name,
    manufacturer: row.manufacturer?.trim() || null,
    notes: row.notes?.trim() || null,
    hmsCodes: row.hmsCodes?.trim() || null,
    certificationInfo: row.certificationInfo?.trim() || null,
    internalReference: row.internalReference?.trim() || null,
    externalId: row._externalId?.trim() || null,
    // NY: Fastbestilling
    standingOrderDetails: row.standingOrderDetails?.trim() || null,
    // SKU will be generated if not provided
    sku: generateSKU(name, row.manufacturer),
    // Relations will be set after lookup
    departmentId: null,
    categoryId: null,
    defaultLocationId: null,
  }
  
  // Process SupplierItem data
  const supplierItemData = {
    supplierPartNumber: row.supplierPartNumber?.trim() || null,
    negotiatedPrice: cleanPrice(row._price),
    priceCheckSignature: row.priceCheckSignature?.trim() || null,
    agreementReference: row.agreementReference?.trim() || null,
    discountNotes: row.discountNotes?.trim() || null,
    packageDescription: row.packageDescription?.trim() || null,
    quantityPerPackage: cleanQuantity(row._quantityPerPackage),
    productUrl: row.productUrl?.trim() || null,
    lastVerifiedDate: parseDate(row.priceCheckSignature || '') || new Date(),
    // NYE FELTER:
    discountPercentage: parseDiscountPercentage(row._discountPercentage),
    priceEvaluationStatus: row.priceEvaluationStatus?.trim() || null,
    lastVerifiedBy: extractInitialsFromSignature(row.priceCheckSignature || ''),
    supplierRole: parseSupplierRole(row._supplierRole || ''),
    // Relations will be set after lookup
    supplierId: null,
  }
  
  // Validation
  if (!supplierItemData.supplierPartNumber && !supplierItemData.negotiatedPrice) {
    errors.push('Missing both supplier part number and price')
  }
  
  return { itemData, supplierItemData, errors }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return Response.json({ error: 'Ingen fil lastet opp' }, { status: 400 })
    }
    
    // Read file content
    const buffer = Buffer.from(await file.arrayBuffer())
    let workbook: XLSX.WorkBook
    
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' })
    } catch (error) {
      return Response.json({ error: 'Ugyldig fil format. Kun Excel (.xlsx) og CSV (.csv) er støttet.' }, { status: 400 })
    }
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    if (rawData.length < 2) {
      return Response.json({ error: 'Filen må inneholde minst en header-rad og en data-rad' }, { status: 400 })
    }
    
    // Find header row (first row with required columns)
    let headerRowIndex = -1
    let headers: string[] = []
    
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i]
      if (row && row.some((cell: any) => 
        typeof cell === 'string' && 
        (cell.trim() === 'Name' || cell.trim() === 'Kartotek ID')
      )) {
        headerRowIndex = i
        headers = row.map((cell: any) => cell?.toString().trim() || '')
        break
      }
    }
    
    if (headerRowIndex === -1) {
      return Response.json({ 
        error: 'Kunne ikke finne header-rad med "Name" eller "Kartotek ID" kolonne' 
      }, { status: 400 })
    }
    
    // Process data rows
    const dataRows = rawData.slice(headerRowIndex + 1)
    const processedItems: any[] = []
    const errors: string[] = []
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      if (!row || row.length === 0) continue
      
      try {
        // Convert array to object using headers
        const rowObject: any = {}
        headers.forEach((header, index) => {
          const mappedField = CSV_COLUMN_MAPPING[header as keyof typeof CSV_COLUMN_MAPPING]
          if (mappedField !== null && mappedField !== undefined) {
            rowObject[mappedField] = row[index]
          }
        })
        
        const processedItem = processItemRow(rowObject)
        if (processedItem) {
          // Add row metadata
          const extendedItem = {
            ...processedItem,
            rowIndex: i + headerRowIndex + 2,
            supplierName: rowObject._supplier,
            departmentName: rowObject._department,
            categoryName: rowObject._category,
            locationName: rowObject._location
          }
          processedItems.push(extendedItem)
        }
      } catch (error: any) {
        errors.push(`Rad ${i + headerRowIndex + 2}: ${error.message}`)
      }
    }
    
    if (processedItems.length === 0) {
      return Response.json({ 
        error: 'Ingen gyldige varer funnet i filen',
        details: errors
      }, { status: 400 })
    }
    
    // Import to database
    const results = {
      itemsCreated: 0,
      itemsUpdated: 0,
      supplierItemsCreated: 0,
      supplierItemsUpdated: 0,
      errors: [...errors]
    }
    
    for (const processedItem of processedItems) {
      try {
        const { itemData, supplierItemData, rowIndex, supplierName, departmentName, categoryName, locationName } = processedItem
        
        // Lookup/create related entities
        if (departmentName) {
          itemData.departmentId = await findOrCreateDepartment(departmentName)
        }
        if (categoryName) {
          itemData.categoryId = await findOrCreateCategory(categoryName)
        }
        if (locationName) {
          itemData.defaultLocationId = await findOrCreateLocation(locationName)
        }
        if (supplierName) {
          supplierItemData.supplierId = await findSupplier(supplierName)
          if (!supplierItemData.supplierId) {
            results.errors.push(`Rad ${rowIndex}: Leverandør "${supplierName}" ikke funnet`)
            continue
          }
        }
        
        // Create/update Item
        let item
        if (itemData.externalId) {
          // Try to find by external ID first
          const existing = await prisma.item.findUnique({
            where: { externalId: itemData.externalId }
          })
          
          if (existing) {
            item = await prisma.item.update({
              where: { id: existing.id },
              data: itemData
            })
            results.itemsUpdated++
          } else {
            item = await prisma.item.create({ data: itemData })
            results.itemsCreated++
          }
        } else {
          // Try to find by name and manufacturer
          const existing = await prisma.item.findFirst({
            where: {
              name: itemData.name,
              manufacturer: itemData.manufacturer
            }
          })
          
          if (existing) {
            item = await prisma.item.update({
              where: { id: existing.id },
              data: itemData
            })
            results.itemsUpdated++
          } else {
            item = await prisma.item.create({ data: itemData })
            results.itemsCreated++
          }
        }
        
        // Create/update SupplierItem if we have supplier data
        if (supplierItemData.supplierId && (supplierItemData.supplierPartNumber || supplierItemData.negotiatedPrice)) {
          supplierItemData.itemId = item.id
          
          const existingSupplierItem = await prisma.supplierItem.findUnique({
            where: {
              itemId_supplierId: {
                itemId: item.id,
                supplierId: supplierItemData.supplierId
              }
            }
          })
          
          if (existingSupplierItem) {
            await prisma.supplierItem.update({
              where: { id: existingSupplierItem.id },
              data: supplierItemData
            })
            results.supplierItemsUpdated++
          } else {
            await prisma.supplierItem.create({ data: supplierItemData })
            results.supplierItemsCreated++
          }
        }
        
      } catch (error: any) {
        results.errors.push(`Rad ${processedItem.rowIndex}: ${error.message}`)
      }
    }
    
    return Response.json({
      success: true,
      message: `Import fullført: ${results.itemsCreated} varer opprettet, ${results.itemsUpdated} varer oppdatert, ${results.supplierItemsCreated} leverandørpriser opprettet, ${results.supplierItemsUpdated} leverandørpriser oppdatert`,
      details: results
    })
    
  } catch (error: any) {
    console.error('CSV import error:', error)
    return Response.json({ 
      error: 'Feil under import av CSV-fil',
      details: error.message 
    }, { status: 500 })
  }
}
