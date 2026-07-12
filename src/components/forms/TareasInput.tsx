// components/forms/TareasInput.tsx
'use client'
import { Check, AlertCircle, X, Search, Zap, Plus, ChevronDown } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from '@/components/ui/drawer'
import { useAuth } from '@/components/auth/AuthProvider'
import { useTareasYPiezas } from '@/hooks/useTareasYPiezas'
import { TareaPredefinida } from '@/lib/configuracion-helpers'
import { useHapticFeedback } from '@/hooks/clientes/useHapticFeedback'

interface TareasInputProps {
  tipoMantenimiento: 'preventivo' | 'correctivo' | 'diagnostico' | 'instalacion' | 'garantia' | ''
  tareasSeleccionadas: string[]
  tareasPersonalizadas: string[]
  onToggleTareaPredefinida: (tarea: string) => void
  onActualizarTareaPersonalizada: (index: number, valor: string) => void
  onAgregarTareaPersonalizada: (valor?: string) => void
  onEliminarTareaPersonalizada: (index: number) => void
}

export default memo(function TareasInput({
  tipoMantenimiento,
  tareasSeleccionadas = [],
  tareasPersonalizadas = [],
  onToggleTareaPredefinida,
  onActualizarTareaPersonalizada,
  onAgregarTareaPersonalizada,
  onEliminarTareaPersonalizada
}: TareasInputProps) {
  const { user } = useAuth()
  const { impactLight, selection, success, error: hapticError } = useHapticFeedback()
  const { tareas, isLoading: cargando, crearTarea } = useTareasYPiezas()
  const [error, setError] = useState<string | null>(null)
  
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)
  const ITEMS_POR_PAGINA = 8
  const inputRef = useRef<HTMLInputElement>(null)

  // Filtrar tareas reactivamente desde la caché
  const tareasPredefinidas = useMemo(() => {
    const tareasSanitizadas = (tareas || []).filter(Boolean).map(t => ({
      ...t,
      nombre: t.nombre || '',
      tipo: t.tipo || 'preventivo'
    }))
    return tareasSanitizadas.filter(t => t.tipo === tipoMantenimiento || t.tipo === 'ambos')
  }, [tareas, tipoMantenimiento])

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

  const opcionesPaginadas = useMemo(() => {
    return opcionesDisponibles.slice(0, paginaActual * ITEMS_POR_PAGINA)
  }, [opcionesDisponibles, paginaActual])

  const tieneMasOpciones = opcionesDisponibles.length > opcionesPaginadas.length

  const mostrarOpcionAgregar = query.trim() !== '' && 
    !tareasPredefinidas.some(t => (t.nombre || '').toLowerCase() === query.trim().toLowerCase()) &&
    !tareasSeleccionadas.some(t => t.toLowerCase() === query.trim().toLowerCase()) &&
    !tareasPersonalizadas.some(t => t?.toLowerCase() === query.trim().toLowerCase())

  // Manejadores
  const handleAgregarPersonalizada = useCallback((nuevoValor: string) => {
    if (tareasPersonalizadas.length >= 50) {
      setError('Límite máximo de 50 tareas alcanzado')
      hapticError()
      setTimeout(() => setError(null), 3000)
      return
    }

    const tipoNuevaTarea = (tipoMantenimiento === 'preventivo' || tipoMantenimiento === 'correctivo') ? tipoMantenimiento : 'preventivo'

    // Ocultar teclado y cerrar modal primero para animaciones fluidas
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setIsOpen(false)
    success()
    
    // Retrasar la actualización del estado para no desmontar el botón durante el click (previene bug de scroll lock en vaul)
    setTimeout(() => {
      const existeEnPredefinidas = tareasPredefinidas.some(t => (t.nombre || '').toLowerCase() === nuevoValor.toLowerCase())
      if (!existeEnPredefinidas) {
        crearTarea({
          nombre: nuevoValor,
          tipo: tipoNuevaTarea,
          categoria: 'General'
        })
      }
      onAgregarTareaPersonalizada(nuevoValor)
    }, 200)
  }, [tareasPersonalizadas.length, onAgregarTareaPersonalizada, crearTarea, tipoMantenimiento, success, hapticError, tareasPredefinidas])

  const handleSeleccionarPredefinida = useCallback((nombre: string) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setIsOpen(false)
    selection()
    
    setTimeout(() => {
      onToggleTareaPredefinida(nombre)
    }, 200)
  }, [onToggleTareaPredefinida, selection])

  const handleEliminarChip = useCallback((chip: typeof chips[0]) => {
    impactLight()
    if (chip.esPredefinida) {
      onToggleTareaPredefinida(chip.nombre)
    } else {
      onEliminarTareaPersonalizada(chip.idx)
    }
  }, [onToggleTareaPredefinida, onEliminarTareaPersonalizada, impactLight])

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
      {/* Alertas Error */}
      {error && (
        <div className="flex items-center gap-3 dark:text-red-400 text-red-700 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20 animate-in shake duration-500">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Chips (Seleccionadas) */}
      {chips.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Items seleccionados</h4>
          <div className="flex flex-wrap gap-2.5">
            {chips.map(chip => (
              <div 
                key={chip.id}
                className={`
                  group inline-flex items-center gap-2.5 pl-4 pr-2 py-2 rounded-2xl text-sm font-semibold border transition-all animate-in zoom-in-90 duration-200
                  ${chip.esPredefinida 
                    ? 'bg-blue-500/10 dark:text-blue-300 text-blue-700 border-blue-500/30 shadow-blue-500/5' 
                    : 'bg-purple-500/10 dark:text-purple-300 text-purple-700 border-purple-500/30 shadow-purple-500/5'
                  }
                `}
              >
                <span className="min-w-0 flex-1 truncate">{chip.nombre}</span>
                <button
                  type="button"
                  onClick={() => handleEliminarChip(chip)}
                  className={`
                    w-8 h-8 flex items-center justify-center rounded-xl hover:bg-black/20 focus:outline-none transition-colors touch-manipulation
                    ${chip.esPredefinida ? 'dark:text-blue-400 text-blue-700 hover:dark:text-blue-200 hover:text-blue-800' : 'dark:text-purple-400 text-purple-700 hover:dark:text-purple-200 hover:text-purple-800'}
                  `}
                  aria-label={`Eliminar ${chip.nombre}`}
                >
                  <X className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !cargando && (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center border-2 border-dashed dark:border-gray-700/30 border-gray-300 rounded-2xl dark:bg-gray-800/10 bg-gray-200">
            <p className="text-gray-500 text-sm font-medium">No hay actividades registradas aún</p>
          </div>
        )
      )}

      {/* Botón para abrir el Drawer */}
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
            className="w-full py-4 dark:bg-gray-800/80 bg-gray-200/80 border-2 dark:border-gray-700/50 border-gray-300 rounded-2xl dark:text-gray-400 text-gray-600 hover:dark:text-white hover:text-gray-900 hover:border-blue-500/50 transition-all text-base font-medium flex items-center justify-center gap-2 shadow-inner"
            disabled={cargando}
          >
            <Plus className="w-5 h-5" />
            {cargando ? "Cargando tareas..." : "Añadir tarea..."}
          </button>
        </DrawerTrigger>
        <DrawerContent className="dark:bg-gray-900 bg-gray-100 border-t dark:border-gray-800 border-gray-200 max-h-[85vh] flex flex-col">
          <DrawerTitle className="sr-only">Buscador de tareas</DrawerTitle>
          <div className="p-4 border-b dark:border-gray-800 border-gray-200/50 shrink-0">
            <div className="relative flex items-center group">
              <Search className="absolute left-4 w-5 h-5 dark:text-gray-400 text-gray-600 group-focus-within:dark:text-blue-400 text-blue-700 transition-colors pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={true}
                aria-controls="tareas-listbox"
                aria-haspopup="listbox"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPaginaActual(1)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Escribe para buscar o añadir..."
                className="w-full pl-12 pr-12 py-4 dark:bg-gray-800/80 bg-gray-200/80 border-2 dark:border-gray-700/50 border-gray-300 rounded-2xl dark:text-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:dark:bg-gray-800 focus:bg-gray-200 transition-all text-base touch-manipulation shadow-inner"
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

          <div id="tareas-listbox" role="listbox" className="overflow-y-auto overscroll-contain flex-1 p-0 pb-6">
             {(opcionesDisponibles.length > 0 || mostrarOpcionAgregar) ? (
               <div className="flex flex-col">
                  {mostrarOpcionAgregar && (
                    <button
                      type="button"
                      role="option"
                      aria-selected="false"
                      onClick={() => handleAgregarPersonalizada(query.trim())}
                      className="w-full text-left px-5 py-4 border-b dark:border-gray-800 border-gray-200 hover:bg-blue-500/10 dark:text-blue-300 text-blue-700 active:bg-blue-500/20 transition-all flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5 dark:text-blue-400 text-blue-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-bold text-sm uppercase tracking-wide truncate">Añadir "{query.trim()}"</span>
                        <span className="text-[11px] dark:text-blue-400 text-blue-700/60 font-medium truncate">Nueva tarea personalizada</span>
                      </div>
                    </button>
                  )}
                  {opcionesPaginadas.map(tarea => (
                    <button
                      key={tarea.id}
                      type="button"
                      role="option"
                      aria-selected="false"
                      onClick={() => handleSeleccionarPredefinida(tarea.nombre)}
                      className="w-full text-left px-5 py-4 hover:dark:bg-gray-800/40 hover:bg-gray-200 active:dark:bg-gray-800/60 active:bg-gray-200 dark:text-gray-200 text-gray-800 transition-all border-b dark:border-gray-800 border-gray-200 last:border-0 flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-700 flex-shrink-0 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                        <Zap className="w-5 h-5 dark:text-gray-400 text-gray-600 group-hover:text-yellow-400 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-medium text-sm sm:text-base leading-tight truncate">{tarea.nombre}</span>
                        {tarea.categoria && <span className="text-[10px] text-gray-500 uppercase tracking-tighter truncate">{tarea.categoria}</span>}
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
                      className="w-full py-4 text-center dark:text-blue-400 text-blue-700 font-bold text-sm hover:bg-blue-500/5 active:bg-blue-500/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Cargar más resultados
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
            <span>{opcionesDisponibles.length} resultados</span>
            {opcionesDisponibles.length > 0 && <span>Pág {paginaActual}</span>}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
})