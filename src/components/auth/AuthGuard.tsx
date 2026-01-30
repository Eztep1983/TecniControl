// components/auth/AuthGuard.tsx
'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

const PUBLIC_ROUTES = ['/login']

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route))

  useEffect(() => {
    // No hacer nada mientras está cargando
    if (loading) return

    const shouldRedirect = () => {
      // Usuario no autenticado intentando acceder a ruta protegida
      if (!user && !isPublicRoute) {
        return '/login'
      }
      
      // Usuario autenticado en página de login
      if (user && pathname === '/login') {
        return '/ordenes'
      }
      
      return null
    }

    const redirectTo = shouldRedirect()
    
    if (redirectTo) {
      setIsNavigating(true)
      router.replace(redirectTo)
    }
  }, [user, loading, pathname, isPublicRoute, router])

  // Mostrar loading durante verificación inicial
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-400 text-sm">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Mostrar loading durante navegación

  // Renderizar contenido apropiado
  if (isPublicRoute || user) {
    return <>{children}</>
  }

  // Estado de espera (no debería llegar aquí normalmente)
  return null
}