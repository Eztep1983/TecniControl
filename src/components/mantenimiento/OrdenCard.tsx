'use client'
import React, { memo, useCallback } from 'react'
import { OrdenMantenimiento } from '@/types/orden'
import { Eye } from 'lucide-react'
import { PrintButton, ShareButton, DownloadButton } from './PrintService'

interface OrdenCardProps {
  orden: OrdenMantenimiento
  onView: (orden: OrdenMantenimiento) => void | Promise<void>
  onPrint: (orden: OrdenMantenimiento) => void | Promise<void>
  onShare: (orden: OrdenMantenimiento) => void | Promise<void>
  onDownload: (orden: OrdenMantenimiento) => void | Promise<void>
  getTipoColor: (tipo: string) => string
  formatFecha: (fecha: any) => string
}

// FIX: eliminado el memo() exterior duplicado — ya se aplica en la declaración
const OrdenCard = memo(({
  orden,
  onView,
  onPrint,
  onShare,
  onDownload,
  getTipoColor,
  formatFecha
}: OrdenCardProps) => {
  const handleCardClick = useCallback(() => {
    onView(orden)
  }, [onView, orden])

  const handleViewClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onView(orden)
  }, [onView, orden])

  return (
    <div
      className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:bg-gray-700/50 transition-colors duration-150 cursor-pointer flex flex-col h-full"
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">
            {orden.cliente?.name || 'N/A'}
          </h3>
          <p className="text-sm text-gray-400">
            ID: {orden.idPersonalizado}
          </p>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ml-2 ${getTipoColor(orden.tipoMantenimiento)}`}>
          {orden.tipoMantenimiento}
        </span>
      </div>

      <div className="space-y-2 text-sm flex-1">
        <div className="flex justify-between">
          <span className="text-gray-400">Teléfono:</span>
          <span className="text-white truncate ml-2">{orden.cliente?.phone || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Dispositivo:</span>
          <span className="text-white truncate ml-2">
            {orden.dispositivo?.marca || ''} {orden.dispositivo?.modelo || ''}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Fecha:</span>
          <span className="text-white">{formatFecha(orden.fechaCreacion)}</span>
        </div>
      </div>

      <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-600/50">
        <button
          onClick={handleViewClick}
          className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
        >
          <Eye className="w-4 h-4" />
          <span>Ver</span>
        </button>

        <DownloadButton
          orden={orden}
          onDownload={onDownload}
          variant="card"
        />
        <ShareButton
          orden={orden}
          onShare={onShare}
          variant="card"
        />
      </div>
    </div>
  )
})

OrdenCard.displayName = 'OrdenCard'

export default OrdenCard