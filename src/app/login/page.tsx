// app/login/page.tsx
"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/basic/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/basic/card"
import { Alert, AlertDescription } from "@/components/ui/basic/alert"
import { Loader2, Wrench, Shield, AlertCircle, Moon, Sun, Smartphone } from "lucide-react"
import { useState, useEffect } from "react"

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
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // Detectar preferencia de tema del sistema y configurar el tema oscuro
  useEffect(() => {
    setIsClient(true)
    
    // Verificar si hay una preferencia guardada en localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    
    // Si no hay preferencia guardada, usar la preferencia del sistema
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    setDarkMode(savedDarkMode || systemPrefersDark)
    
    // Escuchar cambios en la preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      // Solo cambiar si no hay preferencia guardada en localStorage
      if (!localStorage.getItem('darkMode')) {
        setDarkMode(e.matches)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Aplicar tema oscuro al documento
  useEffect(() => {
    if (isClient) {
      if (darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [darkMode, isClient])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
  }

  // Si hay usuario, el ProtectedRoute se encargará de la redirección
  if (user && !loading && isClient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary dark:text-blue-400" />
          <p className="text-lg font-medium dark:text-white">Redirigiendo a la aplicación...</p>
        </div>
      </div>
    )
  }

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true)
      setError(null)
      console.log('🔐 Attempting Google sign in...')
      await signInWithGoogle()
      console.log('✅ Sign in successful, ProtectedRoute will handle redirect')
    } catch (error: any) {
      console.error('❌ Sign in failed:', error)
      
      // Mensajes de error más específicos
      if (error.code === 'auth/popup-closed-by-user') {
        setError('El inicio de sesión fue cancelado. Por favor, intenta de nuevo.')
      } else if (error.code === 'auth/network-request-failed') {
        setError('Error de conexión. Verifica tu conexión a internet e intenta de nuevo.')
      } else {
        setError('Error al iniciar sesión. Por favor, intenta de nuevo.')
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  // Manejar la tecla Enter para iniciar sesión
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !isSigningIn) {
      handleSignIn()
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4 dark:from-gray-900 dark:to-gray-800">
      {/* Botón de toggle para tema oscuro */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      >
        {darkMode ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-gray-700" />
        )}
      </button>
      
      <div className="absolute top-4 left-4 flex items-center space-x-2 text-sm text-muted-foreground dark:text-gray-400">
        <Shield className="h-4 w-4" />
        <span>Conexión segura</span>
      </div>
      
      <Card className="w-full max-w-md shadow-lg rounded-2xl overflow-hidden border-0 dark:bg-gray-800 dark:border-gray-700">
        <div className="bg-primary dark:bg-blue-600 h-2 w-full"></div>
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center items-center gap-3">
            <div className="p-2 bg-primary/10 dark:bg-blue-500/20 rounded-full">
              <Wrench className="h-10 w-10 text-primary dark:text-blue-400" />
            </div>
            <CardTitle className="text-4xl font-headline bg-gradient-to-r from-primary to-primary/70 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              TecniControl
            </CardTitle>
          </div>
          <CardDescription className="text-lg dark:text-gray-300">
            Inicia sesión para gestionar tus órdenes de servicio
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="mb-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div 
            className="flex flex-col space-y-4"
            onKeyPress={handleKeyPress}
            tabIndex={0}
          >
            <Button
              onClick={handleSignIn}
              className="w-full py-6 text-base font-medium transition-all duration-300 hover:shadow-md dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 dark:border-gray-300"
              disabled={loading || isSigningIn}
              size="lg"
              variant="outline"
            >
              {loading || isSigningIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <GoogleIcon className="dark:invert" />
                  <span className="ml-2">Continuar con Google</span>
                </>
              )}
            </Button>
          </div>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground dark:bg-gray-800 dark:text-gray-400">
                Acceso seguro
              </span>
            </div>
          </div>
          
          <div className="rounded-lg bg-muted/30 p-4 dark:bg-gray-700/30">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-primary dark:text-blue-400 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium dark:text-white">Tu privacidad está protegida</p>
                <p className="text-muted-foreground dark:text-gray-400">
                  Solo utilizamos tu información para autenticarte en la aplicación y 
                  no compartimos tus datos con terceros.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <footer className="mt-8 text-center text-sm text-muted-foreground max-w-md dark:text-gray-400">
        <p>
          Al iniciar sesión, aceptas nuestros{' '}
          <a href="#" className="text-primary hover:underline font-medium dark:text-blue-400">
            Términos de Servicio
          </a>{' '}
          y{' '}
          <a href="#" className="text-primary hover:underline font-medium dark:text-blue-400">
            Política de Privacidad
          </a>
          .
        </p>
        <p className="mt-2 text-xs">
          {darkMode ? 'Modo oscuro' : 'Modo claro'} • v1.0.0
        </p>
      </footer>
    </main>
  )
}