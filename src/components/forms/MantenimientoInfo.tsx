// components/forms/MantenimientoInfo.tsx
'use client'
import { Settings, Shield, Wrench, Stethoscope, Monitor, ShieldCheck, CheckCircle2 } from 'lucide-react'
import TareasInput from './TareasInput'
import PiezasInput from './PiezasInput'
import DiagnosticoInfo from './DiagnosticoInfo'
import InstalacionInfo from './InstalacionInfo'
import { useMemo, memo, Dispatch, SetStateAction } from 'react'

interface Pieza {
  pieza: string
  cantidad: number
  tipo?: 'predefinida' | 'personalizada'
  idPredefinida?: string
}

interface MantenimientoInfoProps {
  tipoMantenimiento: 'preventivo' | 'correctivo' | 'diagnostico' | 'instalacion' | 'garantia' | '' 
  tareasSeleccionadas: string[]
  tareasPersonalizadas: string[]
  piezasUsadas: Pieza[]
  setPiezasUsadas: Dispatch<SetStateAction<Pieza[]>> 
  mostrarTareasPredefinidas: boolean
  observacionesIniciales?: string
  pruebasRealizadas?: string
  diagnosticoFinal?: string
  
  onCambiarTipoMantenimiento: (tipo: 'preventivo' | 'correctivo' | 'diagnostico' | 'instalacion' | 'garantia' | '') => void
  onToggleTareaPredefinida: (tarea: string) => void
  onSetMostrarTareasPredefinidas: (mostrar: boolean) => void
  onActualizarTareaPersonalizada: (index: number, valor: string) => void
  onAgregarTareaPersonalizada: (valor?: string) => void
  onEliminarTareaPersonalizada: (index: number) => void
  onCambiarObservaciones?: (valor: string) => void
  onCambiarPruebas?: (valor: string) => void
  onCambiarDiagnostico?: (valor: string) => void

  // Props de Instalación
  instalacionRecomendaciones?: boolean
  instalacionRecomendacionesDetalle?: string
  instalacionConfiguracion?: boolean
  instalacionConfiguracionTipos?: string[]
  onToggleInstalacionRecomendaciones?: (valor: boolean) => void
  onCambiarInstalacionRecomendacionesDetalle?: (valor: string) => void
  onToggleInstalacionConfiguracion?: (valor: boolean) => void
  onToggleInstalacionConfiguracionTipo?: (tipo: string) => void
  onAgregarInstalacionConfiguracionPersonalizada?: (tipo: string) => void
}

const TIPO_CONFIG = {
  preventivo: {
    icono: Shield,
    nombre: 'Preventivo',
    colorBorder: 'border-green-500/40',
    colorBg: 'bg-green-500/10',
    colorIcon: 'bg-green-500/20 text-green-400',
    colorText: 'text-green-300',
  },
  correctivo: {
    icono: Wrench,
    nombre: 'Correctivo',
    colorBorder: 'border-orange-500/40',
    colorBg: 'bg-orange-500/10',
    colorIcon: 'bg-orange-500/20 text-orange-400',
    colorText: 'text-orange-300',
  },
  diagnostico: {
    icono: Stethoscope,
    nombre: 'Diagnóstico',
    colorBorder: 'border-blue-500/40',
    colorBg: 'bg-blue-500/10',
    colorIcon: 'bg-blue-500/20 text-blue-400',
    colorText: 'text-blue-300',
  },
  instalacion: {
    icono: Monitor,
    nombre: 'Instalación',
    colorBorder: 'border-purple-500/40',
    colorBg: 'bg-purple-500/10',
    colorIcon: 'bg-purple-500/20 text-purple-400',
    colorText: 'text-purple-300',
  },
  garantia: {
    icono: ShieldCheck,
    nombre: 'Garantía',
    colorBorder: 'border-amber-500/40',
    colorBg: 'bg-amber-500/10',
    colorIcon: 'bg-amber-500/20 text-amber-400',
    colorText: 'text-amber-300',
  },
} as const

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

  // Props de Instalación
  instalacionRecomendaciones = false,
  instalacionRecomendacionesDetalle = '',
  instalacionConfiguracion = false,
  instalacionConfiguracionTipos = [],
  onToggleInstalacionRecomendaciones = () => {},
  onCambiarInstalacionRecomendacionesDetalle = () => {},
  onToggleInstalacionConfiguracion = () => {},
  onToggleInstalacionConfiguracionTipo = () => {},
  onAgregarInstalacionConfiguracionPersonalizada = () => {},
}: MantenimientoInfoProps) {
  
  const tareasInputProps = useMemo(() => ({
    tipoMantenimiento,
    tareasSeleccionadas,
    tareasPersonalizadas,
    onToggleTareaPredefinida,
    onActualizarTareaPersonalizada,
    onAgregarTareaPersonalizada,
    onEliminarTareaPersonalizada
  }), [
    tipoMantenimiento,
    tareasSeleccionadas,
    tareasPersonalizadas,
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

  const instalacionProps = useMemo(() => ({
    recomendaciones: instalacionRecomendaciones,
    recomendacionesDetalle: instalacionRecomendacionesDetalle,
    configuracion: instalacionConfiguracion,
    configuracionTipos: instalacionConfiguracionTipos,
    onToggleRecomendaciones: onToggleInstalacionRecomendaciones,
    onCambiarRecomendacionesDetalle: onCambiarInstalacionRecomendacionesDetalle,
    onToggleConfiguracion: onToggleInstalacionConfiguracion,
    onToggleConfiguracionTipo: onToggleInstalacionConfiguracionTipo,
    onAgregarConfiguracionPersonalizada: onAgregarInstalacionConfiguracionPersonalizada
  }), [
    instalacionRecomendaciones,
    instalacionRecomendacionesDetalle,
    instalacionConfiguracion,
    instalacionConfiguracionTipos,
    onToggleInstalacionRecomendaciones,
    onCambiarInstalacionRecomendacionesDetalle,
    onToggleInstalacionConfiguracion,
    onToggleInstalacionConfiguracionTipo,
    onAgregarInstalacionConfiguracionPersonalizada
  ])

  return (
    <div className="bg-gray-800/20 sm:bg-gray-800/40 rounded-xl sm:border border-gray-700/50 w-full">
      {/* Header Opcional en Desktop */}
      <div className="hidden sm:flex p-5 border-b border-gray-700/50 items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center flex-shrink-0">
          <Settings className="w-5 h-5 text-gray-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white truncate">Información del Trabajo</h3>
          <p className="text-sm text-gray-400 truncate">Selecciona el tipo y documenta el trabajo</p>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-6">
        {/* Selección de Tipos Vertical (Refactorizado) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(['preventivo', 'correctivo', 'diagnostico', 'instalacion', 'garantia'] as const).map(tipo => {
            const config = TIPO_CONFIG[tipo]
            const active = tipoMantenimiento === tipo
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => onCambiarTipoMantenimiento(tipo)}
                className={`
                  relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 touch-manipulation group
                  ${active 
                    ? `${config.colorBorder} ${config.colorBg} shadow-xl shadow-${tipo === 'preventivo' ? 'green' : tipo === 'correctivo' ? 'orange' : tipo === 'instalacion' ? 'purple' : tipo === 'garantia' ? 'amber' : 'blue'}-500/10 scale-[1.02] z-10` 
                    : `border-gray-700/50 bg-gray-900/40 hover:bg-gray-800/80 hover:border-gray-600`
                  }
                `}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  active ? config.colorIcon : 'bg-gray-800 text-gray-500 group-hover:bg-gray-700'
                }`}>
                  <config.icono className={`w-6 h-6 ${active ? 'animate-pulse' : ''}`} />
                </div>
                
                <div className="flex-1 text-left">
                  <span className={`block text-sm font-bold uppercase tracking-wider transition-colors ${active ? config.colorText : 'text-gray-400'}`}>
                    {config.nombre}
                  </span>
                  <p className={`text-[11px] mt-0.5 transition-colors ${active ? 'text-white/60' : 'text-gray-600'}`}>
                    {tipo === 'preventivo' && 'Mantenimiento de rutina'}
                    {tipo === 'correctivo' && 'Reparación de fallas'}
                    {tipo === 'diagnostico' && 'Evaluación técnica'}
                    {tipo === 'instalacion' && 'Puesta en marcha'}
                    {tipo === 'garantia' && 'Servicio post-venta'}
                  </p>
                </div>

                {active && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className={`w-5 h-5 ${config.colorText.split(' ')[0]}`} />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Flujo Vertical del Mantenimiento */}
        <div className="transition-all duration-300">
          {!tipoMantenimiento && (
            <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-700/30 rounded-xl">
               Selecciona un tipo de trabajo arriba para comenzar
            </div>
          )}

          {tipoMantenimiento === 'diagnostico' && (
             <DiagnosticoInfo {...diagnosticoProps} />
          )}

          {tipoMantenimiento === 'instalacion' && (
             <InstalacionInfo {...instalacionProps} />
          )}

          {(tipoMantenimiento === 'preventivo' || tipoMantenimiento === 'correctivo' || tipoMantenimiento === 'garantia') && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Sección Tareas */}
              <section className="relative z-20">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
                  <h3 className="text-gray-200 text-sm font-semibold uppercase tracking-wider">Actividades Realizadas</h3>
                </div>
                <TareasInput {...tareasInputProps} />
              </section>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-700/50 to-transparent" />

              {/* Sección Repuestos */}
              <section className="relative z-10">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-1.5 h-5 bg-purple-500 rounded-full" />
                  <h3 className="text-gray-200 text-sm font-semibold uppercase tracking-wider">Repuestos Utilizados</h3>
                </div>
                <PiezasInput {...piezasInputProps} />
              </section>

            </div>
          )}
        </div>
      </div>
      
    </div>
  )
})

MantenimientoInfo.displayName = 'MantenimientoInfo'

export default MantenimientoInfo