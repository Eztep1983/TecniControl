// components/forms/MantenimientoInfo.tsx
'use client'
import { Settings, Shield, Wrench, Stethoscope } from 'lucide-react'
import TareasInput from './TareasInput'
import PiezasInput from './PiezasInput'
import DiagnosticoInfo from './DiagnosticoInfo'
import { useMemo, memo, Dispatch, SetStateAction } from 'react'

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
  onAgregarTareaPersonalizada: (valor?: string) => void
  onEliminarTareaPersonalizada: (index: number) => void
  onCambiarObservaciones?: (valor: string) => void
  onCambiarPruebas?: (valor: string) => void
  onCambiarDiagnostico?: (valor: string) => void
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
  }
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
}: MantenimientoInfoProps) {
  
  const tareasInputProps = useMemo(() => ({
    tipoMantenimiento: tipoMantenimiento as 'preventivo' | 'correctivo' | 'diagnostico',
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
    <div className="bg-gray-800/20 sm:bg-gray-800/40 rounded-xl sm:border border-gray-700/50 overflow-hidden w-full">
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
        {/* Segmented Control de Tipos (Mobile First) */}
        <div className="flex gap-2 p-1.5 bg-gray-900/50 rounded-xl overflow-x-auto snap-x custom-scrollbar">
          {(['preventivo', 'correctivo', 'diagnostico'] as const).map(tipo => {
            const config = TIPO_CONFIG[tipo]
            const active = tipoMantenimiento === tipo
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => onCambiarTipoMantenimiento(tipo)}
                className={`
                  snap-start flex-1 min-w-[110px] sm:min-w-0 flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-300 touch-manipulation
                  ${active 
                    ? `${config.colorBorder} ${config.colorBg} shadow-lg shadow-${tipo === 'preventivo' ? 'green' : tipo === 'correctivo' ? 'orange' : 'blue'}-500/10 scale-[1.02]` 
                    : `border-transparent bg-gray-800/50 hover:bg-gray-700/80 hover:border-gray-700`
                  }
                `}
              >
                <div className={`p-2 rounded-md transition-colors ${active ? config.colorIcon : 'bg-gray-700 text-gray-400'}`}>
                  <config.icono className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className={`text-xs sm:text-sm font-semibold transition-colors ${active ? config.colorText : 'text-gray-400'}`}>
                  {config.nombre}
                </span>
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

          {(tipoMantenimiento === 'preventivo' || tipoMantenimiento === 'correctivo') && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Sección Tareas */}
              <section className="relative">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
                  <h3 className="text-gray-200 text-sm font-semibold uppercase tracking-wider">Actividades Realizadas</h3>
                </div>
                <TareasInput {...tareasInputProps} />
              </section>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-700/50 to-transparent" />

              {/* Sección Repuestos */}
              <section className="relative">
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
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.8);
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
})

MantenimientoInfo.displayName = 'MantenimientoInfo'

export default MantenimientoInfo