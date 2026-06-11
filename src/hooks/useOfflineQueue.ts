// src/hooks/useOfflineQueue.ts
import { useOfflineSync } from '@/components/providers/OfflineSyncProvider'

/**
 * Hook de conveniencia para la cola offline de configuración (tareas/piezas).
 * Redirige todas las operaciones al OfflineSyncProvider global.
 */
export function useOfflineQueue() {
  const context = useOfflineSync()
  
  return {
    enqueue: context.enqueueConfig,
    flush: context.flushConfig,
    pendingCount: context.configPendingCount,
    isFlushing: context.isFlushingConfig,
  }
}
