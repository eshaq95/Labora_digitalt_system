import { prisma } from '@/lib/prisma'

// Hent alle kontaktpersoner for en leverandør
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const contacts = await prisma.contactPerson.findMany({
      where: { supplierId: id },
      orderBy: [
        { isPrimary: 'desc' }, // Primær kontakt først
        { name: 'asc' }
      ]
    })
    return Response.json(contacts)
  } catch (error) {
    console.error('Feil ved henting av kontaktpersoner:', error)
    return Response.json({ error: 'Kunne ikke hente kontaktpersoner' }, { status: 500 })
  }
}

// Opprett ny kontaktperson
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, role, email, phone, isPrimary } = body

    // Hvis dette skal være primær kontakt, fjern primær status fra andre
    if (isPrimary) {
      await prisma.contactPerson.updateMany({
        where: { supplierId: id, isPrimary: true },
        data: { isPrimary: false }
      })
    }

    const contact = await prisma.contactPerson.create({
      data: {
        supplierId: id,
        name,
        role: role || null,
        email: email || null,
        phone: phone || null,
        isPrimary: isPrimary || false
      }
    })

    return Response.json(contact)
  } catch (error) {
    console.error('Feil ved opprettelse av kontaktperson:', error)
    return Response.json({ error: 'Kunne ikke opprette kontaktperson' }, { status: 500 })
  }
}
