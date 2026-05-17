// src/app/(app)/layout.tsx
"use client"

import React, { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import icono from "@/public/icono.png"
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/shadcnui/app-sidebar"
import { UserProfile } from '@/components/auth/UserProfile'
import { useAuth } from '@/components/auth/AuthProvider'
import { Separator } from "@/components/ui/separator"
import Link from 'next/link'
import { MobileNav } from '@/components/shadcnui/mobile-nav'
import { PageTransition } from '@/components/ui/PageTransition'
import { NetworkStatusBanner } from '@/components/ui/NetworkStatusBanner'
import { MobileNavigationProvider } from '@/components/providers/MobileNavigationContext'
import { MobileAppShell } from '@/components/providers/MobileAppShell'

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  // Cerrar sidebar en mobile cuando cambia la ruta
  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  return (
    <>
      <NetworkStatusBanner />
      <header id="main-header" data-navigation="header" className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-gray-800 px-4">
        <SidebarTrigger className="hidden sm:flex -ml-1 text-gray-300 hover:text-white hover:bg-gray-700" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-gray-700" />
        <div className="flex flex-1 items-center justify-between">
          <Link 
            href="/ordenes"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <div className="mr-2 flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-black">
              <img 
                src={icono.src} 
                alt="TecniControl" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl font-bold text-blue-400">TecniControl</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-col flex-1 overflow-y-auto p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-6 lg:p-8 lg:pb-8 bg-gray-900">
        <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 relative">
          {/* 
            MobileAppShell intercepta la navegación en mobile renderizando
            componentes en lugar de hacer full-page reloads de Next.js.
            En desktop retorna los children normales con PageTransition.
          */}
          <MobileAppShell>
            <PageTransition>
              {children}
            </PageTransition>
          </MobileAppShell>
        </div>
      </main>
      <MobileNav />
    </>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

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

  return (
    <MobileNavigationProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col min-h-screen">
          <LayoutContent>{children}</LayoutContent>
        </SidebarInset>
      </SidebarProvider>
    </MobileNavigationProvider>
  )
}