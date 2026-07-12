'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/basic/card"
import { Palette, Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from "react"

export default function Preferencias() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Card className="dark:bg-gray-950/70 bg-white dark:border-white/10 border-gray-200 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.8)] transition-all">
      <CardHeader className="border-b dark:border-white/10 border-gray-200 dark:bg-gray-950/80 bg-gray-50 rounded-t-2xl">
        <CardTitle className="dark:text-white text-gray-900 flex items-center gap-2 text-xl">
          <Palette className="w-5 h-5 text-pink-400" />
          Preferencias y Apariencia
        </CardTitle>
        <CardDescription className="dark:text-gray-400 text-gray-600 mt-1">
          Personaliza cómo se ve y se siente la aplicación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-4">
          <h3 className="dark:text-gray-300 text-gray-700 font-medium">Tema de la Aplicación</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === 'light' 
                  ? 'border-pink-500 bg-pink-500/10 text-pink-600' 
                  : 'dark:border-gray-800 border-gray-200 dark:hover:dark:bg-gray-800 hover:bg-gray-200 hover:bg-gray-100 dark:text-gray-400 text-gray-600'
              }`}
            >
              <Sun className="w-8 h-8" />
              <span className="font-medium">Claro</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === 'dark' 
                  ? 'border-pink-500 bg-pink-500/10 text-pink-400' 
                  : 'dark:border-gray-800 border-gray-200 dark:hover:dark:bg-gray-800 hover:bg-gray-200 hover:bg-gray-100 dark:text-gray-400 text-gray-600'
              }`}
            >
              <Moon className="w-8 h-8" />
              <span className="font-medium">Oscuro</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === 'system' 
                  ? 'border-pink-500 bg-pink-500/10 text-pink-500' 
                  : 'dark:border-gray-800 border-gray-200 dark:hover:dark:bg-gray-800 hover:bg-gray-200 hover:bg-gray-100 dark:text-gray-400 text-gray-600'
              }`}
            >
              <Monitor className="w-8 h-8" />
              <span className="font-medium">Sistema</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
