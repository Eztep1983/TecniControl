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

const navigation = [
  { 
    name: 'Ordenes de Servicio', 
    href: '/ordenes', 
    icon: Package 
  },
  { 
    name: 'Clientes', 
    href: '/clientes', 
    icon: Users 
  },
  { 
    name: 'Tareas y Repuestos', 
    href: '/tareas-repuestos', 
    icon: ClipboardList 
  },
]

const secondaryNavigation = [
  { 
    name: 'Configuración', 
    href: '/configuracion', 
    icon: Settings 
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()
  const { prefetchOrdenes, prefetchClientes } = usePrefetchData()

  // Close sidebar on mobile when clicking a link
  const handleLinkClick = () => {
    if (isMobile) {
      // Close the sidebar without interfering with Next.js navigation
      // Remove the history entry if it exists
      if (window.history.state?.sidebarOpen) {
        // Use replaceState instead of back() to avoid navigation conflicts
        window.history.replaceState(
          { ...window.history.state, sidebarOpen: false },
          ''
        )
      }
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar side="left">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/ordenes" className="flex items-center gap-2" onClick={handleLinkClick}>
                <div className="flex aspect-square size-14 items-center justify-center rounded-lg overflow-hidden bg-black">
                  <img 
                    src={icono.src} 
                    alt="TecniControl" 
                    className="w-full h-full object-cover"
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
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href) && item.href !== '/' || pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive}
                    >
                      <Link 
                        href={item.href} 
                        onClick={handleLinkClick}
                        onMouseEnter={() => {
                          if (item.href === '/ordenes') prefetchOrdenes();
                          if (item.href === '/clientes') prefetchClientes();
                        }}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive}
                    >
                      <Link href={item.href} onClick={handleLinkClick}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}