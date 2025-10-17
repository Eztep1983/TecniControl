// components/forms/ContadorInput.tsx
'use client'

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

export default function ContadorInput({
  contador,
  mostrarContador,
  onToggleContador,
  onChangeContador
}: ContadorInputProps) {

  const handleChange = (campo: keyof Contador, valor: any) => {
    if (!contador) return
    
    const nuevoContador = {
      ...contador,
      [campo]: valor
    }
    onChangeContador(nuevoContador)
  }

  // Si mostrarContador es true pero no hay contador, inicializamos uno por defecto
  const contadorParaMostrar = mostrarContador && !contador 
    ? {
        tipo: 'unidades' as const,
        valor: 0,
        fechaRegistro: new Date().toISOString().split('T')[0],
        notas: ''
      }
    : contador

  return (
    <div className="space-y-4">
      {/* Toggle para mostrar/ocultar contador */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">
          ¿Registrar contador del dispositivo?
        </label>
        <button
          type="button"
          onClick={onToggleContador}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            mostrarContador ? 'bg-amber-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              mostrarContador ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Formulario de contador */}
      {mostrarContador && contadorParaMostrar && (
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-4 border border-amber-500/30">
          {/* Tipo de contador */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de contador
            </label>
            <select
              value={contadorParaMostrar.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="unidades">Unidades</option>
              <option value="impresiones">Impresiones</option>
              <option value="copias">Copias</option>
              <option value="escaneos">Escaneos</option>
              <option value="horas">Horas de uso</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>

          {/* Unidad personalizada */}
          {contadorParaMostrar.tipo === 'personalizado' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Unidad personalizada
              </label>
              <input
                type="text"
                value={contadorParaMostrar.unidadPersonalizada || ''}
                onChange={(e) => handleChange('unidadPersonalizada', e.target.value)}
                placeholder="Ej: metros, ciclos, etc."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Valor del contador */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Valor del contador
            </label>
            <input
              type="number"
              value={contadorParaMostrar.valor}
              onChange={(e) => handleChange('valor', parseInt(e.target.value) || 0)}
              min="0"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Fecha de registro */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fecha de registro
            </label>
            <input
              type="date"
              value={contadorParaMostrar.fechaRegistro}
              onChange={(e) => handleChange('fechaRegistro', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Notas adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notas adicionales (opcional)
            </label>
            <textarea
              value={contadorParaMostrar.notas || ''}
              onChange={(e) => handleChange('notas', e.target.value)}
              placeholder="Observaciones sobre el contador..."
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Información del contador actual */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-sm text-amber-300">
              <strong>Contador registrado:</strong> {contadorParaMostrar.valor.toLocaleString()} {
                contadorParaMostrar.tipo === 'personalizado' 
                  ? contadorParaMostrar.unidadPersonalizada 
                  : contadorParaMostrar.tipo
              }
            </p>
            <p className="text-xs text-amber-400 mt-1">
              Fecha: {new Date(contadorParaMostrar.fechaRegistro).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Mensaje informativo */}
      {!mostrarContador && (
        <div className="bg-gray-800/30 rounded-lg p-3 border border-dashed border-gray-600">
          <p className="text-sm text-gray-400 text-center">
            Opcional: Registre el contador actual si el dispositivo cuenta con uno para llevar un historial de uso.
          </p>
        </div>
      )}
    </div>
  )
}