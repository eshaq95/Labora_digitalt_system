const { PrismaClient } = require('@prisma/client')
const XLSX = require('xlsx')
const path = require('path')

const prisma = new PrismaClient()

async function importFromExcel(filePath, dataType = 'suppliers') {
  console.log(`📊 Starter import fra Excel-fil: ${filePath}`)
  
  try {
    // Les Excel-filen
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0] // Første ark
    const worksheet = workbook.Sheets[sheetName]
    
    // Konverter til JSON
    const data = XLSX.utils.sheet_to_json(worksheet)
    console.log(`📋 Fant ${data.length} rader i Excel-filen`)
    
    if (dataType === 'suppliers') {
      await importSuppliers(data)
    } else if (dataType === 'items') {
      await importItems(data)
    } else {
      throw new Error(`Ukjent datatype: ${dataType}`)
    }
    
  } catch (error) {
    console.error('❌ Feil under import:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function importSuppliers(data) {
  console.log('🏢 Importerer leverandører...')
  
  let imported = 0
  for (const row of data) {
    try {
      // Tilpass kolonnenavn til dine Excel-kolonner
      const supplier = await prisma.supplier.create({
        data: {
          name: row['Navn'] || row['Name'] || row['Leverandør'],
          website: row['Nettside'] || row['Website'] || null,
          orderEmail: row['E-post'] || row['Email'] || null,
          phone: row['Telefon'] || row['Phone'] || null,
          contactPerson: row['Kontaktperson'] || row['Contact'] || null,
          notes: row['Notater'] || row['Notes'] || null,
          // Legg til flere felter etter behov
        }
      })
      imported++
      console.log(`✅ Importert: ${supplier.name}`)
    } catch (error) {
      console.error(`❌ Feil ved import av rad:`, row, error.message)
    }
  }
  
  console.log(`🎉 Import fullført! ${imported} leverandører importert`)
}

async function importItems(data) {
  console.log('📦 Importerer varer...')
  
  let imported = 0
  for (const row of data) {
    try {
      // Tilpass kolonnenavn til dine Excel-kolonner
      const item = await prisma.item.create({
        data: {
          sku: row['SKU'] || row['Varenummer'] || `AUTO-${Date.now()}-${imported}`,
          name: row['Navn'] || row['Name'] || row['Varenavn'],
          description: row['Beskrivelse'] || row['Description'] || null,
          manufacturer: row['Produsent'] || row['Manufacturer'] || null,
          unit: row['Enhet'] || 'UNIT',
          minStock: parseInt(row['Min beholdning'] || row['Min Stock'] || 0),
          // Legg til flere felter etter behov
        }
      })
      imported++
      console.log(`✅ Importert: ${item.name}`)
    } catch (error) {
      console.error(`❌ Feil ved import av rad:`, row, error.message)
    }
  }
  
  console.log(`🎉 Import fullført! ${imported} varer importert`)
}

// Bruk scriptet
if (require.main === module) {
  const filePath = process.argv[2]
  const dataType = process.argv[3] || 'suppliers'
  
  if (!filePath) {
    console.log('📖 Bruk: node scripts/import-from-excel.js <filsti> [suppliers|items]')
    console.log('📖 Eksempel: node scripts/import-from-excel.js data/leverandorer.xlsx suppliers')
    process.exit(1)
  }
  
  importFromExcel(filePath, dataType)
}

module.exports = { importFromExcel }
