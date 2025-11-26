// src/components/AuthGuard.tsx
'use client'
import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'

interface AuthGuardProps {
  children: React.ReactNode
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (loading || hasRedirected.current) return

    const isLoginPage = pathname === '/login'
    const isAuthenticated = !!user

    // Usuario no autenticado fuera del login -> redirigir a login
    if (!isAuthenticated && !isLoginPage) {
      hasRedirected.current = true
      router.push('/login')
      return
    }

    // Usuario autenticado en login -> redirigir a app
    if (isAuthenticated && isLoginPage) {
      hasRedirected.current = true
      router.push('/ordenes')
      return
    }

    hasRedirected.current = false
  }, [user, loading, pathname, router])

  // Renderizar contenido inmediatamente sin pantalla de carga
  return <>{children}</>
}