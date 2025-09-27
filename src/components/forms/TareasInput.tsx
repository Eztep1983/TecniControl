// components/forms/TareasInput.tsx (modificado)
'use client'
import { Plus, Trash2, Info, Check, Settings } from 'lucide-react'
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

  useEffect(() => {
    cargarTareasPredefinidas()
  }, [user?.uid])

  const cargarTareasPredefinidas = async () => {
    if (!user?.uid) return
    
    try {
      const tareas = await obtenerTareasPredefinidas(user.uid)
      setTareasPredefinidasUsuario(tareas)
    } catch (error) {
      console.error('Error cargando tareas predefinidas:', error)
    }
  }

  // Filtrar tareas según el tipo de mantenimiento
  const tareasFiltradas = tareasPredefinidasUsuario.filter(tarea => 
    tarea.tipo === tipoMantenimiento || tarea.tipo === 'ambos'
  )

  // Agrupar tareas por categoría
  const tareasPorCategoria = tareasFiltradas.reduce((acc, tarea) => {
    if (!acc[tarea.categoria]) {
      acc[tarea.categoria] = []
    }
    acc[tarea.categoria].push(tarea)
    return acc
  }, {} as Record<string, TareaPredefinida[]>)

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2 rounded-md bg-gray-800 p-2 px-3">
          <label className="block text-sm font-medium text-gray-300">
            Tareas Realizadas 
          </label>
        </div>
        <div className="flex items-center space-x-3">
          <Link 
            href="/configuracion/tareas-repuestos"
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center"
            title="Configurar tareas predefinidas"
          >
            <Settings className="w-4 h-4 mr-1" />
            Configurar
          </Link>
          <button
            type="button"
            onClick={() => setMostrarTareasPredefinidas(!mostrarTareasPredefinidas)}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center"
          >
            <Info className="w-4 h-4 mr-1" />
            {mostrarTareasPredefinidas ? 'Ocultar opciones' : 'Mostrar opciones'}
          </button>
        </div>
      </div>

      {/* Tareas Predefinidas del Usuario */}
      {mostrarTareasPredefinidas && tareasFiltradas.length > 0 && (
        <div className="mb-6 p-4 bg-gray-700/30 rounded-xl border border-gray-600/50 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-300">
              Tus tareas predefinidas para {tipoMantenimiento}:
            </h4>
            <span className="text-xs text-blue-400">
              {tareasFiltradas.length} disponible{tareasFiltradas.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {Object.entries(tareasPorCategoria).map(([categoria, tareas]) => (
            <div key={categoria} className="mb-4 last:mb-0">
              <h5 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                {categoria}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tareas.map((tarea) => (
                  <label
                    key={tarea.id}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 text-sm ${
                      tareasSeleccionadas.includes(tarea.nombre)
                        ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300 shadow-md'
                        : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={tareasSeleccionadas.includes(tarea.nombre)}
                      onChange={() => onToggleTareaPredefinida(tarea.nombre)}
                      className="mr-2 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="flex-1">{tarea.nombre}</span>
                    {tareasSeleccionadas.includes(tarea.nombre) && (
                      <Check className="w-4 h-4 text-blue-400 ml-2" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
          
          {tareasSeleccionadas.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <p className="text-sm text-blue-400 flex items-center">
                <Check className="w-4 h-4 mr-1" />
                {tareasSeleccionadas.length} tarea{tareasSeleccionadas.length !== 1 ? 's' : ''} seleccionada{tareasSeleccionadas.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mensaje cuando no hay tareas predefinidas */}
      {mostrarTareasPredefinidas && tareasFiltradas.length === 0 && (
        <div className="mb-6 p-4 bg-gray-700/30 rounded-xl border border-gray-600/50 backdrop-blur-sm">
          <div className="text-center py-4">
            <Settings className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm mb-2">No tienes tareas predefinidas configuradas</p>
            <Link 
              href="/configuracion/tareas-repuestos"
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Configurar tareas predefinidas
            </Link>
          </div>
        </div>
      )}

      {/* Tareas Personalizadas */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-300">
            Tareas personalizadas adicionales:
          </h4>
          <button
            type="button"
            onClick={onAgregarTareaPersonalizada}
            className="text-blue-400 hover:text-blue-300 flex items-center text-sm transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1 rounded-lg"
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar tarea
          </button>
        </div>
        
        {tareasPersonalizadas.map((tarea, index) => (
          <div key={index} className="flex items-center space-x-2 group">
            <div className="flex-1 relative">
              <input
                type="text"
                value={tarea}
                onChange={(e) => onActualizarTareaPersonalizada(index, e.target.value)}
                placeholder={`Tarea personalizada ${index + 1}...`}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {index + 1}.
              </div>
            </div>
            {tareasPersonalizadas.length > 1 && (
              <button
                type="button"
                onClick={() => onEliminarTareaPersonalizada(index)}
                className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}