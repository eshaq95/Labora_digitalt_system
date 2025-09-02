import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')

    if (!token) {
      return Response.json({ 
        error: 'Ikke innlogget' 
      }, { status: 401 })
    }

    // Verifiser JWT token
    const decoded = verify(
      token.value, 
      process.env.JWT_SECRET || 'labora-secret-key'
    ) as any

    if (!decoded.userId) {
      return Response.json({ 
        error: 'Ugyldig token' 
      }, { status: 401 })
    }

    // Hent oppdatert brukerinformasjon
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true
      }
    })

    if (!user || !user.isActive) {
      return Response.json({ 
        error: 'Bruker ikke funnet eller deaktivert' 
      }, { status: 401 })
    }

    return Response.json({ user })

  } catch (error) {
    console.error('Feil ved henting av brukerinfo:', error)
    return Response.json({ 
      error: 'Ugyldig sesjon' 
    }, { status: 401 })
  }
}
