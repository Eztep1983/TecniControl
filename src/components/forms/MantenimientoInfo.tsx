// components/forms/MantenimientoInfo.tsx
'use client'
import { Settings, Wrench, Zap, Shield } from 'lucide-react'
import TareasInput from './TareasInput'
import PiezasInput from './PiezasInput'
import { useCallback, useMemo, memo } from 'react'

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

// Componente memoizado para evitar re-renderizados innecesarios
const MantenimientoInfo = memo(function MantenimientoInfo({
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
  
  // MEMOIZAR HANDLERS PARA EVITAR CAMBIOS DE REFERENCIA
  const handleCambiarPreventivo = useCallback(() => {
    onCambiarTipoMantenimiento('preventivo')
  }, [onCambiarTipoMantenimiento])

  const handleCambiarCorrectivo = useCallback(() => {
    onCambiarTipoMantenimiento('correctivo')
  }, [onCambiarTipoMantenimiento])

  // MEMOIZAR VALORES COMPUTADOS COSTOSOS
  const tipoMantenimientoConfig = useMemo(() => ({
    preventivo: {
      gradient: 'from-green-500/20 to-emerald-500/10',
      border: 'border-green-500/50',
      shadow: 'shadow-green-500/10',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      textColor: 'text-green-300',
      tags: [
        { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Rutinario' },
        { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Programado' }
      ]
    },
    correctivo: {
      gradient: 'from-orange-500/20 to-red-500/10',
      border: 'border-orange-500/50',
      shadow: 'shadow-orange-500/10',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      textColor: 'text-orange-300',
      tags: [
        { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Urgente' },
        { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Reparación' }
      ]
    }
  }), [])

  const currentConfig = tipoMantenimientoConfig[tipoMantenimiento]
  const oppositeConfig = tipoMantenimientoConfig[tipoMantenimiento === 'preventivo' ? 'correctivo' : 'preventivo']

  // COMPONENTE MEMOIZADO PARA LAS TARJETAS DE TIPO DE MANTENIMIENTO
  const TipoMantenimientoCard = useMemo(() => 
    ({ tipo, esSeleccionado, onClick }: { 
      tipo: 'preventivo' | 'correctivo', 
      esSeleccionado: boolean, 
      onClick: () => void 
    }) => {
      const config = tipo === 'preventivo' ? tipoMantenimientoConfig.preventivo : tipoMantenimientoConfig.correctivo
      const opuestoConfig = tipo === 'preventivo' ? tipoMantenimientoConfig.correctivo : tipoMantenimientoConfig.preventivo
      
      return (
        <label className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-200 ${
          esSeleccionado 
            ? `bg-gradient-to-br ${config.gradient} border-2 ${config.border} shadow-lg ${config.shadow} scale-[1.02]` 
            : `bg-gray-800/40 border-2 border-gray-700/50 hover:border-${tipo === 'preventivo' ? 'green' : 'orange'}-500/30 hover:bg-${tipo === 'preventivo' ? 'green' : 'orange'}-500/5`
        }`}>
          <div className="relative p-4 md:p-6">
            <div className="flex items-start space-x-3 md:space-x-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-colors ${
                esSeleccionado 
                  ? config.iconBg
                  : `bg-gray-700/50 text-gray-500 group-hover:${opuestoConfig.iconBg.replace('bg-', 'bg-')} group-hover:${opuestoConfig.iconColor}`
              }`}>
                {tipo === 'preventivo' ? (
                  <Shield className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <Wrench className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-base md:text-lg ${
                  esSeleccionado ? config.textColor : 'text-gray-300 group-hover:' + opuestoConfig.textColor
                }`}>
                  {tipo === 'preventivo' ? 'Preventivo' : 'Correctivo'}
                </div>
                <p className="text-xs md:text-sm text-gray-400 mt-1 leading-relaxed">
                  {tipo === 'preventivo' 
                    ? 'Mantenimiento programado para prevenir fallas y optimizar rendimiento'
                    : 'Reparación de fallas existentes y solución de problemas específicos'
                  }
                </p>
                <div className="mt-2 md:mt-3 flex flex-wrap gap-1">
                  {config.tags.map((tag, index) => (
                    <span key={index} className={`px-2 py-1 text-xs rounded-md ${tag.bg} ${tag.text}`}>
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <input
              type="radio"
              name="tipoMantenimiento"
              value={tipo}
              checked={esSeleccionado}
              onChange={onClick}
              className="absolute top-3 right-3 md:top-4 md:right-4"
            />
          </div>
        </label>
      )
    }, [tipoMantenimientoConfig])

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Tipo de Mantenimiento - Optimizado con menos efectos */}
      <div className="bg-gray-800/50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-600/30">
        <div className="flex items-center mb-4 md:mb-6">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500/20 rounded-lg md:rounded-xl flex items-center justify-center mr-3 md:mr-4">
            <Settings className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-white">Tipo de Trabajo</h3>
            <p className="text-xs md:text-sm text-gray-400">Selecciona el tipo de mantenimiento</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <TipoMantenimientoCard 
            tipo="preventivo"
            esSeleccionado={tipoMantenimiento === 'preventivo'}
            onClick={handleCambiarPreventivo}
          />
          
          <TipoMantenimientoCard 
            tipo="correctivo"
            esSeleccionado={tipoMantenimiento === 'correctivo'}
            onClick={handleCambiarCorrectivo}
          />
        </div>
      </div>

      {/* Sección de Tareas - Simplificada */}
      <div className="bg-gray-800/30 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-600/20">
        <div className="flex items-center mb-4 md:mb-6">
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center mr-3 md:mr-4 ${
            tipoMantenimiento === 'preventivo' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-orange-500/20 text-orange-400'
          }`}>
            <Zap className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-white">Tareas Realizadas</h3>
            <p className="text-xs md:text-sm text-gray-400">
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

      {/* Sección de Piezas - Simplificada */}
      <div className="bg-gray-800/30 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-600/20">
        <PiezasInput
          piezasUsadas={piezasUsadas}
          onActualizarPieza={onActualizarPieza}
          onAgregarPieza={onAgregarPieza}
          onEliminarPieza={onEliminarPieza}
        />
      </div>
    </div>
  )
})

export default MantenimientoInfo