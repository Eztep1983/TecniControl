'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle2, 
  Circle, 
  Settings, 
  ClipboardList, 
  Sparkles, 
  Trophy, 
  X, 
  ArrowRight 
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface ActivationChecklistProps {
  negocio: any
  totalOrdenes: number
  onStartSandbox: () => void
  onSkipOnboarding: () => void
}

export default function ActivationChecklist({ 
  negocio, 
  totalOrdenes, 
  onStartSandbox, 
  onSkipOnboarding 
}: ActivationChecklistProps) {
  const router = useRouter()

  // Checklist items completion criteria
  const isAccountCreated = true // Always true if they are logged in
  const isSandboxCompleted = totalOrdenes > 0
  const isBusinessConfigured = !!(negocio?.direccion || negocio?.telefono || negocio?.nit)

  const completedSteps = useMemo(() => {
    return (isAccountCreated ? 1 : 0) + (isSandboxCompleted ? 1 : 0)
  }, [isAccountCreated, isSandboxCompleted])

  const progressPercentage = Math.round((completedSteps / 2) * 100)

  // Skip checklist if already completed or if marked as onboardingCompleted in db
  if (negocio?.onboardingCompleted) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="w-full bg-gradient-to-br from-gray-900 via-gray-950 to-black border border-blue-500/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative background glows */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <h3 className="text-white font-extrabold text-base flex items-center gap-2 tracking-tight">
              <Sparkles className="w-5 h-5 text-sky-400" />
              Configura tu cuenta
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Completa los pasos básicos para empezar a emitir reportes profesionales.
            </p>
          </div>
          <button
            onClick={onSkipOnboarding}
            className="text-gray-500 hover:text-white transition-colors p-1"
            title="Omitir onboarding"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 mb-5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-sky-400">{progressPercentage}% completado</span>
            <span className="text-gray-500">{completedSteps} de 2 pasos</span>
          </div>
          <div className="w-full bg-gray-800/80 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full" 
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {/* Step 1: Account Created */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-800/20 border border-gray-800/40">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-left">
                <p className="text-gray-300 text-xs font-semibold line-through">Crear tu cuenta de acceso</p>
                <p className="text-[10px] text-gray-500 font-medium">Cuenta verificada y activa</p>
              </div>
            </div>
          </div>

          {/* Step 2: Sandbox Order */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-800/20 border border-gray-800/40 hover:border-blue-500/20 transition-all">
            <div className="flex items-center gap-3">
              {isSandboxCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-600 shrink-0 animate-pulse" />
              )}
              <div className="text-left">
                <p className={`text-xs font-semibold ${isSandboxCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                  Crear una orden de prueba (Sandbox)
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  Prueba la firma y la generación de PDF
                </p>
              </div>
            </div>
            {!isSandboxCompleted && (
              <button
                onClick={onStartSandbox}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 shadow-lg shadow-blue-900/25"
              >
                Comenzar
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Step 3: Config */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-800/20 border border-gray-800/40 hover:border-blue-500/20 transition-all">
            <div className="flex items-center gap-3">
              {isBusinessConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-600 shrink-0" />
              )}
              <div className="text-left">
                <p className={`text-xs font-semibold ${isBusinessConfigured ? 'text-gray-400 line-through' : 'text-white'}`}>
                  Opcional: Personaliza tu negocio
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  Sube tu logo para los reportes
                </p>
              </div>
            </div>
            {!isBusinessConfigured ? (
              <button
                onClick={() => router.push('/configuracion')}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700/50 font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all active:scale-95"
              >
                Configurar
                <Settings className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => router.push('/configuracion')}
                className="text-[10px] text-sky-400 font-bold hover:underline"
              >
                Editar
              </button>
            )}
          </div>
        </div>

        {/* All steps completed success card */}
        {progressPercentage === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center text-center space-y-3"
          >
            <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-emerald-400 animate-bounce" />
            </div>
            <div className="space-y-1">
              <p className="text-white text-xs font-extrabold">¡Todo listo para empezar!</p>
              <p className="text-gray-400 text-[10px] leading-relaxed">
                Has configurado tu cuenta con éxito. Ya puedes empezar a registrar tus clientes y emitir reportes reales.
              </p>
            </div>
            <button
              onClick={onSkipOnboarding}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition-all active:scale-95"
            >
              Completar Recorrido
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
