// components/forms/TareasInput.tsx
'use client'
import { Plus, Trash2, Check, ListChecks, ChevronDown, AlertCircle, Sparkles } from 'lucide-react'
import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { obtenerTareasPredefinidas, TareaPredefinida } from '@/lib/configuracionTareasR-helpers'

interface TareasInputProps {
  tipoMantenimiento: 'preventivo' | 'correctivo' | 'diagnostico'
  tareasSeleccionadas: string[]
  tareasPersonalizadas: string[]
  onToggleTareaPredefinida: (tarea: string) => void
  onActualizarTareaPersonalizada: (index: number, valor: string) => void
  onAgregarTareaPersonalizada: () => void
  onEliminarTareaPersonalizada: (index: number) => void
}

const TareaCheckbox = memo(({ 
  tarea, 
  isSelected, 
  onToggle 
}: { 
  tarea: TareaPredefinida
  isSelected: boolean
  onToggle: (nombre: string) => void
}) => (
  <label
    className={`
      group flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer 
      transition-all duration-200 active:scale-[0.98]
      ${isSelected
        ? 'bg-blue-500/15 border-blue-500/40 shadow-lg shadow-blue-500/10'
        : 'bg-gray-700/30 border-gray-700/50 hover:border-gray-600 hover:bg-gray-700/40'
      }
    `}
  >
    <div className={`
      w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 
      transition-all duration-200
      ${isSelected 
        ? 'bg-blue-500 border-blue-500 scale-110' 
        : 'border-gray-600 bg-gray-800 group-hover:border-gray-500'
      }
    `}>
      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </div>
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => onToggle(tarea.nombre)}
      className="sr-only"
    />
    <span className={`
      text-sm flex-1 break-words transition-colors
      ${isSelected ? 'text-white font-medium' : 'text-gray-300 group-hover:text-gray-200'}
    `}>
      {tarea.nombre}
    </span>
  </label>
))

TareaCheckbox.displayName = 'TareaCheckbox'

const MensajeSinTareasPredefinidas = memo(() => (
  <div className="text-center py-8 px-4 border-2 border-dashed border-gray-700/50 rounded-xl bg-gray-800/20">
    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-700/30 flex items-center justify-center">
      <AlertCircle className="w-6 h-6 text-gray-500" />
    </div>
    <p className="text-sm text-gray-400 mb-1 font-medium">No hay tareas predefinidas</p>
    <p className="text-xs text-gray-500">Puedes agregar tareas personalizadas abajo</p>
  </div>
))

MensajeSinTareasPredefinidas.displayName = 'MensajeSinTareasPredefinidas'

const LoadingState = memo(() => (
  <div className="text-center py-8">
    <div className="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
    <p className="text-sm text-gray-400">Cargando tareas...</p>
  </div>
))

LoadingState.displayName = 'LoadingState'

export default function TareasInput({
  tipoMantenimiento,
  tareasSeleccionadas = [],
  tareasPersonalizadas = [],
  onToggleTareaPredefinida,
  onActualizarTareaPersonalizada,
  onAgregarTareaPersonalizada,
  onEliminarTareaPersonalizada
}: TareasInputProps) {
  const { user } = useAuth()
  const [tareasPredefinidas, setTareasPredefinidas] = useState<TareaPredefinida[]>([])
  const [mostrarPredefinidas, setMostrarPredefinidas] = useState(true)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  // Normalizar arrays
  const tareasSeleccionadasNorm = useMemo(() => 
    Array.isArray(tareasSeleccionadas) ? tareasSeleccionadas.filter(t => t != null) : []
  , [tareasSeleccionadas])
  
  const tareasPersonalizadasNorm = useMemo(() => 
    Array.isArray(tareasPersonalizadas) ? tareasPersonalizadas : []
  , [tareasPersonalizadas])

  // Filtrar tareas predefinidas por búsqueda
  const tareasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return tareasPredefinidas
    
    const termino = busqueda.toLowerCase()
    return tareasPredefinidas.filter(tarea => 
      tarea.nombre.toLowerCase().includes(termino)
    )
  }, [tareasPredefinidas, busqueda])

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const totalPredefinidas = tareasSeleccionadasNorm.length
    const totalPersonalizadas = tareasPersonalizadasNorm.filter(t => t?.trim().length > 0).length
    const total = totalPredefinidas + totalPersonalizadas
    
    return {
      totalPredefinidas,
      totalPersonalizadas,
      total,
      tieneAlgunaTarea: total > 0
    }
  }, [tareasSeleccionadasNorm, tareasPersonalizadasNorm])

  useEffect(() => {
    const cargarTareas = async () => {
      if (!user?.uid) {
        setCargando(false)
        return
      }
      
      setCargando(true)
      setError(null)
      
      try {
        const tareas = await obtenerTareasPredefinidas(user.uid)
        
        if (!Array.isArray(tareas)) {
          throw new Error('Formato de respuesta inválido')
        }
        
        const tareasFiltradas = tareas
          .filter(t => t && typeof t === 'object')
          .filter(t => t.tipo === tipoMantenimiento || t.tipo === 'ambos')
        
        setTareasPredefinidas(tareasFiltradas)
      } catch (error) {
        console.error('Error cargando tareas:', error)
        setError('Error al cargar tareas predefinidas')
        setTareasPredefinidas([])
      } finally {
        setCargando(false)
      }
    }
    
    cargarTareas()
  }, [user?.uid, tipoMantenimiento])

  const handleActualizarTarea = useCallback((index: number, valor: string) => {
    if (typeof valor !== 'string') return
    if (valor.length > 200) return
    
    onActualizarTareaPersonalizada(index, valor)
  }, [onActualizarTareaPersonalizada])

  const handleAgregarTarea = useCallback(() => {
    if (tareasPersonalizadasNorm.length >= 50) {
      setError('Límite máximo de 50 tareas personalizadas alcanzado')
      setTimeout(() => setError(null), 3000)
      return
    }
    onAgregarTareaPersonalizada()
    setError(null)
  }, [tareasPersonalizadasNorm.length, onAgregarTareaPersonalizada])

  const handleEliminarTarea = useCallback((index: number) => {
    onEliminarTareaPersonalizada(index)
    setError(null)
  }, [onEliminarTareaPersonalizada])

  const handleTogglePredefinidas = useCallback(() => {
    setMostrarPredefinidas(prev => !prev)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Enter en tarea vacía → agregar nueva
    if (e.key === 'Enter' && !tareasPersonalizadasNorm[index]?.trim()) {
      e.preventDefault()
      if (tareasPersonalizadasNorm.length < 50) {
        handleAgregarTarea()
      }
    }
    // Enter en tarea con contenido → agregar nueva
    else if (e.key === 'Enter' && tareasPersonalizadasNorm[index]?.trim()) {
      e.preventDefault()
      if (tareasPersonalizadasNorm.length < 50) {
        onAgregarTareaPersonalizada()
      }
    }
  }, [tareasPersonalizadasNorm, handleAgregarTarea, onAgregarTareaPersonalizada])

  const handleSeleccionarTodas = useCallback(() => {
    const tareasVisibles = tareasFiltradas.map(t => t.nombre)
    tareasVisibles.forEach(tarea => {
      if (!tareasSeleccionadasNorm.includes(tarea)) {
        onToggleTareaPredefinida(tarea)
      }
    })
  }, [tareasFiltradas, tareasSeleccionadasNorm, onToggleTareaPredefinida])

  const handleDeseleccionarTodas = useCallback(() => {
    tareasSeleccionadasNorm.forEach(tarea => {
      onToggleTareaPredefinida(tarea)
    })
  }, [tareasSeleccionadasNorm, onToggleTareaPredefinida])

  const hayTareasSeleccionadas = tareasSeleccionadasNorm.length > 0

  return (
    <div className="space-y-4">
      {/* Estado de carga */}
      {cargando && <LoadingState />}

      {/* Tareas Predefinidas */}
      {!cargando && tareasPredefinidas.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleTogglePredefinidas}
            className="w-full flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-gray-800/70 hover:border-gray-600 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <span className="font-semibold text-white">Tareas Rápidas</span>
              <span className="text-sm text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full">
                {tareasSeleccionadasNorm.length}/{tareasPredefinidas.length}
              </span>
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                mostrarPredefinidas ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {mostrarPredefinidas && (
            <div className="space-y-3">
              {/* Barra de búsqueda y acciones */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar tareas..."
                  className="flex-1 px-3 py-2 bg-gray-700/40 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {hayTareasSeleccionadas ? (
                  <button
                    type="button"
                    onClick={handleDeseleccionarTodas}
                    className="px-3 py-2 text-xs font-medium text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg transition-all whitespace-nowrap"
                  >
                    Limpiar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSeleccionarTodas}
                    disabled={tareasFiltradas.length === 0}
                    className="px-3 py-2 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Todas
                  </button>
                )}
              </div>

              {/* Lista de tareas */}
              {tareasFiltradas.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto overscroll-contain pr-1 scroll-smooth custom-scrollbar">
                  {tareasFiltradas.map((tarea) => (
                    <TareaCheckbox
                      key={tarea.id}
                      tarea={tarea}
                      isSelected={tareasSeleccionadasNorm.includes(tarea.nombre)}
                      onToggle={onToggleTareaPredefinida}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-700/30 rounded-lg">
                  <p>No se encontraron tareas</p>
                  <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mensaje sin tareas predefinidas */}
      {!cargando && tareasPredefinidas.length === 0 && <MensajeSinTareasPredefinidas />}

      {/* Mensaje de error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl animate-shake">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        </div>
      )}

      {/* Tareas Personalizadas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <ListChecks className="w-4 h-4 text-purple-400" />
            </div>
            <span className="font-semibold text-white">Personalizadas</span>
            {estadisticas.totalPersonalizadas > 0 && (
              <span className="text-sm text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full">
                {estadisticas.totalPersonalizadas}/50
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {tareasPersonalizadasNorm.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Eliminar todas las tareas personalizadas?')) {
                    tareasPersonalizadasNorm.forEach((_, index) => {
                      onEliminarTareaPersonalizada(0)
                    })
                  }
                }}
                className="text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
              >
                Limpiar
              </button>
            )}
            <button
              type="button"
              onClick={handleAgregarTarea}
              disabled={tareasPersonalizadasNorm.length >= 50}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-blue-500/10 disabled:hover:bg-transparent transition-all duration-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar</span>
            </button>
          </div>
        </div>

        {tareasPersonalizadasNorm.length > 0 ? (
          <div className="space-y-2">
            {tareasPersonalizadasNorm.map((tarea, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 group animate-fadeIn"
              >
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={tarea || ''}
                    onChange={(e) => handleActualizarTarea(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    placeholder="Escribe una tarea..."
                    maxLength={200}
                    className="w-full px-3 py-2.5 bg-gray-700/40 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-gray-600 transition-all duration-200"
                  />
                  {tarea && tarea.length > 180 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      {200 - tarea.length}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleEliminarTarea(index)}
                  className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 active:scale-90 flex-shrink-0"
                  aria-label="Eliminar tarea"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-gray-500 border-2 border-dashed border-gray-700/30 rounded-xl bg-gray-800/10">
            <ListChecks className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p>No hay tareas personalizadas</p>
            <p className="text-xs text-gray-600 mt-1">Haz clic en "Agregar" para crear una</p>
          </div>
        )}
      </div>

      {/* Resumen */}
      {!cargando && estadisticas.tieneAlgunaTarea && (
        <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3" strokeWidth={3} />
            </div>
            <span className="font-medium">
              {estadisticas.total} tarea{estadisticas.total !== 1 ? 's' : ''} registrada{estadisticas.total !== 1 ? 's' : ''}
            </span>
            {estadisticas.totalPredefinidas > 0 && estadisticas.totalPersonalizadas > 0 && (
              <span className="text-gray-400">
                • {estadisticas.totalPredefinidas} rápida{estadisticas.totalPredefinidas !== 1 ? 's' : ''}, {estadisticas.totalPersonalizadas} personalizada{estadisticas.totalPersonalizadas !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.7);
        }
      `}</style>
    </div>
  )
}