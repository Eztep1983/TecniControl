"use client";

import { useEffect } from "react";
import { SplashScreen } from "@capacitor/splash-screen";

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
