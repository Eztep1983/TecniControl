'use client'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { OrdenEntrega } from '@/types/orden'
import { Plus, Search, Eye, Printer, ArrowLeft, Truck, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import FormularioEntrega from '@/app/(app)/ordenes/entrega/formulario'
import { useAuth } from '@/components/auth/AuthProvider'
import { useOrdenesUsuario } from '@/hooks/useMultiUser'
import { useDebounce } from 'use-debounce'
import OrdenCard from '@/components/entrega/OrdenCard'
import { Skeleton } from '@/components/ui/basic/skeleton'
import { useAndroidBack } from '@/hooks/useAndroidBack'

export default function OrdenesEntregaPage() {
  const { user, loading: authLoading } = useAuth()
  const { ordenes: todasLasOrdenes, loading, error, refrescarOrdenes } = useOrdenesUsuario()
  
  const [busqueda, setBusqueda] = useState('')
  const [debouncedBusqueda] = useDebounce(busqueda, 300)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenEntrega | null>(null)
  const closeOrdenModal = useCallback(() => setOrdenSeleccionada(null), [])
  useAndroidBack(!!ordenSeleccionada, closeOrdenModal)
  
  const [paginaActual, setPaginaActual] = useState(1)
  const [esMobile, setEsMobile] = useState(false)
  
  const elementosPorPagina = 10

  useEffect(() => {
    const checkMobile = () => {
      setEsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const ordenes = useMemo(() => {
    return todasLasOrdenes.filter(orden => orden.tipo === 'entrega') as OrdenEntrega[]
  }, [todasLasOrdenes])

  const handleRowClick = useCallback((orden: OrdenEntrega) => {
    setOrdenSeleccionada(orden);
  }, []);

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(orden => {
      return (orden.cliente?.phone?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.cliente?.cedula?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.cliente?.name?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.dispositivo?.modelo?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.dispositivo?.numeroSerie?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase()) ||
        (orden.id?.toLowerCase() || '').includes(debouncedBusqueda.toLowerCase());
    });
  }, [ordenes, debouncedBusqueda]);

  const totalPaginas = Math.ceil(ordenesFiltradas.length / elementosPorPagina);
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const ordenesPaginadas = ordenesFiltradas.slice(indiceInicio, indiceInicio + elementosPorPagina);

  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatFecha = useCallback((fecha: any): string => {
    if (!fecha) return 'No especificada'
    try {
      if (typeof fecha === 'object' && 'seconds' in fecha && 'nanoseconds' in fecha) {
        return new Date(fecha.seconds * 1000 + fecha.nanoseconds / 1000000).toLocaleDateString()
      } else if (typeof fecha === 'string') {
        return new Date(fecha).toLocaleDateString()
      } else if (fecha instanceof Date) {
        return fecha.toLocaleDateString()
      } else if (typeof fecha === 'number') {
        return new Date(fecha).toLocaleDateString()
      }
      return 'Fecha inválida'
    } catch (error) {
      return 'Fecha inválida'
    }
  }, [])

  // Estadísticas
  const stats = useMemo(() => {
    const validado = ordenes.filter(o => o.validacionCliente).length
    return {
      validadas: validado,
      pendientes: ordenes.length - validado,
      total: ordenes.length
    }
  }, [ordenes]);

  if (mostrarFormulario) {
    return (
      <FormularioEntrega
        onClose={() => setMostrarFormulario(false)}
        onSuccess={() => {
          setMostrarFormulario(false);
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
                className="text-purple-400 hover:text-purple-300 transition-colors p-2 rounded-full hover:bg-gray-800 flex-shrink-0"
                aria-label="Volver a órdenes"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="flex items-start sm:items-center gap-3 flex-1">
                <div className="bg-purple-500/20 p-2 rounded-lg flex-shrink-0">
                  <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    Órdenes de Entrega
                  </h1>
                  <p className="text-gray-400 text-xs sm:text-sm lg:text-base mt-1">
                    Entrega de equipos reparados o instalados al cliente
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMostrarFormulario(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Nueva Entrega</span>
              </button>
            </div>
          </div>
        </div>

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

        {/* Buscador */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="relative">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, modelo o número de serie..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Lista de Órdenes */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
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
                       <Skeleton className="h-8 w-24 bg-gray-700/50 rounded-lg" />
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
                      <th className="px-4 sm:px-6 py-3"><Skeleton className="h-4 w-16 bg-gray-600/50" /></th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
                    {[1, 2, 3].map((i) => (
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
                          <Skeleton className="h-4 w-20 bg-gray-700/50" />
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <Skeleton className="h-6 w-20 rounded-full bg-gray-700/50" />
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <Skeleton className="h-8 w-8 rounded bg-gray-700/50" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : ordenesFiltradas.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <Truck className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-sm sm:text-base">
                {busqueda
                  ? 'No se encontraron órdenes de entrega que coincidan con los criterios de búsqueda'
                  : 'No hay órdenes de entrega registradas'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                {busqueda
                  ? 'Intente con otros términos'
                  : 'Crea la primera orden haciendo clic en "Nueva Entrega"'}
              </p>
            </div>
          ) : (
            <>
              {esMobile ? (
                <div className="p-3 sm:p-4">
                  <div className="grid gap-3 sm:gap-4">
                    {ordenesPaginadas.map((orden) => (
                      <OrdenCard
                        key={orden.id}
                        orden={orden}
                        onView={handleRowClick}
                        formatFecha={formatFecha}
                      />
                    ))}
                  </div>
                </div>
              ) : (
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
                          Fecha Entrega
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Validación
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
                      {ordenesPaginadas.map((orden) => (
                        <tr
                          key={orden.id}
                          className="hover:bg-gray-700/50 cursor-pointer transition-colors group"
                          onClick={() => handleRowClick(orden)}
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                              {orden.cliente?.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {orden.cliente?.phone || 'Sin teléfono'}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white group-hover:text-purple-300 transition-colors">
                              {orden.dispositivo?.marca || ''} {orden.dispositivo?.modelo || ''}
                            </div>
                            <div className="text-sm text-gray-400">
                              S/N: {orden.dispositivo?.numeroSerie || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {formatFecha(orden.fechaEntrega)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            {orden.validacionCliente ? (
                              <div className="flex items-center text-green-400 bg-green-500/10 px-2 py-1 rounded-full w-max">
                                <CheckCircle className="w-4 h-4 mr-1.5" />
                                <span className="text-xs font-medium border-0">Validado</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full w-max">
                                <span className="text-xs font-medium border-0">Pendiente</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(orden);
                                }}
                                className="text-purple-400 hover:text-purple-300 p-1 rounded hover:bg-purple-500/20 transition-colors"
                                aria-label="Ver detalles"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

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
                      disabled={paginaActual === 1}
                      className="px-3 py-2 rounded-md border border-gray-600 text-xs sm:text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <div className="flex items-center px-3 py-2 text-xs sm:text-sm text-gray-300 sm:hidden">
                      {paginaActual} / {totalPaginas}
                    </div>
                    <button
                      onClick={() => cambiarPagina(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
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

        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="bg-purple-500/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-400 truncate">Total Entregas</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-400">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="bg-green-500/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-400 truncate">Validadas</p>
                <p className="text-xl sm:text-2xl font-bold text-green-400">{stats.validadas}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:shadow-lg transition-shadow col-span-2 sm:col-span-1">
            <div className="flex items-center">
              <div className="bg-yellow-500/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-400 truncate">Pendientes</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-400">{stats.pendientes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Inline (Tema Oscuro) */}
        {ordenSeleccionada && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <h3 className="text-xl font-bold text-white">Detalles de Entrega <span className="text-purple-400">#{ordenSeleccionada.id?.substring(0, 8)}</span></h3>
                <button
                  onClick={closeOrdenModal}
                  className="text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Cliente */}
                <div className="space-y-4 bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                  <h4 className="font-semibold text-purple-300 border-b border-gray-700/50 pb-2">Cliente</h4>
                  <div className="space-y-2">
                    <p className="text-sm flex justify-between"><span className="text-gray-400">Nombre:</span> <span className="text-white font-medium">{ordenSeleccionada.cliente?.name}</span></p>
                    <p className="text-sm flex justify-between"><span className="text-gray-400">Teléfono:</span> <span className="text-white bg-gray-800 px-2 rounded">{ordenSeleccionada.cliente?.phone}</span></p>
                    <p className="text-sm flex justify-between"><span className="text-gray-400">Cédula:</span> <span className="text-white">{ordenSeleccionada.cliente?.cedula || 'N/A'}</span></p>
                    <p className="text-sm"><span className="text-gray-400 block mb-1">Dirección:</span> <span className="text-white">{ordenSeleccionada.cliente?.address || 'N/A'}</span></p>
                  </div>
                </div>
                
                {/* Dispositivo */}
                <div className="space-y-4 bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                  <h4 className="font-semibold text-purple-300 border-b border-gray-700/50 pb-2">Dispositivo</h4>
                  <div className="space-y-2">
                    <p className="text-sm flex justify-between"><span className="text-gray-400">Tipo:</span> <span className="text-white">{ordenSeleccionada.dispositivo?.tipo}</span></p>
                    <p className="text-sm flex justify-between"><span className="text-gray-400">Marca:</span> <span className="text-white">{ordenSeleccionada.dispositivo?.marca}</span></p>
                    <p className="text-sm flex justify-between"><span className="text-gray-400">Modelo:</span> <span className="text-white">{ordenSeleccionada.dispositivo?.modelo}</span></p>
                    <p className="text-sm flex justify-between"><span className="text-gray-400">S/N:</span> <span className="text-gray-300 font-mono bg-gray-800 px-2 rounded">{ordenSeleccionada.dispositivo?.numeroSerie}</span></p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Fechas */}
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                  <h4 className="font-semibold text-purple-300 border-b border-gray-700/50 pb-2 mb-3">Fechas</h4>
                  <div className="space-y-2">
                    <p className="text-sm flex justify-between"><span className="text-gray-400">Creación:</span> <span className="text-white">{formatFecha(ordenSeleccionada.fechaCreacion)}</span></p>
                    {ordenSeleccionada.fechaEntrega && (
                      <p className="text-sm flex justify-between"><span className="text-gray-400">Entrega:</span> <span className="text-white">{formatFecha(ordenSeleccionada.fechaEntrega)}</span></p>
                    )}
                  </div>
                </div>

                {/* Validación */}
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                  <h4 className="font-semibold text-purple-300 border-b border-gray-700/50 pb-2 mb-3">Estado de Validación</h4>
                  <div className="flex items-center text-sm p-3 rounded-lg border bg-gray-800 justify-center">
                    {ordenSeleccionada.validacionCliente ? (
                      <span className="flex items-center text-green-400">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Cliente validó la entrega
                      </span>
                    ) : (
                      <span className="text-yellow-400">Pendiente de validación</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Información Adicional */}
              <div className="space-y-4">
                {ordenSeleccionada.observacionesFinales && (
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">Observaciones Finales</h4>
                    <p className="text-sm bg-gray-900 border border-gray-700/50 p-3 rounded-lg text-gray-300 leading-relaxed font-sans">{ordenSeleccionada.observacionesFinales}</p>
                  </div>
                )}
                
                {(ordenSeleccionada.reparacionesRealizadas || ordenSeleccionada.repuestosUtilizados) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ordenSeleccionada.reparacionesRealizadas && (
                      <div>
                        <h4 className="font-medium text-gray-300 mb-2">Reparaciones</h4>
                        <p className="text-sm bg-gray-900 border border-gray-700/50 p-3 rounded-lg text-gray-300 min-h-[60px] whitespace-pre-wrap">{ordenSeleccionada.reparacionesRealizadas}</p>
                      </div>
                    )}
                    {ordenSeleccionada.repuestosUtilizados && (
                      <div>
                        <h4 className="font-medium text-gray-300 mb-2">Repuestos Utilizados</h4>
                        <p className="text-sm bg-gray-900 border border-gray-700/50 p-3 rounded-lg text-gray-300 min-h-[60px] whitespace-pre-wrap">{ordenSeleccionada.repuestosUtilizados}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {ordenSeleccionada.firmaCliente && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-300 mb-2">Firma del Cliente</h4>
                    <div className="bg-white rounded-lg p-2 flex flex-col items-center justify-center">
                      <img 
                        src={ordenSeleccionada.firmaCliente} 
                        alt="Firma del cliente" 
                        className="max-h-40 object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">Validación digital proporcionada por el cliente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.8);
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}