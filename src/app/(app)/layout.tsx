// src/app/(app)/layout.tsx
"use client"

import React, { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/shadcnui/app-sidebar"
import { UserProfile } from '@/components/auth/UserProfile'
import { useAuth } from '@/components/auth/AuthProvider'
import { Separator } from "@/components/ui/separator"
import Link from 'next/link'

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  // Cerrar sidebar en mobile cuando cambia la ruta
  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-gray-800 px-4">
        <SidebarTrigger className="-ml-1 text-gray-300 hover:text-white hover:bg-gray-700" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-gray-700" />
        <div className="flex flex-1 items-center justify-between">
          <Link 
            href="/ordenes"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <span className="text-xl font-bold text-blue-400">TecniControl</span>
          </Link>
          <UserProfile />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <LayoutContent>{children}</LayoutContent>
      </SidebarInset>
    </SidebarProvider>
  )
}