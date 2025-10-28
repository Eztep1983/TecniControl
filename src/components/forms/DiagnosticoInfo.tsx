// components/forms/DiagnosticoInfo.tsx
'use client'
import { Stethoscope, FileText, AlertCircle, Activity, Hash } from 'lucide-react'
import { memo } from 'react'

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
  <div className="flex items-start gap-3 mb-4">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
      colorClass || 'bg-gray-700/50 text-gray-400'
    }`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400 mt-0.5">{description}</p>
    </div>
  </div>
))

SectionHeader.displayName = 'SectionHeader'

// Componente de textarea mejorado
const TextAreaField = memo(({ 
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  required = false,
  helpText
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  rows?: number
  required?: boolean
  helpText?: string
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-300">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
    />
    {helpText && (
      <p className="text-xs text-gray-500">{helpText}</p>
    )}
  </div>
))

TextAreaField.displayName = 'TextAreaField'

// Componente principal
const DiagnosticoInfo = memo(function DiagnosticoInfo({
  observacionesIniciales,
  pruebasRealizadas,
  diagnosticoFinal,
  onCambiarObservaciones,
  onCambiarPruebas,
  onCambiarDiagnostico,
}: DiagnosticoInfoProps) {

  // Handlers memoizados

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-1">Diagnóstico Técnico</h2>
            <p className="text-sm text-gray-400">
              Registra las observaciones, pruebas realizadas y conclusiones del diagnóstico del equipo
            </p>
          </div>
        </div>
      </div>

      {/* Observaciones Iniciales */}
      <section className="bg-gray-800/40 rounded-lg p-5 border border-gray-700/50">
        <SectionHeader
          icon={FileText}
          title="Observaciones Iniciales"
          description="Estado del equipo al momento de la recepción"
          colorClass="bg-blue-500/15 text-blue-400"
        />
        
        <TextAreaField
          label="Descripción del estado inicial"
          placeholder="Ejemplo: El equipo presenta problemas de arranque, pantalla sin imagen, ruidos anormales al encender..."
          value={observacionesIniciales}
          onChange={onCambiarObservaciones}
          rows={4}
          required
          helpText="Describe el estado y los problemas reportados por el cliente"
        />
      </section>

      {/* Pruebas Realizadas */}
      <section className="bg-gray-800/40 rounded-lg p-5 border border-gray-700/50">
        <SectionHeader
          icon={Activity}
          title="Pruebas y Procedimientos"
          description="Pruebas técnicas ejecutadas durante el diagnóstico"
          colorClass="bg-purple-500/15 text-purple-400"
        />
        
        <TextAreaField
          label="Pruebas realizadas"
          placeholder="Ejemplo: Prueba de encendido, verificación de fuente de poder, test de memoria RAM, análisis de disco duro..."
          value={pruebasRealizadas}
          onChange={onCambiarPruebas}
          rows={5}
          required
          helpText="Lista las pruebas y procedimientos técnicos realizados"
        />
      </section>

      {/* Diagnóstico Final */}
      <section className="bg-gray-800/40 rounded-lg p-5 border border-gray-700/50">
        <SectionHeader
          icon={Stethoscope}
          title="Diagnóstico Final"
          description="Conclusión técnica del análisis realizado"
          colorClass="bg-green-500/15 text-green-400"
        />
        
        <TextAreaField
          label="Conclusión del diagnóstico"
          placeholder="Ejemplo: Se concluye que el equipo requiere reemplazo de fuente de poder (500W) y limpieza interna. El resto de componentes funcionan correctamente..."
          value={diagnosticoFinal}
          onChange={onCambiarDiagnostico}
          rows={5}
          required
          helpText="Proporciona una conclusión clara y técnica del diagnóstico"
        />
      </section>

      {/* Información de ayuda */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 text-sm text-gray-300">
            <p className="font-medium text-blue-300 mb-1">Nota importante</p>
            <p>
              El diagnóstico es una evaluación técnica que no incluye reparaciones. 
              Documenta de forma detallada el estado del equipo para que el cliente 
              pueda tomar decisiones informadas sobre las reparaciones necesarias.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})

DiagnosticoInfo.displayName = 'DiagnosticoInfo'

export default DiagnosticoInfo