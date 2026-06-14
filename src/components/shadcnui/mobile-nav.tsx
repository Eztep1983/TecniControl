"use client";

import React from "react";
import { Users, Plus, ClipboardList, Settings, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useMobileNavigation,
  AppView,
} from "@/components/providers/MobileNavigationContext";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { useEstadisticasUsuario } from "@/hooks/useMultiUser";
import { useScrollAware } from "@/hooks/useScrollAware";
import { haptic } from "@/hooks/clientes/useHapticFeedback";

interface NavItemConfig {
  name: string;
  view: AppView;
  icon: React.ComponentType<{ className?: string }>;
}

const LEFT_ITEMS: NavItemConfig[] = [
  { name: "Órdenes", view: "ordenes", icon: ClipboardList },
  { name: "Clientes", view: "clientes", icon: Users },
];

const RIGHT_ITEMS: NavItemConfig[] = [
  { name: "Tareas y repuestos", view: "tareas-repuestos", icon: Hammer },
  { name: "Ajustes", view: "configuracion", icon: Settings },
];

export function MobileNav() {
  const { activeView, navigateTo, openModal } = useMobileNavigation();
  const { estadisticas } = useEstadisticasUsuario();
  const isKeyboardVisible = useKeyboardVisible();
  const isScrollVisible = useScrollAware(80);

  const isHidden = isKeyboardVisible || !isScrollVisible;

  const isViewActive = (view: AppView) => {
    return activeView === view;
  };

  const handleNavPress = (view: AppView) => {
    haptic.impactLight();
    navigateTo(view);
  };

  const handleNuevaOrden = () => {
    haptic.impactMedium();
    openModal();
  };

  return (
    <>
      <style>{`
        @media (orientation: portrait) {
          #mobile-nav-bg {
            mask-image: radial-gradient(circle 42px at 50% 0px, transparent 42px, black 43px);
            -webkit-mask-image: radial-gradient(circle 42px at 50% 0px, transparent 42px, black 43px);
          }
        }
      `}</style>
      <nav
        id="mobile-nav"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "flex items-center justify-center",
          "sm:hidden",
          "overflow-visible",
          "min-h-[calc(5rem+env(safe-area-inset-bottom))] landscape:min-h-[calc(4rem+env(safe-area-inset-bottom))] h-auto",
          "transition-[transform,opacity] duration-200 ease-out",
          "[padding-left:env(safe-area-inset-left)]",
          "[padding-right:env(safe-area-inset-right)]",
          isHidden 
            ? "translate-y-full opacity-0 pointer-events-none" 
            : "translate-y-0 opacity-100 pointer-events-auto"
        )}
      >
        {/* Fondo con Notch y Blur */}
        <div 
          id="mobile-nav-bg"
          className="absolute inset-0 bg-gray-900/75 backdrop-blur-xl border-t border-gray-600/40 pointer-events-none"
        />

        {/* Container interno para mejor control de espacio */}
        <div className="w-full h-full flex items-center justify-between px-2 sm:px-4 relative z-10">
          
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
          <div className="w-[72px] flex-shrink-0" aria-hidden />

          {/* Botón FAB central — Nueva Orden */}
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-0 mt-1">
            <button
              type="button"
              onClick={handleNuevaOrden}
              className={cn(
                "flex items-center justify-center",
                "w-16 h-16 rounded-full",
                "bg-gradient-to-tr from-blue-600 to-blue-400",
                "shadow-[0_8px_30px_rgb(59,130,246,0.3)]",
                "ring-[6px] ring-gray-900/40",
                estadisticas.totalOrdenes === 0 ? "ring-blue-500/50" : "",
                "active:scale-90 active:shadow-md",
                "transition-all duration-200 ease-out",
                "touch-manipulation"
              )}
              aria-label="Nueva orden"
              aria-describedby="new-order-hint"
            >
              <Plus className="w-8 h-8 text-white" />
            </button>
            <span id="new-order-hint" className="sr-only">
              Crear nueva orden de trabajo
            </span>
          </div>

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
    </>
  );
}

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
        "flex-1 flex flex-col items-center justify-center relative min-w-[44px]",
        "h-full min-h-[56px]",
        "space-y-1",
        "transition-all duration-200 ease-out",
        "touch-manipulation",
        active 
          ? "text-blue-500" 
          : "text-gray-400 hover:text-gray-300 active:text-gray-300"
      )}
      aria-label={item.name}
      aria-pressed={active}
      aria-current={active ? "page" : undefined}
    >
      <div className={cn(
        "flex items-center justify-center",
        "transition-transform duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)",
        "rounded-xl p-2.5",
        active ? "bg-blue-500/10 scale-110" : "scale-100"
      )}>
        <Icon className="w-[22px] h-[22px] stroke-[2.5]" />
      </div>

      {/* Label and active dot indicator */}
      <span className={cn(
        "text-[10px] font-bold tracking-wide transition-opacity duration-200",
        active ? "opacity-100" : "opacity-0 absolute"
      )}>
        {item.name}
      </span>


    </button>
  );
}