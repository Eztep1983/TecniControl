"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Package, Users, Plus, ClipboardList, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useMobileNavigation,
  AppView,
} from "@/components/providers/MobileNavigationContext";

interface NavItemConfig {
  name: string;
  view: AppView;
  icon: React.ComponentType<{ className?: string }>;
}

const LEFT_ITEMS: NavItemConfig[] = [
  { name: "Órdenes", view: "ordenes", icon: Package },
  { name: "Clientes", view: "clientes", icon: Users },
];

const RIGHT_ITEMS: NavItemConfig[] = [
  { name: "Tareas", view: "tareas-repuestos", icon: ClipboardList },
  { name: "Ajustes", view: "configuracion", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeView, navigateTo, isMobileNav } = useMobileNavigation();

  // Determinar qué vista está activa
  // En mobile usamos el contexto; en desktop usamos el pathname
  const isViewActive = (view: AppView) => {
    if (isMobileNav) {
      // Considerar ordenes/mantenimiento como sub-vista de ordenes
      if (view === "ordenes") {
        return activeView === "ordenes" || activeView === "ordenes/mantenimiento";
      }
      return activeView === view;
    }
    // Fallback a pathname para desktop (aunque no se muestra en sm+)
    const href = `/${view}`;
    if (view === "ordenes") {
      return pathname === "/ordenes";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleNavPress = (view: AppView) => {
    if (isMobileNav) {
      navigateTo(view);
    } else {
      router.push(`/${view}`);
    }
  };

  const handleNuevaOrden = (e: React.MouseEvent) => {
    e.preventDefault();
    const isOnOrdenes =
      isMobileNav
        ? activeView === "ordenes" || activeView === "ordenes/mantenimiento"
        : pathname === "/ordenes";

    if (isOnOrdenes) {
      window.dispatchEvent(new CustomEvent("open-nueva-orden"));
    } else {
      if (isMobileNav) {
        // Navegar a ordenes y luego abrir el formulario
        navigateTo("ordenes");
        // Pequeño delay para que el componente monte
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("open-nueva-orden"));
        }, 250);
      } else {
        router.push("/ordenes?nueva=true");
      }
    }
  };

  return (
    <nav
      id="mobile-nav"
      className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-gray-900/95 border-t border-gray-800 sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-full items-center justify-around px-2 relative">
        {/* Ítems izquierdos */}
        {LEFT_ITEMS.map((item) => {
          const active = isViewActive(item.view);
          return (
            <button
              key={item.name}
              onClick={() => handleNavPress(item.view)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative touch-manipulation",
                active ? "text-blue-500" : "text-gray-400 active:text-gray-300"
              )}
              aria-label={item.name}
              aria-pressed={active}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
              {active && (
                <span className="absolute -top-[1px] w-8 h-1 bg-blue-500 rounded-b-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
            </button>
          );
        })}

        {/* Botón FAB central — Nueva Orden */}
        <div className="relative -top-5 flex justify-center w-full max-w-[80px]">
          <button
            onClick={handleNuevaOrden}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/40 border-4 border-gray-900 transition-transform active:scale-95 touch-manipulation"
            aria-label="Nueva orden"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {/* Ítems derechos */}
        {RIGHT_ITEMS.map((item) => {
          const active = isViewActive(item.view);
          return (
            <button
              key={item.name}
              onClick={() => handleNavPress(item.view)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative touch-manipulation",
                active ? "text-blue-500" : "text-gray-400 active:text-gray-300"
              )}
              aria-label={item.name}
              aria-pressed={active}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
              {active && (
                <span className="absolute -top-[1px] w-8 h-1 bg-blue-500 rounded-b-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
