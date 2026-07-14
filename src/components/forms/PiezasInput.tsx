// components/forms/PiezasInput.tsx
'use client'
import { Plus, Trash2, Package, Search, X, AlertCircle, ChevronDown } from 'lucide-react'
import { useCallback, memo, useState, useMemo, useRef, Dispatch, SetStateAction } from 'react'
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from '@/components/ui/drawer'
import { useAuth } from '@/components/auth/AuthProvider'
import { useTareasYPiezas } from '@/hooks/useTareasYPiezas'
import { PiezaPredefinida } from '@/lib/configuracion-helpers'
import { useHapticFeedback } from '@/hooks/clientes/useHapticFeedback'

interface Pieza {
  pieza: string
  cantidad: number
  tipo?: 'predefinida' | 'personalizada'
  idPredefinida?: string
}

interface PiezasInputProps {
  piezasUsadas: Pieza[]
  setPiezasUsadas: Dispatch<SetStateAction<Pieza[]>>
  error?: string
  isOnboarding?: boolean
}

const SelectorCantidad = memo(({ 
  cantidad, 
  nombrePieza,
  onCambiar, 
  onEliminar,
  isOnboarding
}: { 
  cantidad: number, 
  nombrePieza: string,
  onCambiar: (c: number) => void, 
  onEliminar: () => void,
  isOnboarding?: boolean
}) => {
  const { impactLight } = useHapticFeedback()

  return (
    <div className="flex items-center gap-1 dark:bg-gray-900/80 bg-gray-100 p-1 rounded-xl border dark:border-gray-700/50 border-gray-300 shadow-inner">
      <button
        type="button"
        onClick={() => {
          impactLight()
          if (!isOnboarding || cantidad > 1) {
            cantidad > 1 ? onCambiar(cantidad - 1) : onEliminar()
          }
        }}
        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center dark:bg-gray-800 bg-gray-200 hover:dark:bg-gray-700 hover:bg-gray-300 active:dark:bg-gray-600 active:bg-gray-300 rounded-lg transition-all dark:text-gray-400 text-gray-600 hover:dark:text-white hover:text-gray-900"
        aria-label="Disminuir cantidad"
      >
        <span className="text-xl font-bold select-none">-</span>
      </button>
      
      <input
        type="number"
        inputMode="numeric"
        aria-label={`Cantidad de ${nombrePieza}`}
        value={cantidad}
        onChange={(e) => {
          const val = parseInt(e.target.value) || 0;
          if (val > 0 && val <= 999) onCambiar(val);
        }}
        min="1" max="999"
        className="w-10 sm:w-12 text-center bg-transparent border-none dark:text-white text-gray-900 text-sm font-bold focus:ring-0 p-0 select-none appearance-none"
      />
      
      <button
        type="button"
        onClick={() => {
          if (cantidad < 999) {
            impactLight()
            onCambiar(cantidad + 1)
          }
        }}
        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center dark:bg-gray-800 bg-gray-200 hover:dark:bg-gray-700 hover:bg-gray-300 active:dark:bg-gray-600 active:bg-gray-300 rounded-lg transition-all dark:text-gray-400 text-gray-600 hover:dark:text-white hover:text-gray-900 disabled:opacity-30"
        disabled={cantidad >= 999}
        aria-label="Aumentar cantidad"
      >
        <span className="text-xl font-bold select-none">+</span>
      </button>
    </div>
  )
})
SelectorCantidad.displayName = 'SelectorCantidad'

export default memo(function PiezasInput({
  piezasUsadas,
  setPiezasUsadas,
  error: errorExterna,
  isOnboarding
}: PiezasInputProps) {
  const { user } = useAuth()
  const { impactLight, selection, success } = useHapticFeedback()
  const { piezas, isLoading: loading, crearPieza } = useTareasYPiezas()
  const [errorLocal, setErrorLocal] = useState('')

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)
  const ITEMS_POR_PAGINA = 8
  const inputRef = useRef<HTMLInputElement>(null)

  // Filtrar y sanitizar piezas reactivamente desde la caché
  const piezasPredefinidas = useMemo(() => {
    return (piezas || []).filter(Boolean).map(p => ({
      ...p,
      nombre: p.nombre || ''
    }))
  }, [piezas])

  // Optimización de piezas ya agregadas
  const { idsSeleccionadas, nombresPersonalizadas } = useMemo(() => {
    const ids = new Set<string>()
    const names = new Set<string>()
    piezasUsadas.forEach(p => {
      if (p.tipo === 'predefinida' && p.idPredefinida) ids.add(p.idPredefinida)
      if (p.tipo === 'personalizada') names.add(p.pieza.toLowerCase())
    })
    return { idsSeleccionadas: ids, nombresPersonalizadas: names }
  }, [piezasUsadas])

  const opcionesDisponibles = useMemo(() => {
    return piezasPredefinidas.filter(p => 
      (p.nombre || '').toLowerCase().includes(query.toLowerCase()) && !idsSeleccionadas.has(p.id)
    )
  }, [piezasPredefinidas, query, idsSeleccionadas])

  const opcionesPaginadas = useMemo(() => {
    return opcionesDisponibles.slice(0, paginaActual * ITEMS_POR_PAGINA)
  }, [opcionesDisponibles, paginaActual])

  const tieneMasOpciones = opcionesDisponibles.length > opcionesPaginadas.length

  const queryLimpio = query.trim()
  const mostrarAgregar = queryLimpio !== '' && 
    !piezasPredefinidas.some(p => (p.nombre || '').toLowerCase() === queryLimpio.toLowerCase()) &&
    !nombresPersonalizadas.has(queryLimpio.toLowerCase())

  // Acciones
  const handleAgregarPredefinida = useCallback((pieza: PiezaPredefinida) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setIsOpen(false)
    selection()

    setTimeout(() => {
      setPiezasUsadas(prev => [...prev, {
        pieza: pieza.nombre, cantidad: 1, tipo: 'predefinida', idPredefinida: pieza.id
      }])
    }, 200)
  }, [setPiezasUsadas, selection])

  const handleAgregarPersonalizada = useCallback((nombre: string) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setIsOpen(false)
    success()

    setTimeout(() => {
      const existeEnPredefinidas = piezasPredefinidas.some(p => (p.nombre || '').toLowerCase() === nombre.toLowerCase())
      if (!existeEnPredefinidas) {
        crearPieza({
          nombre: nombre,
          categoria: 'General'
        })
      }
      setPiezasUsadas(prev => [...prev, {
        pieza: nombre, cantidad: 1, tipo: 'personalizada'
      }])
    }, 200)
  }, [setPiezasUsadas, crearPieza, success, piezasPredefinidas])

  const handleEliminar = useCallback((index: number) => {
    impactLight()
    setPiezasUsadas(prev => prev.filter((_, i) => i !== index))
  }, [setPiezasUsadas, impactLight])

  const handleCambiarCantidad = useCallback((index: number, calc: number) => {
    setPiezasUsadas(prev => prev.map((p, i) => i === index ? { ...p, cantidad: calc } : p))
  }, [setPiezasUsadas])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (mostrarAgregar) {
        handleAgregarPersonalizada(queryLimpio)
      } else if (opcionesDisponibles.length > 0) {
        handleAgregarPredefinida(opcionesDisponibles[0])
      }
    }
  }, [mostrarAgregar, opcionesDisponibles, queryLimpio, handleAgregarPersonalizada, handleAgregarPredefinida])

  const errorMostrar = errorExterna || errorLocal

  return (
    <div className="space-y-4">
      {/* Alertas */}
      {errorMostrar && (
        <div className="flex items-center gap-3 dark:text-red-400 text-red-700 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20 animate-in shake duration-500">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{errorMostrar}</p>
        </div>
      )}

      {/* Lista de Repuestos Seleccionados */}
      {piezasUsadas.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Repuestos agregados</h4>
          {piezasUsadas.map((pieza, index) => (
            <div 
              key={`${pieza.tipo}-${pieza.idPredefinida || index}`} 
              className="group flex items-center justify-between p-4 dark:bg-gray-800/40 bg-gray-200 rounded-2xl border dark:border-gray-700/50 border-gray-300 border-l-4 border-l-purple-500/50 shadow-sm animate-in slide-in-from-left-2 duration-300"
            >
              <div className="min-w-0 flex-1 pr-4">
                <span className="block font-bold dark:text-white text-gray-900 text-sm sm:text-base truncate">
                  {pieza.pieza}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-tighter text-gray-500">
                  {pieza.tipo === 'personalizada' ? 'Personalizado' : 'Inventario'}
                </span>
              </div>
              
              <div className="flex items-center gap-3 flex-shrink-0">
                <SelectorCantidad 
                  cantidad={pieza.cantidad}
                  nombrePieza={pieza.pieza}
                  onCambiar={(c) => handleCambiarCantidad(index, c)}
                  onEliminar={() => handleEliminar(index)}
                />
                
                <button
                  type="button"
                  onClick={() => handleEliminar(index)}
                  className="w-11 h-11 flex items-center justify-center text-gray-500 hover:dark:text-red-400 hover:text-red-700 hover:bg-red-500/10 active:bg-red-500/20 rounded-xl transition-all touch-manipulation shadow-sm"
                  aria-label={`Eliminar ${pieza.pieza}`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center border-2 border-dashed dark:border-gray-700/30 border-gray-300 rounded-2xl dark:bg-gray-800/10 bg-gray-200">
            <p className="text-gray-500 text-sm font-medium">No hay repuestos registrados aún</p>
          </div>
        )
      )}

      {/* Drawer para Búsqueda */}
      <Drawer open={isOpen} onOpenChange={(open) => {
        setIsOpen(open)
        if (open) {
          setPaginaActual(1)
        } else {
          // Limpiar query después de que termine la animación de cierre
          setTimeout(() => setQuery(''), 300)
        }
      }}>
        <DrawerTrigger asChild>
          <button 
            type="button" 
            className="w-full py-4 dark:bg-gray-800/80 bg-gray-200/80 border-2 dark:border-gray-700/50 border-gray-300 rounded-2xl dark:text-gray-400 text-gray-600 hover:dark:text-white hover:text-gray-900 hover:border-purple-500/50 transition-all text-base font-medium flex items-center justify-center gap-2 shadow-inner"
            disabled={loading}
          >
            <Plus className="w-5 h-5" />
            {loading ? "Cargando repuestos..." : "Añadir repuesto..."}
          </button>
        </DrawerTrigger>
        <DrawerContent className="dark:bg-gray-900 bg-gray-100 border-t dark:border-gray-800 border-gray-200 max-h-[85vh] flex flex-col">
          <DrawerTitle className="sr-only">Buscador de repuestos</DrawerTitle>
          <div className="p-4 border-b dark:border-gray-800 border-gray-200/50 shrink-0">
            <div className="relative flex items-center group">
              <Search className="absolute left-4 w-5 h-5 dark:text-gray-400 text-gray-600 group-focus-within:dark:text-purple-400 text-purple-700 transition-colors pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={true}
                aria-controls="piezas-listbox"
                aria-haspopup="listbox"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPaginaActual(1)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Escribe para buscar o añadir..."
                className="w-full pl-12 pr-12 py-4 dark:bg-gray-800/80 bg-gray-200/80 border-2 dark:border-gray-700/50 border-gray-300 rounded-2xl dark:text-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:dark:bg-gray-800 focus:bg-gray-200 transition-all text-base touch-manipulation shadow-inner"
                autoFocus
              />
              {query && (
                 <button
                   type="button"
                   onClick={() => setQuery('')}
                   className="absolute right-3 w-10 h-10 flex items-center justify-center text-gray-500 hover:dark:text-white hover:text-gray-900 rounded-xl hover:dark:bg-gray-700/50 hover:bg-gray-300 transition-colors touch-manipulation"
                   aria-label="Limpiar búsqueda"
                 >
                   <X className="w-5 h-5" />
                 </button>
              )}
            </div>
          </div>

          <div id="piezas-listbox" role="listbox" className="overflow-y-auto overscroll-contain flex-1 p-0 pb-6">
             {(opcionesDisponibles.length > 0 || mostrarAgregar) ? (
               <div className="flex flex-col">
                  {mostrarAgregar && (
                    <button
                      type="button"
                      role="option"
                      aria-selected="false"
                      onClick={() => handleAgregarPersonalizada(queryLimpio)}
                      className="w-full text-left px-5 py-4 border-b dark:border-gray-800 border-gray-200 hover:bg-purple-500/10 dark:text-purple-300 text-purple-700 active:bg-purple-500/20 transition-all flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5 dark:text-purple-400 text-purple-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-bold text-sm uppercase tracking-wide truncate">Añadir "{queryLimpio}"</span>
                        <span className="text-[11px] dark:text-purple-400 text-purple-700/60 font-medium truncate">Repuesto manual</span>
                      </div>
                    </button>
                  )}
                  {opcionesPaginadas.map(pieza => (
                    <button
                      key={pieza.id}
                      type="button"
                      role="option"
                      aria-selected="false"
                      onClick={() => handleAgregarPredefinida(pieza)}
                      className="w-full text-left px-5 py-4 hover:dark:bg-gray-800/40 hover:bg-gray-200 active:dark:bg-gray-800/60 active:bg-gray-200 dark:text-gray-200 text-gray-800 transition-all border-b dark:border-gray-800 border-gray-200 last:border-0 flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-700 flex-shrink-0 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                        <Package className="w-5 h-5 dark:text-gray-400 text-gray-600 group-hover:dark:text-purple-400 group-hover:text-purple-700 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-medium text-sm sm:text-base leading-tight truncate">{pieza.nombre}</span>
                        {pieza.categoria && <span className="text-[10px] text-gray-500 uppercase tracking-tighter truncate">{pieza.categoria}</span>}
                      </div>
                    </button>
                  ))}
                  {tieneMasOpciones && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPaginaActual(p => p + 1)
                        impactLight()
                      }}
                      className="w-full py-4 text-center dark:text-purple-400 text-purple-700 font-bold text-sm hover:bg-purple-500/5 active:bg-purple-500/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Ver más repuestos
                    </button>
                  )}
               </div>
             ) : (
               <div className="py-12 text-center text-gray-500">
                  <p className="text-sm">No se encontraron resultados</p>
               </div>
             )}
          </div>
          
          <div className="dark:bg-gray-900 bg-gray-100 px-4 py-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest flex justify-between items-center border-t dark:border-gray-800 border-gray-200 shrink-0">
            <span>{opcionesDisponibles.length} repuestos</span>
            {opcionesDisponibles.length > 0 && <span>Pág {paginaActual}</span>}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
})