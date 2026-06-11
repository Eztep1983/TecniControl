/**
 * Hook principal que integra:
 *   - TanStack Query: caché, deduplicación, staleTime
 *   - Optimistic updates: la UI responde instantáneo, Firestore confirma después
 *   - Cola offline: si no hay red, encola y sincroniza al reconectar
 *   - Migración transparente al primer uso
 *
 * Beneficio en escrituras Firebase:
 *   ANTES: cualquier cambio → guardar arrays completos (2 writes de ~N items cada uno)
 *   AHORA: cada operación → 1 write al documento exacto que cambió
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/auth/AuthProvider'
import { useNetworkStatus } from './useNetworkStatus'
import { useOfflineQueue } from './useOfflineQueue'
import * as helpers from '@/lib/configuracion-helpers'
import type { TareaPredefinida, PiezaPredefinida } from '@/lib/configuracion-helpers'

// ─── Configuración de caché ───────────────────────────────────────────────────

const STALE_TIME = Infinity // Real-time sync a través de FirestoreSyncProvider
const GC_TIME    = 60 * 60 * 1000 // 1 hora: mantener en caché aunque no haya suscriptores

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const queryKeys = {
  tareas: (uid: string) => ['config-tareas', uid] as const,
  piezas: (uid: string) => ['config-piezas', uid] as const,
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useTareasYPiezas() {
  const { user } = useAuth()
  const { connected } = useNetworkStatus()
  const qc = useQueryClient()
  const { enqueue, pendingCount, isFlushing } = useOfflineQueue()

  const uid = user?.uid ?? ''

  // ── Queries ──────────────────────────────────────────────────────────────

  const tareasQuery = useQuery({
    queryKey: queryKeys.tareas(uid),
    queryFn: () => helpers.obtenerTareasPredefinidas(uid),
    enabled: !!uid,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })

  const piezasQuery = useQuery({
    queryKey: queryKeys.piezas(uid),
    queryFn: () => helpers.obtenerPiezasPredefinidas(uid),
    enabled: !!uid,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })

  // ── Helpers internos ─────────────────────────────────────────────────────

  const getOfflineError = () =>
    connected ? null : new Error('offline')

  // ── Mutaciones de Tareas ─────────────────────────────────────────────────

  const crearTareaMutation = useMutation({
    mutationFn: async (data: Omit<TareaPredefinida, 'id'>) => {
      if (!connected) throw new Error('offline')
      const id = await helpers.crearTarea(uid, data)
      return { id, ...data } as TareaPredefinida
    },
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: queryKeys.tareas(uid) })
      const prev = qc.getQueryData<TareaPredefinida[]>(queryKeys.tareas(uid))
      const tempId = `temp_${Date.now()}`
      qc.setQueryData<TareaPredefinida[]>(queryKeys.tareas(uid), old =>
        [...(old ?? []), { id: tempId, ...data }]
      )
      return { prev, tempId }
    },
    onError: (err: Error, data, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.tareas(uid), ctx.prev)
      if (err.message === 'offline') {
        enqueue({ type: 'create', entity: 'tarea', payload: data, userId: uid })
        // Restaurar el optimistic update offline (TanStack lo revirtió por el error)
        qc.setQueryData<TareaPredefinida[]>(queryKeys.tareas(uid), old =>
          [...(old ?? []), { id: `offline_${Date.now()}`, ...data }]
        )
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tareas(uid) })
    },
  })

  const actualizarTareaMutation = useMutation({
    mutationFn: async (tarea: TareaPredefinida) => {
      if (!connected) throw new Error('offline')
      await helpers.actualizarTarea(uid, tarea)
      return tarea
    },
    onMutate: async (tarea) => {
      await qc.cancelQueries({ queryKey: queryKeys.tareas(uid) })
      const prev = qc.getQueryData<TareaPredefinida[]>(queryKeys.tareas(uid))
      qc.setQueryData<TareaPredefinida[]>(queryKeys.tareas(uid), old =>
        (old ?? []).map(t => t.id === tarea.id ? tarea : t)
      )
      return { prev }
    },
    onError: (err: Error, tarea, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.tareas(uid), ctx.prev)
      if (err.message === 'offline') {
        enqueue({ type: 'update', entity: 'tarea', payload: tarea, userId: uid })
        // Mantener el cambio visible offline
        qc.setQueryData<TareaPredefinida[]>(queryKeys.tareas(uid), old =>
          (old ?? []).map(t => t.id === tarea.id ? tarea : t)
        )
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tareas(uid) })
    },
  })

  const eliminarTareaMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!connected) throw new Error('offline')
      await helpers.eliminarTarea(uid, id)
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.tareas(uid) })
      const prev = qc.getQueryData<TareaPredefinida[]>(queryKeys.tareas(uid))
      qc.setQueryData<TareaPredefinida[]>(queryKeys.tareas(uid), old =>
        (old ?? []).filter(t => t.id !== id)
      )
      return { prev }
    },
    onError: (err: Error, id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.tareas(uid), ctx.prev)
      if (err.message === 'offline') {
        enqueue({ type: 'delete', entity: 'tarea', payload: { id }, userId: uid })
        qc.setQueryData<TareaPredefinida[]>(queryKeys.tareas(uid), old =>
          (old ?? []).filter(t => t.id !== id)
        )
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tareas(uid) })
    },
  })

  // ── Mutaciones de Piezas ─────────────────────────────────────────────────

  const crearPiezaMutation = useMutation({
    mutationFn: async (data: Omit<PiezaPredefinida, 'id'>) => {
      if (!connected) throw new Error('offline')
      const id = await helpers.crearPieza(uid, data)
      return { id, ...data } as PiezaPredefinida
    },
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: queryKeys.piezas(uid) })
      const prev = qc.getQueryData<PiezaPredefinida[]>(queryKeys.piezas(uid))
      const tempId = `temp_${Date.now()}`
      qc.setQueryData<PiezaPredefinida[]>(queryKeys.piezas(uid), old =>
        [...(old ?? []), { id: tempId, ...data }]
      )
      return { prev, tempId }
    },
    onError: (err: Error, data, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.piezas(uid), ctx.prev)
      if (err.message === 'offline') {
        enqueue({ type: 'create', entity: 'pieza', payload: data, userId: uid })
        qc.setQueryData<PiezaPredefinida[]>(queryKeys.piezas(uid), old =>
          [...(old ?? []), { id: `offline_${Date.now()}`, ...data }]
        )
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.piezas(uid) })
    },
  })

  const actualizarPiezaMutation = useMutation({
    mutationFn: async (pieza: PiezaPredefinida) => {
      if (!connected) throw new Error('offline')
      await helpers.actualizarPieza(uid, pieza)
      return pieza
    },
    onMutate: async (pieza) => {
      await qc.cancelQueries({ queryKey: queryKeys.piezas(uid) })
      const prev = qc.getQueryData<PiezaPredefinida[]>(queryKeys.piezas(uid))
      qc.setQueryData<PiezaPredefinida[]>(queryKeys.piezas(uid), old =>
        (old ?? []).map(p => p.id === pieza.id ? pieza : p)
      )
      return { prev }
    },
    onError: (err: Error, pieza, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.piezas(uid), ctx.prev)
      if (err.message === 'offline') {
        enqueue({ type: 'update', entity: 'pieza', payload: pieza, userId: uid })
        qc.setQueryData<PiezaPredefinida[]>(queryKeys.piezas(uid), old =>
          (old ?? []).map(p => p.id === pieza.id ? pieza : p)
        )
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.piezas(uid) })
    },
  })

  const eliminarPiezaMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!connected) throw new Error('offline')
      await helpers.eliminarPieza(uid, id)
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.piezas(uid) })
      const prev = qc.getQueryData<PiezaPredefinida[]>(queryKeys.piezas(uid))
      qc.setQueryData<PiezaPredefinida[]>(queryKeys.piezas(uid), old =>
        (old ?? []).filter(p => p.id !== id)
      )
      return { prev }
    },
    onError: (err: Error, id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.piezas(uid), ctx.prev)
      if (err.message === 'offline') {
        enqueue({ type: 'delete', entity: 'pieza', payload: { id }, userId: uid })
        qc.setQueryData<PiezaPredefinida[]>(queryKeys.piezas(uid), old =>
          (old ?? []).filter(p => p.id !== id)
        )
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.piezas(uid) })
    },
  })

  // ── Estado de sincronización global ──────────────────────────────────────

  const isMutating =
    crearTareaMutation.isPending   || actualizarTareaMutation.isPending || eliminarTareaMutation.isPending ||
    crearPiezaMutation.isPending   || actualizarPiezaMutation.isPending || eliminarPiezaMutation.isPending

  // ── API pública ──────────────────────────────────────────────────────────

  return {
    // Datos
    tareas:    tareasQuery.data ?? [],
    piezas:    piezasQuery.data ?? [],
    isLoading: tareasQuery.isLoading || piezasQuery.isLoading,
    isError:   tareasQuery.isError   || piezasQuery.isError,

    // Estado de sync
    isMutating,
    isOnline:     connected,
    pendingCount,   // operaciones offline pendientes de sincronizar
    isFlushing,     // sincronizando cola offline activamente

    // Acciones de tareas
    crearTarea:      (data: Omit<TareaPredefinida, 'id'>) => crearTareaMutation.mutate(data),
    actualizarTarea: (tarea: TareaPredefinida)             => actualizarTareaMutation.mutate(tarea),
    eliminarTarea:   (id: string)                          => eliminarTareaMutation.mutate(id),

    // Acciones de piezas
    crearPieza:      (data: Omit<PiezaPredefinida, 'id'>) => crearPiezaMutation.mutate(data),
    actualizarPieza: (pieza: PiezaPredefinida)             => actualizarPiezaMutation.mutate(pieza),
    eliminarPieza:   (id: string)                          => eliminarPiezaMutation.mutate(id),
  }
}