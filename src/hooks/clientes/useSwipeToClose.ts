import { useRef, useCallback } from "react";

interface UseSwipeToCloseOptions {
  onClose: () => void;
  enabled?: boolean;
  threshold?: number;
  scrollRef?: React.RefObject<HTMLElement>;
}

export function useSwipeToClose({ 
  onClose, 
  enabled = true, 
  threshold = 100, // Un poco más alto para evitar cierres accidentales
  scrollRef 
}: UseSwipeToCloseOptions) {
  const startYRef = useRef(0);
  const swipingRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      // Si tenemos un scrollRef, solo permitimos iniciar el swipe si estamos en el tope
      if (scrollRef?.current) {
        if (scrollRef.current.scrollTop > 0) {
          swipingRef.current = false;
          return;
        }
      }

      startYRef.current = e.touches[0].clientY;
      swipingRef.current = true;
    },
    [enabled, scrollRef]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !swipingRef.current) return;

      const currentY = e.touches[0].clientY;
      const delta = currentY - startYRef.current;

      // Si el usuario desliza hacia arriba (finger up, content down), cancelamos el swipe
      if (delta < 0) {
        swipingRef.current = false;
        return;
      }

      // Si estamos scrolleando y llegamos al tope, permitimos el swipe? 
      // Por ahora, si inició con scrollTop > 0, swipingRef es false.

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