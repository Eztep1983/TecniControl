'use client'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { OrdenMantenimiento } from '@/types/orden'
import { Plus, Search, Eye, Printer, ArrowLeft, Wrench, X, Filter, ChevronDown, ChevronUp, Calendar, Clock, Menu, LayoutGrid, Table } from 'lucide-react'
import Link from 'next/link'
import FormularioMantenimiento from '@/app/(app)/ordenes/mantenimiento/fomulario'
import { useAuth } from '@/components/auth/AuthProvider'
import { useOrdenesUsuario } from '@/hooks/useMultiUser'
import { useNegocio } from '@/hooks/useNegocio'
import { useDebounce } from 'use-debounce';
import ModalOrden from '@/components/mantenimiento/ModalOrden'
import { PrintButton, usePrintService } from '@/components/mantenimiento/PrintService'

// Componente de tarjeta para móviles
const OrdenCard = ({ orden, onView, onPrint, getTipoColor, formatFecha }: {
  orden: OrdenMantenimiento;
  onView: (orden: OrdenMantenimiento) => void;
  onPrint: (orden: OrdenMantenimiento) => void;
  getTipoColor: (tipo: string) => string;
  formatFecha: (fecha: any) => string;
}) => (
  <div 
    className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:bg-gray-700/50 transition-all duration-200 cursor-pointer"
    onClick={() => onView(orden)}
  >
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium truncate">
          {orden.cliente?.name || 'N/A'}
        </h3>
        <p className="text-sm text-gray-400">
          ID: {orden.idPersonalizado}
        </p>
      </div>
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ml-2 ${getTipoColor(orden.tipoMantenimiento)}`}>
        {orden.tipoMantenimiento}
      </span>
    </div>
    
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-400">Teléfono:</span>
        <span className="text-white truncate ml-2">{orden.cliente?.phone || 'N/A'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Dispositivo:</span>
        <span className="text-white truncate ml-2">
          {orden.dispositivo?.marca || ''} {orden.dispositivo?.modelo || ''}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Fecha:</span>
        <span className="text-white">{formatFecha(orden.fechaCreacion)}</span>
      </div>
    </div>
    
    <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-600/50">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView(orden);
        }}
        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
      >
        <Eye className="w-4 h-4" />
        <span>Ver</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrint(orden);
        }}
        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
      >
        <Printer className="w-4 h-4" />
        <span>Imprimir</span>
      </button>
    </div>
  </div>
);

// Componente de loading para filtros
const FilterLoadingIndicator = () => (
  <div className="absolute inset-0 bg-gray-800/80 rounded-lg flex items-center justify-center z-10 backdrop-blur-sm">
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      <span className="text-sm text-blue-400">Aplicando filtro...</span>
    </div>
  </div>
);

// Componente principal
export default function OrdenesMantenimientoPage() {
  const { user, loading: authLoading } = useAuth()
  const { ordenes: todasLasOrdenes, loading, error, refrescarOrdenes } = useOrdenesUsuario()
  const { negocio, loading: loadingNegocio } = useNegocio()
  
  // Usar el servicio de impresión
  const { imprimirOrden, formatFecha } = usePrintService({ negocio })
  const [busqueda, setBusqueda] = useState('')
  const [debouncedBusqueda] = useDebounce(busqueda, 300);
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenMantenimiento | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)
  const [esMobile, setEsMobile] = useState(false)
  
  // Nuevo estado para el loading visual del filtro
  const [aplicandoFiltro, setAplicandoFiltro] = useState(false)
  
  const elementosPorPagina = 10

  // Efecto para detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setEsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const ordenes = useMemo(() => {
    return todasLasOrdenes.filter(orden => orden.tipo === 'mantenimiento') as OrdenMantenimiento[]
  }, [todasLasOrdenes])

  const handleRowClick = useCallback((orden: OrdenMantenimiento) => {
    setOrdenSeleccionada(orden);
  }, []);

  // Función para cambiar filtro con efecto de carga
  const cambiarFiltro = useCallback((nuevoFiltro: string) => {
    setAplicandoFiltro(true)
    setFiltroTipo(nuevoFiltro)
    setMostrarFiltros(false)
    setPaginaActual(1) // Resetear a primera página
    
    // Simular un pequeño delay para la retroalimentación visual
    setTimeout(() => {
      setAplicandoFiltro(false)
    }, 300)
  }, [])

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(orden => {
      const coincideBusqueda = 
        (orden.cliente?.phone?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
        (orden.cliente?.cedula?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
        (orden.cliente?.name?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
        (orden.dispositivo?.modelo?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
        (orden.dispositivo?.numeroSerie?.toLowerCase() || '').includes(busqueda.toLowerCase());
      
      const coincideTipo = filtroTipo === 'todos' || orden.tipoMantenimiento === filtroTipo;
      
      return coincideBusqueda && coincideTipo;
    });
  }, [ordenes, busqueda, filtroTipo]);

  const totalPaginas = Math.ceil(ordenesFiltradas.length / elementosPorPagina);
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const ordenesPaginadas = ordenesFiltradas.slice(indiceInicio, indiceInicio + elementosPorPagina);

  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getTipoColor = useCallback((tipo: string) => {
    return tipo === 'preventivo' 
      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
      : 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  }, []);

  if (mostrarFormulario) {
    return (
      <FormularioMantenimiento
        onClose={() => setMostrarFormulario(false)}
        onSuccess={() => {
          setMostrarFormulario(false);
          refrescarOrdenes(); 
        }}
      />
    );
  }

  // Mostrar loading si está cargando auth o datos
  if (authLoading || (loading && user?.uid)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-400 text-sm sm:text-base">Cargando órdenes...</p>
        </div>
      </div>
    )
  }

  // Mostrar mensaje si no hay usuario autenticado
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
        {/* Header Optimizado para Móvil */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Barra superior con navegación*/}
            <div className="flex items-center justify-between">
              <Link 
                href="/ordenes" 
                className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-full hover:bg-gray-800 flex-shrink-0"
                aria-label="Volver a órdenes"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
            </div>
            
            {/* Contenedor principal responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              {/* Título e información */}
              <div className="flex items-start sm:items-center gap-3 flex-1">
                <div className="bg-blue-500/20 p-2 rounded-lg flex-shrink-0">
                  <Wrench className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    Órdenes de Mantenimiento
                  </h1>
                  <p className="text-gray-400 text-xs sm:text-sm lg:text-base mt-1">
                    Mantenimiento preventivo y correctivo de equipos
                  </p>
                </div>
              </div>

              {/* Botón de acción */}
              <button
                onClick={() => setMostrarFormulario(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Nueva Orden</span>
                <span className="xs:hidden">Nueva Orden</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 sm:mb-6">
            <p className="text-sm sm:text-base">{error}</p>
            <button 
              onClick={refrescarOrdenes}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Controles de búsqueda y filtros optimizados */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-3 sm:p-4 mb-4 sm:mb-6 relative">
          {/* Overlay de loading para filtros */}
          {aplicandoFiltro && <FilterLoadingIndicator />}
          
          <div className="flex flex-col gap-3">
            {/* Barra de búsqueda */}
            <div className="relative">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, cédula, teléfono..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                aria-label="Buscar registros"
              />
            </div>
            
            {/* Controles de filtro y vista */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Filtro por tipo */}
              <div className="relative flex-1">
                <button
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className="w-full sm:w-auto bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 px-3 py-2 rounded-lg flex items-center justify-between sm:justify-center space-x-2 transition-colors border border-gray-600/50 text-sm sm:text-base"
                  aria-expanded={mostrarFiltros}
                  aria-haspopup="true"
                  disabled={aplicandoFiltro}
                >
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4" />
                    <span>Filtrar</span>
                    {filtroTipo !== 'todos' && (
                      <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {filtroTipo === 'preventivo' ? 'P' : 'C'}
                      </span>
                    )}
                  </div>
                  {mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {/* Dropdown de filtros - Mejorado para responsive */}
                {mostrarFiltros && (
                  <div className="absolute top-full left-0 right-0 sm:left-0 sm:right-auto sm:min-w-48 mt-2 bg-gray-800/95 rounded-xl shadow-lg z-20 p-3 border border-gray-700/50 backdrop-blur-sm">
                    <p className="text-sm font-medium text-gray-300 mb-2">Tipo de mantenimiento</p>
                    <div className="space-y-2">
                      {[
                        { value: 'todos', label: 'Todos' },
                        { value: 'preventivo', label: 'Preventivo' },
                        { value: 'correctivo', label: 'Correctivo' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-700/50 p-1 rounded transition-colors">
                          <input
                            type="radio"
                            name="tipoFiltro"
                            value={option.value}
                            checked={filtroTipo === option.value}
                            onChange={() => cambiarFiltro(option.value)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                            disabled={aplicandoFiltro}
                          />
                          <span className="text-sm text-gray-300 flex-1">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>              
            </div>
          </div>
        </div>

        {/* Lista de Órdenes */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden relative">
          {/* Overlay de loading para la lista */}
          {aplicandoFiltro && (
            <div className="absolute inset-0 bg-gray-800/80 flex items-center justify-center z-10 backdrop-blur-sm rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="text-blue-400 text-sm">Aplicando filtro...</span>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-400 text-sm sm:text-base">Cargando órdenes...</p>
            </div>
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
              {/* Vista móvil SIEMPRE con tarjetas, desktop SIEMPRE con tabla */}
              {esMobile ? (
                <div className="p-3 sm:p-4">
                  <div className="grid gap-3 sm:gap-4">
                    {ordenesPaginadas.map((orden) => (
                      <OrdenCard
                        key={orden.idPersonalizado}
                        orden={orden}
                        onView={handleRowClick}
                        onPrint={imprimirOrden}
                        getTipoColor={getTipoColor}
                        formatFecha={formatFecha}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* Vista de tabla para desktop */
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
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
                      {ordenesPaginadas.map((orden) => (
                        <tr 
                          key={orden.idPersonalizado} 
                          className="hover:bg-gray-700/50 cursor-pointer transition-colors group"
                          onClick={() => handleRowClick(orden)}
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
                              {orden.tipoMantenimiento}
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
                                  handleRowClick(orden);
                                }}
                                className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/20 transition-colors"
                                aria-label="Ver detalles"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <PrintButton 
                                orden={orden} 
                                onPrint={imprimirOrden}
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
              
              {/* Paginación optimizada */}
              {totalPaginas > 1 && (
                <div className="px-3 sm:px-6 py-4 bg-gray-700/50 border-t border-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                    Mostrando <span className="font-medium text-white">{indiceInicio + 1}</span> a{' '}
                    <span className="font-medium text-white">
                      {Math.min(indiceInicio + elementosPorPagina, ordenesFiltradas.length)}
                    </span> de{' '}
                    <span className="font-medium text-white">{ordenesFiltradas.length}</span> resultados
                  </div>
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => cambiarPagina(paginaActual - 1)}
                      disabled={paginaActual === 1 || aplicandoFiltro}
                      className="px-3 py-2 rounded-md border border-gray-600 text-xs sm:text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    
                    {/* Indicador de página actual en móvil */}
                    <div className="flex items-center px-3 py-2 text-xs sm:text-sm text-gray-300 sm:hidden">
                      {paginaActual} / {totalPaginas}
                    </div>
                    
                    <button
                      onClick={() => cambiarPagina(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas || aplicandoFiltro}
                      className="px-3 py-2 rounded-md border border-gray-600 text-xs sm:text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Estadísticas optimizadas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="bg-green-500/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-400 truncate">Preventivos</p>
                <p className="text-xl sm:text-2xl font-bold text-green-400">
                  {ordenes.filter(o => o.tipoMantenimiento === 'preventivo').length}
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
                  {ordenes.filter(o => o.tipoMantenimiento === 'correctivo').length}
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
                <p className="text-xs sm:text-sm text-gray-400 truncate">Total Órdenes</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-400">{ordenes.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal de Visualización */}
        {ordenSeleccionada && (
          <ModalOrden 
            orden={ordenSeleccionada} 
            onClose={() => setOrdenSeleccionada(null)} 
            onPrint={imprimirOrden}
          />
        )}
      </div>
    </div>
  );
}