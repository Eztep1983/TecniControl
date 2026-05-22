import { Haptics, ImpactStyle } from "@capacitor/haptics";

/**
 * Singleton de feedback háptico — sin hook, sin re-renders.
 * Las funciones son estables por diseño (refs de módulo).
 */

const isCapacitor =
  typeof window !== "undefined" && !!(window as any).Capacitor;

async function impactLight() {
  if (isCapacitor) {
    await Haptics.impact({ style: ImpactStyle.Light });
  } else if (typeof window !== "undefined" && navigator.vibrate) {
    navigator.vibrate(10);
  }
}

async function impactMedium() {
  if (isCapacitor) {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } else if (typeof window !== "undefined" && navigator.vibrate) {
    navigator.vibrate(20);
  }
}

async function impactHeavy() {
  if (isCapacitor) {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } else if (typeof window !== "undefined" && navigator.vibrate) {
    navigator.vibrate(30);
  }
}

async function selection() {
  if (isCapacitor) {
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
  } else if (typeof window !== "undefined" && navigator.vibrate) {
    navigator.vibrate(5);
  }
}

async function success() {
  if (isCapacitor) {
    await Haptics.notification({ type: "SUCCESS" as any });
  } else if (typeof window !== "undefined" && navigator.vibrate) {
    navigator.vibrate([50, 30, 50]);
  }
}

async function error() {
  if (isCapacitor) {
    await Haptics.notification({ type: "ERROR" as any });
  } else if (typeof window !== "undefined" && navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
}

/** Objeto estable — mismo puntero siempre, seguro como dep de useCallback */
export const haptic = {
  impactLight,
  impactMedium,
  impactHeavy,
  selection,
  success,
  error,
} as const;

/**
 * @deprecated Usa `import { haptic } from …` directamente.
 * Se mantiene temporalmente para no romper imports existentes.
 */
export function useHapticFeedback() {
  return haptic;
}