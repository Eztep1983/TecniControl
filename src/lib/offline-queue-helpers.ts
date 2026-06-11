// src/lib/offline-queue-helpers.ts
import { encryptData, decryptData } from './encryption-utils'
import type { PendingOrderQueueItem } from '@/types/orden'

export const OFFLINE_ORDER_STORAGE_KEY = 'tec_offline_order_queue'
export const FAILED_ORDER_STORAGE_KEY = 'tec_failed_order_queue'

export function readOfflineQueue(userId?: string): PendingOrderQueueItem[] {
  if (typeof window === 'undefined' || !userId) return []
  try {
    const rawData = localStorage.getItem(OFFLINE_ORDER_STORAGE_KEY)
    if (!rawData) return []

    // Intentar descifrar.
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

export function writeOfflineQueue(queue: PendingOrderQueueItem[], userId?: string): void {
  if (typeof window === 'undefined' || !userId) return
  try {
    const encrypted = encryptData(queue, userId)
    localStorage.setItem(OFFLINE_ORDER_STORAGE_KEY, encrypted)
  } catch (e) {
    console.warn('[OfflineQueueHelpers] No se pudo persistir la cola:', e)
  }
}

export function readFailedQueue(userId?: string): PendingOrderQueueItem[] {
  if (typeof window === 'undefined' || !userId) return []
  try {
    const rawData = localStorage.getItem(FAILED_ORDER_STORAGE_KEY)
    if (!rawData) return []
    const decrypted = decryptData(rawData, userId)
    return (decrypted && Array.isArray(decrypted)) ? decrypted : []
  } catch {
    return []
  }
}

export function writeFailedQueue(queue: PendingOrderQueueItem[], userId?: string): void {
  if (typeof window === 'undefined' || !userId) return
  try {
    const encrypted = encryptData(queue, userId)
    localStorage.setItem(FAILED_ORDER_STORAGE_KEY, encrypted)
  } catch (e) {
    console.warn('[OfflineQueueHelpers] No se pudo persistir la cola de fallos:', e)
  }
}

/**
 * Mueve una orden de la cola activa a la cola de fallos permanentes.
 */
export function moveToFailedQueue(item: PendingOrderQueueItem, userId: string): void {
  const failedQueue = readFailedQueue(userId)
  // Evitar duplicados en la cola de fallos
  if (!failedQueue.some(i => i.queueId === item.queueId)) {
    failedQueue.push({ ...item, status: 'failed' })
    writeFailedQueue(failedQueue, userId)
  }
}

/**
 * Obtiene todos los tempIds que están actualmente en la cola (pendientes o fallidos).
 */
export function getPendingTempIds(userId?: string): Set<string> {
  const queue = readOfflineQueue(userId)
  const failed = readFailedQueue(userId)
  return new Set([...queue.map(item => item.tempId), ...failed.map(item => item.tempId)])
}
