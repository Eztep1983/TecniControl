// src/components/app-sidebar.tsx
"use client"

import * as React from "react"
import {
  Users,
  Package,
  Settings,
  ClipboardList,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import icono from "@/public/icono.png"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { usePrefetchData } from "@/hooks/useMultiUser"
import {
  useMobileNavigation,
  AppView,
} from "@/components/providers/MobileNavigationContext"

const navigation: { name: string; href: string; view: AppView; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    name: 'Ordenes de Servicio',
    href: '/ordenes',
    view: 'ordenes',
    icon: Package,
  },
  {
    name: 'Clientes',
    href: '/clientes',
    view: 'clientes',
    icon: Users,
  },
  {
    name: 'Tareas y Repuestos',
    href: '/tareas-repuestos',
    view: 'tareas-repuestos',
    icon: ClipboardList,
  },
]

const secondaryNavigation: { name: string; href: string; view: AppView; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    name: 'Configuración',
    href: '/configuracion',
    view: 'configuracion',
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()
  const { prefetchOrdenes, prefetchClientes } = usePrefetchData()
  const { activeView, navigateTo, isMobileNav } = useMobileNavigation()

  const isActive = (href: string, view: AppView) => {
    if (isMobileNav) {
      // En mobile usamos el estado del contexto
      return activeView === view
    }
    // En desktop usamos el pathname de Next.js
    return pathname.startsWith(href) && href !== '/' || pathname === href
  }

  const handleNavClick = (
    e: React.MouseEvent,
    view: AppView,
  ) => {
    if (isMobile) {
      if (window.history.state?.sidebarOpen) {
        window.history.replaceState(
          { ...window.history.state, sidebarOpen: false },
          ''
        )
      }
      setOpenMobile(false)
    }

    // En mobile, interceptar la navegación para usar el shell de componentes
    if (isMobileNav) {
      e.preventDefault()
      navigateTo(view)
    }
    // En desktop: el Link de Next.js maneja la navegación normalmente
  }

  return (
    <Sidebar side="left">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link
                href="/ordenes"
                className="flex items-center gap-2"
                onClick={(e) => handleNavClick(e, 'ordenes')}
              >
                <div 
                  className="flex aspect-square size-14 items-center justify-center rounded-lg overflow-hidden bg-white dark:bg-white"
                  style={{ backgroundColor: 'white' }}
                >
                  <img
                    src={icono.src}
                    alt="TecniControl"
                    className="w-full h-full object-cover"
                    style={{ backgroundColor: 'white' }}
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">TecniControl</span>
                  <span className="text-xs text-muted-foreground">Gestión de Servicios Técnicos</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href, item.view)}
                  >
                    <Link
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.view)}
                      onMouseEnter={() => {
                        if (item.view === 'ordenes') prefetchOrdenes()
                        if (item.view === 'clientes') prefetchClientes()
                      }}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href, item.view)}
                  >
                    <Link
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.view)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}