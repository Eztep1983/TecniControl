'use client';
// Este hook escucha los eventos de la aplicación y recarga la sesión
// solo cuando la app vuelve al primer plano tras estar en segundo plano
// más de REFRESH_THRESHOLD_MS. Si estuvo más de RELOAD_THRESHOLD_MS,
// recarga la página entera en lugar de solo refrescar la sesión.
// Se usa en AuthGuard.

import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './auth/AuthProvider';

// Solo refrescar sesión si estuvo en background más de este tiempo.
// Evita escribir en Firestore por cambios de pestaña de pocos segundos.
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;  // 5 minutos

// Si estuvo más de este tiempo, recargar la app entera para refrescar todo.
const RELOAD_THRESHOLD_MS = 60 * 60 * 1000;  // 1 hora

export const useAppLifecycle = () => {
  const { refreshSession } = useAuth();
  const lastBackgroundTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const handleForeground = () => {
      const backgroundTime = lastBackgroundTimeRef.current;

      // Si no hay timestamp, la app acaba de montar — no hacer nada
      if (backgroundTime === null) return;

      const timeInBackground = Date.now() - backgroundTime;
      lastBackgroundTimeRef.current = null; // reset

      // ✅ FIX: Primero verificar si hay que hacer reload.
      // Si sí, no tiene sentido llamar refreshSession porque la página
      // se va a destruir de todas formas.
      if (timeInBackground > RELOAD_THRESHOLD_MS) {
        window.location.reload();
        return;
      }

      // ✅ FIX: Solo refrescar sesión si estuvo en background un tiempo
      // significativo. Sin este umbral, cualquier cambio de pestaña
      // (aunque sea de 2 segundos) escribe en Firestore e invalida
      // queries de TanStack Query, causando refrescos visibles.
      if (timeInBackground > REFRESH_THRESHOLD_MS) {
        refreshSession();
      }
    };

    const handleBackground = () => {
      lastBackgroundTimeRef.current = Date.now();
    };

    // ── Capacitor (nativo iOS / Android) ──────────────────────────────
    let listenerPromise: Promise<any> | null = null;

    if (Capacitor.isNativePlatform()) {
      listenerPromise = App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          handleForeground();
        } else {
          handleBackground();
        }
      });
    }

    // ── Web (navegador) ───────────────────────────────────────────────
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBackground();
      } else {
        handleForeground();
      }
    };

    if (!Capacitor.isNativePlatform()) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (listenerPromise) {
        listenerPromise.then((listener) => listener?.remove());
      }
      if (!Capacitor.isNativePlatform()) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [refreshSession]);
};