// src/components/providers/OfflineSyncProvider.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useAuth } from '@/components/auth/AuthProvider'
import { runTransaction, doc, addDoc, collection, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { deserializeOrdenPayload, serializeOrden } from '@/lib/orden-serializer'
import { obtenerSiguienteIdDePool } from '@/lib/id-pool-helper'
import { sanitizeOrdenPayload } from '@/lib/firestore-sanitizers'
import { 
  readOfflineQueue, 
  writeOfflineQueue, 
  moveToFailedQueue,
  readFailedQueue,
  OFFLINE_ORDER_STORAGE_KEY 
} from '@/lib/offline-queue-helpers'
import * as configHelpers from '@/lib/configuracion-helpers'
import * as multiuserHelpers from '@/lib/multiuser-helpers'
import { encryptData, decryptData } from '@/lib/encryption-utils'
import type { PendingOrderQueueItem, TempOrderId, OrdenMantenimiento } from '@/types/orden'
import type { TareaPredefinida, PiezaPredefinida } from '@/lib/configuracion-helpers'
import { 
  obtenerIdReal, 
  registrarIdMapeado, 
  CONFIG_STORAGE_KEY, 
  type QueueOperation, 
  type EntityType, 
  type OperationType 
} from '@/lib/offline-client-helpers'

// ─── Tipos del Contexto ───────────────────────────────────────────────────────

interface OfflineSyncContextType {
  // Órdenes
  pendingCount: number
  failedCount: number
  isFlushing: boolean
  lastSyncResult: { synced: number; failed: number; timestamp: number } | null
  enqueueOrder: (ordenData: Omit<OrdenMantenimiento, 'id' | 'idPersonalizado'>, userId: string) => { tempId: TempOrderId; idPersonalizado: string }
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
  } else if (entity === 'pieza') {
    if (type === 'create') {
      await configHelpers.crearPieza(userId, payload as Omit<PiezaPredefinida, 'id'>)
    } else if (type === 'update') {
      await configHelpers.actualizarPieza(userId, payload as PiezaPredefinida)
    } else if (type === 'delete') {
      await configHelpers.eliminarPieza(userId, payload.id as string)
    }
  } else if (entity === 'cliente') {
    if (type === 'create') {
      const { tempId, ...clienteData } = payload
      const realId = await multiuserHelpers.crearCliente(clienteData, userId)
      registrarIdMapeado(userId, tempId, realId)
    } else if (type === 'update') {
      const { id, ...clienteData } = payload
      const realId = obtenerIdReal(userId, id)
      await multiuserHelpers.actualizarCliente(realId, clienteData, userId)
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

  // Deserializar la orden desde la cola offline
  const ordenPayload = deserializeOrdenPayload(payload)

  // Omitir estrictamente tempId para no subirlo a Firestore
  const { tempId: _, ...ordenSinTempId } = ordenPayload as any

  // Si ya tiene un ID real pre-asignado, no necesitamos hacer una transacción
  if (ordenSinTempId.idPersonalizado && !ordenSinTempId.idPersonalizado.startsWith('OSER-TEMP-')) {
    idPersonalizadoFinal = ordenSinTempId.idPersonalizado

    const ordenCompleta = sanitizeOrdenPayload({
      ...ordenSinTempId,
      updatedAt: new Date(),
    } as any)

    await setDoc(nuevaOrdenRef, ordenCompleta)
  } else {
    // Si tiene un ID temporal, reservamos uno nuevo usando la transacción anualizada
    const currentYear = new Date().getFullYear()

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(contadorRef)
      let consecutivo = 1

      if (!snap.exists()) {
        const siguientePorAnio = {
          [currentYear]: 2
        }
        tx.set(contadorRef, {
          userId,
          siguiente: 2, // Para compatibilidad
          ultimaOrden: '',
          fechaActualizacion: new Date(),
          siguientePorAnio
        })
      } else {
        const data = snap.data()
        const siguientePorAnio = data.siguientePorAnio || {}
        consecutivo = siguientePorAnio[currentYear] || 1
        siguientePorAnio[currentYear] = consecutivo + 1

        tx.update(contadorRef, {
          siguientePorAnio,
          fechaActualizacion: new Date()
        })
      }

      idPersonalizadoFinal = `OSER-${currentYear}-${consecutivo.toString().padStart(6, '0')}`

      const ordenCompleta = sanitizeOrdenPayload({
        ...ordenSinTempId,
        idPersonalizado: idPersonalizadoFinal,
        updatedAt: new Date(),
      } as any)

      tx.set(nuevaOrdenRef, ordenCompleta)
    })
  }

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

  const enqueueOrder = useCallback((ordenData: Omit<OrdenMantenimiento, 'id' | 'idPersonalizado'>, userId: string): { tempId: TempOrderId; idPersonalizado: string } => {
    const poolId = obtenerSiguienteIdDePool(userId)
    const tempId = generateTempId()
    const queue = readOfflineQueue(userId)

    const finalId = poolId || tempId

    // Comprobar si el clienteId está mapeado a un ID real
    let finalClienteId = ordenData.clienteId
    let finalCliente = ordenData.cliente ? { ...ordenData.cliente } : undefined
    if (finalClienteId && finalClienteId.startsWith('client_temp_')) {
      const realId = obtenerIdReal(userId, finalClienteId)
      if (realId !== finalClienteId) {
        finalClienteId = realId
        if (finalCliente) {
          finalCliente.id = realId
        }
      }
    }

    const ordenConId = {
      ...ordenData,
      clienteId: finalClienteId,
      cliente: finalCliente,
      idPersonalizado: finalId
    } as any

    const item: PendingOrderQueueItem = {
      queueId: `oq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tempId, userId,
      payload: serializeOrden(ordenConId, tempId),
      enqueuedAt: Date.now(), retries: 0, status: 'pending',
    }
    queue.push(item)
    writeOfflineQueue(queue, userId)
    setPendingCount(queue.length)
    return { tempId, idPersonalizado: finalId }
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
      
      // Buscar la primera orden lista para sincronizar (cuyo cliente ya tiene ID real)
      const nextIdx = q.findIndex(i => {
        if (i.status === 'syncing') return false
        const ordenPayload = deserializeOrdenPayload(i.payload)
        if (ordenPayload.clienteId && ordenPayload.clienteId.startsWith('client_temp_')) {
          const realId = obtenerIdReal(user.uid, ordenPayload.clienteId)
          if (realId === ordenPayload.clienteId) {
            // Aún no tiene ID real (el cliente no se ha sincronizado), saltar por ahora
            return false
          }
        }
        return true
      })
      
      if (nextIdx === -1) break
      const item = q[nextIdx]
      const ordenPayload = deserializeOrdenPayload(item.payload)
      let resolvedItem = item

      // Si tiene cliente temporal y ya existe el mapeo, actualizar el payload localmente antes de sincronizar
      if (ordenPayload.clienteId && ordenPayload.clienteId.startsWith('client_temp_')) {
        const realId = obtenerIdReal(user.uid, ordenPayload.clienteId)
        if (realId !== ordenPayload.clienteId) {
          const updatedPayload = {
            ...ordenPayload,
            clienteId: realId,
            cliente: {
              ...ordenPayload.cliente,
              id: realId
            }
          }
          resolvedItem = {
            ...item,
            payload: serializeOrden(updatedPayload as any, item.tempId)
          }
        }
      }

      try {
        const upQueue = [...q]
        upQueue[nextIdx] = { ...resolvedItem, status: 'syncing' }
        writeOfflineQueue(upQueue, user.uid)

        const { idPersonalizado } = await syncPendingOrder(resolvedItem)
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
    queryClient.invalidateQueries({ queryKey: ['clientes', user.uid] })
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
