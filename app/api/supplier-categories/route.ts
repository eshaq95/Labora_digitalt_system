import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.supplierCategory.findMany({ 
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { suppliers: true }
        }
      }
    })
    return Response.json(categories)
  } catch (error) {
    console.error('Feil ved henting av leverandørkategorier:', error)
    return Response.json({ error: 'Kunne ikke laste kategorier' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { name, description } = body || {}
    
    if (typeof name !== 'string' || !name.trim()) {
      return Response.json({ error: 'Kategorinavn er påkrevd' }, { status: 400 })
    }
    
    const category = await prisma.supplierCategory.create({
      data: {
        name: name.trim(),
        description: description || null
      },
      include: {
        _count: {
          select: { suppliers: true }
        }
      }
    })
    return Response.json(category, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return Response.json({ error: 'Kategorinavn må være unikt' }, { status: 400 })
    }
    console.error('Feil ved opprettelse av kategori:', error)
    return Response.json({ error: 'Kunne ikke opprette kategori' }, { status: 500 })
  }
}
