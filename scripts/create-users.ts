import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating users...')

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10)
  const purchaserPassword = await bcrypt.hash('purchaser123', 10)
  const labUserPassword = await bcrypt.hash('labuser123', 10)
  const viewerPassword = await bcrypt.hash('viewer123', 10)

  // Create users
  const users = [
    {
      email: 'admin@labora.no',
      name: 'Administrator',
      role: 'ADMIN' as const,
      password: adminPassword,
      isActive: true,
    },
    {
      email: 'purchaser@labora.no', 
      name: 'Innkjøper',
      role: 'PURCHASER' as const,
      password: purchaserPassword,
      isActive: true,
    },
    {
      email: 'labuser@labora.no',
      name: 'Lab Bruker',
      role: 'LAB_USER' as const,
      password: labUserPassword,
      isActive: true,
    },
    {
      email: 'viewer@labora.no',
      name: 'Viewer',
      role: 'VIEWER' as const,
      password: viewerPassword,
      isActive: true,
    },
  ]

  for (const user of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (existingUser) {
      console.log(`User ${user.email} already exists, updating...`)
      await prisma.user.update({
        where: { email: user.email },
        data: user
      })
    } else {
      console.log(`Creating user ${user.email}...`)
      await prisma.user.create({
        data: user
      })
    }
  }

  console.log('Users created successfully!')
  console.log('\nLogin credentials:')
  console.log('Admin: admin@labora.no / admin123')
  console.log('Purchaser: purchaser@labora.no / purchaser123')
  console.log('Lab User: labuser@labora.no / labuser123')
  console.log('Viewer: viewer@labora.no / viewer123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
