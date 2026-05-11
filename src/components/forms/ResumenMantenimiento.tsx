import { FormState } from '@/app/(app)/ordenes/mantenimiento/formulario'
import { CheckCircle, User, Smartphone, Wrench, Settings, Shield, PenTool, Package, Clock, Printer } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ResumenMantenimientoProps {
  state: FormState
  tipoMantenimientoLabel: string
  tipoMantenimientoColor: string
}

export default function ResumenMantenimiento({ 
  state, 
  tipoMantenimientoLabel, 
  tipoMantenimientoColor 
}: ResumenMantenimientoProps) {
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detectar plataforma para ajustes específicos
    const platform = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(platform)
  }, [])

  // Animación al montar para mejor experiencia
  useEffect(() => {
    const element = document.querySelector('.resumen-container')
    if (element) {
      element.classList.add('animate-in')
      setTimeout(() => {
        element.classList.remove('animate-in')
      }, 500)
    }
  }, [])

  return (
    <div className="resumen-container space-y-4 md:space-y-6 pb-8 max-w-2xl mx-auto">
      {/* Header con feedback táctil para móvil */}
      <div className="px-4 pt-2">
        <div 
          className="bg-transparent rounded-2xl p-5 shadow-lg active:scale-[0.98] transition-transform duration-150"
          role="status"
          aria-label="Resumen de orden"
        >
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-6 h-6 text-white" />
            <h1 className="text-xl md:text-2xl font-bold text-white text-center tracking-tight">
              Verifica la Información
            </h1>
          </div>
          <p className="text-blue-100 text-center text-sm mt-2">
            Revisa los detalles antes de continuar
          </p>
        </div>
      </div>
      
      {/* Tarjetas con haptic feedback en móvil */}
      <div className="space-y-4 px-4">
        {/* Cliente y Dispositivo - Grid responsive */}
        <div className="bg-white/10 rounded-2xl p-5 shadow-lg border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-300">
                <User className="w-4 h-4" />
                <h3 className="text-lg font-semibold uppercase tracking-wide">Cliente</h3>
              </div>
              <p className="text-base md:text-lg font-semibold text-white">
                {state.clienteSeleccionado?.name || 'No especificado'}
              </p>
              {state.clienteSeleccionado?.phone && (
                <p className="text-lg text-gray-300 flex items-center gap-1">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-xs"></span> {state.clienteSeleccionado.phone}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-300">
                <Printer className="w-4 h-4" />
                <h3 className="text-lg font-semibold uppercase tracking-wide">Dispositivo</h3>
              </div>
              <p className="text-base md:text-lg font-semibold text-white">
                {state.dispositivoSeleccionado?.tipo || 'No especificado'}
              </p>
              {state.dispositivoSeleccionado?.numeroSerie && (
                <p className="text-lg text-gray-300 break-all">
                  S/N: {state.dispositivoSeleccionado.numeroSerie}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Mantenimiento/Diagnóstico - Sección principal */}
        <div className="bg-white/10 rounded-2xl p-5 shadow-lg border border-white/20">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-purple-300" />
            <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wide">
              {state.tipoMantenimiento === 'diagnostico' ? 'Diagnóstico Técnico' : 
               state.tipoMantenimiento === 'instalacion' ? 'Instalación y Configuración' : 
               'Mantenimiento Realizado'}
            </h3>
          </div>
          
          <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-xl">
            <span className="text-gray-300 text-lg">Tipo de servicio:</span>
            <span className={`text-base font-medium capitalize px-4 py-1.5 rounded-full border ${tipoMantenimientoColor} `}>
              {tipoMantenimientoLabel}
            </span>
          </div>
          
          {state.tipoMantenimiento === 'diagnostico' ? (
            <div className="space-y-4">
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-xs text-gray-400 mb-2 font-medium">Observaciones iniciales</p>
                <p className="text-sm text-gray-200 leading-relaxed">{state.observacionesIniciales || 'Sin observaciones'}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-xs text-gray-400 mb-2 font-medium">Diagnóstico final</p>
                <p className="text-sm text-gray-200 leading-relaxed">{state.diagnosticoFinal || 'Sin diagnóstico'}</p>
              </div>
              {state.contadorMaquina !== undefined && (
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <p className="text-xs text-gray-400 mb-1 font-medium">Contador de máquina</p>
                  <p className="text-2xl font-bold text-purple-300">{state.contadorMaquina.toLocaleString()} <span className="text-sm">unidades</span></p>
                </div>
              )}
            </div>
          ) : state.tipoMantenimiento === 'instalacion' ? (
            <div className="space-y-4">
              {state.instalacionConfiguracion && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-300" />
                    <p className="text-lg text-gray-400 font-bold uppercase tracking-wider">Configuraciones</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {state.instalacionConfiguracionTipos.map((tipo, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-500/30">
                        {tipo}
                      </span>
                    ))}
                    {state.instalacionConfiguracionTipos.length === 0 && (
                      <p className="text-lg text-gray-400 italic">No se especificaron configuraciones</p>
                    )}
                  </div>
                </div>
              )}
              {state.instalacionRecomendaciones && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Recomendaciones</p>
                  <div className="bg-white/5 p-4 rounded-xl">
                    <p className="text-sm text-gray-200 leading-relaxed">
                      {state.instalacionRecomendacionesDetalle || 'Sin recomendaciones adicionales'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tareas realizadas */}
              <div className="space-y-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Tareas realizadas</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {state.tareasSeleccionadas.map((tarea, idx) => (
                    <div key={`pred-${idx}`} className="flex items-start gap-3 bg-white/5 p-3 rounded-xl active:bg-white/10 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-blue-300 font-bold">✓</span>
                      </div>
                      <span className="text-sm text-white flex-1">{tarea}</span>
                    </div>
                  ))}
                  {state.tareasPersonalizadas.filter(t => t.trim()).map((tarea, idx) => (
                    <div key={`custom-${idx}`} className="flex items-start gap-3 bg-white/5 p-3 rounded-xl active:bg-white/10 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-purple-300 font-bold">✎</span>
                      </div>
                      <span className="text-sm text-white flex-1">{tarea}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/10">
                  <span className="text-xs text-gray-400">Total de tareas</span>
                  <span className="text-xl font-bold text-purple-300">
                    {[...state.tareasSeleccionadas, ...state.tareasPersonalizadas.filter(t => t.trim())].length}
                  </span>
                </div>
              </div>

              {/* Piezas utilizadas */}
              {state.piezasUsadas.filter(p => p?.pieza?.trim()).length > 0 && (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-green-300" />
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Piezas utilizadas</p>
                  </div>
                  <div className="space-y-2">
                    {state.piezasUsadas
                      .filter(p => p?.pieza?.trim())
                      .map((pieza, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-sm text-white truncate">{pieza.pieza}</span>
                          </div>
                          <span className="text-sm font-semibold text-purple-300 ml-2 flex-shrink-0">x{pieza.cantidad}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Contador */}
        {state.mostrarContador && state.contador && (
          <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-2xl p-5 shadow-lg border border-amber-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-300" />
              <h3 className="text-sm font-semibold text-amber-300 uppercase tracking-wide">Medición</h3>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-amber-300">{state.contador.valor.toLocaleString()}</span>
              <span className="text-base text-gray-300 capitalize">{state.contador.tipo}</span>
            </div>
            {state.contador.notas && (
              <p className="text-sm text-gray-300 pt-3 border-t border-amber-500/20">{state.contador.notas}</p>
            )}
          </div>
        )}

        {/* Garantía */}
        {(state.garantiaDescripcion || state.mesesGarantia > 0) && (
          <div className="bg-white/10 rounded-2xl p-5 shadow-lg border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-red-300" />
              <h3 className="text-sm font-semibold text-red-300 uppercase tracking-wide">Garantía</h3>
            </div>
            {state.garantiaDescripcion && (
              <p className="text-base text-white mb-3">{state.garantiaDescripcion}</p>
            )}
            {state.mesesGarantia > 0 && state.garantiaTiempoDesde && (
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-gray-300">Vigencia:</span>
                  <span className="bg-red-600/20 px-3 py-1.5 rounded-full font-medium text-red-200">
                    {new Date(state.garantiaTiempoDesde).toLocaleDateString()} - {state.garantiaTiempoHasta ? new Date(state.garantiaTiempoHasta).toLocaleDateString() : 'Pendiente'}
                  </span>
                </div>
                <p className="text-sm text-gray-400">Duración: {state.mesesGarantia} {state.mesesGarantia === 1 ? 'mes' : 'meses'}</p>
              </div>
            )}
          </div>
        )}

        {/* Firma */}
        {state.firmaCliente && (
          <div className="bg-white/10 rounded-2xl p-5 shadow-lg border border-white/20">
            <div className="flex items-center gap-2 mb-4">
              <PenTool className="w-5 h-5 text-blue-300" />
              <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Firma del Cliente</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-3 w-full">
                <img 
                  src={state.firmaCliente} 
                  alt="Firma del cliente" 
                  className="w-full h-auto max-h-32 object-contain mx-auto"
                  loading="lazy"
                />
              </div>
              {state.nombreFirmante && (
                <div className="text-center">
                  <p className="text-sm text-gray-400">Firmado por:</p>
                  <p className="text-base font-semibold text-white">{state.nombreFirmante}</p>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-green-400 text-sm bg-green-400/10 px-4 py-2 rounded-full">
                <CheckCircle className="w-4 h-4" />
                <span>Validado por el cliente</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estilos adicionales para mejor experiencia móvil */}
      <style jsx>{`
        .animate-in {
          animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Mejoras para scroll suave en iOS */
        .resumen-container {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        
        /* Mejora de tap highlight para iOS */
        [role="button"], 
        .active\\:scale-\\[0\\.98\\]:active {
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Mejoras de accesibilidad */
        @media (prefers-reduced-motion: reduce) {
          .animate-in {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}