// components/forms/TareasInput.tsx
'use client'
import { Check, AlertCircle, X, Search, Zap, Plus } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { obtenerTareasPredefinidas, TareaPredefinida } from '@/lib/configuracionTareasR-helpers'

interface TareasInputProps {
  tipoMantenimiento: 'preventivo' | 'correctivo' | 'diagnostico'
  tareasSeleccionadas: string[]
  tareasPersonalizadas: string[]
  onToggleTareaPredefinida: (tarea: string) => void
  onActualizarTareaPersonalizada: (index: number, valor: string) => void
  onAgregarTareaPersonalizada: (valor?: string) => void
  onEliminarTareaPersonalizada: (index: number) => void
}

export default function TareasInput({
  tipoMantenimiento,
  tareasSeleccionadas = [],
  tareasPersonalizadas = [],
  onToggleTareaPredefinida,
  onActualizarTareaPersonalizada,
  onAgregarTareaPersonalizada,
  onEliminarTareaPersonalizada
}: TareasInputProps) {
  const { user } = useAuth()
  const [tareasPredefinidas, setTareasPredefinidas] = useState<TareaPredefinida[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cargar tareas al montar
  useEffect(() => {
    const cargarTareas = async () => {
      if (!user?.uid) {
        setCargando(false)
        return
      }
      setCargando(true)
      try {
        const tareas = await obtenerTareasPredefinidas(user.uid)
        const filtradas = tareas.filter(t => t.tipo === tipoMantenimiento || t.tipo === 'ambos')
        setTareasPredefinidas(filtradas)
      } catch (err) {
        console.error('Error cargando tareas:', err)
        setError('Error al cargar tareas predefinidas')
      } finally {
        setCargando(false)
      }
    }
    cargarTareas()
  }, [user?.uid, tipoMantenimiento])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Consolidar chips a mostrar
  const chips = useMemo(() => {
    const normalizadas = [
      ...tareasSeleccionadas.map(t => ({ id: `pred-${t}`, nombre: t, esPredefinida: true, idx: -1 })),
      ...tareasPersonalizadas.map((t, i) => ({ id: `pers-${i}`, nombre: t, esPredefinida: false, idx: i }))
    ]
    return normalizadas.filter(c => c.nombre && c.nombre.trim() !== '')
  }, [tareasSeleccionadas, tareasPersonalizadas])

  // Opciones filtradas descartando ya seleccionadas
  const opcionesDisponibles = useMemo(() => {
    return tareasPredefinidas.filter(t => {
      const matchQuery = t.nombre.toLowerCase().includes(query.toLowerCase())
      const noSeleccionada = !tareasSeleccionadas.includes(t.nombre)
      return matchQuery && noSeleccionada
    })
  }, [tareasPredefinidas, query, tareasSeleccionadas])

  const mostrarOpcionAgregar = query.trim() !== '' && 
    !tareasPredefinidas.some(t => t.nombre.toLowerCase() === query.trim().toLowerCase()) &&
    !tareasSeleccionadas.some(t => t.toLowerCase() === query.trim().toLowerCase()) &&
    !tareasPersonalizadas.some(t => t?.toLowerCase() === query.trim().toLowerCase())

  // Manejadores
  const handleAgregarPersonalizada = useCallback((nuevoValor: string) => {
    if (tareasPersonalizadas.length >= 50) {
      setError('Límite máximo de 50 tareas alcanzado')
      setTimeout(() => setError(null), 3000)
      return
    }
    onAgregarTareaPersonalizada(nuevoValor)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }, [tareasPersonalizadas.length, onAgregarTareaPersonalizada])

  const handleSeleccionarPredefinida = useCallback((nombre: string) => {
    onToggleTareaPredefinida(nombre)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }, [onToggleTareaPredefinida])

  const handleEliminarChip = useCallback((chip: typeof chips[0]) => {
    if (chip.esPredefinida) {
      onToggleTareaPredefinida(chip.nombre)
    } else {
      onEliminarTareaPersonalizada(chip.idx)
    }
  }, [onToggleTareaPredefinida, onEliminarTareaPersonalizada])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (mostrarOpcionAgregar) {
        handleAgregarPersonalizada(query.trim())
      } else if (opcionesDisponibles.length > 0) {
        handleSeleccionarPredefinida(opcionesDisponibles[0].nombre)
      }
    }
  }, [mostrarOpcionAgregar, query, opcionesDisponibles, handleAgregarPersonalizada, handleSeleccionarPredefinida])

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
            placeholder={cargando ? "Cargando tareas..." : "Busca o añade una tarea..."}
            className="w-full pl-10 pr-10 py-3.5 bg-gray-800/80 border-2 border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800 transition-all text-base touch-manipulation"
            disabled={cargando}
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
        {isOpen && (!cargando) && (opcionesDisponibles.length > 0 || mostrarOpcionAgregar) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border-2 border-gray-700/80 rounded-xl shadow-xl shadow-black/50 overflow-hidden z-[60] max-h-60 overflow-y-auto overscroll-contain">
            {mostrarOpcionAgregar && (
              <button
                type="button"
                onClick={() => handleAgregarPersonalizada(query.trim())}
                className="w-full text-left px-4 py-3 border-b border-gray-700/50 hover:bg-gray-700/50 text-blue-300 active:bg-gray-700 transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex-shrink-0 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <span className="block font-medium">Añadir "{query.trim()}"</span>
                  <span className="text-xs text-blue-400/70">Como tarea nueva</span>
                </div>
              </button>
            )}

            {opcionesDisponibles.map(tarea => (
              <button
                key={tarea.id}
                type="button"
                onClick={() => handleSeleccionarPredefinida(tarea.nombre)}
                className="w-full text-left px-4 py-3 hover:bg-gray-700/30 active:bg-gray-700/50 text-gray-200 transition-colors border-b border-gray-700/30 last:border-0 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex-shrink-0 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-gray-400" />
                </div>
                <span className="break-words">{tarea.nombre}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Alertas Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Chips (Seleccionadas) */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {chips.map(chip => (
            <div 
              key={chip.id}
              className={`
                group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                ${chip.esPredefinida 
                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' 
                  : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                }
              `}
            >
              <span>{chip.nombre}</span>
              <button
                type="button"
                onClick={() => handleEliminarChip(chip)}
                className={`
                  p-0.5 rounded-full hover:bg-black/20 focus:outline-none transition-colors 
                  ${chip.esPredefinida ? 'text-blue-400 hover:text-blue-200' : 'text-purple-400 hover:text-purple-200'}
                `}
                aria-label="Eliminar tarea"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {chips.length === 0 && !cargando && (
        <div className="text-center py-4 text-gray-500 text-sm border-2 border-dashed border-gray-700/30 rounded-xl">
          No hay actividades registradas aún
        </div>
      )}
    </div>
  )
}