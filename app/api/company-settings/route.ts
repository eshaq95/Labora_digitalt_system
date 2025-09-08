import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Hent eller opprett standard bedriftsinnstillinger
    let settings = await prisma.companySettings.findFirst()
    
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyName: 'Labora Digital',
          deliveryCountry: 'Norge',
          invoiceCountry: 'Norge'
        }
      })
    }
    
    return Response.json(settings)
  } catch (error) {
    console.error('Feil ved henting av bedriftsinnstillinger:', error)
    return Response.json({ error: 'Kunne ikke laste innstillinger' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    
    // Hent eksisterende innstillinger eller opprett nye
    let settings = await prisma.companySettings.findFirst()
    
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyName: 'Labora Digital',
          deliveryCountry: 'Norge',
          invoiceCountry: 'Norge'
        }
      })
    }
    
    // Oppdater med nye data
    const updatedSettings = await prisma.companySettings.update({
      where: { id: settings.id },
      data: {
        ...body,
        updatedAt: new Date()
      }
    })
    
    return Response.json(updatedSettings)
  } catch (error) {
    console.error('Feil ved oppdatering av bedriftsinnstillinger:', error)
    return Response.json({ error: 'Kunne ikke oppdatere innstillinger' }, { status: 500 })
  }
}
