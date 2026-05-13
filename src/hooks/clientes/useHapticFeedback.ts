import { useCallback } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

/**
 * Hook para manejar feedback háptico de forma multiplataforma.
 * Utiliza Capacitor Haptics en móviles y navigator.vibrate en web.
 */
export function useHapticFeedback() {
  const isCapacitor = typeof window !== "undefined" && !!(window as any).Capacitor;

  const impactLight = useCallback(async () => {
    if (isCapacitor) {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [isCapacitor]);

  const impactMedium = useCallback(async () => {
    if (isCapacitor) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
  }, [isCapacitor]);

  const impactHeavy = useCallback(async () => {
    if (isCapacitor) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
  }, [isCapacitor]);

  const selection = useCallback(async () => {
    if (isCapacitor) {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
    } else if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(5);
    }
  }, [isCapacitor]);

  const success = useCallback(async () => {
    if (isCapacitor) {
      await Haptics.notification({ type: "SUCCESS" as any });
    } else if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
  }, [isCapacitor]);

  const error = useCallback(async () => {
    if (isCapacitor) {
      await Haptics.notification({ type: "ERROR" as any });
    } else if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }, [isCapacitor]);

  return { impactLight, impactMedium, impactHeavy, selection, success, error };
}