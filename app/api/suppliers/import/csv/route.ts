import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// CSV column mapping from Leverandører_lab.csv
const CSV_COLUMN_MAPPING = {
  'Name': 'name',
  'Ordre via': 'orderMethod',
  'Nettside': 'website', 
  'Bestilling E-post': 'orderEmail',
  'Vår kontaktperson': 'contactPerson',
  'Telefon': 'phone',
  'Brukernavn': 'username',
  'Passord': 'password',
  // Consolidated fields (will be merged into notes)
  'Info om pris, frakt, avtale, rabatt': '_info',
  'Produkter': '_products',
  'Avtale (vedlegg)': '_agreement', 
  'Fast bestilling': '_recurring',
  // Optional fields that may be in notes or separate
  'E-post': '_generalEmail',
  'Kategori': '_category'
}

function consolidateNotes(row: any): string {
  const notesSections: string[] = []
  
  if (row._info) {
    notesSections.push(`### Info/Avtale:\n${row._info}`)
  }
  
  if (row._products) {
    notesSections.push(`### Produkter:\n${row._products}`)
  }
  
  if (row._agreement) {
    notesSections.push(`### Avtale:\n${row._agreement}`)
  }
  
  if (row._recurring) {
    notesSections.push(`### Fast bestilling:\n${row._recurring}`)
  }
  
  if (row._generalEmail) {
    notesSections.push(`### Generell E-post:\n${row._generalEmail}`)
  }
  
  if (row._category) {
    notesSections.push(`### Kategori:\n${row._category}`)
  }
  
  return notesSections.join('\n\n')
}

function cleanUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  
  const cleaned = url.trim()
  if (!cleaned) return null
  
  // Add protocol if missing
  if (cleaned.startsWith('www.')) {
    return `https://${cleaned}`
  }
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    return `https://${cleaned}`
  }
  
  return cleaned
}

function processSupplierRow(row: any): any {
  // Skip empty rows or section headers
  if (!row.name || typeof row.name !== 'string' || !row.name.trim()) {
    return null
  }
  
  const name = row.name.trim()
  
  // Skip section headers like "Utstyr og forbruksvarer"
  if (name.toLowerCase().includes('utstyr') || 
      name.toLowerCase().includes('forbruksvarer') ||
      name.toLowerCase().includes('avdeling') ||
      name.length < 3) {
    return null
  }
  
  return {
    name,
    orderMethod: row.orderMethod?.trim() || null,
    website: cleanUrl(row.website),
    orderEmail: row.orderEmail?.trim() || null,
    contactPerson: row.contactPerson?.trim() || null,
    phone: row.phone?.trim() || null,
    username: row.username?.trim() || null,
    password: row.password?.trim() || null,
    notes: consolidateNotes(row) || null
  }
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
    
    // Find header row (first row with "Name" column)
    let headerRowIndex = -1
    let headers: string[] = []
    
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i]
      if (row && row.some((cell: any) => 
        typeof cell === 'string' && 
        (cell.trim() === 'Name' || cell.trim() === 'Navn')
      )) {
        headerRowIndex = i
        headers = row.map((cell: any) => cell?.toString().trim() || '')
        break
      }
    }
    
    if (headerRowIndex === -1) {
      return Response.json({ 
        error: 'Kunne ikke finne header-rad med "Name" eller "Navn" kolonne' 
      }, { status: 400 })
    }
    
    // Process data rows
    const dataRows = rawData.slice(headerRowIndex + 1)
    const processedSuppliers: any[] = []
    const errors: string[] = []
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      if (!row || row.length === 0) continue
      
      try {
        // Convert array to object using headers
        const rowObject: any = {}
        headers.forEach((header, index) => {
          const mappedField = CSV_COLUMN_MAPPING[header as keyof typeof CSV_COLUMN_MAPPING]
          if (mappedField) {
            rowObject[mappedField] = row[index]
          }
        })
        
        const processedSupplier = processSupplierRow(rowObject)
        if (processedSupplier) {
          processedSuppliers.push(processedSupplier)
        }
      } catch (error) {
        errors.push(`Rad ${i + headerRowIndex + 2}: ${error}`)
      }
    }
    
    if (processedSuppliers.length === 0) {
      return Response.json({ 
        error: 'Ingen gyldige leverandører funnet i filen',
        details: errors
      }, { status: 400 })
    }
    
    // Import to database
    const results = {
      created: 0,
      updated: 0,
      errors: [...errors]
    }
    
    for (const supplierData of processedSuppliers) {
      try {
        // Try to find existing supplier by name
        const existing = await prisma.supplier.findUnique({
          where: { name: supplierData.name }
        })
        
        if (existing) {
          // Update existing supplier
          await prisma.supplier.update({
            where: { id: existing.id },
            data: {
              ...supplierData,
              // Preserve legacy fields by falling back to new fields
              contactName: existing.contactName || supplierData.contactPerson,
              contactEmail: existing.contactEmail || supplierData.orderEmail,
              contactPhone: existing.contactPhone || supplierData.phone,
              orderingMethod: existing.orderingMethod || supplierData.orderMethod,
            }
          })
          results.updated++
        } else {
          // Create new supplier
          await prisma.supplier.create({
            data: {
              ...supplierData,
              // Set legacy fields for backward compatibility
              contactName: supplierData.contactPerson,
              contactEmail: supplierData.orderEmail,
              contactPhone: supplierData.phone,
              orderingMethod: supplierData.orderMethod,
            }
          })
          results.created++
        }
      } catch (error: any) {
        results.errors.push(`${supplierData.name}: ${error.message}`)
      }
    }
    
    return Response.json({
      success: true,
      message: `Import fullført: ${results.created} opprettet, ${results.updated} oppdatert`,
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
