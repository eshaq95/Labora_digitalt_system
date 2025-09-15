import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type User = {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'PURCHASER' | 'LAB_USER' | 'VIEWER'
  isActive: boolean
  lastLoginAt?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasRole: (roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Sjekk om bruker er innlogget ved app-start
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        // Sjekk om responsen er JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          setUser(data.user)
        } else {
          console.error('Uventet respons fra /api/auth/me')
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Feil ved sjekk av autentisering:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      // Sjekk om responsen er JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Uventet respons fra server:', text)
        throw new Error('Server returnerte ugyldig respons')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Innlogging feilet')
      }

      setUser(data.user)
    } catch (error) {
      console.error('Feil ved innlogging:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Feil ved utlogging:', error)
    } finally {
      setUser(null)
    }
  }

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth må brukes innenfor AuthProvider')
  }
  return context
}

// Hjelpefunksjon for å sjekke roller
export function requireAuth(allowedRoles: string[] = []) {
  return function AuthGuard({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth()

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!user) {
      return <LoginRequired />
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return <AccessDenied userRole={user.role} requiredRoles={allowedRoles} />
    }

    return <>{children}</>
  }
}

function LoginRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Innlogging påkrevd</h1>
        <p className="text-text-secondary mb-6">Du må logge inn for å få tilgang til systemet.</p>
        <a 
          href="/login" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Gå til innlogging
        </a>
      </div>
    </div>
  )
}

function AccessDenied({ userRole, requiredRoles }: { userRole: string, requiredRoles: string[] }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Ingen tilgang</h1>
        <p className="text-text-secondary mb-2">Din rolle: {userRole}</p>
        <p className="text-text-secondary mb-6">Påkrevde roller: {requiredRoles.join(', ')}</p>
        <button 
          onClick={() => window.history.back()} 
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Gå tilbake
        </button>
      </div>
    </div>
  )
}
