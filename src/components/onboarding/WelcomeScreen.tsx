'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Users, 
  Laptop, 
  ClipboardCheck,
  Smartphone,
  Star
} from 'lucide-react'
import AnimatedContent from '@/components/ui/AnimatedContent'
import { motion } from 'motion/react'

interface WelcomeScreenProps {
  onStartOnboarding: () => void;
}

export default function WelcomeScreen({ onStartOnboarding }: WelcomeScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.classList.add('onboarding-active');
    return () => {
      document.body.classList.remove('onboarding-active');
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-6 bg-[#0a0a0b] overflow-y-auto">
      <AnimatedContent distance={20} direction="vertical" duration={0.5} className="w-full max-w-lg my-auto">
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black border border-gray-800 rounded-[2rem] p-5 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px]" />
          
          <div className="relative z-10 text-center mb-8">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20 relative"
            >
              <Sparkles className="w-8 h-8 text-white" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg"
              >
                <Star className="w-3 h-3 text-gray-900 fill-current" />
              </motion.div>
            </motion.div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
              ¡Hola! Vamos a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">configurar tu cuenta</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
              En menos de 2 minutos aprenderás a crear órdenes profesionales y compartirlas con tus clientes.
            </p>
          </div>

          {/* Flow Visualization */}
          <div className="mb-8 space-y-4">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-center mb-4">Tu primer recorrido</h2>
            
            <div className="relative flex justify-between max-w-[240px] mx-auto px-2">
              {/* Connector Line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-800 z-0">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" 
                />
              </div>
              
              <StepIcon icon={<Users className="w-4 h-4" />} label="Cliente" delay={0.6} />
              <StepIcon icon={<Laptop className="w-4 h-4" />} label="Equipo" delay={0.8} />
              <StepIcon icon={<ClipboardCheck className="w-4 h-4" />} label="Orden" delay={1.0} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            <LearningItem 
              title="Carga de Datos"
              description="Mira cómo se autocompleta la información."
              color="blue"
            />
            <LearningItem 
              title="Gestión Técnica"
              description="Registra tareas y piezas fácilmente."
              color="indigo"
            />
            <LearningItem 
              title="Garantías"
              description="Configura tiempos de respaldo profesional."
              color="cyan"
            />
            <LearningItem 
              title="Firma Digital"
              description="Tus clientes podrán firmar desde el celular."
              color="purple"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartOnboarding}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-4 rounded-[1rem] flex items-center justify-center space-x-3 transition-all shadow-xl shadow-blue-600/20 group touch-manipulation"
          >
            <span className="text-base font-bold">Comenzar el Recorrido</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
          
          <p className="mt-4 text-center text-gray-500 text-[10px]">
            No te preocupes, usaremos datos de prueba para este ejemplo.
          </p>
        </div>
      </AnimatedContent>
    </div>
  )
}

function StepIcon({ icon, label, delay }: { icon: React.ReactNode, label: string, delay: number }) {
  return (
    <motion.div 
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="relative z-10 flex flex-col items-center"
    >
      <div className="w-8 h-8 bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center mb-1 shadow-lg">
        <div className="text-blue-400">{icon}</div>
      </div>
      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    </motion.div>
  )
}

function LearningItem({ title, description, color }: { title: string, description: string, color: 'blue' | 'indigo' | 'cyan' | 'purple' }) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  }

  return (
    <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-gray-600 transition-colors">
      <div className={`w-6 h-6 rounded-md ${colors[color]} flex items-center justify-center mb-2`}>
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <h3 className="text-white font-bold text-[13px] mb-0.5">{title}</h3>
      <p className="text-gray-400 text-[11px] leading-tight">{description}</p>
    </div>
  )
}

