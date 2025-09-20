// components/forms/FormActions.tsx
'use client'
import { Info, Save } from 'lucide-react'

interface FormActionsProps {
  loading: boolean
  tareasSeleccionadas: string[]
  tareasPersonalizadas: string[]
  onCancel: () => void
}

export default function FormActions({
  loading,
  tareasSeleccionadas,
  tareasPersonalizadas,
  onCancel
}: FormActionsProps) {
  const tareasPersonalizadasFiltradas = tareasPersonalizadas.filter(t => t.trim())

  return (
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="text-sm text-gray-400 flex items-center">
          <Info className="w-4 h-4 mr-1" />
          {tareasSeleccionadas.length > 0 && (
            <span>
              {tareasSeleccionadas.length} tarea{tareasSeleccionadas.length !== 1 ? 's' : ''} predefinida{tareasSeleccionadas.length !== 1 ? 's' : ''} + 
              {tareasPersonalizadasFiltradas.length} personalizada{tareasPersonalizadasFiltradas.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-800 disabled:to-blue-900 text-white px-6 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? 'Guardando...' : 'Guardar Orden'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}