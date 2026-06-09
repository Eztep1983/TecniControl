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
    <div className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-6 shadow-lg">
      {onToggle ? (
        // Si hay función onToggle, mostrar botón interactivo
        <button 
          type="button"
          onClick={onToggle}
          className="flex justify-between items-center w-full mb-4 hover:opacity-80 transition-opacity"
        >
          <h2 className="text-xl font-semibold text-white flex items-center">
            <div className={`w-2 h-6 ${colorClass} rounded-full mr-3`}></div>
            {icon && <span className="mr-2">{icon}</span>}
            {title}
          </h2>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      ) : (
        // Si no hay función onToggle, mostrar solo el título (sin interacción)
        <div className="flex items-center w-full mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
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