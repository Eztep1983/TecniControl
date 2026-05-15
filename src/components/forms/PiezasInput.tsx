// components/forms/PiezasInput.tsx
'use client'
import { Plus, Trash2, Package, Search, X, AlertCircle } from 'lucide-react'
import { useCallback, memo, useState, useEffect, useMemo, useRef, Dispatch, SetStateAction } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {  obtenerPiezasPredefinidas, PiezaPredefinida } from '@/lib/configuracionTareasR-helpers'
import { crearPieza } from '@/lib/configuracion-helpers'

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
  <div className="flex items-center gap-1 bg-gray-900/80 p-1 rounded-xl border border-gray-700/50 shadow-inner">
    <button
      type="button"
      onClick={() => cantidad > 1 ? onCambiar(cantidad - 1) : onEliminar()}
      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-all text-gray-400 hover:text-white"
      aria-label="Disminuir cantidad"
    >
      <span className="text-xl font-bold select-none">-</span>
    </button>
    
    <input
      type="number"
      value={cantidad}
      onChange={(e) => {
        const val = parseInt(e.target.value) || 0;
        if (val > 0 && val <= 999) onCambiar(val);
      }}
      min="1" max="999"
      className="w-10 sm:w-12 text-center bg-transparent border-none text-white text-sm font-bold focus:ring-0 p-0 select-none appearance-none"
    />
    
    <button
      type="button"
      onClick={() => cantidad < 999 ? onCambiar(cantidad + 1) : null}
      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-all text-gray-400 hover:text-white disabled:opacity-30"
      disabled={cantidad >= 999}
      aria-label="Aumentar cantidad"
    >
      <span className="text-xl font-bold select-none">+</span>
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
    setQuery(''); setIsOpen(false); inputRef.current?.blur()
  }, [setPiezasUsadas])

  const handleAgregarPersonalizada = useCallback((nombre: string) => {
    if (user?.uid) {
      const nuevaPiezaPredefinida: PiezaPredefinida = {
        id: Date.now().toString(),
        nombre: nombre,
        categoria: 'General'
      }
      obtenerPiezasPredefinidas(user.uid).then(todas => {
        const todasSanitizadas = (todas || []).filter(Boolean);
        const piezasActualizadas = [...todasSanitizadas, nuevaPiezaPredefinida];
        crearPieza(user.uid, nuevaPiezaPredefinida).catch(err => {
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
        <div className="relative flex items-center group">
          <Search className="absolute left-4 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
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
            className="w-full pl-12 pr-12 py-4 bg-gray-800/80 border-2 border-gray-700/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-gray-800 transition-all text-base touch-manipulation shadow-inner"
            disabled={loading}
          />
          {query && (
             <button
               type="button"
               onClick={() => { setQuery(''); setIsOpen(false) }}
               className="absolute right-3 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white rounded-xl hover:bg-gray-700/50 transition-colors touch-manipulation"
               aria-label="Limpiar búsqueda"
             >
               <X className="w-5 h-5" />
             </button>
          )}
        </div>

        {/* Dropdown Lista */}
        {isOpen && (!loading) && (opcionesDisponibles.length > 0 || mostrarAgregar) && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-gray-800 border-2 border-gray-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-[100] max-h-72 overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-top-2 duration-200">
            {mostrarAgregar && (
              <button
                type="button"
                onClick={() => handleAgregarPersonalizada(queryLimpio)}
                className="w-full text-left px-5 py-4 border-b border-gray-700/50 hover:bg-purple-500/10 text-purple-300 active:bg-purple-500/20 transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-sm uppercase tracking-wide">Añadir "{queryLimpio}"</span>
                  <span className="text-[11px] text-purple-400/60 font-medium">Repuesto manual</span>
                </div>
              </button>
            )}

            {opcionesDisponibles.map(pieza => (
              <button
                key={pieza.id}
                type="button"
                onClick={() => handleAgregarPredefinida(pieza)}
                className="w-full text-left px-5 py-4 hover:bg-gray-700/40 active:bg-gray-700/60 text-gray-200 transition-all border-b border-gray-700/30 last:border-0 flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-700 flex-shrink-0 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                  <Package className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                </div>
                <div className="flex-1">
                  <span className="block font-medium text-sm sm:text-base leading-tight">{pieza.nombre}</span>
                  {pieza.categoria && <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{pieza.categoria}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Alertas */}
      {errorMostrar && (
        <div className="flex items-center gap-3 text-red-400 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20 animate-in shake duration-500">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{errorMostrar}</p>
        </div>
      )}

      {/* Lista de Repuestos Seleccionados */}
      {piezasUsadas.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Repuestos agregados</h4>
          {piezasUsadas.map((pieza, index) => (
            <div 
              key={`${pieza.tipo}-${pieza.idPredefinida || index}`} 
              className="group flex items-center justify-between p-4 bg-gray-800/40 rounded-2xl border border-gray-700/50 border-l-4 border-l-purple-500/50 shadow-sm animate-in slide-in-from-left-2 duration-300"
            >
              <div className="min-w-0 flex-1 pr-4">
                <span className="block font-bold text-white text-sm sm:text-base truncate">
                  {pieza.pieza}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-tighter text-gray-500">
                  {pieza.tipo === 'personalizada' ? 'Personalizado' : 'Inventario'}
                </span>
              </div>
              
              <div className="flex items-center gap-3 flex-shrink-0">
                <SelectorCantidad 
                  cantidad={pieza.cantidad}
                  onCambiar={(c) => handleCambiarCantidad(index, c)}
                  onEliminar={() => handleEliminar(index)}
                />
                
                <button
                  type="button"
                  onClick={() => handleEliminar(index)}
                  className="w-11 h-11 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 rounded-xl transition-all touch-manipulation shadow-sm"
                  aria-label="Eliminar repuesto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {piezasUsadas.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-gray-700/30 rounded-2xl bg-gray-800/10">
          <div className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center mb-3">
             <Package className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No hay repuestos registrados aún</p>
          <p className="text-gray-600 text-xs mt-1">Busca piezas en el inventario o añádelas manualmente</p>
        </div>
      )}
    </div>
  )
})