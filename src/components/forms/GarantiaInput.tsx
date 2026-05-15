// components/forms/GarantiaInput.tsx
'use client'
import { Calendar, Clock, Shield, ShieldOff, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useState, useEffect } from 'react'

interface GarantiaInputProps {
  garantiaHabilitada: boolean
  onToggleGarantia: () => void
  garantiaTiempoDesde: string
  garantiaTiempoHasta: string
  mesesGarantia: number
  garantiaDescripcion: string
  onCambiarFechaDesde: (fecha: string) => void
  onCambiarMeses: (meses: number) => void
  onCambiarDescripcion: (descripcion: string) => void
}

export default function GarantiaInput({
  garantiaHabilitada,
  onToggleGarantia,
  garantiaTiempoDesde,
  garantiaTiempoHasta,
  mesesGarantia,
  garantiaDescripcion,
  onCambiarFechaDesde,
  onCambiarMeses,
  onCambiarDescripcion
}: GarantiaInputProps) {
  const [errorFecha, setErrorFecha] = useState<string>('')
  const [mostrarInfo, setMostrarInfo] = useState(false)
  
  // Handle del switch
  const handleToggleGarantia = () => {
    onToggleGarantia()
  }

  // Validar fecha
  useEffect(() => {
    if (garantiaTiempoDesde && garantiaHabilitada) {
      const fechaSeleccionada = new Date(garantiaTiempoDesde)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      const hace30Dias = new Date()
      hace30Dias.setDate(hace30Dias.getDate() - 30)
      hace30Dias.setHours(0, 0, 0, 0)
      
      const dentroUnaSemanana = new Date()
      dentroUnaSemanana.setDate(dentroUnaSemanana.getDate() + 7)
      dentroUnaSemanana.setHours(0, 0, 0, 0)

      if (fechaSeleccionada < hace30Dias) {
        setErrorFecha('⚠️ La fecha es mayor a 30 días en el pasado')
      } else if (fechaSeleccionada > dentroUnaSemanana) {
        setErrorFecha('⚠️ La fecha es mayor a una semana en el futuro')
      } else {
        setErrorFecha('')
      }
    } else {
      setErrorFecha('')
    }
  }, [garantiaTiempoDesde, garantiaHabilitada])

  // Formatear fecha de vencimiento
  const formatearFechaVencimiento = () => {
    if (!garantiaTiempoHasta) return 'Se calculará automáticamente'
    
    const fecha = new Date(garantiaTiempoHasta)
    const opciones: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    return fecha.toLocaleDateString('es-ES', opciones)
  }

  // Calcular días restantes
  const calcularDiasRestantes = () => {
    if (!garantiaTiempoHasta) return null
    
    const hoy = new Date()
    const vencimiento = new Date(garantiaTiempoHasta)
    const diferencia = vencimiento.getTime() - hoy.getTime()
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24))
    
    return dias
  }

  const diasRestantes = calcularDiasRestantes()

  // Opciones de garantía predefinidas (Mobile first => tarjetas más amigables)
  const opcionesGarantia = [
    { valor: 1, etiqueta: '1 mes', popular: false },
    { valor: 3, etiqueta: '3 meses', popular: true },
    { valor: 6, etiqueta: '6 meses', popular: true },
    { valor: 12, etiqueta: '12 meses', popular: false },
    { valor: 24, etiqueta: '24 meses', popular: false },
  ]

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Banner Principal de Control - Toggle Switch */}
      <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg hover:border-gray-600/50 transition-colors">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${garantiaHabilitada ? 'bg-blue-500/20 shadow-inner' : 'bg-gray-700/50 shadow-none'}`}>
            {garantiaHabilitada ? (
              <Shield className="w-6 h-6 text-blue-400" />
            ) : (
              <ShieldOff className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-100 flex items-center gap-2">
              Garantía del servicio
              {garantiaHabilitada && (
                 <button type="button" onClick={() => setMostrarInfo(!mostrarInfo)} className="p-1 hover:bg-gray-700 rounded-full transition-colors">
                   <Info className="w-4 h-4 text-gray-400" />
                 </button>
              )}
            </h3>
            <p className={`text-xs sm:text-sm transition-colors duration-300 ${garantiaHabilitada ? 'text-blue-300/80' : 'text-gray-500'}`}>
              {garantiaHabilitada ? 'Incluida en el servicio' : 'No se aplicará garantía'}
            </p>
          </div>
        </div>
        
        {/* iOS-like Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={garantiaHabilitada}
          onClick={handleToggleGarantia}
          className={`
            relative inline-flex h-8 w-14 sm:h-9 sm:w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 
            focus-visible:ring-blue-500 focus-visible:ring-opacity-75 shadow-inner
            ${garantiaHabilitada ? 'bg-blue-500' : 'bg-gray-600'}
          `}
        >
          <span className="sr-only">Activar garantía</span>
          <span
            aria-hidden="false"
            className={`
              pointer-events-none inline-block h-7 w-7 sm:h-8 sm:w-8 transform rounded-full bg-white shadow-md 
              transition duration-300 ease-in-out
              ${garantiaHabilitada ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0'}
            `}
          />
        </button>
      </div>

      {/* Info extra */}
      {mostrarInfo && garantiaHabilitada && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200/90">
              <p className="font-medium mb-1">Sobre la garantía</p>
              <p className="text-blue-300/70">
                La garantía cubre defectos en el trabajo realizado. No cubre daños por mal uso, 
                accidentes o desgaste normal. El periodo inicia desde la fecha de entrega.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Condicional: Formulario completo vs Banner de vacío */}
      {garantiaHabilitada ? (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    
          {/* Seccion: Duración (Botones Responsive) */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              Duración de la garantía
              <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {opcionesGarantia.map((opcion) => (
                <button
                  key={opcion.valor}
                  type="button"
                  onClick={() => onCambiarMeses(opcion.valor)}
                  className={`
                    relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 outline-none
                    ${mesesGarantia === opcion.valor
                      ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                      : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600'
                    }
                    active:scale-95 touch-manipulation
                  `}
                >

                  <div className="flex flex-col items-center justify-center">
                    <span className={`text-xl sm:text-2xl font-bold mb-0.5 ${
                      mesesGarantia === opcion.valor ? 'text-blue-300' : 'text-gray-300'
                    }`}>
                      {opcion.valor}
                    </span>
                    <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${
                      mesesGarantia === opcion.valor ? 'text-blue-400' : 'text-gray-500'
                    }`}>
                      {opcion.etiqueta.replace(/[0-9]+ /g, '')} {/* Quita los números de la etiqueta */}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {/* Mensaje sutil debajo */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-1">
               <Shield className="w-3.5 h-3.5 text-gray-600" />
               Garantía seleccionada: <span className="text-gray-300 font-medium">{mesesGarantia} {mesesGarantia === 1 ? 'mes' : 'meses'}</span>
            </div>
          </div>
          
          {/* Fila: Fecha de inicio y vencimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 hidden">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                Fecha de inicio
                <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                required
                value={garantiaTiempoDesde}
                onChange={(e) => onCambiarFechaDesde(e.target.value)}
                max={new Date(Date() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              />
              {errorFecha && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-yellow-400 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errorFecha}</span>
                </div>
              )}
              {garantiaTiempoDesde && !errorFecha && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-green-400 animate-in fade-in slide-in-from-top-1 duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Fecha válida</span>
                </div>
              )}
            </div>
          
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                Vencimiento
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={formatearFechaVencimiento()}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-gray-400 cursor-not-allowed text-sm sm:text-base outline-none"
                />
                {diasRestantes !== null && diasRestantes > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-500/20 px-2.5 py-1 rounded-lg">
                    <span className="text-xs text-blue-300 font-medium tracking-wide">
                      {diasRestantes} DÍAS
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Seccion: Descripción de cobertura */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-400" />
              ¿Qué cubre la garantía?
              <span className="text-xs text-gray-500 font-normal ml-1 bg-gray-800 px-2 py-0.5 rounded-full">(Opcional)</span>
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={garantiaDescripcion}
                onChange={(e) => onCambiarDescripcion(e.target.value)}
                maxLength={500}
                className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 resize-none text-sm placeholder-gray-600 outline-none"
                placeholder="Detalla qué incluye la cobertura..."
              />
              <div className="absolute bottom-3 right-3 bg-gray-900/80 px-2 py-0.5 rounded-md">
                <span className="text-xs text-gray-500 font-mono">
                  {garantiaDescripcion.length}/500
                </span>
              </div>
            </div>
            
            {/* Sugerencias Rápidas - Optimizadas para touch */}
            {!garantiaDescripcion && (
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <span className="text-xs text-gray-500 ml-1 uppercase tracking-wider font-semibold">Sugerencias rápidas:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Piezas reemplazadas y mano de obra',
                    'Fallas por defecto de fábrica',
                    'Solo mano de obra'
                  ].map((sugerencia, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => onCambiarDescripcion(`Cubre: ${sugerencia}`)}
                      className="px-3.5 py-1.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-500 text-[13px] text-gray-300 rounded-full transition-all duration-200 active:scale-95 touch-manipulation"
                    >
                      + {sugerencia}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Estado OFF de Garantía */
        <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-blue-400">Garantía opcional</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Puede omitir el registro de garantía desactivando el toggle superior si el servicio no lo requiere.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}