// src/components/ui/OfflineSyncBanner.tsx
'use client'
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useOfflineOrderQueue } from '@/hooks/useOfflineOrderQueue'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export function OfflineSyncBanner() {
  const { pendingCount, isFlushing, flush, lastSyncResult } = useOfflineOrderQueue()
  const { connected } = useNetworkStatus()

  // No mostrar si no hay nada pendiente y hay conexión
  if (pendingCount === 0 && connected && !lastSyncResult) return null

  // Banner: sin conexión + hay pendientes
  if (!connected && pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 
                      px-4 py-2.5 rounded-xl text-amber-400 text-xs font-medium mb-4">
        <CloudOff className="w-4 h-4 shrink-0" />
        <span>
          {pendingCount} {pendingCount === 1 ? 'orden guardada' : 'órdenes guardadas'} localmente.
          Se sincronizarán al recuperar conexión.
        </span>
      </div>
    )
  }

  // Banner: hay conexión + hay pendientes (sincronizando)
  if (connected && pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 
                      px-4 py-2.5 rounded-xl text-blue-400 text-xs font-medium mb-4">
        <RefreshCw className={`w-4 h-4 shrink-0 ${isFlushing ? 'animate-spin' : ''}`} />
        <span>
          {isFlushing
            ? `Sincronizando ${pendingCount} ${pendingCount === 1 ? 'orden' : 'órdenes'}...`
            : `${pendingCount} ${pendingCount === 1 ? 'orden pendiente' : 'órdenes pendientes'} de sincronización`
          }
        </span>
        {!isFlushing && (
          <button
            onClick={() => flush()}
            className="ml-auto text-blue-300 hover:text-blue-100 underline"
          >
            Sincronizar ahora
          </button>
        )}
      </div>
    )
  }

  // Banner: sincronización completada
  if (lastSyncResult && lastSyncResult.synced > 0 && Date.now() - lastSyncResult.timestamp < 10000) {
    return (
      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 
                      px-4 py-2.5 rounded-xl text-green-400 text-xs font-medium animate-in fade-in duration-300 mb-4">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>
          {lastSyncResult.synced} {lastSyncResult.synced === 1 ? 'orden sincronizada' : 'órdenes sincronizadas'} correctamente
          {lastSyncResult.failed > 0 && ` · ${lastSyncResult.failed} con error`}
        </span>
      </div>
    )
  }

  return null
}
