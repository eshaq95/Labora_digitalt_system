import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Oppdaterer VWR med kategori...')

  // Finn "Utstyr og forbruksvarer" kategori
  const category = await prisma.supplierCategory.findUnique({
    where: { name: 'Utstyr og forbruksvarer' }
  })

  if (!category) {
    console.log('❌ Fant ikke kategori "Utstyr og forbruksvarer"')
    return
  }

  // Finn VWR leverandør
  const vwr = await prisma.supplier.findFirst({
    where: { name: 'VWR International AS' }
  })

  if (!vwr) {
    console.log('❌ Fant ikke VWR leverandør')
    return
  }

  // Oppdater VWR med kategori og generalEmail
  await prisma.supplier.update({
    where: { id: vwr.id },
    data: {
      categoryId: category.id,
      generalEmail: 'info.no@vwr.com'
    }
  })

  console.log('✅ VWR oppdatert med kategori og generell e-post')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
