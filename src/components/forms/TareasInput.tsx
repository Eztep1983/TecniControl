// components/forms/TareasInput.tsx
'use client'
import { Plus, Trash2, Check, ListChecks, ChevronDown, AlertCircle } from 'lucide-react'
import { useState, useEffect, useCallback, memo } from 'react'
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
    className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border-2 cursor-pointer transition-colors active:scale-98 ${
      isSelected
        ? 'bg-blue-500/15 border-blue-500/40'
        : 'bg-gray-700/40 border-transparent hover:border-gray-600'
    }`}
  >
    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
      isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-600 bg-gray-800'
    }`}>
      {isSelected && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />}
    </div>
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => onToggle(tarea.nombre)}
      className="sr-only"
    />
    <span className="text-xs sm:text-sm text-gray-300 flex-1 break-words">{tarea.nombre}</span>
  </label>
))

TareaCheckbox.displayName = 'TareaCheckbox'

const MensajeSinTareasPredefinidas = memo(() => (
  <div className="text-center py-6 sm:py-8 px-4 border-2 border-dashed border-gray-600/50 rounded-lg bg-gray-800/20">
    <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500 mx-auto mb-2" />
    <p className="text-xs sm:text-sm text-gray-400 mb-1">No hay tareas predefinidas</p>
    <p className="text-xs text-gray-500">Puedes agregar tareas personalizadas abajo</p>
  </div>
))

MensajeSinTareasPredefinidas.displayName = 'MensajeSinTareasPredefinidas'

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

  // Normalizar arrays
  const tareasSeleccionadasNorm = Array.isArray(tareasSeleccionadas) 
    ? tareasSeleccionadas.filter(t => t != null)
    : []
  
  const tareasPersonalizadasNorm = Array.isArray(tareasPersonalizadas) 
    ? tareasPersonalizadas 
    : []

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
    
    const valorLimpio = valor
    if (valorLimpio.length > 200) return
    
    onActualizarTareaPersonalizada(index, valorLimpio)
  }, [onActualizarTareaPersonalizada])

  const handleAgregarTarea = useCallback(() => {
    if (tareasPersonalizadasNorm.length >= 50) {
      setError('Límite máximo de tareas personalizadas alcanzado')
      return
    }
    onAgregarTareaPersonalizada()
  }, [tareasPersonalizadasNorm.length, onAgregarTareaPersonalizada])

  // Calcular estadísticas - CORREGIDO: solo cuenta tareas personalizadas con contenido
  const totalTareasPredefinidas = tareasSeleccionadasNorm.length
  const totalTareasPersonalizadas = tareasPersonalizadasNorm
    .filter(tarea => tarea && tarea.trim().length > 0)
    .length
  const totalTareas = totalTareasPredefinidas + totalTareasPersonalizadas

  // Solo mostrar mensaje cuando no hay tareas predefinidas (las personalizadas siempre están)
  const noHayTareasPredefinidas = 
    !cargando && 
    tareasPredefinidas.length === 0

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Estado de carga */}
      {cargando && (
        <div className="text-center py-4 text-sm text-gray-400 animate-pulse">
          Cargando tareas...
        </div>
      )}

      {/* Tareas Predefinidas */}
      {!cargando && tareasPredefinidas.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          <button
            type="button"
            onClick={() => setMostrarPredefinidas(!mostrarPredefinidas)}
            className="w-full flex items-center justify-between p-2.5 sm:p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800/70 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
              <span className="font-medium text-white text-sm sm:text-base">Tareas Rápidas</span>
              <span className="text-xs sm:text-sm text-gray-400">({tareasPredefinidas.length})</span>
            </div>
            <ChevronDown 
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform flex-shrink-0 ${
                mostrarPredefinidas ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {mostrarPredefinidas && (
            <div className="space-y-1.5 sm:space-y-2 max-h-52 sm:max-h-60 overflow-y-auto overscroll-contain">
              {tareasPredefinidas.map((tarea) => (
                <TareaCheckbox
                  key={tarea.id}
                  tarea={tarea}
                  isSelected={tareasSeleccionadasNorm.includes(tarea.nombre)}
                  onToggle={onToggleTareaPredefinida}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        !cargando && <MensajeSinTareasPredefinidas />
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="p-2 sm:p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs sm:text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        </div>
      )}

      {/* Tareas Personalizadas - SIEMPRE VISIBLE */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ListChecks className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            <span className="font-medium text-white text-sm sm:text-base">Personalizadas</span>
            {tareasPersonalizadasNorm.length > 0 && (
              <span className="text-xs sm:text-sm text-gray-400">
                ({tareasPersonalizadasNorm.filter(t => t.trim().length > 0).length}/50)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleAgregarTarea}
            disabled={tareasPersonalizadasNorm.length >= 50}
            className="flex items-center gap-1 text-xs sm:text-sm text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-blue-500/10 disabled:hover:bg-transparent transition-colors active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Agregar</span>
          </button>
        </div>

        {tareasPersonalizadasNorm.length > 0 ? (
          <div className="space-y-1.5 sm:space-y-2">
            {tareasPersonalizadasNorm.map((tarea, index) => (
              <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                <input
                  type="text"
                  value={tarea || ''}
                  onChange={(e) => handleActualizarTarea(index, e.target.value)}
                  placeholder="Escribe una tarea..."
                  maxLength={200}
                  className="flex-1 px-2.5 sm:px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
                />
                <button
                  type="button"
                  onClick={() => onEliminarTareaPersonalizada(index)}
                  className="p-2 text-gray-400 hover:text-red-400 rounded-lg transition-colors active:scale-90 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Eliminar tarea"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-xs sm:text-sm text-gray-500 border border-dashed border-gray-600/30 rounded-lg">
            No hay tareas personalizadas
          </div>
        )}
      </div>

      {/* Resumen - Solo mostrar si hay tareas */}
      {!cargando && totalTareas > 0 && (
        <div className="p-2.5 sm:p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-1.5 sm:gap-2 text-blue-400 text-xs sm:text-sm">
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>
              {totalTareas} tarea{totalTareas !== 1 ? 's' : ''} seleccionada{totalTareas !== 1 ? 's' : ''}
              {totalTareasPredefinidas > 0 && ` (${totalTareasPredefinidas} rápidas)`}
              {totalTareasPersonalizadas > 0 && ` (${totalTareasPersonalizadas} personalizadas)`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}