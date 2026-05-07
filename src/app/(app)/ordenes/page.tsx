'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  Shield, 
  Wrench, 
  Truck,
  ArrowRight,
  FileCheck,
  Clock,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useOrdenesUsuario, useEstadisticasUsuario } from '@/hooks/useMultiUser'

export default function OrdenesPage() {
  const { user, loading: authLoading } = useAuth()
  const { ordenes, loading: ordenesLoading } = useOrdenesUsuario()
  const { estadisticas, loading: statsLoading } = useEstadisticasUsuario()

  // Memoizar conteo de órdenes para evitar recálculos innecesarios
  const ordenesCount = useMemo(() => {
    if (ordenes.length === 0) {
      return { mantenimiento: 0, entrega: 0 }
    }

    return ordenes.reduce((acc, orden) => {
      const tipo = orden.tipo as 'mantenimiento' | 'entrega'
      if (acc.hasOwnProperty(tipo)) {
        acc[tipo]++
      }
      return acc
    }, { mantenimiento: 0, entrega: 0 })
  }, [ordenes])

  // Configuración de tipos de orden (constante, no cambia)
  const tiposOrden = useMemo(() => [
    {
      tipo: 'mantenimiento',
      titulo: 'Mantenimiento',
      descripcion: 'Preventivo y correctivo de equipos',
      icono: Wrench,
      color: 'bg-green-600/20 hover:bg-green-600/30 border-green-500/30',
      colorIcon: 'text-green-400',
      colorBadge: 'bg-green-500/20 text-green-300',
      ruta: '/ordenes/mantenimiento'
    },
    {
      tipo: 'entrega',
      titulo: 'Entrega',
      descripcion: 'Entrega de equipos al cliente',
      icono: Truck,
      color: 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/30',
      colorIcon: 'text-purple-400',
      colorBadge: 'bg-purple-500/20 text-purple-300',
      ruta: '/ordenes/entrega'
    }
  ] as const, [])

  // Loading state
  if (authLoading || (ordenesLoading && user?.uid)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">
            {authLoading ? 'Verificando autenticación...' : 'Cargando órdenes...'}
          </p>
        </div>
      </div>
    )
  }

  // No authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center bg-gray-800/50 rounded-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
          <p className="text-gray-400">Debes iniciar sesión para acceder a esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header con gradiente */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl text-center sm:text-3xl font-bold text-white mb-1">
                Órdenes de Servicio
              </h1>
              <p className="text-sm text-center sm:text-base text-gray-400">
                Selecciona el tipo de orden que deseas gestionar
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Estadística total destacada */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 rounded-xl p-6 border border-gray-700/50 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total de Órdenes</p>
                  <p className="text-3xl font-bold text-white">
                    {statsLoading ? (
                      <span className="text-gray-600">...</span>
                    ) : (
                      estadisticas.totalOrdenes
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de tipos de orden */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {tiposOrden.map((orden) => {
            const IconComponent = orden.icono
            const count = ordenesCount[orden.tipo as keyof typeof ordenesCount]
            
            return (
              <Link
                key={orden.tipo}
                href={orden.ruta}
                className={`${orden.color} border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] group touch-manipulation`}
              >
                <div className="p-5 sm:p-6">
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-lg bg-white/5 backdrop-blur-sm ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`w-6 h-6 ${orden.colorIcon}`} />
                    </div>
                    <div className={`${orden.colorBadge} px-3 py-1 rounded-full font-bold text-sm`}>
                      {count}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="space-y-2 mb-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-white transition-colors">
                      {orden.titulo}
                    </h3>
                    <p className="text-sm text-gray-300/90 leading-relaxed">
                      {orden.descripcion}
                    </p>
                  </div>

                  {/* Footer con acción */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-xs font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                      {count === 0 ? 'Sin órdenes' : count === 1 ? '1 orden' : `${count} órdenes`}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-white transition-all">
                      <span>Gestionar</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Sección de ayuda/información adicional */}
        {!statsLoading && estadisticas.totalOrdenes === 0 && (
          <div className="mt-8 bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Comienza creando tu primera orden
            </h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Selecciona uno de los tipos de orden arriba para comenzar a gestionar tus servicios
            </p>
          </div>
        )}
      </div>

    </div>
  )
}