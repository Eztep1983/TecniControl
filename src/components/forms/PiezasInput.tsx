// components/forms/PiezasInput.tsx 
'use client'
import { Plus, Trash2, Package, Wrench, Settings, AlertCircle } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { obtenerPiezasPredefinidas, PiezaPredefinida } from '@/lib/configuracionTareasR-helpers'
import Link from 'next/link'

interface Pieza {
  pieza: string
  cantidad: number
}

interface PiezasInputProps {
  piezasUsadas: Pieza[]
  onActualizarPieza: (index: number, campo: string, valor: any) => void
  onAgregarPieza: () => void
  onEliminarPieza: (index: number) => void
  error?: string
}

export default function PiezasInput({
  piezasUsadas,
  onActualizarPieza,
  onAgregarPieza,
  onEliminarPieza,
  error
}: PiezasInputProps) {
  const { user } = useAuth()
  const [piezasPredefinidas, setPiezasPredefinidas] = useState<PiezaPredefinida[]>([])
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  const cargarPiezasPredefinidas = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }
    
    try {
      const piezas = await obtenerPiezasPredefinidas(user.uid)
      setPiezasPredefinidas(piezas)
      setErrorCarga('')
    } catch (error) {
      console.error('Error cargando piezas predefinidas:', error)
      setErrorCarga('Error al cargar piezas predefinidas')
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => {
    cargarPiezasPredefinidas()
  }, [cargarPiezasPredefinidas])

  const agregarPiezaPredefinida = useCallback((piezaPredefinida: PiezaPredefinida) => {
    onAgregarPieza()
    setTimeout(() => {
      const nuevoIndex = piezasUsadas.length
      onActualizarPieza(nuevoIndex, 'pieza', piezaPredefinida.nombre)
    }, 10)
  }, [onAgregarPieza, piezasUsadas.length, onActualizarPieza])

  const handleCambiarCantidad = useCallback((index: number, nuevaCantidad: number) => {
    if (isNaN(nuevaCantidad)) {
      onActualizarPieza(index, 'cantidad', 1)
      return
    }
    onActualizarPieza(index, 'cantidad', Math.max(1, nuevaCantidad))
  }, [onActualizarPieza])

  const totalPiezas = piezasUsadas.reduce((sum, pieza) => sum + pieza.cantidad, 0)
  const tienePiezas = piezasUsadas.length > 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-white text-base">Componentes y Piezas</h4>
            <p className="text-sm text-gray-400">
              {loading ? 'Cargando...' : 
               piezasPredefinidas.length > 0 ? 
                 `${piezasPredefinidas.length} piezas predefinidas disponibles` : 
                 'Sin piezas predefinidas'
              }
            </p>
          </div>
        </div>
        
        <Link 
          href="/tareas-repuestos"
          className="text-purple-400 hover:text-purple-300 text-sm transition-colors flex items-center px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/20"
        >
          <Settings className="w-4 h-4 mr-1" />
          Gestionar piezas
        </Link>
      </div>

      {/* Errores */}
      {errorCarga && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-red-300 text-sm">{errorCarga}</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Piezas Predefinidas Disponibles */}
      {!tienePiezas && piezasPredefinidas.length > 0 && (
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/20">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-300">Piezas Predefinidas</h5>
            <span className="text-xs text-gray-500">{piezasPredefinidas.length} piezas</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {piezasPredefinidas.map((pieza) => (
              <button
                key={pieza.id}
                type="button"
                onClick={() => agregarPiezaPredefinida(pieza)}
                className="text-left p-3 bg-gray-700/30 hover:bg-gray-700/50 rounded border border-gray-600/30 hover:border-green-500/40 transition-colors group"
              >
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  <Package className="w-3 h-3 text-green-400" />
                  {pieza.nombre}
                </div>
                {pieza.categoria && pieza.categoria !== 'General' && (
                  <div className="text-xs text-green-400 mt-1">{pieza.categoria}</div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Haz clic en una pieza para agregarla
          </p>
        </div>
      )}

      {/* Lista de Piezas Actuales */}
      {tienePiezas && (
        <div className="space-y-3">
          {piezasUsadas.map((pieza, index) => {
            const esPredefinida = piezasPredefinidas.some(
              p => p.nombre.toLowerCase() === pieza.pieza.toLowerCase()
            )

            return (
              <div key={index} className="flex items-start gap-3 group bg-gray-800/40 rounded-lg border border-gray-700/50 p-4">
                {/* Icono indicador */}
                <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mt-1 ${
                  esPredefinida ? 'bg-green-500/20' : 'bg-purple-500/20'
                }`}>
                  {esPredefinida ? (
                    <Package className="w-4 h-4 text-green-400" />
                  ) : (
                    <Wrench className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                
                {/* Contenido principal */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                  {/* Input de nombre */}
                  <div className="min-w-0">
                    <input
                      type="text"
                      value={pieza.pieza || ''}
                      onChange={(e) => onActualizarPieza(index, 'pieza', e.target.value)}
                      placeholder="Nombre de la pieza..."
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {pieza.pieza && (
                      <span className={`text-xs mt-1 block ${
                        esPredefinida ? 'text-green-400' : 'text-purple-400'
                      }`}>
                        {esPredefinida ? 'Predefinida' : 'Personalizada'}
                      </span>
                    )}
                  </div>

                  {/* Controles de cantidad */}
                  <div className="flex items-center justify-between md:justify-end gap-3">
                    <span className="text-sm text-gray-400 whitespace-nowrap">Cantidad:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleCambiarCantidad(index, pieza.cantidad - 1)}
                        disabled={pieza.cantidad <= 1}
                        className="w-7 h-7 flex items-center justify-center bg-gray-700/50 rounded text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={pieza.cantidad}
                        onChange={(e) => {
                          const nuevaCantidad = parseInt(e.target.value)
                          handleCambiarCantidad(index, nuevaCantidad)
                        }}
                        min="1"
                        className="w-16 bg-gray-700/50 border border-gray-600/50 rounded px-2 py-1 text-white text-center text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => handleCambiarCantidad(index, pieza.cantidad + 1)}
                        className="w-7 h-7 flex items-center justify-center bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botón eliminar */}
                <button
                  type="button"
                  onClick={() => onEliminarPieza(index)}
                  className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors opacity-80 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 flex-shrink-0 mt-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row gap-2">
        {piezasPredefinidas.length > 0 && (
          <button
            type="button"
            onClick={() => agregarPiezaPredefinida(piezasPredefinidas[0])}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg border border-green-500/30 text-sm font-medium transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>Agregar Pieza Predefinida</span>
          </button>
        )}
        
        <button
          type="button"
          onClick={onAgregarPieza}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/30 text-sm font-medium transition-colors"
        >
          <Wrench className="w-4 h-4" />
          <span>Agregar Pieza Personalizada</span>
        </button>
      </div>

      {/* Estado vacío cuando no hay piezas predefinidas */}
      {!tienePiezas && piezasPredefinidas.length === 0 && !loading && (
        <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-lg">
          <Package className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 font-medium mb-2">Sin piezas predefinidas</p>
          <p className="text-sm text-gray-500 mb-4">
            Configura piezas predefinidas o crea piezas personalizadas
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link 
              href="/tareas-repuestos"
              className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/20"
            >
              <Settings className="w-4 h-4" />
              Configurar piezas
            </Link>
            <button
              type="button"
              onClick={onAgregarPieza}
              className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/20"
            >
              <Wrench className="w-4 h-4" />
              Crear pieza personalizada
            </button>
          </div>
        </div>
      )}

      {/* Resumen */}
      {tienePiezas && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-purple-400">
            <Package className="w-5 h-5" />
            <span className="font-medium">
              Total: {totalPiezas} pieza{totalPiezas !== 1 ? 's' : ''} registrada{totalPiezas !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-purple-400/70 mt-1 ml-7">
            {piezasUsadas.length} tipo{piezasUsadas.length !== 1 ? 's' : ''} de pieza{piezasUsadas.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-6 bg-gray-800/20 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-gray-400 text-sm mt-2">Cargando piezas predefinidas...</p>
        </div>
      )}
    </div>
  )
}