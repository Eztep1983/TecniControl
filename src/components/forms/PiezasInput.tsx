// components/forms/PiezasInput.tsx 
'use client'
import { Plus, Trash2, Package, Wrench, Settings, AlertCircle, ChevronDown, ChevronUp, Check } from 'lucide-react'
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
  const [inputPersonalizado, setInputPersonalizado] = useState('')

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
      p => p.pieza.toLowerCase() === nombrePieza.toLowerCase()
    )
  }, [piezasUsadas])

  // Toggle pieza predefinida (agregar o eliminar)
  const togglePiezaPredefinida = useCallback((piezaPredefinida: PiezaPredefinida) => {
    const index = piezasUsadas.findIndex(
      p => p.pieza.toLowerCase() === piezaPredefinida.nombre.toLowerCase()
    )
    
    if (index >= 0) {
      // Si ya existe, la eliminamos
      onEliminarPieza(index)
    } else {
      // Si no existe, la agregamos
      onAgregarPieza()
      setTimeout(() => {
        const nuevoIndex = piezasUsadas.length
        onActualizarPieza(nuevoIndex, 'pieza', piezaPredefinida.nombre)
      }, 10)
    }
  }, [piezasUsadas, onAgregarPieza, onEliminarPieza, onActualizarPieza])

  const handleCambiarCantidad = useCallback((index: number, nuevaCantidad: number) => {
    if (isNaN(nuevaCantidad)) {
      onActualizarPieza(index, 'cantidad', 1)
      return
    }
    onActualizarPieza(index, 'cantidad', Math.max(1, nuevaCantidad))
  }, [onActualizarPieza])

  const agregarPiezaPersonalizada = useCallback(() => {
    if (!inputPersonalizado.trim()) return
    
    // Verificar si ya existe
    const existe = piezasUsadas.some(
      p => p.pieza.toLowerCase() === inputPersonalizado.trim().toLowerCase()
    )
    
    if (!existe) {
      onAgregarPieza()
      setTimeout(() => {
        const nuevoIndex = piezasUsadas.length
        onActualizarPieza(nuevoIndex, 'pieza', inputPersonalizado.trim())
      }, 10)
    }
    
    setInputPersonalizado('')
  }, [inputPersonalizado, piezasUsadas, onAgregarPieza, onActualizarPieza])

  const totalPiezas = useMemo(() => {
    return piezasUsadas.reduce((sum, pieza) => sum + pieza.cantidad, 0)
  }, [piezasUsadas])

  const tienePiezas = piezasUsadas.length > 0

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

  return (
    <div className="space-y-4">
      {/* Header - Optimizado para móvil */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white text-base">Componentes y Piezas</h4>
            <p className="text-xs text-gray-400 truncate">
              {loading ? 'Cargando...' : 
               piezasPredefinidas.length > 0 ? 
                 `${piezasPredefinidas.length} disponibles` : 
                 'Sin piezas predefinidas'
              }
            </p>
          </div>
        </div>
        
      </div>

      {/* Errores */}
      {errorCarga && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{errorCarga}</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}



      {/* Sección de Piezas Predefinidas */}
      {piezasPredefinidas.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setMostrarPiezasPredefinidas(!mostrarPiezasPredefinidas)}
            className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700 rounded-xl transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-white block text-sm">Piezas Predefinidas</span>
                <span className="text-xs text-gray-400">
                  {piezasPredefinidas.length} disponible{piezasPredefinidas.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            {mostrarPiezasPredefinidas ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Lista de Piezas Predefinidas - Optimizado para táctil */}
          {mostrarPiezasPredefinidas && (
            <div className="border border-gray-700 rounded-xl bg-gray-800/30 overflow-hidden">
              <div className="divide-y divide-gray-700/50">
                {Object.entries(piezasPorCategoria).map(([categoria, piezas]) => (
                  <div key={categoria}>
                    {/* Header de Categoría */}
                    <div className="px-4 py-2.5 bg-gray-700/30">
                      <span className="font-medium text-gray-300 uppercase text-xs tracking-wider">
                        {categoria}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({piezas.length})
                      </span>
                    </div>

                    {/* Grid de Piezas - Diseño móvil optimizado */}
                    <div className="p-3 grid grid-cols-1 gap-2">
                      {piezas.map((pieza) => {
                        const seleccionada = estaPiezaSeleccionada(pieza.nombre)
                        const index = piezasUsadas.findIndex(
                          p => p.pieza.toLowerCase() === pieza.nombre.toLowerCase()
                        )
                        const cantidad = index >= 0 ? piezasUsadas[index].cantidad : 0

                        return (
                          <div
                            key={pieza.id}
                            className={`rounded-xl border-2 transition-all ${
                              seleccionada
                                ? 'bg-green-500/20 border-green-500/50'
                                : 'bg-gray-700/30 border-transparent hover:border-gray-600'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => togglePiezaPredefinida(pieza)}
                              className="w-full text-left p-3 flex items-center justify-between active:scale-98 transition-transform"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  seleccionada ? 'bg-green-500/30' : 'bg-gray-600/30'
                                }`}>
                                  {seleccionada ? (
                                    <Check className="w-5 h-5 text-green-400" />
                                  ) : (
                                    <Package className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white truncate">
                                    {pieza.nombre}
                                  </div>
                                  {seleccionada && (
                                    <div className="text-xs text-green-400 mt-0.5">
                                      Cantidad: {cantidad}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>

                            {/* Controles de cantidad cuando está seleccionada */}
                            {seleccionada && index >= 1 && (
                              <div className="px-3 pb-3 flex items-center justify-between gap-3">
                                <span className="text-xs text-gray-400">Ajustar cantidad:</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCambiarCantidad(index, cantidad - 1)
                                    }}
                                    disabled={cantidad <= 1}
                                    className="w-9 h-9 flex items-center justify-center bg-gray-700/50 rounded-lg text-white hover:bg-gray-700 disabled:opacity-30 active:scale-95 transition-all"
                                  >
                                    <span className="text-lg">-</span>
                                  </button>
                                  <input
                                    type="number"
                                    value={cantidad}
                                    onChange={(e) => {
                                      const nuevaCantidad = parseInt(e.target.value)
                                      handleCambiarCantidad(index, nuevaCantidad)
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    min="1"
                                    className="w-16 h-9 bg-gray-700/50 border border-gray-600/50 rounded-lg px-2 text-white text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCambiarCantidad(index, cantidad + 1)
                                    }}
                                    className="w-9 h-9 flex items-center justify-center bg-gray-700/50 rounded-lg text-white hover:bg-gray-700 active:scale-95 transition-all"
                                  >
                                    <span className="text-lg">+</span>
                                  </button>
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
            </div>
          )}
        </div>
      )}

      {/* Sección para agregar pieza personalizada - Optimizado móvil */}
      <div className="space-y-3">
        <Link 
          href="/tareas-repuestos"
          className="sm:w-auto text-center text-purple-400 hover:text-purple-300 text-sm transition-colors flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl border border-purple-500/20 active:scale-95"
        >
          <Settings className="w-4 h-4" />
          <span>Crear piezas predefinidas</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Wrench className="w-4 h-4 text-purple-400" />
          </div>
          <span className="font-semibold text-white text-sm">Pieza Personalizada</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={inputPersonalizado}
            onChange={(e) => setInputPersonalizado(e.target.value)}
            placeholder="Nombre de la pieza..."
            className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                agregarPiezaPersonalizada()
              }
            }}
          />
          <button
            type="button"
            onClick={agregarPiezaPersonalizada}
            disabled={!inputPersonalizado.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl border border-purple-500/30 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>
      </div>

      {/* Lista de Piezas Personalizadas */}
      {piezasUsadas.some(p => !piezasPredefinidas.some(pred => pred.nombre.toLowerCase() === p.pieza.toLowerCase())) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">Piezas Personalizadas</span>
          </div>
          
          <div className="space-y-2">
            {piezasUsadas.map((pieza, index) => {
              const esPredefinida = piezasPredefinidas.some(
                p => p.nombre.toLowerCase() === pieza.pieza.toLowerCase()
              )

              if (esPredefinida) return null

              return (
                <div key={index} className="flex items-center gap-3 bg-purple-500/10 rounded-xl border border-purple-500/30 p-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-5 h-5 text-purple-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {pieza.pieza}
                    </div>
                    <div className="text-xs text-purple-400">
                      Personalizada
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCambiarCantidad(index, pieza.cantidad - 1)}
                        disabled={pieza.cantidad <= 1}
                        className="w-8 h-8 flex items-center justify-center bg-gray-700/50 rounded-lg text-white hover:bg-gray-700 disabled:opacity-30 active:scale-95 transition-all"
                      >
                        <span className="text-base">-</span>
                      </button>
                      <input
                        type="number"
                        value={pieza.cantidad}
                        onChange={(e) => {
                          const nuevaCantidad = parseInt(e.target.value) 
                          handleCambiarCantidad(index, nuevaCantidad)
                        }}
                        min="1"
                        className="w-14 h-8 bg-gray-700/50 border border-gray-600/50 rounded-lg px-2 text-white text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => handleCambiarCantidad(index, pieza.cantidad + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-700/50 rounded-lg text-white hover:bg-gray-700 active:scale-95 transition-all"
                      >
                        <span className="text-base">+</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onEliminarPieza(index)}
                      className="w-9 h-9 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!tienePiezas && piezasPredefinidas.length === 0 && !loading && (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/20">
          <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 font-medium mb-2">Sin piezas predefinidas</p>
          <p className="text-sm text-gray-500 px-4">
            Escribe el nombre de una pieza que no este en la lista predefinida y agrégala como personalizada.
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12 bg-gray-800/20 rounded-xl">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-gray-400 text-sm mt-3">Cargando piezas...</p>
        </div>
      )}
    </div>
  )
}