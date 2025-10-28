// components/forms/PiezasInput.tsx 
'use client'
import { Plus, Trash2, Package, Settings, AlertCircle, ChevronDown, ChevronUp, Minus } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'
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
  const [mostrarPiezasPredefinidas, setMostrarPiezasPredefinidas] = useState(true)
  const [nuevaPiezaPersonalizada, setNuevaPiezaPersonalizada] = useState('')

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

  // Verificar si una pieza está seleccionada
  const estaPiezaSeleccionada = useCallback((nombrePieza: string) => {
    return piezasUsadas.some(
      p => p.pieza === nombrePieza
    )
  }, [piezasUsadas])

  // Obtener la cantidad de una pieza seleccionada
  const obtenerCantidadPieza = useCallback((nombrePieza: string) => {
    const pieza = piezasUsadas.find(
      p => p.pieza === nombrePieza
    )
    return pieza?.cantidad || 1
  }, [piezasUsadas])

  // Toggle pieza predefinida
  const togglePiezaPredefinida = useCallback((nombrePieza: string) => {
    const index = piezasUsadas.findIndex(
      p => p.pieza === nombrePieza
    )
    
    if (index >= 0) {
      // Si está seleccionada, la eliminamos
      onEliminarPieza(index)
    } else {
      // Si no está seleccionada, la agregamos con cantidad 1
      onAgregarPieza()
      setTimeout(() => {
        const nuevoIndex = piezasUsadas.length
        onActualizarPieza(nuevoIndex, 'pieza', nombrePieza)
        onActualizarPieza(nuevoIndex, 'cantidad', 1)
      }, 10)
    }
  }, [piezasUsadas, onAgregarPieza, onEliminarPieza, onActualizarPieza])

  // Actualizar cantidad de pieza
  const actualizarCantidad = useCallback((nombrePieza: string, nuevaCantidad: number) => {
    const index = piezasUsadas.findIndex(
      p => p.pieza === nombrePieza
    )
    
    if (index >= 0) {
      const cantidad = Math.max(1, Math.min(9999, nuevaCantidad))
      onActualizarPieza(index, 'cantidad', cantidad)
    }
  }, [piezasUsadas, onActualizarPieza])

  // Agregar pieza personalizada
  const agregarPiezaPersonalizada = useCallback(() => {
    const nombreTrimmed = nuevaPiezaPersonalizada.trim()
    
    if (!nombreTrimmed) return
    
    // Verificar si ya existe (case insensitive)
    const yaExiste = piezasUsadas.some(
      p => p.pieza === nombreTrimmed
    )
    
    if (yaExiste) {
      alert('Esta pieza ya está agregada')
      return
    }
    
    onAgregarPieza()
    setTimeout(() => {
      const nuevoIndex = piezasUsadas.length
      onActualizarPieza(nuevoIndex, 'pieza', nombreTrimmed)
      onActualizarPieza(nuevoIndex, 'cantidad', 1)
    }, 10)
    
    setNuevaPiezaPersonalizada('')
  }, [nuevaPiezaPersonalizada, piezasUsadas, onAgregarPieza, onActualizarPieza])

  // Piezas agrupadas por categoría
  const piezasPorCategoria = useMemo(() => {
    return piezasPredefinidas.reduce((acc, pieza) => {
      const categoria = pieza.categoria || 'General'
      if (!acc[categoria]) {
        acc[categoria] = []
      }
      acc[categoria].push(pieza)
      return acc
    }, {} as Record<string, PiezaPredefinida[]>)
  }, [piezasPredefinidas])

  // Piezas personalizadas (no predefinidas)
  const piezasPersonalizadas = useMemo(() => {
    return piezasUsadas.filter(pieza => 
      !piezasPredefinidas.some(pred => 
        pred.nombre === pieza.pieza
      )
    )
  }, [piezasUsadas, piezasPredefinidas])

  const tienePiezas = piezasUsadas.length > 0
  const totalPiezas = useMemo(() => {
    return piezasUsadas.reduce((sum, pieza) => sum + pieza.cantidad, 0)
  }, [piezasUsadas])

  return (
    <div className="space-y-4">
      {/* Errores */}
      {errorCarga && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{errorCarga}</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Resumen de piezas seleccionadas */}
      {tienePiezas && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 font-medium">
              {piezasUsadas.length} pieza{piezasUsadas.length !== 1 ? 's' : ''} seleccionada{piezasUsadas.length !== 1 ? 's' : ''}
            </span>
            <span className="text-blue-400/70">•</span>
            <span className="text-blue-400">
              Total: {totalPiezas} unidad{totalPiezas !== 1 ? 'es' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Piezas Predefinidas */}
      {piezasPredefinidas.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setMostrarPiezasPredefinidas(!mostrarPiezasPredefinidas)}
            className="w-full flex items-center justify-between p-3 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-700 rounded-lg transition-all"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-green-400" />
              <span className="font-medium text-white text-sm">
                Piezas Predefinidas
              </span>
              <span className="text-xs text-gray-500">
                ({piezasPredefinidas.length})
              </span>
            </div>
            {mostrarPiezasPredefinidas ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {mostrarPiezasPredefinidas && (
            <div className="space-y-4 pl-2">
              {Object.entries(piezasPorCategoria).map(([categoria, piezas]) => (
                <div key={categoria} className="space-y-2">
                  {/* Nombre de categoría */}
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                    {categoria}
                  </div>

                  {/* Lista de piezas */}
                  <div className="space-y-1.5">
                    {piezas.map((pieza) => {
                      const seleccionada = estaPiezaSeleccionada(pieza.nombre)
                      const cantidad = obtenerCantidadPieza(pieza.nombre)

                      return (
                        <div key={pieza.id} className="space-y-2">
                          {/* Checkbox de la pieza */}
                          <label className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-700/30 cursor-pointer transition-colors group">
                            <input
                              type="checkbox"
                              checked={seleccionada}
                              onChange={() => togglePiezaPredefinida(pieza.nombre)}
                              className="w-4 h-4 rounded border-gray-600 text-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 focus:ring-offset-gray-800"
                            />
                            <span className={`text-sm flex-1 transition-colors ${
                              seleccionada ? 'text-white font-medium' : 'text-gray-300 group-hover:text-white'
                            }`}>
                              {pieza.nombre}
                            </span>
                            {seleccionada && (
                              <span className="text-xs text-green-400 font-medium">
                                x{cantidad}
                              </span>
                            )}
                          </label>

                          {/* Control de cantidad (solo visible si está seleccionada) */}
                          {seleccionada && (
                            <div className="ml-7 pl-4 border-l-2 border-gray-700">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                  Cantidad:
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => actualizarCantidad(pieza.nombre, cantidad - 1)}
                                    disabled={cantidad <= 1}
                                    className="w-7 h-7 flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 rounded text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    value={cantidad}
                                    onChange={(e) => {
                                      const valor = parseInt(e.target.value) || 1
                                      actualizarCantidad(pieza.nombre, valor)
                                    }}
                                    min="1"
                                    max="9999"
                                    className="w-16 h-7 bg-gray-700/50 border border-gray-600 rounded px-2 text-center text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => actualizarCantidad(pieza.nombre, cantidad + 1)}
                                    className="w-7 h-7 flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 rounded text-white transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Link para configurar piezas */}
      {!loading && (
        <Link 
          href="/tareas-repuestos"
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-all"
        >
          <Settings className="w-4 h-4" />
          <span>Configurar piezas predefinidas</span>
        </Link>
      )}

      {/* Agregar pieza personalizada */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
          Pieza Personalizada
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={nuevaPiezaPersonalizada}
            onChange={(e) => setNuevaPiezaPersonalizada(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                agregarPiezaPersonalizada()
              }
            }}
            placeholder="Nombre de la pieza..."
            className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={agregarPiezaPersonalizada}
            disabled={!nuevaPiezaPersonalizada.trim()}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>
      </div>

      {/* Lista de piezas personalizadas */}
      {piezasPersonalizadas.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
            Piezas Personalizadas ({piezasPersonalizadas.length})
          </div>
          <div className="space-y-1.5">
            {piezasPersonalizadas.map((pieza, globalIndex) => {
              // Encontrar el índice real en piezasUsadas
              const index = piezasUsadas.findIndex(p => p === pieza)
              
              return (
                <div key={index} className="flex items-center gap-2 p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={pieza.pieza ?? ''}
                      onChange={(e) => onActualizarPieza(index, 'pieza', e.target.value)}
                      placeholder="Nombre de la pieza"
                      className="w-full px-2 py-1 bg-transparent border-none text-sm text-white placeholder-gray-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onActualizarPieza(index, 'cantidad', Math.max(1, pieza.cantidad - 1))}
                      disabled={pieza.cantidad <= 1}
                      className="w-7 h-7 flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 rounded text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={pieza.cantidad}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || 1
                        onActualizarPieza(index, 'cantidad', Math.max(1, Math.min(9999, valor)))
                      }}
                      min="1"
                      max="9999"
                      className="w-14 h-7 bg-gray-700/50 border border-gray-600 rounded px-2 text-center text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => onActualizarPieza(index, 'cantidad', pieza.cantidad + 1)}
                      className="w-7 h-7 flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 rounded text-white transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEliminarPieza(index)}
                    className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!tienePiezas && !loading && piezasPredefinidas.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-lg bg-gray-800/20">
          <Package className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium mb-1">
            Sin piezas predefinidas
          </p>
          <p className="text-xs text-gray-500 px-4">
            Agrega una pieza personalizada o configura piezas predefinidas
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 bg-gray-800/20 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-gray-400 text-sm mt-2">Cargando piezas...</p>
        </div>
      )}
    </div>
  )
}