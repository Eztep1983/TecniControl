// src/lib/offline-client-helpers.ts
import { encryptData, decryptData } from './encryption-utils'
import { readOfflineQueue, writeOfflineQueue } from './offline-queue-helpers'
import { deserializeOrdenPayload, serializeOrden } from './orden-serializer'

export type OperationType = 'create' | 'update' | 'delete'
export type EntityType = 'tarea' | 'pieza' | 'cliente'

export interface QueueOperation {
  id: string
  type: OperationType
  entity: EntityType
  payload: any
  userId: string
  timestamp: number
  retries: number
}

export const CONFIG_STORAGE_KEY = 'tec_offline_queue_config'
const MAPPINGS_KEY = 'tec_offline_id_mappings'

export function obtenerIdReal(userId: string, id: string): string {
  if (typeof window === 'undefined' || !id || !id.startsWith('client_temp_')) return id
  const raw = localStorage.getItem(MAPPINGS_KEY)
  if (raw) {
    try {
      const mappings = JSON.parse(raw)
      return mappings[id] || id
    } catch {
      return id
    }
  }
  return id
}

export function registrarIdMapeado(userId: string, tempId: string, realId: string) {
  if (typeof window === 'undefined') return

  // 1. Guardar mapeo en localStorage
  const raw = localStorage.getItem(MAPPINGS_KEY)
  let mappings: Record<string, string> = {}
  if (raw) {
    try {
      mappings = JSON.parse(raw)
    } catch (e) {
      console.error('Error parsing mappings', e)
    }
  }
  mappings[tempId] = realId
  localStorage.setItem(MAPPINGS_KEY, JSON.stringify(mappings))

  // 2. Propagar en la cola de configuración (CONFIG_STORAGE_KEY)
  const configRaw = localStorage.getItem(CONFIG_STORAGE_KEY)
  if (configRaw) {
    const queue = decryptData(configRaw, userId)
    if (queue && Array.isArray(queue)) {
      const updatedQueue = queue.map((op: QueueOperation) => {
        if (op.entity === 'cliente') {
          if (op.type === 'update' && op.payload.id === tempId) {
            return {
              ...op,
              payload: {
                ...op.payload,
                id: realId
              }
            }
          }
        }
        return op
      })
      localStorage.setItem(CONFIG_STORAGE_KEY, encryptData(updatedQueue, userId))
    }
  }

  // 3. Propagar en la cola de órdenes (readOfflineQueue)
  const ordersQueue = readOfflineQueue(userId)
  if (ordersQueue.length > 0) {
    const updatedOrders = ordersQueue.map((item) => {
      const payload = deserializeOrdenPayload(item.payload)
      let changed = false
      if (payload.clienteId === tempId) {
        payload.clienteId = realId
        changed = true
      }
      if (payload.cliente && payload.cliente.id === tempId) {
        payload.cliente.id = realId
        changed = true
      }
      if (changed) {
        return {
          ...item,
          payload: serializeOrden(payload as any, item.tempId)
        }
      }
      return item
    })
    writeOfflineQueue(updatedOrders, userId)
  }
}
