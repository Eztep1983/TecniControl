// hooks/useAndroidBack.ts
//
// Intercepta el gesto/botón de "atrás" de Android (y el botón atrás del navegador)
// cuando un modal está abierto, para cerrarlo en lugar de navegar a la página anterior.
//
// Cómo funciona:
//   1. Cuando `open` pasa a true  → pushea un estado fantasma al historial: history.pushState({modal: true}, "")
//   2. Cuando el usuario presiona "atrás" → el navegador dispara "popstate"
//   3. Capturamos ese evento y llamamos `onClose()` — el historial ya retrocedió al estado anterior, así que no navega.
//   4. Cuando `open` pasa a false por otra razón (ej: el usuario cierra con el botón X) → hacemos history.back() para limpiar el estado fantasma que habíamos pusheado.
//
// Uso:
//   useAndroidBack(open, onClose)

import { useEffect, useRef } from "react";

export function useAndroidBack(open: boolean, onClose: () => void) {
  // Rastreamos si nosotros pusheamos el estado fantasma,
  // para no hacer history.back() si el modal ya se cerró por popstate.
  const pushedRef = useRef(false);

  useEffect(() => {
    if (open) {
      // Modal abierto → pushear estado fantasma
      history.pushState({ modal: true }, "");
      pushedRef.current = true;

      const handlePopState = () => {
        // El navegador ya hizo el "back" consumiendo el estado fantasma.
        // Solo cerramos el modal; no navegamos.
        pushedRef.current = false;
        onClose();
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);

        // Si el modal se cerró por otra razón (botón X, backdrop, etc.)
        // y el estado fantasma todavía está en el historial → limpiarlo.
        if (pushedRef.current) {
          pushedRef.current = false;
          history.back();
        }
      };
    }
  // onClose es estable gracias a useCallback en el padre; está bien en las deps.
  }, [open, onClose]);
}