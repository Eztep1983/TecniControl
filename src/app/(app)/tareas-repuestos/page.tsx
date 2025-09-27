// app/(app)/configuracion/tareas-repuestos/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { 
  guardarTareasPredefinidas, 
  guardarPiezasPredefinidas, 
  obtenerTareasPredefinidas, 
  obtenerPiezasPredefinidas 
} from '@/lib/configuracionTareasR-helpers'
import { ArrowLeft, Settings, ListChecks, Package, Plus, Trash2, Edit3, Save, X, Check, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TareaPredefinida {
  id: string
  nombre: string
  tipo: 'preventivo' | 'correctivo'
  categoria: string
}

interface PiezaPredefinida {
  id: string
  nombre: string
  categoria: string
}

export default function TareasRepuestosPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tareas, setTareas] = useState<TareaPredefinida[]>([])
  const [piezas, setPiezas] = useState<PiezaPredefinida[]>([])
  const [loading, setLoading] = useState(true)
  const [editandoTarea, setEditandoTarea] = useState<string | null>(null)
  const [editandoPieza, setEditandoPieza] = useState<string | null>(null)
  const [nuevaTarea, setNuevaTarea] = useState<{ 
    nombre: string; 
    tipo: 'preventivo' | 'correctivo'; 
    categoria: string 
  }>({ 
    nombre: '', 
    tipo: 'preventivo', 
    categoria: 'General' 
  })
  const [nuevaPieza, setNuevaPieza] = useState({ 
    nombre: '', 
    categoria: 'Categoria Generica' 
  })
  const [tareaEditTemp, setTareaEditTemp] = useState<{ 
    nombre: string; 
    tipo: 'preventivo' | 'correctivo'; 
    categoria: string 
  }>({ nombre: '', tipo: 'preventivo', categoria: 'General' })
  const [piezaEditTemp, setPiezaEditTemp] = useState({ nombre: '', categoria: 'Categoria Generica' })
  
  // Estados para búsqueda
  const [busquedaTareas, setBusquedaTareas] = useState('')
  const [busquedaPiezas, setBusquedaPiezas] = useState('')
  
  // Estado para mostrar/ocultar formularios en móvil
  const [mostrarFormTareas, setMostrarFormTareas] = useState(false)
  const [mostrarFormPiezas, setMostrarFormPiezas] = useState(false)

  // Estados unificados para retroalimentación
  const [guardando, setGuardando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')
  const [mensajeError, setMensajeError] = useState('')

  // Estado para detectar cambios y controlar el guardado automático
  const [cambiosPendientes, setCambiosPendientes] = useState(false)
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null)
  
  // Refs para evitar guardado en la carga inicial
  const esCargaInicial = useRef(true)
  const timeoutGuardado = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    cargarConfiguracion()
  }, [user?.uid])

  // Detectar cambios y activar guardado automático
  useEffect(() => {
    if (esCargaInicial.current) {
      esCargaInicial.current = false
      return
    }

    if (tareas.length > 0 || piezas.length > 0) {
      setCambiosPendientes(true)
      
      // Cancelar el timeout anterior si existe
      if (timeoutGuardado.current) {
        clearTimeout(timeoutGuardado.current)
      }
      
      // Programar el guardado automático después de 1 segundo de inactividad
      timeoutGuardado.current = setTimeout(() => {
        guardarTodosLosCambios()
      }, 1000)
    }
    
    return () => {
      if (timeoutGuardado.current) {
        clearTimeout(timeoutGuardado.current)
      }
    }
  }, [tareas, piezas])

  const cargarConfiguracion = useCallback(async () => {
    if (!user?.uid) return
    
    try {
      const [tareasData, piezasData] = await Promise.all([
        obtenerTareasPredefinidas(user.uid),
        obtenerPiezasPredefinidas(user.uid)
      ])
      setTareas(
        tareasData
          .filter(t => t.tipo === 'preventivo' || t.tipo === 'correctivo')
          .map(t => ({
            ...t,
            tipo: t.tipo === 'preventivo' || t.tipo === 'correctivo' ? t.tipo : 'preventivo'
          }))
      )
      setPiezas(piezasData)
      setUltimoGuardado(new Date())
    } catch (error) {
      console.error('Error cargando configuración:', error)
      mostrarMensaje('Error al cargar la configuración', 'error')
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  const mostrarMensaje = useCallback((mensaje: string, tipo: 'success' | 'error') => {
    if (tipo === 'success') {
      setMensajeExito(mensaje)
      setMensajeError('')
      setTimeout(() => setMensajeExito(''), 3000)
    } else {
      setMensajeError(mensaje)
      setMensajeExito('')
      setTimeout(() => setMensajeError(''), 5000)
    }
  }, [])

  const guardarTodosLosCambios = useCallback(async () => {
    if (!user?.uid || (!tareas.length && !piezas.length)) return
    
    setGuardando(true)
    
    try {
      await Promise.all([
        guardarTareasPredefinidas(user.uid, tareas),
        guardarPiezasPredefinidas(user.uid, piezas)
      ])
      setUltimoGuardado(new Date())
      setCambiosPendientes(false)
      mostrarMensaje('¡Cambios guardados automáticamente!', 'success')
    } catch (error) {
      console.error('Error guardando cambios:', error)
      mostrarMensaje('Error al guardar los cambios', 'error')
    } finally {
      setGuardando(false)
    }
  }, [user?.uid, tareas, piezas, mostrarMensaje])

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
    setMostrarFormTareas(false)
  }, [nuevaTarea, mostrarMensaje])

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
    setMostrarFormPiezas(false)
  }, [nuevaPieza, mostrarMensaje])

  const eliminarTarea = useCallback((id: string) => {
    setTareas(prev => prev.filter(t => t.id !== id))
  }, [])

  const eliminarPieza = useCallback((id: string) => {
    setPiezas(prev => prev.filter(p => p.id !== id))
  }, [])

  const iniciarEdicionTarea = useCallback((tarea: TareaPredefinida) => {
    setEditandoTarea(tarea.id)
    setTareaEditTemp({ nombre: tarea.nombre, tipo: tarea.tipo, categoria: tarea.categoria })
  }, [])

  const iniciarEdicionPieza = useCallback((pieza: PiezaPredefinida) => {
    setEditandoPieza(pieza.id)
    setPiezaEditTemp({ nombre: pieza.nombre, categoria: pieza.categoria })
  }, [])

  const guardarEdicionTarea = useCallback((id: string) => {
    if (!tareaEditTemp.nombre.trim()) {
      mostrarMensaje('El nombre de la tarea es requerido', 'error')
      return
    }
    
    setTareas(prev => prev.map(t => 
      t.id === id ? { ...t, ...tareaEditTemp } : t
    ))
    setEditandoTarea(null)
  }, [tareaEditTemp, mostrarMensaje])

  const guardarEdicionPieza = useCallback((id: string) => {
    if (!piezaEditTemp.nombre.trim()) {
      mostrarMensaje('El nombre de la pieza es requerido', 'error')
      return
    }
    
    setPiezas(prev => prev.map(p => 
      p.id === id ? { ...p, ...piezaEditTemp } : p
    ))
    setEditandoPieza(null)
  }, [piezaEditTemp, mostrarMensaje])

  const cancelarEdicion = useCallback(() => {
    setEditandoTarea(null)
    setEditandoPieza(null)
  }, [])

  // Filtros de búsqueda optimizados con useMemo
  const tareasFiltradas = useMemo(() => {
    if (!busquedaTareas.trim()) return tareas
    const termino = busquedaTareas.toLowerCase()
    return tareas.filter(tarea => 
      tarea.nombre.toLowerCase().includes(termino) ||
      tarea.categoria.toLowerCase().includes(termino) ||
      tarea.tipo.toLowerCase().includes(termino)
    )
  }, [tareas, busquedaTareas])

  const piezasFiltradas = useMemo(() => {
    if (!busquedaPiezas.trim()) return piezas
    const termino = busquedaPiezas.toLowerCase()
    return piezas.filter(pieza => 
      pieza.nombre.toLowerCase().includes(termino) ||
      pieza.categoria.toLowerCase().includes(termino)
    )
  }, [piezas, busquedaPiezas])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-400">Debes iniciar sesión para acceder a esta página.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header optimizado */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button 
              onClick={() => router.back()} 
              className="text-blue-400 hover:text-blue-300 p-2 rounded-full hover:bg-gray-800 transition-colors touch-manipulation"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">Tareas y Repuestos</h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1 line-clamp-2">Gestiona tus tareas y piezas predefinidas para agilizar la creación de órdenes</p>
            </div>
          </div>
        </div>

        {/* Mensaje global de retroalimentación */}
        {(mensajeExito || mensajeError) && (
          <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
            mensajeExito ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
            'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            {mensajeExito || mensajeError}
          </div>
        )}


                {/* Información adicional - optimizada */}
        <div className="mt-8 bg-gray-800/30 rounded-xl border border-gray-700/50 p-4 sm:p-6">
          <div className="flex items-start space-x-3">
            <Settings className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">¿Cómo funciona?</h3>
              <p className="text-gray-300 text-sm mb-3">
                Las tareas y piezas que agregues aquí estarán disponibles como opciones predefinidas 
                cuando crees órdenes de mantenimiento, agilizando el proceso y manteniendo la consistencia.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-400 text-sm">
                <p>• Clasifica tareas como preventivas o correctivas</p>
                <p>• Organiza con categorías personalizadas</p>
                <p>• Busca elementos rápidamente</p>
                <p>• Los cambios se sincronizan automáticamente</p>
              </div>
            </div>
          </div>
        </div>
        <br />
        {/* Layout adaptativo */}
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Sección Tareas */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <ListChecks className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-white">Tareas Predefinidas</h2>
                <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">Gestiona las tareas comunes de mantenimiento</p>
              </div>
            </div>

            {/* Búsqueda de tareas */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={busquedaTareas}
                  onChange={(e) => setBusquedaTareas(e.target.value)}
                  placeholder="Buscar tareas..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/30 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Botón toggle para mostrar formulario en móvil */}
            <div className="mb-4 sm:hidden">
              <button
                onClick={() => setMostrarFormTareas(!mostrarFormTareas)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/30 transition-colors w-full justify-center touch-manipulation"
              >
                <Plus className="w-4 h-4" />
                <span>{mostrarFormTareas ? 'Ocultar formulario' : 'Agregar nueva tarea'}</span>
              </button>
            </div>

            {/* Formulario para nueva tarea */}
            <div className={`mb-6 p-3 sm:p-4 bg-gray-700/30 rounded-lg border border-gray-600/50 transition-all duration-300 ${
              mostrarFormTareas ? 'block' : 'hidden sm:block'
            }`}>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Agregar Nueva Tarea</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={nuevaTarea.nombre}
                  onChange={(e) => setNuevaTarea(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre de la tarea..."
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={nuevaTarea.tipo}
                    onChange={(e) => setNuevaTarea(prev => ({ ...prev, tipo: e.target.value as 'preventivo' | 'correctivo' }))}
                    className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="preventivo">Preventivo</option>
                    <option value="correctivo">Correctivo</option>
                  </select>
                  <input
                    type="text"
                    value={nuevaTarea.categoria}
                    onChange={(e) => setNuevaTarea(prev => ({ ...prev, categoria: e.target.value }))}
                    placeholder="Categoría..."
                    className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <button
                  onClick={agregarTarea}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/30 transition-colors w-full justify-center touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Tarea</span>
                </button>
              </div>
            </div>

            {/* Lista de tareas */}
            <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
              {tareasFiltradas.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ListChecks className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {busquedaTareas ? 'No se encontraron tareas' : 'No hay tareas agregadas'}
                  </p>
                </div>
              ) : (
                tareasFiltradas.map((tarea) => (
                  <div key={tarea.id} className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/50 group">
                    {editandoTarea === tarea.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={tareaEditTemp.nombre}
                          onChange={(e) => setTareaEditTemp(prev => ({ ...prev, nombre: e.target.value }))}
                          className="w-full px-2 py-1 bg-gray-600/50 border border-gray-500/50 rounded text-white text-sm"
                          placeholder="Nombre de la tarea..."
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <select
                            value={tareaEditTemp.tipo}
                            onChange={(e) => setTareaEditTemp(prev => ({ ...prev, tipo: e.target.value as 'preventivo' | 'correctivo' }))}
                            className="px-2 py-1 bg-gray-600/50 border border-gray-500/50 rounded text-white text-sm"
                          >
                            <option value="preventivo">Preventivo</option>
                            <option value="correctivo">Correctivo</option>
                          </select>
                          <input
                            type="text"
                            value={tareaEditTemp.categoria}
                            onChange={(e) => setTareaEditTemp(prev => ({ ...prev, categoria: e.target.value }))}
                            className="px-2 py-1 bg-gray-600/50 border border-gray-500/50 rounded text-white text-sm"
                            placeholder="Categoría..."
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => guardarEdicionTarea(tarea.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded text-sm touch-manipulation"
                          >
                            <Check className="w-3 h-3" />
                            <span>Guardar</span>
                          </button>
                          <button
                            onClick={cancelarEdicion}
                            className="flex items-center space-x-1 px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded text-sm touch-manipulation"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-white text-sm font-medium truncate">{tarea.nombre}</span>
                            <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                              tarea.tipo === 'preventivo' ? 'bg-green-500/20 text-green-300' :
                              'bg-orange-500/20 text-orange-300'
                            }`}>
                              {tarea.tipo}
                            </span>
                            {tarea.categoria && (
                              <span className="px-2 py-1 bg-gray-600/50 text-gray-300 rounded-full text-xs flex-shrink-0">
                                {tarea.categoria}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1 sm:space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button
                            onClick={() => iniciarEdicionTarea(tarea)}
                            className="text-blue-400 hover:text-blue-300 p-1 touch-manipulation"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminarTarea(tarea.id)}
                            className="text-red-400 hover:text-red-300 p-1 touch-manipulation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sección Piezas */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-white">Piezas Predefinidas</h2>
                <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">Gestiona las piezas y componentes comunes</p>
              </div>
            </div>

            {/* Búsqueda de piezas */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={busquedaPiezas}
                  onChange={(e) => setBusquedaPiezas(e.target.value)}
                  placeholder="Buscar piezas..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/30 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Botón toggle para mostrar formulario en móvil */}
            <div className="mb-4 sm:hidden">
              <button
                onClick={() => setMostrarFormPiezas(!mostrarFormPiezas)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/30 transition-colors w-full justify-center touch-manipulation"
              >
                <Plus className="w-4 h-4" />
                <span>{mostrarFormPiezas ? 'Ocultar formulario' : 'Agregar nueva pieza'}</span>
              </button>
            </div>

            {/* Formulario para nueva pieza */}
            <div className={`mb-6 p-3 sm:p-4 bg-gray-700/30 rounded-lg border border-gray-600/50 transition-all duration-300 ${
              mostrarFormPiezas ? 'block' : 'hidden sm:block'
            }`}>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Agregar Nueva Pieza</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={nuevaPieza.nombre}
                  onChange={(e) => setNuevaPieza(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre de la pieza..."
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <input
                  type="text"
                  value={nuevaPieza.categoria}
                  onChange={(e) => setNuevaPieza(prev => ({ ...prev, categoria: e.target.value }))}
                  placeholder="Categoría..."
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={agregarPieza}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/30 transition-colors w-full justify-center touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Pieza</span>
                </button>
              </div>
            </div>

            {/* Lista de piezas */}
            <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
              {piezasFiltradas.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {busquedaPiezas ? 'No se encontraron piezas' : 'No hay piezas agregadas'}
                  </p>
                </div>
              ) : (
                piezasFiltradas.map((pieza) => (
                  <div key={pieza.id} className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/50 group">
                    {editandoPieza === pieza.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={piezaEditTemp.nombre}
                          onChange={(e) => setPiezaEditTemp(prev => ({ ...prev, nombre: e.target.value }))}
                          className="w-full px-2 py-1 bg-gray-600/50 border border-gray-500/50 rounded text-white text-sm"
                          placeholder="Nombre de la pieza..."
                        />
                        <input
                          type="text"
                          value={piezaEditTemp.categoria}
                          onChange={(e) => setPiezaEditTemp(prev => ({ ...prev, categoria: e.target.value }))}
                          className="w-full px-2 py-1 bg-gray-600/50 border border-gray-500/50 rounded text-white text-sm"
                          placeholder="Categoría..."
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => guardarEdicionPieza(pieza.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded text-sm touch-manipulation"
                          >
                            <Check className="w-3 h-3" />
                            <span>Guardar</span>
                          </button>
                          <button
                            onClick={cancelarEdicion}
                            className="flex items-center space-x-1 px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded text-sm touch-manipulation"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-white text-sm font-medium truncate">{pieza.nombre}</span>
                            {pieza.categoria && (
                              <span className="px-2 py-1 bg-gray-600/50 text-gray-300 rounded-full text-xs flex-shrink-0">
                                {pieza.categoria}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1 sm:space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button
                            onClick={() => iniciarEdicionPieza(pieza)}
                            className="text-blue-400 hover:text-blue-300 p-1 touch-manipulation"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminarPieza(pieza.id)}
                            className="text-red-400 hover:text-red-300 p-1 touch-manipulation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Botón único para guardar todos los cambios - Solo se muestra si hay cambios */}
        {cambiosPendientes && (
          <div className="mt-8 bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                  <Save className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Guardar Configuración</h3>
                  <p className="text-gray-400 text-sm">Guarda todos los cambios realizados en tareas y piezas</p>
                </div>
              </div>
              <button
                onClick={guardarTodosLosCambios}
                disabled={guardando}
                className="flex items-center justify-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white rounded-lg border border-blue-500/30 transition-all duration-200 transform hover:scale-105 touch-manipulation text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[200px]"
              >
                {guardando ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Guardar Todos los Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
        <br />
        {/* Estadísticas rápidas */}
        {(tareas.length > 0 || piezas.length > 0) && (
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/30">
              <div className="text-2xl font-bold text-blue-400">{tareas.length}</div>
              <div className="text-xs text-gray-400">Total Tareas</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/30">
              <div className="text-2xl font-bold text-green-400">{tareas.filter(t => t.tipo === 'preventivo').length}</div>
              <div className="text-xs text-gray-400">Preventivas</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/30">
              <div className="text-2xl font-bold text-orange-400">{tareas.filter(t => t.tipo === 'correctivo').length}</div>
              <div className="text-xs text-gray-400">Correctivas</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/30">
              <div className="text-2xl font-bold text-purple-400">{piezas.length}</div>
              <div className="text-xs text-gray-400">Total Piezas</div>
            </div>
          </div>
        )}
    </div>
  )
}