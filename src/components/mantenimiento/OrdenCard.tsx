'use client'
import React, { memo, useCallback } from 'react'
import { OrdenMantenimiento } from '@/types/orden'
import { CloudOff, Eye, Download, Share2, Smartphone, Laptop, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrdenCardProps {
  orden: OrdenMantenimiento
  onView: (orden: OrdenMantenimiento) => void | Promise<void>
  /** Kept for API compatibility — not used in card UI (PDF preview lives in modal) */
  onPrint: (orden: OrdenMantenimiento) => void | Promise<void>
  onShare: (orden: OrdenMantenimiento) => void | Promise<void>
  onDownload: (orden: OrdenMantenimiento) => void | Promise<void>
  getTipoColor: (tipo: string) => string
  formatFecha: (fecha: any) => string
  searchTerm?: string
}

// ─── Accent bar color map ─────────────────────────────────────────────────────
// Maps tipo → a solid Tailwind color class for the 3px top accent bar.
// Avoids inheriting the semi-transparent bg-*/20 from getTipoColor(), which
// renders as near-invisible on a dark card background.

const ACCENT_BY_TIPO: Record<string, string> = {
  preventivo: 'bg-green-500',
  correctivo:  'bg-orange-500',
  diagnostico: 'bg-blue-500',
  instalacion: 'bg-purple-500',
}

function getAccentClass(tipo: string): string {
  return ACCENT_BY_TIPO[tipo] ?? 'bg-gray-600'
}

// ─── Device icon ─────────────────────────────────────────────────────────────

function DeviceIcon({ marca }: { marca?: string }) {
  const m = marca?.toLowerCase() ?? ''
  if (['samsung', 'apple', 'xiaomi', 'motorola', 'huawei', 'oppo', 'realme'].some(b => m.includes(b))) {
    return <Smartphone className="w-3 h-3" aria-hidden="true" />
  }
  if (['lenovo', 'hp', 'dell', 'asus', 'acer', 'toshiba', 'lg'].some(b => m.includes(b))) {
    return <Laptop className="w-3 h-3" aria-hidden="true" />
  }
  return <Cpu className="w-3 h-3" aria-hidden="true" />
}

// ─── Highlight ───────────────────────────────────────────────────────────────

const Highlight = ({ text, term }: { text: string; term: string }) => {
  if (!term?.trim()) return <>{text}</>

  const normalize = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

  const tokens = normalize(term).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return <>{text}</>

  const pattern = new RegExp(
    `(${tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  )
  const parts = text.split(pattern)

  return (
    <>
      {parts.map((part, i) =>
        tokens.some(token => normalize(part) === token) ? (
          <mark key={i} className="bg-blue-500/30 text-blue-200 rounded-sm px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

// ─── getOrdenResumen ──────────────────────────────────────────────────────────

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
  return orden.observacionesIniciales || 'Sin detalles registrados'
}

// ─── OrdenCard ────────────────────────────────────────────────────────────────

const OrdenCard = memo(({
  orden,
  onView,
  onShare,
  onDownload,
  getTipoColor,
  formatFecha,
  searchTerm = '',
}: OrdenCardProps) => {
  const handleCardClick  = useCallback(() => onView(orden), [onView, orden])
  const handleViewClick  = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onView(orden) }, [onView, orden])
  const handleShareClick = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onShare(orden) }, [onShare, orden])
  const handleDownload   = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onDownload(orden) }, [onDownload, orden])

  const ordenResumen = getOrdenResumen(orden)
  const ordenFecha   = formatFecha(orden.fechaCreacion ?? orden.createdAt ?? '')
  const dispositivo  = [orden.dispositivo?.marca, orden.dispositivo?.modelo].filter(Boolean).join(' ')
  const isPending    = orden.idPersonalizado?.startsWith('OSER-TEMP-')

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border border-gray-700/50 bg-gray-800/40',
        'transition-all hover:bg-gray-700/40 active:scale-[0.98] cursor-pointer',
      )}
      onClick={handleCardClick}
      aria-label={`Orden ${orden.idPersonalizado} — ${orden.cliente?.name || 'Sin cliente'}`}
    >
      {/* Accent bar — solid color, full opacity, visually distinct from card bg */}
      <div className={cn('h-[3px] w-full', getAccentClass(orden.tipoMantenimiento))} />

      {/* Card body — padding only here, NOT wrapping the footer */}
      <div className="px-4 pt-3 pb-4 sm:px-5 sm:pt-4">

        {/* Row 1: client name + tipo badge */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-white font-bold truncate text-lg sm:text-base leading-snug flex-1 min-w-0">
            <Highlight text={orden.cliente?.name || 'Sin cliente'} term={searchTerm} />
          </h3>
          <span className={cn(
            'inline-flex shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wide whitespace-nowrap',
            getTipoColor(orden.tipoMantenimiento),
          )}>
            {orden.tipoMantenimiento}
          </span>
        </div>

        {/* Row 2: ID · fecha · pending badge */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3">
          <span className="text-[13px] text-gray-500 uppercase tracking-wider font-semibold">
            {orden.idPersonalizado}
          </span>
          <span className="text-gray-700 text-[13px]">·</span>
          <span className="text-[13px] text-gray-500 tabular-nums">{ordenFecha}</span>
          {isPending && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
              <CloudOff className="w-2.5 h-2.5" aria-hidden="true" />
              Pendiente
            </span>
          )}
        </div>

        {/* Row 3: device chip + phone */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {dispositivo && (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 bg-gray-700/40 border border-gray-700/50 rounded-md px-2 py-0.5">
              <DeviceIcon marca={orden.dispositivo?.marca} />
              <Highlight text={dispositivo} term={searchTerm} />
            </span>
          )}
          {orden.cliente?.phone && (
            <span className="text-[13px] text-gray-500 tabular-nums">
              {orden.cliente.phone}
            </span>
          )}
        </div>

        {/* Row 4: resumen — 2 lines max, no word-count truncation */}
        <p className="text-[13px] text-gray-500 italic leading-relaxed line-clamp-2 border-t border-gray-700/40 pt-2.5">
          {ordenResumen}
        </p>
      </div>

      {/* Footer actions — outside padding div so border is flush to card edges */}
      <div className="grid grid-cols-3 divide-x divide-gray-700/50 border-t border-gray-700/50">
        <button
          type="button"
          onClick={handleViewClick}
          className={cn(
            'flex items-center justify-center gap-1.5 py-2.5 min-h-[44px]',
            'text-[11px] font-semibold text-gray-400',
            'transition-colors hover:bg-white/5 hover:text-gray-200',
            'active:bg-white/10',
          )}
          aria-label="Ver detalles de la orden"
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          Ver
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className={cn(
            'flex items-center justify-center gap-1.5 py-2.5 min-h-[44px]',
            'text-[11px] font-semibold text-gray-400',
            'transition-colors hover:bg-white/5 hover:text-gray-200',
            'active:bg-white/10',
          )}
          aria-label="Descargar PDF de la orden"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          PDF
        </button>

        <button
          type="button"
          onClick={handleShareClick}
          className={cn(
            'flex items-center justify-center gap-1.5 py-2.5 min-h-[44px]',
            'text-[11px] font-semibold text-gray-400',
            'transition-colors hover:bg-white/5 hover:text-gray-200',
            'active:bg-white/10',
          )}
          aria-label="Compartir orden"
        >
          <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
          Compartir
        </button>
      </div>
    </article>
  )
})

OrdenCard.displayName = 'OrdenCard'

export default OrdenCard