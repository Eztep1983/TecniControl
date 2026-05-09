//mantenimiento/page.tsx - Optimizado y coherente

'use client'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { OrdenMantenimiento } from '@/types/orden'
import { Plus, Search, Eye, Printer, ArrowLeft, Wrench, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import FormularioMantenimiento from '@/app/(app)/ordenes/mantenimiento/formulario'
import { useAuth } from '@/components/auth/AuthProvider'
import { useOrdenesInfinitas, usePrefetchData } from '@/hooks/useMultiUser'
import { useNegocio } from '@/hooks/useNegocio'
import { useDebounce } from 'use-debounce'
import ModalOrden from '@/components/mantenimiento/ModalOrden'
import OrdenCard from '@/components/mantenimiento/OrdenCard'
import { PrintButton, ShareButton, DownloadButton, usePrintService } from '@/components/mantenimiento/PrintService'
import { Skeleton } from '@/components/ui/basic/skeleton'
import AnimatedContent from '@/components/ui/AnimatedContent'
import AnimatedList from '@/components/ui/AnimatedList'

// Componente de loading para filtros
const FilterLoadingIndicator = () => (
  <div className="absolute inset-0 bg-gray-800/80 rounded-lg flex items-center justify-center z-10 backdrop-blur-sm">
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      <span className="text-sm text-blue-400">Cargando...</span>
    </div>
  </div>
);

// Componente principal
export default function OrdenesMantenimientoPage() {
  const { user, loading: authLoading } = useAuth()
  const { prefetchClientes } = usePrefetchData()
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: loading, 
    error,
    refrescarOrdenes
  } = useOrdenesInfinitas(10)
  const { negocio } = useNegocio()

  const { imprimirOrden, compartirOrden, descargarPDF, formatFecha } = usePrintService({ negocio })
  const [busqueda, setBusqueda] = useState('')
  const [debouncedBusqueda] = useDebounce(busqueda, 300);
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [hayBorrador, setHayBorrador] = useState(false)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenMantenimiento | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [esMobile, setEsMobile] = useState(false)
  const [aplicandoFiltro, setAplicandoFiltro] = useState(false)

  // Aplanar las páginas de órdenes
  const todasLasOrdenes = useMemo(() => {
    return data?.pages.flatMap(page => page.ordenes) || []
  }, [data])

  // Detectar tamaño de pantalla y confirmar si hay borrador
  useEffect(() => {
    const checkMobile = () => {
      setEsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Check borrador
    if (localStorage.getItem('draft_mantenimiento')) {
      setHayBorrador(true)
    }

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const ordenes = useMemo(() => {
    return todasLasOrdenes.filter(orden => orden.tipo === 'mantenimiento') as OrdenMantenimiento[]
  }, [todasLasOrdenes])

  const handleRowClick = useCallback((orden: OrdenMantenimiento) => {
    setOrdenSeleccionada(orden);
  }, []);

  const cambiarFiltro = useCallback((nuevoFiltro: string) => {
    setAplicandoFiltro(true)
    setFiltroTipo(nuevoFiltro)
    setMostrarFiltros(false)

    setTimeout(() => {
      setAplicandoFiltro(false)
    }, 300)
  }, [])

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(orden => {
      const coincideBusqueda =
        (orden.cliente?.phone?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.cliente?.cedula?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.cliente?.name?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.dispositivo?.modelo?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.dispositivo?.numeroSerie?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.idPersonalizado?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase());

      const coincideTipo = filtroTipo === 'todos' || orden.tipoMantenimiento === filtroTipo;

      return coincideBusqueda && coincideTipo;
    });
  }, [ordenes, debouncedBusqueda, filtroTipo]);

  const getTipoColor = useCallback((tipo: string) => {
    const colors: Record<string, string> = {
      preventivo: 'bg-green-500/20 text-green-400 border-green-500/30',
      correctivo: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      diagnostico: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      instalacion: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      garantia: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    }
    return colors[tipo] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }, []);

  const getTipoLabel = useCallback((tipo: string) => {
    const labels: Record<string, string> = {
      preventivo: 'Preventivo',
      correctivo: 'Correctivo',
      diagnostico: 'Diagnóstico',
      instalacion: 'Instalación',
    }
    return labels[tipo] || tipo
  }, []);

  // Estadísticas
   const stats = useMemo(() => ({
    preventivos: ordenes.filter(o => o.tipoMantenimiento === 'preventivo').length,
    correctivos: ordenes.filter(o => o.tipoMantenimiento === 'correctivo').length,
    diagnosticos: ordenes.filter(o => o.tipoMantenimiento === 'diagnostico').length,
    instalaciones: ordenes.filter(o => o.tipoMantenimiento === 'instalacion').length,
    total: ordenes.length
  }), [ordenes]);

  if (mostrarFormulario) {
    return (
      <FormularioMantenimiento
        onClose={() => {
          setMostrarFormulario(false);
          if (localStorage.getItem('draft_mantenimiento')) setHayBorrador(true);
        }}
        onSuccess={() => {
          setMostrarFormulario(false);
          setHayBorrador(false);
          refrescarOrdenes();
        }}
      />
    );
  }

  if (authLoading || (loading && user?.uid && todasLasOrdenes.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col p-4 sm:p-8">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64 bg-gray-700/50" />
            <Skeleton className="h-10 w-32 bg-gray-700/50" />
          </div>
          <Skeleton className="h-14 w-full bg-gray-700/50 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full bg-gray-700/50 rounded-xl" />
            <Skeleton className="h-20 w-full bg-gray-700/50 rounded-xl" />
            <Skeleton className="h-20 w-full bg-gray-700/50 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
            <p className="text-gray-400">Debes iniciar sesión para acceder a esta página.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-3 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <Link
                href="/ordenes"
                className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-full hover:bg-gray-800 flex-shrink-0"
                aria-label="Volver a órdenes"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="flex items-start sm:items-center gap-3 flex-1">
                <div className="bg-blue-500/20 p-2 rounded-lg flex-shrink-0">
                  <Wrench className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    Ordenes de servicio emitidas
                  </h1>
                  <p className="text-gray-400 text-xs sm:text-sm lg:text-base mt-1">
                    Gestión completa de ordenes de servicio emitidas
                  </p>
                </div>
              </div>
              {/* Botón de acción */}
              {/* Este es el boton animado */}
            <AnimatedContent
              distance={190}
              direction="horizontal"
              reverse={false}
              duration={0.4}
              ease="power3.inOut"
              initialOpacity={0}
              animateOpacity
              scale={1}
              threshold={0.1}
              delay={0.1}
            >
              <button
                onClick={() => setMostrarFormulario(true)}
                onMouseEnter={() => prefetchClientes()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Emitir nueva orden</span>
              </button>
            </AnimatedContent>
            </div>
          </div>
        </div>

        {/* Banner de Borrador Pendiente */}
        {hayBorrador && !mostrarFormulario && (
          <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-400 font-medium">Tienes una nueva orden de mantenimiento en pausa.</span>
            </div>
            <div className="flex flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  localStorage.removeItem('draft_mantenimiento');
                  setHayBorrador(false);
                }}
                className="flex-1 sm:flex-none border border-blue-600/30 text-blue-600 hover:text-blue-500 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg text-sm transition-colors"
                aria-label="Descartar borrador"
              >
                Descartar
              </button>
              <button
                onClick={() => setMostrarFormulario(true)}
                className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-gray-900 px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-500/20 text-center"
              >
                Reanudar
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 sm:mb-6">
            <p className="text-sm sm:text-base"> Error al cargar las ordenes</p>
            <button
              onClick={refrescarOrdenes}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Controles de búsqueda y filtros */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-3 sm:p-4 mb-4 sm:mb-6 relative">
          {aplicandoFiltro && <FilterLoadingIndicator />}

          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, ID, dispositivo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                aria-label="Buscar registros"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="w-full sm:w-auto bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 px-3 py-2 rounded-lg flex items-center justify-between sm:justify-center space-x-2 transition-colors border border-gray-600/50 text-sm sm:text-base"
                aria-expanded={mostrarFiltros}
                disabled={aplicandoFiltro}
              >
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filtrar por tipo</span>
                  {filtroTipo !== 'todos' && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {getTipoLabel(filtroTipo)}
                    </span>
                  )}
                </div>
                {mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {mostrarFiltros && (
                <div className="absolute top-full left-0 right-0 sm:left-0 sm:right-auto sm:min-w-56 mt-2 bg-gray-800/95 rounded-xl shadow-lg z-20 p-3 border border-gray-700/50 backdrop-blur-sm">
                  <p className="text-sm font-medium text-gray-300 mb-3">Tipo de mantenimiento</p>
                  <div className="space-y-2">
                    {[
                       { value: 'todos', label: 'Todos', count: stats.total },
                      { value: 'preventivo', label: 'Preventivo', count: stats.preventivos },
                      { value: 'correctivo', label: 'Correctivo', count: stats.correctivos },
                      { value: 'diagnostico', label: 'Diagnóstico', count: stats.diagnosticos },
                      { value: 'instalacion', label: 'Instalación', count: stats.instalaciones },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors group"
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="tipoFiltro"
                            value={option.value}
                            checked={filtroTipo === option.value}
                            onChange={() => cambiarFiltro(option.value)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                            disabled={aplicandoFiltro}
                          />
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                            {option.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded-full">
                          {option.count}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Ordenes */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden relative">
          {aplicandoFiltro && (
            <div className="absolute inset-0 bg-gray-800/80 flex items-center justify-center z-10 backdrop-blur-sm rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="text-blue-400 text-sm">Cargando...</span>
              </div>
            </div>
          )}

          {loading && todasLasOrdenes.length === 0 ? (
            esMobile ? (
              <div className="p-3 sm:p-4 grid gap-3 sm:gap-4">
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
                    <div className="flex justify-end pt-2 gap-2">
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
                          <div className="flex space-x-2">
                            <Skeleton className="h-8 w-8 rounded bg-gray-700/50" />
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
            <div className="p-6 sm:p-8 text-center">
              <Wrench className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-sm sm:text-base">
                {busqueda || filtroTipo !== 'todos'
                  ? 'No se encontraron órdenes que coincidan con los criterios de búsqueda'
                  : 'No hay órdenes de mantenimiento'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                {busqueda || filtroTipo !== 'todos'
                  ? 'Intente con otros términos o elimine los filtros'
                  : 'Crea la primera orden haciendo clic en "Nueva Orden"'}
              </p>
            </div>
          ) : (
            <>
              {esMobile ? (
                <div className="p-3 sm:p-4">
                  <AnimatedList
                    items={ordenesFiltradas}
                    onItemSelect={(orden) => handleRowClick(orden as OrdenMantenimiento)}
                    showGradients
                    enableArrowNavigation
                    displayScrollbar
                    renderItem={(orden) => (
                      <OrdenCard
                        orden={orden as OrdenMantenimiento}
                        onView={handleRowClick}
                        onPrint={imprimirOrden}
                        onShare={compartirOrden}
                        onDownload={descargarPDF}
                        getTipoColor={getTipoColor}
                        formatFecha={formatFecha}
                      />
                    )}
                  />
                </div>
              ) : (
                <div className="overflow-hidden">
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
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
                      {ordenesFiltradas.map((orden) => (
                        <tr
                          key={orden.idPersonalizado}
                          className="hover:bg-gray-700/50 cursor-pointer transition-colors group"
                          onClick={() => handleRowClick(orden as OrdenMantenimiento)}
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                              {orden.cliente?.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {orden.cliente?.phone || 'Sin teléfono'}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white group-hover:text-blue-300 transition-colors">
                              {orden.dispositivo?.marca || ''} {orden.dispositivo?.modelo || ''}
                            </div>
                            <div className="text-sm text-gray-400">
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
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(orden as OrdenMantenimiento);
                                }}
                                className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/20 transition-colors"
                                aria-label="Ver detalles"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <PrintButton
                                orden={orden as OrdenMantenimiento}
                                onPrint={imprimirOrden}
                                variant="table"
                              />
                              <ShareButton
                                orden={orden as OrdenMantenimiento}
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

              {hasNextPage && (
                <div className="px-3 sm:px-6 py-6 bg-gray-800/50 border-t border-gray-700/50 flex justify-center">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-bold transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-blue-500/5"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span>Cargando más...</span>
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

        {/* Estadísticas optimizadas */}
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="bg-green-500/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-400 truncate">Preventivos</p>
                <p className="text-xl sm:text-2xl font-bold text-green-400">
                  {stats.preventivos}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="bg-orange-500/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-400 truncate">Correctivos</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-400">
                  {stats.correctivos}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="bg-blue-500/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-400 truncate">Diagnósticos</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-400">
                  {stats.diagnosticos}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="bg-purple-500/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-400 truncate">Instalaciones</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-400">
                  {stats.instalaciones}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="bg-amber-500/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="bg-gray-500/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-400 truncate">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-400">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Visualización de la orden */}
        {ordenSeleccionada && (
          <ModalOrden
            orden={ordenSeleccionada}
            onClose={() => setOrdenSeleccionada(null)}
            onPrint={imprimirOrden}
            onShare={compartirOrden}
            onDownload={descargarPDF}
          />
        )}
      </div>
    </div>
  );
}