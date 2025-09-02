import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Oppretter brukere...')
  
  try {
    // Slett eksisterende brukere
    await prisma.user.deleteMany({})
    console.log('✅ Slettet eksisterende brukere')
    
    // Opprett brukere
    const users = [
      {
        email: 'admin@labora.no',
        name: 'Administrator',
        password: 'admin123',
        role: 'ADMIN'
      },
      {
        email: 'kristin@labora.no',
        name: 'Kristin',
        password: 'kristin123',
        role: 'PURCHASER'
      },
      {
        email: 'ida@labora.no',
        name: 'Ida',
        password: 'ida123',
        role: 'LAB_USER'
      },
      {
        email: 'toril@labora.no',
        name: 'Toril',
        password: 'toril123',
        role: 'LAB_USER'
      },
      {
        email: 'bjornar@labora.no',
        name: 'Bjørnar',
        password: 'bjornar123',
        role: 'VIEWER'
      }
    ]
    
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      
      await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role
        }
      })
      
      console.log(`✅ Opprettet bruker: ${userData.name} (${userData.email})`)
    }
    
    console.log('\n📊 Brukere opprettet!')
    console.log('Du kan nå logge inn med:')
    console.log('- admin@labora.no / admin123 (Admin)')
    console.log('- kristin@labora.no / kristin123 (Innkjøper)')
    console.log('- ida@labora.no / ida123 (Lab-bruker)')
    console.log('- toril@labora.no / toril123 (Lab-bruker)')
    console.log('- bjornar@labora.no / bjornar123 (Viewer)')
    
  } catch (error) {
    console.error('❌ Feil under opprettelse av brukere:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
