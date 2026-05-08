'use client';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NetworkStatusBanner = () => {
  const { connected } = useNetworkStatus();

  return (
    <AnimatePresence>
      {!connected && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-amber-500 text-gray-900 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center space-x-2 text-sm font-bold">
            <WifiOff className="w-4 h-4" />
            <span>Estás en modo offline. Los cambios se sincronizarán al recuperar la conexión.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
