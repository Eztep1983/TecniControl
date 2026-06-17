  // mantenimiento/page.tsx - Optimizado para móvil y escritorio

  'use client'
  import { useState, useMemo, useCallback, useEffect, memo, useRef } from 'react'
  import { OrdenMantenimiento } from '@/types/orden'
  import { Search, Eye, ArrowLeft, Wrench, Filter, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react'
  import Link from 'next/link'
  import { useAuth } from '@/components/auth/AuthProvider'
  import { useEstadisticasUsuario } from '@/hooks/useMultiUser'
  import { useRouter, useSearchParams } from 'next/navigation'
  import { useOrdenesInfinitas, usePrefetchData, useOrdenesBusqueda } from '@/hooks/useMultiUser'
  import { useNegocio } from '@/hooks/useNegocio'
  import { useDebounce } from 'use-debounce'
  import { ModalOrden } from '@/components/mantenimiento/ModalOrden'
  import OrdenCard from '@/components/mantenimiento/OrdenCard'
  import { PrintButton, ShareButton, usePrintService } from '@/components/mantenimiento/PrintService'
  import { Skeleton } from '@/components/ui/basic/skeleton'
  import { useMediaQuery } from '@/hooks/clientes/useMediaQuery'
  import { useMobileNavigation } from '@/components/providers/MobileNavigationContext'
  import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/basic/sheet"

  // Helper para interactuar con localStorage de forma segura (evita excepciones en Safari privado, etc.)
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      try {
        if (typeof window !== 'undefined') {
          return localStorage.getItem(key)
        }
      } catch (e) {
        console.error(`Error al leer ${key} de localStorage:`, e)
      }
      return null
    },
    removeItem: (key: string): void => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key)
        }
      } catch (e) {
        console.error(`Error al borrar ${key} de localStorage:`, e)
      }
    }
  }

  // Funciones auxiliares movidas fuera del componente (evita useCallback y recreaciones innecesarias)
  const getTipoColor = (tipo: string): string => {
    const colors: Record<string, string> = {
      preventivo: 'bg-green-500/20 text-green-400 border-green-500/30',
      correctivo: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      diagnostico: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      instalacion: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      garantia: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    }
    return colors[tipo] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const getTipoLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      preventivo: 'Preventivo',
      correctivo: 'Correctivo',
      diagnostico: 'Diagnóstico',
      instalacion: 'Instalación',
      garantia: 'Garantía'
    }
    return labels[tipo] || tipo
  }

  // Componente de chip para filtros activos
  const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
      {label}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="p-0.5 hover:bg-blue-500/30 rounded-full transition-colors"
        aria-label={`Quitar filtro ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  )

  // Componente de estado vacío
  const EmptyState = ({
    hasFilters,
    onClearFilters,
  }: {
    hasFilters: boolean;
    onClearFilters?: () => void;
  }) => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-gray-700/50 rounded-full p-4 mb-4">
        <Wrench className="w-8 h-8 text-gray-500" />
      </div>
      <p className="text-gray-400 text-sm font-medium mb-1">
        {hasFilters ? 'No se encontraron resultados' : 'No hay órdenes de mantenimiento'}
      </p>
      <p className="text-gray-500 text-xs text-center mb-4">
        {hasFilters
          ? 'Intenta ajustar los filtros o términos de búsqueda'
          : 'Crea tu primera orden de servicio'}
      </p>
      {hasFilters && onClearFilters ? (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-amber-500/20"
        >
          <X className="w-4 h-4" />
          Limpiar filtros
        </button>
      ) : (
        null
      )}
    </div>
  )

  // Helpers para búsqueda y normalización
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()

  const formatFechaPure = (fecha: any): string => {
    if (!fecha) return 'N/A';
    if (fecha && typeof fecha === 'object' && 'seconds' in fecha) {
      fecha = new Date(fecha.seconds * 1000);
    }
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  const buildSearchableText = (orden: OrdenMantenimiento): string => {
    return [
      orden.idPersonalizado,
      orden.cliente?.name,
      orden.cliente?.phone,
      orden.cliente?.cedula,
      orden.cliente?.email,
      orden.dispositivo?.marca,
      orden.dispositivo?.modelo,
      orden.dispositivo?.numeroSerie,
      orden.tipoMantenimiento,
      getTipoLabel(orden.tipoMantenimiento),
      orden.observacionesIniciales,
      orden.diagnosticoFinal,
      orden.tareasRealizadas?.join(' '),
      orden.piezasUsadas?.map(p => p.pieza).join(' '),
      formatFechaPure(orden.fechaCreacion),
    ]
      .filter(Boolean)
      .map((v) => normalize(v as string))
      .join(' ')
  }

  // Componente Highlight independiente para evitar renders costosos
  const Highlight = memo(({ text, term }: { text: string; term: string }) => {
    if (!term.trim()) return <>{text}</>
    
    const tokens = normalize(term).split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return <>{text}</>

    const pattern = new RegExp(`(${tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
    const parts = text.split(pattern)

    return (
      <>
        {parts.map((part, i) => 
          tokens.some(token => normalize(part) === token) ? (
            <span key={i} className="bg-blue-500/30 text-blue-200 rounded-sm px-0.5">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    )
  })
  Highlight.displayName = 'Highlight'

  const triggerHaptics = async (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    try {
      if (typeof window !== 'undefined') {
        const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
        if (style === 'success') {
          await Haptics.notification({ type: NotificationType.Success });
        } else if (style === 'warning') {
          await Haptics.notification({ type: NotificationType.Warning });
        } else if (style === 'error') {
          await Haptics.notification({ type: NotificationType.Error });
        } else if (style === 'medium') {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } else if (style === 'heavy') {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        } else {
          await Haptics.impact({ style: ImpactStyle.Light });
        }
      }
    } catch (e) {
      console.debug('Haptics not supported or failed:', e);
    }
  }

  export default function OrdenesMantenimientoPage() {
    const { user, loading: authLoading } = useAuth()
    const [busqueda, setBusqueda] = useState('')
    const [debouncedBusqueda] = useDebounce(busqueda, 300)
    const [filtroTipo, setFiltroTipo] = useState<string>('todos')
    const [mounted, setMounted] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Solo 'lista' para la vista local, ya que 'formulario' ahora es global
    const [vista, setVista] = useState<'lista'>('lista')
    const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenMantenimiento | null>(null)
    const [mostrarFiltros, setMostrarFiltros] = useState(false)
    const [aplicandoFiltro, setAplicandoFiltro] = useState(false)
    const [sortConfig, setSortConfig] = useState<{ key: keyof OrdenMantenimiento | 'cliente' | 'dispositivo'; direction: 'asc' | 'desc' }>({
      key: 'fechaCreacion',
      direction: 'desc'
    })

    const sentinelRef = useRef<HTMLDivElement>(null)

    const { prefetchClientes } = usePrefetchData()
    
    // Configurar si estamos en modo búsqueda
    const isSearching = debouncedBusqueda.trim().length > 0

    // Hook para paginación infinita (cuando no hay búsqueda)
    const { 
      data: infinitasData, 
      fetchNextPage, 
      hasNextPage, 
      isFetchingNextPage, 
      isLoading: infinitasLoading, 
      error: infinitasError,
      refrescarOrdenes
    } = useOrdenesInfinitas(10, filtroTipo)

    // Hook para búsqueda inteligente (cuando hay texto)
    const {
      data: busquedaData,
      isLoading: busquedaLoading,
      error: busquedaError
    } = useOrdenesBusqueda(debouncedBusqueda, filtroTipo, isSearching)

    const ordenesLoading = isSearching ? busquedaLoading : infinitasLoading
    const error = isSearching ? busquedaError : infinitasError

    const { negocio } = useNegocio()
    const { estadisticas: globalStats } = useEstadisticasUsuario()
    const { pendingAction, consumePendingAction } = useMobileNavigation()

    const { imprimirOrden, compartirOrden, descargarPDF, formatFecha, generarPDFBlob, generarHTML } = usePrintService({ negocio })

    const esMobileQuery = useMediaQuery('(max-width: 768px)')
    const esMobile = mounted ? esMobileQuery : false

    // Manejar montaje y leer query params
    useEffect(() => {
      setMounted(true)
      const tipoParam = searchParams.get('tipo')
      if (tipoParam) {
        setFiltroTipo(tipoParam)
      }
    }, [searchParams])

    // Sentinel observer for infinite scroll
    useEffect(() => {
      if (isSearching || !hasNextPage || isFetchingNextPage) return

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchNextPage()
          }
        },
        { threshold: 0.1 }
      )

      const currentSentinel = sentinelRef.current
      if (currentSentinel) {
        observer.observe(currentSentinel)
      }

      return () => {
        if (currentSentinel) {
          observer.unobserve(currentSentinel)
        }
      }
    }, [isSearching, hasNextPage, isFetchingNextPage, fetchNextPage])

    // Trigger haptics on loading error
    useEffect(() => {
      if (error) {
        triggerHaptics('error')
      }
    }, [error])

    // Escuchar acción de nueva orden desde el nav mobile
    useEffect(() => {
      if (pendingAction === 'open-nueva-orden') {
        router.push('?modal=crear-orden', { scroll: false });
        consumePendingAction();
      }
    }, [pendingAction, consumePendingAction, router]);

    // Cerrar dropdown de filtros al hacer clic fuera
    useEffect(() => {
      if (!mostrarFiltros) return

      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (!target.closest('[data-filtro-dropdown]')) {
          setMostrarFiltros(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [mostrarFiltros])

    // Obtener y filtrar órdenes de mantenimiento sin arrays intermedios redundantes
    const ordenes = useMemo(() => {
      if (isSearching) {
        if (busquedaLoading && !busquedaData) {
          const rawPages = infinitasData?.pages.flatMap(page => page.ordenes) || []
          return rawPages as OrdenMantenimiento[]
        }
        return (busquedaData || []) as OrdenMantenimiento[]
      } else {
        const rawPages = infinitasData?.pages.flatMap(page => page.ordenes) || []
        return rawPages as OrdenMantenimiento[]
      }
    }, [isSearching, busquedaData, infinitasData, busquedaLoading])



    const handleRowClick = useCallback((orden: OrdenMantenimiento) => {
      setOrdenSeleccionada(orden)
    }, [])

    const cambiarFiltro = useCallback((nuevoFiltro: string) => {
      setAplicandoFiltro(true)
      setFiltroTipo(nuevoFiltro)
      setMostrarFiltros(false)

      setTimeout(() => {
        setAplicandoFiltro(false)
      }, 300)
    }, [])

    const limpiarFiltros = useCallback(() => {
      setBusqueda('')
      setFiltroTipo('todos')
    }, [])



    const handleSort = (key: typeof sortConfig.key) => {
      setSortConfig(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      }))
    }

    const calculateRelevance = useCallback((orden: OrdenMantenimiento, tokens: string[]): number => {
      if (tokens.length === 0) return 0
      let score = 0
      
      const fields = [
        { value: orden.idPersonalizado, weight: 100 },
        { value: orden.cliente?.name, weight: 80 },
        { value: orden.cliente?.phone, weight: 60 },
        { value: orden.cliente?.cedula, weight: 60 },
        { value: `${orden.dispositivo?.marca} ${orden.dispositivo?.modelo}`, weight: 50 },
        { value: orden.tipoMantenimiento, weight: 30 },
        { value: orden.observacionesIniciales, weight: 10 },
        { value: orden.diagnosticoFinal, weight: 10 },
      ]

      tokens.forEach(token => {
        fields.forEach(({ value, weight }) => {
          if (!value) return
          const normalizedValue = normalize(value as string)
          if (normalizedValue === token) score += weight * 3 // Exact match is prioritized
          else if (normalizedValue.startsWith(token)) score += weight * 1.5
          else if (normalizedValue.includes(token)) score += weight
        })
      })

      return score
    }, [])

    const ordenesFiltradas = useMemo(() => {
      // Si estamos en modo búsqueda inteligente, el hook useOrdenesBusqueda (Fuse.js)
      // ya devuelve los datos filtrados y ordenados por relevancia. No debemos
      // filtrarlos manualmente aquí o romperíamos la tolerancia a errores.
      if (isSearching) {
        return ordenes
      }

      const tokens = normalize(debouncedBusqueda).split(/\s+/).filter(Boolean)
      
      const filtered = ordenes.map(orden => {
        const coincideTipo = filtroTipo === 'todos' || orden.tipoMantenimiento === filtroTipo
        if (!coincideTipo) return null

        const searchableText = buildSearchableText(orden)
        const coincideBusqueda = tokens.length === 0 || tokens.every((token) => searchableText.includes(token))
        
        if (!coincideBusqueda) return null

        const relevance = debouncedBusqueda ? calculateRelevance(orden, tokens) : 0
        return { orden, relevance }
      }).filter((item): item is { orden: OrdenMantenimiento; relevance: number } => item !== null)

      // Aplicar ordenamiento
      return filtered.sort((a, b) => {
        const itemA = a.orden
        const itemB = b.orden
        
        let valA: any = itemA[sortConfig.key as keyof OrdenMantenimiento]
        let valB: any = itemB[sortConfig.key as keyof OrdenMantenimiento]

        if (sortConfig.key === 'cliente') {
          valA = itemA.cliente?.name || ''
          valB = itemB.cliente?.name || ''
        } else if (sortConfig.key === 'dispositivo') {
          valA = `${itemA.dispositivo?.marca || ''} ${itemA.dispositivo?.modelo || ''}`
          valB = `${itemB.dispositivo?.marca || ''} ${itemB.dispositivo?.modelo || ''}`
        }

        const toComp = (v: any) => {
          if (v instanceof Date) return v.getTime()
          if (v && typeof v === 'object' && 'seconds' in v) return v.seconds * 1000 + (v.nanoseconds || 0) / 1000000
          if (typeof v === 'string') return v.toLowerCase().trim()
          return v
        }

        const compA = toComp(valA)
        const compB = toComp(valB)

        if (compA < compB) return sortConfig.direction === 'asc' ? -1 : 1
        if (compA > compB) return sortConfig.direction === 'asc' ? 1 : -1
        
        if (sortConfig.key !== 'fechaCreacion') {
          const dateA = toComp(itemA.fechaCreacion)
          const dateB = toComp(itemB.fechaCreacion)
          return dateB - dateA
        }

        return 0
      }).map(item => item.orden)
    }, [ordenes, isSearching, debouncedBusqueda, filtroTipo, sortConfig, calculateRelevance])

    const hasActiveFilters = busqueda !== '' || filtroTipo !== 'todos'
    
    // Simplificar la condición compuesta de carga inicial
    const ordenesLoadingInicial = ordenesLoading && ordenes.length === 0
    const mostrarCargando = authLoading || (!!user && ordenesLoadingInicial)

    return (
      <div className="bg-transparent min-h-screen pb-safe">
        {/* Sticky Header extracted to the top */}
        <div className="sticky top-0 z-40 bg-gray-900/95 border-b border-gray-800 pt-safe backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Link
                href="/ordenes"
                prefetch={false}
                className="text-blue-400 hover:text-blue-300 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-800 flex-shrink-0"
                aria-label="Volver a órdenes"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="bg-blue-500/20 p-2 rounded-lg flex-shrink-0">
                  <Wrench className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-bold text-white truncate">
                    Historial de Órdenes
                  </h1>
                  <p className="text-gray-400 text-xs truncate">
                    {globalStats?.totalOrdenes > 0 
                      ? `${globalStats.totalOrdenes} órdenes registradas` 
                      : 'Gestión de órdenes de servicio'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-5 space-y-6">
          {mostrarCargando ? (
            <div className="flex flex-1 flex-col w-full space-y-6">
              <Skeleton className="h-[48px] w-full bg-gray-700/50 rounded-xl" />
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full bg-gray-700/50 rounded-xl" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center p-4">
              <div className="text-center bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md">
                <p className="text-red-400 font-medium mb-2">Error al cargar las órdenes</p>
                <p className="text-red-300/70 text-sm mb-4">{(error as Error).message || 'Ocurrió un error inesperado al conectar con el servidor.'}</p>
                <button 
                  onClick={() => refrescarOrdenes()}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : !user ? (
            <div className="flex flex-1 items-center justify-center p-4">
              <div className="text-center">
                <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                  <p className="text-gray-400">Debes iniciar sesión para acceder a esta página.</p>
                </div>
              </div>
            </div>
          ) : (
            <>
                {/* Barra de búsqueda y filtros */}
                <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                  {/* Búsqueda */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="search"
                      inputMode="search"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      placeholder="Buscar por cliente, mes, dispositivo, id..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full min-h-[48px] pl-9 pr-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                      aria-label="Buscar órdenes"
                    />
                    {busqueda && (
                      <button
                        onClick={() => setBusqueda('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-600 rounded-full transition-colors"
                        aria-label="Limpiar búsqueda"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Filtro de tipo */}
                  {esMobile ? (
                    <Sheet open={mostrarFiltros} onOpenChange={setMostrarFiltros}>
                      <SheetTrigger asChild>
                        <button
                          className={`w-full sm:w-auto min-h-[48px] bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 px-4 py-2.5 rounded-lg flex items-center justify-between sm:justify-center gap-2 transition-colors border text-sm ${
                            filtroTipo !== 'todos' ? 'border-blue-500/50' : 'border-gray-600/50'
                          }`}
                          disabled={aplicandoFiltro}
                        >
                          {aplicandoFiltro ? (
                            <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
                          ) : (
                            <Filter className="w-4 h-4" />
                          )}
                          <span>Filtrar</span>
                          {filtroTipo !== 'todos' && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {getTipoLabel(filtroTipo)}
                            </span>
                          )}
                          {!aplicandoFiltro && <ChevronDown className="w-4 h-4" />}
                        </button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="bg-gray-900 border-gray-800 rounded-t-2xl text-white">
                        <SheetHeader className="text-left pb-4 border-b border-gray-850">
                          <SheetTitle className="text-lg font-bold text-white">Filtros</SheetTitle>
                          <SheetDescription className="text-xs text-gray-400">
                            Selecciona el tipo de mantenimiento a visualizar
                          </SheetDescription>
                        </SheetHeader>
                        <div className="py-4 space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Tipo de mantenimiento</p>
                          <div className="space-y-1">
                            {[
                              { value: 'todos', label: 'Todos', count: globalStats.totalOrdenes },
                              { value: 'preventivo', label: 'Preventivo', count: globalStats.preventivos },
                              { value: 'correctivo', label: 'Correctivo', count: globalStats.correctivos },
                              { value: 'diagnostico', label: 'Diagnóstico', count: globalStats.diagnosticos },
                              { value: 'instalacion', label: 'Instalación', count: globalStats.instalaciones },
                              { value: 'garantia', label: 'Garantía', count: (globalStats as any).garantias },
                            ].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  cambiarFiltro(option.value);
                                  setMostrarFiltros(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
                                  filtroTipo === option.value
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'text-gray-300 hover:bg-gray-800/50 border border-transparent'
                                }`}
                                disabled={aplicandoFiltro}
                              >
                                <span>{option.label}</span>
                                <span className="text-xs text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full border border-gray-700">
                                  {option.count}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  ) : (
                    <div className="relative" data-filtro-dropdown>
                      <button
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className={`w-full sm:w-auto min-h-[48px] bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 px-4 py-2.5 rounded-lg flex items-center justify-between sm:justify-center gap-2 transition-colors border text-sm ${
                          filtroTipo !== 'todos' ? 'border-blue-500/50' : 'border-gray-600/50'
                        }`}
                        aria-expanded={mostrarFiltros}
                        disabled={aplicandoFiltro}
                      >
                        {aplicandoFiltro ? (
                          <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
                        ) : (
                          <Filter className="w-4 h-4" />
                        )}
                        <span className="sm:inline">Filtrar</span>
                        {filtroTipo !== 'todos' && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {getTipoLabel(filtroTipo)}
                          </span>
                        )}
                        {!aplicandoFiltro && (mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                      </button>

                      {/* Dropdown de filtros */}
                      {mostrarFiltros && (
                        <div 
                          className="absolute top-full right-0 mt-2 w-56 bg-gray-800 rounded-xl shadow-lg z-20 p-3 border border-gray-700/50 max-h-[60dvh] overflow-y-auto"
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setMostrarFiltros(false)
                          }}
                        >
                          <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Tipo de mantenimiento</p>
                          <div className="space-y-1">
                            {[
                              { value: 'todos', label: 'Todos', count: globalStats.totalOrdenes },
                              { value: 'preventivo', label: 'Preventivo', count: globalStats.preventivos },
                              { value: 'correctivo', label: 'Correctivo', count: globalStats.correctivos },
                              { value: 'diagnostico', label: 'Diagnóstico', count: globalStats.diagnosticos },
                              { value: 'instalacion', label: 'Instalación', count: globalStats.instalaciones },
                              { value: 'garantia', label: 'Garantía', count: (globalStats as any).garantias },
                            ].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => cambiarFiltro(option.value)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
                                  filtroTipo === option.value
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'text-gray-300 hover:bg-gray-700/50'
                                }`}
                                disabled={aplicandoFiltro}
                              >
                                <span>{option.label}</span>
                                <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded-full">
                                  {option.count}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Chips de filtros activos */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-700/50">
                    <span className="text-xs text-gray-400">Filtros activos:</span>
                    {busqueda && (
                      <FilterChip 
                        label={`Búsqueda: "${busqueda}"`} 
                        onRemove={() => setBusqueda('')} 
                      />
                    )}
                    {filtroTipo !== 'todos' && (
                      <FilterChip 
                        label={getTipoLabel(filtroTipo)} 
                        onRemove={() => cambiarFiltro('todos')} 
                      />
                    )}
                    <button
                      onClick={limpiarFiltros}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-auto"
                    >
                      Limpiar todo
                    </button>
                  </div>
                )}
              </div>

              {/* Contenido principal */}
              <div className={`overflow-visible transition-opacity duration-300 ${aplicandoFiltro ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {/* Estado de carga */}
                {ordenesLoading && ordenes.length === 0 ? (
                  esMobile ? (
                    <div className="p-3 sm:p-4 grid gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-800/80 rounded-xl border border-gray-700/50 p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-5 w-2/3 bg-gray-700/50" />
                              <Skeleton className="h-4 w-1/2 bg-gray-700/50" />
                            </div>
                            <Skeleton className="h-6 w-20 bg-gray-700/50 rounded-full" />
                          </div>
                          <Skeleton className="h-4 w-3/4 bg-gray-700/50" />
                          <Skeleton className="h-4 w-1/3 bg-gray-700/50" />
                          <div className="flex justify-end gap-2 pt-2">
                            <Skeleton className="h-8 w-8 bg-gray-700/50 rounded-lg" />
                            <Skeleton className="h-8 w-8 bg-gray-700/50 rounded-lg" />
                            <Skeleton className="h-8 w-8 bg-gray-700/50 rounded-lg" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/50">
                          <tr>
                            <th className="px-4 sm:px-6 py-3"><Skeleton className="h-4 w-16 bg-gray-600/50" /></th>
                            <th className="px-4 sm:px-6 py-3"><Skeleton className="h-4 w-24 bg-gray-600/50" /></th>
                            <th className="px-4 sm:px-6 py-3"><Skeleton className="h-4 w-16 bg-gray-600/50" /></th>
                            <th className="px-4 sm:px-6 py-3"><Skeleton className="h-4 w-20 bg-gray-600/50" /></th>
                            <th className="px-4 sm:px-6 py-3"><Skeleton className="h-4 w-24 bg-gray-600/50" /></th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i}>
                              <td className="px-4 sm:px-6 py-4 space-y-2">
                                <Skeleton className="h-4 w-32 bg-gray-700/50" />
                                <Skeleton className="h-3 w-24 bg-gray-700/50" />
                              </td>
                              <td className="px-4 sm:px-6 py-4 space-y-2">
                                <Skeleton className="h-4 w-28 bg-gray-700/50" />
                                <Skeleton className="h-3 w-36 bg-gray-700/50" />
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <Skeleton className="h-6 w-20 rounded-full bg-gray-700/50" />
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <Skeleton className="h-4 w-24 bg-gray-700/50" />
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <div className="flex gap-2">
                                  <Skeleton className="h-8 w-8 rounded bg-gray-700/50" />
                                  <Skeleton className="h-8 w-8 rounded bg-gray-700/50" />
                                  <Skeleton className="h-8 w-8 rounded bg-gray-700/50" />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : ordenesFiltradas.length === 0 ? (
                  <EmptyState
                    hasFilters={hasActiveFilters}
                    onClearFilters={limpiarFiltros}
                  />
                ) : (
                  <>
                    {/* Vista móvil: Cards */}
                    {esMobile ? (
                      <div className="p-3 space-y-3">
                        {ordenesFiltradas.map((orden) => (
                          <OrdenCard
                            key={orden.idPersonalizado}
                            orden={orden}
                            onView={handleRowClick}
                            onPrint={imprimirOrden}
                            onShare={compartirOrden}
                            onDownload={descargarPDF}
                            getTipoColor={getTipoColor}
                            formatFecha={formatFecha}
                            searchTerm={debouncedBusqueda}
                          />
                        ))}
                      </div>
                    ) : (
                      /* Vista escritorio: Tabla */
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                          <thead className="bg-gray-700/50">
                            <tr>
                              <th 
                                onClick={() => handleSort('cliente')}
                                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span>Cliente</span>
                                  {sortConfig.key === 'cliente' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort('dispositivo')}
                                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span>Dispositivo</span>
                                  {sortConfig.key === 'dispositivo' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Tipo
                              </th>
                              <th 
                                onClick={() => handleSort('fechaCreacion')}
                                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span>Fecha</span>
                                  {sortConfig.key === 'fechaCreacion' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
                            {ordenesFiltradas.map((orden) => (
                              <tr
                                key={orden.idPersonalizado}
                                onClick={() => handleRowClick(orden)}
                                className="hover:bg-gray-700/50 transition-colors group cursor-pointer"
                              >
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                                      <Highlight text={orden.cliente?.name || 'N/A'} term={debouncedBusqueda} />
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                      {orden.cliente?.phone || 'Sin teléfono'}
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-white group-hover:text-blue-300 transition-colors">
                                    <Highlight text={`${orden.dispositivo?.marca || ''} ${orden.dispositivo?.modelo || ''}`} term={debouncedBusqueda} />
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    S/N: {orden.dispositivo?.numeroSerie || 'N/A'}
                                  </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getTipoColor(orden.tipoMantenimiento)}`}>
                                    {getTipoLabel(orden.tipoMantenimiento)}
                                  </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                  {formatFecha(orden.fechaCreacion)}
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="flex justify-end gap-1">
                                    <button
                                      onClick={() => handleRowClick(orden)}
                                      className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"
                                      aria-label="Ver detalles"
                                      title="Ver detalles"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <PrintButton
                                      orden={orden}
                                      onPrint={imprimirOrden}
                                      variant="table"
                                    />
                                    <ShareButton
                                      orden={orden}
                                      onShare={compartirOrden}
                                      variant="table"
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Sentinel para auto-paginación */}
                    {!isSearching && hasNextPage && (
                      <div ref={sentinelRef} className="px-3 sm:px-6 py-6 bg-gray-800/50 border-t border-gray-700/50 flex flex-col items-center justify-center gap-2">
                        {isFetchingNextPage ? (
                          <div className="flex items-center gap-2 text-blue-400 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
                            <span>Cargando más órdenes...</span>
                          </div>
                        ) : (
                          // Fallback button accesible
                          <button
                            onClick={() => fetchNextPage()}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-medium transition-all active:scale-95 w-full sm:w-auto justify-center"
                          >
                            <ChevronDown className="w-4 h-4" />
                            <span>Cargar más órdenes</span>
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Contador de resultados */}
              {ordenesFiltradas.length > 0 && (
                <div className="mt-3 text-center sm:text-right">
                  <p className="text-xs text-gray-500">
                    {isSearching
                      ? `${ordenesFiltradas.length} resultado${ordenesFiltradas.length !== 1 ? 's' : ''} para "${debouncedBusqueda}"${filtroTipo !== 'todos' ? ` en ${getTipoLabel(filtroTipo)}` : ''}`
                      : `Mostrando ${ordenesFiltradas.length} de ${globalStats.totalOrdenes} órdenes${hasActiveFilters ? ` — ${ordenes.length - ordenesFiltradas.length} filtradas` : ''}`
                    }
                  </p>
                </div>
              )}
            </>
          )}

          {/* Toast sticky de carga adicional */}
          {!isSearching && isFetchingNextPage && (
            <div
              aria-live="polite"
              aria-label="Cargando más órdenes"
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-gray-800/95 border border-gray-700/60 rounded-full shadow-xl backdrop-blur-sm text-sm text-blue-300 font-medium pointer-events-none"
            >
              <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none flex-shrink-0" />
              <span>Cargando más órdenes...</span>
            </div>
          )}

          {/* Modal de Visualización de la orden */}
          {ordenSeleccionada && (
            <ModalOrden
              orden={ordenSeleccionada}
              onClose={() => setOrdenSeleccionada(null)}
              onPrint={imprimirOrden}
              onShare={compartirOrden}
              onDownload={descargarPDF}
              generarPDFBlob={generarPDFBlob}
              generarHTML={generarHTML}
            />
          )}
        </div>
      </div>
    )
  }