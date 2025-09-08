import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Oppretter grunndata for referansetabeller...')

  // Opprett standard avdelinger
  const departments = [
    { name: 'Mikrobiologi', code: 'MIKRO' },
    { name: 'Kjemi', code: 'KJEMI' },
    { name: 'Molekylærbiologi', code: 'MOLBIO' },
    { name: 'Histologi', code: 'HISTO' },
    { name: 'Immunologi', code: 'IMMUNO' },
    { name: 'Administrasjon', code: 'ADMIN' }
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name },
      create: dept
    })
    console.log(`✅ Avdeling: ${dept.name}`)
  }

  // Opprett standard kategorier
  const categories = [
    { name: 'Medier og Reagenser', code: 'MEDIER', description: 'Dyrkningsmedier og laboratoriereagensar' },
    { name: 'Utstyr og Instrumenter', code: 'UTSTYR', description: 'Laboratoriesutstyr og instrumenter' },
    { name: 'Forbruksvarer', code: 'FORBR', description: 'Engangsutstyr og forbruksvarer' },
    { name: 'Kjemikalier', code: 'KJEM', description: 'Kjemikalier og løsninger' },
    { name: 'HMS og Sikkerhet', code: 'HMS', description: 'HMS-utstyr og sikkerhetsprodukter' },
    { name: 'IT og Software', code: 'IT', description: 'IT-utstyr og programvare' }
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: { name: cat.name, description: cat.description },
      create: cat
    })
    console.log(`✅ Kategori: ${cat.name}`)
  }

  // Opprett standard lokasjoner
  const locations = [
    { name: 'Hovedlager', code: 'MAIN', type: 'MAIN' as const },
    { name: 'Kjølerom A', code: 'COLD-A', type: 'COLD' as const },
    { name: 'Kjølerom B', code: 'COLD-B', type: 'COLD' as const },
    { name: 'Fryseboks -20°C', code: 'FREEZE-20', type: 'COLD' as const },
    { name: 'Fryseboks -80°C', code: 'FREEZE-80', type: 'COLD' as const },
    { name: 'Mikro Lab', code: 'LAB-MIKRO', type: 'OTHER' as const },
    { name: 'Kjemi Lab', code: 'LAB-KJEMI', type: 'OTHER' as const }
  ]

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { code: loc.code },
      update: { name: loc.name, type: loc.type },
      create: {
        name: loc.name,
        code: loc.code,
        type: loc.type,
        notes: `Standard ${loc.name.toLowerCase()}`
      }
    })
    console.log(`✅ Lokasjon: ${loc.name}`)
  }

  console.log('\n🎉 Grunndata opprettet!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
