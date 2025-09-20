// src/app/(app)/layout.tsx
"use client"

import React, { useState, useEffect, useCallback } from 'react'
import {
  Wrench,
  Users,
  Menu,
  X,
  Package,
  Settings,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/basic/button'
import { UserProfile } from '@/components/auth/UserProfile'
import { useAuth } from '@/components/auth/AuthProvider'

const navigation = [
  { name: 'Ordenes de Servicio', href: '/ordenes', icon: Package  },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Tecnicos', href: '/tecnicos', icon: Wrench },
]

const secondaryNavigation = [
  { name: 'Configuración', href: '/configuracion', icon: Settings },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const { user, loading } = useAuth()

  // ✅ ELIMINADO: No hay redirección aquí, ProtectedRoute se encarga
  // El layout solo se preocupa de renderizar si hay usuario

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSidebarOpen(false)
    }
  }, [])

  // Mostrar loading mientras se verifica autenticación
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, no renderizar nada (ProtectedRoute manejará la redirección)
  if (!user) {
    return null
  }

  const NavLinks = ({onClick}: {onClick?: () => void}) => (
    <>
      <nav className="flex-1 space-y-1 px-2 pb-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href) && item.href !== '/' || pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClick}
              className={cn(
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-300 hover:bg-accent/30 hover:text-white transition-colors duration-200',
                'group flex items-center rounded-md px-3 py-3 text-base font-medium'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon
                className="mr-4 h-6 w-6 flex-shrink-0"
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto border-t border-gray-700 pt-4">
        <nav className="space-y-1 px-2 pb-4">
          {secondaryNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClick}
                className={cn(
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-300 hover:bg-accent/70 hover:text-white transition-colors duration-200',
                  'group flex items-center rounded-md px-3 py-3 text-base font-medium'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon
                  className="mr-4 h-6 w-6 flex-shrink-0"
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Static sidebar for desktop */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex w-64 flex-col">
          <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-800 bg-gray-800 pt-5">
            <div className="flex flex-shrink-0 items-center px-4 mb-6">
              <div className="flex items-center">
                <span className="ml-2 text-xl font-bold text-blue-400">TecniControl</span>
              </div>
            </div>
            <div className="mt-5 flex flex-1 flex-col justify-between">
              <NavLinks />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile menu button */}
        <div className="sticky top-0 z-20 flex h-16 flex-shrink-0 bg-gray-800 shadow-md md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-white hover:bg-gray-700 top-0 left-0 h-full rounded-none"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </Button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1 items-center">
              <span className="text-xl font-bold text-blue-400">TecniControl</span>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <UserProfile />
            </div>
          </div>
        </div>
        
        {/* Header for desktop */}
        <header className="sticky top-0 z-10 hidden md:flex md:items-center md:justify-end md:h-16 md:px-6 bg-gray-800 border-b border-gray-700 shadow-sm">
          <UserProfile />
        </header>

        {/* Mobile sidebar */}
        <div className={cn(
          "fixed inset-0 z-40 flex md:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
            onClick={handleBackdropClick}
          />
          <div className={cn(
            "relative flex w-full max-w-xs flex-1 flex-col bg-gray-800 pt-5 pb-4 transform transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="absolute top-0 right-2 pt-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 hover:bg-black/40"
                aria-label="Cerrar menú de navegación"
              >
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </Button>
            </div>
            <div className="flex flex-shrink-0 items-center px-4 mb-6">
              <span className="text-xl font-bold text-blue-400">TecniControl</span>
            </div>
            <div className="mt-5 h-0 flex-1 overflow-y-auto justify-between flex flex-col">
              <NavLinks onClick={() => setSidebarOpen(false)}/>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto focus:outline-none p-4 sm:p-6 lg:p-8 bg-gray-900">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}