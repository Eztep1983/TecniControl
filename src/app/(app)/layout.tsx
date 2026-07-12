// src/app/(app)/layout.tsx
"use client"

import React, { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import icono from "@/public/icono.png"
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/shadcnui/app-sidebar"
import { useAuth } from '@/components/auth/AuthProvider'
import { Separator } from "@/components/ui/separator"
import Link from 'next/link'
import { MobileNav } from '@/components/shadcnui/mobile-nav'
import { PageTransition } from '@/components/ui/PageTransition'
import { NetworkStatusBanner } from '@/components/ui/NetworkStatusBanner'
import { MobileNavigationProvider } from '@/components/providers/MobileNavigationContext'
import { SpeechProvider } from '@/components/auth/SpeechProvider'
import { MobileAppShell } from '@/components/providers/MobileAppShell'
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton'

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const mainRef = React.useRef<HTMLElement>(null)

  // Cerrar sidebar en mobile y hacer scroll to top cuando cambia la ruta
  useEffect(() => {
    setOpenMobile(false)
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    }
  }, [pathname, setOpenMobile])

  return (
    <>
      <NetworkStatusBanner />
      <main 
        ref={mainRef}
        className="flex flex-col flex-1 overflow-y-auto p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-6 lg:p-8 lg:pb-8 dark:bg-gray-900 bg-gray-100"
      >
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
  return <DashboardSkeleton />
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