'use client'
import { Info, Save } from 'lucide-react'
import { useMemo } from 'react'

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
  const tareasPersonalizadasFiltradas = useMemo(
    () => tareasPersonalizadas.filter(t => t.trim()),
    [tareasPersonalizadas]
  )

  const totalTareas = tareasSeleccionadas.length + tareasPersonalizadasFiltradas.length
  const isFormValid = totalTareas > 0

  return (
    <div className="dark:bg-gray-800/70 bg-gray-200 rounded-xl border dark:border-gray-700/50 border-gray-300 p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="text-sm dark:text-gray-400 text-gray-600 flex items-center space-x-2">
          {isFormValid ? (
            <span>
              {tareasSeleccionadas.length} tarea{tareasSeleccionadas.length !== 1 ? 's' : ''} predefinida{tareasSeleccionadas.length !== 1 ? 's' : ''} + 
              {tareasPersonalizadasFiltradas.length} personalizada{tareasPersonalizadasFiltradas.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="flex items-center text-yellow-400">
              <Info className="w-4 h-4 mr-1" />
              Agrega al menos una tarea para guardar
            </span>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border dark:border-gray-600 border-gray-300 rounded-lg dark:text-gray-300 text-gray-700 hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg ${
              loading || !isFormValid
                ? 'bg-gray-600 dark:text-gray-300 text-gray-700 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:text-white text-gray-900 hover:shadow-xl'
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 dark:border-white border-gray-200 border-t-transparent rounded-full animate-spin"></div>
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
