// components/forms/GarantiaInput.tsx
'use client'
import { Calendar, Clock, Shield, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useState, useEffect } from 'react'

interface GarantiaInputProps {
  garantiaTiempoDesde: string
  garantiaTiempoHasta: string
  mesesGarantia: number
  garantiaDescripcion: string
  onCambiarFechaDesde: (fecha: string) => void
  onCambiarMeses: (meses: number) => void
  onCambiarDescripcion: (descripcion: string) => void
}

export default function GarantiaInput({
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

  // Validar fecha
  useEffect(() => {
    if (garantiaTiempoDesde) {
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
    }
  }, [garantiaTiempoDesde])

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

  // Opciones de garantía predefinidas
  const opcionesGarantia = [
    { valor: 1, etiqueta: '1 mes', popular: false },
    { valor: 3, etiqueta: '3 meses', popular: true },
    { valor: 6, etiqueta: '6 meses', popular: true },
    { valor: 12, etiqueta: '12 meses (1 año)', popular: false },
    { valor: 24, etiqueta: '24 meses (2 años)', popular: false },
  ]

  return (
    <div className="space-y-6">
      {/* Header con icono */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Garantía del Servicio</h3>
            <p className="text-xs text-gray-500">Define la cobertura y duración de la garantía</p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => setMostrarInfo(!mostrarInfo)}
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
        >
          <Info className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Mensaje informativo */}
      {mostrarInfo && (
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

      <div className="grid grid-cols-1 gap-6">
        {/* Fecha de inicio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-400" />
              Fecha de inicio
              <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              value={garantiaTiempoDesde}
              onChange={(e) => onCambiarFechaDesde(e.target.value)}
              max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-gray-800 transition-all duration-200"
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
        
          {/* Fecha de vencimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-400" />
              Vencimiento
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={formatearFechaVencimiento()}
                className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl text-gray-400 cursor-not-allowed"
              />
              {diasRestantes !== null && diasRestantes > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="px-2 py-1 bg-purple-500/20 rounded-full">
                    <span className="text-xs text-purple-300 font-medium">
                      {diasRestantes} días
                    </span>
                  </div>
                </div>
              )}
            </div>
            {garantiaTiempoHasta && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Calculado automáticamente
              </p>
            )}
          </div>
        </div>
        
        {/* Duración */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-400" />
            Duración de la garantía
            <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {opcionesGarantia.map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => onCambiarMeses(opcion.valor)}
                className={`
                  relative p-3 rounded-xl border-2 transition-all duration-200
                  ${mesesGarantia === opcion.valor
                    ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600'
                  }
                  active:scale-95
                `}
              >
                {opcion.popular && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-xs">⭐</span>
                  </div>
                )}
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-1 ${
                    mesesGarantia === opcion.valor ? 'text-purple-300' : 'text-gray-300'
                  }`}>
                    {opcion.valor}
                  </div>
                  <div className={`text-xs ${
                    mesesGarantia === opcion.valor ? 'text-purple-400' : 'text-gray-500'
                  }`}>
                    {opcion.valor === 1 ? 'mes' : 'meses'}
                  </div>
                </div>
                {mesesGarantia === opcion.valor && (
                  <div className="absolute inset-0 rounded-xl border-2 border-purple-400 animate-in fade-in zoom-in duration-200" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Garantía seleccionada: <span className="text-purple-400 font-medium">{mesesGarantia} {mesesGarantia === 1 ? 'mes' : 'meses'}</span>
          </p>
        </div>
      </div>
      
      {/* Descripción de cobertura */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-purple-400" />
          ¿Qué cubre la garantía?
          <span className="text-xs text-gray-500 font-normal ml-1">(Opcional)</span>
        </label>
        <div className="relative">
          <textarea
            rows={4}
            value={garantiaDescripcion}
            onChange={(e) => onCambiarDescripcion(e.target.value)}
            maxLength={500}
            className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-gray-800 transition-all duration-200 resize-none"
            placeholder="Ej: Cubre defectos en las piezas reemplazadas y mano de obra. No cubre daños por caídas, líquidos o uso inadecuado..."
          />
          <div className="absolute bottom-3 right-3">
            <span className="text-xs text-gray-500">
              {garantiaDescripcion.length}/500
            </span>
          </div>
        </div>
        
        {/* Sugerencias rápidas */}
        {!garantiaDescripcion && (
          <div className="mt-3 flex flex-wrap gap-2">
            <p className="text-xs text-gray-500 w-full mb-1">Sugerencias:</p>
            {[
              'Piezas reemplazadas y mano de obra',
              'Fallas por defecto de fabricación',
              'Problemas relacionados con la reparación'
            ].map((sugerencia, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  const textoActual = garantiaDescripcion
                  const nuevoTexto = textoActual 
                    ? `${textoActual}, ${sugerencia.toLowerCase()}`
                    : `Cubre: ${sugerencia}`
                  onCambiarDescripcion(nuevoTexto)
                }}
                className="px-3 py-1 bg-gray-700/50 hover:bg-gray-700 text-xs text-gray-300 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                + {sugerencia}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resumen visual */}
      {garantiaTiempoDesde && mesesGarantia && (
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-200 mb-1">Resumen de Garantía</p>
              <div className="text-xs text-purple-300/80 space-y-1">
                <p>• Inicia: {new Date(garantiaTiempoDesde).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
                <p>• Duración: {mesesGarantia} {mesesGarantia === 1 ? 'mes' : 'meses'}</p>
                {garantiaTiempoHasta && (
                  <p>• Vence: {new Date(garantiaTiempoHasta).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
                )}
                {garantiaDescripcion && (
                  <p className="mt-2 pt-2 border-t border-purple-500/20">
                    • Cobertura: {garantiaDescripcion.substring(0, 100)}{garantiaDescripcion.length > 100 ? '...' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}