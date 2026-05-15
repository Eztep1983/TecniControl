'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, ArrowRight, Share2, Sparkles } from 'lucide-react'
import AnimatedContent from '@/components/ui/AnimatedContent'
import { Haptics, NotificationType } from '@capacitor/haptics'

interface OnboardingSuccessProps {
  onFinish: () => void;
}

export default function OnboardingSuccess({ onFinish }: OnboardingSuccessProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Success haptic feedback
    Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <AnimatedContent distance={20} direction="vertical" duration={0.6} className="w-full max-w-md">
        <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/20 border border-green-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
          
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/40 relative">
              <CheckCircle2 className="w-12 h-12 text-white" />
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-3">
              ¡Misión Cumplida!
            </h2>
            <p className="text-green-100 text-sm mb-8">
              Has creado tu primera orden de mantenimiento de forma exitosa. Ahora estás listo para llevar tu servicio técnico al siguiente nivel.
            </p>

            <button
              onClick={onFinish}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 active:scale-[0.98] text-white p-4 rounded-xl flex items-center justify-center space-x-3 transition-all shadow-lg shadow-green-500/25 group"
            >
              <span className="text-lg font-bold">Ir a mi Panel</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </AnimatedContent>
    </div>
  )
}
