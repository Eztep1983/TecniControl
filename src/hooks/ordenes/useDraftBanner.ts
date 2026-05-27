import { useEffect, useState, useCallback } from 'react';

export function useDraftBanner() {
  const [hayBorrador, setHayBorrador] = useState(false);

  const syncDraft = useCallback(() => {
    try {
      setHayBorrador(!!localStorage.getItem('draft_mantenimiento'));
    } catch (error) {
      console.warn('LocalStorage error syncing draft:', error);
    }
  }, []);

  useEffect(() => {
    syncDraft();
    
    // Escuchar cambios en otras pestañas o componentes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'draft_mantenimiento') syncDraft();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncDraft]);

  const descartarBorrador = useCallback(() => {
    try {
      localStorage.removeItem('draft_mantenimiento');
      setHayBorrador(false);
    } catch (e) { console.warn(e); }
  }, []);

  return { hayBorrador, setHayBorrador, descartarBorrador, syncDraft };
}
