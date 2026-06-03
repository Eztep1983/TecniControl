// src/hooks/useOfflineOrderQueue.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNetworkStatus } from './useNetworkStatus'
import { useAuth } from '@/components/auth/AuthProvider'
import { runTransaction, doc, addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { deserializeOrdenPayload, serializeOrden } from '@/lib/orden-serializer'
import { sanitizeOrdenPayload } from '@/lib/firestore-sanitizers'
import { encryptData, decryptData } from '@/lib/encryption-utils'
import type { PendingOrderQueueItem, SerializableOrdenPayload, TempOrderId } from '@/types/orden'
import type { OrdenMantenimiento } from '@/types/orden'

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'tec_offline_order_queue'
const MAX_RETRIES = 5
const RETRY_BASE_DELAY_MS = 2000
const INTER_ORDER_DELAY_MS = 300  // Pausa entre órdenes para no saturar Firestore

// ─── Helpers de persistencia ──────────────────────────────────────────────────

function readQueue(userId?: string): PendingOrderQueueItem[] {
  if (typeof window === 'undefined') return []
  try {
    const rawData = localStorage.getItem(STORAGE_KEY)
    if (!rawData) return []

    // Intentar descifrar. Si falla (datos antiguos o sin cifrar), intentar parsear normal
    const decrypted = decryptData(rawData, userId)
    if (decrypted && Array.isArray(decrypted)) {
      return decrypted
    }

    // Fallback para compatibilidad con datos no cifrados (migración)
    return JSON.parse(rawData)
  } catch {
    return []
  }
}

function writeQueue(queue: PendingOrderQueueItem[], userId?: string): void {
  if (typeof window === 'undefined') return
  try {
    const encrypted = encryptData(queue, userId)
    localStorage.setItem(STORAGE_KEY, encrypted)
  } catch (e) {
    console.warn('[OfflineOrderQueue] No se pudo persistir la cola:', e)
  }
}

// ─── Executor de una orden pendiente ──────────────────────────────────────────

/**
 * Sincroniza UNA orden pendiente con Firestore usando transacción atómica.
 * Retorna el ID real de Firestore y el consecutivo asignado.
 */
async function syncPendingOrder(
  item: PendingOrderQueueItem
): Promise<{ firestoreId: string; idPersonalizado: string }> {
  const { userId, payload } = item

  // Paso 1: Obtener consecutivo real con transacción atómica
  const contadorRef = doc(db, 'contadores', userId)
  let consecutivo: number = -1

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(contadorRef)
    if (!snap.exists()) {
      consecutivo = 1
      tx.set(contadorRef, {
        userId,
        siguiente: 2,
        ultimaOrden: '',
        fechaActualizacion: new Date()
      })
    } else {
      const data = snap.data()
      consecutivo = data.siguiente
      tx.update(contadorRef, {
        siguiente: consecutivo + 1,
        fechaActualizacion: new Date()
      })
    }
  })
  
  if (consecutivo === -1) {
    throw new Error('No se pudo obtener el consecutivo de la transacción')
  }

  const idPersonalizado = `OSER${consecutivo.toString().padStart(3, '0')}`

  // Paso 2: Reconstruir payload con fecha actual de sincronización
  const ordenPayload = deserializeOrdenPayload(payload)
  const ordenCompleta = sanitizeOrdenPayload({
    ...ordenPayload,
    idPersonalizado,
    updatedAt: new Date(),
  } as any)

  // Paso 3: Guardar en Firestore
  const docRef = await addDoc(collection(db, 'ordenes'), ordenCompleta)

  return { firestoreId: docRef.id, idPersonalizado }
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useOfflineOrderQueue() {
  const { connected } = useNetworkStatus()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [isFlushing, setIsFlushing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<{
    synced: number
    failed: number
    timestamp: number
  } | null>(null)
  const isFlushingRef = useRef(false)

  // Actualizar el contador cuando el usuario esté disponible o cambie
  useEffect(() => {
    if (user?.uid) {
      setPendingCount(readQueue(user.uid).length)
    }
  }, [user?.uid])

  /**
   * Genera un ID temporal único para mostrar al técnico mientras está offline.
   * Formato: OSER-TEMP-1748900000000
   */
  const generateTempId = useCallback((): TempOrderId => {
    return `OSER-TEMP-${Date.now()}` as TempOrderId
  }, [])

  /**
   * Encola una orden para sincronización posterior.
   * Se llama cuando el técnico guarda una orden sin conexión.
   * Retorna el ID temporal para la UI.
   */
  const enqueueOrder = useCallback(
    (ordenData: Omit<OrdenMantenimiento, 'id' | 'idPersonalizado'>, userId: string): TempOrderId => {
      const tempId = generateTempId()
      const queue = readQueue(userId)

      const item: PendingOrderQueueItem = {
        queueId: `oq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        tempId,
        userId,
        payload: serializeOrden(ordenData),
        enqueuedAt: Date.now(),
        retries: 0,
        status: 'pending',
      }

      queue.push(item)
      writeQueue(queue, userId)
      setPendingCount(queue.length)

      console.info(`[OfflineOrderQueue] Orden encolada con ID temporal: ${tempId}`)
      return tempId
    },
    [generateTempId]
  )

  /**
   * Procesa todas las órdenes pendientes en cola.
   * Se llama automáticamente al recuperar conexión.
   * También puede llamarse manualmente.
   */
  const flush = useCallback(
    async (onComplete?: (result: { synced: number; failed: number }) => void): Promise<void> => {
      if (isFlushingRef.current || !user?.uid) return
      const queue = readQueue(user.uid)
      if (queue.length === 0) return

      isFlushingRef.current = true
      setIsFlushing(true)

      const failed: PendingOrderQueueItem[] = []
      let syncedCount = 0

      for (const item of queue) {
        try {
          // Marcar como sincronizando (para debug)
          console.info(`[OfflineOrderQueue] Sincronizando orden ${item.tempId}...`)

          const { firestoreId, idPersonalizado } = await syncPendingOrder(item)

          syncedCount++
          console.info(
            `[OfflineOrderQueue] ✓ Orden sincronizada: ${item.tempId} → ${idPersonalizado} (doc: ${firestoreId})`
          )

          // Pausa inter-operación para no saturar Firestore
          await new Promise(r => setTimeout(r, INTER_ORDER_DELAY_MS))

        } catch (err) {
          console.warn(
            `[OfflineOrderQueue] ✗ Fallo al sincronizar ${item.tempId} (intento ${item.retries + 1}/${MAX_RETRIES}):`,
            err
          )

          if (item.retries < MAX_RETRIES) {
            failed.push({ ...item, retries: item.retries + 1, status: 'failed' })
          } else {
            console.error(
              `[OfflineOrderQueue] Orden ${item.tempId} descartada tras ${MAX_RETRIES} intentos. ` +
              `Payload guardado en consola para recuperación manual.`,
              item.payload
            )
            // TODO Fase 3: Mover a "cola de errores permanentes" con notificación al usuario
          }
        }
      }

      writeQueue(failed, user.uid)
      setPendingCount(failed.length)
      isFlushingRef.current = false
      setIsFlushing(false)

      // Invalidar todas las queries de órdenes para sincronizar UI
      if (syncedCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['ordenes', user.uid] })
        queryClient.invalidateQueries({ queryKey: ['ordenes', user.uid, 'stats'] })
      }

      const result = { synced: syncedCount, failed: failed.length }
      setLastSyncResult({ ...result, timestamp: Date.now() })

      if (onComplete) onComplete(result)
    },
    [user?.uid, queryClient]
  )

  // Auto-flush con delay exponencial al recuperar conexión
  useEffect(() => {
    if (connected && pendingCount > 0 && !isFlushingRef.current) {
      const delay = Math.min(
        RETRY_BASE_DELAY_MS * Math.pow(1.5, 0),  // Primera vez: 2 segundos
        10000  // Máximo: 10 segundos
      )
      const timer = setTimeout(() => flush(), delay)
      return () => clearTimeout(timer)
    }
  }, [connected, pendingCount, flush])

  return {
    enqueueOrder,
    flush,
    pendingCount,
    isFlushing,
    lastSyncResult,
    generateTempId,
  }
}
