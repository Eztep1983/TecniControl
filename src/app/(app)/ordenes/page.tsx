'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { 
  Shield, 
  Wrench, 
  Plus,
  Clock,
  Loader2,
  ArrowRight,
  ClipboardList
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useOrdenesUsuario, useEstadisticasUsuario } from '@/hooks/useMultiUser'
import { useNegocio } from '@/hooks/useNegocio'
import { OrdenMantenimiento } from '@/types/orden'

import FormularioMantenimiento from '@/app/(app)/ordenes/mantenimiento/formulario'
import ModalOrden from '@/components/mantenimiento/ModalOrden'
import OrdenCard from '@/components/mantenimiento/OrdenCard'
import { usePrintService } from '@/components/mantenimiento/PrintService'
import AnimatedContent from '@/components/ui/AnimatedContent'

export default function OrdenesDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { ordenes: todasLasOrdenes, loading: ordenesLoading, refrescarOrdenes } = useOrdenesUsuario()
  const { estadisticas, loading: statsLoading } = useEstadisticasUsuario()
  const { negocio } = useNegocio()
  const { imprimirOrden, compartirOrden, descargarPDF, formatFecha } = usePrintService({ negocio })

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [hayBorrador, setHayBorrador] = useState(false)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenMantenimiento | null>(null)

  useEffect(() => {
    if (localStorage.getItem('draft_mantenimiento')) {
      setHayBorrador(true)
    }
  }, [])

  // Filtrar solo mantenimiento
  const ordenesMantenimiento = useMemo(() => {
    return todasLasOrdenes.filter(orden => orden.tipo === 'mantenimiento') as OrdenMantenimiento[]
  }, [todasLasOrdenes])

  // Órdenes recientes (últimas 3)
  const ordenesRecientes = useMemo(() => {
    return [...ordenesMantenimiento]
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      .slice(0, 3)
  }, [ordenesMantenimiento])

  // Estadísticas
  const stats = useMemo(() => ({
    preventivos: ordenesMantenimiento.filter(o => o.tipoMantenimiento === 'preventivo').length,
    correctivos: ordenesMantenimiento.filter(o => o.tipoMantenimiento === 'correctivo').length,
    diagnosticos: ordenesMantenimiento.filter(o => o.tipoMantenimiento === 'diagnostico').length,
    instalaciones: ordenesMantenimiento.filter(o => o.tipoMantenimiento === 'instalacion').length,
    garantias: ordenesMantenimiento.filter(o => o.tipoMantenimiento === 'garantia').length,
    total: ordenesMantenimiento.length
  }), [ordenesMantenimiento])

  const getTipoColor = useCallback((tipo: string) => {
    const colors: Record<string, string> = {
      preventivo: 'bg-green-500/20 text-green-400 border-green-500/30',
      correctivo: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      diagnostico: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      instalacion: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      garantia: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    }
    return colors[tipo] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }, [])

  // Loading state
  if (authLoading || (ordenesLoading && user?.uid && todasLasOrdenes.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">
            {authLoading ? 'Verificando autenticación...' : 'Cargando dashboard...'}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-20">
      {/* Header Profile/Title */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 pt-safe">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                Bienvenido,<br/>
                {user.displayName} 
              </h1>
              <p className="text-sm sm:text-base text-gray-400">
                Resumen de servicios técnicos
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">

        {/* Quick Actions / Main FAB-like Button */}
        <AnimatedContent
          distance={40}
          direction="vertical"
          duration={0.4}
          delay={0.1}
        >
          <button
            onClick={() => setMostrarFormulario(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-[0.98] text-white p-4 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-lg shadow-blue-500/25 group touch-manipulation"
          >
            <div className="bg-white/20 p-2 rounded-full">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold">Emitir Nueva Orden</span>
          </button>
        </AnimatedContent>

        {/* Borrador Activo Banner */}
        {hayBorrador && (
          <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm text-blue-400 font-medium">Tienes una orden en pausa.</span>
            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={() => {
                  localStorage.removeItem('draft_mantenimiento');
                  setHayBorrador(false);
                }}
                className="flex-1 sm:flex-none border border-blue-600/30 text-blue-600 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={() => setMostrarFormulario(true)}
                className="flex-1 sm:flex-none bg-blue-500 text-gray-900 px-4 py-1.5 rounded-lg text-sm font-bold shadow-md shadow-blue-500/20"
              >
                Reanudar
              </button>
            </div>
          </div>
        )}

        {/* Estadísticas Scroll Horizontal */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider ml-1">
            Resumen de Actividad
          </h2>
          <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4 sm:mx-0 sm:px-0">
            {/* Total Widget */}
            <div className="snap-start shrink-0 w-32 bg-gray-800/80 border border-gray-700/50 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <ClipboardList className="w-6 h-6 text-gray-400 mb-2" />
               <span className="text-2xl font-bold text-white">{stats.total}</span>
               <span className="text-xs text-gray-400 mt-1">Total</span>
            </div>
            
            <div className="snap-start shrink-0 w-32 bg-gray-800/80 border border-green-500/20 rounded-2xl p-4 flex flex-col items-center justify-center">
               <Wrench className="w-6 h-6 text-green-400 mb-2" />
               <span className="text-2xl font-bold text-white">{stats.preventivos}</span>
               <span className="text-xs text-gray-400 mt-1">Preventivos</span>
            </div>
            <div className="snap-start shrink-0 w-32 bg-gray-800/80 border border-orange-500/20 rounded-2xl p-4 flex flex-col items-center justify-center">
               <Wrench className="w-6 h-6 text-orange-400 mb-2" />
               <span className="text-2xl font-bold text-white">{stats.correctivos}</span>
               <span className="text-xs text-gray-400 mt-1">Correctivos</span>
            </div>
            <div className="snap-start shrink-0 w-32 bg-gray-800/80 border border-blue-500/20 rounded-2xl p-4 flex flex-col items-center justify-center">
               <Wrench className="w-6 h-6 text-blue-400 mb-2" />
               <span className="text-2xl font-bold text-white">{stats.diagnosticos}</span>
               <span className="text-xs text-gray-400 mt-1">Diagnósticos</span>
            </div>
            <div className="snap-start shrink-0 w-32 bg-gray-800/80 border border-purple-500/20 rounded-2xl p-4 flex flex-col items-center justify-center">
               <Wrench className="w-6 h-6 text-purple-400 mb-2" />
               <span className="text-2xl font-bold text-white">{stats.instalaciones}</span>
               <span className="text-xs text-gray-400 mt-1">Instalaciones</span>
            </div>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="space-y-4">
          <div className="flex items-center justify-between ml-1">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Órdenes Recientes
            </h2>
          </div>

          {ordenesRecientes.length > 0 ? (
            <div className="grid gap-3">
              {ordenesRecientes.map((orden) => (
                <OrdenCard
                  key={orden.idPersonalizado}
                  orden={orden}
                  onView={() => setOrdenSeleccionada(orden)}
                  onPrint={imprimirOrden}
                  onShare={compartirOrden}
                  onDownload={descargarPDF}
                  getTipoColor={getTipoColor}
                  formatFecha={formatFecha}
                />
              ))}
            </div>
          ) : (
             <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-sm text-gray-400">
                Aún no tienes órdenes registradas
              </p>
            </div>
          )}

          {stats.total > 3 && (
            <Link 
              href="/ordenes/mantenimiento"
              className="flex items-center justify-center w-full py-4 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors bg-gray-800/30 hover:bg-gray-800/50 rounded-xl border border-gray-700/50"
            >
              Ver historial completo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          )}
        </div>

      </div>

      {/* Modal View Orden */}
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
  )
}