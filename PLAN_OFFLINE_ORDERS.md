# Plan de Implementación: Persistencia Offline de Órdenes de Servicio
### TecniControl — Arquitectura de Cola Local Asíncrona para Órdenes en Campo

---

> **Versión:** 1.0 · **Fecha:** 2026-06-02  
> **Autores:** Análisis técnico generado por Antigravity (Google DeepMind)  
> **Estado:** Propuesta para revisión y aprobación

---

## 1. Diagnóstico Técnico: El Problema Actual

### 1.1 Flujo Actual (Bloqueante)

```
[Usuario pulsa "Guardar Orden"]
        │
        ▼
generarIdPorTipo(userId)         ← SINCRÓNICO con Firestore
        │
        ├─ ¿window.navigator.onLine? ──── NO ──► OSER<timestamp> (sin cola, no se guarda)
        │
        └─ SÍ ──► incrementarContador(userId)
                    │
                    ▼
             getDoc("contadores/userId")   ← Llamada de red #1
             updateDoc("contadores/userId") ← Llamada de red #2
                    │
                    ▼
             crearOrden(ordenCompleta, userId) ← Llamada de red #3
```

**Resultado en campo sin cobertura:**
- El check `window.navigator.onLine` devuelve `false` → se genera `OSER<timestamp>` temporal
- Pero **la orden NUNCA se persiste localmente** — se descarta silenciosamente
- Al perder conexión a mitad del flujo, Firestore puede dejar el contador incrementado sin orden asociada (contador desincronizado)

### 1.2 Cuello de Botella de Escalabilidad: El Contador Global

```typescript
// multiuser-helpers.ts – líneas 344-370
export const incrementarContador = async (userId: string): Promise<number> => {
  const contadorRef = doc(db, 'contadores', userId)
  const contadorDoc = await getDoc(contadorRef)   // lectura
  await updateDoc(contadorRef, {                   // escritura
    siguiente: nuevoNumero,
    fechaActualizacion: new Date()
  })
  return contador.siguiente
}
```

**Problema de concurrencia:** `getDoc` + `updateDoc` separados sin transacción atómica → condición de carrera (race condition) si el mismo usuario crea dos órdenes simultáneamente (ej. doble-tap). El archivo `firebase-utils.ts` usa `runTransaction` (correcto), pero `multiuser-helpers.ts` (que es el que usa el hook `useCrearOrden`) NO lo usa.

**Problema de contención bajo carga:** Con 100 técnicos × 1 doc por usuario = 100 documentos diferentes → no hay contención real entre usuarios. El cuello de botella es solo por usuario. Si un solo técnico intenta crear múltiples órdenes rápidamente (race condition), el contador puede repetir números.

---

## 2. Arquitectura de la Solución Propuesta

### 2.1 Principio de Diseño: "Offline-First, ID Diferido"

```
[Usuario pulsa "Guardar Orden"]
        │
        ▼
    ¿Hay conexión?
        │
   NO ◄─┤├──► SÍ
        │             │
        ▼             ▼
  Generar ID      Generar ID real
  Temporal:       OSER-XXX con
  OSER-TEMP-      transacción
  <timestamp>     atómica
        │             │
        ▼             ▼
  Guardar en      Guardar en
  localStorage    Firestore
  (Cola Offline)  directamente
        │
        ▼
  [Recupera conexión]
        │
        ▼
  flush() automático
        │
        ▼
  Para cada orden pendiente:
    1. runTransaction(contador) → nro real
    2. setDoc("ordenes/") con ID real
    3. Actualizar idPersonalizado en UI
    4. Eliminar de cola local
```

### 2.2 Estructura de Datos de la Cola

```typescript
// src/hooks/useOfflineOrderQueue.ts (NUEVO)

interface PendingOrder {
  /** ID único de la cola (no el ID de la orden) */
  queueId: string
  /** ID temporal mostrado al usuario: OSER-TEMP-1748900000000 */
  tempId: string
  /** userId del técnico */
  userId: string
  /** Payload completo de la orden serializable (sin Dates nativos) */
  payload: SerializableOrdenPayload
  /** Timestamp de cuándo se encoló */
  enqueuedAt: number
  /** Número de intentos de sincronización fallidos */
  retries: number
  /** Estado de la sincronización */
  status: 'pending' | 'syncing' | 'failed'
}
```

---

## 3. Plan de Implementación Detallado

### Fase 1 — Fundamentos: Tipos y Serializador (Sin riesgo de regresión)

**Archivos a modificar/crear:**

#### 3.1 [MODIFY] `src/types/orden.ts`

Agregar tipos para la cola offline:

```typescript
/** ID temporal generado localmente cuando no hay conexión */
export type TempOrderId = `OSER-TEMP-${number}`

/** Estado de sincronización de una orden en cola offline */
export type OrderSyncStatus = 'pending' | 'syncing' | 'failed' | 'synced'

/** Payload de orden serializable para localStorage (sin objetos Date nativos) */
export interface SerializableOrdenPayload {
  // Todos los campos de OrdenMantenimiento pero con fechas como strings ISO
  tipo: 'mantenimiento'
  userId: string
  clienteId: string
  dispositivoId: string
  cliente: Cliente
  dispositivo: Dispositivo
  tipoMantenimiento: OrdenMantenimiento['tipoMantenimiento']
  tareasRealizadas: string[]
  piezasUsadas: Array<{pieza: string; cantidad: number}>
  // Campos opcionales
  observacionesIniciales?: string
  pruebasRealizadas?: string
  posiblesCausas?: string
  diagnosticoFinal?: string
  contadorMaquina?: number
  contador?: {
    tipo: string
    valor: number
    unidadPersonalizada?: string
    fechaRegistro?: string  // ISO string
    notas?: string
  }
  garantiaHabilitada?: boolean
  garantiaTiempoDesde?: string  // ISO string
  garantiaTiempoHasta?: string  // ISO string
  garantiaDescripcion?: string
  instalacionRecomendaciones?: boolean
  instalacionRecomendacionesDetalle?: string
  instalacionConfiguracion?: boolean
  instalacionConfiguracionTipos?: string[]
  firmaCliente?: string
  nombreFirmante?: string
  validacionCliente?: boolean
  horaCreacion: string
  fechaCreacion: string  // ISO string
  createdAt: string      // ISO string
  updatedAt: string      // ISO string
}

/** Entrada de la cola offline de órdenes */
export interface PendingOrderQueueItem {
  queueId: string
  tempId: TempOrderId
  userId: string
  payload: SerializableOrdenPayload
  enqueuedAt: number
  retries: number
  status: 'pending' | 'syncing' | 'failed'
}
```

---

#### 3.2 [NEW] `src/lib/orden-serializer.ts`

Utilidad para convertir entre `OrdenMantenimiento` (con Dates) y `SerializableOrdenPayload` (con ISO strings):

```typescript
// src/lib/orden-serializer.ts

import type { OrdenMantenimiento, SerializableOrdenPayload } from '@/types/orden'

/**
 * Convierte una orden con Date objects a un payload serializable para localStorage.
 * Ningún campo Date puede guardarse directamente en JSON.
 */
export function serializeOrden(orden: Omit<OrdenMantenimiento, 'id'>): SerializableOrdenPayload {
  const toISO = (v: any): string | undefined => {
    if (!v) return undefined
    if (v instanceof Date) return v.toISOString()
    if (typeof v === 'string') return v
    return undefined
  }

  return {
    tipo: 'mantenimiento',
    userId: orden.userId,
    clienteId: orden.clienteId,
    dispositivoId: orden.dispositivoId,
    cliente: orden.cliente,
    dispositivo: orden.dispositivo,
    tipoMantenimiento: orden.tipoMantenimiento,
    tareasRealizadas: orden.tareasRealizadas ?? [],
    piezasUsadas: orden.piezasUsadas ?? [],
    observacionesIniciales: orden.observacionesIniciales,
    pruebasRealizadas: orden.pruebasRealizadas,
    posiblesCausas: orden.posiblesCausas,
    diagnosticoFinal: orden.diagnosticoFinal,
    contadorMaquina: orden.contadorMaquina,
    contador: orden.contador ? {
      tipo: orden.contador.tipo,
      valor: orden.contador.valor,
      unidadPersonalizada: orden.contador.unidadPersonalizada,
      fechaRegistro: toISO(orden.contador.fechaRegistro),
      notas: orden.contador.notas,
    } : undefined,
    garantiaHabilitada: orden.garantiaHabilitada,
    garantiaTiempoDesde: toISO(orden.garantiaTiempoDesde),
    garantiaTiempoHasta: toISO(orden.garantiaTiempoHasta),
    garantiaDescripcion: orden.garantiaDescripcion,
    instalacionRecomendaciones: orden.instalacionRecomendaciones,
    instalacionRecomendacionesDetalle: orden.instalacionRecomendacionesDetalle,
    instalacionConfiguracion: orden.instalacionConfiguracion,
    instalacionConfiguracionTipos: orden.instalacionConfiguracionTipos,
    firmaCliente: orden.firmaCliente,
    nombreFirmante: orden.nombreFirmante,
    validacionCliente: orden.validacionCliente,
    horaCreacion: orden.horaCreacion,
    fechaCreacion: toISO(orden.fechaCreacion) ?? new Date().toISOString(),
    createdAt: toISO(orden.createdAt) ?? new Date().toISOString(),
    updatedAt: toISO(orden.updatedAt) ?? new Date().toISOString(),
  }
}

/**
 * Convierte un payload serializado de vuelta a una estructura compatible con Firestore.
 * Las fechas se reconstruyen como objetos Date.
 */
export function deserializeOrdenPayload(payload: SerializableOrdenPayload): Omit<OrdenMantenimiento, 'id' | 'idPersonalizado'> {
  const toDate = (v: string | undefined): Date | undefined =>
    v ? new Date(v) : undefined

  return {
    ...payload,
    fechaCreacion: new Date(payload.fechaCreacion),
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
    garantiaTiempoDesde: toDate(payload.garantiaTiempoDesde),
    garantiaTiempoHasta: toDate(payload.garantiaTiempoHasta),
    contador: payload.contador ? {
      ...payload.contador,
      tipo: payload.contador.tipo as any,
      fechaRegistro: toDate(payload.contador.fechaRegistro) ?? new Date(),
    } : undefined,
  } as any
}
```

---

### Fase 2 — Cola Offline de Órdenes

#### 3.3 [NEW] `src/hooks/useOfflineOrderQueue.ts`

El hook central que implementa la cola de persistencia temporal.

```typescript
/**
 * Cola offline para órdenes de servicio.
 *
 * Flujo:
 *   1. Técnico crea orden sin conexión
 *   2. Se genera ID temporal: OSER-TEMP-<timestamp>
 *   3. La orden se guarda en localStorage con todos sus datos
 *   4. La UI muestra la orden optimistamente con el ID temporal
 *   5. Al recuperar conexión:
 *      a. runTransaction(contadores/userId) → número consecutivo real
 *      b. addDoc("ordenes") con idPersonalizado real (ej. OSER001)
 *      c. TanStack Query invalida ['ordenes', userId] → UI se actualiza
 *      d. La entrada se elimina de la cola local
 *
 * Por qué localStorage y no IndexedDB:
 *   - Las órdenes son documentos medianos (<50KB incluyendo firma base64)
 *   - Necesitamos acceso síncrono para inicializar el contador de pendientes
 *   - IndexedDB se justifica si el payload supera 1MB (firmas en alta resolución)
 *   - Decisión de migración a IndexedDB: ver sección 5.3
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNetworkStatus } from './useNetworkStatus'
import { useAuth } from '@/components/auth/AuthProvider'
import { runTransaction, doc, addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { deserializeOrdenPayload, serializeOrden } from '@/lib/orden-serializer'
import { sanitizeOrdenPayload } from '@/lib/firestore-sanitizers'
import type { PendingOrderQueueItem, SerializableOrdenPayload, TempOrderId } from '@/types/orden'
import type { OrdenMantenimiento } from '@/types/orden'

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'tec_offline_order_queue'
const MAX_RETRIES = 5
const RETRY_BASE_DELAY_MS = 2000
const INTER_ORDER_DELAY_MS = 300  // Pausa entre órdenes para no saturar Firestore

// ─── Helpers de persistencia ──────────────────────────────────────────────────

function readQueue(): PendingOrderQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function writeQueue(queue: PendingOrderQueueItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
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
  let consecutivo: number

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

  const idPersonalizado = `OSER${consecutivo!.toString().padStart(3, '0')}`

  // Paso 2: Reconstruir payload con fecha actual de sincronización
  const ordenPayload = deserializeOrdenPayload(payload)
  const ordenCompleta = sanitizeOrdenPayload({
    ...ordenPayload,
    idPersonalizado,
    updatedAt: new Date(),
  })

  // Paso 3: Guardar en Firestore
  const docRef = await addDoc(collection(db, 'ordenes'), ordenCompleta)

  return { firestoreId: docRef.id, idPersonalizado }
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useOfflineOrderQueue() {
  const { connected } = useNetworkStatus()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [pendingCount, setPendingCount] = useState<number>(() => readQueue().length)
  const [isFlushing, setIsFlushing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<{
    synced: number
    failed: number
    timestamp: number
  } | null>(null)
  const isFlushingRef = useRef(false)

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
      const queue = readQueue()

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
      writeQueue(queue)
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
      if (isFlushingRef.current) return
      const queue = readQueue()
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

      writeQueue(failed)
      setPendingCount(failed.length)
      isFlushingRef.current = false
      setIsFlushing(false)

      // Invalidar todas las queries de órdenes para sincronizar UI
      if (user?.uid && syncedCount > 0) {
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
```

---

### Fase 3 — Refactorizar el Hook `useCrearOrden`

#### 3.4 [MODIFY] `src/hooks/useMultiUser.ts`

Reemplazar el `mutationFn` del hook `useCrearOrden` para bifurcar el flujo online/offline:

```typescript
// ANTES (líneas 91-141):
export const useCrearOrden = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ordenData: any) => {
      const idPersonalizado = await generarIdPorTipo(user!.uid, ordenData.tipo || 'mantenimiento')
      const ordenCompleta = { ...ordenData, idPersonalizado, ... }
      const docId = await crearOrden(ordenCompleta, user!.uid)
      return { id: docId, ...ordenCompleta }
    },
    // ...
  })
}

// DESPUÉS:
export const useCrearOrden = () => {
  const { user } = useAuth()
  const { connected } = useNetworkStatus()  // ← NUEVO
  const queryClient = useQueryClient()
  const { enqueueOrder } = useOfflineOrderQueue()  // ← NUEVO

  return useMutation({
    mutationFn: async (ordenData: any) => {
      const userId = user!.uid
      const ordenBase = {
        ...ordenData,
        userId,
        clienteId: ordenData.cliente?.id || ordenData.clienteId,
        dispositivoId: ordenData.dispositivo?.id || ordenData.dispositivoId,
        tipo: 'mantenimiento' as const,
        fechaCreacion: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // ── FLUJO OFFLINE ──────────────────────────────────────────────────────
      if (!connected) {
        const tempId = enqueueOrder(ordenBase, userId)  // Guarda en localStorage
        return {
          id: tempId,           // ID temporal visible en UI
          idPersonalizado: tempId,
          isOffline: true,
          ...ordenBase,
        }
      }

      // ── FLUJO ONLINE (sin cambios al comportamiento existente) ─────────────
      const idPersonalizado = await generarIdPorTipo(userId, ordenData.tipo || 'mantenimiento')
      const ordenCompleta = { ...ordenBase, idPersonalizado }
      const docId = await crearOrden(ordenCompleta, userId)
      return { id: docId, idPersonalizado, isOffline: false, ...ordenCompleta }
    },

    onMutate: async (nuevaOrden) => {
      await queryClient.cancelQueries({ queryKey: ['ordenes', user?.uid] })
      const previousRecent = queryClient.getQueryData(['ordenes', user?.uid, 'recientes', 3])

      if (previousRecent) {
        queryClient.setQueryData(['ordenes', user?.uid, 'recientes', 3], (old: any) => {
          const tempOrden = {
            ...nuevaOrden,
            id: 'temp-' + Date.now(),
            idPersonalizado: connected ? '...' : `OSER-TEMP-${Date.now()}`,
            fechaCreacion: new Date(),
            _isOfflinePending: !connected,  // ← Bandera para UI
          }
          return [tempOrden, ...(old || [])].slice(0, 3)
        })
      }

      return { previousRecent }
    },

    onError: (err, nuevaOrden, context) => {
      if (context?.previousRecent) {
        queryClient.setQueryData(
          ['ordenes', user?.uid, 'recientes', 3],
          context.previousRecent
        )
      }
    },

    onSuccess: (data) => {
      // Solo invalidar en caso online (offline ya muestra el optimistic update)
      if (!data.isOffline) {
        queryClient.invalidateQueries({ queryKey: ['ordenes', user?.uid] })
      }
    },
  })
}
```

---

### Fase 4 — Arreglar la Race Condition del Contador

#### 3.5 [MODIFY] `src/lib/multiuser-helpers.ts`

Reemplazar `incrementarContador` para usar transacción atómica:

```typescript
// ANTES (líneas 342-371): getDoc + updateDoc separados (race condition)
export const incrementarContador = async (userId: string): Promise<number> => {
  const contadorRef = doc(db, 'contadores', userId)
  const contadorDoc = await getDoc(contadorRef)    // <- Lectura
  // ... aquí otro proceso puede leer el mismo valor ...
  await updateDoc(contadorRef, { siguiente: nuevoNumero })  // <- Escritura (puede duplicar)
  return contador.siguiente
}

// DESPUÉS: runTransaction garantiza atomicidad
export const incrementarContadorAtomic = async (userId: string): Promise<number> => {
  const contadorRef = doc(db, 'contadores', userId)
  let resultado: number = -1

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(contadorRef)

    if (!snap.exists()) {
      resultado = 1
      transaction.set(contadorRef, {
        userId,
        siguiente: 2,
        ultimaOrden: '',
        fechaActualizacion: new Date()
      })
    } else {
      const data = snap.data() as ContadorU
      resultado = data.siguiente
      transaction.update(contadorRef, {
        siguiente: resultado + 1,
        fechaActualizacion: new Date()
      })
    }
  })

  if (resultado === -1) throw new Error('Transacción de contador fallida')
  return resultado
}
```

---

### Fase 5 — Indicador Visual de Sincronización

#### 3.6 [NEW] `src/components/ui/OfflineSyncBanner.tsx`

Componente visual que informa al técnico sobre órdenes pendientes de sincronización:

```tsx
// src/components/ui/OfflineSyncBanner.tsx
'use client'
import { CloudOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
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
                      px-4 py-2.5 rounded-xl text-amber-400 text-xs font-medium">
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
                      px-4 py-2.5 rounded-xl text-blue-400 text-xs font-medium">
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
                      px-4 py-2.5 rounded-xl text-green-400 text-xs font-medium animate-in fade-in duration-300">
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
```

---

#### 3.7 [MODIFY] `src/app/(app)/ordenes/page.tsx`

Integrar el banner en el dashboard de órdenes:

```tsx
// Agregar import
import { OfflineSyncBanner } from '@/components/ui/OfflineSyncBanner'

// En el JSX, después del botón "Nueva Orden" y antes del banner de borrador:
<OfflineSyncBanner />
```

---

### Fase 6 — Indicador en Tarjetas de Órdenes Offline

#### 3.8 [MODIFY] `src/components/mantenimiento/OrdenCard.tsx`

Agregar indicador visual en órdenes con ID temporal:

```tsx
// Detectar si es una orden offline pendiente
const isOfflinePending = orden.idPersonalizado?.startsWith('OSER-TEMP-')

// En el render, mostrar badge especial:
{isOfflinePending && (
  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase 
                   bg-amber-500/20 text-amber-400 border border-amber-500/30 
                   px-1.5 py-0.5 rounded-md">
    <CloudOff className="w-2.5 h-2.5" />
    Pendiente
  </span>
)}
```

---

## 4. Estrategia de Escalabilidad: Sharding del Contador

### 4.1 Problema a 1000 usuarios simultáneos por usuario (edge case)

El contador por usuario (`contadores/{userId}`) soporta naturalmente múltiples usuarios concurrentes porque cada uno tiene su propio documento. Sin embargo, si un solo técnico intenta crear órdenes en paralelo (ej. automatización), hay contención.

### 4.2 Solución: Shard Pool por Usuario

Para el caso extremo, implementar un pool de shards:

```
/contadores/{userId}/shards/{shardId}
├── 0: { siguiente: 101 }
├── 1: { siguiente: 45 }
├── 2: { siguiente: 78 }
└── ... (N shards)
```

**Algoritmo:**
1. Elegir shard aleatorio: `shardId = Math.floor(Math.random() * N_SHARDS)`
2. `runTransaction(shards/{shardId})` → consecutivo local del shard
3. El ID real combina: `OSER-{shardId}-{consecutivo}` (o se normaliza en batch nocturno)

**Cuándo implementar:** Solo si un usuario crea >10 órdenes/segundo. Para el caso de TecniControl (técnicos individuales), el contador simple por usuario es suficiente.

### 4.3 Decisión: IndexedDB vs localStorage para la Cola

| Criterio | localStorage | IndexedDB |
|---|---|---|
| Tamaño máximo | 5–10 MB por dominio | 1–2 GB |
| Ordenes almacenables (sin firma) | ~200–500 | Ilimitado |
| Ordenes con firma base64 (avg 100KB) | 50–100 | Ilimitado |
| Complejidad de implementación | Baja | Media-Alta |
| Queries | No | Sí (cursores) |
| SSR compatible | Sí (con guards) | Sí (con guards) |

**Recomendación para TecniControl:** Mantener localStorage para la cola de órdenes. Si la firma en base64 supera los 100KB, comprimir antes de guardar (`CompressionStream API`). Migrar a IndexedDB solo si hay reporte de errores de cuota (`QuotaExceededError`).

---

## 5. Mapa de Archivos a Cambiar

```
src/
├── types/
│   └── orden.ts                       ← MODIFY: Agregar TempOrderId, SerializableOrdenPayload, PendingOrderQueueItem
│
├── lib/
│   ├── orden-serializer.ts            ← NEW: serializeOrden / deserializeOrdenPayload
│   ├── multiuser-helpers.ts           ← MODIFY: incrementarContadorAtomic (runTransaction)
│   └── firebase-utils.ts              ← KEEP AS IS (ya usa runTransaction correctamente)
│
├── hooks/
│   ├── useOfflineOrderQueue.ts        ← NEW: Cola offline de órdenes + flush automático
│   └── useMultiUser.ts               ← MODIFY: useCrearOrden bifurca online/offline
│
├── components/
│   ├── ui/
│   │   └── OfflineSyncBanner.tsx      ← NEW: Banner visual de sincronización
│   └── mantenimiento/
│       └── OrdenCard.tsx              ← MODIFY: Badge "Pendiente" para IDs temporales
│
└── app/(app)/ordenes/
    └── page.tsx                       ← MODIFY: Integrar <OfflineSyncBanner />
```

---

## 6. Plan de Pruebas

### 6.1 Pruebas de Flujo Offline

| Escenario | Acción | Resultado Esperado |
|---|---|---|
| Sin conexión al crear orden | Guardar orden sin WiFi | ID temporal `OSER-TEMP-xxx` visible, orden en localStorage |
| Reconexión tras orden offline | Recuperar WiFi | Banner desaparece, ID actualizado a `OSER001` |
| App cerrada y reabierta offline | Reiniciar app | Orden sigue en cola, badge "Pendiente" visible |
| App cerrada y reabierta online | Reiniciar app | flush() automático al montar, orden sincronizada |
| Múltiples órdenes offline | Crear 3 órdenes offline | Las 3 en cola, sincronización secuencial al reconectar |
| Error de sincronización | Simular Firestore no disponible | Retry hasta MAX_RETRIES, luego log de error |
| Race condition | Doble-tap en "Guardar" | Solo 1 orden creada (protegido por useMutation isPending) |

### 6.2 Validación de Integridad del Contador

```bash
# Verificar en Firestore console que:
# 1. contador.siguiente siempre es consecutivo
# 2. No hay huecos en la secuencia de IDs
# 3. No hay IDs duplicados
```

### 6.3 Prueba de Cuota de localStorage

```javascript
// En DevTools Console:
const testQueue = Array.from({length: 100}, (_, i) => ({
  queueId: `test_${i}`,
  payload: { firmaCliente: 'data:image/png;base64,' + 'A'.repeat(100000) }
}))
localStorage.setItem('test_quota', JSON.stringify(testQueue))
// Si lanza QuotaExceededError → migrar a IndexedDB
```

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| localStorage lleno (firmas grandes) | Media | Alta | Comprimir firma antes de guardar; migrar a IndexedDB si hay errores |
| Orden sincronizada con ID duplicado | Baja | Alta | runTransaction garantiza atomicidad; idempotency check en Firestore Rules |
| Técnico borra datos del navegador | Baja | Alta | Banner de advertencia + export de cola antes de limpiar |
| Orden offline con cliente/dispositivo eliminado | Muy Baja | Media | Validar existencia del clienteId/dispositivoId al sincronizar |
| Contador desincronizado tras fallo parcial | Baja | Media | runTransaction hace rollback automático en Firestore si falla |

---

## 8. Criterios de Aceptación (Definition of Done)

- [ ] Técnico puede crear orden sin conexión en sótano/zona muerta
- [ ] El ID temporal `OSER-TEMP-xxx` se muestra en la UI inmediatamente
- [ ] La orden persiste en localStorage al cerrar y reabrir la app
- [ ] Al reconectar, la sincronización es automática (< 5s de delay)
- [ ] El ID se actualiza de temporal a consecutivo real en la UI
- [ ] No hay duplicación de números de orden bajo carga concurrente
- [ ] Banner informativo informa sobre órdenes pendientes
- [ ] Los técnicos ven badge "Pendiente" en tarjetas de órdenes no sincronizadas
- [ ] Errores de sincronización no bloquean la UI ni otras órdenes
- [ ] El plan de pruebas de la sección 6 pasa al 100%

---

## 9. Prioridad de Implementación

| Fase | Archivos | Esfuerzo | Prioridad |
|---|---|---|---|
| F1: Tipos y Serializador | `orden.ts`, `orden-serializer.ts` | 2h | 🔴 CRÍTICO |
| F2: Cola Offline | `useOfflineOrderQueue.ts` | 4h | 🔴 CRÍTICO |
| F3: Refactorizar useCrearOrden | `useMultiUser.ts` | 3h | 🔴 CRÍTICO |
| F4: Fix Race Condition Contador | `multiuser-helpers.ts` | 1h | 🟠 ALTO |
| F5: Banner de Sincronización | `OfflineSyncBanner.tsx`, `page.tsx` | 2h | 🟡 MEDIO |
| F6: Badge en OrdenCard | `OrdenCard.tsx` | 1h | 🟡 MEDIO |

**Total estimado: ~13 horas de desarrollo**

---

*Documento generado el 2026-06-02 por análisis del repositorio TecniControl.*  
*Para implementar, aprobar este plan y proceder fase por fase comenzando por F1.*
