// mantenimiento/page.tsx - Optimizado para móvil y escritorio

'use client'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { OrdenMantenimiento } from '@/types/orden'
import { Plus, Search, Eye, ArrowLeft, Wrench, Filter, ChevronDown, ChevronUp, X } from 'lucide-react'
import Link from 'next/link'
import FormularioMantenimiento from '@/app/(app)/ordenes/mantenimiento/formulario'
import { useAuth } from '@/components/auth/AuthProvider'
import { useEstadisticasUsuario } from '@/hooks/useMultiUser'
import { useOrdenesInfinitas, usePrefetchData } from '@/hooks/useMultiUser'
import { useNegocio } from '@/hooks/useNegocio'
import { useDebounce } from 'use-debounce'
import { ModalOrden } from '@/components/mantenimiento/ModalOrden'
import OrdenCard from '@/components/mantenimiento/OrdenCard'
import { PrintButton, ShareButton, usePrintService } from '@/components/mantenimiento/PrintService'
import { Skeleton } from '@/components/ui/basic/skeleton'
import { useMediaQuery } from '@/hooks/clientes/useMediaQuery'

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
const EmptyState = ({ hasFilters, onCreateNew }: { hasFilters: boolean; onCreateNew: () => void }) => (
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
    {!hasFilters && (
      <button
        onClick={onCreateNew}
        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-500/20"
      >
        <Plus className="w-4 h-4 inline mr-1.5" />
        Nueva orden
      </button>
    )}
  </div>
)

export default function OrdenesMantenimientoPage() {
  const { user, loading: authLoading } = useAuth()
  const { prefetchClientes } = usePrefetchData()
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: ordenesLoading, 
    error,
    refrescarOrdenes
  } = useOrdenesInfinitas(10)
  const { negocio } = useNegocio()
  const { estadisticas: globalStats } = useEstadisticasUsuario()

  const [busqueda, setBusqueda] = useState('')
  const [debouncedBusqueda] = useDebounce(busqueda, 300)
  const [vista, setVista] = useState<'lista' | 'formulario'>('lista')
  const [hayBorrador, setHayBorrador] = useState(false)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenMantenimiento | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [aplicandoFiltro, setAplicandoFiltro] = useState(false)
  const { imprimirOrden, compartirOrden, descargarPDF, formatFecha, generarPDFBlob, generarHTML } = usePrintService({ negocio })

  const esMobile = useMediaQuery('(max-width: 768px)')

  // Verificar borrador inicial de forma segura
  useEffect(() => {
    if (safeLocalStorage.getItem('draft_mantenimiento')) {
      setHayBorrador(true)
    }
  }, [])

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
    const rawPages = data?.pages.flatMap(page => page.ordenes) || []
    return rawPages.filter(orden => orden.tipo === 'mantenimiento') as OrdenMantenimiento[]
  }, [data])

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

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(orden => {
      const coincideBusqueda =
        (orden.cliente?.phone?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.cliente?.cedula?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.cliente?.name?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.dispositivo?.modelo?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.dispositivo?.numeroSerie?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.idPersonalizado?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase())

      const coincideTipo = filtroTipo === 'todos' || orden.tipoMantenimiento === filtroTipo

      return coincideBusqueda && coincideTipo
    })
  }, [ordenes, debouncedBusqueda, filtroTipo])

  const hasActiveFilters = busqueda !== '' || filtroTipo !== 'todos'
  
  // Simplificar la condición compuesta de carga inicial
  const ordenesLoadingInicial = ordenesLoading && ordenes.length === 0
  const mostrarCargando = authLoading || (!!user && ordenesLoadingInicial)

  return (
    <div className={vista === 'formulario' ? '' : 'min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-3 sm:p-4 lg:p-8'}>
      <div className={vista === 'formulario' ? '' : 'max-w-7xl mx-auto'}>
        {vista === 'formulario' ? (
          <FormularioMantenimiento
            onClose={() => {
              setVista('lista')
              if (safeLocalStorage.getItem('draft_mantenimiento')) {
                setHayBorrador(true)
              }
            }}
            onSuccess={() => {
              setVista('lista')
              setHayBorrador(false)
              refrescarOrdenes()
            }}
          />
        ) : mostrarCargando ? (
          <div className="flex flex-1 flex-col p-4 sm:p-8">
            <div className="max-w-7xl mx-auto w-full space-y-6">
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-48 sm:w-64 bg-gray-700/50" />
                <Skeleton className="h-10 w-28 sm:w-32 bg-gray-700/50" />
              </div>
              <Skeleton className="h-12 sm:h-14 w-full bg-gray-700/50 rounded-xl" />
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 sm:h-24 w-full bg-gray-700/50 rounded-xl" />
                ))}
              </div>
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
            {/* Header */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center justify-between">
                  <Link
                    href="/ordenes"
                    className="text-blue-400 hover:text-blue-300 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-800 flex-shrink-0"
                    aria-label="Volver a órdenes"
                  >
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Link>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <div className="bg-blue-500/20 p-2.5 rounded-lg flex-shrink-0">
                      <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                        Órdenes de servicio
                      </h1>
                      <p className="text-gray-400 text-xs sm:text-sm mt-1">
                        {globalStats.totalOrdenes > 0 ? `${globalStats.totalOrdenes} órdenes registradas` : 'Gestión de órdenes de servicio'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setVista('formulario')}
                    onMouseEnter={() => prefetchClientes()}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Nueva orden</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Banner de Borrador Pendiente */}
            {hayBorrador && (
              <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-400 font-medium">Tienes una orden en borrador.</span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      safeLocalStorage.removeItem('draft_mantenimiento')
                      setHayBorrador(false)
                    }}
                    className="flex-1 sm:flex-none border border-blue-600/30 text-blue-600 hover:text-blue-500 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    aria-label="Descartar borrador"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={() => setVista('formulario')}
                    className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-md"
                  >
                    Reanudar
                  </button>
                </div>
              </div>
            )}

            {/* Banner de Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-sm">Error al cargar las órdenes</p>
                <button
                  onClick={refrescarOrdenes}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Barra de búsqueda y filtros */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Búsqueda */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente, ID, dispositivo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
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
                <div className="relative" data-filtro-dropdown>
                  <button
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className={`w-full sm:w-auto bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 px-4 py-2.5 rounded-lg flex items-center justify-between sm:justify-center gap-2 transition-colors border text-sm ${
                      filtroTipo !== 'todos' ? 'border-blue-500/50' : 'border-gray-600/50'
                    }`}
                    aria-expanded={mostrarFiltros}
                    disabled={aplicandoFiltro}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filtrar</span>
                    {filtroTipo !== 'todos' && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {getTipoLabel(filtroTipo)}
                      </span>
                    )}
                    {mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Dropdown de filtros */}
                  {mostrarFiltros && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 rounded-xl shadow-lg z-20 p-3 border border-gray-700/50">
                      <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Tipo de mantenimiento</p>
                      <div className="space-y-1">
                        {[
                          { value: 'todos', label: 'Todos', count: globalStats.totalOrdenes },
                          { value: 'preventivo', label: 'Preventivo', count: globalStats.preventivos },
                          { value: 'correctivo', label: 'Correctivo', count: globalStats.correctivos },
                          { value: 'diagnostico', label: 'Diagnóstico', count: globalStats.diagnosticos },
                          { value: 'instalacion', label: 'Instalación', count: globalStats.instalaciones },
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
            <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
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
                  onCreateNew={() => setVista('formulario')} 
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
                        />
                      ))}
                    </div>
                  ) : (
                    /* Vista escritorio: Tabla */
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/50">
                          <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Cliente
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Dispositivo
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Tipo
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Fecha
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
                              className="hover:bg-gray-700/50 transition-colors group"
                            >
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleRowClick(orden)}
                                  className="text-left w-full"
                                >
                                  <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                                    {orden.cliente?.name || 'N/A'}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    {orden.cliente?.phone || 'Sin teléfono'}
                                  </div>
                                </button>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white group-hover:text-blue-300 transition-colors">
                                  {orden.dispositivo?.marca || ''} {orden.dispositivo?.modelo || ''}
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

                  {/* Cargar más */}
                  {hasNextPage && (
                    <div className="px-3 sm:px-6 py-4 bg-gray-800/50 border-t border-gray-700/50 flex justify-center">
                      <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-medium transition-all disabled:opacity-50 active:scale-95 w-full sm:w-auto justify-center"
                      >
                        {isFetchingNextPage ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            <span>Cargando...</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            <span>Cargar más órdenes</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Contador de resultados */}
            {ordenesFiltradas.length > 0 && (
              <div className="mt-3 text-center sm:text-right">
                <p className="text-xs text-gray-500">
                  Mostrando {ordenesFiltradas.length} de {globalStats.totalOrdenes} órdenes
                  {hasActiveFilters && ' (filtrado)'}
                </p>
              </div>
            )}
          </>
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