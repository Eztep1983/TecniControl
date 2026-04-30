// components/auth/AuthGuard.tsx
'use client'
import { useEffect, useLayoutEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Loader2 } from 'lucide-react'
import { useAppLifecycle } from '@/components/useAppLifecycle'

// Este guard protege las rutas privadas y muestra un spinner mientras se resuelve la sesión.
// Si no hay sesión y no hay ruta pública, redirige a /login.
// Si hay sesión, deja pasar. Si no hay sesión y es ruta pública, deja pasar.

interface AuthGuardProps {
  children: React.ReactNode
}

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = ['/login']

// Clave para caché de sesión en localStorage
const SESSION_CACHE_KEY = 'tc_session_uid'

/**
 * useLayoutEffect corre en el cliente sincrónicamente ANTES del primer paint.
 * En el servidor usamos useEffect como fallback (no tiene DOM).
 */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route))

  // Iniciar listener del ciclo de vida (refresca sesión/datos al volver)
  useAppLifecycle()

  /**
   * hasCachedSession empieza en false (SSR-safe).
   * useIsomorphicLayoutEffect lo actualiza en el cliente ANTES del primer paint.
   * Esto evita el spinner "Verificando sesión" en re-aperturas (web móvil + Capacitor).
   */
  const [hasCachedSession, setHasCachedSession] = useState(false)

  useIsomorphicLayoutEffect(() => {
    try {
      const uid = localStorage.getItem(SESSION_CACHE_KEY)
      setHasCachedSession(uid !== null)
    } catch {
      setHasCachedSession(false)
    }
  }, [])

  // Redirección cuando Firebase confirma el estado final
  useEffect(() => {
    if (loading) return

    const shouldRedirect = () => {
      if (!user && !isPublicRoute) return '/login'
      if (user && pathname === '/login') return '/ordenes'
      return null
    }

    const redirectTo = shouldRedirect()
    if (redirectTo) {
      router.replace(redirectTo)
    }
  }, [user, loading, pathname, isPublicRoute, router])

  /**
   * Mostrar spinner SOLO cuando:
   * - Firebase todavía está resolviendo (loading=true)
   * - Y no hay sesión cacheada (primera apertura o después de logout)
   *
   * Si hay caché → los hijos se muestran INMEDIATAMENTE mientras Firebase confirma.
   */
  const showSpinner = loading && !hasCachedSession

  if (showSpinner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 p-4 transition-colors duration-300">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-slate-600 dark:text-gray-400 text-sm font-medium">
            Verificando sesión...
          </p>
        </div>
      </div>
    )
  }

  if (isPublicRoute || user || hasCachedSession) {
    return <>{children}</>
  }

  // Sin sesión y sin caché: no renderizar nada (redirección en curso)
  return null
}