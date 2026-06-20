'use client'
import { useState, useEffect, useCallback, Suspense, memo, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Shield,
  Wrench,
  Plus,
  ArrowRight,
  ClipboardList,
  Stethoscope,
  FileX,
  FileEdit,
  Package,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  useOrdenesRecientes,
  useEstadisticasUsuario,
  usePrefetchData,
} from '@/hooks/useMultiUser'
import { useNegocio } from '@/hooks/useNegocio'
import { OrdenMantenimiento } from '@/types/orden'
import { useQueryClient } from '@tanstack/react-query'
import ModalOrden from '@/components/mantenimiento/ModalOrden'
import OrdenCard from '@/components/mantenimiento/OrdenCard'
import { OfflineSyncBanner } from '@/components/ui/OfflineSyncBanner'
import { usePrintService } from '@/components/mantenimiento/PrintService'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { useDashboardGreeting } from '@/hooks/ordenes/useDashboardGreeting'
import { useDraftBanner } from '@/hooks/ordenes/useDraftBanner'
import { useOnboardingFlow } from '@/hooks/ordenes/useOnboardingFlow'
import { useMobileNavigation } from '@/components/providers/MobileNavigationContext'
import OnboardingSuccess from '@/components/onboarding/OnboardingSuccess'
import WelcomeScreen from '@/components/onboarding/WelcomeScreen'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Derive up to 2 initials from a display name or email */
function getInitials(name?: string | null, email?: string | null): string {
  const source = name || email || '?'
  const parts = source.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

// ─── BusinessAvatar ──────────────────────────────────────────────────────────
/**
 * FIX: Replaces raw <img onError> with a controlled component.
 *
 * Problem: setting `e.currentTarget.src = '/logo.png'` inside onError
 * causes an infinite loop when /logo.png itself 404s — onError fires again
 * and again. The fix tracks a `failed` boolean ref so the fallback
 * only triggers once, and renders an initials <div> instead of retrying.
 */
const BusinessAvatar = memo(
  ({
    logoUrl,
    photoURL,
    displayName,
    email,
    className = '',
  }: {
    logoUrl?: string | null
    photoURL?: string | null
    displayName?: string | null
    email?: string | null
    className?: string
  }) => {
    const [imgFailed, setImgFailed] = useState(false)
    const hasTriedFallback = useRef(false)

    // Reset failure state when the source URL actually changes
    const src = logoUrl || photoURL || null
    const prevSrc = useRef(src)
    useEffect(() => {
      if (prevSrc.current !== src) {
        prevSrc.current = src
        setImgFailed(false)
        hasTriedFallback.current = false
      }
    }, [src])

    const baseClass = cn(
      'w-12 h-12 rounded-xl shrink-0 object-cover',
      className
    )

    if (src && !imgFailed) {
      return (
        <img
          src={src}
          alt="Logo"
          className={baseClass + ' bg-gray-800 border border-gray-700'}
          onError={() => {
            // Guard: only set failed once — prevents any re-render loop
            if (!hasTriedFallback.current) {
              hasTriedFallback.current = true
              setImgFailed(true)
            }
          }}
        />
      )
    }

    // Fallback: initials avatar — zero network requests
    const initials = getInitials(displayName, email)
    return (
      <div
        aria-label={`Avatar de ${displayName || email || 'usuario'}`}
        className={cn(
          'w-12 h-12 rounded-xl shrink-0 flex items-center justify-center',
          'bg-blue-600/20 border border-blue-500/30 select-none',
          className
        )}
      >
        <span className="text-sm font-bold text-blue-300 tracking-wide">{initials}</span>
      </div>
    )
  }
)
BusinessAvatar.displayName = 'BusinessAvatar'

// ─── StatCard ────────────────────────────────────────────────────────────────

const TIPO_COLORS: Record<string, string> = {
  preventivo: 'bg-green-500/20 text-green-400 border-green-500/30',
  correctivo: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  diagnostico: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  instalacion: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  garantia: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

const getTipoColor = (tipo: string) =>
  TIPO_COLORS[tipo] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'

const StatCard = memo(
  ({
    icon: Icon,
    value,
    label,
    colorClass = 'border-gray-700/50',
    onClick,
  }: {
    icon: React.ElementType
    value: number
    label: string
    colorClass?: string
    onClick?: () => void
  }) => {
    const Component = onClick ? 'button' : 'div'
    
    return (
      <Component
        onClick={onClick}
        type={onClick ? "button" : undefined}
        className={cn(
          'snap-start shrink-0 w-32 bg-gray-800/40 border rounded-2xl p-4',
          'flex flex-col items-center justify-center',
          'transition-all duration-150',
          onClick ? 'cursor-pointer hover:bg-gray-800/60 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400' : 'cursor-default',
          colorClass
        )}
        role={onClick ? 'button' : 'listitem'}
        aria-label={onClick ? `Ver órdenes de tipo ${label}` : undefined}
      >
        <Icon className="w-5 h-5 text-gray-400 mb-1.5" aria-hidden="true" />
        <span className="text-xl font-bold text-white tabular-nums">{value}</span>
        <span className="text-xs uppercase tracking-wider text-gray-400 font-medium text-center leading-tight mt-0.5">
          {label}
        </span>
      </Component>
    )
  }
)
StatCard.displayName = 'StatCard'

// ─── EmptyOrdenes ────────────────────────────────────────────────────────────

const EmptyOrdenes = memo(
  ({ onCreate }: { onCreate: () => void }) => (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center rounded-xl border border-dashed border-gray-700/60 bg-gray-800/20">
      <div className="w-12 h-12 rounded-xl bg-gray-800/60 border border-gray-700/50 flex items-center justify-center mb-3">
        <FileX className="w-6 h-6 text-gray-600" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-white">Sin órdenes recientes</p>
      <p className="text-xs text-gray-400 mt-1">
        Las órdenes que crees aparecerán aquí.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-500 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Crear nueva orden
      </button>
    </div>
  )
)
EmptyOrdenes.displayName = 'EmptyOrdenes'

// ─── DraftBanner ─────────────────────────────────────────────────────────────

const DraftBanner = memo(
  ({
    onDiscard,
    onResume,
  }: {
    onDiscard: () => void
    onResume: () => void
  }) => {
    const [isConfirming, setIsConfirming] = useState(false)

    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-xl overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {!isConfirming ? (
            <motion.div
              key="alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileEdit className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium text-blue-300 truncate">
                  Orden en pausa detectada
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={() => setIsConfirming(true)}
                  className="flex-1 sm:flex-none text-gray-400 bg-gray-800/80 border border-gray-700/50 px-3 py-2 min-h-[44px] text-xs rounded-lg transition-colors hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                  aria-label="Descartar orden en pausa"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={onResume}
                  className="flex-1 sm:flex-none bg-blue-600 text-white px-3 py-2 min-h-[44px] rounded-lg text-xs font-bold transition-all active:scale-95 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md shadow-blue-900/20"
                  aria-label="Reanudar orden en pausa"
                >
                  Reanudar
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileEdit className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium text-red-300 truncate">
                  ¿Seguro que deseas descartar?
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  className="flex-1 sm:flex-none text-gray-400 bg-gray-800/80 border border-gray-700/50 px-3 py-2 min-h-[44px] text-xs rounded-lg transition-colors hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirming(false)
                    onDiscard()
                  }}
                  className="flex-1 sm:flex-none bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 min-h-[44px] rounded-lg text-xs font-bold transition-all active:scale-95 hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  Confirmar descarte
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)
DraftBanner.displayName = 'DraftBanner'

// ─── Page shell ─────────────────────────────────────────────────────────────

export default function OrdenesDashboardPage() {
  return (
    <Suspense fallback={null}>
      <OrdenesDashboardContent />
    </Suspense>
  )
}

// ─── Main content ────────────────────────────────────────────────────────────

function OrdenesDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { openModal } = useMobileNavigation()

  const { user, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()

  const { data: ordenesRecientes = [], isLoading: ordenesLoading, isError: ordenesError, isRefetching } = useOrdenesRecientes(3)
  const { estadisticas, loading: statsLoading } = useEstadisticasUsuario()
  const { negocio, loading: negocioLoading } = useNegocio()

  const { imprimirOrden, compartirOrden, descargarPDF, formatFecha, generarPDFBlob, generarHTML } =
    usePrintService({ negocio })
  const { prefetchOrdenes, prefetchClientes } = usePrefetchData()

  const greetingData = useDashboardGreeting(negocio, user, estadisticas.totalOrdenes)
  const { hayBorrador, descartarBorrador, syncDraft } = useDraftBanner()
  const onboarding = useOnboardingFlow(
    user,
    statsLoading,
    negocioLoading,
    negocio,
    estadisticas.totalOrdenes
  )

  const [view, setView] = useState<'dashboard' | 'welcome' | 'success'>('dashboard')
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenMantenimiento | null>(null)
  const isDashboardLoading = ordenesLoading || statsLoading || negocioLoading

  const isOnboardingActive = negocio && !negocio.onboardingCompleted;

  const handleCreateNuevaOrden = () => {
    openModal()
  }

  const isFormOpen = searchParams.get('modal') === 'crear-orden'
  
  useEffect(() => {
    if (!isFormOpen) {
      syncDraft()
    }
  }, [isFormOpen, syncDraft])

  // No automatic full-screen redirects for welcome/success views to allow progressive dashboard onboarding

  const refrescarDatos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ordenes'] })
    queryClient.invalidateQueries({ queryKey: ['estadisticas'] })
    queryClient.invalidateQueries({ queryKey: ['negocio'] })
  }, [queryClient])

  useEffect(() => {
    if (user?.uid) {
      prefetchOrdenes()
      prefetchClientes()
    }
  }, [user?.uid, prefetchOrdenes, prefetchClientes])

  // El formulario ahora se abre vía search params o modal context, no usando view='form'

  // ── Se eliminó el skeleton gigante para permitir que la caché hidrate inmediatamente ──

  // ── Not authenticated / Loading ──────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center bg-gray-800/50 rounded-xl p-8 max-w-md">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
          <p className="text-gray-400">Debes iniciar sesión para acceder a esta página.</p>
        </div>
      </div>
    )
  }

  // Onboarding views removed in favor of progressive dashboard checklist
  if (showSuccessScreen) {
    return (
      <OnboardingSuccess
        onFinish={() => {
          setShowSuccessScreen(false);
          onboarding.skipOnboarding();
        }}
      />
    )
  }

  // (Formulario ahora es manejado de manera global a través de Search Params)

  // ── Dashboard ────────────────────────────────────────────────────────────
  return (
    <div className="bg-transparent min-h-screen pb-safe">
      {/* Header */}
      <div className=" top-0 z-40 bg-gray-900/95 border-b border-gray-800 pt-safe backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <BusinessAvatar
              logoUrl={negocio?.logoUrl || '/icono.png'}
              displayName={greetingData.title}
              className="w-12 h-12 shadow-inner border border-gray-800 p-0.5 bg-white"
            />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white truncate" title={greetingData.title}>{greetingData.title}</h1>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mt-0.5">
                {greetingData.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 space-y-6">
        <OfflineSyncBanner />

        {/* Nueva Orden CTA */}
        <button
          type="button"
          onClick={handleCreateNuevaOrden}
          disabled={isDashboardLoading}
          aria-label="Emitir nueva orden de mantenimiento"
          className={cn(
            "w-full bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-lg shadow-blue-900/20",
            "py-4 px-4 min-h-[56px] focus:outline-none focus:ring-2 focus:ring-blue-400",
            isDashboardLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 active:scale-95"
          )}
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          Nueva Orden
        </button>

        {/* Draft banner */}
        <AnimatePresence>
          {hayBorrador && (
            <DraftBanner
              onDiscard={descartarBorrador}
              onResume={handleCreateNuevaOrden}
            />
          )}
        </AnimatePresence>

        {/* Estadísticas */}
        <section aria-labelledby="resumen-heading">
          <div className="flex items-center justify-between ml-1 mb-3">
            <h2
              id="resumen-heading"
              className="text-sm font-bold text-gray-400 uppercase tracking-widest"
            >
              Resumen
            </h2>
            <button 
              onClick={refrescarDatos} 
              className="flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-500 hover:text-blue-400 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={isRefetching || isDashboardLoading}
              aria-label="Actualizar datos"
            >
              <RefreshCw className={cn("w-5 h-5", (isRefetching || isDashboardLoading) && "animate-spin text-blue-400")} />
            </button>
          </div>

          {statsLoading && estadisticas.totalOrdenes === 0 ? (
            <div className="flex gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" role="status" aria-label="Cargando estadísticas">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="snap-start shrink-0 w-32 h-24 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div
              className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [mask-image:linear-gradient(to_right,black_80%,transparent)] sm:[mask-image:none] scrollbar-none sm:scrollbar-auto snap-x snap-mandatory"
              role="list"
              aria-label="Estadísticas de actividad"
            >
              <StatCard 
                icon={ClipboardList} 
                value={estadisticas.totalOrdenes} 
                label="Total" 
                onClick={() => router.push('/ordenes/mantenimiento')}
              />
              <StatCard
                icon={Shield}
                value={estadisticas.preventivos}
                label="Preventivos"
                colorClass="border-green-500/20"
                onClick={() => router.push('/ordenes/mantenimiento?tipo=preventivo')}
              />
              <StatCard
                icon={Wrench}
                value={estadisticas.correctivos}
                label="Correctivos"
                colorClass="border-orange-500/20"
                onClick={() => router.push('/ordenes/mantenimiento?tipo=correctivo')}
              />
              <StatCard
                icon={Stethoscope}
                value={estadisticas.diagnosticos}
                label="Diagnósticos"
                colorClass="border-blue-500/20"
                onClick={() => router.push('/ordenes/mantenimiento?tipo=diagnostico')}
              />
              <StatCard
                icon={Package}
                value={estadisticas.instalaciones}
                label="Instalaciones"
                colorClass="border-purple-500/20"
                onClick={() => router.push('/ordenes/mantenimiento?tipo=instalacion')}
              />
              <StatCard
                icon={Shield}
                value={estadisticas.garantias || 0}
                label="Garantías"
                colorClass="border-amber-500/20"
                onClick={() => router.push('/ordenes/mantenimiento?tipo=garantia')}
              />
            </div>
          )}
        </section>

        {/* Órdenes recientes */}
        <section aria-labelledby="recientes-heading">
          <h2
            id="recientes-heading"
            className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1 mb-3"
          >
            Recientes
          </h2>

          {ordenesLoading && ordenesRecientes.length === 0 ? (
            <div className="grid gap-3" role="status" aria-label="Cargando órdenes recientes">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : ordenesError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
              <p className="text-sm font-medium text-red-400">Error al cargar las órdenes</p>
              <button 
                onClick={refrescarDatos} 
                className="mt-3 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-bold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Reintentar
              </button>
            </div>
          ) : ordenesRecientes.length > 0 ? (
            <div className="grid gap-3">
              {ordenesRecientes.map((o) => (
                <OrdenCard
                  key={o.id}
                  orden={o}
                  onView={setOrdenSeleccionada}
                  onPrint={imprimirOrden}
                  onShare={compartirOrden}
                  onDownload={descargarPDF}
                  getTipoColor={getTipoColor}
                  formatFecha={formatFecha}
                />
              ))}
            </div>
          ) : (
            <EmptyOrdenes onCreate={handleCreateNuevaOrden} />
          )}

          {ordenesRecientes.length > 0 && (
            <Link
              href="/ordenes/mantenimiento"
              className="mt-3 flex items-center justify-center w-full py-3 text-sm text-blue-400 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:bg-gray-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Ver todo el historial
              <ArrowRight className="w-3.5 h-3.5 ml-2" aria-hidden="true" />
            </Link>
          )}
        </section>
      </div>

      {/* Orden modal */}
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

      {/* Welcome Modal */}
      <AnimatePresence>
        {onboarding.showWelcome && (
          <WelcomeScreen 
            onStartOnboarding={() => {
              onboarding.startOnboarding();
              openModal({ onboarding: true });
            }}
            onSkip={onboarding.skipOnboarding}
          />
        )}
      </AnimatePresence>
    </div>
  )
}