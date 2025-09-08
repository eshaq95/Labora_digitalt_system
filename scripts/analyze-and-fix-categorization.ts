import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

// JSON structure mapping
interface VarekartotekItem {
  "HMS": string | null;
  "Unnamed: 15": string | null; // Avd.
  "Unnamed: 16": string | null; // Kategori
}

interface VarekartotekData {
  varekartotek: VarekartotekItem[];
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

async function analyzeAndFixCategorization() {
  console.log('🔍 Analyzing JSON structure and fixing categorization...')
  
  try {
    // Read the JSON file
    const jsonPath = '/Users/eshaqrahmani/Desktop/Trainee/Labora-Digit/VAREKARTOTEK_1756284046.json'
    console.log(`📖 Reading JSON file: ${jsonPath}`)
    
    const rawData = fs.readFileSync(jsonPath, 'utf-8')
    const data: VarekartotekData = JSON.parse(rawData)
    
    console.log(`📊 Found ${data.varekartotek.length} total rows in JSON file`)
    
    // Filter valid items and analyze their position
    const validItems = data.varekartotek.filter(isValidItem)
    console.log(`📦 Found ${validItems.length} valid items`)
    
    // Analyze the structure to find the 4 main groups based on position
    console.log('\\n🔍 Analyzing item positions and categories...')
    
    let analysisResults: Array<{
      index: number,
      name: string,
      avd: string | null,
      kategori: string | null,
      suggestedMainCategory: string
    }> = []
    
    validItems.forEach((item, index) => {
      const name = item.HMS?.trim() || ''
      const avd = item["Unnamed: 15"]?.trim() || null
      const kategori = item["Unnamed: 16"]?.trim() || null
      
      // Determine main category based on position (as per your specification)
      let suggestedMainCategory: string
      
      if (index < 2) {
        // First 2 items: HMS
        suggestedMainCategory = 'HMS'
      } else if (index < 47) {
        // Next 45 items (index 2-46): Mikro utstyr
        suggestedMainCategory = 'Mikro utstyr'
      } else if (index < 286) {
        // Next 239 items (index 47-285): Mikro kjemikalier og forbruksvarer
        suggestedMainCategory = 'Mikro kjemikalier og forbruksvarer'
      } else {
        // Last 2 items (index 286-287): Kjemi kjemikalier og gass
        suggestedMainCategory = 'Kjemi kjemikalier og gass'
      }
      
      analysisResults.push({
        index,
        name,
        avd,
        kategori,
        suggestedMainCategory
      })
    })
    
    // Show analysis of first few items from each group
    console.log('\\n📋 Analysis Results:')
    console.log('\\n🟣 HMS Group (first 2 items):')
    analysisResults.slice(0, 2).forEach(item => {
      console.log(`  ${item.index + 1}. ${item.name} (Avd: ${item.avd}, Kat: ${item.kategori})`)
    })
    
    console.log('\\n🟡 Mikro utstyr Group (items 3-47, showing first 5):')
    analysisResults.slice(2, 7).forEach(item => {
      console.log(`  ${item.index + 1}. ${item.name} (Avd: ${item.avd}, Kat: ${item.kategori})`)
    })
    
    console.log('\\n🔴 Mikro kjemikalier og forbruksvarer Group (items 48-286, showing first 5):')
    analysisResults.slice(47, 52).forEach(item => {
      console.log(`  ${item.index + 1}. ${item.name} (Avd: ${item.avd}, Kat: ${item.kategori})`)
    })
    
    console.log('\\n🟢 Kjemi kjemikalier og gass Group (last 2 items):')
    analysisResults.slice(-2).forEach(item => {
      console.log(`  ${item.index + 1}. ${item.name} (Avd: ${item.avd}, Kat: ${item.kategori})`)
    })
    
    // Now update the categories in the database based on this analysis
    console.log('\\n🔧 Creating/updating categories in database...')
    
    // Create the main categories if they don't exist
    const mainCategories = [
      { name: 'HMS', code: 'HMS', description: 'Helse, miljø og sikkerhet - sikkerhetsutstyr og verneutstyr' },
      { name: 'Mikro utstyr', code: 'MIKRO_UTSTYR', description: 'Mikrobiologi utstyr - laboratorieutstyr og instrumenter' },
      { name: 'Mikro kjemikalier og forbruksvarer', code: 'MIKRO_KJEMI', description: 'Mikrobiologi kjemikalier og forbruksvarer - medier, reagenser og forbruksmaterialer' },
      { name: 'Kjemi kjemikalier og gass', code: 'KJEMI_GASS', description: 'Kjemi kjemikalier og gass - kjemikalier, løsemidler og gasser' }
    ]
    
    for (const catData of mainCategories) {
      await prisma.category.upsert({
        where: { code: catData.code },
        update: catData,
        create: catData
      })
      console.log(`✅ Ensured category exists: ${catData.name}`)
    }
    
    // Get all items from database in creation order
    const allItems = await prisma.item.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, createdAt: true }
    })
    
    console.log(`\\n📦 Found ${allItems.length} items in database`)
    
    // Get the categories we just created
    const categories = await prisma.category.findMany()
    const hmsCategory = categories.find(c => c.code === 'HMS')!
    const mikroUtstyrCategory = categories.find(c => c.code === 'MIKRO_UTSTYR')!
    const mikroKjemiCategory = categories.find(c => c.code === 'MIKRO_KJEMI')!
    const kjemiGassCategory = categories.find(c => c.code === 'KJEMI_GASS')!
    
    console.log('\\n🔄 Updating item categories based on position...')
    
    let updated = 0
    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i]
      let targetCategoryId: string
      
      if (i < 2) {
        targetCategoryId = hmsCategory.id
        console.log(`  HMS: ${item.name}`)
      } else if (i < 47) {
        targetCategoryId = mikroUtstyrCategory.id
        if (i < 5) console.log(`  Mikro utstyr: ${item.name}`)
      } else if (i < 286) {
        targetCategoryId = mikroKjemiCategory.id
        if (i === 47) console.log(`  Mikro kjemi (first): ${item.name}`)
        if (i === 285) console.log(`  Mikro kjemi (last): ${item.name}`)
      } else {
        targetCategoryId = kjemiGassCategory.id
        console.log(`  Kjemi gass: ${item.name}`)
      }
      
      await prisma.item.update({
        where: { id: item.id },
        data: { categoryId: targetCategoryId }
      })
      
      updated++
    }
    
    console.log(`\\n✅ Updated ${updated} items with correct categories`)
    
    // Verify the results
    console.log('\\n📊 Final verification:')
    const verification = await prisma.item.groupBy({
      by: ['categoryId'],
      _count: { id: true },
      orderBy: { categoryId: 'asc' }
    })
    
    for (const group of verification) {
      const category = categories.find(c => c.id === group.categoryId)
      console.log(`  ${category?.name || 'Unknown'}: ${group._count.id} items`)
    }
    
    console.log('\\n🎉 Categorization fixed successfully!')
    
  } catch (error) {
    console.error('❌ Error analyzing and fixing categorization:', error)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeAndFixCategorization().catch(console.error)
