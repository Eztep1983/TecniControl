import { useState, useEffect } from 'react';

/**
 * Hook para detectar si el teclado está visible en dispositivos móviles.
 * Útil para ocultar barras de navegación fijas que bloquean la vista.
 */
export function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Método 1: Detección por cambio de altura del viewport (más universal en web móvil)
    let initialHeight = window.innerHeight;
    
    const handleResize = () => {
      // Si la altura actual es significativamente menor que la inicial, el teclado está abierto
      // Usamos un umbral del 25% para evitar falsos positivos por barras de herramientas del navegador
      const currentHeight = window.innerHeight;
      if (initialHeight - currentHeight > initialHeight * 0.25) {
        setIsKeyboardVisible(true);
      } else {
        setIsKeyboardVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);

    // Método 2: Capacitor Keyboard Plugin (si está disponible)
    let keyboardShowListener: any;
    let keyboardHideListener: any;

    const setupCapacitorKeyboard = async () => {
      if ((window as any).Capacitor?.Plugins?.Keyboard) {
        const { Keyboard } = (window as any).Capacitor.Plugins;
        
        keyboardShowListener = await Keyboard.addListener('keyboardWillShow', () => {
          setIsKeyboardVisible(true);
        });
        
        keyboardHideListener = await Keyboard.addListener('keyboardWillHide', () => {
          setIsKeyboardVisible(false);
        });
      }
    };

    setupCapacitorKeyboard();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (keyboardShowListener) keyboardShowListener.remove();
      if (keyboardHideListener) keyboardHideListener.remove();
    };
  }, []);

  return isKeyboardVisible;
}
