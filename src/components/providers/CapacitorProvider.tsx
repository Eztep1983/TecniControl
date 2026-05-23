"use client";

import { useEffect } from "react";
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

  return <>{children}</>;
}
