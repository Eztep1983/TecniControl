"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SplashScreen } from "@capacitor/splash-screen";

// Interceptar y desviar errores del bridge nativo de Capacitor para evitar que
// Next.js muestre la pantalla roja de error (Error Overlay) en desarrollo.
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const stack = new Error().stack || "";
    if (stack.includes("logFromNative") || stack.includes("androidBridge")) {
      console.warn("[Capacitor Native Bridge Error Intercepted]:", ...args);
      return;
    }
    originalConsoleError(...args);
  };
}

export default function CapacitorProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    // Hide the splash screen once the client-side app has mounted
    const hideSplash = async () => {
      try {
        await SplashScreen.hide();
      } catch (error) {
        console.warn("Could not hide splash screen:", error);
      }
    };
    hideSplash();
  }, []);

  // Limpieza global defensiva de estilos de scroll-lock
  // Cuando el usuario navega a otra ruta mientras un modal o drawer estaba abierto (animando su cierre)
  // las librerías como vaul o radix a veces no logran limpiar el body, bloqueando la app entera.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
    document.body.removeAttribute("data-scroll-locked");
    document.body.classList.remove("onboarding-active"); // En caso de que haya quedado pegado
  }, [pathname]);

  return <>{children}</>;
}
