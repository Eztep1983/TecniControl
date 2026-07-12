// components/forms/MantenimientoInfo.tsx
'use client'
import { Settings, Shield, Wrench, Stethoscope, Monitor, CheckCircle2, ArrowUpIcon, ArrowLeft, ShieldCheck } from 'lucide-react'
import TareasInput from './TareasInput'
import PiezasInput from './PiezasInput'
import DiagnosticoInfo from './DiagnosticoInfo'
import InstalacionInfo from './InstalacionInfo'
import GarantiaInfo from './GarantiaInfo'
import { useMemo, memo, Dispatch, SetStateAction, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'

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

  // Props de Garantía (Respuesta)
  garantiaReferenciaId?: string
  garantiaMotivo?: string
  onCambiarGarantiaReferenciaId?: (valor: string) => void
  onCambiarGarantiaMotivo?: (valor: string) => void

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
    colorIcon: 'bg-green-500/20 dark:text-green-400 text-green-700',
    colorText: 'dark:text-green-300 text-green-700',
    gradient: 'from-green-500/20 to-transparent',
  },
  correctivo: {
    icono: Wrench,
    nombre: 'Correctivo',
    colorBorder: 'border-orange-500/40',
    colorBg: 'bg-orange-500/10',
    colorIcon: 'bg-orange-500/20 dark:text-orange-400 text-orange-700',
    colorText: 'dark:text-orange-300 text-orange-700',
    gradient: 'from-orange-500/20 to-transparent',
  },
  diagnostico: {
    icono: Stethoscope,
    nombre: 'Diagnóstico',
    colorBorder: 'border-blue-500/40',
    colorBg: 'bg-blue-500/10',
    colorIcon: 'bg-blue-500/20 dark:text-blue-400 text-blue-700',
    colorText: 'dark:text-blue-300 text-blue-700',
    gradient: 'from-blue-500/20 to-transparent',
  },
  instalacion: {
    icono: Monitor,
    nombre: 'Instalación',
    colorBorder: 'border-purple-500/40',
    colorBg: 'bg-purple-500/10',
    colorIcon: 'bg-purple-500/20 dark:text-purple-400 text-purple-700',
    colorText: 'dark:text-purple-300 text-purple-700',
    gradient: 'from-purple-500/20 to-transparent',
  },
  garantia: {
    icono: ShieldCheck,
    nombre: 'Garantía',
    colorBorder: 'border-amber-500/40',
    colorBg: 'bg-amber-500/10',
    colorIcon: 'bg-amber-500/20 dark:text-amber-400 text-amber-700',
    colorText: 'dark:text-amber-300 text-amber-700',
    gradient: 'from-amber-500/20 to-transparent',
  },
} as const

// Variants optimizadas para animaciones
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  },
  exit: { 
    opacity: 0,
    transition: { staggerChildren: 0.03, staggerDirection: -1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 25,
      mass: 0.5
    }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    transition: { duration: 0.2 }
  }
}

const contentVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30,
      mass: 0.6
    }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { duration: 0.2 }
  }
}

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

  // Props de Garantía
  garantiaReferenciaId = '',
  garantiaMotivo = '',
  onCambiarGarantiaReferenciaId = () => {},
  onCambiarGarantiaMotivo = () => {},

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
  
  const [isChanging, setIsChanging] = useState(false)
  const [hoveredTipo, setHoveredTipo] = useState<string | null>(null)

  const handleTipoChange = useCallback(async (tipo: 'preventivo' | 'correctivo' | 'diagnostico' | 'instalacion' | 'garantia' | '') => {
    setIsChanging(true)
    // Pequeña pausa para la animación de salida
    await new Promise(resolve => setTimeout(resolve, 150))
    onCambiarTipoMantenimiento(tipo)
    setTimeout(() => setIsChanging(false), 100)
  }, [onCambiarTipoMantenimiento])

  const tareasInputProps = useMemo(() => ({
    tipoMantenimiento: tipoMantenimiento as 'preventivo' | 'correctivo' | 'diagnostico' | 'instalacion' | 'garantia' | '',
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

  const garantiaProps = useMemo(() => ({
    referenciaId: garantiaReferenciaId,
    motivo: garantiaMotivo,
    onCambiarReferencia: onCambiarGarantiaReferenciaId,
    onCambiarMotivo: onCambiarGarantiaMotivo
  }), [
    garantiaReferenciaId,
    garantiaMotivo,
    onCambiarGarantiaReferenciaId,
    onCambiarGarantiaMotivo
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

  const renderContent = () => {
    if (tipoMantenimiento === 'diagnostico') {
      return <DiagnosticoInfo {...diagnosticoProps} />
    }

    if (tipoMantenimiento === 'instalacion') {
      return <InstalacionInfo {...instalacionProps} />
    }

    if (tipoMantenimiento === 'garantia') {
      return (
        <motion.div 
          className="space-y-8"
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <GarantiaInfo {...garantiaProps} />
          
          <motion.div 
            className="h-px w-full bg-gradient-to-r from-transparent via-gray-700/50 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          />

          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-1.5 h-5 bg-amber-500 rounded-full" />
              <h3 className="dark:text-gray-200 text-gray-800 text-sm font-semibold uppercase tracking-wider">Acciones por Garantía</h3>
            </div>
            <TareasInput {...tareasInputProps} />
          </motion.section>

          <motion.section variants={itemVariants}>
             <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
              <h3 className="dark:text-gray-200 text-gray-800 text-sm font-semibold uppercase tracking-wider">Repuestos Utilizados</h3>
            </div>
            <PiezasInput {...piezasInputProps} />
          </motion.section>
        </motion.div>
      )
    }

    if (tipoMantenimiento === 'preventivo' || tipoMantenimiento === 'correctivo') {
      return (
        <motion.div 
          className="space-y-8"
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Sección Tareas */}
          <motion.section 
            className="relative z-20"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <motion.div 
                className="w-1.5 h-5 bg-blue-500 rounded-full"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              />
              <h3 className="dark:text-gray-200 text-gray-800 text-sm font-semibold uppercase tracking-wider">Actividades Realizadas</h3>
            </div>
            <TareasInput {...tareasInputProps} />
          </motion.section>

          {tipoMantenimiento !== 'preventivo' && (
            <>
              <motion.div 
                className="h-px w-full bg-gradient-to-r from-transparent via-gray-700/50 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              />

              {/* Sección Repuestos */}
              <motion.section 
                className="relative z-10"
                variants={itemVariants}
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <motion.div 
                    className="w-1.5 h-5 bg-purple-500 rounded-full"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  />
                  <h3 className="dark:text-gray-200 text-gray-800 text-sm font-semibold uppercase tracking-wider">Repuestos Utilizados</h3>
                </div>
                <PiezasInput {...piezasInputProps} />
              </motion.section>
            </>
          )}
        </motion.div>
      )
    }

    return null
  }

  return (
    <div className="dark:bg-gray-800/20 bg-gray-200 sm:dark:bg-gray-800/40 bg-gray-200 rounded-xl sm:border dark:border-gray-700/50 border-gray-300 w-full">
      {/* Header Opcional en Desktop */}
      <motion.div 
        className="hidden sm:flex p-5 border-b dark:border-gray-700/50 border-gray-300 items-center gap-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="w-10 h-10 rounded-lg dark:bg-gray-700/50 bg-gray-300 flex items-center justify-center flex-shrink-0"
          whileHover={{ rotate: 90, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Settings className="w-5 h-5 dark:text-gray-400 text-gray-600" />
        </motion.div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold dark:text-white text-gray-900 truncate">Información del Trabajo</h3>
          <p className="text-sm dark:text-gray-400 text-gray-600 truncate">Selecciona el tipo y documenta el trabajo</p>
        </div>
      </motion.div>

      <div className="p-4 sm:p-5 flex flex-col gap-6">
        {/* Selección de Tipos */}
        <AnimatePresence mode="wait">
          {!tipoMantenimiento ? (
            <motion.div
              key="tipo-selection"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {(['preventivo', 'correctivo', 'diagnostico', 'instalacion', 'garantia'] as const).map(tipo => {
                const config = TIPO_CONFIG[tipo]
                const isHovered = hoveredTipo === tipo
                
                return (
                  <motion.button
                    key={tipo}
                    type="button"
                    variants={itemVariants}
                    onClick={() => handleTipoChange(tipo)}
                    onHoverStart={() => setHoveredTipo(tipo)}
                    onHoverEnd={() => setHoveredTipo(null)}
                    whileTap={{ scale: 0.97 }}
                    className="relative flex items-center gap-4 p-4 rounded-2xl border-2 dark:border-gray-700/50 border-gray-300 dark:bg-gray-900/40 bg-gray-50 hover:dark:bg-gray-800/80 hover:bg-gray-200/80 hover:dark:border-gray-600 hover:border-gray-300 transition-all duration-300 touch-manipulation group overflow-hidden"
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `linear-gradient(135deg, ${config.colorBg.replace('bg-', '').replace('/10', '')}20, transparent)` }}
                      initial={false}
                      animate={{ opacity: isHovered ? 1 : 0 }}
                    />
                    
                    <motion.div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center dark:bg-gray-800 bg-gray-200 text-gray-500 group-hover:bg-gray-700 transition-all duration-300 relative z-10"
                      animate={isHovered ? { scale: 1.05, rotate: 5 } : { scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <config.icono className="w-6 h-6" />
                    </motion.div>
                    
                    <div className="flex-1 text-left relative z-10">
                      <span className="block text-sm font-bold uppercase tracking-wider dark:text-gray-400 text-gray-600 group-hover:dark:text-gray-200 group-hover:text-gray-800">
                        {config.nombre}
                      </span>
                      <p className="text-[15px] mt-0.5 text-gray-600 group-hover:text-gray-500">
                        {tipo === 'preventivo' && 'Mantenimiento de rutina'}
                        {tipo === 'correctivo' && 'Reparación de fallas'}
                        {tipo === 'diagnostico' && 'Evaluación técnica'}
                        {tipo === 'instalacion' && 'Entrega de equipos y configuraciones'}
                        {tipo === 'garantia' && 'Respuesta por fallo de servicio previo'}
                      </p>
                    </div>
                    
                    <motion.div
                      className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r"
                      style={{ background: `linear-gradient(90deg, ${config.colorText.split(' ')[0]}, transparent)` }}
                      initial={{ width: "0%" }}
                      animate={{ width: isHovered ? "100%" : "0%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                )
              })}
            </motion.div>
          ) : (
            <motion.div
              key="tipo-selected"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative"
            >
              <motion.div 
                className={`
                  relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all shadow-lg overflow-hidden
                  ${TIPO_CONFIG[tipoMantenimiento].colorBorder} ${TIPO_CONFIG[tipoMantenimiento].colorBg}
                `}
                initial={{ backgroundPosition: "0% 0%" }}
                animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                style={{
                  background: `linear-gradient(135deg, ${TIPO_CONFIG[tipoMantenimiento].colorBg.replace('bg-', '').replace('/10', '')}15, transparent)`,
                  backgroundSize: "200% 200%"
                }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `linear-gradient(90deg, transparent, ${TIPO_CONFIG[tipoMantenimiento].colorText.split(' ')[0]}10, transparent)` }}
                  animate={{ 
                    x: ["-100%", "100%"],
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />
                
                <div className="flex items-center gap-4 relative z-10">
                  <motion.div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${TIPO_CONFIG[tipoMantenimiento].colorIcon}`}
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    {(() => {
                      const Icono = TIPO_CONFIG[tipoMantenimiento].icono;
                      return <Icono className="w-6 h-6" />
                    })()}
                  </motion.div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`block text-sm font-bold uppercase tracking-wider ${TIPO_CONFIG[tipoMantenimiento].colorText}`}>
                        {TIPO_CONFIG[tipoMantenimiento].nombre}
                      </span>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${TIPO_CONFIG[tipoMantenimiento].colorText.split(' ')[0]}`} />
                      </motion.div>
                    </div>
                    <p className="text-[11px] mt-0.5 dark:text-white text-gray-900/60">
                       {TIPO_CONFIG[tipoMantenimiento].nombre.toLowerCase()} de equipo.
                    </p>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={() => handleTipoChange('')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2.5 dark:bg-gray-900/60 bg-gray-50 hover:dark:bg-gray-800 hover:bg-gray-200 dark:text-gray-300 text-gray-700 hover:dark:text-white hover:text-gray-900 text-xs font-bold rounded-xl border dark:border-gray-700/50 border-gray-300 transition-all active:scale-95 touch-manipulation shadow-sm relative z-10"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">CAMBIAR</span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flujo Vertical del Mantenimiento */}
        <div className="transition-all duration-300">
          <AnimatePresence mode="wait">
            {!tipoMantenimiento ? (
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="py-6 text-center text-gray-500 border-2 border-dashed dark:border-gray-700/30 border-gray-300 rounded-xl"
              >
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <ArrowUpIcon className="w-12 h-12 mx-auto mb-3 opacity-30 rounded-xl" />
                </motion.div>
                Selecciona un tipo de trabajo arriba para comenzar
              </motion.div>
            ) : (
              <motion.div
                key="content"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {renderContent()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
    </div>
  )
})

MantenimientoInfo.displayName = 'MantenimientoInfo'

export default MantenimientoInfo