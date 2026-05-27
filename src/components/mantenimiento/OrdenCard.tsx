'use client'
import React, { memo, useCallback } from 'react'
import { OrdenMantenimiento } from '@/types/orden'
import { Eye, FileText, Share2 } from 'lucide-react'
import { PrintButton, ShareButton, DownloadButton } from './PrintService'
import { cn } from '@/lib/utils'

interface OrdenCardProps {
  orden: OrdenMantenimiento
  onView: (orden: OrdenMantenimiento) => void | Promise<void>
  onPrint: (orden: OrdenMantenimiento) => void | Promise<void>
  onShare: (orden: OrdenMantenimiento) => void | Promise<void>
  onDownload: (orden: OrdenMantenimiento) => void | Promise<void>
  getTipoColor: (tipo: string) => string
  formatFecha: (fecha: any) => string
}

const OrdenCard = memo(({
  orden,
  onView,
  onPrint,
  onShare,
  onDownload,
  getTipoColor,
  formatFecha
}: OrdenCardProps) => {
  const handleCardClick = useCallback(() => onView(orden), [onView, orden])
  const handleViewClick = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onView(orden) }, [onView, orden])

  const truncateWords = (text: string, count: number) => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length <= count) return text;
    return words.slice(0, count).join(' ') + '...';
  };

  return (
    <div
      className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-5 hover:bg-gray-700/40 transition-colors cursor-pointer flex gap-4"
      onClick={handleCardClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate text-lg">{orden.cliente?.name || 'Sin cliente'}</h3>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mt-0.5">ID Orden: {orden.idPersonalizado}</p>
          </div>
          <span className={cn("inline-flex shrink-0 px-3 py-1 text-xs font-bold rounded-md border capitalize", getTipoColor(orden.tipoMantenimiento))}>
            {orden.tipoMantenimiento}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-base text-gray-300 mb-3">
          {orden.cliente?.phone && (
            <>
              <span className="truncate">{orden.cliente.phone}</span>
              <span className="text-gray-600">•</span>
            </>
          )}
          <span className="truncate font-medium text-gray-100">{orden.dispositivo?.marca} {orden.dispositivo?.modelo}</span>
        </div>

        <div className="text-sm text-gray-400 truncate border-t border-gray-700/50 pt-3 italic block w-full overflow-hidden whitespace-nowrap">
          {truncateWords(
            orden.tareasRealizadas?.length > 0 
              ? orden.tareasRealizadas.join(', ')
              : orden.tipoMantenimiento === 'diagnostico'
                ? orden.diagnosticoFinal || orden.pruebasRealizadas || 'Diagnóstico pendiente'
                : orden.tipoMantenimiento === 'instalacion'
                  ? (orden.instalacionConfiguracionTipos && orden.instalacionConfiguracionTipos.length > 0)
                    ? orden.instalacionConfiguracionTipos.join(', ')
                    : orden.instalacionRecomendacionesDetalle || 'Instalación completada'
                  : orden.observacionesIniciales || 'Sin detalles registrados',
            3
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-1.5 border-l border-gray-700/50 pl-3">
        <button onClick={handleViewClick} className="p-1.5 rounded-lg hover:bg-gray-600/30 text-gray-400 hover:text-white" aria-label="Ver detalles">
          <Eye className="w-4 h-4" />
        </button>
        <DownloadButton orden={orden} onDownload={onDownload} variant="icon" />
        <ShareButton orden={orden} onShare={onShare} variant="icon" />
      </div>

    </div>
  )
})

OrdenCard.displayName = 'OrdenCard'

export default OrdenCard