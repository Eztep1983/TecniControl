// src/hooks/useOfflineOrderQueue.ts
import { useOfflineSync } from '@/components/providers/OfflineSyncProvider'

/**
 * Hook de conveniencia para acceder a la cola de órdenes offline.
 * Ahora es solo un wrapper del OfflineSyncProvider global para evitar 
 * race conditions y estados inconsistentes.
 */
export function useOfflineOrderQueue() {
  const context = useOfflineSync()
  
  return {
    enqueueOrder: context.enqueueOrder,
    flush: context.flushOrders,
    pendingCount: context.pendingCount,
    failedCount: context.failedCount,
    isFlushing: context.isFlushing,
    lastSyncResult: context.lastSyncResult,
    generateTempId: context.generateTempId,
  }
}
