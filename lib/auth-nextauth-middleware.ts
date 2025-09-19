import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
// UserRole will be imported from the Prisma schema
type UserRole = 'ADMIN' | 'PURCHASER' | 'LAB_USER' | 'VIEWER'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
    name: string
    role: UserRole
  }
}

/**
 * NextAuth-based authentication middleware
 * Replaces the manual JWT authentication system
 */
export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Attach user info to request
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = {
        userId: session.user.id,
        email: session.user.email!,
        name: session.user.name!,
        role: session.user.role as UserRole,
      }

      return handler(authenticatedReq)
    } catch (error) {
      console.error('Authentication middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return requireAuth(async (req: AuthenticatedRequest) => {
      const userRole = req.user?.role
      
      if (!userRole || !allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return handler(req)
    })
  }
}

/**
 * Get current user session (for use in API routes)
 */
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions)
    return session?.user || null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}
