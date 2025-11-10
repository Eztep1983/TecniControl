// components/forms/PiezasInput.tsx
'use client'
import { Plus, Trash2, Package, Wrench, Settings, AlertCircle, Search, X } from 'lucide-react'
import { useCallback, memo, useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { obtenerPiezasPredefinidas, PiezaPredefinida } from '@/lib/configuracionTareasR-helpers'
import Link from 'next/link'

interface Pieza {
  pieza: string
  cantidad: number
  tipo?: 'predefinida' | 'personalizada'
  idPredefinida?: string
}

interface PiezasInputProps {
  piezasUsadas: Pieza[]
  onActualizarPieza: (index: number, campo: string, valor: any) => void
  onAgregarPieza: () => void
  onEliminarPieza: (index: number) => void
  error?: string
}

// ============================================================================
// COMPONENTE: Selector de Cantidad Predefinida
// ============================================================================
const SelectorCantidadPredefinida = memo(({
  cantidadActual,
  onCambiarCantidad,
  onEliminar
}: {
  cantidadActual: number
  onCambiarCantidad: (cantidad: number) => void
  onEliminar: () => void
}) => {
  const handleIncremento = useCallback(() => {
    if (cantidadActual < 999) {
      onCambiarCantidad(cantidadActual + 1)
    }
  }, [cantidadActual, onCambiarCantidad])

  const handleDecremento = useCallback(() => {
    if (cantidadActual > 1) {
      onCambiarCantidad(cantidadActual - 1)
    } else {
      onEliminar()
    }
  }, [cantidadActual, onCambiarCantidad, onEliminar])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = parseInt(e.target.value) || 0
    if (valor === 0) {
      onEliminar()
    } else if (valor > 0 && valor <= 999) {
      onCambiarCantidad(valor)
    }
  }, [onCambiarCantidad, onEliminar])

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDecremento}
        className="w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-lg text-white transition-colors touch-manipulation"
        aria-label="Reducir cantidad"
      >
        {cantidadActual === 1 ? <Trash2 className="w-4 h-4" /> : <span className="text-lg font-medium">-</span>}
      </button>
      
      <input
        type="number"
        value={cantidadActual}
        onChange={handleInputChange}
        min="1"
        max="999"
        className="w-16 bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white text-center text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
        aria-label="Cantidad"
      />
      
      <button
        type="button"
        onClick={handleIncremento}
        disabled={cantidadActual >= 999}
        className="w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-lg text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
        aria-label="Aumentar cantidad"
      >
        <span className="text-lg font-medium">+</span>
      </button>
    </div>
  )
}, (prevProps, nextProps) => {
  return prevProps.cantidadActual === nextProps.cantidadActual
})

SelectorCantidadPredefinida.displayName = 'SelectorCantidadPredefinida'

// ============================================================================
// COMPONENTE: Item de Pieza Predefinida
// ============================================================================
const ItemPiezaPredefinida = memo(({
  pieza,
  estaSeleccionada,
  cantidad,
  onSeleccionar,
  onCambiarCantidad,
  onDeseleccionar
}: {
  pieza: PiezaPredefinida
  estaSeleccionada: boolean
  cantidad: number
  onSeleccionar: () => void
  onCambiarCantidad: (cantidad: number) => void
  onDeseleccionar: () => void
}) => {
  return (
    <div
      className={`
        p-4 rounded-lg border-2 transition-all duration-200
        ${estaSeleccionada 
          ? 'bg-green-500/20 border-green-500/50' 
          : 'bg-gray-800/40 border-gray-700/50 active:bg-gray-800/60'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* Info de la pieza */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
            ${estaSeleccionada ? 'bg-green-500/30' : 'bg-gray-700/50'}
          `}>
            <Package className={`w-5 h-5 ${estaSeleccionada ? 'text-green-300' : 'text-gray-400'}`} />
          </div>
          
          <div className="min-w-0 flex-1">
            <h6 className={`font-medium truncate ${estaSeleccionada ? 'text-green-200' : 'text-white'}`}>
              {pieza.nombre}
            </h6>
            {pieza.categoria && pieza.categoria !== 'General' && (
              <p className={`text-xs truncate ${estaSeleccionada ? 'text-green-300/70' : 'text-gray-400'}`}>
                {pieza.categoria}
              </p>
            )}
          </div>
        </div>

        {/* Controles */}
        {estaSeleccionada ? (
          <SelectorCantidadPredefinida
            cantidadActual={cantidad}
            onCambiarCantidad={onCambiarCantidad}
            onEliminar={onDeseleccionar}
          />
        ) : (
          <button
            type="button"
            onClick={onSeleccionar}
            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 active:bg-green-500/40 text-green-300 rounded-lg border border-green-500/30 text-sm font-medium transition-colors touch-manipulation"
          >
            Seleccionar
          </button>
        )}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.estaSeleccionada === nextProps.estaSeleccionada &&
    prevProps.cantidad === nextProps.cantidad &&
    prevProps.pieza.id === nextProps.pieza.id
  )
})

ItemPiezaPredefinida.displayName = 'ItemPiezaPredefinida'

// ============================================================================
// COMPONENTE: Sección Piezas Predefinidas
// ============================================================================
const SeccionPiezasPredefinidas = memo(({
  piezasPredefinidas,
  piezasUsadas,
  onSeleccionar,
  onCambiarCantidad,
  onDeseleccionar
}: {
  piezasPredefinidas: PiezaPredefinida[]
  piezasUsadas: Pieza[]
  onSeleccionar: (pieza: PiezaPredefinida) => void
  onCambiarCantidad: (idPieza: string, cantidad: number) => void
  onDeseleccionar: (idPieza: string) => void
}) => {
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')

  // Memoizar categorías únicas
  const categorias = useMemo(() => 
    Array.from(new Set(piezasPredefinidas.map(p => p.categoria || 'General'))),
    [piezasPredefinidas]
  )

  // Memoizar mapa de piezas seleccionadas para búsqueda O(1)
  const piezasSeleccionadasMap = useMemo(() => {
    const map = new Map<string, { cantidad: number, index: number }>()
    piezasUsadas.forEach((pieza, index) => {
      if (pieza?.tipo === 'predefinida' && pieza.idPredefinida) {
        map.set(pieza.idPredefinida, { cantidad: pieza.cantidad, index })
      }
    })
    return map
  }, [piezasUsadas])

  // Memoizar piezas filtradas
  const piezasFiltradas = useMemo(() => {
    const busquedaLower = busqueda.toLowerCase()
    return piezasPredefinidas.filter(pieza => {
      const matchBusqueda = !busqueda || pieza.nombre.toLowerCase().includes(busquedaLower)
      const matchCategoria = categoriaFiltro === 'todas' || pieza.categoria === categoriaFiltro
      return matchBusqueda && matchCategoria
    })
  }, [piezasPredefinidas, busqueda, categoriaFiltro])

  const totalSeleccionadas = piezasSeleccionadasMap.size

  const handleLimpiarTodo = useCallback(() => {
    Array.from(piezasSeleccionadasMap.keys()).forEach(id => {
      onDeseleccionar(id)
    })
  }, [piezasSeleccionadasMap, onDeseleccionar])

  if (piezasPredefinidas.length === 0) {
    return (
      <div className="bg-gray-800/40 rounded-lg p-6 border border-gray-700/50">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h5 className="text-gray-400 font-medium mb-2">No hay piezas predefinidas</h5>
          <p className="text-gray-500 text-sm mb-4">
            Configura tus piezas predefinidas para comenzar
          </p>
          <Link 
            href="/configuracion/tareas-repuestos"
            className="inline-flex items-center px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/30 text-sm transition-colors touch-manipulation"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar Piezas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Buscador y filtros */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar piezas..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {categorias.length > 1 && (
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          >
            <option value="todas">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
      </div>

      {/* Contador de seleccionadas */}
      {totalSeleccionadas > 0 && (
        <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <span className="text-green-300 text-sm font-medium">
            {totalSeleccionadas} {totalSeleccionadas === 1 ? 'pieza' : 'piezas'} seleccionada{totalSeleccionadas !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={handleLimpiarTodo}
            className="text-green-300 hover:text-green-200 text-sm underline transition-colors touch-manipulation"
          >
            Limpiar
          </button>
        </div>
      )}

      {/* Lista de piezas */}
      {piezasFiltradas.length === 0 ? (
        <div className="text-center py-8 bg-gray-800/20 rounded-lg border border-gray-700/30">
          <Search className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No se encontraron piezas</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {piezasFiltradas.map((pieza) => {
            const piezaData = piezasSeleccionadasMap.get(pieza.id)
            return (
              <ItemPiezaPredefinida
                key={pieza.id}
                pieza={pieza}
                estaSeleccionada={!!piezaData}
                cantidad={piezaData?.cantidad || 1}
                onSeleccionar={() => onSeleccionar(pieza)}
                onCambiarCantidad={(cantidad) => onCambiarCantidad(pieza.id, cantidad)}
                onDeseleccionar={() => onDeseleccionar(pieza.id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
})

SeccionPiezasPredefinidas.displayName = 'SeccionPiezasPredefinidas'

// ============================================================================
// COMPONENTE: Item Pieza Personalizada
// ============================================================================
const ItemPiezaPersonalizada = memo(({
  pieza,
  index,
  onActualizarNombre,
  onActualizarCantidad,
  onEliminar
}: {
  pieza: Pieza
  index: number
  onActualizarNombre: (nombre: string) => void
  onActualizarCantidad: (cantidad: number) => void
  onEliminar: () => void
}) => {
  const handleCambiarCantidad = useCallback((nuevaCantidad: number) => {
    onActualizarCantidad(Math.max(1, Math.min(999, nuevaCantidad)))
  }, [onActualizarCantidad])

  return (
    <div className="p-4 bg-purple-500/10 border-2 border-purple-500/30 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-purple-300" />
          </div>
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={pieza.pieza || ''}
              onChange={(e) => onActualizarNombre(e.target.value.slice(0, 100))}
              className="w-full bg-transparent border-none text-white font-medium focus:outline-none focus:ring-0 px-0 placeholder-gray-500"
              placeholder="Nombre de la pieza"
              maxLength={100}
            />
            <p className="text-xs text-purple-300/70">Personalizada</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SelectorCantidadPredefinida
            cantidadActual={pieza.cantidad || 1}
            onCambiarCantidad={handleCambiarCantidad}
            onEliminar={onEliminar}
          />
          
          <button
            type="button"
            onClick={onEliminar}
            className="w-9 h-9 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors touch-manipulation"
            aria-label="Eliminar pieza"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.pieza.pieza === nextProps.pieza.pieza &&
    prevProps.pieza.cantidad === nextProps.pieza.cantidad &&
    prevProps.index === nextProps.index
  )
})

ItemPiezaPersonalizada.displayName = 'ItemPiezaPersonalizada'

// ============================================================================
// COMPONENTE: Sección Piezas Personalizadas
// ============================================================================
const SeccionPiezasPersonalizadas = memo(({
  piezasPersonalizadas,
  onAgregar,
  onEliminar,
  onActualizarNombre,
  onActualizarCantidad
}: {
  piezasPersonalizadas: Array<{ pieza: Pieza, indexReal: number }>
  onAgregar: (nombre: string, cantidad: number) => void
  onEliminar: (indexReal: number) => void
  onActualizarNombre: (indexReal: number, nombre: string) => void
  onActualizarCantidad: (indexReal: number, cantidad: number) => void
}) => {
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState(1)
  const [errorLocal, setErrorLocal] = useState('')

  const handleAgregar = useCallback(() => {
    const nombreTrim = nuevoNombre.trim()
    
    if (!nombreTrim) {
      setErrorLocal('El nombre de la pieza es requerido')
      return
    }

    if (nombreTrim.length > 100) {
      setErrorLocal('El nombre no puede exceder 100 caracteres')
      return
    }

    if (nuevaCantidad < 1 || nuevaCantidad > 999) {
      setErrorLocal('La cantidad debe estar entre 1 y 999')
      return
    }

    onAgregar(nombreTrim, nuevaCantidad)
    setNuevoNombre('')
    setNuevaCantidad(1)
    setErrorLocal('')
  }, [nuevoNombre, nuevaCantidad, onAgregar])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAgregar()
    }
  }, [handleAgregar])

  return (
    <div className="space-y-4">
      {/* Formulario de agregar */}
      <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50">
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-purple-400" />
              Nombre de la pieza
            </label>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => {
                setNuevoNombre(e.target.value.slice(0, 100))
                setErrorLocal('')
              }}
              onKeyPress={handleKeyPress}
              placeholder="Ej: Tornillo especial..."
              className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              maxLength={100}
            />
            <span className="text-xs text-gray-500">
              {nuevoNombre.length}/100 caracteres
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Cantidad
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNuevaCantidad(Math.max(1, nuevaCantidad - 1))}
                className="w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-lg text-white transition-colors touch-manipulation"
              >
                <span className="text-lg font-medium">-</span>
              </button>
              
              <input
                type="number"
                value={nuevaCantidad}
                onChange={(e) => {
                  const valor = parseInt(e.target.value) || 1
                  setNuevaCantidad(Math.max(1, Math.min(999, valor)))
                }}
                min="1"
                max="999"
                className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              
              <button
                type="button"
                onClick={() => setNuevaCantidad(Math.min(999, nuevaCantidad + 1))}
                className="w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-lg text-white transition-colors touch-manipulation"
              >
                <span className="text-lg font-medium">+</span>
              </button>
            </div>
          </div>

          {errorLocal && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{errorLocal}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleAgregar}
            disabled={!nuevoNombre.trim()}
            className="w-full px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 active:bg-purple-500/40 text-purple-300 rounded-lg border border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors touch-manipulation flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Agregar Pieza
          </button>
        </div>
      </div>

      {/* Lista de piezas personalizadas */}
      {piezasPersonalizadas.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-purple-400" />
            Piezas personalizadas ({piezasPersonalizadas.length})
          </h5>
          
          {piezasPersonalizadas.map(({ pieza, indexReal }) => (
            <ItemPiezaPersonalizada
              key={indexReal}
              pieza={pieza}
              index={indexReal}
              onActualizarNombre={(nombre) => onActualizarNombre(indexReal, nombre)}
              onActualizarCantidad={(cantidad) => onActualizarCantidad(indexReal, cantidad)}
              onEliminar={() => onEliminar(indexReal)}
            />
          ))}
        </div>
      )}
    </div>
  )
})

SeccionPiezasPersonalizadas.displayName = 'SeccionPiezasPersonalizadas'

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const PiezasInput = memo(function PiezasInput({
  piezasUsadas,
  onActualizarPieza,
  onAgregarPieza,
  onEliminarPieza,
  error
}: PiezasInputProps) {
  const { user } = useAuth()
  const [piezasPredefinidas, setPiezasPredefinidas] = useState<PiezaPredefinida[]>([])
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string>('')
  const [tabActiva, setTabActiva] = useState<'predefinidas' | 'personalizadas'>('predefinidas')

  useEffect(() => {
    let mounted = true
    
    const cargarPiezas = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }
      
      try {
        const piezas = await obtenerPiezasPredefinidas(user.uid)
        if (mounted) {
          setPiezasPredefinidas(piezas || [])
          setErrorCarga('')
        }
      } catch (error) {
        console.error('Error cargando piezas predefinidas:', error)
        if (mounted) {
          setErrorCarga('Error al cargar piezas predefinidas')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    cargarPiezas()
    
    return () => {
      mounted = false
    }
  }, [user?.uid])

  // Optimización: agregar pieza directamente sin requestAnimationFrame
  const handleSeleccionarPredefinida = useCallback((pieza: PiezaPredefinida) => {
    const nuevoIndex = piezasUsadas.length
    onAgregarPieza()
    // Batch updates
    Promise.resolve().then(() => {
      onActualizarPieza(nuevoIndex, 'pieza', pieza.nombre)
      onActualizarPieza(nuevoIndex, 'cantidad', 1)
      onActualizarPieza(nuevoIndex, 'tipo', 'predefinida')
      onActualizarPieza(nuevoIndex, 'idPredefinida', pieza.id)
    })
  }, [onAgregarPieza, onActualizarPieza, piezasUsadas.length])

  const handleDeseleccionarPredefinida = useCallback((idPieza: string) => {
    const index = piezasUsadas.findIndex(
      p => p?.tipo === 'predefinida' && p.idPredefinida === idPieza
    )
    if (index !== -1) {
      onEliminarPieza(index)
    }
  }, [piezasUsadas, onEliminarPieza])

  const handleCambiarCantidadPredefinida = useCallback((idPieza: string, cantidad: number) => {
    const index = piezasUsadas.findIndex(
      p => p?.tipo === 'predefinida' && p.idPredefinida === idPieza
    )
    if (index !== -1) {
      onActualizarPieza(index, 'cantidad', cantidad)
    }
  }, [piezasUsadas, onActualizarPieza])

  const handleAgregarPersonalizada = useCallback((nombre: string, cantidad: number) => {
    const nuevoIndex = piezasUsadas.length
    onAgregarPieza()
    Promise.resolve().then(() => {
      onActualizarPieza(nuevoIndex, 'pieza', nombre)
      onActualizarPieza(nuevoIndex, 'cantidad', cantidad)
      onActualizarPieza(nuevoIndex, 'tipo', 'personalizada')
    })
  }, [onAgregarPieza, onActualizarPieza, piezasUsadas.length])

  // Memoizar contadores y estadísticas
      const estadisticas = useMemo(() => {
    const predefinidas = piezasUsadas.filter(p => p?.tipo === 'predefinida').length
    const personalizadasConIndex: Array<{ pieza: Pieza, indexReal: number }> = []
    
    piezasUsadas.forEach((pieza, index) => {
      if (pieza?.tipo === 'personalizada') {
        personalizadasConIndex.push({ pieza, indexReal: index })
      }
    })
    
    const total = piezasUsadas.length

    // Validaciones
    const piezasDuplicadas = piezasUsadas.some((pieza, index) => {
      if (!pieza?.pieza?.trim()) return false
      return piezasUsadas.findIndex((p, i) => 
        i !== index && p?.pieza?.toLowerCase() === pieza?.pieza?.toLowerCase()
      ) !== -1
    })

    const piezasSinNombre = piezasUsadas.some(pieza => !pieza?.pieza?.trim())
    const cantidadesInvalidas = piezasUsadas.some(pieza => 
      !pieza?.cantidad || pieza.cantidad < 1 || pieza.cantidad > 999
    )

    return {
      predefinidas,
      personalizadas: personalizadasConIndex,
      total,
      validaciones: {
        piezasDuplicadas,
        piezasSinNombre,
        cantidadesInvalidas
      },
      tieneErrores: piezasDuplicadas || piezasSinNombre || cantidadesInvalidas
    }
  }, [piezasUsadas])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-purple-400" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-white text-base">Componentes y Piezas</h4>
            <p className="text-sm text-gray-400 truncate">
              {estadisticas.total === 0 ? 'Sin piezas' : 
               `${estadisticas.total} ${estadisticas.total === 1 ? 'pieza' : 'piezas'}`
              }
            </p>
          </div>
        </div>
        

      </div>

      {/* Mensajes de error */}
      {errorCarga && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{errorCarga}</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Validaciones */}
      {estadisticas.tieneErrores && (
        <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <p className="text-yellow-300 text-sm font-semibold">Advertencias:</p>
          </div>
          <ul className="text-yellow-300 text-sm space-y-1 ml-7 list-disc">
            {estadisticas.validaciones.piezasDuplicadas && (
              <li>Hay piezas duplicadas</li>
            )}
            {estadisticas.validaciones.piezasSinNombre && (
              <li>Algunas piezas no tienen nombre</li>
            )}
            {estadisticas.validaciones.cantidadesInvalidas && (
              <li>Algunas cantidades no son válidas (1-999)</li>
            )}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-800/40 rounded-lg border border-gray-700/50">
        <button
          type="button"
          onClick={() => setTabActiva('predefinidas')}
          className={`
            flex-1 px-3 py-2.5 rounded-md font-medium text-sm transition-all touch-manipulation
            ${tabActiva === 'predefinidas'
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <Package className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Predefinidas</span>
            {estadisticas.predefinidas > 0 && (
              <span className="px-1.5 py-0.5 bg-green-500/30 rounded-full text-xs font-bold flex-shrink-0">
                {estadisticas.predefinidas}
              </span>
            )}
          </div>
        </button>
        
        <button
          type="button"
          onClick={() => setTabActiva('personalizadas')}
          className={`
            flex-1 px-3 py-2.5 rounded-md font-medium text-sm transition-all touch-manipulation
            ${tabActiva === 'personalizadas'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <Wrench className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Personalizadas</span>
            {estadisticas.personalizadas.length > 0 && (
              <span className="px-1.5 py-0.5 bg-purple-500/30 rounded-full text-xs font-bold flex-shrink-0">
                {estadisticas.personalizadas.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Contenido de tabs */}
      {loading ? (
        <div className="text-center py-12 bg-gray-800/20 rounded-lg border border-gray-700/30">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-400 mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Cargando piezas...</p>
        </div>
      ) : (
        <div className="min-h-[300px]">
          {tabActiva === 'predefinidas' ? (
            <SeccionPiezasPredefinidas
              piezasPredefinidas={piezasPredefinidas}
              piezasUsadas={piezasUsadas}
              onSeleccionar={handleSeleccionarPredefinida}
              onCambiarCantidad={handleCambiarCantidadPredefinida}
              onDeseleccionar={handleDeseleccionarPredefinida}
            />
          ) : (
            <SeccionPiezasPersonalizadas
              piezasPersonalizadas={estadisticas.personalizadas}
              onAgregar={handleAgregarPersonalizada}
              onEliminar={onEliminarPieza}
              onActualizarNombre={(indexReal, nombre) => onActualizarPieza(indexReal, 'pieza', nombre)}
              onActualizarCantidad={(indexReal, cantidad) => onActualizarPieza(indexReal, 'cantidad', cantidad)}
            />
          )}
        </div>

      )}

            {/* Resumen de piezas agregadas */}
      {estadisticas.total > 0 && (
        <div className="p-3 bg-gray-800/40 border border-gray-700/50 rounded-lg">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">
                <span className="font-semibold text-white">{estadisticas.predefinidas}</span> predef.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-purple-400" />
              <span className="text-gray-300">
                <span className="font-semibold text-white">{estadisticas.personalizadas.length}</span> person.
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-gray-300">
                Total: <span className="font-semibold text-white">{estadisticas.total}</span>
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
})

PiezasInput.displayName = 'PiezasInput'

export default PiezasInput