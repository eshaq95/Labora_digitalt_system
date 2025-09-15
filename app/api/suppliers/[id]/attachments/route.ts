import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/auth-middleware'

// GET /api/suppliers/[id]/attachments - Hent alle vedlegg for en leverandør
export const GET = requireAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const attachments = await prisma.attachment.findMany({
      where: {
        supplierId: params.id
      },
      include: {
        uploader: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { error: 'Kunne ikke hente vedlegg' },
      { status: 500 }
    )
  }
})

// POST /api/suppliers/[id]/attachments - Last opp nytt vedlegg
export const POST = requireRole(['ADMIN', 'PURCHASER'])(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const validUntil = formData.get('validUntil') as string
    const agreementReference = formData.get('agreementReference') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Ingen fil valgt' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'image/jpeg',
      'image/png'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ugyldig filtype. Tillatte typer: PDF, Word, Excel, CSV, JPEG, PNG' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Filen er for stor. Maksimal størrelse: 10MB' },
        { status: 400 }
      )
    }

    // In a real implementation, you would save the file to a storage service
    // For now, we'll simulate this by creating a URL
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const url = `/uploads/suppliers/${params.id}/${filename}`

    // TODO: Actually save the file to storage
    // await saveFileToStorage(file, url)

    const attachment = await prisma.attachment.create({
      data: {
        supplierId: params.id,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url,
        description: description || null,
        category: category as any || 'OTHER',
        validUntil: validUntil ? new Date(validUntil) : null,
        agreementReference: agreementReference || null,
        uploadedBy: req.user?.id
      },
      include: {
        uploader: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(attachment)
  } catch (error) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json(
      { error: 'Kunne ikke laste opp vedlegg' },
      { status: 500 }
    )
  }
})