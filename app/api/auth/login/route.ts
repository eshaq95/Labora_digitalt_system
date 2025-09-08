import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { sign } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const loginSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
  password: z.string().min(1, 'Passord er påkrevd')
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = loginSchema.parse(body)

    // Finn bruker
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        password: true
      }
    })

    if (!user) {
      return Response.json({ 
        error: 'Ugyldig e-post eller passord' 
      }, { status: 401 })
    }

    if (!user.isActive) {
      return Response.json({ 
        error: 'Brukerkonto er deaktivert' 
      }, { status: 401 })
    }

    // Valider passord
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return Response.json({ 
        error: 'Ugyldig e-post eller passord' 
      }, { status: 401 })
    }

    // Opprett JWT token
    const token = sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'labora-secret-key',
      { expiresIn: '24h' }
    )

    // Oppdater siste innlogging
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Sett HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 timer
    })

    console.log(`✅ Innlogging vellykket: ${user.name} (${user.role})`)

    return Response.json({
      message: 'Innlogging vellykket',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

  } catch (error: any) {
    console.error('Feil ved innlogging:', error)
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Ugyldig input', 
        details: error.issues 
      }, { status: 400 })
    }

    return Response.json({ 
      error: 'Kunne ikke logge inn' 
    }, { status: 500 })
  }
}
