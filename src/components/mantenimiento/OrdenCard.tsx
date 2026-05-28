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
      className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-4 sm:p-5 hover:bg-gray-700/40 transition-all cursor-pointer flex items-center gap-3 sm:gap-4 active:scale-[0.98] sm:active:scale-[0.99]"
      onClick={handleCardClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold truncate text-base sm:text-lg leading-tight">{orden.cliente?.name || 'Sin cliente'}</h3>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">ID: {orden.idPersonalizado}</p>
          </div>
          <span className={cn(
            "inline-flex shrink-0 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-md border capitalize whitespace-nowrap",
            getTipoColor(orden.tipoMantenimiento)
          )}>
            {orden.tipoMantenimiento}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base text-gray-300 mb-2 sm:mb-3">
          {orden.cliente?.phone && (
            <span className="truncate flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-blue-500 hidden sm:inline-block" />
              {orden.cliente.phone}
            </span>
          )}
          {orden.cliente?.phone && <span className="text-gray-700 hidden sm:inline">•</span>}
          <span className="truncate font-medium text-gray-100">{orden.dispositivo?.marca} {orden.dispositivo?.modelo}</span>
        </div>

        <div className="text-[11px] sm:text-sm text-gray-500 truncate border-t border-gray-700/50 pt-2 sm:pt-3 italic block w-full overflow-hidden whitespace-nowrap">
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

      <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 border-l border-gray-700/30 pl-2 sm:pl-4 shrink-0">
        <button 
          onClick={handleViewClick} 
          className="p-2 rounded-lg hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 transition-colors" 
          aria-label="Ver detalles"
        >
          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <DownloadButton orden={orden} onDownload={onDownload} variant="icon" />
        <ShareButton orden={orden} onShare={onShare} variant="icon" />
      </div>

    </div>
  )
})

OrdenCard.displayName = 'OrdenCard'

export default OrdenCard