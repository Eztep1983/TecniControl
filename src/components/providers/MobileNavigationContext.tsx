"use client";

/**
 * MobileNavigationContext
 *
 * Gestiona la vista activa en mobile sin provocar full-page reloads.
 * En Android/Capacitor cada router.push() de Next.js fuerza una recarga
 * del WebView; este contexto sustituye esa navegación por un swap de
 * componentes en el cliente, manteniendo el estado de TanStack Query.
 *
 * – En mobile (< 640px) el layout renderiza el componente de la vista activa.
 * – En desktop el layout renderiza los `children` normales de Next.js.
 * – Las URLs siguen sincronizadas via history.pushState (sin reload).
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { usePathname } from "next/navigation";

// ─── Tipos de vista ───────────────────────────────────────────────────────────

export type { AppView } from "@/lib/navigation-config";
export { TAB_ORDER } from "@/lib/navigation-config";

import { 
  AppView,
  getRouteByPath,
  getPathByView,
  TAB_ORDER
} from "@/lib/navigation-config";

export type PendingAction = "open-nueva-orden" | null;

// Reemplazar pathnameToView
function pathnameToView(pathname: string): AppView {
  return getRouteByPath(pathname)?.view || "ordenes";
}
// ─── Contexto ─────────────────────────────────────────────────────────────────

interface MobileNavigationContextValue {
  activeView: AppView;
  /** Navegar a una vista (mobile: swap de componente; sincroniza URL) */
  navigateTo: (view: AppView) => void;
  /** Dirección de la animación (1=derecha, -1=izquierda, 0=mismo nivel) */
  slideDirection: number;
  /** true cuando la app corre en modo mobile (< sm breakpoint) */
  isMobileNav: boolean;
  /** Acción pendiente por ejecutar al montar una vista */
  pendingAction: PendingAction;
  /** Disparar la apertura de nueva orden (Deprecated - Use openModal) */
  triggerNuevaOrden: () => void;
  /** Consumir la acción pendiente */
  consumePendingAction: () => void;
  isModalOpenLocally: boolean;
  isOnboardingLocally: boolean;
  modalClienteId: string | null;
  openModal: (options?: { onboarding?: boolean, clienteId?: string }) => void;
  closeModal: (stepsToPop?: number) => void;
}

const MobileNavigationContext = createContext<MobileNavigationContextValue>({
  activeView: "ordenes",
  navigateTo: () => {},
  slideDirection: 0,
  isMobileNav: false,
  pendingAction: null,
  triggerNuevaOrden: () => {},
  consumePendingAction: () => {},
  isModalOpenLocally: false,
  isOnboardingLocally: false,
  modalClienteId: null,
  openModal: () => {},
  closeModal: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MobileNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileNav, setIsMobileNav] = useState(false);
  const [activeView, setActiveView] = useState<AppView>(() =>
    pathnameToView(pathname)
  );
  const [slideDirection, setSlideDirection] = useState(0);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const prevViewRef = useRef<AppView>(activeView);
  
  // Local state for modal to bypass Next.js latency
  const [isModalOpenLocally, setIsModalOpenLocally] = useState(false);
  const [isOnboardingLocally, setIsOnboardingLocally] = useState(false);
  const [modalClienteId, setModalClienteId] = useState<string | null>(null);

  // Detectar si estamos en mobile
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileNav(e.matches);
    };
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Sincronizar vista cuando Next.js navega (deep-link, back/forward)
  useEffect(() => {
    const view = pathnameToView(pathname);
    if (view !== activeView) {
      const prevIdx = TAB_ORDER.indexOf(prevViewRef.current);
      const nextIdx = TAB_ORDER.indexOf(view);
      setSlideDirection(
        nextIdx > prevIdx ? 1 : nextIdx < prevIdx ? -1 : 0
      );
      prevViewRef.current = view;
      setActiveView(view);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigateTo = useCallback(
    (view: AppView) => {
      if (view === activeView) return;

      // Calcular dirección de animación
      const prevIdx = TAB_ORDER.indexOf(activeView);
      const nextIdx = TAB_ORDER.indexOf(view);
      setSlideDirection(
        nextIdx > prevIdx ? 1 : nextIdx < prevIdx ? -1 : 0
      );

      prevViewRef.current = activeView;
      setActiveView(view);

      // Sincronizar URL sin reload (solo en mobile)
      if (isMobileNav) {
        const url = getPathByView(view);
        window.history.pushState({ mobileNav: true, view }, "", url);
      }
    },
    [activeView, isMobileNav]
  );

  // Manejar botón "atrás" del sistema en mobile
  useEffect(() => {
    if (!isMobileNav) return;

    const handlePopState = (e: PopStateEvent) => {
      // Check if modal state was changed
      if (!e.state?.modal && isModalOpenLocally) {
        setIsModalOpenLocally(false);
        setIsOnboardingLocally(false);
      } else if (e.state?.modal === "crear-orden" && !isModalOpenLocally) {
        setIsModalOpenLocally(true);
        setIsOnboardingLocally(e.state?.onboarding === true || e.state?.onboarding === "true");
      }

      if (e.state?.mobileNav && e.state?.view) {
        const view = e.state.view as AppView;
        const prevIdx = TAB_ORDER.indexOf(activeView);
        const nextIdx = TAB_ORDER.indexOf(view);
        setSlideDirection(nextIdx > prevIdx ? 1 : nextIdx < prevIdx ? -1 : 0);
        prevViewRef.current = activeView;
        setActiveView(view);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isMobileNav, activeView, isModalOpenLocally]);

  const openModal = useCallback((options?: { onboarding?: boolean, clienteId?: string }) => {
    setIsModalOpenLocally(true);
    setIsOnboardingLocally(!!options?.onboarding);
    setModalClienteId(options?.clienteId || null);
    // Push state without reloading to trigger back button functionality
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("modal", "crear-orden");
    if (options?.clienteId) {
      currentUrl.searchParams.set("clienteId", options.clienteId);
    }
    if (options?.onboarding) {
      currentUrl.searchParams.set("onboarding", "true");
    } else {
      currentUrl.searchParams.delete("onboarding");
    }
    window.history.pushState(
      {
        mobileNav: true,
        view: activeView,
        modal: "crear-orden",
        onboarding: options?.onboarding,
      },
      "",
      currentUrl.toString()
    );
  }, [activeView]);

  const closeModal = useCallback((stepsToPop: number = 1) => {
    setIsModalOpenLocally(false);
    setIsOnboardingLocally(false);
    setModalClienteId(null);
    // Let the standard back button action take place or pop state manually
    window.history.go(-stepsToPop);
  }, []);

  const triggerNuevaOrden = useCallback(() => {
    setPendingAction("open-nueva-orden");
  }, []);

  const consumePendingAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  return (
    <MobileNavigationContext.Provider
      value={{
        activeView,
        navigateTo,
        slideDirection,
        isMobileNav,
        pendingAction,
        triggerNuevaOrden,
        consumePendingAction,
        isModalOpenLocally,
        isOnboardingLocally,
        modalClienteId,
        openModal,
        closeModal,
      }}
    >
      {children}
    </MobileNavigationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMobileNavigation() {
  return useContext(MobileNavigationContext);
}
