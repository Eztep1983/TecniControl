"use client";

/**
 * MobileAppShell
 *
 * Renderiza las vistas principales como componentes en mobile,
 * eliminando los full-page reloads de Next.js en Android/Capacitor.
 *
 * Estrategia de animación + keep-alive:
 * - Todas las vistas se montan una sola vez con display:block/none.
 * - La animación se logra deslizando TODO el contenedor de vistas
 *   y luego reseteando la posición (invisible) para la siguiente.
 * - Esto preserva el estado de React Query, paginación, formularios, etc.
 * - En desktop retorna los children de Next.js sin modificación.
 */

import React, { memo, useEffect, useRef, useState, useLayoutEffect } from "react";
import { useMobileNavigation, AppView } from "@/components/providers/MobileNavigationContext";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// ─── Loading placeholder ───────────────────────────────────────────────────────
const ViewLoading = () => (
  <div className="flex flex-1 items-center justify-center min-h-[60vh]">
    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
  </div>
);

// ─── Vistas (lazy + ssr:false para evitar hydration mismatch) ─────────────────
const OrdenesDashboard = dynamic(
  () => import("@/app/(app)/ordenes/page"),
  { loading: () => <ViewLoading />, ssr: false }
);
const OrdenesMantenimiento = dynamic(
  () => import("@/app/(app)/ordenes/mantenimiento/page"),
  { loading: () => <ViewLoading />, ssr: false }
);
const ClientesView = dynamic(
  () => import("@/app/(app)/clientes/page"),
  { loading: () => <ViewLoading />, ssr: false }
);
const TareasView = dynamic(
  () => import("@/app/(app)/tareas-repuestos/page"),
  { loading: () => <ViewLoading />, ssr: false }
);
const ConfiguracionView = dynamic(
  () => import("@/app/(app)/configuracion/page"),
  { loading: () => <ViewLoading />, ssr: false }
);

const VIEW_COMPONENTS: Record<AppView, React.ComponentType> = {
  ordenes: OrdenesDashboard,
  "ordenes/mantenimiento": OrdenesMantenimiento,
  clientes: ClientesView,
  "tareas-repuestos": TareasView,
  configuracion: ConfiguracionView,
};

const ALL_VIEWS = Object.keys(VIEW_COMPONENTS) as AppView[];

// ─── Vista keep-alive: permanece en el DOM, solo visible cuando está activa ───
const KeepAliveView = memo(function KeepAliveView({
  view,
  isActive,
}: {
  view: AppView;
  isActive: boolean;
}) {
  const [mounted, setMounted] = useState(isActive);
  const Component = VIEW_COMPONENTS[view];

  useEffect(() => {
    if (isActive && !mounted) setMounted(true);
  }, [isActive, mounted]);

  if (!mounted) return null;

  return (
    <div
      style={{ display: isActive ? "block" : "none" }}
      aria-hidden={!isActive}
    >
      <Component />
    </div>
  );
});

// ─── Componente de animación de slide ────────────────────────────────────────
/**
 * Usamos una animación CSS con requestAnimationFrame en lugar de Framer Motion
 * para evitar el problema de key-remount que destruiría el keep-alive.
 *
 * El contenedor exterior (.slide-container) se anima:
 * 1. Empieza traducido en X (según dirección)
 * 2. Transiciona a translateX(0)
 *
 * Las vistas previamente visitadas permanecen montadas con display:none.
 */
function useSlideAnimation(
  containerRef: React.RefObject<HTMLDivElement | null>,
  activeView: AppView,
  slideDirection: number
) {
  const prevView = useRef<AppView>(activeView);
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (prevView.current === activeView) return;

    prevView.current = activeView;

    // Dirección: 1 = nueva vista viene de la derecha, -1 = de la izquierda
    const startX = slideDirection > 0 ? "30%" : slideDirection < 0 ? "-30%" : "0%";

    // Aplicar estado inicial sin transición
    el.style.transition = "none";
    el.style.transform = `translateX(${startX})`;
    el.style.opacity = "0";

    // Forzar reflow para que el browser procese el estado inicial
    void el.offsetHeight;

    // Animar al estado final
    el.style.transition = "transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.18s ease-out";
    el.style.transform = "translateX(0)";
    el.style.opacity = "1";
  }, [activeView]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── Shell principal ──────────────────────────────────────────────────────────
export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const { activeView, slideDirection, isMobileNav } = useMobileNavigation();
  const containerRef = useRef<HTMLDivElement>(null);

  useSlideAnimation(containerRef, activeView, slideDirection);

  // En desktop: renderizar children normales de Next.js
  if (!isMobileNav) {
    return <>{children}</>;
  }

  // En mobile: shell de componentes con animación slide sin remount
  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{
        willChange: "transform, opacity",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
      } as React.CSSProperties}
    >
      {ALL_VIEWS.map((view) => (
        <KeepAliveView
          key={view}
          view={view}
          isActive={view === activeView}
        />
      ))}
    </div>
  );
}
