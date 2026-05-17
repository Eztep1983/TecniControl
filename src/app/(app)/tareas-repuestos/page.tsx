'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useTareasYPiezas } from '@/hooks/useTareasYPiezas'
import type { TareaPredefinida, PiezaPredefinida } from '@/lib/configuracion-helpers'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  ListChecks, Package, Plus, Trash2, Edit3,
  X, Search, AlertCircle, CheckCircle,
  Wrench, RotateCw, WifiOff, Loader2, CloudOff,
  RefreshCw
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

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

// Hook de keyboard avoidance importado desde '@/components/ui/Modal'


// ─── Tipos de formulario ──────────────────────────────────────────────────

type FormTarea = { nombre: string; tipo: TareaPredefinida['tipo']; categoria: string }
type FormPieza = { nombre: string; categoria: string }

const FORM_TAREA_VACIO: FormTarea = { nombre: '', tipo: 'preventivo', categoria: 'General' }
const FORM_PIEZA_VACIO: FormPieza = { nombre: '', categoria: 'Categoría Genérica' }

// ─── Componente: Toast (conservado) ────────────────────────────────────────

interface ToastData { text: string; type: 'success' | 'error' | 'info' }

const Toast = ({ toast, onClose }: { toast: ToastData; onClose: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const styles = {
    success: 'bg-emerald-600/95 border-emerald-500/50',
    error:   'bg-red-600/95 border-red-500/50',
    info:    'bg-blue-600/95 border-blue-500/50',
  }
  const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? AlertCircle : RefreshCw

  return (
    <div
      className={`
        fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] left-4 right-4 z-[60]
        flex items-center gap-3 p-4 rounded-2xl border shadow-2xl 
        animate-in slide-in-from-bottom-4 duration-300
        ${styles[toast.type]}
      `}
    >
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
  )
}

// Componente Modal importado desde '@/components/ui/Modal'



// ─── Componente: Campo de búsqueda (conservado) ────────────────────────────

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
        bg-slate-800/70 border border-slate-700/60 rounded-xl
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
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white active:text-white touch-manipulation"
        aria-label="Limpiar"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
)

// ─── Componente: Estadística (conservado) ──────────────────────────────────

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
  <div className="shrink-0 bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3 min-w-[90px]">
    <div className="flex items-center gap-1.5 mb-0.5">
      <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
      <span className={`text-xl font-bold leading-none ${colorClass}`}>{value}</span>
    </div>
    <span className="text-[11px] text-slate-400 leading-tight">{label}</span>
  </div>
)

// ─── Componente: Chip de tipo (conservado) ─────────────────────────────────

const TipoChip = ({ tipo }: { tipo: TareaPredefinida['tipo'] }) => {
  const styles = {
    preventivo: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
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

// ─── Componente: Estado vacío (conservado) ─────────────────────────────────

const EmptyState = ({
  Icon,
  title,
  description,
}: {
  Icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) => (
  <div className="flex flex-col items-center justify-center py-14 text-center">
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
        <span>{pendingCount} pendiente${pendingCount > 1 ? 's' : ''}</span>
      </div>
    )
  }

  return null
}

// ─── Formulario de Tarea (conservado) ──────────────────────────────────────

const FormularioTarea = ({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  accentClass,
}: {
  form: FormTarea
  onChange: (f: FormTarea) => void
  onSubmit: () => void
  onCancel?: () => void
  submitLabel: string
  accentClass: string
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre *</label>
      <input
        type="text"
        value={form.nombre}
        onChange={e => onChange({ ...form, nombre: e.target.value })}
        placeholder="Ej: Cambio de aceite"
        autoFocus
        className="
          w-full min-h-[48px] px-4 py-3
          bg-slate-800 border border-slate-700 rounded-xl
          text-white placeholder-slate-500 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500/40
          transition-all
        "
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">Tipo</label>
      <select
        value={form.tipo}
        onChange={e => onChange({ ...form, tipo: e.target.value as TareaPredefinida['tipo'] })}
        className="
          w-full min-h-[48px] px-4 py-3
          bg-slate-800 border border-slate-700 rounded-xl
          text-white text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500/40
          transition-all appearance-none
        "
      >
        <option value="preventivo">Preventivo</option>
        <option value="correctivo">Correctivo</option>
        <option value="ambos">Ambos</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">Categoría</label>
      <input
        type="text"
        value={form.categoria}
        onChange={e => onChange({ ...form, categoria: e.target.value })}
        placeholder="Ej: Motor, Software, Hardware…"
        className="
          w-full min-h-[48px] px-4 py-3
          bg-slate-800 border border-slate-700 rounded-xl
          text-white placeholder-slate-500 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500/40
          transition-all
        "
      />
    </div>
    <div className="flex gap-3 pt-1">
      {onCancel && (
        <button
          onClick={onCancel}
          className="
            flex-1 min-h-[48px] py-3 rounded-xl font-medium text-sm
            bg-slate-700/80 text-slate-300
            active:bg-slate-700 touch-manipulation transition-all
          "
        >
          Cancelar
        </button>
      )}
      <button
        onClick={onSubmit}
        className={`flex-1 min-h-[48px] py-3 rounded-xl font-medium text-sm active:scale-[0.98] touch-manipulation transition-all ${accentClass}`}
      >
        {submitLabel}
      </button>
    </div>
  </div>
)

// ─── Formulario de Pieza (conservado) ──────────────────────────────────────

const FormularioPieza = ({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  accentClass,
}: {
  form: FormPieza
  onChange: (f: FormPieza) => void
  onSubmit: () => void
  onCancel?: () => void
  submitLabel: string
  accentClass: string
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre *</label>
      <input
        type="text"
        value={form.nombre}
        onChange={e => onChange({ ...form, nombre: e.target.value })}
        placeholder="Ej: Filtro de aceite"
        autoFocus
        className="
          w-full min-h-[48px] px-4 py-3
          bg-slate-800 border border-slate-700 rounded-xl
          text-white placeholder-slate-500 text-sm
          focus:outline-none focus:ring-2 focus:ring-purple-500/40
          transition-all
        "
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">Categoría</label>
      <input
        type="text"
        value={form.categoria}
        onChange={e => onChange({ ...form, categoria: e.target.value })}
        placeholder="Ej: Filtros, Eléctrico…"
        className="
          w-full min-h-[48px] px-4 py-3
          bg-slate-800 border border-slate-700 rounded-xl
          text-white placeholder-slate-500 text-sm
          focus:outline-none focus:ring-2 focus:ring-purple-500/40
          transition-all
        "
      />
    </div>
    <div className="flex gap-3 pt-1">
      {onCancel && (
        <button
          onClick={onCancel}
          className="
            flex-1 min-h-[48px] py-3 rounded-xl font-medium text-sm
            bg-slate-700/80 text-slate-300
            active:bg-slate-700 touch-manipulation transition-all
          "
        >
          Cancelar
        </button>
      )}
      <button
        onClick={onSubmit}
        className={`flex-1 min-h-[48px] py-3 rounded-xl font-medium text-sm active:scale-[0.98] touch-manipulation transition-all ${accentClass}`}
      >
        {submitLabel}
      </button>
    </div>
  </div>
)

// ─── PÁGINA PRINCIPAL (REFACTORIZADA VISUALMENTE) ─────────────────────────

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
  const [formTarea, setFormTarea]   = useState<FormTarea>(FORM_TAREA_VACIO)
  const [modalPieza, setModalPieza] = useState(false)
  const [formPieza, setFormPieza]   = useState<FormPieza>(FORM_PIEZA_VACIO)

  // Formularios de edición
  const [editTarea, setEditTarea]   = useState<TareaPredefinida | null>(null)
  const [editPieza, setEditPieza]   = useState<PiezaPredefinida | null>(null)

  // Búsqueda
  const [searchTareas, setSearchTareas] = useState('')
  const [searchPiezas, setSearchPiezas] = useState('')
  const debouncedSearchTareas = useDebounce(searchTareas, 250)
  const debouncedSearchPiezas = useDebounce(searchPiezas, 250)

  // Paginación
  const [pageTareas, setPageTareas]   = useState(1)
  const [pagePiezas, setPagePiezas]   = useState(1)

  // Resetear página al cambiar búsqueda o tab
  useEffect(() => { setPageTareas(1) }, [debouncedSearchTareas])
  useEffect(() => { setPagePiezas(1) }, [debouncedSearchPiezas])
  useEffect(() => { setPageTareas(1); setPagePiezas(1) }, [tab])

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

  const handleCrearTarea = useCallback(() => {
    if (!formTarea.nombre.trim()) {
      showToast('El nombre de la tarea es requerido', 'error')
      notificationHaptic('error')
      return
    }
    crearTarea({ nombre: formTarea.nombre.trim(), tipo: formTarea.tipo, categoria: formTarea.categoria.trim() || 'General' })
    setFormTarea(FORM_TAREA_VACIO)
    setModalTarea(false)
    haptic('medium')
    showToast(isOnline ? 'Tarea agregada' : 'Tarea guardada (sin conexión)')
  }, [formTarea, crearTarea, isOnline, showToast])

  const handleActualizarTarea = useCallback(() => {
    if (!editTarea?.nombre.trim()) {
      showToast('El nombre es requerido', 'error')
      notificationHaptic('error')
      return
    }
    actualizarTarea(editTarea)
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

  const handleCrearPieza = useCallback(() => {
    if (!formPieza.nombre.trim()) {
      showToast('El nombre de la pieza es requerido', 'error')
      notificationHaptic('error')
      return
    }
    crearPieza({ nombre: formPieza.nombre.trim(), categoria: formPieza.categoria.trim() || 'Categoría Genérica' })
    setFormPieza(FORM_PIEZA_VACIO)
    setModalPieza(false)
    haptic('medium')
    showToast(isOnline ? 'Pieza agregada' : 'Pieza guardada (sin conexión)')
  }, [formPieza, crearPieza, isOnline, showToast])

  const handleActualizarPieza = useCallback(() => {
    if (!editPieza?.nombre.trim()) {
      showToast('El nombre es requerido', 'error')
      notificationHaptic('error')
      return
    }
    actualizarPieza(editPieza)
    setEditPieza(null)
    haptic('light')
    showToast('Pieza actualizada')
  }, [editPieza, actualizarPieza, showToast])

  const handleEliminarPieza = useCallback((id: string) => {
    eliminarPieza(id)
    haptic('medium')
    showToast('Pieza eliminada')
  }, [eliminarPieza, showToast])

  // ── Guard ─────────────────────────────────────────────────────────────────

  if (!user) return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-slate-400 text-sm">Debes iniciar sesión para continuar</p>
    </div>
  )

  // ── Paginación: elementos visibles ────────────────────────────────────────

  const visibleTareas = useMemo(() => tareasFiltradas.slice(0, pageTareas * PAGE_SIZE), [tareasFiltradas, pageTareas])
  const visiblePiezas = useMemo(() => piezasFiltradas.slice(0, pagePiezas * PAGE_SIZE), [piezasFiltradas, pagePiezas])
  const hasMoreTareas = visibleTareas.length < tareasFiltradas.length
  const hasMorePiezas = visiblePiezas.length < piezasFiltradas.length

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="bg-transparent h-full"
    >
      <header
        className="
          bg-transparent shadow-2xl
          px-4 py-3
        "
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white shadow-2xl leading-tight truncate">
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
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">
            Modo offline — los cambios se sincronizarán al reconectar
          </p>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* ── Contenido principal ── */}
      <main
        className="max-w-2xl mx-auto px-4 py-5 space-y-5"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {isLoading ? (
          <Skeleton />
        ) : (
          <>
            


            {/* Tabs */}
            <div className="flex bg-slate-800/60 rounded-2xl p-1.5 border border-slate-700/40">
              {(
                [
                  { key: 'tareas', label: 'Tareas',    Icon: ListChecks, active: 'bg-blue-500/20 text-blue-300'   },
                  { key: 'piezas', label: 'Repuestos',  Icon: Package,    active: 'bg-purple-500/20 text-purple-300'},
                ] as const
              ).map(({ key, label, Icon, active }) => (
                <button
                  key={key}
                  onClick={() => { haptic('light'); setTab(key) }}
                  aria-pressed={tab === key}
                  className={`
                    flex-1 flex items-center justify-center gap-2
                    min-h-[44px] rounded-xl text-sm font-medium
                    transition-all touch-manipulation select-none
                    ${tab === key ? active : 'text-slate-400 active:text-slate-200'}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Panel Tareas ── */}
            {tab === 'tareas' && (
              <section className="bg-slate-800/40 rounded-2xl border border-slate-700/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-700/40">
                  <h2 className="text-white font-semibold text-sm">
                    Tareas predefinidas
                    <span className="text-slate-500 font-normal ml-1">
                      ({visibleTareas.length}{hasMoreTareas ? `+${tareasFiltradas.length - visibleTareas.length}` : ''})
                    </span>
                  </h2>
                  <button
                    onClick={() => { haptic('light'); setModalTarea(true) }}
                    className="
                      flex items-center gap-1.5 pl-3 pr-4 min-h-[36px]
                      bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-xl
                      text-sm font-medium active:bg-blue-500/25
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
                        {/* LISTA CON TARJETAS Y BOTONES INLINE */}
                        {visibleTareas.map(tarea => (
                          <div
                            key={tarea.id}
                            className="
                              bg-slate-800/70 rounded-xl px-4 py-3.5
                              border border-slate-700/40
                              flex items-start gap-3
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

                            {/* Botones de acción inline */}
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() => { haptic('light'); setEditTarea(tarea) }}
                                className="
                                  w-8 h-8 flex items-center justify-center
                                  rounded-lg bg-blue-500/10 text-blue-400
                                  active:bg-blue-500/20
                                  touch-manipulation transition-all
                                "
                                aria-label="Editar tarea"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEliminarTarea(tarea.id)}
                                className="
                                  w-8 h-8 flex items-center justify-center
                                  rounded-lg bg-red-500/10 text-red-400
                                  active:bg-red-500/20
                                  touch-manipulation transition-all
                                "
                                aria-label="Eliminar tarea"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Paginación: botón "Mostrar más" */}
                        {hasMoreTareas && (
                          <button
                            onClick={() => {
                              haptic('light')
                              setPageTareas(p => p + 1)
                            }}
                            className="
                              w-full min-h-[48px] mt-2
                              flex items-center justify-center gap-1.5
                              text-sm font-medium text-blue-300
                              bg-blue-500/10 border border-blue-500/20
                              rounded-xl active:bg-blue-500/20
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

            {/* ── Panel Piezas ── */}
            {tab === 'piezas' && (
              <section className="bg-slate-800/40 rounded-2xl border border-slate-700/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-700/40">
                  <h2 className="text-white font-semibold text-sm">
                    Repuestos predefinidos
                    <span className="text-slate-500 font-normal ml-1">
                      ({visiblePiezas.length}{hasMorePiezas ? `+${piezasFiltradas.length - visiblePiezas.length}` : ''})
                    </span>
                  </h2>
                  <button
                    onClick={() => { haptic('light'); setModalPieza(true) }}
                    className="
                      flex items-center gap-1.5 pl-3 pr-4 min-h-[36px]
                      bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-xl
                      text-sm font-medium active:bg-purple-500/25
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
                          <div
                            key={pieza.id}
                            className="
                              bg-slate-800/70 rounded-xl px-4 py-3.5
                              border border-slate-700/40
                              flex items-start gap-3
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

                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() => { haptic('light'); setEditPieza(pieza) }}
                                className="
                                  w-8 h-8 flex items-center justify-center
                                  rounded-lg bg-blue-500/10 text-blue-400
                                  active:bg-blue-500/20
                                  touch-manipulation transition-all
                                "
                                aria-label="Editar repuesto"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEliminarPieza(pieza.id)}
                                className="
                                  w-8 h-8 flex items-center justify-center
                                  rounded-lg bg-red-500/10 text-red-400
                                  active:bg-red-500/20
                                  touch-manipulation transition-all
                                "
                                aria-label="Eliminar repuesto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {hasMorePiezas && (
                          <button
                            onClick={() => {
                              haptic('light')
                              setPagePiezas(p => p + 1)
                            }}
                            className="
                              w-full min-h-[48px] mt-2
                              flex items-center justify-center gap-1.5
                              text-sm font-medium text-purple-300
                              bg-purple-500/10 border border-purple-500/20
                              rounded-xl active:bg-purple-500/20
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

      {/* ── Modales de CREACIÓN ── */}
      <Modal
        isOpen={modalTarea}
        onClose={() => setModalTarea(false)}
        title="Nueva tarea"
      >
        <FormularioTarea
          form={formTarea}
          onChange={setFormTarea}
          onSubmit={handleCrearTarea}
          submitLabel="Agregar tarea"
          accentClass="bg-blue-500/20 text-blue-300 border border-blue-500/30"
        />
      </Modal>

      <Modal
        isOpen={modalPieza}
        onClose={() => setModalPieza(false)}
        title="Nuevo repuesto"
      >
        <FormularioPieza
          form={formPieza}
          onChange={setFormPieza}
          onSubmit={handleCrearPieza}
          submitLabel="Agregar repuesto"
          accentClass="bg-purple-500/20 text-purple-300 border border-purple-500/30"
        />
      </Modal>

      {/* ── Modales de EDICIÓN ── */}
      <Modal
        isOpen={!!editTarea}
        onClose={() => setEditTarea(null)}
        title="Editar tarea"
      >
        {editTarea && (
          <FormularioTarea
            form={{ nombre: editTarea.nombre, tipo: editTarea.tipo, categoria: editTarea.categoria }}
            onChange={f => setEditTarea(prev => prev ? { ...prev, ...f } : null)}
            onSubmit={handleActualizarTarea}
            onCancel={() => setEditTarea(null)}
            submitLabel="Guardar cambios"
            accentClass="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          />
        )}
      </Modal>

      <Modal
        isOpen={!!editPieza}
        onClose={() => setEditPieza(null)}
        title="Editar repuesto"
      >
        {editPieza && (
          <FormularioPieza
            form={{ nombre: editPieza.nombre, categoria: editPieza.categoria }}
            onChange={f => setEditPieza(prev => prev ? { ...prev, ...f } : null)}
            onSubmit={handleActualizarPieza}
            onCancel={() => setEditPieza(null)}
            submitLabel="Guardar cambios"
            accentClass="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          />
        )}
      </Modal>
    </div>
  )
}
