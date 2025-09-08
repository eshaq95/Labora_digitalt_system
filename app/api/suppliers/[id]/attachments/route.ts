import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'

// Hent alle vedlegg for en leverandør
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const attachments = await prisma.attachment.findMany({
      where: { supplierId: id },
      include: {
        uploader: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return Response.json(attachments)
  } catch (error) {
    console.error('Feil ved henting av vedlegg:', error)
    return Response.json({ error: 'Kunne ikke hente vedlegg' }, { status: 500 })
  }
}

// Last opp nytt vedlegg
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const formData = await req.formData()
    
    const file = formData.get('file') as File
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const uploadedBy = formData.get('uploadedBy') as string

    if (!file) {
      return Response.json({ error: 'Ingen fil valgt' }, { status: 400 })
    }

    // Generer unikt filnavn
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    // Lagre fil til disk (i produksjon: bruk cloud storage)
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'suppliers')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Opprett mappe hvis den ikke eksisterer
    try {
      await writeFile(join(uploadsDir, filename), buffer)
    } catch (dirError) {
      // Hvis mappen ikke eksisterer, opprett den
      const { mkdir } = await import('fs/promises')
      await mkdir(uploadsDir, { recursive: true })
      await writeFile(join(uploadsDir, filename), buffer)
    }

    // Lagre metadata i database
    const attachment = await prisma.attachment.create({
      data: {
        supplierId: id,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: `/uploads/suppliers/${filename}`,
        description: description || null,
        category: (category as any) || 'OTHER',
        uploadedBy: uploadedBy || null
      },
      include: {
        uploader: {
          select: { name: true, email: true }
        }
      }
    })

    return Response.json(attachment)
  } catch (error) {
    console.error('Feil ved opplasting av vedlegg:', error)
    return Response.json({ error: 'Kunne ikke laste opp vedlegg' }, { status: 500 })
  }
}
