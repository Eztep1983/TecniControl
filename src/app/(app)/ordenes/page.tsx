'use client'
import { useState, useEffect, useMemo, useCallback, Suspense, memo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Shield,
  Wrench,
  Plus,
  Clock,
  Loader2,
  ArrowRight,
  ClipboardList,
  Stethoscope
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { 
  useOrdenesRecientes, 
  useEstadisticasUsuario, 
  usePrefetchData,
  useCompletarOnboarding 
} from '@/hooks/useMultiUser'
import { useNegocio } from '@/hooks/useNegocio'
import { OrdenMantenimiento } from '@/types/orden'
import { useQueryClient } from '@tanstack/react-query'

import FormularioMantenimiento from '@/app/(app)/ordenes/mantenimiento/formulario'
import ModalOrden from '@/components/mantenimiento/ModalOrden'
import OrdenCard from '@/components/mantenimiento/OrdenCard'
import { usePrintService } from '@/components/mantenimiento/PrintService'
import AnimatedContent from '@/components/ui/AnimatedContent'
import WelcomeScreen from '@/components/onboarding/WelcomeScreen'
import OnboardingSuccess from '@/components/onboarding/OnboardingSuccess'
import { cn } from '@/lib/utils'

export default function OrdenesDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    }>
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

// Memoized Stat Card for better performance
const StatCard = memo(({ icon: Icon, value, label, colorClass = "border-gray-700/50" }: any) => (
  <div className={cn(
    "snap-start shrink-0 w-32 bg-gray-800/40 border rounded-2xl p-4 flex flex-col items-center justify-center transition-transform active:scale-95",
    colorClass
  )}>
    <Icon className="w-6 h-6 text-gray-400 mb-2" />
    <span className="text-2xl font-bold text-white">{value}</span>
    <span className="text-xs text-gray-400 mt-1">{label}</span>
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
  const { mutate: markOnboardingCompleted } = useCompletarOnboarding()

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [hayBorrador, setHayBorrador] = useState(false)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenMantenimiento | null>(null)
  
  // Onboarding state
  const [showWelcome, setShowWelcome] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isOnboardingMode, setIsOnboardingMode] = useState(false)

  const refrescarDatos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ordenes', user?.uid] })
  }, [queryClient, user?.uid])

  const handleViewOrden = useCallback((orden: OrdenMantenimiento) => {
    setOrdenSeleccionada(orden)
  }, [])

  // 0. Prefetching logic
  useEffect(() => {
    if (user?.uid) {
      prefetchOrdenes();
      prefetchClientes();
    }
  }, [user?.uid, prefetchOrdenes, prefetchClientes]);

  // 1. Onboarding logic (Account-level persistence)
  useEffect(() => {
    if (!user?.uid || statsLoading || negocioLoading) return;

    // Si ya completó onboarding en Firestore, no mostrar nada
    if (negocio?.onboardingCompleted) return;

    // Si tiene órdenes pero no tiene el flag de onboarding, marcarlo como completado
    if (estadisticas.totalOrdenes > 0) {
      markOnboardingCompleted();
      return;
    }

    // Si no tiene órdenes y no ha completado el onboarding, mostrar bienvenida
    setShowWelcome(true);
  }, [user?.uid, statsLoading, negocioLoading, negocio?.onboardingCompleted, estadisticas.totalOrdenes, markOnboardingCompleted]);

  // Greeting Context Logic
  const greetingData = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const name = negocio?.nombre?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Técnico';

    let greeting = "Buenos días";
    if (hour >= 12 && hour < 18) greeting = "Buenas tardes";
    else if (hour >= 18) greeting = "Buenas noches";

    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const dateStr = `${dayNames[now.getDay()]} · ${now.getDate()} de ${monthNames[now.getMonth()]}`;

    const today = new Date().setHours(0, 0, 0, 0);
    const ordenesHoy = ordenesRecientes.filter(o => {
      const d = o.fechaCreacion?.toDate ? o.fechaCreacion.toDate() : new Date(o.fechaCreacion);
      return d.setHours(0, 0, 0, 0) === today;
    }).length;

    let activity = "Hoy sin actividad registrada";
    let motivational = "¿Listo para empezar?";

    if (ordenesHoy > 0) {
      activity = `${ordenesHoy} ${ordenesHoy === 1 ? 'orden creada' : 'órdenes creadas'} hoy`;
      motivational = "Buen día de trabajo";
    } else if (now.getDay() === 1) {
      motivational = "Nueva semana, nuevo arranque";
    } else if (now.getDay() === 5 && hour > 15) {
      motivational = "¡Casi fin de semana!";
    }

    return { title: `${greeting}, ${name}`, subtitle: dateStr, activity, motivational };
  }, [negocio?.nombre, user?.displayName, ordenesRecientes]);

  // 2. Draft & Event logic
  useEffect(() => {
    try {
      if (localStorage.getItem('draft_mantenimiento')) {
        setHayBorrador(true)
      }
    } catch (error) {
      console.warn('LocalStorage error checking draft:', error);
    }

    const handleOpenForm = () => setMostrarFormulario(true);
    window.addEventListener('open-nueva-orden', handleOpenForm);

    return () => {
      window.removeEventListener('open-nueva-orden', handleOpenForm);
    };
  }, []);

  // 3. Query params logic
  useEffect(() => {
    if (searchParams.get('nueva') === 'true') {
      setMostrarFormulario(true);
      router.replace('/ordenes', { scroll: false });
    }
  }, [searchParams, router]);

  // Loading state simplified
  const isInitialLoading = authLoading || (ordenesLoading && user?.uid && ordenesRecientes.length === 0);

  if (isInitialLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">
            {authLoading ? 'Verificando autenticación...' : 'Cargando dashboard...'}
          </p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
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

  if (showWelcome) {
    return (
      <WelcomeScreen 
        onStartOnboarding={() => {
          setShowWelcome(false);
          setIsOnboardingMode(true);
          setMostrarFormulario(true);
        }} 
        onSkip={() => {
          setShowWelcome(false);
          markOnboardingCompleted();
        }}
      />
    );
  }

  if (showSuccess) {
    return (
      <OnboardingSuccess 
        onFinish={() => {
          setShowSuccess(false);
          markOnboardingCompleted();
          refrescarDatos();
        }} 
      />
    );
  }

  if (mostrarFormulario) {
    return (
      <FormularioMantenimiento
        isOnboarding={isOnboardingMode}
        onClose={() => {
          setMostrarFormulario(false);
          setIsOnboardingMode(false);
          try {
            if (localStorage.getItem('draft_mantenimiento')) setHayBorrador(true);
          } catch (e) { console.warn(e); }
        }}
        onSuccess={() => {
          setMostrarFormulario(false);
          setHayBorrador(false);
          
          if (isOnboardingMode) {
            setIsOnboardingMode(false);
            setShowSuccess(true);
          } else {
            refrescarDatos();
          }
        }}
      />
    );
  }

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header Profile/Title - Optimized for mobile with logo integration */}
      <div className="bg-gray-900 border-b border-gray-800 pt-safe">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-4">
            {negocio?.logoUrl ? (
              <img 
                src={negocio.logoUrl} 
                alt={negocio.nombre} 
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-2xl bg-gray-800 p-1.5 border border-gray-700 shadow-inner shrink-0"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                 {user.photoURL ? (
                  <img
                    src={user.photoURL} 
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <span className="text-lg font-bold text-white">{user.displayName?.charAt(0)}</span>
                )}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1 truncate">
                {greetingData.title}
              </h1>
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <p className="text-xs sm:text-base text-gray-400 flex items-center gap-1.5 sm:gap-2">
                  <span className="shrink-0">{greetingData.subtitle}</span>
                  <span className="w-1 h-1 bg-gray-600 rounded-full shrink-0" />
                  <span className="text-blue-400 font-medium truncate">{greetingData.activity}</span>
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 italic truncate">
                  {greetingData.motivational}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">

        {/* Quick Actions / Main FAB-like Button */}
        <button
          onClick={() => setMostrarFormulario(true)}
          className="w-full bg-blue-600 active:bg-blue-700 active:scale-[0.98] text-white p-4 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-lg shadow-blue-500/10 group touch-manipulation"
        >
          <div className="bg-white/20 p-2 rounded-full">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-bold">Emitir Nueva Orden</span>
        </button>

        {/* Borrador Activo Banner */}
        {hayBorrador && (
          <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm text-blue-400 font-medium">Tienes una orden en pausa.</span>
            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('draft_mantenimiento');
                    setHayBorrador(false);
                  } catch (e) { console.warn(e); }
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
            <StatCard icon={ClipboardList} value={estadisticas.totalOrdenes} label="Total" colorClass="border-gray-700/50" />
            <StatCard icon={Shield} value={estadisticas.preventivos} label="Preventivos" colorClass="border-green-500/20" />
            <StatCard icon={Wrench} value={estadisticas.correctivos} label="Correctivos" colorClass="border-orange-500/20" />
            <StatCard icon={Stethoscope} value={estadisticas.diagnosticos} label="Diagnósticos" colorClass="border-blue-500/20" />
            <StatCard icon={Wrench} value={estadisticas.instalaciones} label="Instalaciones" colorClass="border-purple-500/20" />
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
              {ordenesRecientes.map((orden: OrdenMantenimiento) => (
                <OrdenCard
                  key={orden.id || `${orden.userId}_${orden.idPersonalizado}`}
                  orden={orden}
                  onView={handleViewOrden}
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

          {estadisticas.totalOrdenes > 3 && (
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
            generarPDFBlob={generarPDFBlob}
            generarHTML={generarHTML}
          />
      )}
    </div>
  )
}