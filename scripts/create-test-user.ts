import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🔧 Oppretter test-bruker...');

  // Sjekk om det allerede finnes brukere
  const existingUsers = await prisma.user.count();
  console.log(`📊 Eksisterende brukere: ${existingUsers}`);

  if (existingUsers === 0) {
    // Opprett en test-bruker
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'test@labora.no',
        name: 'Test Bruker',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Test-bruker opprettet:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Navn: ${user.name}`);
    console.log(`   - Rolle: ${user.role}`);
    console.log('   - Passord: test123');
  } else {
    console.log('ℹ️  Brukere eksisterer allerede');
    
    // Vis eksisterende brukere
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
    
    console.log('📋 Eksisterende brukere:');
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role} - ${user.isActive ? 'Aktiv' : 'Inaktiv'}`);
    });
  }

  console.log('\n🎉 Ferdig!');
}

main()
  .catch((e) => {
    console.error('❌ Feil:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
