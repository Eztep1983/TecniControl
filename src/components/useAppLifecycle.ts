//Este hook escucha los eventos de la aplicacion y recarga la sesion
//Esto se hace para que la sesion no expire mientras la aplicacion esta abierta
//O cuando la aplicacion ha estado en segundo plano por mas de 1 hora minutos
//La estoy usando en el AuthGuard
'use client';
import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './auth/AuthProvider';

// Reload threshold (e.g. 5 minutes in background)
const RELOAD_THRESHOLD_MS = 60 * 60 * 1000; //1 hora

export const useAppLifecycle = () => {
  const { refreshSession } = useAuth();
  const [lastBackgroundTime, setLastBackgroundTime] = useState<number | null>(null);

  useEffect(() => {
    // Para Capacitor (Nativo)
    let appStateListener: any;
    
    if (Capacitor.isNativePlatform()) {
      appStateListener = App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          // Entró a segundo plano
          setLastBackgroundTime(Date.now());
        } else {
          // Volvió al primer plano
          refreshSession();
          
          if (lastBackgroundTime) {
            const timeInBackground = Date.now() - lastBackgroundTime;
            // Si estuvo mucho tiempo en segundo plano, recargamos la app para refrescar todo
            if (timeInBackground > RELOAD_THRESHOLD_MS) {
              window.location.reload();
            }
          }
        }
      });
    }

    // Para Web (Navegador)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setLastBackgroundTime(Date.now());
      } else {
        refreshSession();
        
        if (lastBackgroundTime) {
          const timeInBackground = Date.now() - lastBackgroundTime;
          if (timeInBackground > RELOAD_THRESHOLD_MS) {
            window.location.reload();
          }
        }
      }
    };

    if (!Capacitor.isNativePlatform()) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (appStateListener) {
        appStateListener.then((listener: any) => listener.remove());
      }
      if (!Capacitor.isNativePlatform()) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [lastBackgroundTime, refreshSession]);
};
