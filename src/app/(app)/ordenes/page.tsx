'use client'
import { useState, useEffect, useCallback, Suspense, memo, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Shield,
  Wrench,
  ArrowRight,
  ClipboardList,
  Stethoscope,
  Inbox,
  FileEdit,
  Package,
  RefreshCw,
  AlertTriangle,
  Loader2,
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
          className={baseClass + ' dark:bg-gray-800 bg-gray-200 border dark:border-gray-700 border-gray-300'}
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
        <span className="text-sm font-bold dark:text-blue-300 text-blue-700 tracking-wide">{initials}</span>
      </div>
    )
  }
)
BusinessAvatar.displayName = 'BusinessAvatar'

// ─── StatCard ────────────────────────────────────────────────────────────────

const TIPO_COLORS: Record<string, string> = {
  preventivo: 'bg-green-500/20 dark:text-green-400 text-green-700 border-green-500/30',
  correctivo: 'bg-orange-500/20 dark:text-orange-400 text-orange-700 border-orange-500/30',
  diagnostico: 'bg-blue-500/20 dark:text-blue-400 text-blue-700 border-blue-500/30',
  instalacion: 'bg-purple-500/20 dark:text-purple-400 text-purple-700 border-purple-500/30',
  garantia: 'bg-amber-500/20 dark:text-amber-400 text-amber-700 border-amber-500/30',
}

const getTipoColor = (tipo: string) =>
  TIPO_COLORS[tipo] || 'bg-gray-500/20 dark:text-gray-400 text-gray-600 border-gray-500/30'

const StatCard = memo(
  ({
    icon: Icon,
    value,
    label,
    colorPrefix,
    onClick,
  }: {
    icon: React.ElementType
    value: number
    label: string
    colorPrefix?: string
    onClick?: () => void
  }) => {
    const Component = onClick ? 'button' : 'div'
    
    // Default colors if no prefix is provided
    let bgClass = 'dark:bg-gray-800/40 bg-gray-100 border-gray-200 dark:border-gray-700/50 hover:bg-gray-200 hover:dark:bg-gray-800/60'
    let textClass = 'dark:text-white text-gray-900'
    let iconClass = 'dark:text-gray-400 text-gray-500'
    let labelClass = 'dark:text-gray-400 text-gray-600'

    if (colorPrefix === 'green') {
      bgClass = 'bg-green-500/15 dark:bg-green-500/10 border-green-500/30 hover:bg-green-500/25 hover:dark:bg-green-500/20'
      textClass = 'text-green-800 dark:text-green-300'
      iconClass = 'text-green-600 dark:text-green-400'
      labelClass = 'text-green-700 dark:text-green-400'
    } else if (colorPrefix === 'orange') {
      bgClass = 'bg-orange-500/15 dark:bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/25 hover:dark:bg-orange-500/20'
      textClass = 'text-orange-800 dark:text-orange-300'
      iconClass = 'text-orange-600 dark:text-orange-400'
      labelClass = 'text-orange-700 dark:text-orange-400'
    } else if (colorPrefix === 'blue') {
      bgClass = 'bg-blue-500/15 dark:bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/25 hover:dark:bg-blue-500/20'
      textClass = 'text-blue-800 dark:text-blue-300'
      iconClass = 'text-blue-600 dark:text-blue-400'
      labelClass = 'text-blue-700 dark:text-blue-400'
    } else if (colorPrefix === 'purple') {
      bgClass = 'bg-purple-500/15 dark:bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/25 hover:dark:bg-purple-500/20'
      textClass = 'text-purple-800 dark:text-purple-300'
      iconClass = 'text-purple-600 dark:text-purple-400'
      labelClass = 'text-purple-700 dark:text-purple-400'
    } else if (colorPrefix === 'amber') {
      bgClass = 'bg-amber-500/15 dark:bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/25 hover:dark:bg-amber-500/20'
      textClass = 'text-amber-800 dark:text-amber-300'
      iconClass = 'text-amber-600 dark:text-amber-400'
      labelClass = 'text-amber-700 dark:text-amber-400'
    } else if (colorPrefix === 'gray') {
      bgClass = 'bg-gray-500/15 dark:bg-gray-500/10 border-gray-500/30 hover:bg-gray-500/25 hover:dark:bg-gray-500/20'
      textClass = 'text-gray-800 dark:text-gray-300'
      iconClass = 'text-gray-600 dark:text-gray-400'
      labelClass = 'text-gray-700 dark:text-gray-400'
    }
    
    return (
      <Component
        onClick={onClick}
        type={onClick ? "button" : undefined}
        className={cn(
          "w-full border rounded-2xl p-2.5",
          "flex flex-col items-center justify-center text-center",
          "transition-all duration-150",
          onClick ? "cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400" : "cursor-default",
          bgClass
        )}
        role={onClick ? "button" : "listitem"}
        aria-label={onClick ? `Ver órdenes de tipo ${label}` : undefined}
      >
        <Icon className={cn("w-4 h-4 mb-1", iconClass)} aria-hidden="true" />
        <span className={cn("text-lg font-bold tabular-nums leading-tight", textClass)}>{value}</span>
        <span className={cn("text-[9px] sm:text-[10px] uppercase tracking-wider font-medium text-center leading-tight mt-0.5 break-words max-w-full", labelClass)}>
          {label}
        </span>
      </Component>
    )
  }
)
StatCard.displayName = 'StatCard'

// ─── EmptyOrdenes ────────────────────────────────────────────────────────────

const EmptyOrdenes = memo(
  () => (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center rounded-xl border border-dashed dark:border-gray-700/60 border-gray-300 dark:bg-gray-800/20 bg-gray-200">
      <div className="w-12 h-12 rounded-xl dark:bg-gray-800/60 bg-gray-200 border dark:border-gray-700/50 border-gray-300 flex items-center justify-center mb-3">
        <Inbox className="w-6 h-6 text-gray-600" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium dark:text-white text-gray-900">¡Crea tu primera orden!</p>
      <p className="text-xs dark:text-gray-400 text-gray-600 mt-2">
        Presiona el botón <strong className="dark:text-blue-400 text-blue-700 font-bold dark:bg-gray-800 bg-gray-200 px-1.5 py-0.5 rounded shadow-sm inline-flex items-center justify-center">+</strong> debajo para crear tu primera orden.
      </p>
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
                <FileEdit className="w-4 h-4 dark:text-blue-400 text-blue-700 shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium dark:text-blue-300 text-blue-700 truncate">
                  Orden en pausa detectada
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={() => setIsConfirming(true)}
                  className="flex-1 sm:flex-none dark:text-gray-400 text-gray-600 dark:bg-gray-800/80 bg-gray-200/80 border dark:border-gray-700/50 border-gray-300 px-3 py-2 min-h-[44px] text-xs rounded-lg transition-colors hover:bg-gray-700 hover:dark:text-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
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
                <FileEdit className="w-4 h-4 dark:text-red-400 text-red-700 shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium dark:text-red-300 text-red-700 truncate">
                  ¿Seguro que deseas descartar?
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  className="flex-1 sm:flex-none dark:text-gray-400 text-gray-600 dark:bg-gray-800/80 bg-gray-200/80 border dark:border-gray-700/50 border-gray-300 px-3 py-2 min-h-[44px] text-xs rounded-lg transition-colors hover:bg-gray-700 hover:dark:text-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirming(false)
                    onDiscard()
                  }}
                  className="flex-1 sm:flex-none bg-red-500/20 dark:text-red-400 text-red-700 border border-red-500/30 px-3 py-2 min-h-[44px] rounded-lg text-xs font-bold transition-all active:scale-95 hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-400"
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
        <Loader2 className="w-8 h-8 dark:text-blue-500 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center dark:bg-gray-800/50 bg-gray-200 rounded-xl p-8 max-w-md">
          <Shield className="w-12 h-12 dark:text-red-400 text-red-700 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-bold dark:text-white text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="dark:text-gray-400 text-gray-600">Debes iniciar sesión para acceder a esta página.</p>
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
      <div className=" top-0 z-40 dark:bg-gray-900/95 bg-gray-100/95 border-b dark:border-gray-800 border-gray-200 pt-safe backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <BusinessAvatar
              logoUrl={negocio?.logoUrl || '/icono.png'}
              displayName={greetingData.title}
              className="w-12 h-12 shadow-inner border dark:border-gray-800 border-gray-200 p-0.5 bg-white"
            />
            <div className="min-w-0">
              <h1 className="text-lg font-bold dark:text-white text-gray-900 truncate" title={greetingData.title}>{greetingData.title}</h1>
              <p className="text-xs uppercase tracking-wider dark:text-gray-400 text-gray-600 font-medium mt-0.5">
                {greetingData.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 space-y-6">
        <OfflineSyncBanner />

        <OfflineSyncBanner />

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
              className="text-sm font-bold dark:text-gray-400 text-gray-600 uppercase tracking-widest"
            >
              Resumen
            </h2>
            <button 
              onClick={refrescarDatos} 
              className="flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-500 hover:dark:text-blue-400 hover:text-blue-700 rounded-lg hover:dark:bg-gray-800 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={isRefetching || isDashboardLoading}
              aria-label="Actualizar datos"
            >
              <RefreshCw className={cn("w-5 h-5", (isRefetching || isDashboardLoading) && "animate-spin dark:text-blue-400 text-blue-700")} />
            </button>
          </div>

          {statsLoading && estadisticas.totalOrdenes === 0 ? (
            <div className="grid grid-cols-3 gap-2" role="status" aria-label="Cargando estadísticas">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-[88px] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div
              className="grid grid-cols-3 gap-2"
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
                label="Prev"
                colorPrefix="green"
                onClick={() => router.push('/ordenes/mantenimiento?tipo=preventivo')}
              />
              <StatCard
                icon={Wrench}
                value={estadisticas.correctivos}
                label="Corr"
                colorPrefix="orange"
                onClick={() => router.push('/ordenes/mantenimiento?tipo=correctivo')}
              />
              <StatCard
                icon={Stethoscope}
                value={estadisticas.diagnosticos}
                label="Diag"
                colorPrefix="blue"
                onClick={() => router.push('/ordenes/mantenimiento?tipo=diagnostico')}
              />
              <StatCard
                icon={Package}
                value={estadisticas.instalaciones}
                label="Inst"
                colorPrefix="purple"
                onClick={() => router.push('/ordenes/mantenimiento?tipo=instalacion')}
              />
              <StatCard
                icon={Shield}
                value={estadisticas.garantias || 0}
                label="DGar"
                colorPrefix="amber"
                onClick={() => router.push('/ordenes/mantenimiento?tipo=garantia')}
              />
            </div>
          )}
        </section>

        {/* Órdenes recientes */}
        <section aria-labelledby="recientes-heading">
          <h2
            id="recientes-heading"
            className="text-sm font-bold dark:text-gray-400 text-gray-600 uppercase tracking-widest ml-1 mb-3"
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
              <AlertTriangle className="w-8 h-8 dark:text-red-400 text-red-700 mb-2" />
              <p className="text-sm font-medium dark:text-red-400 text-red-700">Error al cargar las órdenes</p>
              <button 
                onClick={refrescarDatos} 
                className="mt-3 px-4 py-2 bg-red-500/20 dark:text-red-400 text-red-700 hover:bg-red-500/30 rounded-lg text-xs font-bold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400"
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
            <EmptyOrdenes />
          )}

          {ordenesRecientes.length > 0 && (
            <Link
              href="/ordenes/mantenimiento"
              className="mt-3 flex items-center justify-center w-full py-3 text-sm dark:text-blue-400 text-blue-700 dark:bg-gray-800/30 bg-gray-100 rounded-xl border dark:border-gray-700/50 border-gray-300 hover:dark:bg-gray-800/50 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
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