// components/forms/InstalacionInfo.tsx
'use client'
import { Monitor, FileText, Settings, CheckCircle2, Plus, X } from 'lucide-react'
import React, { memo, useCallback } from 'react'

interface InstalacionInfoProps {
  recomendaciones: boolean
  recomendacionesDetalle: string
  configuracion: boolean
  configuracionTipos: string[]
  
  onToggleRecomendaciones: (valor: boolean) => void
  onCambiarRecomendacionesDetalle: (valor: string) => void
  onToggleConfiguracion: (valor: boolean) => void
  onToggleConfiguracionTipo: (tipo: string) => void
  onAgregarConfiguracionPersonalizada: (tipo: string) => void
}

const PREDEFINED_RECOMENDACIONES = [
  "Usar estabilizador de voltaje o regulador de voltaje.",
  "Realizar mantenimiento preventivo periodicamente.",
  "Usar cable de red de buena calidad.",
  "Mantener el equipo en ambiente limpio.",
  "Verificar conexión de red periódicamente."
]

const PREDEFINED_CONFIGURACIONES = [
  "Instalación de equipo",
  "Instalación de impresora",
  "Instalación de firmware",
  "Configuración de escáner",
  "Configuración de red",
  "Configuración WiFi",
  "Configuración de drivers",
]

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
  <div className="flex items-start gap-4 mb-5">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
      colorClass || 'bg-gray-700/50 text-gray-400'
    }`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="min-w-0">
      <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{title}</h3>
      <p className="text-sm text-gray-400 mt-1 line-clamp-1">{description}</p>
    </div>
  </div>
))

SectionHeader.displayName = 'SectionHeader'

const InstalacionInfo = memo(function InstalacionInfo({
  recomendaciones,
  recomendacionesDetalle,
  configuracion,
  configuracionTipos,
  onToggleRecomendaciones,
  onCambiarRecomendacionesDetalle,
  onToggleConfiguracion,
  onToggleConfiguracionTipo,
  onAgregarConfiguracionPersonalizada
}: InstalacionInfoProps) {

  const handleAddRecomendacion = useCallback((text: string) => {
    const newValue = recomendacionesDetalle.trim() 
      ? recomendacionesDetalle.endsWith('.') || recomendacionesDetalle.endsWith(',') 
        ? `${recomendacionesDetalle} ${text}`
        : `${recomendacionesDetalle}, ${text}`
      : text;
    onCambiarRecomendacionesDetalle(newValue);
  }, [recomendacionesDetalle, onCambiarRecomendacionesDetalle]);

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-10">
      
      {/* Sección Configuraciones */}
      <section className={`bg-gray-800/40 backdrop-blur-md rounded-3xl p-6 border transition-all duration-300 group ${
        configuracion ? 'border-blue-500/50 shadow-blue-500/10' : 'border-gray-700/50'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <SectionHeader
            icon={Settings}
            title="Configuración"
            description="Documenta los ajustes realizados"
            colorClass={configuracion ? "bg-blue-500 text-white shadow-blue-500/20" : "bg-gray-700 text-gray-400"}
          />
          <button
            type="button"
            onClick={() => onToggleConfiguracion(!configuracion)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              configuracion 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'
            }`}
          >
            {configuracion ? 'X' : 'Activar'}
          </button>
        </div>

        {configuracion && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PREDEFINED_CONFIGURACIONES.map((tipo) => {
                const isSelected = configuracionTipos.includes(tipo)
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => onToggleConfiguracionTipo(tipo)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-gray-700/50 bg-gray-900/40 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${
                      isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-600'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-sm font-medium">{tipo}</span>
                  </button>
                )
              })}
            </div>
            
            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
                Otras Configuraciones
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Agregar configuración personalizada..."
                  className="flex-1 px-4 py-3 bg-gray-900/40 border-2 border-gray-700/50 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = (e.target as HTMLInputElement).value
                      if (val.trim()) {
                        onAgregarConfiguracionPersonalizada(val.trim())
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }
                  }}
                />
              </div>
            </div>

            {configuracionTipos.filter(t => !PREDEFINED_CONFIGURACIONES.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {configuracionTipos.filter(t => !PREDEFINED_CONFIGURACIONES.includes(t)).map((tipo, idx) => (
                  <span key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs font-medium text-blue-300">
                    {tipo}
                    <button type="button" onClick={() => onToggleConfiguracionTipo(tipo)}>
                      <X className="w-3 h-3 hover:text-white" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Sección Recomendaciones */}
      <section className={`bg-gray-800/40 backdrop-blur-md rounded-3xl p-6 border transition-all duration-300 group ${
        recomendaciones ? 'border-green-500/50 shadow-green-500/10' : 'border-gray-700/50'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <SectionHeader
            icon={FileText}
            title="Recomendaciones"
            description="Consejos para el cuidado del equipo"
            colorClass={recomendaciones ? "bg-green-500 text-white shadow-green-500/20" : "bg-gray-700 text-gray-400"}
          />
          <button
            type="button"
            onClick={() => onToggleRecomendaciones(!recomendaciones)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              recomendaciones 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'
            }`}
          >
            {recomendaciones ? 'X' : 'Activar'}
          </button>
        </div>

        {recomendaciones && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest px-1">
                Detalles de Recomendación
              </label>
              <textarea
                value={recomendacionesDetalle}
                onChange={(e) => onCambiarRecomendacionesDetalle(e.target.value)}
                placeholder="Escribe recomendaciones personalizadas..."
                rows={3}
                className="w-full px-4 py-4 bg-gray-900/40 border-2 border-gray-700/50 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all resize-none shadow-inner"
              />
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Sugerencias Rápidas</p>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar snap-x">
                {PREDEFINED_RECOMENDACIONES.map((rec, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddRecomendacion(rec)}
                    className="snap-start shrink-0 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-full text-xs font-medium text-green-300 transition-all active:scale-95 whitespace-nowrap"
                  >
                    + {rec}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

    </div>
  )
})

InstalacionInfo.displayName = 'InstalacionInfo'

export default InstalacionInfo
