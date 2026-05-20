import { useState, useEffect } from 'react';

/**
 * Hook para detectar si el teclado está visible en dispositivos móviles.
 *
 * Prioridad de detección:
 *  1. Capacitor Keyboard plugin  (apps nativas iOS/Android)
 *  2. visualViewport API         (web móvil: iOS Safari + Android Chrome)
 *  3. window.innerHeight         (fallback para browsers sin visualViewport)
 */
export function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Sincronizar el estado con el DOM global para permitir control CSS sin re-renders
  useEffect(() => {
    if (isKeyboardVisible) {
      document.body.setAttribute('data-keyboard-visible', 'true');
    } else {
      document.body.removeAttribute('data-keyboard-visible');
    }
  }, [isKeyboardVisible]);

  useEffect(() => {
    // ── 1. Capacitor ────────────────────────────────────────────────────────
    const Keyboard = (window as any).Capacitor?.Plugins?.Keyboard;
    if (Keyboard) {
      let showListener: any = null;
      let hideListener: any = null;
      let mounted = true;

      Keyboard.addListener('keyboardWillShow', () => {
        if (mounted) setIsKeyboardVisible(true);
      }).then((l: any) => { if (mounted) showListener = l; });

      Keyboard.addListener('keyboardWillHide', () => {
        if (mounted) setIsKeyboardVisible(false);
      }).then((l: any) => { if (mounted) hideListener = l; });

      return () => {
        mounted = false;
        showListener?.remove();
        hideListener?.remove();
      };
    }

    // ── 2. visualViewport (iOS Safari + Android Chrome) ──────────────────────
    // window.innerHeight  → layout viewport, NO cambia con el teclado en iOS
    // visualViewport.height → SÍ se reduce cuando aparece el teclado
    // La diferencia entre ambos = altura ocupada por el teclado
    if (window.visualViewport) {
      const handler = () => {
        const occupied = window.innerHeight - window.visualViewport!.height;
        setIsKeyboardVisible(occupied > 150);
      };
      window.visualViewport.addEventListener('resize', handler);
      return () => window.visualViewport!.removeEventListener('resize', handler);
    }

    // ── 3. Fallback: window resize + focusin/out ─────────────────────────────
    const initialHeight = window.innerHeight;
    let timer: ReturnType<typeof setTimeout>;

    const check = () => {
      setIsKeyboardVisible(window.innerHeight < initialHeight * 0.75);
    };

    const onResize = () => { clearTimeout(timer); timer = setTimeout(check, 100); };
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el?.matches('input,textarea,[contenteditable]')) {
        clearTimeout(timer);
        timer = setTimeout(check, 350);
      }
    };
    const onFocusOut = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIsKeyboardVisible(false), 100);
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  return isKeyboardVisible;
}