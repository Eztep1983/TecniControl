// components/forms/TareasInput.tsx
'use client'
import { Plus, Trash2, Check, Settings, ListChecks, PencilLine, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { obtenerTareasPredefinidas, TareaPredefinida } from '@/lib/configuracionTareasR-helpers'
import Link from 'next/link'

interface TareasInputProps {
  tipoMantenimiento: 'preventivo' | 'correctivo'
  tareasSeleccionadas: string[]
  tareasPersonalizadas: string[]
  mostrarTareasPredefinidas: boolean
  setMostrarTareasPredefinidas: (valor: boolean) => void
  onToggleTareaPredefinida: (tarea: string) => void
  onActualizarTareaPersonalizada: (index: number, valor: string) => void
  onAgregarTareaPersonalizada: () => void
  onEliminarTareaPersonalizada: (index: number) => void
}

export default function TareasInput({
  tipoMantenimiento,
  tareasSeleccionadas,
  tareasPersonalizadas,
  mostrarTareasPredefinidas,
  setMostrarTareasPredefinidas,
  onToggleTareaPredefinida,
  onActualizarTareaPersonalizada,
  onAgregarTareaPersonalizada,
  onEliminarTareaPersonalizada
}: TareasInputProps) {
  const { user } = useAuth()
  const [tareasPredefinidasUsuario, setTareasPredefinidasUsuario] = useState<TareaPredefinida[]>([])
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Record<string, boolean>>({})

  useEffect(() => {
    cargarTareasPredefinidas()
  }, [user?.uid])

  const cargarTareasPredefinidas = async () => {
    if (!user?.uid) return
    
    try {
      const tareas = await obtenerTareasPredefinidas(user.uid)
      setTareasPredefinidasUsuario(tareas)
      
      // Expandir todas las categorías por defecto
      const categorias = [...new Set(tareas.map(t => t.categoria))]
      const expandidas = categorias.reduce((acc, cat) => ({ ...acc, [cat]: true }), {})
      setCategoriasExpandidas(expandidas)
    } catch (error) {
      console.error('Error cargando tareas predefinidas:', error)
    }
  }

  const toggleCategoria = (categoria: string) => {
    setCategoriasExpandidas(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }))
  }

  const tareasFiltradas = tareasPredefinidasUsuario.filter(tarea => 
    tarea.tipo === tipoMantenimiento || tarea.tipo === 'ambos'
  )

  const tareasPorCategoria = tareasFiltradas.reduce((acc, tarea) => {
    if (!acc[tarea.categoria]) {
      acc[tarea.categoria] = []
    }
    acc[tarea.categoria].push(tarea)
    return acc
  }, {} as Record<string, TareaPredefinida[]>)

  const totalTareasPersonalizadasLlenas = tareasPersonalizadas.filter(t => t.trim()).length
  const totalTareasSeleccionadas = tareasSeleccionadas.length + totalTareasPersonalizadasLlenas

  return (
    <div className="space-y-5">
      {/* Header con contador de tareas */}

      

      {/* Sección de Tareas Predefinidas */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setMostrarTareasPredefinidas(!mostrarTareasPredefinidas)}
          className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-white">Tareas Rápidas</span>
            <span className="text-sm text-gray-400">
              ({tareasFiltradas.length} disponible{tareasFiltradas.length !== 1 ? 's' : ''})
            </span>
          </div>
          {mostrarTareasPredefinidas ? (
            <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
          )}
        </button>

        {/* Lista de Tareas Predefinidas */}
        {mostrarTareasPredefinidas && (
          <div className="border border-gray-700 rounded-lg bg-gray-800/30 overflow-hidden">
            {tareasFiltradas.length > 0 ? (
              <div className="divide-y divide-gray-700/50">
                {Object.entries(tareasPorCategoria).map(([categoria, tareas]) => {
                  const tareasSeleccionadasEnCategoria = tareas.filter(t => 
                    tareasSeleccionadas.includes(t.nombre)
                  ).length
                  const isExpanded = categoriasExpandidas[categoria]

                  return (
                    <div key={categoria}>
                      {/* Header de Categoría */}
                      <button
                        type="button"
                        onClick={() => toggleCategoria(categoria)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-700/30 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <span className="font-medium text-gray-300 uppercase text-xs tracking-wide">
                            {categoria}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({tareas.length})
                          </span>
                        </div>
                        
                        {tareasSeleccionadasEnCategoria > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-full">
                            <Check className="w-3 h-3 text-blue-400" />
                            <span className="text-xs text-blue-400 font-medium">
                              {tareasSeleccionadasEnCategoria}
                            </span>
                          </div>
                        )}
                      </button>

                      {/* Lista de Tareas de la Categoría */}
                      {isExpanded && (
                        <div className="p-3 pt-0 space-y-2 bg-gray-800/20">
                          {tareas.map((tarea) => {
                            const isSelected = tareasSeleccionadas.includes(tarea.nombre)
                            
                            return (
                              <label
                                key={tarea.id}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-blue-500/15 border-2 border-blue-500/40'
                                    : 'bg-gray-700/40 border-2 border-transparent hover:border-gray-600 hover:bg-gray-700/60'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isSelected 
                                    ? 'bg-blue-500 border-blue-500' 
                                    : 'border-gray-600 bg-gray-800'
                                }`}>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                  )}
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => onToggleTareaPredefinida(tarea.nombre)}
                                  className="sr-only"
                                />
                                <span className={`flex-1 text-sm ${
                                  isSelected ? 'text-blue-300 font-medium' : 'text-gray-300'
                                }`}>
                                  {tarea.nombre}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ListChecks className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-400 font-medium mb-1">Sin tareas configuradas</p>
                <p className="text-sm text-gray-500 mb-4">
                  Configura tareas predefinidas para trabajar más rápido
                </p>
                <Link 
                  href="/tareas-repuestos"
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Crear tareas predefinidas
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
        <div className="flex items-center space-x-2 w-full xs:w-auto">
       
        <Link 
          href="/tareas-repuestos"
          className="sm:w-auto text-center text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl border border-blue-500/20 active:scale-95"
        >
          <Settings className="w-4 h-4" />
          <span>Crea Tareas predefinidas</span>
        </Link>
        </div>
      {/* Sección de Tareas Personalizadas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PencilLine className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-white">Tareas Personalizadas</span>
            {totalTareasPersonalizadasLlenas > 0 && (
              <span className="text-sm text-gray-400">
                ({totalTareasPersonalizadasLlenas})
              </span>
            )}
          </div>
          
          <button
            type="button"
            onClick={onAgregarTareaPersonalizada}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-500/10"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>
        
        <div className="space-y-2">
          {tareasPersonalizadas.length > 0 ? (
            tareasPersonalizadas.map((tarea, index) => (
              <div key={index} className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center flex-shrink-0 text-gray-400 text-sm font-medium">
                  {index + 1}
                </div>
                <input
                  type="text"
                  value={tarea}
                  onChange={(e) => onActualizarTareaPersonalizada(index, e.target.value)}
                  placeholder="Escribe una tarea específica..."
                  className="flex-1 px-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => onEliminarTareaPersonalizada(index)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-gray-700 rounded-lg">
              <p className="text-sm text-gray-500">
                No hay tareas personalizadas. Haz clic en "Agregar" para crear una.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resumen Final */}
      {totalTareasSeleccionadas > 0 && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400">
            <Check className="w-5 h-5" />
            <span className="font-medium">
              Total: {totalTareasSeleccionadas} tarea{totalTareasSeleccionadas !== 1 ? 's' : ''} registrada{totalTareasSeleccionadas !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-blue-400/70 mt-1 ml-7">
            {tareasSeleccionadas.length} predefinida{tareasSeleccionadas.length !== 1 ? 's' : ''}
            {totalTareasPersonalizadasLlenas > 0 && ` + ${totalTareasPersonalizadasLlenas} personalizada${totalTareasPersonalizadasLlenas !== 1 ? 's' : ''}`}
          </p>
        </div>
      )}
    </div>
  )
}