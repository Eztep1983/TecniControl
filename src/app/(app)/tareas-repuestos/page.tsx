// app/(app)/configuracion/tareas-repuestos/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo, useRef, useTransition } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { 
  guardarTareasPredefinidas, 
  guardarPiezasPredefinidas, 
  obtenerTareasPredefinidas, 
  obtenerPiezasPredefinidas 
} from '@/lib/configuracionTareasR-helpers'
import { 
  ArrowLeft, 
  ListChecks, 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Search, 
  MoreVertical, 
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  RotateCw,
  ChevronRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SwipeableList, SwipeableListItem } from 'react-swipeable-list'
import 'react-swipeable-list/dist/styles.css'

// ============================================================================
// TIPOS Y CONSTANTES
// ============================================================================

interface TareaPredefinida {
  id: string
  nombre: string
  tipo: 'preventivo' | 'correctivo' | 'ambos'
  categoria: string
}

interface PiezaPredefinida {
  id: string
  nombre: string
  categoria: string
}

const COLORS = {
  primary: '#3b82f6',   // blue-500
  secondary: '#8b5cf6', // purple-500
  success: '#10b981',   // emerald-500
  danger: '#ef4444',    // red-500
  warning: '#f59e0b',   // amber-500
  dark: {
    900: '#0f172a',
    800: '#1e293b',
    700: '#334155',
    600: '#475569',
    500: '#64748b',
    400: '#94a3b8',
    300: '#cbd5e1'
  }
}

// ============================================================================
// COMPONENTES REUTILIZABLES OPTIMIZADOS PARA MÓVIL
// ============================================================================

const LoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse px-4 py-6">
    <div className="flex gap-3 overflow-x-auto pb-2">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="h-16 w-20 bg-slate-800/50 rounded-xl flex-shrink-0" />
      ))}
    </div>
    <div className="h-12 bg-slate-800/50 rounded-xl" />
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="h-24 bg-slate-800/50 rounded-xl" />
      ))}
    </div>
  </div>
)

const EmptyState = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="bg-slate-800/40 p-4 rounded-full mb-4">
      <Icon className="w-10 h-10 text-slate-500" />
    </div>
    <p className="text-slate-300 font-medium text-lg">{title}</p>
    <p className="text-slate-500 text-sm mt-1 max-w-[200px]">{description}</p>
  </div>
)

interface BottomSheetModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

const BottomSheetModal = ({ isOpen, onClose, title, children }: BottomSheetModalProps) => {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return
    const currentY = e.touches[0].clientY
    if (currentY - touchStart > 50) {
      onClose()
      setTouchStart(null)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div 
        ref={sheetRef}
        className="relative bg-slate-900 w-full max-w-lg rounded-t-3xl shadow-2xl transform transition-all duration-300 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 mb-2" />
        <div className="flex items-center justify-between px-5 py-2 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 text-slate-400 hover:text-white active:bg-slate-800 rounded-full touch-manipulation"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

const SearchBar = ({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder: string }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-10 pr-8 py-3 bg-slate-800/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
        aria-label="Limpiar búsqueda"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
)

const SegmentedControl = ({ active, onChange }: { active: 'tareas' | 'piezas'; onChange: (tab: 'tareas' | 'piezas') => void }) => (
  <div className="flex bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
    <button
      onClick={() => onChange('tareas')}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all touch-manipulation ${
        active === 'tareas' 
          ? 'bg-blue-500/20 text-blue-300 shadow-sm' 
          : 'text-slate-400 hover:text-slate-300'
      }`}
      aria-pressed={active === 'tareas'}
    >
      <ListChecks className="w-4 h-4" />
      Tareas
    </button>
    <button
      onClick={() => onChange('piezas')}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all touch-manipulation ${
        active === 'piezas' 
          ? 'bg-purple-500/20 text-purple-300 shadow-sm' 
          : 'text-slate-400 hover:text-slate-300'
      }`}
      aria-pressed={active === 'piezas'}
    >
      <Package className="w-4 h-4" />
      Repuestos
    </button>
  </div>
)

const StatCard = ({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) => (
  <div className="flex-shrink-0 bg-slate-800/40 rounded-xl p-3 min-w-[90px] border border-slate-700/30">
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-xl font-bold ${color}`}>{value}</span>
    </div>
    <div className="text-xs text-slate-400">{label}</div>
  </div>
)

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-24 left-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up ${
      type === 'success' ? 'bg-emerald-600/95' : 'bg-red-600/95'
    } text-white backdrop-blur-sm`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-auto p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

const ContextMenu = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-400 active:bg-slate-700 rounded-full touch-manipulation"
        aria-label="Más opciones"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 bg-slate-800 rounded-xl shadow-xl border border-slate-700 py-1 min-w-[140px]">
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 active:bg-slate-600"
            >
              <Edit3 className="w-4 h-4 text-blue-400" />
              Editar
            </button>
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-slate-700 active:bg-slate-600"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function TareasRepuestosPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Estados principales
  const [tareas, setTareas] = useState<TareaPredefinida[]>([])
  const [piezas, setPiezas] = useState<PiezaPredefinida[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  
  // Estados de UI móvil
  const [tabActiva, setTabActiva] = useState<'tareas' | 'piezas'>('tareas')
  const [modalTareaOpen, setModalTareaOpen] = useState(false)
  const [modalPiezaOpen, setModalPiezaOpen] = useState(false)
  const [modoEdicion, setModoEdicion] = useState<{ tipo: 'tarea' | 'pieza'; id?: string } | null>(null)
  
  // Estados de formularios
  const [nuevaTarea, setNuevaTarea] = useState({ nombre: '', tipo: 'preventivo' as const, categoria: 'General' })
  const [nuevaPieza, setNuevaPieza] = useState({ nombre: '', categoria: 'Categoria Generica' })
  const [editTarea, setEditTarea] = useState<TareaPredefinida | null>(null)
  const [editPieza, setEditPieza] = useState<PiezaPredefinida | null>(null)
  
  // Búsqueda con debounce
  const [busquedaTareas, setBusquedaTareas] = useState('')
  const [busquedaPiezas, setBusquedaPiezas] = useState('')
  const debouncedTareas = useDebounce(busquedaTareas, 300)
  const debouncedPiezas = useDebounce(busquedaPiezas, 300)
  
  // Estados de feedback
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [cambiosPendientes, setCambiosPendientes] = useState(false)
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null)
  
  const esCargaInicial = useRef(true)
  const timeoutGuardado = useRef<NodeJS.Timeout | null>(null)

  // ==========================================================================
  // EFECTOS Y CARGA INICIAL
  // ==========================================================================

  useEffect(() => {
    cargarConfiguracion()
  }, [user?.uid])

  // Auto-guardado con debounce
  useEffect(() => {
    if (esCargaInicial.current) {
      esCargaInicial.current = false
      return
    }
    if (tareas.length > 0 || piezas.length > 0) {
      setCambiosPendientes(true)
      if (timeoutGuardado.current) clearTimeout(timeoutGuardado.current)
      timeoutGuardado.current = setTimeout(() => {
        guardarTodosLosCambios(true) // auto-save silencioso
      }, 1500)
    }
    return () => { if (timeoutGuardado.current) clearTimeout(timeoutGuardado.current) }
  }, [tareas, piezas])

  const cargarConfiguracion = useCallback(async () => {
    if (!user?.uid) return
    try {
      const [tareasData, piezasData] = await Promise.all([
        obtenerTareasPredefinidas(user.uid),
        obtenerPiezasPredefinidas(user.uid)
      ])
      setTareas((tareasData || []).filter(Boolean) as TareaPredefinida[])
      setPiezas((piezasData || []).filter(Boolean) as PiezaPredefinida[])
      setUltimoGuardado(new Date())
    } catch (error) {
      setToast({ text: 'Error al cargar la configuración', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  const guardarTodosLosCambios = useCallback(async (silent = false) => {
    if (!user?.uid) return
    if (!silent) setGuardando(true)
    try {
      await Promise.all([
        guardarTareasPredefinidas(user.uid, tareas),
        guardarPiezasPredefinidas(user.uid, piezas)
      ])
      setUltimoGuardado(new Date())
      setCambiosPendientes(false)
      if (!silent) setToast({ text: 'Cambios guardados correctamente', type: 'success' })
    } catch (error) {
      setToast({ text: 'Error al guardar los cambios', type: 'error' })
    } finally {
      if (!silent) setGuardando(false)
    }
  }, [user?.uid, tareas, piezas])

  // ==========================================================================
  // CRUD TAREAS
  // ==========================================================================

  const agregarTarea = useCallback(() => {
    if (!nuevaTarea.nombre.trim()) {
      setToast({ text: 'El nombre de la tarea es requerido', type: 'error' })
      return
    }
    const tarea: TareaPredefinida = {
      id: Date.now().toString(),
      ...nuevaTarea
    }
    setTareas(prev => [...prev, tarea])
    setNuevaTarea({ nombre: '', tipo: 'preventivo', categoria: 'General' })
    setModalTareaOpen(false)
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50)
    setToast({ text: 'Tarea agregada', type: 'success' })
  }, [nuevaTarea])

  const eliminarTarea = useCallback((id: string) => {
    setTareas(prev => prev.filter(t => t.id !== id))
    if (navigator.vibrate) navigator.vibrate(50)
    setToast({ text: 'Tarea eliminada', type: 'success' })
  }, [])

  const actualizarTarea = useCallback(() => {
    if (!editTarea) return
    if (!editTarea.nombre.trim()) {
      setToast({ text: 'El nombre es requerido', type: 'error' })
      return
    }
    setTareas(prev => prev.map(t => t.id === editTarea.id ? editTarea : t))
    setModoEdicion(null)
    setEditTarea(null)
    setToast({ text: 'Tarea actualizada', type: 'success' })
  }, [editTarea])

  // ==========================================================================
  // CRUD PIEZAS
  // ==========================================================================

  const agregarPieza = useCallback(() => {
    if (!nuevaPieza.nombre.trim()) {
      setToast({ text: 'El nombre de la pieza es requerido', type: 'error' })
      return
    }
    const pieza: PiezaPredefinida = {
      id: Date.now().toString(),
      ...nuevaPieza
    }
    setPiezas(prev => [...prev, pieza])
    setNuevaPieza({ nombre: '', categoria: 'Categoria Generica' })
    setModalPiezaOpen(false)
    if (navigator.vibrate) navigator.vibrate(50)
    setToast({ text: 'Pieza agregada', type: 'success' })
  }, [nuevaPieza])

  const eliminarPieza = useCallback((id: string) => {
    setPiezas(prev => prev.filter(p => p.id !== id))
    if (navigator.vibrate) navigator.vibrate(50)
    setToast({ text: 'Pieza eliminada', type: 'success' })
  }, [])

  const actualizarPieza = useCallback(() => {
    if (!editPieza) return
    if (!editPieza.nombre.trim()) {
      setToast({ text: 'El nombre es requerido', type: 'error' })
      return
    }
    setPiezas(prev => prev.map(p => p.id === editPieza.id ? editPieza : p))
    setModoEdicion(null)
    setEditPieza(null)
    setToast({ text: 'Pieza actualizada', type: 'success' })
  }, [editPieza])

  // ==========================================================================
  // FILTRADO CON DEBOUNCE
  // ==========================================================================

  const tareasFiltradas = useMemo(() => {
    if (!debouncedTareas) return tareas
    const term = debouncedTareas.toLowerCase()
    return tareas.filter(t => 
      t.nombre.toLowerCase().includes(term) ||
      t.categoria.toLowerCase().includes(term) ||
      t.tipo.includes(term)
    )
  }, [tareas, debouncedTareas])

  const piezasFiltradas = useMemo(() => {
    if (!debouncedPiezas) return piezas
    const term = debouncedPiezas.toLowerCase()
    return piezas.filter(p => 
      p.nombre.toLowerCase().includes(term) ||
      p.categoria.toLowerCase().includes(term)
    )
  }, [piezas, debouncedPiezas])

  // Estadísticas
  const stats = useMemo(() => ({
    totalTareas: tareas.length,
    preventivas: tareas.filter(t => t.tipo === 'preventivo').length,
    correctivas: tareas.filter(t => t.tipo === 'correctivo').length,
    ambos: tareas.filter(t => t.tipo === 'ambos').length,
    totalPiezas: piezas.length
  }), [tareas, piezas])

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!user) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center text-slate-400">Debes iniciar sesión</div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <LoadingSkeleton />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pb-20">
              {/* Header sticky con indicador de sincronización */}
        <header 
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 text-blue-400 active:bg-slate-800 rounded-full touch-manipulation"
            aria-label="Volver"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Tareas y Repuestos</h1>
            <div className="flex items-center gap-2 text-xs">
              {cambiosPendientes ? (
                <span className="flex items-center gap-1 text-amber-400">
                  <Clock className="w-3 h-3" />
                  Cambios sin guardar
                </span>
              ) : ultimoGuardado ? (
                <span className="text-slate-500">
                  Guardado {ultimoGuardado.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : null}
            </div>
          </div>
          {cambiosPendientes && (
            <button
              onClick={() => guardarTodosLosCambios(false)}
              disabled={guardando}
              className="p-2 text-blue-400 active:bg-slate-800 rounded-full touch-manipulation"
              aria-label="Guardar ahora"
            >
              <Save className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.text} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <main className="max-w-6xl mx-auto px-4 py-5 space-y-6">
        {/* Stats horizontales scrollable */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <StatCard label="Total Tareas" value={stats.totalTareas} color="text-blue-400" icon={ListChecks} />
          <StatCard label="Preventivas" value={stats.preventivas} color="text-emerald-400" icon={Wrench} />
          <StatCard label="Correctivas" value={stats.correctivas} color="text-amber-400" icon={AlertCircle} />
          <StatCard label="Ambos" value={stats.ambos} color="text-purple-400" icon={RotateCw} />
          <StatCard label="Piezas" value={stats.totalPiezas} color="text-cyan-400" icon={Package} />
        </div>

        {/* Tabs */}
        <SegmentedControl active={tabActiva} onChange={setTabActiva} />

        {/* Panel Tareas */}
        {tabActiva === 'tareas' && (
          <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <h2 className="text-white font-semibold">Tareas predefinidas</h2>
              <button
                onClick={() => setModalTareaOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl active:scale-[0.98] transition-all touch-manipulation"
                aria-label="Agregar tarea"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>
            <div className="p-4">
              <SearchBar 
                value={busquedaTareas} 
                onChange={setBusquedaTareas} 
                placeholder="Buscar tarea..." 
              />
              <div className="mt-4 space-y-2">
                {tareasFiltradas.length === 0 ? (
                  <EmptyState 
                    icon={ListChecks} 
                    title="Sin tareas" 
                    description={busquedaTareas ? "No hay coincidencias" : "Agrega tareas usando el botón +"} 
                  />
                ) : (
                  <SwipeableList>
                    {tareasFiltradas.map(tarea => (
                      <SwipeableListItem
                        key={tarea.id}
                        swipeLeft={{
                          content: (
                            <div className="flex h-full items-center gap-2 px-4 bg-red-600 text-white rounded-r-lg">
                              <Trash2 className="w-5 h-5" />
                              <span className="text-sm font-medium">Eliminar</span>
                            </div>
                          ),
                          action: () => eliminarTarea(tarea.id)
                        }}
                        swipeRight={{
                          content: (
                            <div className="flex h-full items-center gap-2 px-4 bg-blue-600 text-white rounded-l-lg">
                              <Edit3 className="w-5 h-5" />
                              <span className="text-sm font-medium">Editar</span>
                            </div>
                          ),
                          action: () => {
                            setEditTarea(tarea)
                            setModoEdicion({ tipo: 'tarea', id: tarea.id })
                          }
                        }}
                      >
                        <div className="bg-slate-800/60 rounded-xl p-4 mb-2 border border-slate-700/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-white font-medium">{tarea.nombre}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  tarea.tipo === 'preventivo' ? 'bg-emerald-500/20 text-emerald-300' :
                                  tarea.tipo === 'correctivo' ? 'bg-amber-500/20 text-amber-300' :
                                  'bg-purple-500/20 text-purple-300'
                                }`}>
                                  {tarea.tipo}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-slate-700/80 text-slate-300 rounded-full">
                                  {tarea.categoria}
                                </span>
                              </div>
                            </div>
                            <ContextMenu 
                              onEdit={() => {
                                setEditTarea(tarea)
                                setModoEdicion({ tipo: 'tarea', id: tarea.id })
                              }}
                              onDelete={() => eliminarTarea(tarea.id)}
                            />
                          </div>
                        </div>
                      </SwipeableListItem>
                    ))}
                  </SwipeableList>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panel Piezas */}
        {tabActiva === 'piezas' && (
          <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <h2 className="text-white font-semibold">Piezas predefinidas</h2>
              <button
                onClick={() => setModalPiezaOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-xl active:scale-[0.98] transition-all touch-manipulation"
                aria-label="Agregar pieza"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>
            <div className="p-4">
              <SearchBar 
                value={busquedaPiezas} 
                onChange={setBusquedaPiezas} 
                placeholder="Buscar pieza..." 
              />
              <div className="mt-4 space-y-2">
                {piezasFiltradas.length === 0 ? (
                  <EmptyState 
                    icon={Package} 
                    title="Sin piezas" 
                    description={busquedaPiezas ? "No hay coincidencias" : "Agrega piezas usando el botón +"} 
                  />
                ) : (
                  <SwipeableList>
                    {piezasFiltradas.map(pieza => (
                      <SwipeableListItem
                        key={pieza.id}
                        swipeLeft={{
                          content: (
                            <div className="flex h-full items-center gap-2 px-4 bg-red-600 text-white rounded-r-lg">
                              <Trash2 className="w-5 h-5" />
                              <span className="text-sm font-medium">Eliminar</span>
                            </div>
                          ),
                          action: () => eliminarPieza(pieza.id)
                        }}
                        swipeRight={{
                          content: (
                            <div className="flex h-full items-center gap-2 px-4 bg-blue-600 text-white rounded-l-lg">
                              <Edit3 className="w-5 h-5" />
                              <span className="text-sm font-medium">Editar</span>
                            </div>
                          ),
                          action: () => {
                            setEditPieza(pieza)
                            setModoEdicion({ tipo: 'pieza', id: pieza.id })
                          }
                        }}
                      >
                        <div className="bg-slate-800/60 rounded-xl p-4 mb-2 border border-slate-700/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-white font-medium">{pieza.nombre}</p>
                              <p className="text-xs text-slate-400 mt-1">{pieza.categoria}</p>
                            </div>
                            <ContextMenu 
                              onEdit={() => {
                                setEditPieza(pieza)
                                setModoEdicion({ tipo: 'pieza', id: pieza.id })
                              }}
                              onDelete={() => eliminarPieza(pieza.id)}
                            />
                          </div>
                        </div>
                      </SwipeableListItem>
                    ))}
                  </SwipeableList>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Botón de guardado manual flotante (solo si hay cambios pendientes) */}
      {cambiosPendientes && (
        <div 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-md"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <button
            onClick={() => guardarTodosLosCambios(false)}
            disabled={guardando}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-medium shadow-xl active:scale-[0.98] transition-all touch-manipulation disabled:opacity-70 shadow-blue-900/20"
          >
            {guardando ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Guardar cambios pendientes</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Modales de agregar/editar */}
      <BottomSheetModal isOpen={modalTareaOpen} onClose={() => setModalTareaOpen(false)} title="Nueva tarea">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
            <input
              type="text"
              value={nuevaTarea.nombre}
              onChange={(e) => setNuevaTarea(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: Cambio de aceite"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
            <select
              value={nuevaTarea.tipo}
              onChange={(e) => setNuevaTarea(prev => ({ ...prev, tipo: e.target.value as any }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="preventivo">Preventivo</option>
              <option value="correctivo">Correctivo</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Categoría</label>
            <input
              type="text"
              value={nuevaTarea.categoria}
              onChange={(e) => setNuevaTarea(prev => ({ ...prev, categoria: e.target.value }))}
              placeholder="Ej: Motor"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <button 
            onClick={agregarTarea} 
            className="w-full py-3.5 bg-blue-500/20 text-blue-300 rounded-xl font-medium active:scale-[0.98] transition-all"
          >
            Agregar tarea
          </button>
        </div>
      </BottomSheetModal>

      <BottomSheetModal isOpen={modalPiezaOpen} onClose={() => setModalPiezaOpen(false)} title="Nueva pieza">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
            <input
              type="text"
              value={nuevaPieza.nombre}
              onChange={(e) => setNuevaPieza(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: Filtro de aceite"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Categoría</label>
            <input
              type="text"
              value={nuevaPieza.categoria}
              onChange={(e) => setNuevaPieza(prev => ({ ...prev, categoria: e.target.value }))}
              placeholder="Ej: Filtros"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <button 
            onClick={agregarPieza} 
            className="w-full py-3.5 bg-purple-500/20 text-purple-300 rounded-xl font-medium active:scale-[0.98] transition-all"
          >
            Agregar pieza
          </button>
        </div>
      </BottomSheetModal>

      {/* Modal de edición (reutiliza el mismo bottom sheet) */}
      {modoEdicion?.tipo === 'tarea' && editTarea && (
        <BottomSheetModal isOpen={true} onClose={() => { setModoEdicion(null); setEditTarea(null) }} title="Editar tarea">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
              <input
                type="text"
                value={editTarea.nombre}
                onChange={(e) => setEditTarea(prev => prev ? { ...prev, nombre: e.target.value } : null)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
              <select
                value={editTarea.tipo}
                onChange={(e) => setEditTarea(prev => prev ? { ...prev, tipo: e.target.value as any } : null)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              >
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Categoría</label>
              <input
                type="text"
                value={editTarea.categoria}
                onChange={(e) => setEditTarea(prev => prev ? { ...prev, categoria: e.target.value } : null)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={actualizarTarea} className="flex-1 py-3 bg-emerald-500/20 text-emerald-300 rounded-xl font-medium">Guardar</button>
              <button onClick={() => { setModoEdicion(null); setEditTarea(null) }} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-medium">Cancelar</button>
            </div>
          </div>
        </BottomSheetModal>
      )}

      {modoEdicion?.tipo === 'pieza' && editPieza && (
        <BottomSheetModal isOpen={true} onClose={() => { setModoEdicion(null); setEditPieza(null) }} title="Editar pieza">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
              <input
                type="text"
                value={editPieza.nombre}
                onChange={(e) => setEditPieza(prev => prev ? { ...prev, nombre: e.target.value } : null)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Categoría</label>
              <input
                type="text"
                value={editPieza.categoria}
                onChange={(e) => setEditPieza(prev => prev ? { ...prev, categoria: e.target.value } : null)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={actualizarPieza} className="flex-1 py-3 bg-emerald-500/20 text-emerald-300 rounded-xl font-medium">Guardar</button>
              <button onClick={() => { setModoEdicion(null); setEditPieza(null) }} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-medium">Cancelar</button>
            </div>
          </div>
        </BottomSheetModal>
      )}
    </div>
  )
}

// ============================================================================
// HOOK DE DEBOUNCE
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}