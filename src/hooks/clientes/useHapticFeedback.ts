import { useCallback } from "react";

export function useHapticFeedback() {
  const impactLight = useCallback(() => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  const impactMedium = useCallback(() => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
  }, []);

  const impactHeavy = useCallback(() => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
  }, []);

  const selection = useCallback(() => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(5);
    }
  }, []);

  const success = useCallback(() => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
  }, []);

  const error = useCallback(() => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }, []);

  return { impactLight, impactMedium, impactHeavy, selection, success, error };
}