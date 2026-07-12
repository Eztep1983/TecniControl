// components/ui/Section.tsx
'use client'
import { ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface SectionProps {
  title: string
  icon?: ReactNode
  isOpen: boolean
  onToggle?: () => void  // ← Ahora es opcional
  colorClass?: string
  children: ReactNode
}

export default function Section({ 
  title, 
  icon, 
  isOpen, 
  onToggle, 
  colorClass = 'bg-blue-500', 
  children 
}: SectionProps) {
  return (
    <div className="dark:bg-gray-800/70 bg-gray-200 rounded-xl border dark:border-gray-700/50 border-gray-300 p-6 shadow-lg">
      {onToggle ? (
        // Si hay función onToggle, mostrar botón interactivo
        <button 
          type="button"
          onClick={onToggle}
          className="flex justify-between items-center w-full mb-4 hover:opacity-80 transition-opacity"
        >
          <h2 className="text-xl font-semibold dark:text-white text-gray-900 flex items-center">
            <div className={`w-2 h-6 ${colorClass} rounded-full mr-3`}></div>
            {icon && <span className="mr-2">{icon}</span>}
            {title}
          </h2>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 dark:text-gray-400 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 dark:text-gray-400 text-gray-600" />
          )}
        </button>
      ) : (
        // Si no hay función onToggle, mostrar solo el título (sin interacción)
        <div className="flex items-center w-full mb-4">
          <h2 className="text-xl font-semibold dark:text-white text-gray-900 flex items-center">
            <div className={`w-2 h-6 ${colorClass} rounded-full mr-3`}></div>
            {icon && <span className="mr-2">{icon}</span>}
            {title}
          </h2>
        </div>
      )}
      
      {isOpen && children}
    </div>
  )
}