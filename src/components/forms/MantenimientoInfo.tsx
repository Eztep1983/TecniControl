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

// Configuración inmutable fuera del componente
const TIPO_CONFIG = {
  preventivo: {
    icono: Shield,
    nombre: 'Preventivo',
    descripcion: 'Mantenimiento programado para prevenir fallas',
    colorBorder: 'border-green-500/40',
    colorBg: 'bg-green-500/5',
    colorIcon: 'bg-green-500/15 text-green-400',
    colorText: 'text-green-300',
    colorHover: 'hover:border-green-500/60 hover:bg-green-500/10'
  },
  correctivo: {
    icono: Wrench,
    nombre: 'Correctivo',
    descripcion: 'Reparación de fallas y solución de problemas',
    colorBorder: 'border-orange-500/40',
    colorBg: 'bg-orange-500/5',
    colorIcon: 'bg-orange-500/15 text-orange-400',
    colorText: 'text-orange-300',
    colorHover: 'hover:border-orange-500/60 hover:bg-orange-500/10'
  }
} as const

// Componentes memoizados con props estables
const SectionHeader = memo(({ 
  icon: Icon, 
  title, 
  description,
  colorClass 
}: { 
  icon: React.ComponentType<any>
  title: string
  description: string
  colorClass?: string
}) => (
  <div className="flex items-start gap-3 mb-5">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
      colorClass || 'bg-gray-700/50 text-gray-400'
    }`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400 mt-0.5">{description}</p>
    </div>
  </div>
))

SectionHeader.displayName = 'SectionHeader'

const TipoMantenimientoCard = memo(({ 
  tipo, 
  esSeleccionado, 
  onClick 
}: { 
  tipo: 'preventivo' | 'correctivo'
  esSeleccionado: boolean
  onClick: () => void
}) => {
  const config = TIPO_CONFIG[tipo]
  const Icono = config.icono

  return (
    <label className={`block rounded-lg border-2 cursor-pointer transition-all duration-200 ${
      esSeleccionado 
        ? `${config.colorBorder} ${config.colorBg}` 
        : `border-gray-700 bg-gray-800/30 ${config.colorHover}`
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
            esSeleccionado ? config.colorIcon : 'bg-gray-700/50 text-gray-500'
          }`}>
            <Icono className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`font-medium transition-colors ${
              esSeleccionado ? config.colorText : 'text-gray-300'
            }`}>
              {config.nombre}
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {config.descripcion}
            </p>
          </div>
          <input
            type="radio"
            name="tipoMantenimiento"
            value={tipo}
            checked={esSeleccionado}
            onChange={onClick}
            className="mt-1 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          />
        </div>
      </div>
    </label>
  )
})

TipoMantenimientoCard.displayName = 'TipoMantenimientoCard'

// Hook personalizado optimizado
const useMantenimientoHandlers = (
  onCambiarTipoMantenimiento: (tipo: 'preventivo' | 'correctivo') => void
) => {
  const handleCambiarPreventivo = useCallback(() => {
    onCambiarTipoMantenimiento('preventivo')
  }, [onCambiarTipoMantenimiento])

  const handleCambiarCorrectivo = useCallback(() => {
    onCambiarTipoMantenimiento('correctivo')
  }, [onCambiarTipoMantenimiento])

  return useMemo(() => ({
    handleCambiarPreventivo,
    handleCambiarCorrectivo
  }), [handleCambiarPreventivo, handleCambiarCorrectivo])
}

// Componente principal memoizado
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
  
  // Handlers optimizados con dependencias mínimas
  const handlers = useMantenimientoHandlers(onCambiarTipoMantenimiento)

  // Memoización de props para componentes hijos
  const tareasInputProps = useMemo(() => ({
    tipoMantenimiento,
    tareasSeleccionadas,
    tareasPersonalizadas,
    mostrarTareasPredefinidas,
    setMostrarTareasPredefinidas: onSetMostrarTareasPredefinidas,
    onToggleTareaPredefinida,
    onActualizarTareaPersonalizada,
    onAgregarTareaPersonalizada,
    onEliminarTareaPersonalizada
  }), [
    tipoMantenimiento,
    tareasSeleccionadas,
    tareasPersonalizadas,
    mostrarTareasPredefinidas,
    onSetMostrarTareasPredefinidas,
    onToggleTareaPredefinida,
    onActualizarTareaPersonalizada,
    onAgregarTareaPersonalizada,
    onEliminarTareaPersonalizada
  ])

  const piezasInputProps = useMemo(() => ({
    piezasUsadas,
    onActualizarPieza,
    onAgregarPieza,
    onEliminarPieza
  }), [
    piezasUsadas,
    onActualizarPieza,
    onAgregarPieza,
    onEliminarPieza
  ])

  // Valores derivados memoizados
  const colorClassTareas = useMemo(() => 
    tipoMantenimiento === 'preventivo' 
      ? 'bg-green-500/15 text-green-400' 
      : 'bg-orange-500/15 text-orange-400'
  , [tipoMantenimiento])

  const sectionTareasProps = useMemo(() => ({
    icon: Zap,
    title: "Tareas Realizadas",
    description: `Documenta las actividades de mantenimiento ${tipoMantenimiento}`,
    colorClass: colorClassTareas
  }), [tipoMantenimiento, colorClassTareas])

  return (
    <div className="space-y-6">
      {/* Tipo de Mantenimiento */}
      <section className="bg-gray-800/40 rounded-lg p-5 border border-gray-700/50">
        <SectionHeader
          icon={Settings}
          title="Tipo de Trabajo"
          description="Selecciona el tipo de mantenimiento"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TipoMantenimientoCard 
            tipo="preventivo"
            esSeleccionado={tipoMantenimiento === 'preventivo'}
            onClick={handlers.handleCambiarPreventivo}
          />
          
          <TipoMantenimientoCard 
            tipo="correctivo"
            esSeleccionado={tipoMantenimiento === 'correctivo'}
            onClick={handlers.handleCambiarCorrectivo}
          />
        </div>
      </section>

      {/* Tareas Realizadas */}
      <section className="bg-gray-800/40 rounded-lg p-5 border border-gray-700/50">
        <SectionHeader {...sectionTareasProps} />
        <TareasInput {...tareasInputProps} />
      </section>

      {/* Piezas Usadas */}
      <section className="bg-gray-800/40 rounded-lg p-5 border border-gray-700/50">
        <PiezasInput {...piezasInputProps} />
      </section>
    </div>
  )
})

MantenimientoInfo.displayName = 'MantenimientoInfo'

export default MantenimientoInfo