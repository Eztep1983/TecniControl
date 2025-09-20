// components/forms/GarantiaInput.tsx
'use client'
import { Calendar, Clock } from 'lucide-react'

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          Fecha de inicio *
        </label>
        <input
          type="date"
          required
          value={garantiaTiempoDesde}
          onChange={(e) => onCambiarFechaDesde(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Duración (meses) *
        </label>
        <select
          value={mesesGarantia}
          onChange={(e) => onCambiarMeses(parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          required
        >
          <option value={1}>1 mes</option>
          <option value={3}>3 meses</option>
          <option value={6}>6 meses</option>
          <option value={12}>12 meses</option>
          <option value={24}>24 meses</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          Fecha de finalización
        </label>
        <input
          type="text"
          readOnly
          value={garantiaTiempoHasta ? new Date(garantiaTiempoHasta).toLocaleDateString() : 'Automática'}
          className="w-full px-3 py-2 bg-gray-700/30 border border-gray-600/50 rounded-lg text-gray-400 cursor-not-allowed"
        />
      </div>
      
      <div className="md:col-span-3 mt-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Descripción de Garantía *
        </label>
        <textarea
          required
          rows={3}
          value={garantiaDescripcion}
          onChange={(e) => onCambiarDescripcion(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
          placeholder="Especifique qué cubre la garantía del trabajo realizado..."
        />
      </div>
    </div>
  )
}