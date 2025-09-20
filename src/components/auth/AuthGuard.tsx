// src/components/AuthGuard.tsx
'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    if (loading) return

    const isLoginPage = pathname === '/login'
    const isAuthenticated = !!user

    console.log('🔐 AuthGuard:', { isLoginPage, isAuthenticated, pathname })

    if (!isAuthenticated && !isLoginPage) {
      console.log('👤 No user, redirecting to login')
      setIsNavigating(true)
      window.location.href = '/login' // Forzar navegación completa
      return
    }

    if (isAuthenticated && isLoginPage) {
      console.log('✅ User logged in, redirecting to app')
      setIsNavigating(true)
      window.location.href = '/ordenes' // Forzar navegación completa
      return
    }

    setIsNavigating(false)
  }, [user, loading, pathname])

  if (loading || isNavigating) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">
            {loading ? 'Verificando autenticación...' : 'Redirigiendo...'}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}