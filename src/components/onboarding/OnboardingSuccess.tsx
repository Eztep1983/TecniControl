'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, ArrowRight, Share2, Sparkles, UserPlus, Building2, LayoutDashboard } from 'lucide-react'
import AnimatedContent from '@/components/ui/AnimatedContent'
import { Haptics, NotificationType } from '@capacitor/haptics'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'

interface OnboardingSuccessProps {
  onFinish: () => void;
}

export default function OnboardingSuccess({ onFinish }: OnboardingSuccessProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Success haptic feedback
    Haptics.notification({ type: NotificationType.Success }).catch(() => {});
    
    document.body.classList.add('onboarding-active');
    return () => {
      document.body.classList.remove('onboarding-active');
    };
  }, []);

  const handleNextStep = (path: string) => {
    onFinish();
    router.push(path);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-[#0a0a0b]">
      <AnimatedContent distance={20} direction="vertical" duration={0.6} className="w-full max-w-lg">
        <div className="bg-gradient-to-br from-green-900/20 via-gray-900 to-black border border-green-500/20 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center">
          
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />
          
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/30 relative"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 rounded-full border-4 border-green-400/50" 
              />
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
            </motion.div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
              ¡Excelente trabajo!
            </h2>
            <p className="text-gray-400 text-base mb-10 max-w-sm mx-auto">
              Has completado el recorrido inicial. Tu primera orden de prueba ha sido generada con éxito.
            </p>

            <div className="grid grid-cols-1 gap-3 mb-10">
              <NextStepCard 
                icon={<UserPlus className="w-5 h-5" />}
                title="Registra un cliente real"
                description="Comienza a organizar tu base de datos hoy mismo."
                onClick={() => handleNextStep('/clientes')}
              />
              <NextStepCard 
                icon={<Building2 className="w-5 h-5" />}
                title="Personaliza tu negocio"
                description="Agrega tu logo y datos de contacto para los PDFs."
                onClick={() => handleNextStep('/configuracion')}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onFinish}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white p-5 rounded-[1.25rem] flex items-center justify-center space-x-3 transition-all shadow-xl shadow-green-600/20 group touch-manipulation"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-lg font-bold">Ir a mi Panel Principal</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </div>
      </AnimatedContent>
    </div>
  )
}

function NextStepCard({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800/60 hover:border-gray-600 transition-all text-left w-full group"
    >
      <div className="bg-gray-900 p-3 rounded-xl text-green-400 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-white font-bold text-sm mb-0.5">{title}</h3>
        <p className="text-gray-500 text-xs">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-green-400 transition-colors" />
    </button>
  )
}


