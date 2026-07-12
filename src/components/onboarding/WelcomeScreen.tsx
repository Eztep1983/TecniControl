'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowRight, 
  Users, 
  Laptop, 
  ClipboardCheck,
  Wrench,
  Shield,
  PenLine,
  ChevronRight,
  Info,
  Clock

} from 'lucide-react'
import AnimatedContent from '@/components/ui/AnimatedContent'
import { motion } from 'motion/react'
import logo from '@/public/logo.png'

interface WelcomeScreenProps {
  onStartOnboarding: () => void;
  onSkip: () => void;
}

export default function WelcomeScreen({ onStartOnboarding, onSkip }: WelcomeScreenProps) {
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/70 overflow-y-auto">
      <AnimatedContent distance={20} direction="vertical" duration={0.5} className="w-full max-w-lg my-auto relative">
        
        {/* Skip button at top right */}
        <button 
          onClick={onSkip}
          className="absolute -top-12 right-4 text-gray-500 hover:dark:text-white hover:text-gray-900 transition-colors flex items-center gap-1 text-sm font-medium group"
        >
          Ya conozco la app
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black border dark:border-gray-800 border-gray-200 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px]" />
          
          <div className="relative z-10 text-center mb-8">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20 relative"
            >
              <div className="w-12 h-12 overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                <img
                  src={logo.src}
                  alt="TecniControl Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold dark:text-white text-gray-900 mb-3 tracking-tight">
              ¡Bienvenido a TecniControl!              
            </h1>
            
            <div className="flex items-center justify-center gap-2 mb-4 bg-blue-500/10 w-fit mx-auto px-3 py-1 rounded-full border border-blue-500/20">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Recorrido: 1 minuto</span>
            </div>

            <p className="dark:text-gray-400 text-gray-600 text-lg sm:text-base max-w-sm mx-auto leading-relaxed">
              Aprenderas a crear órdenes profesionales y compartirlas con tus clientes.
            </p>
          </div>

          {/* Flow Visualization */}
          <div className="mb-10 space-y-6">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-center">Cómo funciona</h2>
            
            <div className="relative flex justify-between max-w-[280px] mx-auto">
              {/* Connector Line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 dark:bg-gray-800 bg-gray-200 z-0">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" 
                />
              </div>
              
              <StepIcon 
                icon={<Users className="w-4 h-4" />} 
                label="Cliente" 
                description="A quién sirves" 
                delay={0.6} 
              />
              <StepIcon 
                icon={<Laptop className="w-4 h-4" />} 
                label="Equipo" 
                description="Qué reparas" 
                delay={0.8} 
              />
              <StepIcon 
                icon={<ClipboardCheck className="w-4 h-4" />} 
                label="Orden" 
                description="Qué hiciste" 
                delay={1.0} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            <LearningItem 
              title="Carga de Datos"
              description="Mira cómo se autocompleta la información."
              color="blue"
              icon={Users}
            />
            <LearningItem 
              title="Gestión Técnica"
              description="Registra tareas y piezas fácilmente."
              color="indigo"
              icon={Wrench}
            />
            <LearningItem 
              title="Garantías"
              description="Configura tiempos de respaldo profesional."
              color="cyan"
              icon={Shield}
            />
            <LearningItem 
              title="Firma Digital"
              description="Tus clientes podrán firmar desde el celular."
              color="purple"
              icon={PenLine}
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartOnboarding}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 dark:text-white text-gray-900 p-4 rounded-[1rem] flex items-center justify-center space-x-3 transition-all shadow-xl shadow-blue-600/20 group touch-manipulation"
              >
                <span className="text-lg font-bold">Ver cómo funciona</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <button
                onClick={onSkip}
                className="w-full text-gray-500 hover:dark:text-gray-300 hover:text-gray-700 py-2 text-sm font-medium transition-colors"
              >
                Explorar por mi cuenta
              </button>
            </div>
          </div>
        </div>
      </AnimatedContent>
    </div>
  )
}

function StepIcon({ icon, label, description, delay }: { icon: React.ReactNode, label: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="relative z-10 flex flex-col items-center"
    >
      <div className="w-8 h-8 dark:bg-gray-900 bg-gray-100 border dark:border-gray-700 border-gray-300 rounded-full flex items-center justify-center mb-1 shadow-lg">
        <div className="text-blue-400">{icon}</div>
      </div>
      <span className="text-[10px] font-bold dark:text-white text-gray-900 uppercase tracking-wider mb-0.5">{label}</span>
      <span className="text-[8px] text-gray-500 font-medium leading-none text-center whitespace-nowrap">{description}</span>
    </motion.div>
  )
}

function LearningItem({ title, description, color, icon: Icon }: { title: string, description: string, color: 'blue' | 'indigo' | 'cyan' | 'purple', icon: any }) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  }

  return (
    <div className="p-3 rounded-xl dark:bg-gray-800/30 bg-gray-100 border dark:border-gray-700/50 border-gray-300 hover:dark:border-gray-600 hover:border-gray-300 transition-colors">
      <div className={`w-6 h-6 rounded-md ${colors[color]} flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="dark:text-white text-gray-900 font-bold text-[13px] mb-0.5">{title}</h3>
      <p className="dark:text-gray-400 text-gray-600 text-[11px] leading-tight">{description}</p>
    </div>
  )
}