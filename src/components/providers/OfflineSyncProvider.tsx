// src/components/providers/OfflineSyncProvider.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useAuth } from '@/components/auth/AuthProvider'
import { runTransaction, doc, addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { deserializeOrdenPayload, serializeOrden } from '@/lib/orden-serializer'
import { sanitizeOrdenPayload } from '@/lib/firestore-sanitizers'
import { 
  readOfflineQueue, 
  writeOfflineQueue, 
  moveToFailedQueue,
  readFailedQueue,
  OFFLINE_ORDER_STORAGE_KEY 
} from '@/lib/offline-queue-helpers'
import * as configHelpers from '@/lib/configuracion-helpers'
import { encryptData, decryptData } from '@/lib/encryption-utils'
import type { PendingOrderQueueItem, TempOrderId, OrdenMantenimiento } from '@/types/orden'
import type { TareaPredefinida, PiezaPredefinida } from '@/lib/configuracion-helpers'

// ─── Tipos de Configuración ──────────────────────────────────────────────────

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

const CONFIG_STORAGE_KEY = 'tec_offline_queue_config'

// ─── Tipos del Contexto ───────────────────────────────────────────────────────

interface OfflineSyncContextType {
  // Órdenes
  pendingCount: number
  failedCount: number
  isFlushing: boolean
  lastSyncResult: { synced: number; failed: number; timestamp: number } | null
  enqueueOrder: (ordenData: Omit<OrdenMantenimiento, 'id' | 'idPersonalizado'>, userId: string) => TempOrderId
  flushOrders: () => Promise<void>
  generateTempId: () => TempOrderId
  
  // Configuración
  configPendingCount: number
  isFlushingConfig: boolean
  enqueueConfig: (op: Omit<QueueOperation, 'id' | 'timestamp' | 'retries'>) => void
  flushConfig: () => Promise<void>
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined)

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_RETRIES_ORDERS = 5
const MAX_RETRIES_CONFIG = 3
const RETRY_BASE_DELAY_MS = 2000
const INTER_OP_DELAY_MS = 200

// ─── Executor de Configuración ───────────────────────────────────────────────

async function executeConfigOperation(op: QueueOperation): Promise<void> {
  const { type, entity, payload, userId } = op

  if (entity === 'tarea') {
    if (type === 'create') {
      await configHelpers.crearTarea(userId, payload as Omit<TareaPredefinida, 'id'>)
    } else if (type === 'update') {
      await configHelpers.actualizarTarea(userId, payload as TareaPredefinida)
    } else if (type === 'delete') {
      await configHelpers.eliminarTarea(userId, payload.id as string)
    }
  } else {
    if (type === 'create') {
      await configHelpers.crearPieza(userId, payload as Omit<PiezaPredefinida, 'id'>)
    } else if (type === 'update') {
      await configHelpers.actualizarPieza(userId, payload as PiezaPredefinida)
    } else if (type === 'delete') {
      await configHelpers.eliminarPieza(userId, payload.id as string)
    }
  }
}

// ─── Executor de Órdenes ─────────────────────────────────────────────────────

async function syncPendingOrder(
  item: PendingOrderQueueItem
): Promise<{ firestoreId: string; idPersonalizado: string }> {
  const { userId, payload } = item

  const contadorRef = doc(db, 'contadores', userId)
  const nuevaOrdenRef = doc(collection(db, 'ordenes'))
  let idPersonalizadoFinal = ''

  await runTransaction(db, async (tx) => {
    // 1. Obtener y actualizar contador
    const snap = await tx.get(contadorRef)
    let consecutivo = 1

    if (!snap.exists()) {
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

    idPersonalizadoFinal = `OSER${consecutivo.toString().padStart(3, '0')}`

    // 2. Deserializar la orden desde la cola offline
    const ordenPayload = deserializeOrdenPayload(payload)

    // 3. Omitir estrictamente tempId para no subirlo a Firestore
    const { tempId: _, ...ordenSinTempId } = ordenPayload as any

    const ordenCompleta = sanitizeOrdenPayload({
      ...ordenSinTempId,
      idPersonalizado: idPersonalizadoFinal,
      updatedAt: new Date(),
    } as any)

    // 4. Escribir documento en la transacción
    tx.set(nuevaOrdenRef, ordenCompleta)
  })

  return { firestoreId: nuevaOrdenRef.id, idPersonalizado: idPersonalizadoFinal }
}

// ─── Proveedor ────────────────────────────────────────────────────────────────

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connected } = useNetworkStatus()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // Estados de Órdenes
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [isFlushing, setIsFlushing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<{synced: number, failed: number, timestamp: number} | null>(null)
  
  // Estados de Configuración
  const [configPendingCount, setConfigPendingCount] = useState(0)
  const [isFlushingConfig, setIsFlushingConfig] = useState(false)

  const isFlushingOrdersRef = useRef(false)
  const isFlushingConfigRef = useRef(false)

  // 1. Lectura inicial y listeners de storage
  useEffect(() => {
    if (!user?.uid) return

    const updateAllCounts = () => {
      // Órdenes
      setPendingCount(readOfflineQueue(user.uid).length)
      setFailedCount(readFailedQueue(user.uid).length)
      
      // Configuración
      const configRaw = localStorage.getItem(CONFIG_STORAGE_KEY)
      if (configRaw) {
        const decrypted = decryptData(configRaw, user.uid)
        if (decrypted && Array.isArray(decrypted)) {
          setConfigPendingCount(decrypted.length)
        }
      } else {
        setConfigPendingCount(0)
      }
    }

    updateAllCounts()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === OFFLINE_ORDER_STORAGE_KEY || e.key === CONFIG_STORAGE_KEY) {
        updateAllCounts()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(updateAllCounts, 30000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [user?.uid])

  // ─── Métodos de Órdenes ────────────────────────────────────────────────────

  const generateTempId = useCallback((): TempOrderId => `OSER-TEMP-${Date.now()}` as TempOrderId, [])

  const enqueueOrder = useCallback((ordenData: Omit<OrdenMantenimiento, 'id' | 'idPersonalizado'>, userId: string): TempOrderId => {
    const tempId = generateTempId()
    const queue = readOfflineQueue(userId)
    const item: PendingOrderQueueItem = {
      queueId: `oq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tempId, userId,
      payload: serializeOrden(ordenData, tempId),
      enqueuedAt: Date.now(), retries: 0, status: 'pending',
    }
    queue.push(item)
    writeOfflineQueue(queue, userId)
    setPendingCount(queue.length)
    return tempId
  }, [generateTempId])

  const flushOrders = useCallback(async () => {
    if (isFlushingOrdersRef.current || !user?.uid || !navigator.onLine) return
    const queue = readOfflineQueue(user.uid)
    if (queue.length === 0) return

    isFlushingOrdersRef.current = true
    setIsFlushing(true)
    let syncedCount = 0

    while (true) {
      if (!navigator.onLine) break
      const q = readOfflineQueue(user.uid)
      const nextIdx = q.findIndex(i => i.status !== 'syncing')
      if (nextIdx === -1) break
      const item = q[nextIdx]

      try {
        const upQueue = [...q]
        upQueue[nextIdx] = { ...item, status: 'syncing' }
        writeOfflineQueue(upQueue, user.uid)

        const { idPersonalizado } = await syncPendingOrder(item)
        const finalQ = readOfflineQueue(user.uid).filter(i => i.queueId !== item.queueId)
        writeOfflineQueue(finalQ, user.uid)
        setPendingCount(finalQ.length)
        syncedCount++
        console.info(`[Sync] Órden OK: ${idPersonalizado}`)
        await new Promise(r => setTimeout(r, INTER_OP_DELAY_MS))
      } catch (err) {
        console.warn(`[Sync] Error Órden ${item.tempId}:`, err)
        const fQ = readOfflineQueue(user.uid)
        const fIdx = fQ.findIndex(i => i.queueId === item.queueId)
        if (fIdx !== -1) {
          if (item.retries < MAX_RETRIES_ORDERS) {
            fQ[fIdx] = { ...item, retries: item.retries + 1, status: 'failed' }
            writeOfflineQueue(fQ, user.uid)
          } else {
            moveToFailedQueue(item, user.uid)
            const finalQ = fQ.filter(i => i.queueId !== item.queueId)
            writeOfflineQueue(finalQ, user.uid)
            setFailedCount(readFailedQueue(user.uid).length)
          }
          setPendingCount(readOfflineQueue(user.uid).length)
        }
        break
      }
    }

    isFlushingOrdersRef.current = false
    setIsFlushing(false)
    if (syncedCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['ordenes', user.uid] })
      queryClient.invalidateQueries({ queryKey: ['ordenes', user.uid, 'stats'] })
    }
    setLastSyncResult({ synced: syncedCount, failed: readOfflineQueue(user.uid).length, timestamp: Date.now() })
  }, [user?.uid, queryClient])

  // ─── Métodos de Configuración ──────────────────────────────────────────────

  const enqueueConfig = useCallback((op: Omit<QueueOperation, 'id' | 'timestamp' | 'retries'>) => {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY)
    let queue: QueueOperation[] = []
    if (raw) {
      const decrypted = decryptData(raw, op.userId)
      if (decrypted && Array.isArray(decrypted)) queue = decrypted
    }
    const item: QueueOperation = {
      ...op,
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      retries: 0,
    }
    queue.push(item)
    const encrypted = encryptData(queue, op.userId)
    localStorage.setItem(CONFIG_STORAGE_KEY, encrypted)
    setConfigPendingCount(queue.length)
  }, [])

  const flushConfig = useCallback(async () => {
    if (isFlushingConfigRef.current || !user?.uid || !navigator.onLine) return
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (!raw) return
    const queue: QueueOperation[] = decryptData(raw, user.uid)
    if (!queue || queue.length === 0) return

    isFlushingConfigRef.current = true
    setIsFlushingConfig(true)
    const failed: QueueOperation[] = []

    for (const op of queue) {
      if (!navigator.onLine) {
        failed.push(...queue.slice(queue.indexOf(op)))
        break
      }
      try {
        await executeConfigOperation(op)
        await new Promise(r => setTimeout(r, INTER_OP_DELAY_MS))
      } catch (err) {
        console.warn(`[Sync] Error Config ${op.id}:`, err)
        if (op.retries < MAX_RETRIES_CONFIG) {
          failed.push({ ...op, retries: op.retries + 1 })
        }
      }
    }

    const encrypted = encryptData(failed, user.uid)
    localStorage.setItem(CONFIG_STORAGE_KEY, encrypted)
    setConfigPendingCount(failed.length)
    isFlushingConfigRef.current = false
    setIsFlushingConfig(false)
    
    // Invalidar queries relacionadas
    queryClient.invalidateQueries({ queryKey: ['tareas', user.uid] })
    queryClient.invalidateQueries({ queryKey: ['piezas', user.uid] })
  }, [user?.uid, queryClient])

  // ─── Auto-flush Orchestration ──────────────────────────────────────────────

  useEffect(() => {
    if (connected && (pendingCount > 0 || configPendingCount > 0)) {
      const timer = setTimeout(() => {
        if (pendingCount > 0) flushOrders()
        if (configPendingCount > 0) flushConfig()
      }, RETRY_BASE_DELAY_MS)
      return () => clearTimeout(timer)
    }
  }, [connected, pendingCount, configPendingCount, flushOrders, flushConfig])

  const value = {
    pendingCount, failedCount, isFlushing, lastSyncResult, enqueueOrder, flushOrders, generateTempId,
    configPendingCount, isFlushingConfig, enqueueConfig, flushConfig
  }

  return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>
}

export const useOfflineSync = () => {
  const context = useContext(OfflineSyncContext)
  if (!context) throw new Error('useOfflineSync must be used within OfflineSyncProvider')
  return context
}
