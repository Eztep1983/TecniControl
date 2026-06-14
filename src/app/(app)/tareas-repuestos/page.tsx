'use client'

import { useState, useMemo, useCallback, useEffect, memo } from 'react'
import { useTareasYPiezas } from '@/hooks/useTareasYPiezas'
import type { TareaPredefinida, PiezaPredefinida } from '@/lib/configuracion-helpers'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  ListChecks, Package, Plus, Trash2, Edit3,
  X, Search, AlertCircle, CheckCircle, Info,
  WifiOff, Loader2, CloudOff,
  RefreshCw
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ModalTarea, FormTarea } from '@/components/tareas-repuestos/ModalTarea'
import { ModalPieza, FormPieza } from '@/components/tareas-repuestos/ModalPieza'

// ─── Haptics (conservado) ────────────────────────────────────────────────────

const haptic = async (style: 'light' | 'medium' | 'heavy' = 'light') => {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }
    await Haptics.impact({ style: map[style] })
  } catch {
    const durations = { light: 30, medium: 50, heavy: 80 }
    navigator.vibrate?.(durations[style])
  }
}

const notificationHaptic = async (type: 'success' | 'warning' | 'error') => {
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    const map = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error:   NotificationType.Error,
    }
    await Haptics.notification({ type: map[type] })
  } catch {
    navigator.vibrate?.(type === 'error' ? [50, 30, 50] : 40)
  }
}

// ─── Hook de debounce (conservado) ─────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ─── Componente: Toast con Barra de Progreso ───────────────────────────────

interface ToastData { text: string; type: 'success' | 'error' | 'info' }

const Toast = ({ toast, onClose }: { toast: ToastData; onClose: () => void }) => {
  const duration = toast.type === 'error' ? 5000 : 3500

  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  const styles = {
    success: 'bg-blue-600/95 border-blue-500/50',
    error:   'bg-red-600/95 border-red-500/50',
    info:    'bg-slate-800/95 border-slate-700/50',
  }
  const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? AlertCircle : Info

  return (
    <div
      className={`
        fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] left-4 right-4 z-[60]
        flex flex-col rounded-2xl border shadow-2xl overflow-hidden
        animate-in slide-in-from-bottom-4 duration-300
        ${styles[toast.type]}
      `}
    >
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div className="flex items-center gap-3 p-4">
        <Icon className="w-5 h-5 text-white shrink-0" />
        <span className="text-sm font-medium text-white flex-1">{toast.text}</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/20 active:bg-white/30 touch-manipulation"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="h-1 w-full bg-white/20">
        <div
          className="h-full bg-white/60"
          style={{
            animation: `shrinkWidth ${duration}ms linear forwards`,
            transformOrigin: 'left',
          }}
        />
      </div>
    </div>
  )
}

// ─── Componente: Campo de búsqueda (2xl rounded) ────────────────────────────

const SearchInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) => (
  <div className="relative">
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
    <input
      type="search"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="
        w-full min-h-[48px] pl-10 pr-9 py-3
        bg-slate-800/70 border border-slate-700/60 rounded-2xl
        text-white placeholder-slate-500 text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent
        transition-all
      "
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
    />
    {value && (
      <button
        onClick={() => onChange('')}
        type="button"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white active:text-white touch-manipulation"
        aria-label="Limpiar"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
)

// ─── Componente: Estadística (12px legibilidad mínima) ─────────────────────

const StatChip = ({
  label,
  value,
  colorClass,
  Icon,
}: {
  label: string
  value: number
  colorClass: string
  Icon: React.ComponentType<{ className?: string }>
}) => (
  <div className="shrink-0 bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3 min-w-[100px] flex-1">
    <div className="flex items-center gap-1.5 mb-0.5">
      <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
      <span className={`text-xl font-bold leading-none ${colorClass}`}>{value}</span>
    </div>
    <span className="text-xs text-slate-400 leading-tight">{label}</span>
  </div>
)

// ─── Componente: Item de Tarea (2xl rounded y w-11 h-11 botones táctiles) ──

const TareaItem = memo(({ 
  tarea, 
  onEdit, 
  onDelete 
}: { 
  tarea: TareaPredefinida; 
  onEdit: (t: TareaPredefinida) => void; 
  onDelete: (id: string) => void 
}) => (
  <div
    className="
      bg-slate-800/70 rounded-2xl px-4 py-3.5
      border border-slate-700/40
      flex items-center justify-between gap-3
      transition-colors hover:bg-slate-800
    "
  >
    <div className="flex-1 min-w-0">
      <p className="text-white font-medium text-sm leading-snug truncate">
        {tarea.nombre}
      </p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <TipoChip tipo={tarea.tipo} />
        <span className="text-xs px-2 py-0.5 bg-slate-700/70 text-slate-400 rounded-full border border-slate-600/40">
          {tarea.categoria}
        </span>
      </div>
    </div>

    <div className="flex gap-3 shrink-0">
      <button
        onClick={() => onEdit(tarea)}
        type="button"
        className="
          w-11 h-11 flex items-center justify-center
          rounded-2xl bg-blue-500/10 text-blue-400
          active:bg-blue-500/20
          touch-manipulation transition-all
        "
        aria-label="Editar tarea"
      >
        <Edit3 className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(tarea.id)}
        type="button"
        className="
          w-11 h-11 flex items-center justify-center
          rounded-2xl bg-red-500/10 text-red-400
          active:bg-red-500/20
          touch-manipulation transition-all
        "
        aria-label="Eliminar tarea"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
))

TareaItem.displayName = 'TareaItem'

// ─── Componente: Item de Pieza (2xl rounded y w-11 h-11 botones táctiles) ──

const PiezaItem = memo(({ 
  pieza, 
  onEdit, 
  onDelete 
}: { 
  pieza: PiezaPredefinida; 
  onEdit: (p: PiezaPredefinida) => void; 
  onDelete: (id: string) => void 
}) => (
  <div
    className="
      bg-slate-800/70 rounded-2xl px-4 py-3.5
      border border-slate-700/40
      flex items-center justify-between gap-3
      transition-colors hover:bg-slate-800
    "
  >
    <div className="flex-1 min-w-0">
      <p className="text-white font-medium text-sm leading-snug truncate">
        {pieza.nombre}
      </p>
      <span className="text-xs text-slate-400 mt-1 inline-block">
        {pieza.categoria}
      </span>
    </div>

    <div className="flex gap-3 shrink-0">
      <button
        onClick={() => onEdit(pieza)}
        type="button"
        className="
          w-11 h-11 flex items-center justify-center
          rounded-2xl bg-blue-500/10 text-blue-400
          active:bg-blue-500/20
          touch-manipulation transition-all
        "
        aria-label="Editar repuesto"
      >
        <Edit3 className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(pieza.id)}
        type="button"
        className="
          w-11 h-11 flex items-center justify-center
          rounded-2xl bg-red-500/10 text-red-400
          active:bg-red-500/20
          touch-manipulation transition-all
        "
        aria-label="Eliminar repuesto"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
))

PiezaItem.displayName = 'PiezaItem'

// ─── Componente: Chip de tipo (conservado) ─────────────────────────────────

const TipoChip = ({ tipo }: { tipo: TareaPredefinida['tipo'] }) => {
  const styles = {
    preventivo: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    correctivo: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    ambos:      'bg-purple-500/15 text-purple-300 border-purple-500/30',
  }
  const labels = { preventivo: 'Preventivo', correctivo: 'Correctivo', ambos: 'Ambos' }

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[tipo]}`}>
      {labels[tipo]}
    </span>
  )
}

// ─── Componente: Estado vacío (py-10 optimizado) ───────────────────────────

const EmptyState = ({
  Icon,
  title,
  description,
}: {
  Icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <div className="bg-slate-800/50 p-5 rounded-full mb-4">
      <Icon className="w-9 h-9 text-slate-500" />
    </div>
    <p className="text-slate-300 font-medium">{title}</p>
    <p className="text-slate-500 text-sm mt-1 max-w-[200px] leading-relaxed">{description}</p>
  </div>
)

// ─── Componente: Skeleton (conservado) ─────────────────────────────────────

const Skeleton = () => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="flex gap-3 overflow-hidden pb-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-16 w-24 bg-slate-800/60 rounded-2xl shrink-0" />
      ))}
    </div>
    <div className="h-12 bg-slate-800/60 rounded-xl" />
    <div className="h-12 bg-slate-800/60 rounded-xl" />
    {[1, 2, 3].map(i => (
      <div key={i} className="h-20 bg-slate-800/60 rounded-xl" />
    ))}
  </div>
)

// ─── Componente: Indicador de red (conservado) ─────────────────────────────

const NetworkIndicator = ({
  isOnline,
  pendingCount,
  isFlushing,
}: {
  isOnline: boolean
  pendingCount: number
  isFlushing: boolean
}) => {
  if (isOnline && pendingCount === 0) return null

  if (isFlushing) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-blue-400">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Sincronizando…</span>
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-400">
        <WifiOff className="w-3 h-3" />
        <span>Sin conexión{pendingCount > 0 ? ` · ${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}` : ''}</span>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-400">
        <CloudOff className="w-3 h-3" />
        <span>{pendingCount} pendiente{pendingCount > 1 ? 's' : ''}</span>
      </div>
    )
  }

  return null
}

// ─── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────

const PAGE_SIZE = 5

export default function TareasRepuestosPage() {
  const { user } = useAuth()

  const {
    tareas, piezas, isLoading, isMutating,
    isOnline, pendingCount, isFlushing,
    crearTarea, actualizarTarea, eliminarTarea,
    crearPieza, actualizarPieza, eliminarPieza,
  } = useTareasYPiezas()

  // ── UI State ──────────────────────────────────────────────────────────────

  const [tab, setTab]               = useState<'tareas' | 'piezas'>('tareas')
  const [toast, setToast]           = useState<ToastData | null>(null)

  // Formularios de creación
  const [modalTarea, setModalTarea] = useState(false)
  const [modalPieza, setModalPieza] = useState(false)

  // Formularios de edición
  const [editTarea, setEditTarea]   = useState<TareaPredefinida | null>(null)
  const [editPieza, setEditPieza]   = useState<PiezaPredefinida | null>(null)

  // Confirmar eliminación
  const [tareaToDelete, setTareaToDelete] = useState<string | null>(null)
  const [piezaToDelete, setPiezaToDelete] = useState<string | null>(null)

  // Búsqueda
  const [searchTareas, setSearchTareas] = useState('')
  const [searchPiezas, setSearchPiezas] = useState('')
  const debouncedSearchTareas = useDebounce(searchTareas, 250)
  const debouncedSearchPiezas = useDebounce(searchPiezas, 250)

  // Paginación
  const [pageTareas, setPageTareas]   = useState(1)
  const [pagePiezas, setPagePiezas]   = useState(1)

  // Resetear página al cambiar búsqueda
  useEffect(() => { setPageTareas(1) }, [debouncedSearchTareas])
  useEffect(() => { setPagePiezas(1) }, [debouncedSearchPiezas])

  // Resetear página y limpiar búsquedas al cambiar de tab para evitar estados inconsistentes
  useEffect(() => {
    setPageTareas(1)
    setPagePiezas(1)
    setSearchTareas('')
    setSearchPiezas('')
  }, [tab])

  const showToast = useCallback((text: string, type: ToastData['type'] = 'success') => {
    setToast({ text, type })
  }, [])

  // ── Filtrado ──────────────────────────────────────────────────────────────

  const tareasFiltradas = useMemo(() => {
    if (!debouncedSearchTareas) return tareas
    const term = debouncedSearchTareas.toLowerCase()
    return tareas.filter(t =>
      t.nombre.toLowerCase().includes(term) ||
      t.categoria.toLowerCase().includes(term) ||
      t.tipo.includes(term)
    )
  }, [tareas, debouncedSearchTareas])

  const piezasFiltradas = useMemo(() => {
    if (!debouncedSearchPiezas) return piezas
    const term = debouncedSearchPiezas.toLowerCase()
    return piezas.filter(p =>
      p.nombre.toLowerCase().includes(term) ||
      p.categoria.toLowerCase().includes(term)
    )
  }, [piezas, debouncedSearchPiezas])

  // ── Handlers de Tareas ────────────────────────────────────────────────────

  const handleCrearTarea = useCallback((data: FormTarea) => {
    if (!data.nombre.trim()) {
      showToast('El nombre de la tarea es requerido', 'error')
      notificationHaptic('error')
      return
    }
    crearTarea({ nombre: data.nombre.trim(), tipo: data.tipo, categoria: data.categoria.trim() || 'General' })
    setModalTarea(false)
    haptic('medium')
    showToast(isOnline ? 'Tarea agregada' : 'Tarea guardada (sin conexión)')
  }, [crearTarea, isOnline, showToast])

  const handleActualizarTarea = useCallback((data: FormTarea) => {
    if (!editTarea) return
    if (!data.nombre.trim()) {
      showToast('El nombre es requerido', 'error')
      notificationHaptic('error')
      return
    }
    actualizarTarea({ ...editTarea, nombre: data.nombre.trim(), tipo: data.tipo, categoria: data.categoria.trim() })
    setEditTarea(null)
    haptic('light')
    showToast('Tarea actualizada')
  }, [editTarea, actualizarTarea, showToast])

  const handleEliminarTarea = useCallback((id: string) => {
    eliminarTarea(id)
    haptic('medium')
    showToast('Tarea eliminada')
  }, [eliminarTarea, showToast])

  // ── Handlers de Piezas ────────────────────────────────────────────────────

  const handleCrearPieza = useCallback((data: FormPieza) => {
    if (!data.nombre.trim()) {
      showToast('El nombre de la pieza es requerido', 'error')
      notificationHaptic('error')
      return
    }
    crearPieza({ nombre: data.nombre.trim(), categoria: data.categoria.trim() || 'Categoría Genérica' })
    setModalPieza(false)
    haptic('medium')
    showToast(isOnline ? 'Pieza agregada' : 'Pieza guardada (sin conexión)')
  }, [crearPieza, isOnline, showToast])

  const handleActualizarPieza = useCallback((data: FormPieza) => {
    if (!editPieza) return
    if (!data.nombre.trim()) {
      showToast('El nombre es requerido', 'error')
      notificationHaptic('error')
      return
    }
    actualizarPieza({ ...editPieza, nombre: data.nombre.trim(), categoria: data.categoria.trim() })
    setEditPieza(null)
    haptic('light')
    showToast('Pieza actualizada')
  }, [editPieza, actualizarPieza, showToast])

  const handleEliminarPieza = useCallback((id: string) => {
    eliminarPieza(id)
    haptic('medium')
    showToast('Pieza eliminada')
  }, [eliminarPieza, showToast])

  // ── Paginación: elementos visibles (Definidos ANTES de cualquier conditional return) ──

  const visibleTareas = useMemo(() => tareasFiltradas.slice(0, pageTareas * PAGE_SIZE), [tareasFiltradas, pageTareas])
  const visiblePiezas = useMemo(() => piezasFiltradas.slice(0, pagePiezas * PAGE_SIZE), [piezasFiltradas, pagePiezas])
  const hasMoreTareas = visibleTareas.length < tareasFiltradas.length
  const hasMorePiezas = visiblePiezas.length < piezasFiltradas.length

  // ── Guard ─────────────────────────────────────────────────────────────────

  if (!user) return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-slate-400 text-sm">Debes iniciar sesión para continuar</p>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-transparent h-full">
      {/* Header Premium (Sticky con Blur, Borde y Margen Negativo) */}
      <header
        className="
          sticky top-0 z-40
          bg-gray-900/90 border-b border-slate-800/60
          -mx-4 -mt-4 px-4 py-3.5 mb-4
          sm:-mx-6 sm:-mt-6 sm:px-6
          lg:-mx-8 lg:-mt-8 lg:px-8
          transition-all
        "
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white leading-tight truncate">
                Tareas y Repuestos
              </h1>
              {isMutating && (
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
              )}
            </div>
            <NetworkIndicator
              isOnline={isOnline}
              pendingCount={pendingCount}
              isFlushing={isFlushing}
            />
          </div>
        </div>
      </header>

      {/* ── Banner offline ── */}
      {!isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-2 -mt-4 mb-4">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">
            Modo offline — los cambios se sincronizarán al reconectar
          </p>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* ── Contenido principal ── */}
      <main className="max-w-2xl mx-auto px-4 py-2 space-y-5 pb-16">
        {isLoading && tareas.length === 0 && piezas.length === 0 ? (
          <Skeleton />
        ) : (
          <>
            {/* Resumen de Estadísticas */}
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              <StatChip
                label="Total Tareas"
                value={tareas.length}
                colorClass="text-blue-400"
                Icon={ListChecks}
              />
              <StatChip
                label="Total Repuestos"
                value={piezas.length}
                colorClass="text-purple-400"
                Icon={Package}
              />
              {pendingCount > 0 && (
                <StatChip
                  label="Pendientes Sync"
                  value={pendingCount}
                  colorClass="text-amber-400"
                  Icon={CloudOff}
                />
              )}
            </div>

            {/* Tabs (Contraste aumentado e inactivo rebajado) */}
            <div className="flex bg-slate-800/60 rounded-2xl p-1.5 border border-slate-700/40 shadow-sm">
              {(
                [
                  { key: 'tareas', label: 'Tareas',    Icon: ListChecks, active: 'bg-blue-500/35 text-white font-semibold shadow-sm' },
                  { key: 'piezas', label: 'Repuestos',  Icon: Package,    active: 'bg-purple-500/35 text-white font-semibold shadow-sm' },
                ] as const
              ).map(({ key, label, Icon, active }) => (
                <button
                  key={key}
                  onClick={() => { haptic('light'); setTab(key) }}
                  type="button"
                  aria-pressed={tab === key}
                  className={`
                    flex-1 flex items-center justify-center gap-2
                    min-h-[44px] rounded-xl text-sm
                    transition-all touch-manipulation select-none
                    ${tab === key ? active : 'text-slate-500 hover:text-slate-300 active:text-slate-250'}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Panel Tareas (Con Animación animate-in fade-in) ── */}
            {tab === 'tareas' && (
              <section className="bg-slate-800/40 rounded-2xl border border-slate-700/40 overflow-hidden animate-in fade-in duration-200">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-700/40">
                  <h2 className="text-white font-semibold text-sm">
                    Tareas predefinidas
                    <span className="text-slate-500 font-normal ml-1.5">
                      ({tareasFiltradas.length})
                    </span>
                  </h2>
                  <button
                    onClick={() => { haptic('light'); setModalTarea(true) }}
                    type="button"
                    className="
                      flex items-center gap-1.5 pl-3 pr-4 min-h-[44px]
                      bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-2xl
                      text-sm font-semibold active:bg-blue-500/25
                      touch-manipulation transition-all
                    "
                    aria-label="Agregar tarea"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <SearchInput
                    value={searchTareas}
                    onChange={setSearchTareas}
                    placeholder="Buscar tarea…"
                  />

                  <div className="space-y-2">
                    {tareasFiltradas.length === 0 ? (
                      <EmptyState
                        Icon={ListChecks}
                        title="Sin tareas"
                        description={searchTareas ? 'No hay resultados para tu búsqueda' : 'Agrega tareas con el botón Agregar'}
                      />
                    ) : (
                      <>
                        {/* LISTA CON COMPONENTES MEMOIZADOS */}
                        {visibleTareas.map(tarea => (
                          <TareaItem 
                            key={tarea.id} 
                            tarea={tarea} 
                            onEdit={setEditTarea} 
                            onDelete={setTareaToDelete} 
                          />
                        ))}

                        {/* Paginación: botón "Mostrar más" */}
                        {hasMoreTareas && (
                          <button
                            onClick={() => {
                              haptic('light')
                              setPageTareas(p => p + 1)
                            }}
                            type="button"
                            className="
                              w-full min-h-[48px] mt-2
                              flex items-center justify-center gap-1.5
                              text-sm font-medium text-blue-300
                              bg-blue-500/10 border border-blue-500/20
                              rounded-2xl active:bg-blue-500/20 active:scale-[0.98]
                              touch-manipulation transition-all
                            "
                          >
                            Mostrar más ({tareasFiltradas.length - visibleTareas.length} restantes)
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ── Panel Piezas (Con Animación animate-in fade-in) ── */}
            {tab === 'piezas' && (
              <section className="bg-slate-800/40 rounded-2xl border border-slate-700/40 overflow-hidden animate-in fade-in duration-200">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-700/40">
                  <h2 className="text-white font-semibold text-sm">
                    Repuestos predefinidos
                    <span className="text-slate-500 font-normal ml-1.5">
                      ({piezasFiltradas.length})
                    </span>
                  </h2>
                  <button
                    onClick={() => { haptic('light'); setModalPieza(true) }}
                    className="
                      flex items-center gap-1.5 pl-3 pr-4 min-h-[44px]
                      bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-2xl
                      text-sm font-semibold active:bg-purple-500/25
                      touch-manipulation transition-all
                    "
                    aria-label="Agregar repuesto"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <SearchInput
                    value={searchPiezas}
                    onChange={setSearchPiezas}
                    placeholder="Buscar repuesto…"
                  />

                  <div className="space-y-2">
                    {piezasFiltradas.length === 0 ? (
                      <EmptyState
                        Icon={Package}
                        title="Sin repuestos"
                        description={searchPiezas ? 'No hay resultados para tu búsqueda' : 'Agrega repuestos con el botón Agregar'}
                      />
                    ) : (
                      <>
                        {visiblePiezas.map(pieza => (
                          <PiezaItem 
                            key={pieza.id} 
                            pieza={pieza} 
                            onEdit={setEditPieza} 
                            onDelete={setPiezaToDelete} 
                          />
                        ))}

                        {hasMorePiezas && (
                          <button
                            onClick={() => {
                              haptic('light')
                              setPagePiezas(p => p + 1)
                            }}
                            type="button"
                            className="
                              w-full min-h-[48px] mt-2
                              flex items-center justify-center gap-1.5
                              text-sm font-medium text-purple-300
                              bg-purple-500/10 border border-purple-500/20
                              rounded-2xl active:bg-purple-500/20 active:scale-[0.98]
                              touch-manipulation transition-all
                            "
                          >
                            Mostrar más ({piezasFiltradas.length - visiblePiezas.length} restantes)
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* ── Modales de CREACIÓN Y EDICIÓN ── */}
      <ModalTarea
        isOpen={modalTarea || !!editTarea}
        onClose={() => {
          setModalTarea(false)
          setEditTarea(null)
        }}
        tarea={editTarea}
        onSubmit={editTarea ? handleActualizarTarea : handleCrearTarea}
      />

      <ModalPieza
        isOpen={modalPieza || !!editPieza}
        onClose={() => {
          setModalPieza(false)
          setEditPieza(null)
        }}
        pieza={editPieza}
        onSubmit={editPieza ? handleActualizarPieza : handleCrearPieza}
      />

      {/* ── Modales de CONFIRMACIÓN DE ELIMINACIÓN ── */}
      <Modal
        isOpen={!!tareaToDelete}
        onClose={() => setTareaToDelete(null)}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            ¿Estás seguro de que deseas eliminar esta tarea predefinida? Esta acción no se puede deshacer.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => {
                if (tareaToDelete) {
                  handleEliminarTarea(tareaToDelete)
                  setTareaToDelete(null)
                }
              }}
              type="button"
              className="
                w-full min-h-[50px] rounded-2xl font-bold text-sm
                bg-red-600/90 text-white hover:bg-red-600 active:scale-[0.98]
                transition-all flex items-center justify-center gap-2
              "
            >
              <Trash2 className="w-4 h-4" />
              Sí, eliminar
            </button>
            <button
              onClick={() => setTareaToDelete(null)}
              type="button"
              className="
                w-full min-h-[50px] rounded-2xl font-bold text-sm
                text-slate-400 active:bg-slate-800 touch-manipulation transition-all
              "
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!piezaToDelete}
        onClose={() => setPiezaToDelete(null)}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            ¿Estás seguro de que deseas eliminar este repuesto predefinido? Esta acción no se puede deshacer.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => {
                if (piezaToDelete) {
                  handleEliminarPieza(piezaToDelete)
                  setPiezaToDelete(null)
                }
              }}
              type="button"
              className="
                w-full min-h-[50px] rounded-2xl font-bold text-sm
                bg-red-600/90 text-white hover:bg-red-600 active:scale-[0.98]
                transition-all flex items-center justify-center gap-2
              "
            >
              <Trash2 className="w-4 h-4" />
              Sí, eliminar
            </button>
            <button
              onClick={() => setPiezaToDelete(null)}
              type="button"
              className="
                w-full min-h-[50px] rounded-2xl font-bold text-sm
                text-slate-400 active:bg-slate-800 touch-manipulation transition-all
              "
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
