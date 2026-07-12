// components/forms/ContadorInput.tsx
'use client'

import { Calendar, Hash, Clock, Printer, Copy, ScanLine, Timer, Package, Sparkles, Target, Edit3, MessageSquare, Minus, Plus, Info } from 'lucide-react'
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
    textColor: 'dark:text-blue-400 text-blue-700'
  },
  { 
    valor: 'impresiones', 
    label: 'Impresiones', 
    Icon: Printer,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/50',
    textColor: 'dark:text-purple-400 text-purple-700'
  },
  { 
    valor: 'copias', 
    label: 'Copias', 
    Icon: Copy,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/50',
    textColor: 'dark:text-green-400 text-green-700'
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
    textColor: 'dark:text-orange-400 text-orange-700'
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

const ContadorInput = React.memo(function ContadorInput({
  contador,
  mostrarContador,
  onToggleContador,
  onChangeContador
}: ContadorInputProps) {

  // Memoizar el contador actual para evitar cálculos redundantes
  const contadorActual = React.useMemo(() => {
    if (!mostrarContador) return null;
    return contador || {
      tipo: 'unidades' as const,
      valor: 0,
      fechaRegistro: new Date().toISOString().split('T')[0]
    };
  }, [contador, mostrarContador]);

  // Manejador genérico optimizado
  const handleChange = React.useCallback((campo: keyof Contador, valor: any) => {
    const base = contadorActual || {
      tipo: 'unidades' as const,
      valor: 0,
      fechaRegistro: new Date().toISOString().split('T')[0]
    };
    
    const nuevoContador: Contador = {
      ...base,
      [campo]: valor ?? (campo === 'valor' ? 0 : campo === 'fechaRegistro' ? new Date().toISOString().split('T')[0] : '')
    };

    // Limpieza de campos opcionales
    if (!nuevoContador.notas?.trim()) delete nuevoContador.notas;
    if (nuevoContador.tipo !== 'personalizado') delete nuevoContador.unidadPersonalizada;
    else if (!nuevoContador.unidadPersonalizada?.trim()) delete nuevoContador.unidadPersonalizada;

    onChangeContador(nuevoContador);
  }, [contadorActual, onChangeContador]);

  const handleToggle = React.useCallback(() => {
    onToggleContador();
  }, [onToggleContador]);

  // Formatear número para visualización
  const valorFormateado = React.useMemo(() => {
    return (contadorActual?.valor || 0).toLocaleString('es-CO');
  }, [contadorActual?.valor]);

  const handleValorChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const valorSinFormato = e.target.value.replace(/\D/g, '');
    const valorNumerico = valorSinFormato === '' ? 0 : parseInt(valorSinFormato);
    handleChange('valor', Math.max(0, valorNumerico));
  }, [handleChange]);

  const ajustarValor = React.useCallback((delta: number) => {
    const nuevoValor = Math.max(0, (contadorActual?.valor || 0) + delta);
    handleChange('valor', nuevoValor);
  }, [contadorActual?.valor, handleChange]);

  const tipoConfig = React.useMemo(() => 
    TIPOS_CONTADOR.find(t => t.valor === contadorActual?.tipo) || TIPOS_CONTADOR[0]
  , [contadorActual?.tipo]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Selector Principal - Estilo Premium */}
      <div 
        onClick={handleToggle}
        className={`
          group relative overflow-hidden cursor-pointer
          p-5 rounded-2xl border-2 transition-all duration-300
          ${mostrarContador 
            ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
            : 'dark:bg-gray-800/40 bg-gray-200 dark:border-gray-700 border-gray-300 hover:border-gray-500'
          }
        `}
      >
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500
              ${mostrarContador ? 'bg-blue-500 text-white rotate-[360deg]' : 'bg-gray-700 dark:text-gray-400 text-gray-600'}
            `}>
              <Hash className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold text-lg transition-colors ${mostrarContador ? 'dark:text-blue-400 text-blue-700' : 'dark:text-gray-200 text-gray-800'}`}>
                Registro de Contador
              </h3>
              <p className="text-sm text-gray-500">
                {mostrarContador ? 'Configurando detalles del uso' : 'Opcional: Controlar uso del equipo'}
              </p>
            </div>
          </div>
          
          <div className={`
            w-14 h-8 rounded-full p-1 transition-colors duration-300 flex items-center
            ${mostrarContador ? 'bg-blue-500' : 'bg-gray-600'}
          `}>
            <div className={`
              w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 transform
              ${mostrarContador ? 'translate-x-6' : 'translate-x-0'}
            `} />
          </div>
        </div>
        
        {/* Decoración de fondo */}
        {mostrarContador && (
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
        )}
      </div>

      {mostrarContador && contadorActual && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">

                    {/* Valor del Contador - Foco Central */}
          <section className="dark:bg-gray-800/30 bg-gray-100 rounded-3xl p-6 border dark:border-gray-700/50 border-gray-300 space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Valor Actual</span>
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => ajustarValor(-1)}
                  disabled={contadorActual.valor <= 0}
                  className="w-14 h-14 rounded-2xl bg-gray-700 flex items-center justify-center dark:text-white text-gray-900 active:scale-90 disabled:opacity-30 transition-all"
                >
                  <Minus className="w-6 h-6" />
                </button>
                
                <div className="relative group min-w-[180px]">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={valorFormateado}
                    onChange={handleValorChange}
                    className={`
                      w-full bg-transparent text-5xl font-black text-center focus:outline-none transition-colors
                      ${tipoConfig.textColor}
                    `}
                  />
                  <div className={`h-1 w-full mt-2 rounded-full transition-all duration-500 ${tipoConfig.bgColor}`} />
                </div>

                <button
                  type="button"
                  onClick={() => ajustarValor(1)}
                  className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center dark:text-white text-gray-900 active:scale-90 transition-all shadow-lg
                    ${tipoConfig.color.includes('blue') ? 'bg-blue-500 shadow-blue-500/20' : 'bg-blue-500 shadow-blue-500/20'}
                  `}
                  style={{ background: `linear-gradient(to bottom right, ${tipoConfig.color.split(' ')[0].replace('from-', '')}, ${tipoConfig.color.split(' ')[1].replace('to-', '')})` }}
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="flex justify-center gap-2">
              {[10, 100, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleChange('valor', contadorActual.valor + val)}
                  className="px-4 py-2 rounded-xl dark:bg-gray-700/50 bg-gray-300 dark:text-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-700 active:scale-95 transition-all"
                >
                  +{val}
                </button>
              ))}
            </div>
          </section>

          
          {/* Tipos de Contador - Grid Optimizado para Pulgares */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Target className="w-4 h-4 dark:text-blue-500 text-blue-600" />
              <span className="text-sm font-bold dark:text-gray-400 text-gray-600 uppercase tracking-wider">Registrar Tipo de Medición Como:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {TIPOS_CONTADOR.map((tipo) => {
                const isSelected = contadorActual.tipo === tipo.valor;
                const IconComponent = tipo.Icon;
                return (
                  <button
                    key={tipo.valor}
                    type="button"
                    onClick={() => handleChange('tipo', tipo.valor)}
                    className={`
                      relative p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all active:scale-95
                      ${isSelected 
                        ? `${tipo.bgColor} ${tipo.borderColor} ring-4 ring-white/5` 
                        : 'dark:bg-gray-800/30 bg-gray-100 dark:border-gray-700/50 border-gray-300 text-gray-500 hover:dark:border-gray-600 hover:border-gray-300'
                      }
                    `}
                  >
                    <IconComponent className={`w-8 h-8 ${isSelected ? tipo.textColor : ''}`} />
                    <span className={`text-xs font-bold uppercase tracking-tight ${isSelected ? 'dark:text-white text-gray-900' : ''}`}>
                      {tipo.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fecha */}
            <div className="space-y-2 hidden">
              <label className="text-xs font-bold text-gray-500 uppercase px-1">Fecha Registro</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 dark:text-blue-500 text-blue-600" />
                <input
                  type="date"
                  value={contadorActual.fechaRegistro}
                  onChange={(e) => handleChange('fechaRegistro', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full dark:bg-gray-800/50 bg-gray-200 border-2 dark:border-gray-700 border-gray-300 rounded-2xl pl-12 pr-4 py-4 dark:text-white text-gray-900 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Unidad (Si es personalizado) */}
            {contadorActual.tipo === 'personalizado' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                <label className="text-xs font-bold text-pink-500 uppercase px-1">Unidad de Medida</label>
                <input
                  type="text"
                  placeholder="Ej: Metros, Galones..."
                  value={contadorActual.unidadPersonalizada || ''}
                  onChange={(e) => handleChange('unidadPersonalizada', e.target.value)}
                  maxLength={50}
                  className="w-full bg-pink-500/5 border-2 border-pink-500/30 rounded-2xl px-4 py-4 dark:text-white text-gray-900 placeholder-pink-500/40 focus:border-pink-500 focus:outline-none transition-all"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Card - Solo cuando no hay contador */}
      {!mostrarContador && (
        <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 dark:text-blue-400 text-blue-700" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg text-center font-bold dark:text-blue-400 text-blue-700">¿Por qué registrar el contador?</h4>
            <p className="text-sm dark:text-gray-400 text-gray-600 text-center leading-relaxed">
              Permite predecir fallas, programar mantenimientos preventivos y llevar un historial exacto del ciclo de vida de los componentes del equipo aplica solamente si el equipo cuenta con medidor de algún tipo.
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
});

export default ContadorInput;