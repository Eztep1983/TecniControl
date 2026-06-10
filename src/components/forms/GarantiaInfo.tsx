'use client'
import { FileText, MessageSquare, AlertCircle, Hash, Search } from 'lucide-react'
import { motion } from 'framer-motion'

interface GarantiaInfoProps {
  referenciaId?: string
  motivo?: string
  onCambiarReferencia: (valor: string) => void
  onCambiarMotivo: (valor: string) => void
}

export default function GarantiaInfo({
  referenciaId = '',
  motivo = '',
  onCambiarReferencia,
  onCambiarMotivo
}: GarantiaInfoProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-start">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200/80">
          <p className="font-bold mb-1">Respuesta a Garantía</p>
          <p>Utilice esta sección para documentar la atención a un fallo cubierto por una garantía previa.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Referencia de Orden */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Hash className="w-4 h-4 text-amber-400" />
            Orden de Referencia
          </label>
          <div className="relative">
            <input
              type="text"
              value={referenciaId}
              onChange={(e) => onCambiarReferencia(e.target.value)}
              placeholder="Ej: 1025 o ID de la orden original"
              className="w-full pl-11 pr-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all outline-none"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
        </div>

        {/* Motivo de la Garantía */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            Motivo del Reclamo
          </label>
          <textarea
            rows={4}
            value={motivo}
            onChange={(e) => onCambiarMotivo(e.target.value)}
            placeholder="Describa el fallo reportado por el cliente..."
            className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all outline-none resize-none"
          />
        </div>
      </div>
    </motion.div>
  )
}
