import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect scroll direction and determine if a UI element should be visible.
 * Hides on scroll down, shows on scroll up.
 * Includes a threshold to prevent flickering on small scrolls.
 */
export function useScrollAware(threshold: number = 20) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      // If we are at the very top, always show
      if (currentScrollY <= 0) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Only change state if we scrolled more than the threshold
      if (Math.abs(diff) > threshold) {
        if (diff > 0 && isVisible) {
          // Scrolling down
          setIsVisible(false);
        } else if (diff < 0 && !isVisible) {
          // Scrolling up
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible, threshold]);

  return isVisible;
}
