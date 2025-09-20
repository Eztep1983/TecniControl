// components/forms/TareasInput.tsx
'use client'
import { Plus, Trash2, Info, Check } from 'lucide-react'

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

const TAREAS_PREVENTIVAS = [
  'Limpieza interna del equipo',
  'Limpieza de ventiladores y disipadores',
  'Verificación de temperaturas del sistema',
  'Actualización de drivers y controladores',
  'Actualización del sistema operativo',
  'Escaneo antivirus completo',
  'Limpieza de archivos temporales',
  'Desfragmentación del disco duro',
  'Verificación de la integridad del disco',
  'Limpieza del registro de Windows',
  'Verificación de conectores y cables',
  'Prueba de memoria RAM',
  'Verificación de la fuente de poder',
  'Backup de archivos importantes',
  'Optimización del inicio del sistema',
  'Verificación de puertos USB y conectividad',
  'Calibración de pantalla',
  'Limpieza de teclado y mouse',
  'Verificación de la batería (portátiles)',
  'Actualización de software instalado'
]

const TAREAS_CORRECTIVAS = [
  'Diagnóstico de fallas del sistema',
  'Reparación de sistema operativo corrupto',
  'Eliminación de virus y malware',
  'Recuperación de archivos eliminados',
  'Reparación de errores de disco duro',
  'Reemplazo de disco duro defectuoso',
  'Instalación de nuevo sistema operativo',
  'Reparación de problemas de arranque',
  'Solución de pantallas azules (BSOD)',
  'Reparación de problemas de red',
  'Configuración de conexión a internet',
  'Reparación de problemas de audio',
  'Solución de problemas de video/pantalla',
  'Reemplazo de memoria RAM defectuosa',
  'Reparación/reemplazo de fuente de poder',
  'Solución de sobrecalentamiento',
  'Reparación de puertos USB dañados',
  'Reinstalación de drivers corruptos',
  'Reparación de problemas de software',
  'Configuración de programas específicos',
  'Recuperación de contraseñas',
  'Reparación de problemas de impresora',
  'Solución de lentitud del sistema',
  'Reparación de problemas de teclado/mouse'
]

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
  const tareasPredefinidas = tipoMantenimiento === 'preventivo' ? TAREAS_PREVENTIVAS : TAREAS_CORRECTIVAS

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2 rounded-md bg-gray-800 p-2 px-3">
          <label className="block text-sm font-medium text-gray-300">
            Tareas Realizadas 
          </label>
        </div>
        <button
          type="button"
          onClick={() => setMostrarTareasPredefinidas(!mostrarTareasPredefinidas)}
          className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center"
        >
          <Info className="w-4 h-4 mr-1" />
          {mostrarTareasPredefinidas ? 'Ocultar opciones' : 'Mostrar opciones predefinidas'}
        </button>
      </div>

      {/* Tareas Predefinidas */}
      {mostrarTareasPredefinidas && (
        <div className="mb-6 p-4 bg-gray-700/30 rounded-xl border border-gray-600/50 backdrop-blur-sm">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Tareas comunes para mantenimiento {tipoMantenimiento}:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {tareasPredefinidas.map((tarea, index) => (
              <label
                key={index}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 text-sm ${
                  tareasSeleccionadas.includes(tarea)
                    ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300 shadow-md'
                    : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={tareasSeleccionadas.includes(tarea)}
                  onChange={() => onToggleTareaPredefinida(tarea)}
                  className="mr-2 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="flex-1">{tarea}</span>
                {tareasSeleccionadas.includes(tarea) && (
                  <Check className="w-4 h-4 text-blue-400 ml-2" />
                )}
              </label>
            ))}
          </div>
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