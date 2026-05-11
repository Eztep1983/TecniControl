// hooks/useAndroidBack.ts
//
// Intercepta el gesto/botón de "atrás" de Android (y el botón atrás del navegador)
// cuando un modal está abierto, para cerrarlo en lugar de navegar a la página anterior.
//
// Versión LIFO (Last-In-First-Out) para soportar modales anidados:
//   Cada instancia genera un ID único y lo guarda en el state del historial.
//   Al detectar popstate, el modal solo se cierra si su ID ya no es el actual.
//

import { useEffect, useRef, useId } from "react";

export function useAndroidBack(open: boolean, onClose: () => void) {
  const id = useId(); // ID único para esta instancia del hook
  const pushedRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    // Pushear estado con el ID único
    if (!pushedRef.current) {
      history.pushState({ modalId: id }, "");
      pushedRef.current = true;
    }

    const handlePopState = (event: PopStateEvent) => {
      // Si el nuevo estado ya no tiene nuestro ID, significa que "volvimos" de nosotros
      const currentStateId = event.state?.modalId;
      
      if (currentStateId !== id) {
        pushedRef.current = false;
        onCloseRef.current();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);

      if (pushedRef.current) {
        pushedRef.current = false;
        
        // Regresamos el historial un paso para mantener el stack limpio
        history.back();
      }
    };
  }, [open, id]);
}