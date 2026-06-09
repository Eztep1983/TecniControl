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
  const isScrollVisible = useScrollAware(80); // ↑ Aumentado a 80px para menos flicker

  // Determinar si el nav debe estar oculto
  const isHidden = isKeyboardVisible || !isScrollVisible;

  const isViewActive = (view: AppView) => {
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
      navigateTo("ordenes");
      // Disparar después de navegar (deferred) — permite montar listeners
      setTimeout(() => triggerNuevaOrden(), 0);
    }
  };

  return (
    <nav
      id="mobile-nav"
      className={cn(
        // Base styles
        "fixed bottom-0 left-0 right-0 z-50",
        "flex items-center justify-center",
        "bg-gray-900/95 backdrop-blur-md",
        "border-t border-gray-600/40",
        "sm:hidden",
        // Allow FAB to overflow the nav without being clipped
        "overflow-visible",
        // Height responsive and respect safe-area-inset-bottom
        "min-h-[calc(5rem+env(safe-area-inset-bottom))] landscape:min-h-[calc(4rem+env(safe-area-inset-bottom))] h-auto",
        // Transitions
        "transition-all duration-200 ease-out",
        // Safe area lateral padding
        "[padding-left:env(safe-area-inset-left)]",
        "[padding-right:env(safe-area-inset-right)]",
        // Hidden state
        isHidden 
          ? "translate-y-full opacity-0 pointer-events-none" 
          : "translate-y-0 opacity-100 pointer-events-auto"
      )}
    >
      {/* Container interno para mejor control de espacio */}
      <div className="w-full h-full flex items-center justify-between px-2 sm:px-4 relative">
        
        {/* Ítems izquierdos */}
        <div className="flex flex-1 items-center justify-start gap-1 sm:gap-2">
          {LEFT_ITEMS.map((item) => {
            const active = isViewActive(item.view);
            return (
              <NavButton
                key={item.name}
                item={item}
                active={active}
                onClick={() => handleNavPress(item.view)}
              />
            );
          })}
        </div>

        {/* Espaciador central para reservar el espacio del FAB y evitar solapamientos */}
        <div className="w-16 landscape:w-12 flex-shrink-0" aria-hidden />

        {/* Botón FAB central — Nueva Orden */}
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/6">
          <button
            type="button"
            onClick={handleNuevaOrden}
            className={cn(
              // Base
              "flex items-center justify-center",
              "w-16 h-16 rounded-full landscape:w-12 landscape:h-12",
              // Gradient & Shadow
              "bg-gradient-to-tr from-blue-600 to-blue-400",
              "shadow-lg shadow-blue-500/40",
              "ring-4",
              // ring color depends on stats
              estadisticas.totalOrdenes === 0 ? "ring-blue-500/50" : "ring-gray-900 ring-opacity-90",
              // Interactions
              "active:scale-95 active:shadow-md",
              "transition-all duration-150 ease-out",
              "touch-manipulation",
              // Loading state
              // (handled above)
            )}
            aria-label="Nueva orden"
            aria-describedby="new-order-hint"
          >
            <Plus className="w-8 h-8 text-white landscape:w-6 landscape:h-6" />
          </button>
          <span id="new-order-hint" className="sr-only">
            Crear nueva orden de trabajo
          </span>
        </div>

        {/* Landscape-only floating FAB (smaller, positioned corner) */}
        <button
          type="button"
          onClick={handleNuevaOrden}
          className={cn(
            "hidden landscape:flex fixed bottom-4 right-4 z-50 items-center justify-center",
            "w-12 h-12 rounded-full",
            "bg-gradient-to-tr from-blue-600 to-blue-400",
            "shadow-lg shadow-blue-500/40",
            "ring-4",
            estadisticas.totalOrdenes === 0 ? "ring-blue-500/50" : "ring-gray-900 ring-opacity-90",
            "active:scale-95 active:shadow-md",
            "transition-all duration-150 ease-out",
            "touch-manipulation"
          )}
          aria-label="Nueva orden"
          aria-describedby="new-order-hint-landscape"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
        <span id="new-order-hint-landscape" className="sr-only">
          Crear nueva orden de trabajo
        </span>

        {/* Ítems derechos */}
        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          {RIGHT_ITEMS.map((item) => {
            const active = isViewActive(item.view);
            return (
              <NavButton
                key={item.name}
                item={item}
                active={active}
                onClick={() => handleNavPress(item.view)}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/**
 * Componente NavButton reutilizable para reducir duplicación
 */
interface NavButtonProps {
  item: NavItemConfig;
  active: boolean;
  onClick: () => void;
}

function NavButton({ item, active, onClick }: NavButtonProps) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Base flex & sizing
        "flex-1 flex flex-col items-center justify-center relative min-w-[44px]",
        "h-full min-h-[56px]", // Mínimo WCAG AAA (48x48px)
        "space-y-0.5 sm:space-y-1",
        // Transitions
        "transition-all duration-200 ease-out",
        "touch-manipulation",
        // Active/Inactive colors
        active 
          ? "text-blue-500" 
          : "text-gray-400 hover:text-gray-300 active:text-gray-300"
      )}
      aria-label={item.name}
      aria-pressed={active}
      aria-current={active ? "page" : undefined}
    >
      {/* Icon container */}
      <div className={cn(
        "flex items-center justify-center",
        "transition-all duration-200 ease-out",
        "rounded-lg p-2", // Aumentar padding interno
        active && "bg-blue-500/15 scale-110"
      )}>
        <Icon className="w-6 h-6" /> {/* ↑ Aumentado de 5 a 6 */}
      </div>

      {/* Label */}
      <span className="text-xs font-medium leading-tight text-center px-1">
        {item.name}
      </span>

      {/* Active indicator bar - Mejorado */}
      {active && (
        <div className="absolute -bottom-2 w-full h-1 bg-blue-500 rounded-t-full motion-safe:animate-in motion-safe:fade-in duration-150" />
      )}
    </button>
  );
}