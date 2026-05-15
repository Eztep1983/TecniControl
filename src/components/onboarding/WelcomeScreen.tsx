'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react'
import AnimatedContent from '@/components/ui/AnimatedContent'

interface WelcomeScreenProps {
  onStartOnboarding: () => void;
}

export default function WelcomeScreen({ onStartOnboarding }: WelcomeScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <AnimatedContent distance={20} direction="vertical" duration={0.5} className="w-full max-w-md">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              ¡Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">TecniControl</span>!
            </h1>
            <p className="text-gray-400 text-sm">
              La plataforma más rápida y profesional para gestionar tus servicios técnicos, crear órdenes y fidelizar a tus clientes.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <FeatureItem 
              icon={<Zap className="w-5 h-5 text-yellow-400" />}
              title="Rápido y Sencillo"
              description="Genera órdenes en segundos y envíalas directamente por WhatsApp."
            />
            <FeatureItem 
              icon={<ShieldCheck className="w-5 h-5 text-green-400" />}
              title="Profesionalismo"
              description="Da seguimiento a garantías y mantén el historial de cada equipo."
            />
            <FeatureItem 
              icon={<CheckCircle2 className="w-5 h-5 text-blue-400" />}
              title="Todo en un solo lugar"
              description="Firma digital, reportes en PDF y mucho más en la palma de tu mano."
            />
          </div>

          <button
            onClick={onStartOnboarding}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-[0.98] text-white p-4 rounded-xl flex items-center justify-center space-x-3 transition-all shadow-lg shadow-blue-500/25 group touch-manipulation"
          >
            <span className="text-lg font-bold">Emitir Nueva Orden</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </AnimatedContent>
    </div>
  )
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex items-start space-x-4 bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50">
      <div className="bg-gray-700/50 p-2 rounded-xl">
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
        <p className="text-gray-400 text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
