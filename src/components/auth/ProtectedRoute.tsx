// src/components/ProtectedRoute.tsx
'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)

  // Rutas que no requieren autenticación
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route))

  useEffect(() => {
    // Solo ejecutar la lógica si no está loading
    if (loading) return

    console.log('🛡️ ProtectedRoute check:', {
      user: user ? 'authenticated' : 'not authenticated',
      pathname,
      isPublicRoute,
      hasRedirected: hasRedirected.current
    })

    // Evitar redirecciones múltiples
    if (hasRedirected.current) {
      console.log('⏸️ Redirect already in progress, skipping')
      return
    }

    if (!user && !isPublicRoute) {
      console.log('🔐 User not authenticated, redirecting to login')
      hasRedirected.current = true
      router.replace('/login')
    } else if (user && pathname === '/login') {
      console.log('✅ User authenticated on login page, redirecting to ordenes')
      hasRedirected.current = true
      
      // Usar setTimeout para asegurar que la redirección se ejecute
      setTimeout(() => {
        console.log('🔄 Executing redirect to /ordenes')
        router.replace('/ordenes')
      }, 100)
    }
  }, [user, loading, pathname, isPublicRoute, router])

  // Reset flag when pathname changes (successful navigation)
  useEffect(() => {
    hasRedirected.current = false
  }, [pathname])

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si es una ruta pública, permitir acceso
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Solo mostrar contenido protegido si hay usuario
  if (user) {
    return <>{children}</>
  }

  // Loading state durante redirección
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Redirigiendo...</p>
      </div>
    </div>
  )
}

export default ProtectedRoute