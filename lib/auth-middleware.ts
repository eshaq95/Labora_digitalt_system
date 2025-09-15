import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { cookies } from 'next/headers'

export interface AuthenticatedUser {
  userId: string
  email: string
  role: string
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser
}

export async function authenticateRequest(req: NextRequest): Promise<{ user: AuthenticatedUser } | { error: string }> {
  try {
    // Use Next.js cookies() function like the working /api/auth/me endpoint
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')
    
    if (!token) {
      return { error: 'Ikke innlogget' }
    }
    
    const tokenValue = token.value

    // Verifiser JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('JWT_SECRET er ikke satt i miljøvariabler')
      return { error: 'Server konfigurasjonsfeil' }
    }

    const decoded = verify(tokenValue, jwtSecret) as any

    if (!decoded.userId || !decoded.email || !decoded.role) {
      return { error: 'Ugyldig token' }
    }

    return {
      user: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    }
  } catch (error) {
    console.error('Feil ved autentisering:', error)
    return { error: 'Ugyldig sesjon' }
  }
}

export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticateRequest(req)
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const authenticatedReq = req as AuthenticatedRequest
    authenticatedReq.user = authResult.user

    return handler(authenticatedReq)
  }
}

export function requireRole(allowedRoles: string[]) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      const authResult = await authenticateRequest(req)
      
      if ('error' in authResult) {
        return NextResponse.json({ error: authResult.error }, { status: 401 })
      }

      if (!allowedRoles.includes(authResult.user.role)) {
        return NextResponse.json({ 
          error: 'Utilstrekkelige rettigheter',
          required: allowedRoles,
          current: authResult.user.role
        }, { status: 403 })
      }

      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = authResult.user

      return handler(authenticatedReq)
    }
  }
}
