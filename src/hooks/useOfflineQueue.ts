/**
 * Cola offline para operaciones de tareas y piezas.
 *
 * Flujo:
 *   1. Usuario hace una acción sin conexión
 *   2. La operación se guarda en localStorage como cola
 *   3. La UI muestra optimistamente el cambio (via TanStack Query)
 *   4. Al recuperar conexión, la cola se procesa en orden con reintentos
 *   5. TanStack Query invalida y sincroniza con Firestore
 *
 * Por qué localStorage y no IndexedDB aquí:
 *   - Las operaciones son pequeñas (<200 bytes cada una)
 *   - No necesitamos queries complejas sobre la cola
 *   - Disponibilidad síncrona para leer el count inicial
 *   - IndexedDB se justifica para cachear los datos en sí, no la cola
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNetworkStatus } from './useNetworkStatus'
import { useAuth } from '@/components/auth/AuthProvider'
import * as helpers from '@/lib/configuracion-helpers'
import type { TareaPredefinida, PiezaPredefinida } from '@/lib/configuracion-helpers'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type OperationType = 'create' | 'update' | 'delete'
export type EntityType = 'tarea' | 'pieza'

export interface QueueOperation {
  id: string
  type: OperationType
  entity: EntityType
  payload: any
  userId: string
  timestamp: number
  retries: number
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'tec_offline_queue_config'
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

// ─── Helpers de persistencia ──────────────────────────────────────────────────

function readQueue(): QueueOperation[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function writeQueue(queue: QueueOperation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch (e) {
    console.warn('[OfflineQueue] No se pudo persistir la cola:', e)
  }
}

// ─── Executor de operaciones ──────────────────────────────────────────────────

async function executeOperation(op: QueueOperation): Promise<void> {
  const { type, entity, payload, userId } = op

  if (entity === 'tarea') {
    if (type === 'create') {
      await helpers.crearTarea(userId, payload as Omit<TareaPredefinida, 'id'>)
    } else if (type === 'update') {
      await helpers.actualizarTarea(userId, payload as TareaPredefinida)
    } else if (type === 'delete') {
      await helpers.eliminarTarea(userId, payload.id as string)
    }
  } else {
    if (type === 'create') {
      await helpers.crearPieza(userId, payload as Omit<PiezaPredefinida, 'id'>)
    } else if (type === 'update') {
      await helpers.actualizarPieza(userId, payload as PiezaPredefinida)
    } else if (type === 'delete') {
      await helpers.eliminarPieza(userId, payload.id as string)
    }
  }
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useOfflineQueue() {
  const { connected } = useNetworkStatus()
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState<number>(() => readQueue().length)
  const [isFlushing, setIsFlushing] = useState(false)
  const isFlushingRef = useRef(false) // para evitar flushes concurrentes

  // Encolar una operación cuando estamos offline
  const enqueue = useCallback(
    (op: Omit<QueueOperation, 'id' | 'timestamp' | 'retries'>) => {
      const queue = readQueue()
      const item: QueueOperation = {
        ...op,
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        retries: 0,
      }
      queue.push(item)
      writeQueue(queue)
      setPendingCount(queue.length)
    },
    []
  )

  // Procesar toda la cola cuando hay conexión
  const flush = useCallback(
    async (onComplete?: () => void): Promise<void> => {
      if (isFlushingRef.current) return
      const queue = readQueue()
      if (queue.length === 0) return

      isFlushingRef.current = true
      setIsFlushing(true)

      const failed: QueueOperation[] = []

      for (const op of queue) {
        try {
          await executeOperation(op)
          // Pequeña pausa entre operaciones para no saturar Firestore
          await new Promise(r => setTimeout(r, 100))
        } catch (err) {
          console.warn(`[OfflineQueue] Fallo op ${op.id} (intento ${op.retries + 1}):`, err)
          if (op.retries < MAX_RETRIES) {
            failed.push({ ...op, retries: op.retries + 1 })
          } else {
            console.error(`[OfflineQueue] Op ${op.id} descartada tras ${MAX_RETRIES} intentos`)
          }
        }
      }

      writeQueue(failed)
      setPendingCount(failed.length)
      isFlushingRef.current = false
      setIsFlushing(false)

      if (onComplete) onComplete()
    },
    []
  )

  // Auto-flush al recuperar conexión
  useEffect(() => {
    if (connected && pendingCount > 0 && !isFlushingRef.current) {
      // Pequeño delay para asegurarse de que la conexión esté estable
      const timer = setTimeout(() => flush(), RETRY_DELAY_MS)
      return () => clearTimeout(timer)
    }
  }, [connected, pendingCount, flush])

  return {
    enqueue,
    flush,
    pendingCount,
    isFlushing,
  }
}