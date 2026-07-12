'use client'
import { useState } from 'react'
import { MessageSquare, AlertCircle, Hash, Search, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

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
  const [touchedReferencia, setTouchedReferencia] = useState(false)
  const [touchedMotivo, setTouchedMotivo] = useState(false)

  const referenciaInvalida = touchedReferencia && !referenciaId.trim()
  const motivoInvalido = touchedMotivo && !motivo.trim()

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Banner informativo */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-start">
        <AlertCircle className="w-5 h-5 dark:text-amber-400 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm dark:text-amber-200 text-amber-800/80">
          <p className="font-bold mb-1">Respuesta a Garantía</p>
          <p>Utilice esta sección para documentar la atención a un fallo cubierto por una garantía previa.</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Referencia de Orden — obligatoria */}
        <div className="space-y-2">
          <label className="text-sm font-semibold dark:text-gray-300 text-gray-700 flex items-center gap-2">
            <Hash className="w-4 h-4 dark:text-amber-400 text-amber-700" />
            Orden de Referencia
            <span className="dark:text-red-400 text-red-700" aria-hidden="true">*</span>
          </label>

          <div className="relative">
            <input
              type="text"
              value={referenciaId}
              onChange={(e) => onCambiarReferencia(e.target.value)}
              onBlur={() => setTouchedReferencia(true)}
              placeholder="Ej: 1025 o ID de la orden original"
              required
              aria-required="true"
              aria-invalid={referenciaInvalida}
              className={`w-full pl-11 pr-10 py-3 dark:bg-gray-900/60 bg-gray-50 border rounded-xl dark:text-white text-gray-900 focus:ring-2 outline-none transition-all duration-200 ${
                referenciaInvalida
                  ? 'border-red-500/60 focus:ring-red-500/30 focus:border-red-500/80'
                  : referenciaId.trim()
                  ? 'border-green-500/50 focus:ring-amber-500/30 focus:border-amber-500/60'
                  : 'dark:border-gray-700/50 border-gray-300 focus:ring-amber-500/30 focus:border-amber-500/60'
              }`}
            />
            {/* Icono izquierdo */}
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            {/* Icono derecho de estado */}
            <AnimatePresence mode="wait">
              {referenciaId.trim() && (
                <motion.span
                  key="valid"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <CheckCircle2 className="w-4 h-4 dark:text-green-400 text-green-700" />
                </motion.span>
              )}
              {referenciaInvalida && !referenciaId.trim() && (
                <motion.span
                  key="invalid"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <AlertCircle className="w-4 h-4 dark:text-red-400 text-red-700" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Mensaje de error */}
          <AnimatePresence>
            {referenciaInvalida && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 text-xs dark:text-red-400 text-red-700"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                La referencia de la orden es obligatoria
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Motivo del Reclamo — obligatorio */}
        <div className="space-y-2">
          <label className="text-sm font-semibold dark:text-gray-300 text-gray-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 dark:text-amber-400 text-amber-700" />
            Motivo del Reclamo
            <span className="dark:text-red-400 text-red-700" aria-hidden="true">*</span>
          </label>

          <textarea
            rows={4}
            value={motivo}
            onChange={(e) => onCambiarMotivo(e.target.value)}
            onBlur={() => setTouchedMotivo(true)}
            placeholder="Describa el fallo reportado por el cliente..."
            required
            aria-required="true"
            aria-invalid={motivoInvalido}
            className={`w-full px-4 py-3 dark:bg-gray-900/60 bg-gray-50 border rounded-xl dark:text-white text-gray-900 focus:ring-2 outline-none transition-all duration-200 resize-none ${
              motivoInvalido
                ? 'border-red-500/60 focus:ring-red-500/30 focus:border-red-500/80'
                : motivo.trim()
                ? 'border-green-500/50 focus:ring-amber-500/30 focus:border-amber-500/60'
                : 'dark:border-gray-700/50 border-gray-300 focus:ring-amber-500/30 focus:border-amber-500/60'
            }`}
          />

          {/* Mensaje de error */}
          <AnimatePresence>
            {motivoInvalido && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 text-xs dark:text-red-400 text-red-700"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Describe el motivo del reclamo de garantía
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
