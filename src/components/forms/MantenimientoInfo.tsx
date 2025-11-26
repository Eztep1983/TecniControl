// components/forms/MantenimientoInfo.tsx
'use client'
import { Settings, ArrowUp, Wrench, Zap, Shield, Stethoscope, Package, CheckCircle2, ChevronRight } from 'lucide-react'
import TareasInput from './TareasInput'
import PiezasInput from './PiezasInput'
import DiagnosticoInfo from './DiagnosticoInfo'
import { useMemo, memo, useState, SetStateAction, Dispatch, useCallback } from 'react'

interface Pieza {
  pieza: string
  cantidad: number
  tipo?: 'predefinida' | 'personalizada'
  idPredefinida?: string
}

interface MantenimientoInfoProps {
  tipoMantenimiento: 'preventivo' | 'correctivo' | 'diagnostico' | ''
  tareasSeleccionadas: string[]
  tareasPersonalizadas: string[]
  piezasUsadas: Pieza[]
  setPiezasUsadas: Dispatch<SetStateAction<Pieza[]>> 
  mostrarTareasPredefinidas: boolean
  observacionesIniciales?: string
  pruebasRealizadas?: string
  diagnosticoFinal?: string
  
  onCambiarTipoMantenimiento: (tipo: 'preventivo' | 'correctivo' | 'diagnostico' | '') => void
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
      className={`
        w-full text-left rounded-xl border-2 transition-all duration-300 group
        touch-manipulation
        ${esSeleccionado 
          ? `${config.colorBorder} ${config.colorBg} ring-2 sm:ring-4 ${config.colorRing} scale-[1.02]` 
          : `border-gray-700/50 bg-gray-800/30 ${config.colorHover} hover:scale-[1.01] active:scale-[0.98]`
        }
      `}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300
            ${esSeleccionado ? config.colorIcon : 'bg-gray-700/30 text-gray-500 group-hover:bg-gray-700/50 group-hover:text-gray-400'}
          `}>
            <Icono className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={`
              text-base font-semibold transition-colors flex items-center gap-2
              ${esSeleccionado ? config.colorText : 'text-gray-300 group-hover:text-white'}
            `}>
              <span className="truncate">{config.nombre}</span>
              {tieneContenido && (
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5 truncate">
              {config.descripcion}
            </p>
          </div>
          
          <ChevronRight className={`
            w-5 h-5 transition-all duration-300 flex-shrink-0
            ${esSeleccionado 
              ? `${config.colorText} rotate-0` 
              : 'text-gray-600 -rotate-90 group-hover:rotate-0 group-hover:text-gray-400'
            }
          `} />
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

  // Estados derivados optimizados
  const hasTipoSeleccionado = useMemo(
    () => tipoMantenimiento !== '' && ['preventivo', 'correctivo', 'diagnostico'].includes(tipoMantenimiento),
    [tipoMantenimiento]
  )

  const contenidoPorTipo = useMemo(() => ({
    preventivo: tipoMantenimiento === 'preventivo' && (tareasSeleccionadas.length > 0 || tareasPersonalizadas.some(t => t.trim())),
    correctivo: tipoMantenimiento === 'correctivo' && (tareasSeleccionadas.length > 0 || tareasPersonalizadas.some(t => t.trim())),
    diagnostico: tipoMantenimiento === 'diagnostico' && Boolean(observacionesIniciales.trim() && pruebasRealizadas.trim() && diagnosticoFinal.trim())
  }), [tipoMantenimiento, tareasSeleccionadas, tareasPersonalizadas, observacionesIniciales, pruebasRealizadas, diagnosticoFinal])

  const config = useMemo(() => 
    tipoMantenimiento ? TIPO_CONFIG[tipoMantenimiento as keyof typeof TIPO_CONFIG] : null
  , [tipoMantenimiento])

  // Callbacks memoizados
  const handleVolverMobile = useCallback(() => {
    onCambiarTipoMantenimiento('')
  }, [onCambiarTipoMantenimiento])

  const handleCambiarTab = useCallback((tab: 'tareas' | 'piezas') => {
    setTabActiva(tab)
  }, [])

  // Props memoizadas
  const tareasInputProps = useMemo(() => {
    if (tipoMantenimiento === '') return null
    
    return {
      tipoMantenimiento: tipoMantenimiento as 'preventivo' | 'correctivo' | 'diagnostico',
      tareasSeleccionadas,
      tareasPersonalizadas,
      mostrarTareasPredefinidas,
      setMostrarTareasPredefinidas: onSetMostrarTareasPredefinidas,
      onToggleTareaPredefinida,
      onActualizarTareaPersonalizada,
      onAgregarTareaPersonalizada,
      onEliminarTareaPersonalizada
    }
  }, [
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
    setPiezasUsadas,
    error: undefined
  }), [piezasUsadas, setPiezasUsadas])

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
    <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header Principal */}
      <div className="p-5 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center flex-shrink-0">
            <Settings className="w-5 h-5 text-gray-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white truncate">Información del Trabajo</h3>
            <p className="text-sm text-gray-400 truncate">Selecciona el tipo y completa los detalles</p>
          </div>
        </div>
      </div>

      {/* Contenedor Principal con Layout Responsivo */}
      <div className="lg:flex overflow-hidden relative min-h-[500px]">
        {/* Panel Izquierdo - Selector de Tipo */}
        <div className={`
          flex-shrink-0 transition-all duration-500 ease-in-out bg-gray-800/20
          lg:relative absolute inset-0 lg:inset-auto z-10
          ${hasTipoSeleccionado 
            ? 'lg:w-80 lg:translate-x-0 -translate-x-full lg:opacity-100 opacity-0 pointer-events-none lg:pointer-events-auto' 
            : 'w-full translate-x-0 opacity-100 pointer-events-auto'
          }
          lg:border-r border-gray-700/50
        `}>
          <div className="p-5 space-y-3 h-full overflow-y-auto">
            <TipoMantenimientoCard 
              tipo="preventivo"
              esSeleccionado={tipoMantenimiento === 'preventivo'}
              onClick={() => onCambiarTipoMantenimiento('preventivo')}
              tieneContenido={contenidoPorTipo.preventivo}
            />
            
            <TipoMantenimientoCard 
              tipo="correctivo"
              esSeleccionado={tipoMantenimiento === 'correctivo'}
              onClick={() => onCambiarTipoMantenimiento('correctivo')}
              tieneContenido={contenidoPorTipo.correctivo}
            />
            
            <TipoMantenimientoCard 
              tipo="diagnostico"
              esSeleccionado={tipoMantenimiento === 'diagnostico'}
              onClick={() => onCambiarTipoMantenimiento('diagnostico')}
              tieneContenido={contenidoPorTipo.diagnostico}
            />

            {!hasTipoSeleccionado && (
              <div className="mt-6 p-4 bg-gray-700/20 rounded-lg border border-gray-700/50">
                <p className="text-sm text-gray-400 text-center">
                  <ArrowUp className="w-4 h-4 mx-auto mb-2 text-gray-500 animate-bounce" />
                   Selecciona un tipo de trabajo para comenzar
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho - Contenido Detallado */}
        <div className={`
          flex-1 bg-gray-800/30 backdrop-blur-sm
          transition-all duration-500 ease-in-out
          lg:relative absolute inset-0 lg:inset-auto z-20
          ${hasTipoSeleccionado 
            ? 'translate-x-0 opacity-100 pointer-events-auto' 
            : 'translate-x-full opacity-0 pointer-events-none'
          }
        `}>
          {hasTipoSeleccionado && config && (
            <div className="h-full flex flex-col">
              {/* Header del Panel Seleccionado */}
              <div className={`px-5 py-4 border-b border-gray-700/50 ${config.colorBg} backdrop-blur-sm`}>
                <div className="flex items-center gap-3">
                  {/* Botón Volver (Solo Móvil) */}
                  <button
                    type="button"
                    onClick={handleVolverMobile}
                    className="lg:hidden w-9 h-9 rounded-lg bg-gray-700/50 hover:bg-gray-700 active:scale-95 flex items-center justify-center flex-shrink-0 transition-all touch-manipulation"
                    aria-label="Volver a selección"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400 rotate-180" />
                  </button>
                  
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.colorIcon}`}>
                    <config.icono className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-base font-semibold ${config.colorText} truncate`}>
                      {config.labelTareas}
                    </h4>
                    <p className="text-sm text-gray-400 truncate">{config.descripcionTareas}</p>
                  </div>
                </div>
              </div>

              {/* Contenido Scrollable */}
              <div className="flex-1 overflow-y-auto">
                {tipoMantenimiento === 'diagnostico' ? (
                  // Vista de Diagnóstico (Sin Tabs)
                  <div className="p-5">
                    <DiagnosticoInfo {...diagnosticoProps} />
                  </div>
                ) : (
                  // Vista con Tabs (Preventivo/Correctivo)
                  <>
                    {/* Navegación de Tabs */}
                    <div className="flex border-b border-gray-700/50 bg-gray-800/50 sticky top-0 z-10 backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => handleCambiarTab('tareas')}
                        className={`
                          flex-1 px-4 py-3 text-sm font-medium transition-all relative
                          ${tabActiva === 'tareas' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}
                        `}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Zap className="w-4 h-4" />
                          <span>Tareas</span>
                          {(tareasSeleccionadas.length > 0 || tareasPersonalizadas.some(t => t.trim())) && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          )}
                        </div>
                        {tabActiva === 'tareas' && (
                          <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${config.colorAccent}`} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCambiarTab('piezas')}
                        className={`
                          flex-1 px-4 py-3 text-sm font-medium transition-all relative
                          ${tabActiva === 'piezas' ? 'text-white' : 'text-gray-400 hover:text-gray-300'}
                        `}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>Repuestos</span>
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

                    {/* Contenido de Tabs */}
                    <div className="p-5">
                      {tabActiva === 'tareas' ? (
                        tareasInputProps ? (
                          <TareasInput {...tareasInputProps} />
                        ) : null
                      ) : (
                        <div className="space-y-3">
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