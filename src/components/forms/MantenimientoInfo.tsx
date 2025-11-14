// components/forms/MantenimientoInfo.tsx
'use client'
import { Settings, Wrench, Zap, Shield, Stethoscope, Package, CheckCircle2, ChevronRight } from 'lucide-react'
import TareasInput from './TareasInput'
import PiezasInput from './PiezasInput'
import DiagnosticoInfo from './DiagnosticoInfo'
import { useMemo, memo, useState, SetStateAction, Dispatch } from 'react'

interface Pieza {
  pieza: string
  cantidad: number
  tipo?: 'predefinida' | 'personalizada'
  idPredefinida?: string
}

interface MantenimientoInfoProps {
  tipoMantenimiento: 'preventivo' | 'correctivo' | 'diagnostico'
  tareasSeleccionadas: string[]
  tareasPersonalizadas: string[]
  piezasUsadas: Pieza[]
  setPiezasUsadas: Dispatch<SetStateAction<Pieza[]>> 
  mostrarTareasPredefinidas: boolean
  observacionesIniciales?: string
  pruebasRealizadas?: string
  diagnosticoFinal?: string
  
  onCambiarTipoMantenimiento: (tipo: 'preventivo' | 'correctivo' | 'diagnostico') => void
  onToggleTareaPredefinida: (tarea: string) => void
  onSetMostrarTareasPredefinidas: (mostrar: boolean) => void
  onActualizarTareaPersonalizada: (index: number, valor: string) => void
  onAgregarTareaPersonalizada: () => void
  onEliminarTareaPersonalizada: (index: number) => void
  onCambiarObservaciones?: (valor: string) => void
  onCambiarPruebas?: (valor: string) => void
  onCambiarDiagnostico?: (valor: string) => void
}

const TIPO_CONFIG = {
  preventivo: {
    icono: Shield,
    nombre: 'Preventivo',
    descripcion: 'Mantenimiento programado',
    colorBorder: 'border-green-500/40',
    colorBg: 'bg-green-500/5',
    colorIcon: 'bg-green-500/15 text-green-400',
    colorText: 'text-green-300',
    colorHover: 'hover:border-green-500/60 hover:bg-green-500/10',
    colorRing: 'ring-green-500/30',
    colorAccent: 'bg-green-500',
    labelTareas: 'Tareas de Mantenimiento Preventivo',
    descripcionTareas: 'Actividades preventivas realizadas',
  },
  correctivo: {
    icono: Wrench,
    nombre: 'Correctivo',
    descripcion: 'Reparación de fallas',
    colorBorder: 'border-orange-500/40',
    colorBg: 'bg-orange-500/5',
    colorIcon: 'bg-orange-500/15 text-orange-400',
    colorText: 'text-orange-300',
    colorHover: 'hover:border-orange-500/60 hover:bg-orange-500/10',
    colorRing: 'ring-orange-500/30',
    colorAccent: 'bg-orange-500',
    labelTareas: 'Correctivos Realizados',
    descripcionTareas: 'Acciones correctivas ejecutadas',
  },
  diagnostico: {
    icono: Stethoscope,
    nombre: 'Diagnóstico',
    descripcion: 'Evaluación técnica',
    colorBorder: 'border-blue-500/40',
    colorBg: 'bg-blue-500/5',
    colorIcon: 'bg-blue-500/15 text-blue-400',
    colorText: 'text-blue-300',
    colorHover: 'hover:border-blue-500/60 hover:bg-blue-500/10',
    colorRing: 'ring-blue-500/30',
    colorAccent: 'bg-blue-500',
    labelTareas: 'Informe de Diagnóstico',
    descripcionTareas: 'Análisis del estado del equipo',
  }
} as const

const TipoMantenimientoCard = memo(({ 
  tipo, 
  esSeleccionado, 
  onClick,
  tieneContenido
}: { 
  tipo: 'preventivo' | 'correctivo' | 'diagnostico'
  esSeleccionado: boolean
  onClick: () => void
  tieneContenido: boolean
}) => {
  const config = TIPO_CONFIG[tipo]
  const Icono = config.icono

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg sm:rounded-xl border-2 transition-all duration-300 group ${
        esSeleccionado 
          ? `${config.colorBorder} ${config.colorBg} ring-2 sm:ring-4 ${config.colorRing} scale-[1.01] sm:scale-[1.02]` 
          : `border-gray-700 bg-gray-800/50 ${config.colorHover} active:scale-[0.98]`
      }`}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            esSeleccionado ? config.colorIcon : 'bg-gray-700/50 text-gray-500 group-hover:bg-gray-700 group-hover:text-gray-400'
          }`}>
            <Icono className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm sm:text-base font-semibold transition-colors flex items-center gap-1.5 sm:gap-2 ${
              esSeleccionado ? config.colorText : 'text-gray-300 group-hover:text-white'
            }`}>
              <span className="truncate">{config.nombre}</span>
              {tieneContenido && <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />}
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">
              {config.descripcion}
            </p>
          </div>
          <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 flex-shrink-0 ${
            esSeleccionado ? `${config.colorText} rotate-0` : 'text-gray-600 -rotate-90 group-hover:rotate-0 group-hover:text-gray-400'
          }`} />
        </div>
      </div>
    </button>
  )
})

TipoMantenimientoCard.displayName = 'TipoMantenimientoCard'

const MantenimientoInfo = memo(function MantenimientoInfo({
  tipoMantenimiento,
  tareasSeleccionadas,
  tareasPersonalizadas,
  piezasUsadas,
  setPiezasUsadas,
  mostrarTareasPredefinidas,
  observacionesIniciales = '',
  pruebasRealizadas = '',
  diagnosticoFinal = '',
  onCambiarTipoMantenimiento,
  onToggleTareaPredefinida,
  onSetMostrarTareasPredefinidas,
  onActualizarTareaPersonalizada,
  onAgregarTareaPersonalizada,
  onEliminarTareaPersonalizada,
  onCambiarObservaciones = () => {},
  onCambiarPruebas = () => {},
  onCambiarDiagnostico = () => {},
}: MantenimientoInfoProps) {
  
  const [tabActiva, setTabActiva] = useState<'tareas' | 'piezas'>('tareas')

  // Determinar si hay tipo seleccionado
  const hasTipoSeleccionado = ['preventivo', 'correctivo', 'diagnostico'].includes(tipoMantenimiento)

  // Verificar si hay contenido para cada tipo
  const tieneTareasPreventivo = tipoMantenimiento === 'preventivo' && 
    (tareasSeleccionadas.length > 0 || tareasPersonalizadas.some(t => t.trim() !== ''))
  
  const tieneTareasCorrectivo = tipoMantenimiento === 'correctivo' && 
    (tareasSeleccionadas.length > 0 || tareasPersonalizadas.some(t => t.trim() !== ''))
  
  const tieneDiagnostico = tipoMantenimiento === 'diagnostico' && 
    observacionesIniciales.trim() !== '' && 
    pruebasRealizadas.trim() !== '' && 
    diagnosticoFinal.trim() !== ''

  const config = useMemo(() => TIPO_CONFIG[tipoMantenimiento], [tipoMantenimiento])

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

  // CRÍTICO: Mantener la referencia estable del objeto de props
  const piezasInputProps = useMemo(() => ({
    piezasUsadas,
    setPiezasUsadas,
    error: undefined
  }), [piezasUsadas])

  const diagnosticoProps = useMemo(() => ({
    observacionesIniciales,
    pruebasRealizadas,
    diagnosticoFinal,
    onCambiarObservaciones,
    onCambiarPruebas,
    onCambiarDiagnostico,
  }), [
    observacionesIniciales,
    pruebasRealizadas,
    diagnosticoFinal,
    onCambiarObservaciones,
    onCambiarPruebas,
    onCambiarDiagnostico,
  ])

  return (
    <div className="bg-gray-800/40 rounded-xl border-gray-700/50 overflow-hidden">
      {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-700/50 flex items-center justify-center flex-shrink-0">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-white truncate">Información del Trabajo</h3>
            <p className="text-xs sm:text-sm text-gray-400 truncate">Selecciona el tipo y completa los detalles</p>
          </div>
        </div>


      {/* Contenedor con flujo horizontal/vertical según dispositivo */}
      <div className="lg:flex overflow-hidden">
        {/* Panel izquierdo - Selector de tipo (siempre visible en desktop, condicional en móvil) */}
        <div className={`flex-shrink-0 transition-all duration-500 ease-in-out ${
          hasTipoSeleccionado 
            ? 'lg:w-80 w-full lg:block' + (hasTipoSeleccionado ? ' hidden' : ' block')
            : 'w-full'
        }`}>
          <div className="p-3 sm:p-5 space-y-2 sm:space-y-3 h-full">
            <div className="space-y-2 sm:space-y-3">
              <TipoMantenimientoCard 
                tipo="preventivo"
                esSeleccionado={tipoMantenimiento === 'preventivo'}
                onClick={() => onCambiarTipoMantenimiento('preventivo')}
                tieneContenido={tieneTareasPreventivo}
              />
              
              <TipoMantenimientoCard 
                tipo="correctivo"
                esSeleccionado={tipoMantenimiento === 'correctivo'}
                onClick={() => onCambiarTipoMantenimiento('correctivo')}
                tieneContenido={tieneTareasCorrectivo}
              />
              
              <TipoMantenimientoCard 
                tipo="diagnostico"
                esSeleccionado={tipoMantenimiento === 'diagnostico'}
                onClick={() => onCambiarTipoMantenimiento('diagnostico')}
                tieneContenido={tieneDiagnostico}
              />
            </div>

            {!hasTipoSeleccionado && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-700/30 rounded-lg border border-gray-700/50">
                <p className="text-xs sm:text-sm text-gray-400 text-center">
                  👆 Selecciona un tipo de trabajo para comenzar
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho - Contenido (se desliza desde la derecha en desktop, reemplaza en móvil) */}
        <div className={`flex-1 lg:border-l border-gray-700/50 bg-gray-800/30 transition-all duration-500 ease-in-out ${
          hasTipoSeleccionado 
            ? 'lg:translate-x-0 opacity-100 block' 
            : 'lg:translate-x-full opacity-0 hidden lg:block'
        }`}>
          {hasTipoSeleccionado && (
            <div className="h-full flex flex-col">
              {/* Header del panel con botón de regreso en móvil */}
              <div className={`px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-700/50 ${config.colorBg}`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Botón de regreso solo en móvil */}
                  <button
                    type="button"
                    onClick={() => onCambiarTipoMantenimiento('' as any)}
                    className="lg:hidden w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-700 flex items-center justify-center flex-shrink-0 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400 rotate-180" />
                  </button>
                  
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.colorIcon}`}>
                    <config.icono className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm sm:text-base font-semibold ${config.colorText} truncate`}>
                      {config.labelTareas}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{config.descripcionTareas}</p>
                  </div>
                </div>
              </div>

              {/* Contenido scrollable */}
              <div className="flex-1 overflow-y-auto">
                {tipoMantenimiento === 'diagnostico' ? (
                  // Vista de diagnóstico
                  <div className="p-3 sm:p-5">
                    <DiagnosticoInfo {...diagnosticoProps} />
                  </div>
                ) : (
                  // Vista con tabs para preventivo/correctivo
                  <>
                    {/* Tabs */}
                    <div className="flex border-b border-gray-700/50 bg-gray-800/40 sticky top-0 z-10">
                      <button
                        type="button"
                        onClick={() => setTabActiva('tareas')}
                        className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all relative ${
                          tabActiva === 'tareas'
                            ? 'text-white'
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                          <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Tareas</span>
                          <span className="xs:hidden">Tareas</span>
                          {(tareasSeleccionadas.length > 0 || tareasPersonalizadas.some(t => t.trim())) && (
                            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400" />
                          )}
                        </div>
                        {tabActiva === 'tareas' && (
                          <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${config.colorAccent}`} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setTabActiva('piezas')}
                        className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all relative ${
                          tabActiva === 'piezas'
                            ? 'text-white'
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                          <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Repuestos</span>
                          <span className="xs:hidden">Repuestos</span>
                          {piezasUsadas.length > 0 && (
                            <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded-full">
                              {piezasUsadas.length}
                            </span>
                          )}
                        </div>
                        {tabActiva === 'piezas' && (
                          <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${config.colorAccent}`} />
                        )}
                      </button>
                    </div>

                    {/* Contenido de tabs */}
                    <div className="p-3 sm:p-5">
                      {tabActiva === 'tareas' ? (
                        <TareasInput {...tareasInputProps} />
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          <p className="text-xs text-gray-400">
                            Registro de piezas y materiales empleados (opcional)
                          </p>
                          <PiezasInput {...piezasInputProps} />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

MantenimientoInfo.displayName = 'MantenimientoInfo'

export default MantenimientoInfo