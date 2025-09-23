// components/forms/PiezasInput.tsx
'use client'
import { Plus, Trash2, Package, Wrench } from 'lucide-react'
import { useCallback, memo } from 'react'

interface Pieza {
  pieza: string
  cantidad: number
}

interface PiezasInputProps {
  piezasUsadas: Pieza[]
  onActualizarPieza: (index: number, campo: string, valor: any) => void
  onAgregarPieza: () => void
  onEliminarPieza: (index: number) => void
}

const PiezasInput = memo(function PiezasInput({
  piezasUsadas,
  onActualizarPieza,
  onAgregarPieza,
  onEliminarPieza
}: PiezasInputProps) {
  
  // Handlers memoizados para mejor rendimiento
  const handleAgregarPieza = useCallback(() => {
    onAgregarPieza()
  }, [onAgregarPieza])

  const handleEliminarPieza = useCallback((index: number) => {
    onEliminarPieza(index)
  }, [onEliminarPieza])

  const handleActualizarPieza = useCallback((index: number, campo: string, valor: any) => {
    onActualizarPieza(index, campo, valor)
  }, [onActualizarPieza])

  const handleCantidadChange = useCallback((index: number, value: string) => {
    const cantidad = parseInt(value) || 1
    if (cantidad > 0) {
      onActualizarPieza(index, 'cantidad', cantidad)
    }
  }, [onActualizarPieza])

  return (
    <div className="space-y-4">
      {/* Header section - Mejor responsividad */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-white text-sm sm:text-base truncate">Componentes y Piezas</h4>
            <p className="text-xs sm:text-sm text-gray-400 truncate">
              Registra las piezas utilizadas
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleAgregarPieza}
          className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg sm:rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-colors duration-200 w-full xs:w-auto text-xs sm:text-sm font-medium"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Agregar pieza</span>
        </button>
      </div>
      
      {/* Piezas list - Layout mejorado para móviles */}
      <div className="space-y-2 sm:space-y-3">
        {piezasUsadas.map((pieza, index) => (
          <div key={index} className="group relative">
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 bg-gray-800/40 rounded-lg sm:rounded-xl border border-gray-700/50 p-3 sm:p-4 hover:bg-gray-700/40 transition-colors duration-150">
              {/* Icono */}
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500/20 rounded flex items-center justify-center flex-shrink-0">
                <Wrench className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
              </div>
              
              {/* Contenido principal - Layout flexible */}
              <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full min-w-0">
                {/* Input de nombre de pieza */}
                <div className="flex-1 w-full min-w-0">
                  <label htmlFor={`pieza-${index}`} className="sr-only">Nombre de la pieza</label>
                  <input
                    id={`pieza-${index}`}
                    type="text"
                    value={pieza.pieza}
                    onChange={(e) => handleActualizarPieza(index, 'pieza', e.target.value)}
                    placeholder="Nombre de la pieza o componente..."
                    className="w-full bg-gray-700/30 sm:bg-transparent border-none text-white placeholder-gray-500 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-2 py-1.5 sm:py-1 transition-colors"
                  />
                </div>
                
                {/* Controles de cantidad - Mejor alineación */}
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
                  <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap flex-shrink-0">Cantidad:</span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleCantidadChange(index, String(pieza.cantidad - 1))}
                      disabled={pieza.cantidad <= 1}
                      className="w-6 h-6 flex items-center justify-center bg-gray-700/50 rounded text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      -
                    </button>
                    <label htmlFor={`cantidad-${index}`} className="sr-only">Cantidad</label>
                    <input
                      id={`cantidad-${index}`}
                      type="number"
                      value={pieza.cantidad}
                      onChange={(e) => handleCantidadChange(index, e.target.value)}
                      min="1"
                      className="w-12 sm:w-16 bg-gray-700/50 border border-gray-600/50 rounded px-1 sm:px-2 py-1 text-white text-center text-sm focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => handleCantidadChange(index, String(pieza.cantidad + 1))}
                      className="w-6 h-6 flex items-center justify-center bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Botón eliminar - Mejor visibilidad en móviles */}
              <button
                type="button"
                onClick={() => handleEliminarPieza(index)}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors duration-200 opacity-80 hover:opacity-100 xs:opacity-0 xs:group-hover:opacity-100 self-end xs:self-auto mt-2 xs:mt-0 flex-shrink-0"
                aria-label={`Eliminar pieza ${pieza.pieza}`}
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty state mejorado */}
      {piezasUsadas.length === 0 && (
        <div className="text-center py-6 sm:py-8 text-gray-500 bg-gray-800/20 rounded-lg sm:rounded-xl border border-gray-700/30 border-dashed">
          <Package className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-600" />
          <p className="text-xs sm:text-sm">No se utilizaron piezas adicionales</p>
          <p className="text-xs text-gray-600 mt-1">Este campo es opcional</p>
          <button
            type="button"
            onClick={handleAgregarPieza}
            className="mt-3 inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/30 text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar primera pieza</span>
          </button>
        </div>
      )}
    </div>
  )
})

export default PiezasInput