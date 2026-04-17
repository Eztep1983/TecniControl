// hooks/useAndroidBack.ts
//
// Intercepta el gesto/botón de "atrás" de Android (y el botón atrás del navegador)
// cuando un modal está abierto, para cerrarlo en lugar de navegar a la página anterior.
//
// Cómo funciona:
//   1. Cuando `open` pasa a true  → pushea un estado fantasma al historial
//   2. Cuando el usuario presiona "atrás" → el navegador dispara "popstate"
//   3. Capturamos ese evento y llamamos `onClose()` — el historial ya retrocedió
//   4. Cuando `open` pasa a false por otra razón → limpiamos el estado fantasma
//
// Fix aplicado:
//   - history.back() en el cleanup se difiere con setTimeout(0) para evitar
//     que el evento "popstate" llegue mientras React está reconciliando,
//     lo que causaba "Expected static flag was missing".
//   - onCloseRef evita que el effect se re-ejecute si el padre pasa una nueva
//     referencia de onClose (aunque sea estable por useCallback, es una garantía extra).

import { useEffect, useRef } from "react";

export function useAndroidBack(open: boolean, onClose: () => void, onEdit?: () => void) {
  // Rastreamos si nosotros pusheamos el estado fantasma
  const pushedRef = useRef(false);

  // Ref para onClose: el effect nunca necesita re-ejecutarse por un cambio
  // en la identidad de onClose, solo por cambios en `open`.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }); // sin deps → siempre actualizado, nunca causa re-ejecución del effect principal

  useEffect(() => {
    if (!open) return;

    // Pushear estado fantasma solo si no lo hemos pusheado ya
    if (!pushedRef.current) {
      history.pushState({ modal: true }, "");
      pushedRef.current = true;
    }

    const handlePopState = () => {
      // El navegador ya consumió el estado fantasma con su propio back.
      // Solo cerramos el modal.
      pushedRef.current = false;
      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);

      // Si el modal se cerró por otra razón (botón X, backdrop, etc.)
      // y el estado fantasma todavía está en el historial → limpiarlo.
      //
      // CRÍTICO: history.back() es asíncrono — dispara "popstate" en un tick
      // futuro. Sin el setTimeout, ese evento puede llegar mientras React está
      // en medio de una fase de reconciliación, corrompiendo los static flags
      // y causando: "Expected static flag was missing".
      if (pushedRef.current) {
        pushedRef.current = false;
        (window as any).__ignoring_next_popstate__ = true;
        setTimeout(() => {
          history.back();
          setTimeout(() => {
            (window as any).__ignoring_next_popstate__ = false;
          }, 50);
        }, 0);
      }
    };
  }, [open]); // onClose excluido intencionalmente — se accede vía onCloseRef
}