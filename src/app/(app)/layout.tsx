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
import { SpeechProvider } from '@/components/auth/SpeechProvider'
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
// Reemplaza el bloque if (loading) { ... } en AppLayout

if (loading) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      {/* Header skeleton */}
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-gray-800 bg-gray-800 px-4">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-700 animate-pulse" />
            <div className="w-28 h-5 rounded-md bg-gray-700 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Dashboard content skeleton */}
      <div className="flex flex-col flex-1 p-4 pb-24 bg-gray-900">
        <div className="max-w-7xl mx-auto w-full space-y-6">

          {/* Greeting block */}
          <div className="bg-gray-900 border-b border-gray-800 -mx-4 px-4 py-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-700/60 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="w-40 h-4 rounded-md bg-gray-700/60 animate-pulse" />
                <div className="w-24 h-3 rounded-md bg-gray-700/40 animate-pulse" />
                <div className="w-32 h-3 rounded-md bg-gray-700/30 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Nueva Orden button */}
          <div className="w-full h-11 rounded-xl bg-blue-600/20 border border-blue-500/10 animate-pulse" />

          {/* Stats section */}
          <div className="space-y-3">
            <div className="w-16 h-3 rounded bg-gray-700/50 animate-pulse ml-1" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="shrink-0 w-32 h-28 rounded-2xl bg-gray-800/60 border border-gray-700/30 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Recent orders section */}
          <div className="space-y-3">
            <div className="w-20 h-3 rounded bg-gray-700/50 animate-pulse ml-1" />
            {[1, 2, 3].map(i => (
              <div key={i} className="w-full h-24 rounded-2xl bg-gray-800/40 border border-gray-700/30 animate-pulse" />
            ))}
          </div>

        </div>
      </div>

      {/* Mobile nav skeleton */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-gray-800 border-t border-gray-700/50 flex items-center justify-around px-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-8 h-8 rounded-xl bg-gray-700/50 animate-pulse" />
        ))}
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
      <SpeechProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col min-h-screen">
            <LayoutContent>{children}</LayoutContent>
          </SidebarInset>
        </SidebarProvider>
      </SpeechProvider>
    </MobileNavigationProvider>
  )
}