// components/forms/MantenimientoInfo.tsx
'use client'
import { Settings, Wrench, Zap, Shield } from 'lucide-react'
import TareasInput from './TareasInput'
import PiezasInput from './PiezasInput'

interface Pieza {
  pieza: string
  cantidad: number
}

interface MantenimientoInfoProps {
  tipoMantenimiento: 'preventivo' | 'correctivo'
  tareasSeleccionadas: string[]
  tareasPersonalizadas: string[]
  piezasUsadas: Pieza[]
  mostrarTareasPredefinidas: boolean
  onCambiarTipoMantenimiento: (tipo: 'preventivo' | 'correctivo') => void
  onToggleTareaPredefinida: (tarea: string) => void
  onSetMostrarTareasPredefinidas: (mostrar: boolean) => void
  onActualizarTareaPersonalizada: (index: number, valor: string) => void
  onAgregarTareaPersonalizada: () => void
  onEliminarTareaPersonalizada: (index: number) => void
  onActualizarPieza: (index: number, campo: string, valor: any) => void
  onAgregarPieza: () => void
  onEliminarPieza: (index: number) => void
}

export default function MantenimientoInfo({
  tipoMantenimiento,
  tareasSeleccionadas,
  tareasPersonalizadas,
  piezasUsadas,
  mostrarTareasPredefinidas,
  onCambiarTipoMantenimiento,
  onToggleTareaPredefinida,
  onSetMostrarTareasPredefinidas,
  onActualizarTareaPersonalizada,
  onAgregarTareaPersonalizada,
  onEliminarTareaPersonalizada,
  onActualizarPieza,
  onAgregarPieza,
  onEliminarPieza
}: MantenimientoInfoProps) {
  return (
    <div className="space-y-8">
      {/* Tipo de Mantenimiento - Sección destacada */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-6 border border-gray-600/30 backdrop-blur-sm">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mr-4">
            <Settings className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Tipo de Trabajo</h3>
            <p className="text-sm text-gray-400">Selecciona el tipo de mantenimiento a realizar</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ${
            tipoMantenimiento === 'preventivo' 
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-2 border-green-500/50 shadow-lg shadow-green-500/10 scale-[1.02]' 
              : 'bg-gray-800/40 border-2 border-gray-700/50 hover:border-green-500/30 hover:bg-green-500/5'
          }`}>
            <div className="relative p-6">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  tipoMantenimiento === 'preventivo' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-700/50 text-gray-500 group-hover:bg-green-500/10 group-hover:text-green-400'
                }`}>
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className={`font-semibold text-lg ${
                    tipoMantenimiento === 'preventivo' ? 'text-green-300' : 'text-gray-300 group-hover:text-green-300'
                  }`}>
                    Preventivo
                  </div>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                    Mantenimiento programado para prevenir fallas y optimizar rendimiento
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="px-2 py-1 text-xs bg-green-500/10 text-green-400 rounded-md">Rutinario</span>
                    <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded-md">Programado</span>
                  </div>
                </div>
              </div>
              <input
                type="radio"
                name="tipoMantenimiento"
                value="preventivo"
                checked={tipoMantenimiento === 'preventivo'}
                onChange={(e) => onCambiarTipoMantenimiento(e.target.value as 'preventivo' | 'correctivo')}
                className="absolute top-4 right-4 text-green-500 focus:ring-2 focus:ring-green-500"
              />
            </div>
          </label>
          
          <label className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ${
            tipoMantenimiento === 'correctivo' 
              ? 'bg-gradient-to-br from-orange-500/20 to-red-500/10 border-2 border-orange-500/50 shadow-lg shadow-orange-500/10 scale-[1.02]' 
              : 'bg-gray-800/40 border-2 border-gray-700/50 hover:border-orange-500/30 hover:bg-orange-500/5'
          }`}>
            <div className="relative p-6">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  tipoMantenimiento === 'correctivo' 
                    ? 'bg-orange-500/20 text-orange-400' 
                    : 'bg-gray-700/50 text-gray-500 group-hover:bg-orange-500/10 group-hover:text-orange-400'
                }`}>
                  <Wrench className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className={`font-semibold text-lg ${
                    tipoMantenimiento === 'correctivo' ? 'text-orange-300' : 'text-gray-300 group-hover:text-orange-300'
                  }`}>
                    Correctivo
                  </div>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                    Reparación de fallas existentes y solución de problemas específicos
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="px-2 py-1 text-xs bg-orange-500/10 text-orange-400 rounded-md">Urgente</span>
                    <span className="px-2 py-1 text-xs bg-red-500/10 text-red-400 rounded-md">Reparación</span>
                  </div>
                </div>
              </div>
              <input
                type="radio"
                name="tipoMantenimiento"
                value="correctivo"
                checked={tipoMantenimiento === 'correctivo'}
                onChange={(e) => onCambiarTipoMantenimiento(e.target.value as 'preventivo' | 'correctivo')}
                className="absolute top-4 right-4 text-orange-500 focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </label>
        </div>
      </div>

      {/* Sección de Tareas con mejor separación visual */}
      <div className="bg-gradient-to-r from-gray-800/30 to-gray-700/20 rounded-2xl p-6 border border-gray-600/20">
        <div className="flex items-center mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
            tipoMantenimiento === 'preventivo' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-orange-500/20 text-orange-400'
          }`}>
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Tareas Realizadas</h3>
            <p className="text-sm text-gray-400">
              Documenta las actividades de mantenimiento {tipoMantenimiento}
            </p>
          </div>
        </div>
        
        <TareasInput
          tipoMantenimiento={tipoMantenimiento}
          tareasSeleccionadas={tareasSeleccionadas}
          tareasPersonalizadas={tareasPersonalizadas}
          mostrarTareasPredefinidas={mostrarTareasPredefinidas}
          setMostrarTareasPredefinidas={onSetMostrarTareasPredefinidas}
          onToggleTareaPredefinida={onToggleTareaPredefinida}
          onActualizarTareaPersonalizada={onActualizarTareaPersonalizada}
          onAgregarTareaPersonalizada={onAgregarTareaPersonalizada}
          onEliminarTareaPersonalizada={onEliminarTareaPersonalizada}
        />
      </div>

      {/* Sección de Piezas con diseño mejorado */}
      <div className="bg-gradient-to-r from-gray-800/30 to-gray-700/20 rounded-2xl p-6 border border-gray-600/20">
        <PiezasInput
          piezasUsadas={piezasUsadas}
          onActualizarPieza={onActualizarPieza}
          onAgregarPieza={onAgregarPieza}
          onEliminarPieza={onEliminarPieza}
        />
      </div>
    </div>
  )
}