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
    const Keyboard = (window as any).Capacitor?.Plugins?.Keyboard;
    let mounted = true;

    const setVisible = (visible: boolean) => {
      if (mounted) setIsKeyboardVisible(visible);
    };

    if (Keyboard) {
      const showHandlers: any[] = [];
      const hideHandlers: any[] = [];

      const showKeyboard = () => setVisible(true);
      const hideKeyboard = () => setVisible(false);

      const registerListener = (eventName: string, handler: () => void, targetList: any[]) => {
        const maybeListener = Keyboard.addListener(eventName, handler);
        if (maybeListener?.then) {
          maybeListener.then((listener: any) => {
            if (mounted) targetList.push(listener);
          });
        } else {
          targetList.push(maybeListener);
        }
      };

      registerListener('keyboardWillShow', showKeyboard, showHandlers);
      registerListener('keyboardDidShow', showKeyboard, showHandlers);
      registerListener('keyboardWillHide', hideKeyboard, hideHandlers);
      registerListener('keyboardDidHide', hideKeyboard, hideHandlers);

      return () => {
        mounted = false;
        showHandlers.forEach((l) => l?.remove());
        hideHandlers.forEach((l) => l?.remove());
      };
    }

    const initialHeight = window.innerHeight;
    const threshold = Math.max(80, initialHeight * 0.12);

    const updateState = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const occupied = window.innerHeight - viewportHeight;
      const shouldBeVisible = occupied > threshold;
      setVisible(shouldBeVisible);
    };

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target?.matches('input,textarea,[contenteditable]')) {
        setVisible(true);
      }
    };

    const onFocusOut = () => {
      setTimeout(() => setVisible(false), 100);
    };

    const onResize = () => {
      updateState();
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize);
    }

    return () => {
      mounted = false;
      window.removeEventListener('resize', onResize);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onResize);
      }
    };
  }, []);

  return isKeyboardVisible;
}