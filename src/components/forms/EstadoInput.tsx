// components/forms/EstadoInput.tsx
'use client'
import { Plus, Trash2 } from 'lucide-react'

interface EstadoInputProps {
  tipo: 'antes' | 'despues'
  estados: string[]
  onActualizar: (index: number, valor: string) => void
  onAgregar: () => void
  onEliminar: (index: number) => void
}

export default function EstadoInput({
  tipo,
  estados,
  onActualizar,
  onAgregar,
  onEliminar
}: EstadoInputProps) {
  const titulo = tipo === 'antes' ? 'Estado Antes *' : 'Estado Después *'
  const placeholder = tipo === 'antes' ? 'Observación' : 'Observación'

  return (
    <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-medium text-gray-300">
          {titulo}
        </label>
        <button
          type="button"
          onClick={onAgregar}
          className="text-blue-400 hover:text-blue-300 flex items-center text-sm transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1 rounded-lg"
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar
        </button>
      </div>
      
      <div className="space-y-3">
        {estados.map((estado, index) => (
          <div key={index} className="flex items-center space-x-2 group">
            <div className="flex-1 relative">
              <input
                type="text"
                value={estado}
                onChange={(e) => onActualizar(index, e.target.value)}
                placeholder={`${placeholder} ${index + 1}...`}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required={index === 0}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {index + 1}.
              </div>
            </div>
            {estados.length > 1 && (
              <button
                type="button"
                onClick={() => onEliminar(index)}
                className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}