import { useRef, useCallback } from "react";

interface UseSwipeToCloseOptions {
  onClose: () => void;
  enabled?: boolean;
  threshold?: number;
}

export function useSwipeToClose({ onClose, enabled = true, threshold = 80 }: UseSwipeToCloseOptions) {
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const swipingRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      startYRef.current = e.touches[0].clientY;
      swipingRef.current = true;
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !swipingRef.current) return;
      currentYRef.current = e.touches[0].clientY;
      const delta = currentYRef.current - startYRef.current;
      if (delta > threshold) {
        onClose();
        swipingRef.current = false;
      }
    },
    [enabled, onClose, threshold]
  );

  const handleTouchEnd = useCallback(() => {
    swipingRef.current = false;
  }, []);

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
}