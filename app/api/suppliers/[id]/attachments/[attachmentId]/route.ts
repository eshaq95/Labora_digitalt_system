import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth-middleware'

// DELETE /api/suppliers/[id]/attachments/[attachmentId] - Slett vedlegg
export const DELETE = requireRole(['ADMIN', 'PURCHASER'])(async (
  req: NextRequest, 
  { params }: { params: { id: string; attachmentId: string } }
) => {
  try {
    // Verify that the attachment belongs to the supplier
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: params.attachmentId,
        supplierId: params.id
      }
    })

    if (!attachment) {
      return NextResponse.json(
        { error: 'Vedlegg ikke funnet' },
        { status: 404 }
      )
    }

    // TODO: Delete the actual file from storage
    // await deleteFileFromStorage(attachment.url)

    // Delete from database
    await prisma.attachment.delete({
      where: {
        id: params.attachmentId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(
      { error: 'Kunne ikke slette vedlegg' },
      { status: 500 }
    )
  }
})
