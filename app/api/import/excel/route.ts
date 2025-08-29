import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// Category mapping based on item names and keywords
function categorizeItem(itemName: string, department?: string): string {
  const name = itemName.toLowerCase()
  const dept = department?.toLowerCase() || ''
  
  // HMS/Safety keywords
  if (name.includes('hms') || name.includes('safety') || name.includes('sikkerhet') || 
      name.includes('verneutstyr') || name.includes('hansker') || name.includes('briller') ||
      dept.includes('hms')) {
    return 'HMS'
  }
  
  // Chemistry keywords
  if (name.includes('kjemi') || name.includes('chemical') || name.includes('reagens') ||
      name.includes('buffer') || name.includes('acid') || name.includes('base') ||
      dept.includes('kjemi')) {
    return 'KJEMI'
  }
  
  // Fish health keywords
  if (name.includes('fisk') || name.includes('fish') || name.includes('helse') ||
      name.includes('health') || name.includes('vaccine') || name.includes('medisin') ||
      dept.includes('fiskehelse')) {
    return 'FISKEHELSE'
  }
  
  // Cryo/freezing keywords
  if (name.includes('kryo') || name.includes('cryo') || name.includes('frys') ||
      name.includes('freeze') || name.includes('nitrogen') || dept.includes('kryo')) {
    return 'KRYO'
  }
  
  // Reception/sampling keywords
  if (name.includes('mottak') || name.includes('prøve') || name.includes('sample') ||
      name.includes('reception') || dept.includes('mottak')) {
    return 'MOTTAK'
  }
  
  // Microbiology keywords
  if (name.includes('mikro') || name.includes('micro') || name.includes('bakterie') ||
      name.includes('bacteria') || name.includes('kultur') || name.includes('medium') ||
      dept.includes('mikro')) {
    return 'MIKRO'
  }
  
  // IT keywords
  if (name.includes('data') || name.includes('computer') || name.includes('software') ||
      name.includes('hardware') || name.includes('it') || dept.includes('it')) {
    return 'IT'
  }
  
  // Administration keywords
  if (name.includes('admin') || name.includes('kontor') || name.includes('office') ||
      name.includes('papir') || name.includes('paper') || dept.includes('admin')) {
    return 'ADMINISTRASJON'
  }
  
  // Common/shared keywords
  if (name.includes('felles') || name.includes('common') || name.includes('shared') ||
      dept.includes('felles')) {
    return 'FELLES'
  }
  
  return 'ANNET'
}

// Clean and format item names
function cleanItemName(rawName: string): string {
  return rawName
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-æøåÆØÅ()]/g, '')
    .substring(0, 200) // Limit length
}

// Generate professional SKU
function generateSKU(itemName: string, category: string, index: number): string {
  const categoryPrefix = category.substring(0, 3)
  const nameWords = itemName.split(' ').slice(0, 2).join('').substring(0, 8).toUpperCase()
  const indexSuffix = index.toString().padStart(3, '0')
  return `${categoryPrefix}-${nameWords}-${indexSuffix}`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    if (data.length < 2) {
      return Response.json({ error: 'Excel file must have at least a header row and one data row' }, { status: 400 })
    }

    const results = {
      suppliers: 0,
      locations: 0,
      items: 0,
      errors: [] as string[]
    }

    // Process data in transaction
    await prisma.$transaction(async (tx) => {
      const supplierMap = new Map<string, string>()
      const locationMap = new Map<string, string>()

      // Skip header row, process each data row
      for (let i = 1; i < data.length; i++) {
        const row = data[i]
        if (!row || row.length < 3) continue

        try {
          const rawItemName = row[0]?.toString()?.trim()
          const supplierName = row[1]?.toString()?.trim()
          const locationName = row[2]?.toString()?.trim()
          const minStock = parseInt(row[3]?.toString() || '0') || 0
          const department = row[4]?.toString()?.trim() // Optional department column
          const productNumber = row[5]?.toString()?.trim() // Optional product number
          const description = row[6]?.toString()?.trim() // Optional description

          if (!rawItemName) {
            results.errors.push(`Row ${i + 1}: Missing item name`)
            continue
          }

          // Clean and process item name
          const itemName = cleanItemName(rawItemName)
          const category = categorizeItem(itemName, department)
          const sku = generateSKU(itemName, category, i)

          // Create or find supplier with enhanced data
          let supplierId: string | null = null
          if (supplierName && !supplierMap.has(supplierName)) {
            let supplier = await tx.supplier.findFirst({
              where: { name: supplierName }
            })
            if (!supplier) {
              const shortCode = supplierName
                .split(' ')
                .map(word => word.charAt(0).toUpperCase())
                .join('')
                .substring(0, 5)
              
              supplier = await tx.supplier.create({
                data: { 
                  name: supplierName,
                  shortCode: shortCode
                }
              })
              results.suppliers++
            }
            supplierMap.set(supplierName, supplier.id)
          }
          if (supplierName) {
            supplierId = supplierMap.get(supplierName) || null
          }

          // Create or find location with enhanced data
          let locationId: string | null = null
          if (locationName && !locationMap.has(locationName)) {
            let location = await tx.location.findFirst({
              where: { name: locationName }
            })
            if (!location) {
              const locationType = locationName.toLowerCase().includes('kjøl') || locationName.toLowerCase().includes('cold') ? 'COLD' :
                                 locationName.toLowerCase().includes('fjern') || locationName.toLowerCase().includes('remote') ? 'REMOTE' : 'MAIN'
              
              const code = locationName
                .replace(/[^a-zA-Z0-9]/g, '')
                .toUpperCase()
                .substring(0, 10)
              
              location = await tx.location.create({
                data: { 
                  name: locationName, 
                  type: locationType,
                  code: code
                }
              })
              results.locations++
            }
            locationMap.set(locationName, location.id)
          }
          if (locationName) {
            locationId = locationMap.get(locationName) || null
          }

          // Determine if item needs expiry tracking or is hazardous
          const needsExpiryTracking = itemName.toLowerCase().includes('vaccine') || 
                                    itemName.toLowerCase().includes('medisin') ||
                                    itemName.toLowerCase().includes('reagens') ||
                                    category === 'FISKEHELSE' || category === 'KJEMI'
          
          const isHazardous = itemName.toLowerCase().includes('acid') ||
                            itemName.toLowerCase().includes('base') ||
                            itemName.toLowerCase().includes('toxic') ||
                            itemName.toLowerCase().includes('farlig')

          // Create item with professional categorization
          await tx.item.upsert({
            where: { sku },
            create: {
              sku,
              name: itemName,
              description: description || null,
              category: category as any,
              department: department || null,
              minStock,
              supplierId,
              unit: 'UNIT',
              // productNumber moved to SupplierItem model
              expiryTracking: needsExpiryTracking,
              hazardous: isHazardous,
              currency: 'NOK'
            },
            update: {
              name: itemName,
              description: description || null,
              category: category as any,
              department: department || null,
              minStock,
              supplierId,
              // productNumber moved to SupplierItem model
              expiryTracking: needsExpiryTracking,
              hazardous: isHazardous
            }
          })
          results.items++

          // Create initial inventory lot if location specified
          if (locationId && minStock > 0) {
            const item = await tx.item.findUnique({ where: { sku } })
            if (item) {
              // Check if inventory lot exists for this item/location combo
              const existingLot = await tx.inventoryLot.findFirst({
                where: {
                  itemId: item.id,
                  locationId: locationId,
                  lotNumber: null,
                  expiryDate: null
                }
              })

              if (existingLot) {
                await tx.inventoryLot.update({
                  where: { id: existingLot.id },
                  data: {
                    quantity: existingLot.quantity + minStock
                  }
                })
              } else {
                await tx.inventoryLot.create({
                  data: {
                    itemId: item.id,
                    locationId: locationId,
                    quantity: minStock,
                    lotNumber: null,
                    expiryDate: null
                  }
                })
              }
            }
          }

        } catch (error) {
          results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    })

    return Response.json({
      success: true,
      message: `Import completed: ${results.items} items, ${results.suppliers} suppliers, ${results.locations} locations`,
      results
    })

  } catch (error) {
    console.error('Excel import error:', error)
    return Response.json(
      { error: 'Failed to import Excel file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
