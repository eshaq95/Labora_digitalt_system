import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Oppretter standard leverandørkategorier og bedriftsinnstillinger...')

  // Opprett standard leverandørkategorier
  const categories = [
    {
      name: 'Utstyr og forbruksvarer',
      description: 'Laboratoriesutstyr, instrumenter og forbruksvarer'
    },
    {
      name: 'Logistikk',
      description: 'Transport, frakt og logistikktjenester'
    },
    {
      name: 'Service-leverandører',
      description: 'Vedlikehold, kalibrering og andre tjenester'
    },
    {
      name: 'IT-tjenester',
      description: 'Software, hardware og IT-support'
    },
    {
      name: 'Andre tilganger',
      description: 'Diverse leverandører og tjenester'
    },
    {
      name: 'Tidligere leverandører',
      description: 'Leverandører som ikke lenger er aktive'
    }
  ]

  for (const category of categories) {
    await prisma.supplierCategory.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category
    })
    console.log(`✅ Kategori: ${category.name}`)
  }

  // Opprett standard bedriftsinnstillinger
  const existingSettings = await prisma.companySettings.findFirst()
  
  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        companyName: 'Labora Digital',
        organizationNumber: '123456789',
        
        // Leveringsadresse (eksempel)
        deliveryAddress: 'Laboratorieveien 1',
        deliveryPostalCode: '0123',
        deliveryCity: 'Oslo',
        deliveryCountry: 'Norge',
        
        // Fakturaadresse (eksempel)
        invoiceAddress: 'Laboratorieveien 1',
        invoicePostalCode: '0123',
        invoiceCity: 'Oslo',
        invoiceCountry: 'Norge',
        
        // Kontaktinformasjon
        phone: '+47 12 34 56 78',
        email: 'post@labora.no',
        website: 'https://labora.no'
      }
    })
    console.log('✅ Bedriftsinnstillinger opprettet')
  } else {
    console.log('✅ Bedriftsinnstillinger finnes allerede')
  }

  console.log('\n🎉 Seeding fullført!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
