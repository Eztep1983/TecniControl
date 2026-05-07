// components/forms/DiagnosticoInfo.tsx
'use client'
import { Stethoscope, FileText, AlertCircle, Activity, Hash } from 'lucide-react'
import React, { memo, useCallback, useMemo } from 'react'

interface DiagnosticoInfoProps {
  observacionesIniciales: string
  pruebasRealizadas: string
  diagnosticoFinal: string
  onCambiarObservaciones: (valor: string) => void
  onCambiarPruebas: (valor: string) => void
  onCambiarDiagnostico: (valor: string) => void
}

// Componente de encabezado de sección memoizado
const SectionHeader = memo(({ 
  icon: Icon, 
  title, 
  description,
  colorClass 
}: { 
  icon: React.ComponentType<any>
  title: string
  description: string
  colorClass?: string
}) => (
  <div className="flex items-start gap-4 mb-5">
    {/* Touch target ampliado y activo para feedback táctil */}
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg touch-manipulation active:scale-95 transition-transform ${
      colorClass || 'bg-gray-700/50 text-gray-400'
    }`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="min-w-0">
      <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{title}</h3>
      <p className="text-sm text-gray-400 mt-1 line-clamp-1">{description}</p>
    </div>
  </div>
))

SectionHeader.displayName = 'SectionHeader'

// Sugerencias rápidas optimizadas para entrada táctil
const QuickSuggestions = memo(({ 
  suggestions, 
  onSelect 
}: { 
  suggestions: string[], 
  onSelect: (val: string) => void 
}) => {
  const handleSelect = useCallback((text: string) => {
    onSelect(text)
  }, [onSelect])

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mt-3 no-scrollbar snap-x [-webkit-overflow-scrolling:touch]">
      {suggestions.map((text, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => handleSelect(text)}
          // Touch target mínimo 44x44 (padding vertical + horizontal)
          className="snap-start shrink-0 px-4 py-2 min-h-[44px] bg-blue-500/10 active:bg-blue-500/20 border border-blue-500/30 rounded-full text-xs font-medium text-blue-300 transition-all active:scale-95 whitespace-nowrap touch-manipulation"
        >
          + {text}
        </button>
      ))}
    </div>
  )
})

QuickSuggestions.displayName = 'QuickSuggestions'

// Componente de textarea optimizado para Android (evita lag al escribir)
const TextAreaField = memo(({ 
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  required = false,
  helpText,
  suggestions = []
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  rows?: number
  required?: boolean
  helpText?: string
  suggestions?: string[]
}) => {
  // Uso de useCallback estable para evitar recrear función en cada render
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const handleClear = useCallback(() => {
    onChange('')
  }, [onChange])

  const handleAddSuggestion = useCallback((text: string) => {
    const newValue = value.trim() 
      ? value.endsWith('.') || value.endsWith(',') 
        ? `${value} ${text.toLowerCase()}`
        : `${value}, ${text.toLowerCase()}`
      : text;
    onChange(newValue);
  }, [value, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end px-1">
        <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {value && (
          <button 
            type="button" 
            onClick={handleClear}
            className="text-xs text-red-400 active:text-red-300 font-medium transition-colors touch-manipulation min-h-[44px] px-2"
          >
            Limpiar
          </button>
        )}
      </div>
      
      <div className="relative group">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          required={required}
          // Desactivamos autocorrección y corrector ortográfico para evitar sobrecarga en Android
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck="false"
          // Aseguramos tamaño de fuente mínimo para evitar zoom automático en Android (>=16px)
          style={{ fontSize: '16px' }}
          className="w-full px-4 py-4 bg-gray-900/40 border-2 border-gray-700/50 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none shadow-inner"
        />
        <div className="absolute top-4 right-4 text-gray-700 pointer-events-none group-focus-within:text-blue-500/30 transition-colors">
          <FileText className="w-5 h-5" />
        </div>
      </div>

      {suggestions.length > 0 && (
        <QuickSuggestions suggestions={suggestions} onSelect={handleAddSuggestion} />
      )}
      
      {helpText && (
        <p className="text-[11px] text-gray-500 px-1 italic">{helpText}</p>
      )}
    </div>
  )
})

TextAreaField.displayName = 'TextAreaField'

// Sugerencias predefinidas (constante fuera del componente)
const SUGGESTIONS = {
  observaciones: [
    "No enciende", "Pantalla rota", "Ruido excesivo", "Lento", "Sobrecalentamiento", 
    "Virus/Malware", "Derrame de líquido", "Falla carga", "Sin señal wifi"
  ],
  pruebas: [
    "Prueba de encendido", "Limpieza física", "Test de RAM", "Test de Disco", 
    "Revisión voltajes", "Escaneo antivirus", "Prueba de carga", "Reinstalación OS"
  ],
  diagnostico: [
    "Falla en fuente", "Disco dañado", "Cambio pasta térmica", "Requiere formateo", 
    "Batería agotada", "Teclado defectuoso", "Corto en placa", "Sin fallas"
  ]
};

// Componente principal
const DiagnosticoInfo = memo(function DiagnosticoInfo({
  observacionesIniciales,
  pruebasRealizadas,
  diagnosticoFinal,
  onCambiarObservaciones,
  onCambiarPruebas,
  onCambiarDiagnostico,
}: DiagnosticoInfoProps) {

  return (
    // Contenedor principal con scroll suave y desactivación de gestos no deseados
    <div className="space-y-8 max-w-3xl mx-auto pb-10 touch-pan-y">
      
      {/* Observaciones Iniciales */}
      <section className="bg-gray-800/40 backdrop-blur-md rounded-3xl p-6 border border-gray-700/50 shadow-xl transition-all active:border-blue-500/30">
        <SectionHeader
          icon={FileText}
          title="Estado Inicial"
          description="Lo que se observa al recibir el equipo"
          colorClass="bg-blue-500 text-white shadow-blue-500/20"
        />
        
        <TextAreaField
          label="Observaciones de Entrada"
          placeholder="Ejemplo: No enciende, pantalla parpadea..."
          value={observacionesIniciales}
          onChange={onCambiarObservaciones}
          rows={3}
          required
          suggestions={SUGGESTIONS.observaciones}
          helpText="Describe los síntomas y el estado físico actual"
        />
      </section>

      {/* Pruebas Realizadas */}
      <section className="bg-gray-800/40 backdrop-blur-md rounded-3xl p-6 border border-gray-700/50 shadow-xl transition-all active:border-purple-500/30">
        <SectionHeader
          icon={Activity}
          title="Procedimientos"
          description="Acciones técnicas ejecutadas"
          colorClass="bg-purple-500 text-white shadow-purple-500/20"
        />
        
        <TextAreaField
          label="Pruebas Realizadas"
          placeholder="Ejemplo: Test de fuente de poder, revisión de voltajes..."
          value={pruebasRealizadas}
          onChange={onCambiarPruebas}
          rows={3}
          required
          suggestions={SUGGESTIONS.pruebas}
          helpText="Enumera las pruebas clave realizadas durante el análisis"
        />
      </section>

      {/* Diagnóstico Final */}
      <section className="bg-gray-800/40 backdrop-blur-md rounded-3xl p-6 border border-gray-700/50 shadow-xl transition-all active:border-green-500/30">
        <SectionHeader
          icon={AlertCircle}
          title="Conclusión"
          description="Veredicto final del servicio técnico"
          colorClass="bg-green-500 text-white shadow-green-500/20"
        />
        
        <TextAreaField
          label="Diagnóstico Final"
          placeholder="Ejemplo: Requiere cambio de SSD y pasta térmica..."
          value={diagnosticoFinal}
          onChange={onCambiarDiagnostico}
          rows={3}
          required
          suggestions={SUGGESTIONS.diagnostico}
          helpText="Conclusión definitiva para informar al cliente"
        />
      </section>

      {/* Información de ayuda */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 flex items-start gap-5 touch-manipulation">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
          <AlertCircle className="w-6 h-6 text-amber-500" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Nota Técnica</h4>
          <p className="text-sm text-gray-400 leading-relaxed">
            Un buen diagnóstico ahorra tiempo y evita malentendidos. 
            Documenta de forma profesional para facilitar la aprobación del presupuesto por parte del cliente.
          </p>
        </div>
      </div>
      
      {/* Estilos específicos para android: scroll táctil suave y eliminación de highlight táctil */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        /* Elimina el resaltado gris al tocar elementos en Android */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        /* Mejora el rendimiento del scroll en contenedores */
        .overflow-x-auto {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        /* Asegura que los inputs no hagan zoom en Android (font-size >= 16px) */
        input, textarea {
          font-size: 16px;
        }
      `}</style>
    </div>
  )
})

DiagnosticoInfo.displayName = 'DiagnosticoInfo'

export default DiagnosticoInfo