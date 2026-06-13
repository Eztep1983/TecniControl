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
} from 'lucide-react'
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
import WelcomeScreen from '@/components/onboarding/WelcomeScreen'
import OnboardingSuccess from '@/components/onboarding/OnboardingSuccess'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { useDashboardGreeting } from '@/hooks/ordenes/useDashboardGreeting'
import { useDraftBanner } from '@/hooks/ordenes/useDraftBanner'
import { useOnboardingFlow } from '@/hooks/ordenes/useOnboardingFlow'
import { useMobileNavigation } from '@/components/providers/MobileNavigationContext'

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
}

const getTipoColor = (tipo: string) =>
  TIPO_COLORS[tipo] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'

const StatCard = memo(
  ({
    icon: Icon,
    value,
    label,
    colorClass = 'border-gray-700/50',
  }: {
    icon: React.ElementType
    value: number
    label: string
    colorClass?: string
  }) => (
    <div
      className={cn(
        'snap-start shrink-0 w-32 bg-gray-800/40 border rounded-2xl p-4',
        'flex flex-col items-center justify-center',
        'transition-colors duration-150 cursor-default',
        colorClass
      )}
      role="listitem"
    >
      <Icon className="w-5 h-5 text-gray-400 mb-1.5" aria-hidden="true" />
      <span className="text-xl font-bold text-white tabular-nums">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium text-center leading-tight mt-0.5">
        {label}
      </span>
    </div>
  )
)
StatCard.displayName = 'StatCard'

// ─── EmptyOrdenes ────────────────────────────────────────────────────────────

const EmptyOrdenes = memo(
  ({ onCreate }: { onCreate: () => void }) => (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center rounded-xl border border-dashed border-gray-700/60 bg-gray-800/20">
      <div className="w-12 h-12 rounded-xl bg-gray-800/60 border border-gray-700/50 flex items-center justify-center mb-3">
        <FileX className="w-6 h-6 text-gray-600" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-gray-400">Sin órdenes recientes</p>
      <p className="text-xs text-gray-600 mt-1">Las órdenes que crees aparecerán aquí.</p>
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
        className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FileEdit className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
          <span className="text-xs text-blue-300 truncate">
            {isConfirming ? '¿Seguro que deseas descartar la orden?' : 'Orden en pausa detectada'}
          </span>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          {isConfirming ? (
            <>
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                className="flex-1 sm:flex-none text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-2 min-h-[44px] text-xs rounded-lg transition-colors hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                Descartar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsConfirming(true)}
                className="flex-1 sm:flex-none text-blue-500/80 bg-white/5 px-3 py-2 min-h-[44px] text-xs rounded-lg transition-colors hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Descartar orden en pausa"
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={onResume}
                className="flex-1 sm:flex-none bg-blue-500 text-gray-900 px-3 py-2 min-h-[44px] rounded-lg text-xs font-bold transition-all active:scale-95 hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Reanudar orden en pausa"
              >
                Reanudar
              </button>
            </>
          )}
        </div>
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

  const { user, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()

  const { data: ordenesRecientes = [], isLoading: ordenesLoading } = useOrdenesRecientes(3)
  const { estadisticas, loading: statsLoading } = useEstadisticasUsuario()
  const { negocio, loading: negocioLoading } = useNegocio()

  const { imprimirOrden, compartirOrden, descargarPDF, formatFecha, generarPDFBlob, generarHTML } =
    usePrintService({ negocio })
  const { prefetchOrdenes, prefetchClientes } = usePrefetchData()
  const { pendingAction, consumePendingAction } = useMobileNavigation()

  const greetingData = useDashboardGreeting(negocio, user, estadisticas.totalOrdenes)
  const { hayBorrador, descartarBorrador, syncDraft } = useDraftBanner()
  const onboarding = useOnboardingFlow(
    user,
    statsLoading,
    negocioLoading,
    negocio,
    estadisticas.totalOrdenes
  )

  const [view, setView] = useState<'dashboard' | 'welcome' | 'success' | 'form'>('dashboard')
  const [isCreating, setIsCreating] = useState(false)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenMantenimiento | null>(null)
  const isDashboardLoading = ordenesLoading || statsLoading || negocioLoading

  const handleCreateNuevaOrden = () => {
    setIsCreating(true)
    router.push('?modal=crear-orden', { scroll: false })
  }

  const isFormOpen = searchParams.get('modal') === 'crear-orden'
  useEffect(() => {
    if (!isFormOpen) {
      setIsCreating(false)
      syncDraft()
    }
  }, [isFormOpen, syncDraft])

  // Only switch to onboarding views — never overwrite 'form' view
  useEffect(() => {
    if (onboarding.showWelcome) setView('welcome')
    else if (onboarding.showSuccess) setView('success')
  }, [onboarding.showWelcome, onboarding.showSuccess])

  const refrescarDatos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ordenes', user?.uid] })
  }, [queryClient, user?.uid])

  useEffect(() => {
    if (user?.uid) {
      prefetchOrdenes()
      prefetchClientes()
    }
  }, [user?.uid, prefetchOrdenes, prefetchClientes])

  useEffect(() => {
    if (searchParams.get('nueva') === 'true') {
      setView('form')
      router.replace('/ordenes', { scroll: false })
    }
  }, [searchParams, router])

  useEffect(() => {
    if (pendingAction === 'open-nueva-orden') {
      consumePendingAction()
      router.push('?modal=crear-orden', { scroll: false })
    }
  }, [pendingAction, consumePendingAction, router])

  // ── Loading skeleton (auth initialising) ────────────────────────────────
  if (authLoading) {
    return (
      <div className="bg-transparent min-h-screen pb-safe">
        <div className="bg-gray-900 border-b border-gray-800 pt-safe">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-5 space-y-6">
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="flex gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="snap-start shrink-0 w-32 h-24 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Not authenticated ────────────────────────────────────────────────────
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

  // ── Onboarding views ─────────────────────────────────────────────────────
  if (view === 'welcome')
    return (
      <WelcomeScreen
        onStartOnboarding={() => {
          onboarding.startOnboarding()
          setView('form')
        }}
        onSkip={() => {
          onboarding.skipOnboarding()
          setView('dashboard')
        }}
      />
    )

  if (view === 'success')
    return (
      <OnboardingSuccess
        onFinish={() => {
          onboarding.closeSuccess()
          setView('dashboard')
          refrescarDatos()
        }}
      />
    )

  // (Formulario ahora es manejado de manera global a través de Search Params)

  // ── Dashboard ────────────────────────────────────────────────────────────
  return (
    <div className="bg-transparent min-h-screen pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-900/95 border-b border-gray-800 pt-safe">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* FIX: BusinessAvatar with infinite-loop-safe error handling */}
            <BusinessAvatar
              logoUrl={negocio?.logoUrl}
              photoURL={user.photoURL}
              displayName={negocio?.nombre || user.displayName}
              email={user.email}
            />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white truncate">{greetingData.title}</h1>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                {greetingData.subtitle}
              </p>
              {greetingData.motivational && (
                <p className="text-[10px] text-blue-400 font-medium mt-0.5">
                  {greetingData.motivational}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center opacity-40">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-black flex items-center justify-center p-0.5 shadow-inner">
              {/* Se asume el logo estático en root, si falla usa Wrench como fallback */}
              <img src="/icono.png" alt="TecniControl" className="w-full h-full object-cover rounded-md" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">TecniControl</span>
          </div>
        </div>
      </div>
    </div>

      <div className="max-w-7xl mx-auto px-4 py-5 space-y-6">
        {/* Nueva Orden CTA */}
        <button
          type="button"
          onClick={handleCreateNuevaOrden}
          disabled={isCreating}
          aria-label="Emitir nueva orden de mantenimiento"
          aria-busy={isCreating}
          className={cn(
            "w-full bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-lg shadow-blue-900/20",
            "py-3 px-4",
            "disabled:cursor-not-allowed disabled:opacity-70",
            isCreating ? 'opacity-80' : 'hover:bg-blue-700 active:scale-95'
          )}
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          {isCreating ? 'Creando...' : 'Nueva Orden'}
        </button>

        <OfflineSyncBanner />

        {/* Draft banner */}
        {hayBorrador && (
          <DraftBanner
            onDiscard={descartarBorrador}
            onResume={handleCreateNuevaOrden}
          />
        )}

        {/* Estadísticas */}
        <section aria-labelledby="resumen-heading">
          <h2
            id="resumen-heading"
            className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-3"
          >
            Resumen
          </h2>

          {isDashboardLoading ? (
            <div className="space-y-6">
              <div className="flex gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" role="status" aria-label="Cargando estadísticas y recientes">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="snap-start shrink-0 w-32 h-24 rounded-2xl" />
                ))}
              </div>
              <div className="grid gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <div
              className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [mask-image:linear-gradient(to_right,black_96%,transparent)] scrollbar-none"
              role="list"
              aria-label="Estadísticas de actividad"
            >
              <StatCard icon={ClipboardList} value={estadisticas.totalOrdenes} label="Total" />
              <StatCard
                icon={Shield}
                value={estadisticas.preventivos}
                label="Preventivos"
                colorClass="border-green-500/20"
              />
              <StatCard
                icon={Wrench}
                value={estadisticas.correctivos}
                label="Correctivos"
                colorClass="border-orange-500/20"
              />
              <StatCard
                icon={Stethoscope}
                value={estadisticas.diagnosticos}
                label="Diagnósticos"
                colorClass="border-blue-500/20"
              />
              <StatCard
                icon={Wrench}
                value={estadisticas.instalaciones}
                label="Instalaciones"
                colorClass="border-purple-500/20"
              />
            </div>
          )}
        </section>

        {/* Órdenes recientes */}
        <section aria-labelledby="recientes-heading">
          <h2
            id="recientes-heading"
            className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-3"
          >
            Recientes
          </h2>

          {ordenesRecientes.length > 0 ? (
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

          {estadisticas.totalOrdenes > 0 && (
            <Link
              href="/ordenes/mantenimiento"
              className="mt-3 flex items-center justify-center w-full py-3 text-sm text-blue-400 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:bg-gray-800/50 transition-colors"
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
    </div>
  )
}