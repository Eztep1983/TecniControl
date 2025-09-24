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

// CONSTANTES EXTERNAS PARA EVITAR RECREACIÓN
const TIPO_CONFIG = {
  preventivo: {
    gradient: 'from-green-500/20 to-emerald-500/10',
    border: 'border-green-500/50',
    shadow: 'shadow-green-500/10',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-400',
    textColor: 'text-green-300',
    nombre: 'Preventivo',
    descripcion: 'Mantenimiento programado para prevenir fallas y optimizar rendimiento',
    icono: Shield
  },
  correctivo: {
    gradient: 'from-orange-500/20 to-red-500/10',
    border: 'border-orange-500/50',
    shadow: 'shadow-orange-500/10',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-400',
    textColor: 'text-orange-300',
    nombre: 'Correctivo',
    descripcion: 'Reparación de fallas existentes y solución de problemas específicos',
    icono: Wrench
  }
} as const;

// COMPONENTES MEMOIZADOS PEQUEÑOS
const SectionHeader = memo(({ 
  icon: Icon, 
  title, 
  description,
  colorClass 
}: { 
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  colorClass?: string;
}) => (
  <div className="flex items-center mb-4 md:mb-6">
    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center mr-3 md:mr-4 ${
      colorClass || 'bg-purple-500/20 text-purple-400'
    }`}>
      <Icon className="w-4 h-4 md:w-5 md:h-5" />
    </div>
    <div>
      <h3 className="text-base md:text-lg font-semibold text-white">{title}</h3>
      <p className="text-xs md:text-sm text-gray-400">{description}</p>
    </div>
  </div>
));

SectionHeader.displayName = 'SectionHeader';

const TipoMantenimientoCard = memo(({ 
  tipo, 
  esSeleccionado, 
  onClick 
}: { 
  tipo: 'preventivo' | 'correctivo';
  esSeleccionado: boolean;
  onClick: () => void;
}) => {
  const config = TIPO_CONFIG[tipo];
  const opuestoTipo = tipo === 'preventivo' ? 'correctivo' : 'preventivo';
  const opuestoConfig = TIPO_CONFIG[opuestoTipo];
  const Icono = config.icono;

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
              : `bg-gray-700/50 text-gray-500 group-hover:${opuestoConfig.iconBg} group-hover:${opuestoConfig.iconColor}`
          }`}>
            <Icono className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-base md:text-lg ${
              esSeleccionado ? config.textColor : 'text-gray-300 group-hover:' + opuestoConfig.textColor
            }`}>
              {config.nombre}
            </div>
            <p className="text-xs md:text-sm text-gray-400 mt-1 leading-relaxed">
              {config.descripcion}
            </p>
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
  );
});

TipoMantenimientoCard.displayName = 'TipoMantenimientoCard';

// HOOK PARA OPTIMIZAR HANDLERS
const useMantenimientoHandlers = (props: Pick<MantenimientoInfoProps, 
  'onCambiarTipoMantenimiento' | 
  'onSetMostrarTareasPredefinidas'
>) => {
  const handleCambiarPreventivo = useCallback(() => {
    props.onCambiarTipoMantenimiento('preventivo');
  }, [props.onCambiarTipoMantenimiento]);

  const handleCambiarCorrectivo = useCallback(() => {
    props.onCambiarTipoMantenimiento('correctivo');
  }, [props.onCambiarTipoMantenimiento]);

  return {
    handleCambiarPreventivo,
    handleCambiarCorrectivo
  };
};

// COMPONENTE PRINCIPAL OPTIMIZADO
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
  
  const handlers = useMantenimientoHandlers({
    onCambiarTipoMantenimiento,
    onSetMostrarTareasPredefinidas
  });

  // MEMOIZAR PROPS PARA COMPONENTES HIJOS
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
  ]);

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
  ]);

  const colorClassTareas = tipoMantenimiento === 'preventivo' 
    ? 'bg-green-500/20 text-green-400' 
    : 'bg-orange-500/20 text-orange-400';

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Sección Tipo de Mantenimiento */}
      <div className="bg-gray-800/50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-600/30">
        <SectionHeader
          icon={Settings}
          title="Tipo de Trabajo"
          description="Selecciona el tipo de mantenimiento"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
      </div>

      {/* Sección de Tareas */}
      <div className="bg-gray-800/30 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-600/20">
        <SectionHeader
          icon={Zap}
          title="Tareas Realizadas"
          description={`Documenta las actividades de mantenimiento ${tipoMantenimiento}`}
          colorClass={colorClassTareas}
        />
        
        <TareasInput {...tareasInputProps} />
      </div>

      {/* Sección de Piezas */}
      <div className="bg-gray-800/30 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-600/20">
        <PiezasInput {...piezasInputProps} />
      </div>
    </div>
  )
});

MantenimientoInfo.displayName = 'MantenimientoInfo';

export default MantenimientoInfo;