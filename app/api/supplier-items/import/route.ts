import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'
import * as XLSX from 'xlsx'

// Expected columns for price list import
const PRICE_LIST_COLUMNS = {
  // Required fields
  'SKU': 'sku',
  'Varenavn': 'itemName',
  'Leverandør': 'supplierName',
  'Pris': 'negotiatedPrice',
  
  // Optional fields
  'Listepris': 'listPrice',
  'Avtale-referanse': 'agreementReference',
  'Rabattkode': 'discountCodeRequired',
  'Min. antall': 'minimumOrderQty',
  'Gyldig til': 'priceValidUntil',
  'Primær leverandør': 'isPrimarySupplier',
  'Sist verifisert': 'lastVerifiedDate',
  'Notater': 'notes'
}

function parseExcelDate(excelDate: any): Date | null {
  if (!excelDate) return null
  
  // If it's already a Date object
  if (excelDate instanceof Date) return excelDate
  
  // If it's a string in Norwegian format
  if (typeof excelDate === 'string') {
    // Try parsing DD.MM.YYYY or DD/MM/YYYY
    const dateMatch = excelDate.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/)
    if (dateMatch) {
      const [, day, month, year] = dateMatch
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }
    
    // Try ISO format
    const isoDate = new Date(excelDate)
    if (!isNaN(isoDate.getTime())) return isoDate
  }
  
  // If it's an Excel serial number
  if (typeof excelDate === 'number') {
    // Excel dates start from 1900-01-01 (with 1900 being day 1)
    const excelEpoch = new Date(1900, 0, 1)
    const days = excelDate - 1 // Excel counts from 1, not 0
    return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000)
  }
  
  return null
}

function parseBooleanValue(value: any): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    return ['ja', 'yes', 'true', '1', 'x'].includes(lower)
  }
  if (typeof value === 'number') return value > 0
  return false
}

export const POST = requireRole(['ADMIN', 'PURCHASER'])(async (req: NextRequest) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const supplierId = formData.get('supplierId') as string
    const updateExisting = formData.get('updateExisting') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'Ingen fil valgt' }, { status: 400 })
    }

    if (!supplierId) {
      return NextResponse.json({ error: 'Leverandør må velges' }, { status: 400 })
    }

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Leverandør ikke funnet' }, { status: 404 })
    }

    // Read file
    const buffer = Buffer.from(await file.arrayBuffer())
    let workbook: XLSX.WorkBook

    try {
      if (file.name.endsWith('.csv')) {
        const csvText = buffer.toString('utf-8')
        workbook = XLSX.read(csvText, { type: 'string' })
      } else {
        workbook = XLSX.read(buffer, { type: 'buffer' })
      }
    } catch (error) {
      return NextResponse.json({ 
        error: 'Kunne ikke lese filen. Sjekk at det er en gyldig Excel/CSV-fil.' 
      }, { status: 400 })
    }

    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (rawData.length < 2) {
      return NextResponse.json({ 
        error: 'Filen må inneholde minst en header-rad og en data-rad' 
      }, { status: 400 })
    }

    // Parse headers
    const headers = rawData[0] as string[]
    const dataRows = rawData.slice(1)

    // Map headers to our expected columns
    const columnMapping: { [key: number]: string } = {}
    const unmappedColumns: string[] = []

    headers.forEach((header, index) => {
      const trimmedHeader = header?.toString().trim()
      if (trimmedHeader) {
        const mappedField = PRICE_LIST_COLUMNS[trimmedHeader as keyof typeof PRICE_LIST_COLUMNS]
        if (mappedField) {
          columnMapping[index] = mappedField
        } else {
          unmappedColumns.push(trimmedHeader)
        }
      }
    })

    // Check for required columns
    const requiredFields = ['sku', 'itemName', 'negotiatedPrice']
    const mappedFields = Object.values(columnMapping)
    const missingFields = requiredFields.filter(field => !mappedFields.includes(field))

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Manglende påkrevde kolonner: ${missingFields.join(', ')}`,
        details: {
          expectedColumns: Object.keys(PRICE_LIST_COLUMNS),
          foundColumns: headers,
          unmappedColumns
        }
      }, { status: 400 })
    }

    // Process data
    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [] as string[]
    }

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as any[]
      const rowNumber = i + 2 // +2 because we start from row 1 and skip header

      try {
        // Extract data from row
        const rowData: any = {}
        Object.entries(columnMapping).forEach(([colIndex, fieldName]) => {
          const value = row[parseInt(colIndex)]
          if (value !== undefined && value !== null && value !== '') {
            rowData[fieldName] = value
          }
        })

        // Validate required fields
        if (!rowData.sku || !rowData.itemName || !rowData.negotiatedPrice) {
          results.errors.push(`Rad ${rowNumber}: Mangler påkrevde felt (SKU, Varenavn, Pris)`)
          continue
        }

        // Find or create item
        let item = await prisma.item.findFirst({
          where: { sku: rowData.sku.toString().trim() }
        })

        if (!item) {
          // Create new item
          item = await prisma.item.create({
            data: {
              sku: rowData.sku.toString().trim(),
              name: rowData.itemName.toString().trim(),
              unit: 'stk', // Default unit
              minStock: 0,
              requiresLotNumber: false,
              expiryTracking: false,
              hazardous: false
            }
          })
        }

        // Parse price data
        const priceData: any = {
          itemId: item.id,
          supplierId: supplierId,
          negotiatedPrice: parseFloat(rowData.negotiatedPrice.toString().replace(',', '.')),
          isPrimarySupplier: parseBooleanValue(rowData.isPrimarySupplier)
        }

        // Optional fields
        if (rowData.listPrice) {
          priceData.listPrice = parseFloat(rowData.listPrice.toString().replace(',', '.'))
        }
        if (rowData.agreementReference) {
          priceData.agreementReference = rowData.agreementReference.toString().trim()
        }
        if (rowData.discountCodeRequired) {
          priceData.discountCodeRequired = rowData.discountCodeRequired.toString().trim()
        }
        if (rowData.minimumOrderQty) {
          priceData.minimumOrderQty = parseInt(rowData.minimumOrderQty.toString())
        }
        if (rowData.notes) {
          priceData.notes = rowData.notes.toString().trim()
        }

        // Parse dates
        if (rowData.priceValidUntil) {
          const validUntil = parseExcelDate(rowData.priceValidUntil)
          if (validUntil) {
            priceData.priceValidUntil = validUntil
          }
        }
        if (rowData.lastVerifiedDate) {
          const lastVerified = parseExcelDate(rowData.lastVerifiedDate)
          if (lastVerified) {
            priceData.lastVerifiedDate = lastVerified
          }
        } else {
          // Set current date as verification date for new imports
          priceData.lastVerifiedDate = new Date()
        }

        // Check if supplier item already exists
        const existingSupplierItem = await prisma.supplierItem.findFirst({
          where: {
            itemId: item.id,
            supplierId: supplierId
          }
        })

        if (existingSupplierItem) {
          if (updateExisting) {
            await prisma.supplierItem.update({
              where: { id: existingSupplierItem.id },
              data: priceData
            })
            results.updated++
          } else {
            results.errors.push(`Rad ${rowNumber}: Pris for ${rowData.sku} eksisterer allerede (bruk "Oppdater eksisterende" for å overskrive)`)
            continue
          }
        } else {
          await prisma.supplierItem.create({
            data: priceData
          })
          results.created++
        }

        results.processed++

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error)
        results.errors.push(`Rad ${rowNumber}: ${error instanceof Error ? error.message : 'Ukjent feil'}`)
      }
    }

    return NextResponse.json({
      message: `Import fullført: ${results.created} opprettet, ${results.updated} oppdatert`,
      results,
      supplier: supplier.name
    })

  } catch (error) {
    console.error('Error importing price list:', error)
    return NextResponse.json(
      { error: 'Kunne ikke importere prisliste' },
      { status: 500 }
    )
  }
})
