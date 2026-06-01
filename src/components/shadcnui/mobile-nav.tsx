"use client";

import React from "react";
import { Package, Users, Plus, ClipboardList, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useMobileNavigation,
  AppView,
} from "@/components/providers/MobileNavigationContext";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { useEstadisticasUsuario } from "@/hooks/useMultiUser";
import { useScrollAware } from "@/hooks/useScrollAware";

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
  const { activeView, navigateTo, triggerNuevaOrden } = useMobileNavigation();
  const { estadisticas } = useEstadisticasUsuario();
  const isKeyboardVisible = useKeyboardVisible();
  const isScrollVisible = useScrollAware(40);

  // Determinar si el nav debe estar oculto (por teclado o por scroll)
  const isHidden = isKeyboardVisible || !isScrollVisible;

  // Determinar qué vista está activa (solo mobile ya que este nav es sm:hidden)
  const isViewActive = (view: AppView) => {
    // Considerar ordenes/mantenimiento como sub-vista de ordenes
    if (view === "ordenes") {
      return activeView === "ordenes" || activeView === "ordenes/mantenimiento";
    }
    return activeView === view;
  };

  const handleNavPress = (view: AppView) => {
    navigateTo(view);
  };

  const handleNuevaOrden = () => {
    if (isViewActive("ordenes")) {
      triggerNuevaOrden();
    } else {
      // Navegar a ordenes y disparar la acción
      navigateTo("ordenes");
      triggerNuevaOrden();
    }
  };

  return (
    <nav
      id="mobile-nav"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 h-[var(--nav-height,4rem)] bg-gray-900/80 border-t border-gray-700 sm:hidden transition-all duration-300 ease-in-out will-change-transform animate-in slide-in-from-bottom",
        isHidden ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      )}
      style={{ 
        paddingBottom: "env(safe-area-inset-bottom)",
        "--nav-height": "4rem" 
      } as React.CSSProperties}
    >
      <div className="flex h-full items-center justify-around px-2 relative">
        {/* Ítems izquierdos */}
        {LEFT_ITEMS.map((item) => {
          const active = isViewActive(item.view);
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => handleNavPress(item.view)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 relative touch-manipulation active:scale-90",
                active ? "text-blue-500" : "text-gray-400 active:text-gray-300"
              )}
              aria-label={item.name}
              aria-pressed={active}
            >
              <div className={cn(
                "transition-all duration-200 flex items-center justify-center",
                active && "bg-blue-500/10 rounded-xl px-3 py-1"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
              {active && (
                <span className="absolute -top-[1px] w-8 h-1 bg-blue-500 rounded-b-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-in fade-in zoom-in-75 duration-150" />
              )}
            </button>
          );
        })}

        {/* Botón FAB central — Nueva Orden */}
        <div className="relative flex justify-center w-full max-w-[80px] -top-1/3">
          <button
            type="button"
            onClick={handleNuevaOrden}
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/40 ring-4 ring-gray-900 transition-all duration-150 ease-out active:scale-95 touch-manipulation",
              estadisticas.totalOrdenes === 0 && "animate-pulse ring-blue-500/50"
            )}
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
              type="button"
              onClick={() => handleNavPress(item.view)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 relative touch-manipulation active:scale-90",
                active ? "text-blue-500" : "text-gray-400 active:text-gray-300"
              )}
              aria-label={item.name}
              aria-pressed={active}
            >
              <div className={cn(
                "transition-all duration-200 flex items-center justify-center",
                active && "bg-blue-500/10 rounded-xl px-3 py-1"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
              {active && (
                <span className="absolute -top-[1px] w-8 h-1 bg-blue-500 rounded-b-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-in fade-in zoom-in-75 duration-150" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
