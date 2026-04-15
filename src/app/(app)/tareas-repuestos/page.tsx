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
import { ArrowLeft, ListChecks, Package, Plus, Trash2, Edit3, Save, X, Check, Search, MoreVertical, AlertCircle } from 'lucide-react'
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

// ============================================================================
// COMPONENTES REUTILIZABLES OPTIMIZADOS PARA MÓVIL
// ============================================================================

const LoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-12 bg-gray-700/50 rounded-lg" />
    <div className="h-32 bg-gray-700/50 rounded-lg" />
    <div className="h-24 bg-gray-700/50 rounded-lg" />
  </div>
)

const EmptyState = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Icon className="w-16 h-16 text-gray-600 mb-4" />
    <p className="text-gray-300 font-medium">{title}</p>
    <p className="text-gray-500 text-sm mt-1">{description}</p>
  </div>
)

const BottomSheetModal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div 
        className="relative bg-gray-800 w-full max-w-lg rounded-t-2xl shadow-xl transform transition-all duration-300 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white touch-manipulation">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex-shrink-0 bg-gray-800/30 rounded-xl p-3 min-w-[80px] text-center border border-gray-700/30">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-gray-400 mt-1">{label}</div>
  </div>
)

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
  const [mensajeSnackbar, setMensajeSnackbar] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
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
      mostrarMensaje('Error al cargar la configuración', 'error')
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  const mostrarMensaje = useCallback((text: string, type: 'success' | 'error') => {
    setMensajeSnackbar({ text, type })
    setTimeout(() => setMensajeSnackbar(null), 3000)
  }, [])

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
      if (!silent) mostrarMensaje('Cambios guardados correctamente', 'success')
    } catch (error) {
      mostrarMensaje('Error al guardar los cambios', 'error')
    } finally {
      if (!silent) setGuardando(false)
    }
  }, [user?.uid, tareas, piezas])

  // ==========================================================================
  // CRUD TAREAS
  // ==========================================================================

  const agregarTarea = useCallback(() => {
    if (!nuevaTarea.nombre.trim()) {
      mostrarMensaje('El nombre de la tarea es requerido', 'error')
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
    mostrarMensaje('Tarea agregada', 'success')
  }, [nuevaTarea])

  const eliminarTarea = useCallback((id: string) => {
    setTareas(prev => prev.filter(t => t.id !== id))
    if (navigator.vibrate) navigator.vibrate(50)
    mostrarMensaje('Tarea eliminada', 'success')
  }, [])

  const actualizarTarea = useCallback(() => {
    if (!editTarea) return
    if (!editTarea.nombre.trim()) {
      mostrarMensaje('El nombre es requerido', 'error')
      return
    }
    setTareas(prev => prev.map(t => t.id === editTarea.id ? editTarea : t))
    setModoEdicion(null)
    setEditTarea(null)
    mostrarMensaje('Tarea actualizada', 'success')
  }, [editTarea])

  // ==========================================================================
  // CRUD PIEZAS
  // ==========================================================================

  const agregarPieza = useCallback(() => {
    if (!nuevaPieza.nombre.trim()) {
      mostrarMensaje('El nombre de la pieza es requerido', 'error')
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
    mostrarMensaje('Pieza agregada', 'success')
  }, [nuevaPieza])

  const eliminarPieza = useCallback((id: string) => {
    setPiezas(prev => prev.filter(p => p.id !== id))
    if (navigator.vibrate) navigator.vibrate(50)
    mostrarMensaje('Pieza eliminada', 'success')
  }, [])

  const actualizarPieza = useCallback(() => {
    if (!editPieza) return
    if (!editPieza.nombre.trim()) {
      mostrarMensaje('El nombre es requerido', 'error')
      return
    }
    setPiezas(prev => prev.map(p => p.id === editPieza.id ? editPieza : p))
    setModoEdicion(null)
    setEditPieza(null)
    mostrarMensaje('Pieza actualizada', 'success')
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center text-gray-400">Debes iniciar sesión</div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen bg-gray-900 p-4">
      <LoadingSkeleton />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 pb-20">
      {/* Header sticky con safe area */}
      <header className="sticky top-0 z-20 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-3" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-blue-400 active:bg-gray-800 rounded-full touch-manipulation">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Tareas y Repuestos</h1>
            <p className="text-xs text-gray-400">Gestiona tu catálogo</p>
          </div>
        </div>
      </header>

      {/* Snackbar flotante */}
      {mensajeSnackbar && (
        <div className={`fixed bottom-20 left-4 right-4 z-50 p-3 rounded-lg shadow-lg text-center text-sm font-medium transition-all animate-slide-up ${
          mensajeSnackbar.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {mensajeSnackbar.text}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-6">
        {/* Stats horizontales scrollable */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <StatCard label="Total Tareas" value={stats.totalTareas} color="text-blue-400" />
          <StatCard label="Preventivas" value={stats.preventivas} color="text-green-400" />
          <StatCard label="Correctivas" value={stats.correctivas} color="text-orange-400" />
          <StatCard label="Ambos" value={stats.ambos} color="text-purple-400" />
          <StatCard label="Piezas" value={stats.totalPiezas} color="text-cyan-400" />
        </div>

        {/* Tabs móvil */}
        <div className="flex bg-gray-800/60 rounded-xl p-1 border border-gray-700/50">
          <button
            onClick={() => setTabActiva('tareas')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all touch-manipulation ${
              tabActiva === 'tareas' ? 'bg-blue-500/20 text-blue-300 shadow-sm' : 'text-gray-400'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            Tareas
          </button>
          <button
            onClick={() => setTabActiva('piezas')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all touch-manipulation ${
              tabActiva === 'piezas' ? 'bg-purple-500/20 text-purple-300 shadow-sm' : 'text-gray-400'
            }`}
          >
            <Package className="w-4 h-4" />
            Repuestos
          </button>
        </div>

        {/* Panel Tareas */}
        {tabActiva === 'tareas' && (
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
              <h2 className="text-white font-semibold">Tareas predefinidas</h2>
              <button
                onClick={() => setModalTareaOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl active:scale-95 transition-all touch-manipulation"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>
            <div className="p-3">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  value={busquedaTareas}
                  onChange={(e) => setBusquedaTareas(e.target.value)}
                  placeholder="Buscar tarea..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 text-sm"
                />
              </div>
              <div className="space-y-2">
                {tareasFiltradas.length === 0 ? (
                  <EmptyState icon={ListChecks} title="Sin tareas" description={busquedaTareas ? "No hay coincidencias" : "Agrega tareas usando el botón +"} />
                ) : (
                  <SwipeableList>
                    {tareasFiltradas.map(tarea => (
                      <SwipeableListItem
                        key={tarea.id}
                        swipeLeft={{
                          content: (
                            <div className="flex h-full items-center gap-2 px-4 bg-red-600 text-white">
                              <Trash2 className="w-5 h-5" />
                            </div>
                          ),
                          action: () => eliminarTarea(tarea.id)
                        }}
                        swipeRight={{
                          content: (
                            <div className="flex h-full items-center gap-2 px-4 bg-blue-600 text-white">
                              <Edit3 className="w-5 h-5" />
                            </div>
                          ),
                          action: () => {
                            setEditTarea(tarea)
                            setModoEdicion({ tipo: 'tarea', id: tarea.id })
                          }
                        }}
                      >
                        <div className="bg-gray-700/30 rounded-xl p-3 mb-2 border border-gray-600/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-white font-medium">{tarea.nombre}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  tarea.tipo === 'preventivo' ? 'bg-green-500/20 text-green-300' :
                                  tarea.tipo === 'correctivo' ? 'bg-orange-500/20 text-orange-300' :
                                  'bg-purple-500/20 text-purple-300'
                                }`}>
                                  {tarea.tipo}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-gray-600/50 text-gray-300 rounded-full">
                                  {tarea.categoria}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => { setEditTarea(tarea); setModoEdicion({ tipo: 'tarea', id: tarea.id }) }} className="p-2 text-blue-400 active:bg-gray-700 rounded-full">
                                <Edit3 className="w-5 h-5" />
                              </button>
                              <button onClick={() => eliminarTarea(tarea.id)} className="p-2 text-red-400 active:bg-gray-700 rounded-full">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
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
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
              <h2 className="text-white font-semibold">Piezas predefinidas</h2>
              <button
                onClick={() => setModalPiezaOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-xl active:scale-95 transition-all touch-manipulation"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>
            <div className="p-3">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  value={busquedaPiezas}
                  onChange={(e) => setBusquedaPiezas(e.target.value)}
                  placeholder="Buscar pieza..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 text-sm"
                />
              </div>
              <div className="space-y-2">
                {piezasFiltradas.length === 0 ? (
                  <EmptyState icon={Package} title="Sin piezas" description={busquedaPiezas ? "No hay coincidencias" : "Agrega piezas usando el botón +"} />
                ) : (
                  <SwipeableList>
                    {piezasFiltradas.map(pieza => (
                      <SwipeableListItem
                        key={pieza.id}
                        swipeLeft={{
                          content: <div className="flex h-full items-center px-4 bg-red-600"><Trash2 className="w-5 h-5 text-white" /></div>,
                          action: () => eliminarPieza(pieza.id)
                        }}
                        swipeRight={{
                          content: <div className="flex h-full items-center px-4 bg-blue-600"><Edit3 className="w-5 h-5 text-white" /></div>,
                          action: () => { setEditPieza(pieza); setModoEdicion({ tipo: 'pieza', id: pieza.id }) }
                        }}
                      >
                        <div className="bg-gray-700/30 rounded-xl p-3 mb-2 border border-gray-600/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{pieza.nombre}</p>
                              <p className="text-xs text-gray-400 mt-1">{pieza.categoria}</p>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => { setEditPieza(pieza); setModoEdicion({ tipo: 'pieza', id: pieza.id }) }} className="p-2 text-blue-400 active:bg-gray-700 rounded-full">
                                <Edit3 className="w-5 h-5" />
                              </button>
                              <button onClick={() => eliminarPieza(pieza.id)} className="p-2 text-red-400 active:bg-gray-700 rounded-full">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
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

        {/* Botón de guardado manual sticky (solo si hay cambios pendientes) */}
        {cambiosPendientes && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/95 backdrop-blur-lg border-t border-gray-700 z-30" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
            <button
              onClick={() => guardarTodosLosCambios(false)}
              disabled={guardando}
              className="w-full flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-lg active:scale-[0.98] transition-all touch-manipulation disabled:opacity-70"
            >
              {guardando ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{guardando ? 'Guardando...' : 'Guardar cambios pendientes'}</span>
            </button>
          </div>
        )}
      </main>

      {/* Modales de agregar/editar */}
      <BottomSheetModal isOpen={modalTareaOpen} onClose={() => setModalTareaOpen(false)} title="Nueva tarea">
        <div className="space-y-4">
          <input
            type="text"
            value={nuevaTarea.nombre}
            onChange={(e) => setNuevaTarea(prev => ({ ...prev, nombre: e.target.value }))}
            placeholder="Nombre de la tarea"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white"
            autoFocus
          />
          <select
            value={nuevaTarea.tipo}
            onChange={(e) => setNuevaTarea(prev => ({ ...prev, tipo: e.target.value as any }))}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white"
          >
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
            <option value="ambos">Ambos</option>
          </select>
          <input
            type="text"
            value={nuevaTarea.categoria}
            onChange={(e) => setNuevaTarea(prev => ({ ...prev, categoria: e.target.value }))}
            placeholder="Categoría"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white"
          />
          <button onClick={agregarTarea} className="w-full py-3 bg-blue-500/20 text-blue-300 rounded-xl font-medium active:scale-95 transition-all">
            Agregar tarea
          </button>
        </div>
      </BottomSheetModal>

      <BottomSheetModal isOpen={modalPiezaOpen} onClose={() => setModalPiezaOpen(false)} title="Nueva pieza">
        <div className="space-y-4">
          <input
            type="text"
            value={nuevaPieza.nombre}
            onChange={(e) => setNuevaPieza(prev => ({ ...prev, nombre: e.target.value }))}
            placeholder="Nombre de la pieza"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white"
            autoFocus
          />
          <input
            type="text"
            value={nuevaPieza.categoria}
            onChange={(e) => setNuevaPieza(prev => ({ ...prev, categoria: e.target.value }))}
            placeholder="Categoría"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white"
          />
          <button onClick={agregarPieza} className="w-full py-3 bg-purple-500/20 text-purple-300 rounded-xl font-medium active:scale-95 transition-all">
            Agregar pieza
          </button>
        </div>
      </BottomSheetModal>

      {/* Modal de edición (reutiliza el mismo bottom sheet) */}
      {modoEdicion?.tipo === 'tarea' && editTarea && (
        <BottomSheetModal isOpen={true} onClose={() => { setModoEdicion(null); setEditTarea(null) }} title="Editar tarea">
          <div className="space-y-4">
            <input
              type="text"
              value={editTarea.nombre}
              onChange={(e) => setEditTarea(prev => prev ? { ...prev, nombre: e.target.value } : null)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white"
            />
            <select
              value={editTarea.tipo}
              onChange={(e) => setEditTarea(prev => prev ? { ...prev, tipo: e.target.value as any } : null)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white"
            >
              <option value="preventivo">Preventivo</option>
              <option value="correctivo">Correctivo</option>
              <option value="ambos">Ambos</option>
            </select>
            <input
              type="text"
              value={editTarea.categoria}
              onChange={(e) => setEditTarea(prev => prev ? { ...prev, categoria: e.target.value } : null)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white"
            />
            <div className="flex gap-3">
              <button onClick={actualizarTarea} className="flex-1 py-3 bg-green-500/20 text-green-300 rounded-xl">Guardar</button>
              <button onClick={() => { setModoEdicion(null); setEditTarea(null) }} className="flex-1 py-3 bg-gray-600 text-white rounded-xl">Cancelar</button>
            </div>
          </div>
        </BottomSheetModal>
      )}

      {modoEdicion?.tipo === 'pieza' && editPieza && (
        <BottomSheetModal isOpen={true} onClose={() => { setModoEdicion(null); setEditPieza(null) }} title="Editar pieza">
          <div className="space-y-4">
            <input
              type="text"
              value={editPieza.nombre}
              onChange={(e) => setEditPieza(prev => prev ? { ...prev, nombre: e.target.value } : null)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white"
            />
            <input
              type="text"
              value={editPieza.categoria}
              onChange={(e) => setEditPieza(prev => prev ? { ...prev, categoria: e.target.value } : null)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white"
            />
            <div className="flex gap-3">
              <button onClick={actualizarPieza} className="flex-1 py-3 bg-green-500/20 text-green-300 rounded-xl">Guardar</button>
              <button onClick={() => { setModoEdicion(null); setEditPieza(null) }} className="flex-1 py-3 bg-gray-600 text-white rounded-xl">Cancelar</button>
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