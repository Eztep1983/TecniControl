import { useRef, useEffect } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => void;
  enabled?: boolean;
  threshold?: number;
}

export function usePullToRefresh({ onRefresh, enabled = true, threshold = 80 }: UsePullToRefreshOptions) {
  const startYRef = useRef(0);
  const refreshingRef = useRef(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (container.scrollTop > 0) return;

      const deltaY = e.touches[0].clientY - startYRef.current;
      if (deltaY > threshold && !refreshingRef.current) {
        refreshingRef.current = true;
        onRefresh();
        setTimeout(() => {
          refreshingRef.current = false;
        }, 1000);
      }
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
    };
  }, [enabled, onRefresh, threshold]);

  return { containerRef };
}