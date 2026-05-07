import { FormState } from '@/app/(app)/ordenes/mantenimiento/formulario'

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
  return (
    <div className="space-y-6 text-white animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Información Principal */}
      <div className="bg-gray-800/50 rounded-xl p-4">
        <p className="text-xl text-white font-medium text-center tracking-wide">VERIFICA LA INFORMACIÓN</p>
      </div>
      
      <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-semibold text-blue-300 uppercase tracking-wide">Cliente</h3>
            <p className="text-base sm:text-lg font-medium">{state.clienteSeleccionado?.name}</p>
            {state.clienteSeleccionado?.phone && (
              <p className="text-xs sm:text-sm text-gray-400">{state.clienteSeleccionado.phone}</p>
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-semibold text-green-300 uppercase tracking-wide">Dispositivo</h3>
            <p className="text-base sm:text-lg font-medium">{state.dispositivoSeleccionado?.tipo}</p>
            {state.dispositivoSeleccionado?.numeroSerie && (
              <p className="text-xs sm:text-sm text-gray-400">S/N: {state.dispositivoSeleccionado.numeroSerie}</p>
            )}
          </div>
        </div>
      </div>

      {/* Mantenimiento/Diagnóstico */}
      <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 space-y-3">
        <h3 className="text-xs sm:text-sm font-semibold text-purple-300 uppercase tracking-wide">
          {state.tipoMantenimiento === 'diagnostico' ? 'Diagnóstico' : 'Mantenimiento'}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Tipo:</span>
          <span className={`text-base font-medium capitalize px-3 py-1 rounded-full border ${tipoMantenimientoColor}`}>
            {tipoMantenimientoLabel}
          </span>
        </div>
        
        {state.tipoMantenimiento === 'diagnostico' ? (
          <div className="pt-2 border-t border-gray-700 space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Observaciones iniciales</p>
              <p className="text-sm text-gray-300 line-clamp-3">{state.observacionesIniciales}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Diagnóstico final</p>
              <p className="text-sm text-gray-300 line-clamp-3">{state.diagnosticoFinal}</p>
            </div>
            {state.contadorMaquina !== undefined && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Contador de máquina</p>
                <p className="text-lg font-semibold text-purple-400">{state.contadorMaquina.toLocaleString()} unidades</p>
              </div>
            )}
          </div>
        ) : state.tipoMantenimiento === 'instalacion' ? (
          <div className="pt-2 border-t border-gray-700 space-y-4">
             {state.instalacionConfiguracion && (
               <div>
                 <p className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-widest">Configuraciones:</p>
                 <div className="flex flex-wrap gap-2">
                   {state.instalacionConfiguracionTipos.map((tipo, idx) => (
                     <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs border border-blue-500/30">
                       {tipo}
                     </span>
                   ))}
                   {state.instalacionConfiguracionTipos.length === 0 && (
                     <p className="text-sm text-gray-500 italic">No se especificaron configuraciones</p>
                   )}
                 </div>
               </div>
             )}
             {state.instalacionRecomendaciones && (
               <div>
                 <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-widest">Recomendaciones:</p>
                 <p className="text-sm text-gray-300 leading-relaxed bg-gray-900/30 p-3 rounded-xl border border-gray-700/30">
                   {state.instalacionRecomendacionesDetalle || 'Sin recomendaciones adicionales'}
                 </p>
               </div>
             )}
             {!state.instalacionConfiguracion && !state.instalacionRecomendaciones && (
               <p className="text-sm text-gray-500 italic text-center py-4">No se registró información de instalación</p>
             )}
          </div>
        ) : (
          <>
            <div className="pt-2 border-t border-gray-700">
              <p className="text-gray-400 text-sm mb-2">Tareas realizadas:</p>
              <div className="space-y-2">
                {state.tareasSeleccionadas.map((tarea, idx) => (
                  <div key={`pred-${idx}`} className="flex items-start gap-2 bg-gray-700/30 px-3 py-2 rounded-lg">
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs flex-shrink-0 mt-0.5">Predef</span>
                    <span className="text-sm text-white">{tarea}</span>
                  </div>
                ))}
                {state.tareasPersonalizadas.filter(t => t.trim()).map((tarea, idx) => (
                  <div key={`custom-${idx}`} className="flex items-start gap-2 bg-gray-700/30 px-3 py-2 rounded-lg">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs flex-shrink-0 mt-0.5">Person</span>
                    <span className="text-sm text-white">{tarea}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between">
                <span className="text-xs text-gray-500">Total: </span>
                <span className="text-lg font-bold text-purple-400">
                  {[...state.tareasSeleccionadas, ...state.tareasPersonalizadas.filter(t => t.trim())].length} tareas
                </span>
              </div>
            </div>
            {state.piezasUsadas.filter(p => p?.pieza?.trim()).length > 0 && (
              <div className="pt-2 border-t border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Piezas utilizadas:</p>
                <div className="space-y-2">
                  {state.piezasUsadas
                    .filter(p => p?.pieza?.trim())
                    .map((pieza, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-700/30 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {pieza.tipo === 'predefinida' ? (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs flex-shrink-0">Predef</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs flex-shrink-0">Person</span>
                          )}
                          <span className="text-sm text-white truncate">{pieza.pieza}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-300 ml-2 flex-shrink-0">x{pieza.cantidad}</span>
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
        <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 space-y-3">
          <h3 className="text-xs sm:text-sm font-semibold text-amber-300 uppercase tracking-wide">Contador</h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-amber-400">{state.contador.valor.toLocaleString()}</span>
            <span className="text-base text-gray-400 capitalize">{state.contador.tipo}</span>
          </div>
          {state.contador.notas && (
            <p className="text-sm text-gray-400 pt-2 border-t border-gray-700">{state.contador.notas}</p>
          )}
        </div>
      )}

      {/* Garantía */}
      {(state.garantiaDescripcion || state.mesesGarantia > 0) && (
        <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 space-y-3">
          <h3 className="text-xs sm:text-sm font-semibold text-red-300 uppercase tracking-wide">Garantía</h3>
          {state.garantiaDescripcion && <p className="text-base">{state.garantiaDescripcion}</p>}
          {!state.garantiaDescripcion && state.mesesGarantia > 0 && <p className="text-base text-gray-400 italic">Sin descripción de cobertura</p>}
          
          {state.mesesGarantia > 0 && state.garantiaTiempoDesde && (
            <div className={`flex flex-wrap items-center gap-2 ${state.garantiaDescripcion ? 'pt-2 border-t border-gray-700' : ''} text-sm`}>
              <span className="text-gray-400">Vigencia:</span>
              <span className="bg-red-600/20 px-3 py-1 rounded-full font-medium">
                {new Date(state.garantiaTiempoDesde).toLocaleDateString()} - {state.garantiaTiempoHasta ? new Date(state.garantiaTiempoHasta).toLocaleDateString() : 'Pendiente'}
              </span>
              <span className="text-gray-500">({state.mesesGarantia} meses)</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
