// components/forms/ContadorInput.tsx
'use client'

import { Calendar, Hash, Clock, Printer, Copy, ScanLine, Timer, Package, Sparkles, Target, Edit3, MessageSquare, Minus, Plus, CheckCircle } from 'lucide-react'
import React from 'react'

export interface Contador {
  tipo: 'unidades' | 'impresiones' | 'copias' | 'escaneos' | 'horas' | 'personalizado'
  valor: number
  unidadPersonalizada?: string
  fechaRegistro: string
  notas?: string
}

interface ContadorInputProps {
  contador: Contador | null
  mostrarContador: boolean
  onToggleContador: () => void
  onChangeContador: (contador: Contador | null) => void
}

// Configuración de tipos de contador con iconos y colores
const TIPOS_CONTADOR = [
  { 
    valor: 'unidades', 
    label: 'Unidades', 
    Icon: Package,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-400'
  },
  { 
    valor: 'impresiones', 
    label: 'Impresiones', 
    Icon: Printer,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-400'
  },
  { 
    valor: 'copias', 
    label: 'Copias', 
    Icon: Copy,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/50',
    textColor: 'text-green-400'
  },
  { 
    valor: 'escaneos', 
    label: 'Escaneos', 
    Icon: ScanLine,
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/50',
    textColor: 'text-cyan-400'
  },
  { 
    valor: 'horas', 
    label: 'Horas de uso', 
    Icon: Timer,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/50',
    textColor: 'text-orange-400'
  },
  { 
    valor: 'personalizado', 
    label: 'Personalizado', 
    Icon: Sparkles,
    color: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/50',
    textColor: 'text-pink-400'
  },
]

export default function ContadorInput({
  contador,
  mostrarContador,
  onToggleContador,
  onChangeContador
}: ContadorInputProps) {

  const handleChange = (campo: keyof Contador, valor: any) => {
    const contadorActual = contador || {
      tipo: 'unidades' as const,
      valor: 0,
      fechaRegistro: new Date().toISOString().split('T')[0]
    }
    
    let valorLimpio = valor
    if (valorLimpio === undefined || valorLimpio === null) {
      if (campo === 'valor') valorLimpio = 0
      else if (campo === 'fechaRegistro') valorLimpio = new Date().toISOString().split('T')[0]
      else if (campo === 'tipo') valorLimpio = 'unidades'
      else valorLimpio = ''
    }
    
    const nuevoContador: Contador = {
      ...contadorActual,
      [campo]: valorLimpio
    }

    if (!nuevoContador.notas || nuevoContador.notas.trim() === '') {
      delete nuevoContador.notas
    }
    
    if (nuevoContador.tipo !== 'personalizado') {
      delete nuevoContador.unidadPersonalizada
    } else if (!nuevoContador.unidadPersonalizada || nuevoContador.unidadPersonalizada.trim() === '') {
      delete nuevoContador.unidadPersonalizada
    }

    onChangeContador(nuevoContador)
  }

  const handleToggle = () => {
    onToggleContador()
    
    if (!mostrarContador) {
      const hoy = new Date()
      const contadorInicial: Contador = {
        tipo: 'unidades',
        valor: 0,
        fechaRegistro: hoy.toISOString().split('T')[0]
      }
      onChangeContador(contadorInicial)
    } else {
      onChangeContador(null)
    }
  }

  // Formatear número con separadores de miles
  const formatearNumero = (num: number): string => {
    return num.toLocaleString('es-CO')
  }

  // Manejar input del valor con formato
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorSinFormato = e.target.value.replace(/\D/g, '')
    const valorNumerico = valorSinFormato === '' ? 0 : parseInt(valorSinFormato)
    handleChange('valor', Math.max(0, valorNumerico))
  }

  // Incrementar/decrementar valor
  const ajustarValor = (delta: number) => {
    const valorActual = contadorParaMostrar?.valor || 0
    const nuevoValor = Math.max(0, valorActual + delta)
    handleChange('valor', nuevoValor)
  }

  const contadorParaMostrar = mostrarContador 
    ? contador || {
        tipo: 'unidades' as const,
        valor: 0,
        fechaRegistro: new Date().toISOString().split('T')[0]
      }
    : null

  // Obtener configuración del tipo actual
  const tipoConfig = TIPOS_CONTADOR.find(t => t.valor === contadorParaMostrar?.tipo) || TIPOS_CONTADOR[0]

  return (
    <div className="space-y-4">
      {/* Toggle para mostrar/ocultar contador */}
      <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700 hover:border-amber-500/50 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Hash className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-200 block">
              ¿Registrar contador del dispositivo?
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Llevar control de uso del equipo
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 ${
            mostrarContador ? 'bg-amber-500 shadow-lg shadow-amber-500/30' : 'bg-gray-600'
          }`}
          aria-label={mostrarContador ? "Desactivar contador" : "Activar contador"}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
              mostrarContador ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Formulario de contador */}
      {mostrarContador && contadorParaMostrar && (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/50 rounded-2xl p-6 space-y-6 border border-amber-500/20 shadow-xl animate-fadeIn">
          {/* Tipo de contador - Cards seleccionables */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              Tipo de contador
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TIPOS_CONTADOR.map((tipo) => {
                const isSelected = contadorParaMostrar.tipo === tipo.valor
                const IconComponent = tipo.Icon
                return (
                  <button
                    key={tipo.valor}
                    type="button"
                    onClick={() => handleChange('tipo', tipo.valor)}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all duration-300 
                      ${isSelected 
                        ? `${tipo.bgColor} ${tipo.borderColor} shadow-lg scale-105` 
                        : 'bg-gray-700/30 border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <IconComponent className={`w-8 h-8 ${isSelected ? tipo.textColor : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${isSelected ? tipo.textColor : 'text-gray-400'}`}>
                        {tipo.label}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Unidad personalizada */}
          {contadorParaMostrar.tipo === 'personalizado' && (
            <div className="animate-fadeIn">
              <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-pink-400" />
                Unidad personalizada <span className="text-pink-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={contadorParaMostrar.unidadPersonalizada || ''}
                  onChange={(e) => handleChange('unidadPersonalizada', e.target.value)}
                  placeholder="Ej: metros, ciclos, litros..."
                  className="w-full bg-gray-700/50 border-2 border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                  required
                  maxLength={50}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  {(contadorParaMostrar.unidadPersonalizada || '').length}/50
                </div>
              </div>
              {contadorParaMostrar.tipo === 'personalizado' && !contadorParaMostrar.unidadPersonalizada && (
                <p className="text-xs text-pink-400 mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Debe especificar la unidad personalizada
                </p>
              )}
            </div>
          )}

          {/* Valor del contador - Estilizado con botones */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <Hash className="w-4 h-4 text-amber-400" />
              Valor del contador <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => ajustarValor(-1)}
                className="w-12 h-12 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
                disabled={contadorParaMostrar.valor <= 0}
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={formatearNumero(contadorParaMostrar.valor)}
                  onChange={handleValorChange}
                  className={`w-full ${tipoConfig.bgColor} border-2 ${tipoConfig.borderColor} rounded-xl px-6 py-3 ${tipoConfig.textColor} text-center font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all`}
                  placeholder="0"
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className={`absolute inset-0 ${tipoConfig.bgColor} rounded-xl opacity-0 hover:opacity-100 transition-opacity`} />
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => ajustarValor(1)}
                className="w-12 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all active:scale-95 shadow-lg shadow-amber-500/30 flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-between items-center mt-3">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Solo números positivos
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('valor', contadorParaMostrar.valor + 10)}
                  className="text-xs px-3 py-1 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-gray-300 transition-all"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('valor', contadorParaMostrar.valor + 100)}
                  className="text-xs px-3 py-1 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-gray-300 transition-all"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('valor', contadorParaMostrar.valor + 1000)}
                  className="text-xs px-3 py-1 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-gray-300 transition-all"
                >
                  +1000
                </button>
              </div>
            </div>
          </div>

          {/* Fecha de registro - Mejorada */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Fecha de registro <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={contadorParaMostrar.fechaRegistro}
                onChange={(e) => handleChange('fechaRegistro', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-700/50 border-2 border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Fecha actual: {new Date().toLocaleDateString('es-CO', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {/* Notas adicionales - Mejoradas */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Notas adicionales
            </label>
            <div className="relative">
              <textarea
                value={contadorParaMostrar.notas || ''}
                onChange={(e) => handleChange('notas', e.target.value)}
                placeholder="Observaciones sobre el contador, condiciones especiales..."
                rows={3}
                maxLength={500}
                className="w-full bg-gray-700/50 border-2 border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none transition-all"
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-gray-800/80 px-2 py-1 rounded">
                {(contadorParaMostrar.notas || '').length}/500
              </div>
            </div>
          </div>

          {/* Resumen del contador - Card destacada */}
          <div className={`${tipoConfig.bgColor} border-2 ${tipoConfig.borderColor} rounded-xl p-5 space-y-3 shadow-lg`}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                {React.createElement(tipoConfig.Icon, { className: "w-5 h-5" })}
                Contador Registrado
              </h4>
              <span className={`px-3 py-1 ${tipoConfig.bgColor} ${tipoConfig.textColor} rounded-full text-xs font-semibold border ${tipoConfig.borderColor}`}>
                {tipoConfig.label}
              </span>
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className={`text-4xl font-bold ${tipoConfig.textColor}`}>
                {formatearNumero(contadorParaMostrar.valor)}
              </span>
              <span className="text-lg text-gray-400 capitalize">
                {contadorParaMostrar.tipo === 'personalizado' 
                  ? (contadorParaMostrar.unidadPersonalizada || 'unidades') 
                  : contadorParaMostrar.tipo}
              </span>
            </div>
            
            <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
              <Calendar className="w-4 h-4 text-blue-400" />
              <p className="text-sm text-gray-300">
                {new Date(contadorParaMostrar.fechaRegistro).toLocaleDateString('es-CO', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            {contadorParaMostrar.notas && (
              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400 leading-relaxed flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{contadorParaMostrar.notas}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mensaje informativo cuando está desactivado */}
      {!mostrarContador && (
        <div className="bg-gray-800/20 rounded-xl p-5 border-2 border-dashed border-gray-700 hover:border-amber-500/30 transition-all group">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Hash className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-300 mb-1">
                Contador de dispositivo (Opcional)
              </h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                Active esta opción para registrar el contador actual del dispositivo. 
                Esto le permitirá llevar un historial detallado del uso del equipo a lo largo del tiempo.
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  )
}