'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Building, ShieldCheck, Bell, Palette, 
  HelpCircle, LogOut, ChevronRight, Settings, 
  BarChart3, ChevronLeft
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useMobileNavigation } from '@/components/providers/MobileNavigationContext'
import CuentaYSeguridad from '@/components/configuracion/CuentaYSeguridad'
import MiNegocio from '@/components/configuracion/MiNegocio'
import Preferencias from '@/components/configuracion/Preferencias'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/basic/alert-dialog"
import { Button } from "@/components/ui/basic/button"

type SettingsSection = 'negocio' | 'seguridad' | 'notificaciones' | 'preferencias' | 'ayuda' | null

function ConfiguracionContent() {
  const { logout } = useAuth();
  const { navigateTo } = useMobileNavigation();
  const [activeSection, setActiveSection] = useState<SettingsSection>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const section = searchParams.get('section');
    if (section && ['negocio', 'seguridad', 'notificaciones', 'preferencias', 'ayuda'].includes(section)) {
      setActiveSection(section as SettingsSection);
    }
  }, [searchParams]);

  const menuItems = [
    {
      id: 'negocio',
      label: 'Mi Negocio',
      description: 'Datos de tu negocio e información de contacto para PDFs profesionales',
      icon: Building,
      color: 'dark:text-blue-400 text-blue-600',
      bg: 'dark:bg-blue-500/10 bg-blue-100'
    },
    {
      id: 'seguridad',
      label: 'Privacidad y Seguridad',
      description: 'Contraseñas, eliminación de cuenta y exportación',
      icon: ShieldCheck,
      color: 'dark:text-emerald-400 text-emerald-600',
      bg: 'dark:bg-emerald-500/10 bg-emerald-100'
    },
    {
      id: 'reportes',
      label: 'Reportes de Consumo',
      description: 'Análisis y estadísticas de piezas usadas',
      icon: BarChart3,
      color: 'dark:text-purple-400 text-purple-600',
      bg: 'dark:bg-purple-500/10 bg-purple-100',
      action: () => navigateTo('reportes')
    },
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      description: 'Preferencias de alertas y correos',
      icon: Bell,
      color: 'dark:text-amber-400 text-amber-600',
      bg: 'dark:bg-amber-500/10 bg-amber-100'
    },
    {
      id: 'preferencias',
      label: 'Preferencias y Apariencia',
      description: 'Tema claro/oscuro',
      icon: Palette,
      color: 'dark:text-pink-400 text-pink-600',
      bg: 'dark:bg-pink-500/10 bg-pink-100'
    },
    {
      id: 'ayuda',
      label: 'Ayuda y Soporte',
      description: 'Centro de ayuda y términos de servicio',
      icon: HelpCircle,
      color: 'dark:text-sky-400 text-sky-600',
      bg: 'dark:bg-sky-500/10 bg-sky-100'
    }
  ];

  if (activeSection) {
    return (
      <div className="bg-transparent min-h-screen pb-safe">
        <div className="sticky top-0 z-40 dark:bg-gray-900/95 bg-gray-100/95 border-b dark:border-gray-800 border-gray-200 pt-safe backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
            <button 
              onClick={() => setActiveSection(null)}
              className="p-2 -ml-2 rounded-xl dark:hover:dark:bg-gray-800 hover:bg-gray-200 hover:bg-gray-200 dark:text-gray-400 text-gray-600 dark:hover:dark:text-white hover:text-gray-900 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold dark:text-white text-gray-900">
              {menuItems.find(i => i.id === activeSection)?.label}
            </h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-5 space-y-6">
          {activeSection === 'negocio' && <MiNegocio />}
          {activeSection === 'seguridad' && <CuentaYSeguridad />}
          {activeSection === 'preferencias' && <Preferencias />}
          {(activeSection === 'notificaciones' || activeSection === 'ayuda') && (
             <div className="p-8 text-center border-2 border-dashed dark:border-gray-800 border-gray-200 rounded-2xl">
               <Settings className="w-12 h-12 dark:text-gray-600 dark:text-gray-400 text-gray-600 mx-auto mb-4" />
               <h2 className="text-lg font-medium dark:text-gray-400 text-gray-600">Próximamente</h2>
               <p className="text-sm dark:text-gray-500 dark:text-gray-400 text-gray-600 mt-2">Esta sección está en desarrollo.</p>
             </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent min-h-screen pb-safe">
      <div className="sticky top-0 z-40 dark:bg-gray-900/95 bg-gray-100/95 border-b dark:border-gray-800 border-gray-200 pt-safe backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-3 dark:bg-gray-900/80 bg-gray-100 ring-1 ring-inset ring-sky-500/20 rounded-xl shadow-[0_12px_40px_-24px_rgba(56,189,248,0.9)]">
              <Settings className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold dark:text-white text-gray-900">Ajustes</h1>
              <p className="dark:text-gray-400 text-gray-600 text-sm mt-1">Preferencias y configuración de cuenta</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="dark:bg-gray-950/70 bg-white border dark:border-white/10 border-gray-300/50 shadow-lg rounded-3xl overflow-hidden divide-y divide-gray-800">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) item.action();
                else setActiveSection(item.id as SettingsSection);
              }}
              className="w-full flex items-center justify-between p-4 hover:dark:bg-gray-800/50 hover:bg-gray-200 transition-colors active:dark:bg-gray-800/80 active:bg-gray-200/80 text-left"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${item.bg}`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <h3 className="dark:text-white text-gray-900 font-medium text-lg">{item.label}</h3>
                  <p className="text-gray-500 text-sm">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          ))}
        </div>

        <div className="mt-8 px-2">
          <button
            onClick={() => setLogoutDialogOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 dark:text-red-400 text-red-700 rounded-2xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
          
          <div className="text-center mt-6">
            <p className="text-xs text-gray-600 font-medium">TecniControl v1.0.0</p>
          </div>
        </div>

        <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <AlertDialogContent className="dark:bg-slate-950/95 bg-white border dark:border-white/10 border-gray-300/50 max-w-sm rounded-[32px] shadow-[0_24px_80px_-36px_rgba(15,23,42,0.75)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="dark:text-white text-gray-900">Confirmar cierre de sesión</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro que deseas cerrar la sesión? Si hay datos locales sin sincronizar, podrían perderse.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto mt-0">Cancelar</AlertDialogCancel>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={() => {
                  setLogoutDialogOpen(false);
                  logout();
                }}
              >
                Cerrar sesión
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ConfiguracionContent />
    </Suspense>
  );
}