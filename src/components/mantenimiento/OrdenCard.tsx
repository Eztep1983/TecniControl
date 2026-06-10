'use client'
import React, { memo, useCallback, useMemo } from 'react'
import { OrdenMantenimiento } from '@/types/orden'
import { CloudOff, Eye, Download, Share2, Smartphone, Laptop, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrdenCardProps {
  orden: OrdenMantenimiento
  onView: (orden: OrdenMantenimiento) => void | Promise<void>
  /** Kept for API compatibility — not used in card UI */
  onPrint: (orden: OrdenMantenimiento) => void | Promise<void>
  onShare: (orden: OrdenMantenimiento) => void | Promise<void>
  onDownload: (orden: OrdenMantenimiento) => void | Promise<void>
  /** Kept for API compatibility — colors now handled internally */
  getTipoColor: (tipo: string) => string
  formatFecha: (fecha: any) => string
  searchTerm?: string
}

// ─── Tipo config ──────────────────────────────────────────────────────────────

interface TipoConfig {
  accent: string
  dot: string
  badge: string
}

const TIPO_CONFIG: Record<string, TipoConfig> = {
  preventivo:  {
    accent: 'bg-green-500',
    dot:    'bg-green-400',
    badge:  'bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20',
  },
  correctivo:  {
    accent: 'bg-orange-500',
    dot:    'bg-orange-400',
    badge:  'bg-orange-500/10 text-orange-400 ring-1 ring-inset ring-orange-500/20',
  },
  diagnostico: {
    accent: 'bg-blue-500',
    dot:    'bg-blue-400',
    badge:  'bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20',
  },
  instalacion: {
    accent: 'bg-purple-500',
    dot:    'bg-purple-400',
    badge:  'bg-purple-500/10 text-purple-400 ring-1 ring-inset ring-purple-500/20',
  },
  garantia: {
    accent: 'bg-amber-500',
    dot:    'bg-amber-400',
    badge:  'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20',
  },
}

const DEFAULT_TIPO: TipoConfig = {
  accent: 'bg-gray-600',
  dot:    'bg-gray-500',
  badge:  'bg-gray-500/10 text-gray-400 ring-1 ring-inset ring-gray-500/20',
}

function getTipoConfig(tipo: string): TipoConfig {
  return TIPO_CONFIG[tipo] ?? DEFAULT_TIPO
}

// ─── Static class strings — computed once at module level ─────────────────────

const CLS_CARD = cn(
  'overflow-hidden rounded-2xl',
  'border border-white/[0.07]',
  'bg-gray-900/70',
  'transition-all duration-150 cursor-pointer',
  'hover:border-white/[0.12] hover:bg-gray-900/90',
  'active:scale-[0.985]',
)

const CLS_BTN_PRIMARY = cn(
  'flex flex-1 items-center justify-center gap-1.5',
  'min-h-[38px] rounded-xl',
  'text-[12px] font-medium text-gray-200',
  'bg-white/[0.08]',
  'transition-colors hover:bg-white/[0.12] active:bg-white/[0.15]',
)

const CLS_BTN_SECONDARY = cn(
  'flex items-center justify-center w-[38px] h-[38px] rounded-xl',
  'bg-white/[0.05] border border-white/[0.07]',
  'text-gray-500',
  'transition-colors hover:bg-white/[0.09] hover:text-gray-300 active:bg-white/[0.12]',
)

const CLS_BADGE_PILL = 'inline-flex px-2.5 py-[3px] text-[11px] font-medium rounded-full capitalize tracking-wide'

const CLS_DEVICE_CHIP = 'inline-flex items-center gap-1.5 text-[12px] text-gray-400 bg-white/[0.05] border border-white/[0.07] rounded-full px-3 py-[3px]'

// ─── Helpers — module level (no closure, never recreated) ─────────────────────

/** Strips accents, lowercases and trims — used for accent-insensitive search matching */
function normalizeStr(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function getOrdenResumen(orden: OrdenMantenimiento): string {
  if (orden.tareasRealizadas?.length > 0) {
    return orden.tareasRealizadas.join(', ')
  }
  if (orden.tipoMantenimiento === 'diagnostico') {
    return orden.diagnosticoFinal || orden.pruebasRealizadas || 'Diagnóstico pendiente'
  }
  if (orden.tipoMantenimiento === 'instalacion') {
    return orden.instalacionConfiguracionTipos?.length
      ? orden.instalacionConfiguracionTipos.join(', ')
      : orden.instalacionRecomendacionesDetalle || 'Instalación completada'
  }
  if (orden.tipoMantenimiento === 'garantia') {
    return orden.garantiaMotivo || `Ref: #${orden.garantiaReferenciaId}` || 'Atención por garantía'
  }
  return orden.observacionesIniciales || 'Sin detalles registrados'
}

// ─── Brand lookup sets — defined once, O(1) access ───────────────────────────

const PHONE_BRANDS  = new Set(['samsung', 'apple', 'xiaomi', 'motorola', 'huawei', 'oppo', 'realme'])
const LAPTOP_BRANDS = new Set(['lenovo', 'hp', 'dell', 'asus', 'acer', 'toshiba', 'lg'])

// ─── DeviceIcon ───────────────────────────────────────────────────────────────

const DeviceIcon = memo(({ marca }: { marca?: string }) => {
  const m = marca?.toLowerCase() ?? ''
  if (PHONE_BRANDS.has(m)  || [...PHONE_BRANDS].some(b => m.includes(b))) {
    return <Smartphone className="w-3 h-3 shrink-0" aria-hidden="true" />
  }
  if (LAPTOP_BRANDS.has(m) || [...LAPTOP_BRANDS].some(b => m.includes(b))) {
    return <Laptop className="w-3 h-3 shrink-0" aria-hidden="true" />
  }
  return <Cpu className="w-3 h-3 shrink-0" aria-hidden="true" />
})
DeviceIcon.displayName = 'DeviceIcon'

// ─── Highlight ────────────────────────────────────────────────────────────────
// memo  → skips rerender when text/term are unchanged (typical during scrolling)
// useMemo inside → regex compiled only when text or term actually change

const Highlight = memo(({ text, term }: { text: string; term: string }) => {
  const segments = useMemo(() => {
    if (!term?.trim()) return null
    const tokens = normalizeStr(term).split(/\s+/).filter(Boolean)
    if (!tokens.length) return null
    const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')
    return { tokens, parts: text.split(pattern) }
  }, [text, term])

  if (!segments) return <>{text}</>

  return (
    <>
      {segments.parts.map((part, i) =>
        segments.tokens.some(t => normalizeStr(part) === t) ? (
          <mark key={i} className="bg-blue-500/30 text-blue-200 rounded-sm px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
})
Highlight.displayName = 'Highlight'

// ─── OrdenCard ────────────────────────────────────────────────────────────────

const OrdenCard = memo(({
  orden,
  onView,
  onShare,
  onDownload,
  formatFecha,
  searchTerm = '',
}: OrdenCardProps) => {
  const handleCardClick  = useCallback(() => onView(orden), [onView, orden])
  const handleViewClick  = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onView(orden) }, [onView, orden])
  const handleShareClick = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onShare(orden) }, [onShare, orden])
  const handleDownload   = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onDownload(orden) }, [onDownload, orden])

  // Derived values — memoized so they only recompute when orden/formatFecha changes,
  // not on unrelated parent rerenders that memo(OrdenCard) already blocked.
  const tipo        = orden.tipoMantenimiento ?? ''
  const cfg         = getTipoConfig(tipo)             // O(1) lookup, no memo needed
  const isPending   = orden.idPersonalizado?.startsWith('OSER-TEMP-') ?? false

  const resumen     = useMemo(() => getOrdenResumen(orden), [orden])
  const fecha       = useMemo(
    () => formatFecha(orden.fechaCreacion ?? orden.createdAt ?? ''),
    [orden, formatFecha],
  )
  const dispositivo = useMemo(
    () => [orden.dispositivo?.marca, orden.dispositivo?.modelo].filter(Boolean).join(' '),
    [orden.dispositivo],
  )

  return (
    <article
      className={CLS_CARD}
      onClick={handleCardClick}
      aria-label={`Orden ${orden.idPersonalizado} — ${orden.cliente?.name || 'Sin cliente'}`}
    >
      {/* Accent bar */}
      <div className={`h-[4px] w-full ${cfg.accent}`} />

      {/* Body */}
      <div className="px-4 pt-4 pb-3 sm:px-5">

        {/* Row 1: client name · status dot · tipo pill */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-[15px] font-semibold text-white leading-snug flex-1 min-w-0 truncate">
            <Highlight text={orden.cliente?.name || 'Sin cliente'} term={searchTerm} />
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} aria-hidden="true" />
            <span className={`${CLS_BADGE_PILL} ${cfg.badge}`}>
              {tipo}
            </span>
          </div>
        </div>

        {/* Row 2: ID · fecha · pending badge */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mb-3">
          <span className="text-[12px] text-gray-500 font-medium uppercase tracking-wide">
            {orden.idPersonalizado}
          </span>
          <span className="text-gray-700 text-[10px]">·</span>
          <span className="text-[12px] text-gray-600 tabular-nums">{fecha}</span>
          {isPending && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20 px-2 py-[3px] rounded-full ml-0.5">
              <CloudOff className="w-2.5 h-2.5" aria-hidden="true" />
              Pendiente
            </span>
          )}
        </div>

        {/* Row 3: device pill · phone */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {dispositivo && (
            <span className={CLS_DEVICE_CHIP}>
              <DeviceIcon marca={orden.dispositivo?.marca} />
              <Highlight text={dispositivo} term={searchTerm} />
            </span>
          )}
          {orden.cliente?.phone && (
            <span className="text-[12px] text-gray-600 tabular-nums">
              {orden.cliente.phone}
            </span>
          )}
        </div>

        {/* Row 4: resumen — 2 lines, no italic */}
        <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2 border-t border-white/[0.06] pt-2.5">
          {resumen}
        </p>
      </div>

      {/* Footer — primary action + icon-only secondaries */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/[0.06]">

        <button
          type="button"
          onClick={handleViewClick}
          className={CLS_BTN_PRIMARY}
          aria-label="Ver detalles de la orden"
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          Ver orden
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className={CLS_BTN_SECONDARY}
          aria-label="Descargar PDF de la orden"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={handleShareClick}
          className={CLS_BTN_SECONDARY}
          aria-label="Compartir orden"
        >
          <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </article>
  )
})

OrdenCard.displayName = 'OrdenCard'

export default OrdenCard