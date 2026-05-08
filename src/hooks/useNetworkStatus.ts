import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

export const useNetworkStatus = () => {
  const [status, setStatus] = useState({
    connected: true,
    connectionType: 'unknown' as any,
  });

  useEffect(() => {
    let handler: any;

    // Estado inicial
    const checkInitialStatus = async () => {
      try {
        const initialStatus = await Network.getStatus();
        setStatus(initialStatus);

        // Solo intentar agregar el listener si getStatus funcionó (plugin disponible)
        handler = await Network.addListener('networkStatusChange', (status) => {
          setStatus(status);
        });
      } catch (e) {
        console.warn('Network plugin not available, using web fallback');
        setStatus({
          connected: window.navigator.onLine,
          connectionType: 'wifi',
        });
      }
    };

    checkInitialStatus();

    // Fallback de navegador siempre activo para redundancia
    const handleOnline = () => setStatus(prev => ({ ...prev, connected: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, connected: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (handler) {
        handler.remove();
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
};
