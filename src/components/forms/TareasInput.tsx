// components/forms/TareasInput.tsx
'use client'
import { Check, AlertCircle, X, Search, Zap, Plus } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { obtenerTareasPredefinidas, guardarTareasPredefinidas, TareaPredefinida } from '@/lib/configuracionTareasR-helpers'

interface TareasInputProps {
  tipoMantenimiento: 'preventivo' | 'correctivo' | 'diagnostico' | 'instalacion' | ''
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
        const tareasSanitizadas = (tareas || []).filter(Boolean).map(t => ({
          ...t,
          nombre: t.nombre || '',
          tipo: t.tipo || 'preventivo'
        }))
        const filtradas = tareasSanitizadas.filter(t => t.tipo === tipoMantenimiento || t.tipo === 'ambos')
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
      const nombreLimpio = (t.nombre || '').toLowerCase()
      const matchQuery = nombreLimpio.includes(query.toLowerCase())
      const noSeleccionada = !tareasSeleccionadas.includes(t.nombre)
      return matchQuery && noSeleccionada
    })
  }, [tareasPredefinidas, query, tareasSeleccionadas])

  const mostrarOpcionAgregar = query.trim() !== '' && 
    !tareasPredefinidas.some(t => (t.nombre || '').toLowerCase() === query.trim().toLowerCase()) &&
    !tareasSeleccionadas.some(t => t.toLowerCase() === query.trim().toLowerCase()) &&
    !tareasPersonalizadas.some(t => t?.toLowerCase() === query.trim().toLowerCase())

  // Manejadores
  const handleAgregarPersonalizada = useCallback((nuevoValor: string) => {
    if (tareasPersonalizadas.length >= 50) {
      setError('Límite máximo de 50 tareas alcanzado')
      setTimeout(() => setError(null), 3000)
      return
    }

    // Auto-guardado en background como predefinida
    if (user?.uid) {
      const nuevaTareaPredefinida: TareaPredefinida = {
        id: Date.now().toString(),
        nombre: nuevoValor,
        tipo: (tipoMantenimiento === 'preventivo' || tipoMantenimiento === 'correctivo') ? tipoMantenimiento : 'preventivo',
        categoria: 'General'
      }
      obtenerTareasPredefinidas(user.uid).then(todas => {
        const todasSanitizadas = (todas || []).filter(Boolean);
        const tareasActualizadas = [...todasSanitizadas, nuevaTareaPredefinida];
        guardarTareasPredefinidas(user.uid, tareasActualizadas).catch(err => {
          console.error("Error guardando nueva tarea predefinida", err);
        });
      });
      setTareasPredefinidas(prev => [...prev, nuevaTareaPredefinida]);
    }

    onAgregarTareaPersonalizada(nuevoValor)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }, [tareasPersonalizadas.length, onAgregarTareaPersonalizada, user?.uid, tipoMantenimiento])

  const handleSeleccionarPredefinida = useCallback((nombre: string) => {
    onToggleTareaPredefinida(nombre)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
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
        <div className="relative flex items-center group">
          <Search className="absolute left-4 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
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
            className="w-full pl-12 pr-12 py-4 bg-gray-800/80 border-2 border-gray-700/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800 transition-all text-base touch-manipulation shadow-inner"
            disabled={cargando}
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
        {isOpen && (!cargando) && (opcionesDisponibles.length > 0 || mostrarOpcionAgregar) && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-gray-800 border-2 border-gray-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-[100] max-h-72 overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-top-2 duration-200">
            {mostrarOpcionAgregar && (
              <button
                type="button"
                onClick={() => handleAgregarPersonalizada(query.trim())}
                className="w-full text-left px-5 py-4 border-b border-gray-700/50 hover:bg-blue-500/10 text-blue-300 active:bg-blue-500/20 transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-sm uppercase tracking-wide">Añadir "{query.trim()}"</span>
                  <span className="text-[11px] text-blue-400/60 font-medium">Nueva tarea personalizada</span>
                </div>
              </button>
            )}

            {opcionesDisponibles.map(tarea => (
              <button
                key={tarea.id}
                type="button"
                onClick={() => handleSeleccionarPredefinida(tarea.nombre)}
                className="w-full text-left px-5 py-4 hover:bg-gray-700/40 active:bg-gray-700/60 text-gray-200 transition-all border-b border-gray-700/30 last:border-0 flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-700 flex-shrink-0 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                  <Zap className="w-5 h-5 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                </div>
                <div className="flex-1">
                  <span className="block font-medium text-sm sm:text-base leading-tight">{tarea.nombre}</span>
                  {tarea.categoria && <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{tarea.categoria}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Alertas Error */}
      {error && (
        <div className="flex items-center gap-3 text-red-400 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20 animate-in shake duration-500">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Chips (Seleccionadas) */}
      {chips.length > 0 && (
        <div className="flex flex-col gap-2.5 mt-2">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Items seleccionados</h4>
          <div className="flex flex-wrap gap-2.5">
            {chips.map(chip => (
              <div 
                key={chip.id}
                className={`
                  group inline-flex items-center gap-2.5 pl-4 pr-2 py-2 rounded-2xl text-sm font-semibold border transition-all animate-in zoom-in-90 duration-200
                  ${chip.esPredefinida 
                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 shadow-blue-500/5' 
                    : 'bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-purple-500/5'
                  }
                `}
              >
                <span className="max-w-[200px] truncate">{chip.nombre}</span>
                <button
                  type="button"
                  onClick={() => handleEliminarChip(chip)}
                  className={`
                    w-8 h-8 flex items-center justify-center rounded-xl hover:bg-black/20 focus:outline-none transition-colors touch-manipulation
                    ${chip.esPredefinida ? 'text-blue-400 hover:text-blue-200' : 'text-purple-400 hover:text-purple-200'}
                  `}
                  aria-label="Eliminar tarea"
                >
                  <X className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {chips.length === 0 && !cargando && (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-gray-700/30 rounded-2xl bg-gray-800/10">
          <div className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center mb-3">
             <Plus className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No hay actividades registradas aún</p>
          <p className="text-gray-600 text-xs mt-1">Usa el buscador para añadir tareas realizadas</p>
        </div>
      )}
    </div>
  )
  
}