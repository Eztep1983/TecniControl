// components/forms/PiezasInput.tsx
'use client'
import { Plus, Trash2, Package, Wrench } from 'lucide-react'

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

export default function PiezasInput({
  piezasUsadas,
  onActualizarPieza,
  onAgregarPieza,
  onEliminarPieza
}: PiezasInputProps) {
  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h4 className="font-medium text-white">Componentes y Piezas</h4>
            <p className="text-sm text-gray-400">
              Registra las piezas utilizadas durante el mantenimiento
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={onAgregarPieza}
          className="flex items-center justify-center sm:justify-start space-x-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Agregar pieza</span>
        </button>
      </div>
      
      {/* Piezas list */}
      <div className="space-y-3">
        {piezasUsadas.map((pieza, index) => (
          <div key={index} className="group relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gray-800/40 rounded-xl border border-gray-700/50 p-4 hover:bg-gray-700/40 hover:border-gray-600/60 transition-all duration-200">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wrench className="w-4 h-4 text-purple-400" />
              </div>
              
              <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                <input
                  type="text"
                  value={pieza.pieza}
                  onChange={(e) => onActualizarPieza(index, 'pieza', e.target.value)}
                  placeholder="Nombre de la pieza o componente..."
                  className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none focus:ring-0 w-full px-2 py-1 sm:py-0 rounded-md sm:rounded-none bg-gray-700/30 sm:bg-transparent"
                />
                
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-400 whitespace-nowrap">Cantidad:</span>
                  <input
                    type="number"
                    value={pieza.cantidad}
                    onChange={(e) => onActualizarPieza(index, 'cantidad', parseInt(e.target.value) || 1)}
                    placeholder="1"
                    min="1"
                    className="w-16 bg-gray-700/50 border border-gray-600/50 rounded-lg px-2 py-1 text-white text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => onEliminarPieza(index)}
                className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 opacity-70 group-hover:opacity-100 sm:opacity-0 self-end sm:self-auto mt-2 sm:mt-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty state */}
      {piezasUsadas.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-gray-800/20 rounded-xl border border-gray-700/30 border-dashed">
          <Package className="w-8 h-8 mx-auto mb-2 text-gray-600" />
          <p className="text-sm">No se utilizaron piezas adicionales</p>
          <p className="text-xs text-gray-600 mt-1">Este campo es opcional</p>
        </div>
      )}
    </div>
  )
}