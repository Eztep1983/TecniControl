//ordenes/page.tsx

'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Shield, 
  Wrench, 
  Search, 
  Truck,
  PlusCircle,
  UserPlus,
  ArrowRight,
  FileCheck,

  Loader2
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
// USAR LOS HOOKS MULTI-USUARIO
import { useOrdenesUsuario, useEstadisticasUsuario } from '@/hooks/useMultiUser'

export default function OrdenesPage() {
  const { user, loading: authLoading } = useAuth()
  // USAR LOS HOOKS MULTI-USUARIO PARA OBTENER DATOS FILTRADOS POR USUARIO
  const { ordenes, loading: ordenesLoading } = useOrdenesUsuario()
  const { estadisticas, loading: statsLoading } = useEstadisticasUsuario()

  const [ordenesCount, setOrdenesCount] = useState({
    garantia: 0,
    mantenimiento: 0,
    diagnostico: 0,
    entrega: 0
  })

  useEffect(() => {
    // CONTAR ÓRDENES POR TIPO USANDO LOS DATOS YA FILTRADOS POR USUARIO
    if (ordenes.length > 0) {
      const counts = {
        garantia: 0,
        mantenimiento: 0,
        diagnostico: 0,
        entrega: 0
      }
      
      ordenes.forEach((orden) => {
        const tipo = orden.tipo
        if (counts.hasOwnProperty(tipo)) {
          counts[tipo as keyof typeof counts]++
        }
      })
      
      setOrdenesCount(counts)
    } else {
      setOrdenesCount({
        garantia: 0,
        mantenimiento: 0,
        diagnostico: 0,
        entrega: 0
      })
    }
  }, [ordenes])

  const tiposOrden = [
    {
      tipo: 'garantia',
      titulo: 'Orden de Garantía',
      descripcion: 'Gestión de reclamos y servicios bajo garantía',
      icono: Shield,
      color: 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30',
      colorIcon: 'text-blue-400',
      colorText: 'text-blue-100',
      ruta: '/ordenes/garantia',
      count: ordenesCount.garantia
    },
    {
      tipo: 'mantenimiento',
      titulo: 'Orden de Mantenimiento',
      descripcion: 'Mantenimiento preventivo y correctivo de equipos',
      icono: Wrench,
      color: 'bg-green-600/20 hover:bg-green-600/30 border-green-500/30',
      colorIcon: 'text-green-400',
      colorText: 'text-green-100',
      ruta: '/ordenes/mantenimiento',
      count: ordenesCount.mantenimiento
    },
    {
      tipo: 'diagnostico',
      titulo: 'Orden de Diagnóstico',
      descripcion: 'Evaluación técnica y diagnóstico de problemas',
      icono: Search,
      color: 'bg-orange-600/20 hover:bg-orange-600/30 border-orange-500/30',
      colorIcon: 'text-orange-400',
      colorText: 'text-orange-100',
      ruta: '/ordenes/diagnostico',
      count: ordenesCount.diagnostico
    },
    {
      tipo: 'entrega',
      titulo: 'Orden de Entrega',
      descripción: 'Entrega de equipos reparados al cliente',
      icono: Truck,
      color: 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/30',
      colorIcon: 'text-purple-400',
      colorText: 'text-purple-100',
      ruta: '/ordenes/entrega',
      count: ordenesCount.entrega
    },
  ]

  // Mostrar loading si está cargando auth o datos
  if (authLoading || (ordenesLoading && user?.uid)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">
            {authLoading ? 'Verificando autenticación...' : 'Cargando datos de órdenes...'}
          </p>
        </div>
      </div>
    )
  }

  // Mostrar mensaje si no hay usuario autenticado
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Debes iniciar sesión para acceder a esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Gestión de Órdenes de Servicio
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Selecciona el tipo de orden que deseas generar o gestionar.
            </p>
          </div>
          
          <Link 
            href="/clientes/nuevo"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 w-full sm:w-auto shadow-md hover:shadow-lg"
          >
            <UserPlus size={20} />
            <span>Añadir Cliente</span>
          </Link>
        </div>

        {/* Grid de órdenes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {tiposOrden.map((orden) => {
            const IconComponent = orden.icono
            return (
              <Link
                key={orden.tipo}
                href={orden.ruta}
                className={`${orden.color} border text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col h-full group`}
              >
                <div className="p-5 sm:p-6 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-white/5 backdrop-blur-sm">
                      <IconComponent className={`w-6 h-6 sm:w-7 sm:h-7 ${orden.colorIcon}`} />
                    </div>
                    <div className="bg-black/20 text-white text-sm font-bold px-2.5 py-1 rounded-full">
                      {orden.count}
                    </div>
                  </div>
                  <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${orden.colorText} group-hover:text-white`}>
                    {orden.titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 opacity-90 mt-auto mb-2">
                    {orden.descripcion}
                  </p>
                  <div className="flex items-center mt-2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-400">
                    <span>Gestionar ahora</span>
                    <ArrowRight className="ml-1 w-3 h-3" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        <br />
        {/* Estadísticas generales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="col-span-full flex justify-center">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 w-full max-w-sm">
              <div className="flex items-center justify-center">
                <div className="flex items-center">
                  <FileCheck className="w-5 h-5 text-blue-400 mr-2" />
                  <span className="text-sm text-gray-400">Total</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-2 text-center">
                {statsLoading ? '...' : estadisticas.totalOrdenes}
              </p>
              <p className="text-xs text-gray-500 text-center">Órdenes totales</p>
            </div>
          </div>
        </div>

        {/* Botón flotante para móviles */}
        <div className="lg:hidden fixed bottom-6 right-6 z-10">
          <Link 
            href="/clientes/nuevo"
            className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-110"
            aria-label="Añadir cliente"
          >
            <PlusCircle size={24} />
          </Link>
        </div>
      </div>
    </div>
  )
};