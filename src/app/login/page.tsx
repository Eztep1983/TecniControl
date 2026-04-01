//app/login/page.tsx

"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/basic/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/basic/card"
import { Alert, AlertDescription } from "@/components/ui/basic/alert"
import { Loader2, Wrench, Shield, AlertCircle, Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 48 48" 
      width="24px" 
      height="24px"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.663,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  )
}

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Inicializar cuando el componente se monte en el cliente
  useEffect(() => {
    setMounted(true)
    
    // Detectar preferencia del sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(prefersDark)
    
    // Escuchar cambios en la preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Aplicar tema al documento
  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', darkMode)
    }
  }, [darkMode, mounted])

  // Manejar redirección cuando el usuario está autenticado
  useEffect(() => {
    if (!loading && user && mounted && !isRedirecting) {
      console.log(' User authenticated, redirecting to /ordenes')
      setIsRedirecting(true)
      router.push('/ordenes')
    }
  }, [user, loading, mounted, router, isRedirecting])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true)
      setError(null)
      console.log(' Attempting Google sign in via Popup...')
      await signInWithGoogle()
      // En modo Popup, la promesa se resuelve exitosamente aquí.
      // Firebase onAuthStateChanged se disparará, y AuthGuard nos redirigirá de inmediato.
    } catch (error: any) {
      setError(error.message || 'Error al conectar con Google')      
      
      if (error.code === 'auth/popup-closed-by-user' || error.message.includes('cancelado')) {
        setError('El inicio de sesión fue cancelado. Por favor, intenta de nuevo.')
      } else if (error.code === 'auth/network-request-failed') {
        setError('Error de conexión. Verifica tu red e intenta de nuevo.')
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('Dominio no autorizado. Contacta al administrador.')
      } else {
        setError('Operación cancelada o hubo un error inesperado. Intenta de nuevo.')
      }
      setIsSigningIn(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !isSigningIn) {
      handleSignIn()
    }
  }

  // Evitar parpadeo durante la hidratación
  if (!mounted) {
    return null
  }

  // Mostrar pantalla de redireccionamiento
  if ((user && !loading) || isRedirecting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 p-4 transition-colors duration-300">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
            <Wrench className="h-12 w-12 text-white" />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-lg font-semibold text-slate-900 dark:text-white">Redirigiendo a TecniControl...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 p-4 transition-colors duration-300">
      {/* Toggle de tema - Fixed para mejor accesibilidad */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-6 right-6 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border border-gray-200 dark:border-gray-700 z-50"
        aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      >
        {darkMode ? (
          <Sun className="h-5 w-5 text-amber-500" />
        ) : (
          <Moon className="h-5 w-5 text-slate-700" />
        )}
      </button>
      
      {/* Indicador de seguridad */}
      <div className="fixed top-6 left-6 flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-gray-800 shadow-md text-sm text-slate-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 z-50">
        <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span className="font-medium">Conexión segura</span>
      </div>
      
      {/* Card principal */}
      <div className="w-full max-w-md">
        <Card className="shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
          {/* Barra superior decorativa */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"></div>
          
          {/* Header */}
          <CardHeader className="text-center px-8 pt-10 pb-6">
            <div className="flex justify-center items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Wrench className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                TecniControl
              </CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-gray-300 text-lg">
              Gestiona tus órdenes de servicio
            </CardDescription>
          </CardHeader>
          
          {/* Contenido */}
          <CardContent className="px-8 pb-10 space-y-6">
            {/* Mensaje de error */}
            {error && (
              <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {error}
                  </AlertDescription>
                </div>
              </Alert>
            )}
            
            {/* Botón de Google */}
            <div onKeyDown={handleKeyPress}>
              <Button
                onClick={handleSignIn}
                disabled={loading || isSigningIn}
                size="lg"
                variant="outline"
                className="w-full py-6 text-base font-medium bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading || isSigningIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon />
                    <span className="ml-3">Continuar con Google</span>
                  </>
                )}
              </Button>
            </div>
            
            {/* Divisor */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                  Acceso seguro
                </span>
              </div>
            </div>
            
            {/* Info de privacidad */}
            <div className="rounded-xl bg-slate-50 dark:bg-gray-700/50 p-5 border border-slate-200 dark:border-gray-600">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    Tu privacidad está protegida
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                    Solo utilizamos tu información para autenticarte. Tus datos no se comparten con terceros.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <footer className="mt-8 text-center space-y-3 px-4">
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Al iniciar sesión, aceptas nuestros{' '}
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors">
              Términos de Servicio
            </a>
            {' '}y{' '}
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors">
              Política de Privacidad
            </a>
          </p>
          <p className="text-xs text-slate-500 dark:text-gray-500">
            TecniControl v1.0.0 • {darkMode ? ' Modo oscuro' : ' Modo claro'}
          </p>
        </footer>
      </div>
    </main>
  )
}