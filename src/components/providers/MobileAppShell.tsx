"use client";

/**
 * MobileAppShell
 *
 * Renderiza las vistas principales como componentes en mobile,
 * eliminando los full-page reloads de Next.js en Android/Capacitor.
 */

import React, { memo, useEffect, useRef, useState, useLayoutEffect } from "react";
import { useMobileNavigation, AppView } from "@/components/providers/MobileNavigationContext";
import { ROUTES } from "@/lib/navigation-config";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion, PanInfo } from "motion/react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { TAB_ORDER } from "@/lib/navigation-config";

const ViewLoading = () => (
  <div className="flex flex-1 items-center justify-center min-h-[60vh]">
    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
  </div>
);

// Mapeo dinámico de componentes (usando factory explícito para evitar resolución ambigua)
const VIEW_COMPONENTS: Record<AppView, React.ComponentType> = {
  "ordenes": dynamic(() => import("@/app/(app)/ordenes/page"), { loading: () => <ViewLoading />, ssr: false }),
  "clientes": dynamic(() => import("@/app/(app)/clientes/page"), { loading: () => <ViewLoading />, ssr: false }),
  "tareas-repuestos": dynamic(() => import("@/app/(app)/tareas-repuestos/page"), { loading: () => <ViewLoading />, ssr: false }),
  "ordenes/mantenimiento": dynamic(() => import("@/app/(app)/ordenes/mantenimiento/page"), { loading: () => <ViewLoading />, ssr: false }),
  "configuracion": dynamic(() => import("@/app/(app)/configuracion/page"), { loading: () => <ViewLoading />, ssr: false }),
};

// Componente Global del Formulario
const GlobalFormularioMantenimiento = dynamic(
  () => import("@/app/(app)/ordenes/mantenimiento/formulario"),
  { ssr: false }
);

// Vista gestionada: mantiene un historial reciente para liberar memoria (LRU simple: 3 vistas)
const ManagedView = memo(function ManagedView({
  view,
  isActive,
  shouldMount,
}: {
  view: AppView;
  isActive: boolean;
  shouldMount: boolean;
}) {
  const [mounted, setMounted] = useState(isActive || shouldMount);
  const Component = VIEW_COMPONENTS[view];

  useEffect(() => {
    if ((isActive || shouldMount) && !mounted) setMounted(true);
  }, [isActive, shouldMount, mounted]);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: isActive ? "relative" : "absolute",
        visibility: isActive ? "visible" : "hidden",
        top: 0,
        left: 0,
        width: "100%",
        height: isActive ? "auto" : 0,
        overflow: isActive ? "visible" : "hidden",
        opacity: isActive ? 1 : 0,
        pointerEvents: isActive ? "auto" : "none",
      }}
      aria-hidden={!isActive}
      className={isActive ? "z-10" : "z-0"}
    >
      <Component />
    </div>
  );
});

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

    const startX = slideDirection > 0 ? "30%" : slideDirection < 0 ? "-30%" : "0%";
    el.style.transition = "none";
    el.style.transform = `translateX(${startX})`;
    el.style.opacity = "0";
    void el.offsetHeight;
    el.style.transition = "transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.18s ease-out";
    el.style.transform = "translateX(0)";
    el.style.opacity = "1";
  }, [activeView, slideDirection]); 
}

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const { activeView, slideDirection, isMobileNav, isModalOpenLocally, closeModal, navigateTo } = useMobileNavigation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<AppView[]>([activeView]);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const isModalCrearOrdenOpen = isModalOpenLocally || searchParams?.get("modal") === "crear-orden";

  useEffect(() => {
    setHistory(prev => {
      const next = [activeView, ...prev.filter(v => v !== activeView)].slice(0, 3);
      return next;
    });
    
    // Resetear el scroll del contenedor principal al cambiar de tab en mobile
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [activeView]);

  useSlideAnimation(containerRef, activeView, slideDirection);

  if (!isMobileNav) return <>{children}</>;

  const handleDragEnd = async (e: any, info: PanInfo) => {
    const currentIndex = TAB_ORDER.indexOf(activeView);
    if (currentIndex === -1) return;

    const swipeThreshold = 50;
    const { offset, velocity } = info;

    if (offset.x < -swipeThreshold || velocity.x < -500) {
      if (currentIndex < TAB_ORDER.length - 1) {
        await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
        navigateTo(TAB_ORDER[currentIndex + 1]);
      }
    } else if (offset.x > swipeThreshold || velocity.x > 500) {
      if (currentIndex > 0) {
        await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
        navigateTo(TAB_ORDER[currentIndex - 1]);
      }
    }
  };

  return (
    <>
      <motion.div
        drag={TAB_ORDER.includes(activeView) ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
        className="w-full touch-pan-y"
        style={{
          willChange: "transform",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        } as React.CSSProperties}
      >
        <div
          ref={containerRef}
          className="w-full relative"
          style={{
            willChange: "transform, opacity",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
          } as React.CSSProperties}
        >
          {ROUTES.map((route) => (
            <ManagedView
              key={route.view}
              view={route.view}
              isActive={route.view === activeView}
              shouldMount={history.includes(route.view)}
            />
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalCrearOrdenOpen && (
          <GlobalFormularioMantenimiento
            onClose={closeModal}
            onSuccess={(steps) => {
              closeModal(steps);
              // Asegurarse de que volvemos a órdenes si no estábamos ahí
              if (activeView !== "ordenes") {
                setTimeout(() => router.push("/ordenes"), 300);
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
