'use client'
import { useState, useEffect, useCallback, Suspense, memo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Shield,
  Wrench,
  Plus,
  ArrowRight,
  ClipboardList,
  Stethoscope,
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { 
  useOrdenesRecientes, 
  useEstadisticasUsuario, 
  usePrefetchData
} from '@/hooks/useMultiUser'
import { useNegocio } from '@/hooks/useNegocio'
import { OrdenMantenimiento } from '@/types/orden'
import { useQueryClient } from '@tanstack/react-query'

import FormularioMantenimiento from '@/app/(app)/ordenes/mantenimiento/formulario'
import ModalOrden from '@/components/mantenimiento/ModalOrden'
import OrdenCard from '@/components/mantenimiento/OrdenCard'
import { usePrintService } from '@/components/mantenimiento/PrintService'
import WelcomeScreen from '@/components/onboarding/WelcomeScreen'
import OnboardingSuccess from '@/components/onboarding/OnboardingSuccess'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Hooks
import { useDashboardGreeting } from '@/hooks/ordenes/useDashboardGreeting'
import { useDraftBanner } from '@/hooks/ordenes/useDraftBanner'
import { useOnboardingFlow } from '@/hooks/ordenes/useOnboardingFlow'
import { useMobileNavigation } from '@/components/providers/MobileNavigationContext'

export default function OrdenesDashboardPage() {
  return (
    <Suspense fallback={null}>
      <OrdenesDashboardContent />
    </Suspense>
  )
}


const TIPO_COLORS: Record<string, string> = {
  preventivo: 'bg-green-500/20 text-green-400 border-green-500/30',
  correctivo: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  diagnostico: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  instalacion: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const getTipoColor = (tipo: string) => TIPO_COLORS[tipo] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

const StatCard = memo(({ icon: Icon, value, label, colorClass = "border-gray-700/50" }: any) => (
  <div className={cn(
    "snap-start shrink-0 w-32 bg-gray-800/40 border rounded-2xl p-4 flex flex-col items-center justify-center transition-transform active:scale-95",
    colorClass
  )} role="listitem">
    <Icon className="w-5 h-5 text-gray-400 mb-1.5" />
    <span className="text-xl font-bold text-white">{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{label}</span>
  </div>
));
StatCard.displayName = 'StatCard';

function OrdenesDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const { data: ordenesRecientes = [], isLoading: ordenesLoading } = useOrdenesRecientes(3)
  const { estadisticas, loading: statsLoading } = useEstadisticasUsuario()
  const { negocio, loading: negocioLoading } = useNegocio()
  const { imprimirOrden, compartirOrden, descargarPDF, formatFecha, generarPDFBlob, generarHTML } = usePrintService({ negocio })
  const { prefetchOrdenes, prefetchClientes } = usePrefetchData()
  const { pendingAction, consumePendingAction } = useMobileNavigation()

  // Custom Hooks
  const greetingData = useDashboardGreeting(negocio, user)
  const { hayBorrador, descartarBorrador, syncDraft } = useDraftBanner()
  const onboarding = useOnboardingFlow(user, statsLoading, negocioLoading, negocio, estadisticas.totalOrdenes)

  const [view, setView] = useState<'dashboard' | 'welcome' | 'success' | 'form'>('dashboard')
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenMantenimiento | null>(null)

  useEffect(() => {
    if (onboarding.showWelcome) setView('welcome')
    else if (onboarding.showSuccess) setView('success')
    else setView('dashboard')
  }, [onboarding.showWelcome, onboarding.showSuccess])

  const refrescarDatos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ordenes', user?.uid] })
  }, [queryClient, user?.uid])

  useEffect(() => {
    if (user?.uid) {
      prefetchOrdenes();
      prefetchClientes();
    }
  }, [user?.uid, prefetchOrdenes, prefetchClientes]);

  useEffect(() => {
    if (searchParams.get('nueva') === 'true') {
      setView('form');
      router.replace('/ordenes', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (pendingAction === 'open-nueva-orden') {
      setView('form');
      consumePendingAction();
    }
  }, [pendingAction, consumePendingAction]);

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center bg-gray-800/50 rounded-xl p-8 max-w-md">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
          <p className="text-gray-400">Debes iniciar sesión para acceder a esta página.</p>
        </div>
      </div>
    )
  }

  if (view === 'welcome') return (
    <WelcomeScreen 
      onStartOnboarding={() => { onboarding.startOnboarding(); setView('form'); }} 
      onSkip={() => { onboarding.skipOnboarding(); setView('dashboard'); }}
    />
  );

  if (view === 'success') return (
    <OnboardingSuccess onFinish={() => { onboarding.closeSuccess(); setView('dashboard'); refrescarDatos(); }} />
  );

  if (view === 'form') return (
    <FormularioMantenimiento
      isOnboarding={onboarding.isOnboardingMode}
      onClose={() => {
        onboarding.setIsOnboardingMode(false);
        setView('dashboard');
        syncDraft(); // Sincronizar estado del borrador al cerrar
      }}
      onSuccess={() => {
        if (onboarding.isOnboardingMode) {
            onboarding.finishOnboarding();
            setView('success');
        } else {
            setView('dashboard');
            refrescarDatos();
            syncDraft(); // Limpiar estado del borrador tras éxito
        }
      }}
    />
  );

  return (
    <div className="bg-transparent min-h-screen pb-safe">
      <div className="bg-gray-900 border-b border-gray-800 pt-safe">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
             <img 
                src={negocio?.logoUrl || user.photoURL || '/logo.png'} 
                alt="Logo"
                onError={(e) => (e.currentTarget.src = '/logo.png')}
                className="w-12 h-12 object-cover rounded-xl bg-gray-800 border border-gray-700 shrink-0"
              />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white truncate">{greetingData.title}</h1>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">{greetingData.subtitle}</p>
              <p className="text-[10px] text-blue-400 font-medium mt-0.5">{greetingData.motivational}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 space-y-6">
        <button
          onClick={() => setView('form')}
          aria-label="Emitir nueva orden de mantenimiento"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="font-bold">Nueva Orden</span>
        </button>

        {hayBorrador && (
          <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="text-xs text-blue-400">Orden en pausa detectada.</span>
            <div className="flex gap-2">
              <button onClick={descartarBorrador} className="text-blue-600/70 px-2 py-1 text-xs hover:text-blue-600">Descartar</button>
              <button onClick={() => setView('form')} className="bg-blue-500 text-gray-900 px-3 py-1 rounded-lg text-xs font-bold">Reanudar</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Resumen</h2>
          <div className="relative">
            <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [mask-image:linear-gradient(to_right,black_90%,transparent)]" role="list" aria-label="Estadísticas de actividad">
                <StatCard icon={ClipboardList} value={estadisticas.totalOrdenes} label="Total" />
                <StatCard icon={Shield} value={estadisticas.preventivos} label="Preventivos" colorClass="border-green-500/20" />
                <StatCard icon={Wrench} value={estadisticas.correctivos} label="Correctivos" colorClass="border-orange-500/20" />
                <StatCard icon={Stethoscope} value={estadisticas.diagnosticos} label="Diagnósticos" colorClass="border-blue-500/20" />
                <StatCard icon={Wrench} value={estadisticas.instalaciones} label="Instalaciones" colorClass="border-purple-500/20" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Recientes</h2>
          {ordenesRecientes.length > 0 ? (
            <div className="grid gap-3">
              {ordenesRecientes.map((o) => (
                <OrdenCard key={o.id} orden={o} onView={setOrdenSeleccionada} onPrint={imprimirOrden} onShare={compartirOrden} onDownload={descargarPDF} getTipoColor={getTipoColor} formatFecha={formatFecha} />
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-gray-500 py-4">No hay órdenes recientes</p>
          )}

          {estadisticas.totalOrdenes >= 3 && (
            <Link href="/ordenes/mantenimiento" className="flex items-center justify-center w-full py-3 text-sm text-blue-400 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:bg-gray-800/50">
              Ver todo el historial <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Link>
          )}
        </div>
      </div>

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
  )
}