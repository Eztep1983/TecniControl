// components/forms/PiezasInput.tsx 
'use client'
import { Plus, Trash2, Package, Wrench, Settings, AlertCircle, ChevronDown, X, Check } from 'lucide-react'
import { useCallback, memo, useState, useEffect, useRef } from 'react'
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

const PiezaItem = memo(({ 
  pieza, 
  index, 
  onActualizarPieza, 
  onEliminarPieza,
  piezasPredefinidas 
}: { 
  pieza: Pieza;
  index: number;
  onActualizarPieza: (index: number, campo: string, valor: any) => void;
  onEliminarPieza: (index: number) => void;
  piezasPredefinidas: PiezaPredefinida[];
}) => {
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [modoSeleccion, setModoSeleccion] = useState<'predefinida' | 'personalizada'>('predefinida')
  const inputRef = useRef<HTMLInputElement>(null)
  const sugerenciasRef = useRef<HTMLDivElement>(null)

  // Determinar el modo actual basado en el texto y las piezas predefinidas
  useEffect(() => {
    if (!pieza.pieza.trim()) {
      setModoSeleccion('predefinida')
      return
    }

    // Verificar si el texto coincide exactamente con alguna pieza predefinida
    const coincideExactamente = piezasPredefinidas.some(p => 
      p.nombre.toLowerCase() === pieza.pieza.toLowerCase()
    )

    setModoSeleccion(coincideExactamente ? 'predefinida' : 'personalizada')
  }, [pieza.pieza, piezasPredefinidas])

  const handleCambiarCantidad = useCallback((nuevaCantidad: number) => {
    onActualizarPieza(index, 'cantidad', Math.max(1, nuevaCantidad));
  }, [index, onActualizarPieza]);

  const handleNombreChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    onActualizarPieza(index, 'pieza', valor);
    
    // Mostrar sugerencias automáticamente al escribir
    if (valor.length > 0) {
      setMostrarSugerencias(true);
    } else {
      setMostrarSugerencias(false);
    }
  }, [index, onActualizarPieza]);

  const handleSeleccionarPiezaPredefinida = useCallback((piezaPredefinida: PiezaPredefinida) => {
    onActualizarPieza(index, 'pieza', piezaPredefinida.nombre);
    setModoSeleccion('predefinida')
    setMostrarSugerencias(false);
  }, [index, onActualizarPieza]);

  const handleUsarPiezaPersonalizada = useCallback(() => {
    setModoSeleccion('personalizada')
    setMostrarSugerencias(false)
    // Mantener el texto actual pero marcar como personalizada
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }, []);

  const handleToggleSugerencias = useCallback(() => {
    if (piezasPredefinidas.length === 0) return
    setMostrarSugerencias(!mostrarSugerencias)
  }, [mostrarSugerencias, piezasPredefinidas.length])

  const handleEliminar = useCallback(() => {
    onEliminarPieza(index);
  }, [index, onEliminarPieza]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sugerenciasRef.current && !sugerenciasRef.current.contains(event.target as Node)) {
        setMostrarSugerencias(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar sugerencias basado en el texto ingresado
  const sugerenciasFiltradas = piezasPredefinidas.filter(p => {
    if (!pieza.pieza || pieza.pieza.trim() === '') {
      return true; // Mostrar todas si no hay texto
    }
    return p.nombre.toLowerCase().includes(pieza.pieza.toLowerCase());
  }).slice(0, 6);

  const piezaExacta = piezasPredefinidas.find(p => 
    p.nombre.toLowerCase() === pieza.pieza.toLowerCase()
  );

  return (
    <div className="group relative" ref={sugerenciasRef}>
      <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 bg-gray-800/40 rounded-lg sm:rounded-xl border border-gray-700/50 p-3 sm:p-4 hover:bg-gray-700/40 transition-colors duration-150">
        {/* Icono con indicador de tipo */}
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded flex items-center justify-center flex-shrink-0 ${
          modoSeleccion === 'predefinida' && piezaExacta 
            ? 'bg-green-500/20' 
            : 'bg-purple-500/20'
        }`}>
          {modoSeleccion === 'predefinida' && piezaExacta ? (
            <Package className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
          ) : (
            <Wrench className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
          )}
        </div>
        
        {/* Contenido principal */}
        <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full min-w-0">
          {/* Input de nombre de pieza con selector */}
          <div className="flex-1 w-full min-w-0 relative">
            <div className="flex rounded-lg bg-gray-700/30 border border-gray-600/50 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={pieza.pieza}
                onChange={handleNombreChange}
                onFocus={() => piezasPredefinidas.length > 0 && setMostrarSugerencias(true)}
                placeholder={
                  modoSeleccion === 'predefinida' 
                    ? "Selecciona o busca una pieza predefinida..."
                    : "Escribe el nombre de la pieza personalizada..."
                }
                className="flex-1 bg-transparent border-none rounded-l-lg px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none"
                aria-label={`Nombre de la pieza ${index + 1}`}
              />
              
              {/* Botón desplegable para piezas predefinidas */}
              {piezasPredefinidas.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSugerencias}
                  className="px-2 border-l border-gray-600/50 hover:bg-gray-600/30 transition-colors flex items-center"
                  aria-label="Mostrar piezas predefinidas"
                >
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                    mostrarSugerencias ? 'rotate-180' : ''
                  }`} />
                </button>
              )}
            </div>
            
            {/* Indicador de tipo */}
            {pieza.pieza && (
              <div className="absolute -top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  modoSeleccion === 'predefinida' && piezaExacta
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {modoSeleccion === 'predefinida' && piezaExacta ? 'Predefinida' : 'Personalizada'}
                </span>
              </div>
            )}
            
            {/* Panel de sugerencias */}
            {mostrarSugerencias && piezasPredefinidas.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                {/* Header */}
                <div className="p-3 bg-gray-700/50 border-b border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">Piezas Predefinidas</span>
                    <span className="text-xs text-gray-400">
                      {sugerenciasFiltradas.length} de {piezasPredefinidas.length}
                    </span>
                  </div>
                </div>

                {/* Lista de sugerencias */}
                {sugerenciasFiltradas.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No se encontraron piezas</p>
                  </div>
                ) : (
                  <>
                    {sugerenciasFiltradas.map((piezaPredefinida) => (
                      <button
                        key={piezaPredefinida.id}
                        type="button"
                        onClick={() => handleSeleccionarPiezaPredefinida(piezaPredefinida)}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/70 transition-colors border-b border-gray-700/50 last:border-b-0"
                      >
                        <div className="font-medium text-white flex items-center justify-between">
                          {piezaPredefinida.nombre}
                          {pieza.pieza.toLowerCase() === piezaPredefinida.nombre.toLowerCase() && (
                            <Check className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        {piezaPredefinida.categoria && piezaPredefinida.categoria !== 'General' && (
                          <div className="text-xs text-purple-400 mt-1">
                            {piezaPredefinida.categoria}
                          </div>
                        )}
                      </button>
                    ))}
                  </>
                )}

                {/* Opción para pieza personalizada */}
                {pieza.pieza.trim() && !piezaExacta && (
                  <>
                    <div className="border-t border-gray-600"></div>
                    <button
                      type="button"
                      onClick={handleUsarPiezaPersonalizada}
                      className="w-full text-left px-4 py-3 text-sm text-purple-300 hover:bg-purple-500/10 transition-colors"
                    >
                      <div className="font-medium flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Usar "{pieza.pieza}" como pieza personalizada
                      </div>
                      <div className="text-xs text-purple-400 mt-1">
                        Esta pieza no está en la lista predefinida
                      </div>
                    </button>
                  </>
                )}

                {/* Footer con link a configuración */}
                <div className="p-2 bg-gray-700/30 border-t border-gray-600">
                  <Link 
                    href="/configuracion/tareas-repuestos"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Gestionar piezas predefinidas
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Controles de cantidad */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap flex-shrink-0">
              Cantidad:
            </span>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => handleCambiarCantidad(pieza.cantidad - 1)}
                disabled={pieza.cantidad <= 1}
                className="w-6 h-6 flex items-center justify-center bg-gray-700/50 rounded text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Reducir cantidad"
              >
                -
              </button>
              <input
                type="number"
                value={pieza.cantidad}
                onChange={(e) => {
                  const nuevaCantidad = parseInt(e.target.value) || 1;
                  handleCambiarCantidad(nuevaCantidad);
                }}
                min="1"
                className="w-12 sm:w-16 bg-gray-700/50 border border-gray-600/50 rounded px-2 py-1 text-white text-center text-sm focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-colors"
                aria-label="Cantidad de piezas"
              />
              <button
                type="button"
                onClick={() => handleCambiarCantidad(pieza.cantidad + 1)}
                className="w-6 h-6 flex items-center justify-center bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        {/* Botón eliminar */}
        <button
          type="button"
          onClick={handleEliminar}
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors duration-200 opacity-80 hover:opacity-100 xs:opacity-0 xs:group-hover:opacity-100 self-end xs:self-auto mt-2 xs:mt-0 flex-shrink-0"
          aria-label={`Eliminar pieza ${pieza.pieza}`}
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
});

PiezaItem.displayName = 'PiezaItem';

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

  useEffect(() => {
    cargarPiezasPredefinidas()
  }, [user?.uid])

  const cargarPiezasPredefinidas = async () => {
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
  }

  const agregarPiezaPredefinida = (piezaPredefinida: PiezaPredefinida) => {
    onAgregarPieza()
    // Usar timeout para asegurar que la nueva pieza se ha agregado
    setTimeout(() => {
      const nuevoIndex = piezasUsadas.length
      onActualizarPieza(nuevoIndex, 'pieza', piezaPredefinida.nombre)
    }, 10)
  }

  const agregarPiezaPersonalizada = () => {
    onAgregarPieza()
    // La pieza personalizada empieza vacía, el usuario puede escribir lo que necesite
  }

  const tienePiezas = piezasUsadas.length > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-white text-sm sm:text-base truncate">Componentes y Piezas</h4>
            <p className="text-xs sm:text-sm text-gray-400 truncate">
              Selecciona piezas predefinidas o crea personalizadas
              {loading ? ' (cargando...)' : 
               piezasPredefinidas.length > 0 ? ` (${piezasPredefinidas.length} predefinidas disponibles)` : 
               ' (sin piezas predefinidas)'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 w-full xs:w-auto">
          <Link 
            href="/configuracion/tareas-repuestos"
            className="text-purple-400 hover:text-purple-300 text-sm transition-colors flex items-center px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/20"
            title="Configurar piezas predefinidas"
          >
            <Settings className="w-4 h-4 mr-1" />
            Configurar
          </Link>
        </div>
      </div>

      {/* Mensaje de error de carga */}
      {errorCarga && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{errorCarga}</p>
        </div>
      )}

      {/* Mensaje de error de validación */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {tienePiezas ? (
        <div className="space-y-2 sm:space-y-3">
          {piezasUsadas.map((pieza, index) => (
            <PiezaItem
              key={index}
              pieza={pieza}
              index={index}
              onActualizarPieza={onActualizarPieza}
              onEliminarPieza={onEliminarPieza}
              piezasPredefinidas={piezasPredefinidas}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Vista previa de piezas predefinidas disponibles */}
          {piezasPredefinidas.length > 0 && (
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/20">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-300">Piezas Predefinidas Disponibles</h5>
                <span className="text-xs text-gray-500">{piezasPredefinidas.length} piezas</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {piezasPredefinidas.slice(0, 9).map((pieza) => (
                  <button
                    key={pieza.id}
                    type="button"
                    onClick={() => agregarPiezaPredefinida(pieza)}
                    className="text-left p-2 bg-gray-700/30 hover:bg-gray-700/50 rounded border border-gray-600/30 hover:border-green-500/40 transition-colors group"
                  >
                    <div className="text-xs font-medium text-white truncate flex items-center">
                      <Package className="w-3 h-3 mr-1 text-green-400" />
                      {pieza.nombre}
                    </div>
                    {pieza.categoria && pieza.categoria !== 'General' && (
                      <div className="text-xs text-green-400 truncate mt-1">{pieza.categoria}</div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Haz clic en una pieza para agregarla directamente
              </p>
            </div>
          )}

          {/* Opción para pieza personalizada */}
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/20">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-medium text-gray-300">Pieza Personalizada</h5>
              <Wrench className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Crea una pieza personalizada si no encuentras lo que necesitas en la lista predefinida
            </p>
            <button
              type="button"
              onClick={agregarPiezaPersonalizada}
              className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Pieza Personalizada</span>
            </button>
          </div>
        </div>
      )}

      {/* Botones de acción cuando ya hay piezas */}
      {tienePiezas && (
        <div className="flex flex-col sm:flex-row gap-2">
          {piezasPredefinidas.length > 0 && (
            <button
              type="button"
              onClick={() => agregarPiezaPredefinida(piezasPredefinidas[0])}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg border border-green-500/30 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Pieza Predefinida</span>
            </button>
          )}
          
          <button
            type="button"
            onClick={agregarPiezaPersonalizada}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/30 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Pieza Personalizada</span>
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-4 bg-gray-800/20 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-gray-400 text-sm mt-2">Cargando piezas predefinidas...</p>
        </div>
      )}
    </div>
  );
});

PiezasInput.displayName = 'PiezasInput';

export default PiezasInput;