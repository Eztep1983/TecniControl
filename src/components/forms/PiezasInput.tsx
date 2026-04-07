// components/forms/PiezasInput.tsx
'use client'
import { Plus, Trash2, Package, Search, X, AlertCircle } from 'lucide-react'
import { useCallback, memo, useState, useEffect, useMemo, useRef, Dispatch, SetStateAction } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { obtenerPiezasPredefinidas, guardarPiezasPredefinidas, PiezaPredefinida } from '@/lib/configuracionTareasR-helpers'

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
}

const SelectorCantidad = memo(({ 
  cantidad, 
  onCambiar, 
  onEliminar 
}: { 
  cantidad: number, 
  onCambiar: (c: number) => void, 
  onEliminar: () => void 
}) => (
  <div className="flex items-center gap-1.5 bg-gray-900/50 p-1 rounded-lg border border-gray-700/50">
    <button
      type="button"
      onClick={() => cantidad > 1 ? onCambiar(cantidad - 1) : onEliminar()}
      className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-md transition-colors"
      aria-label="Disminuir cantidad"
    >
      <span className="text-lg font-medium select-none">-</span>
    </button>
    
    <input
      type="number"
      value={cantidad}
      onChange={(e) => {
        const val = parseInt(e.target.value) || 0;
        if (val > 0 && val <= 999) onCambiar(val);
      }}
      min="1" max="999"
      className="w-10 text-center bg-transparent border-none text-white text-sm focus:ring-0 p-0 select-none appearance-none"
    />
    
    <button
      type="button"
      onClick={() => cantidad < 999 ? onCambiar(cantidad + 1) : null}
      className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
      disabled={cantidad >= 999}
      aria-label="Aumentar cantidad"
    >
      <span className="text-lg font-medium select-none">+</span>
    </button>
  </div>
))
SelectorCantidad.displayName = 'SelectorCantidad'

export default memo(function PiezasInput({
  piezasUsadas,
  setPiezasUsadas,
  error: errorExterna
}: PiezasInputProps) {
  const { user } = useAuth()
  const [piezasPredefinidas, setPiezasPredefinidas] = useState<PiezaPredefinida[]>([])
  const [loading, setLoading] = useState(true)
  const [errorLocal, setErrorLocal] = useState('')

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const cargarPiezas = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }
      try {
        const piezas = await obtenerPiezasPredefinidas(user.uid)
        const piezasSanitizadas = (piezas || []).filter(Boolean).map(p => ({
          ...p,
          nombre: p.nombre || ''
        }))
        setPiezasPredefinidas(piezasSanitizadas)
      } catch (err) {
        console.error('Error cargando piezas:', err)
        setErrorLocal('Error al cargar piezas predefinidas')
      } finally {
        setLoading(false)
      }
    }
    cargarPiezas()
  }, [user?.uid])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Optimización de piezas ya agregadas
  const idsSeleccionadas = useMemo(() => {
    const ids = new Set<string>()
    piezasUsadas.forEach(p => {
      if (p.tipo === 'predefinida' && p.idPredefinida) {
        ids.add(p.idPredefinida)
      }
    })
    return ids
  }, [piezasUsadas])

  const nombresPersonalizadas = useMemo(() => {
    const names = new Set<string>()
    piezasUsadas.forEach(p => {
      if (p.tipo === 'personalizada') names.add(p.pieza.toLowerCase())
    })
    return names
  }, [piezasUsadas])

  const opcionesDisponibles = useMemo(() => {
    return piezasPredefinidas.filter(p => 
      (p.nombre || '').toLowerCase().includes(query.toLowerCase()) && !idsSeleccionadas.has(p.id)
    )
  }, [piezasPredefinidas, query, idsSeleccionadas])

  const queryLimpio = query.trim()
  const mostrarAgregar = queryLimpio !== '' && 
    !piezasPredefinidas.some(p => (p.nombre || '').toLowerCase() === queryLimpio.toLowerCase()) &&
    !nombresPersonalizadas.has(queryLimpio.toLowerCase())

  // Acciones
  const handleAgregarPredefinida = useCallback((pieza: PiezaPredefinida) => {
    setPiezasUsadas(prev => [...prev, {
      pieza: pieza.nombre, cantidad: 1, tipo: 'predefinida', idPredefinida: pieza.id
    }])
    setQuery(''); setIsOpen(false); inputRef.current?.focus()
  }, [setPiezasUsadas])

  const handleAgregarPersonalizada = useCallback((nombre: string) => {
    // Auto-guardado en background como predefinida
    if (user?.uid) {
      const nuevaPiezaPredefinida: PiezaPredefinida = {
        id: Date.now().toString(),
        nombre: nombre,
        categoria: 'General'
      }
      obtenerPiezasPredefinidas(user.uid).then(todas => {
        const todasSanitizadas = (todas || []).filter(Boolean);
        const piezasActualizadas = [...todasSanitizadas, nuevaPiezaPredefinida];
        guardarPiezasPredefinidas(user.uid, piezasActualizadas).catch(err => {
          console.error("Error guardando nueva pieza predefinida", err);
        });
      });
      setPiezasPredefinidas(prev => [...prev, nuevaPiezaPredefinida]);
    }

    setPiezasUsadas(prev => [...prev, {
      pieza: nombre, cantidad: 1, tipo: 'personalizada'
    }])
    setQuery(''); setIsOpen(false); inputRef.current?.blur()
  }, [setPiezasUsadas, user?.uid])

  const handleEliminar = useCallback((index: number) => {
    setPiezasUsadas(prev => prev.filter((_, i) => i !== index))
  }, [setPiezasUsadas])

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
      {/* Search Input (Omnibox) */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={loading ? "Cargando repuestos..." : "Busca o añade un repuesto..."}
            className="w-full pl-10 pr-10 py-3.5 bg-gray-800/80 border-2 border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-gray-800 transition-all text-base touch-manipulation"
            disabled={loading}
          />
          {query && (
             <button
               type="button"
               onClick={() => { setQuery(''); setIsOpen(false) }}
               className="absolute right-3 p-1.5 text-gray-400 hover:text-white rounded-md touch-manipulation"
             >
               <X className="w-4 h-4" />
             </button>
          )}
        </div>

        {/* Dropdown Lista */}
        {isOpen && (!loading) && (opcionesDisponibles.length > 0 || mostrarAgregar) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border-2 border-gray-700/80 rounded-xl shadow-xl shadow-black/50 overflow-hidden z-[60] max-h-60 overflow-y-auto overscroll-contain">
            {mostrarAgregar && (
              <button
                type="button"
                onClick={() => handleAgregarPersonalizada(queryLimpio)}
                className="w-full text-left px-4 py-3 border-b border-gray-700/50 hover:bg-gray-700/50 text-purple-300 active:bg-gray-700 transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex-shrink-0 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <span className="block font-medium">Añadir "{queryLimpio}"</span>
                  <span className="text-xs text-purple-400/70">Como pieza manual</span>
                </div>
              </button>
            )}

            {opcionesDisponibles.map(pieza => (
              <button
                key={pieza.id}
                type="button"
                onClick={() => handleAgregarPredefinida(pieza)}
                className="w-full text-left px-4 py-3 hover:bg-gray-700/30 active:bg-gray-700/50 text-gray-200 transition-colors border-b border-gray-700/30 last:border-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-700 flex-shrink-0 flex items-center justify-center">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <span className="block">{pieza.nombre}</span>
                    {pieza.categoria && <span className="text-xs text-gray-500">{pieza.categoria}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Alertas */}
      {errorMostrar && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>{errorMostrar}</p>
        </div>
      )}

      {/* Lista de Repuestos Seleccionados (Compacta Vertical) */}
      {piezasUsadas.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {piezasUsadas.map((pieza, index) => (
            <div 
              key={`${pieza.tipo}-${pieza.idPredefinida || index}`} 
              className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-gray-700/50 border-l-4 border-l-purple-500/50"
            >
              <div className="min-w-0 flex-1 pr-3">
                <span className="block font-medium text-white truncate max-w-full">
                  {pieza.pieza}
                </span>
                <span className="text-xs text-gray-500">
                  {pieza.tipo === 'personalizada' ? 'Personalizada' : 'De inventario'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <SelectorCantidad 
                  cantidad={pieza.cantidad}
                  onCambiar={(c) => handleCambiarCantidad(index, c)}
                  onEliminar={() => handleEliminar(index)}
                />
                
                <button
                  type="button"
                  onClick={() => handleEliminar(index)}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                  aria-label="Eliminar repuesto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {piezasUsadas.length === 0 && !loading && (
        <div className="text-center py-4 text-gray-500 text-sm border-2 border-dashed border-gray-700/30 rounded-xl">
          No hay piezas registradas aún
        </div>
      )}
    </div>
  )
})