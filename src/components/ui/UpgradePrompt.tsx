import React from 'react';
import { Crown, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

interface UpgradePromptProps {
  title?: string;
  description?: string;
  features?: string[];
  onUpgrade?: () => void;
}

export function UpgradePrompt({ 
  title = "Funcionalidad Exclusiva Pro", 
  description = "Actualiza tu plan a Pro para desbloquear esta y más funcionalidades que potenciarán tu negocio.",
  features = [
    "Catálogo ilimitado de tareas y repuestos",
    "Agrega items a las órdenes con un solo clic",
    "Órdenes mensuales ilimitadas",
    "PDFs sin marca de agua y con tu propio logo"
  ],
  onUpgrade 
}: UpgradePromptProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center h-full min-h-[60vh] animate-in fade-in zoom-in duration-300">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <Crown className="w-10 h-10 dark:text-amber-500 text-amber-600" />
      </div>
      
      <h2 className="text-2xl font-bold dark:text-slate-100 text-slate-900 mb-3">{title}</h2>
      <p className="dark:text-slate-400 text-slate-600 mb-8 max-w-md mx-auto">{description}</p>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 w-full max-w-md mb-8 text-left">
        <h3 className="font-semibold dark:text-slate-200 text-slate-800 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 dark:text-slate-400 dark:text-slate-400 text-slate-600" /> 
          Beneficios del Plan Pro
        </h3>
        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 dark:text-amber-500 text-amber-600 shrink-0 mt-0.5" />
              <span className="dark:text-slate-300 text-slate-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <button 
        onClick={onUpgrade}
        className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-medium px-8 py-4 rounded-full shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 group w-full max-w-md sm:w-auto transition-colors"
      >
        <Crown className="w-5 h-5" />
        Actualizar a Pro
        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
