//app/login/page.tsx

"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/basic/button"
import { Input } from "@/components/ui/basic/input"
import { Label } from "@/components/ui/basic/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/basic/card"
import { Alert, AlertDescription } from "@/components/ui/basic/alert"
import {
  Loader2,
  Shield,
  AlertCircle,
  Moon,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Phone,
  RefreshCw
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import logo from "@/public/logo.png"

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
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.663,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  )
}

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, sendPasswordReset, loading, error: authError, clearError } = useAuth()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceLocked, setDeviceLocked] = useState(false)
  const [notAuthorized, setNotAuthorized] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Auth states for Email/Password
  const [mode, setMode] = useState<'login' | 'forgot-password'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isEmailFormExpanded, setIsEmailFormExpanded] = useState(false)

  // Function to reset all states
  const resetLoginState = useCallback(() => {
    setError(null)
    setDeviceLocked(false)
    setNotAuthorized(false)
    setSuccessMessage(null)
    setIsSigningIn(false)
    clearError()
  }, [clearError])

  // Listen for global auth errors
  useEffect(() => {
    if (authError) {
      if (authError.includes('DEVICE_LOCKED')) {
        setDeviceLocked(true)
        setError('Esta cuenta ya está registrada en otro dispositivo.')
      } else if (authError.includes('ACCOUNT_NOT_AUTHORIZED')) {
        setNotAuthorized(true)
        setError('Esta cuenta no está autorizada para usar la aplicación.')
      } else {
        setError(authError)
      }
    }
  }, [authError])

  // Initialize on mount
  useEffect(() => {
    setMounted(true)
    clearError()

    // Detect dark mode preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(prefersDark)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [clearError])

  // Apply dark mode class
  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', darkMode)
    }
  }, [darkMode, mounted])

  // Redirect if authenticated
  useEffect(() => {
    if (!loading && user && mounted && !isRedirecting) {
      console.log('User authenticated, redirecting to /ordenes')
      setIsRedirecting(true)
      router.push('/ordenes')
    }
  }, [user, loading, mounted, router, isRedirecting])

  // Auto-expand credentials form if there is an error or success
  useEffect(() => {
    if (error && !deviceLocked && !notAuthorized || successMessage) {
      setIsEmailFormExpanded(true)
    }
  }, [error, successMessage, deviceLocked, notAuthorized])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true)
      clearError()
      setError(null)
      setDeviceLocked(false)
      setNotAuthorized(false)
      setSuccessMessage(null)
      console.log('Attempting Google sign in...')
      await signInWithGoogle()
    } catch (error: any) {
      console.error('Google Sign In Error:', error)
      const msg = error.message || ''
      if (msg.includes('DEVICE_LOCKED')) {
        setDeviceLocked(true)
        setError('Esta cuenta ya está registrada en otro dispositivo.')
      } else if (msg.includes('ACCOUNT_NOT_AUTHORIZED')) {
        setNotAuthorized(true)
        setError('Esta cuenta no está autorizada para usar la aplicación.')
      } else {
        setError(error.message || 'Error al iniciar sesión con Google.')
      }
      setIsSigningIn(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSigningIn(true)
      clearError()
      setError(null)
      setDeviceLocked(false)
      setNotAuthorized(false)
      setSuccessMessage(null)
      await signInWithEmail(email, password)
    } catch (error: any) {
      console.error('Error logging in with email:', error)
      const msg = error.message || ''
      if (msg.includes('DEVICE_LOCKED')) {
        setDeviceLocked(true)
        setError('Esta cuenta ya está registrada en otro dispositivo.')
      } else if (msg.includes('ACCOUNT_NOT_AUTHORIZED')) {
        setNotAuthorized(true)
        setError('Esta cuenta no está autorizada para usar la aplicación.')
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setError('Correo o contraseña incorrectos. Verifica tus datos.')
      } else if (error.code === 'auth/invalid-email') {
        setError('El formato del correo electrónico no es válido.')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente. Intenta de nuevo más tarde.')
      } else if (error.code === 'auth/network-request-failed') {
        setError('Error de conexión. Verifica tu internet e intenta de nuevo.')
      } else {
        setError(error.message || 'Error al iniciar sesión con correo/contraseña.')
      }
      setIsSigningIn(false)
    }
  }

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSigningIn(true)
      clearError()
      setError(null)
      setDeviceLocked(false)
      setNotAuthorized(false)
      setSuccessMessage(null)
      await sendPasswordReset(email)
      setSuccessMessage('Se ha enviado un enlace de recuperación a tu correo electrónico. Por favor, revisa tu bandeja de entrada.')
      setIsSigningIn(false)
    } catch (error: any) {
      console.error('Error requesting password reset:', error)
      setError(error.message || 'Error al enviar el enlace de recuperación.')
      setIsSigningIn(false)
    }
  }

  if (!mounted) {
    return null
  }

  if ((user && !loading) || isRedirecting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white-500 to-blue-500 dark:from-blue-900 dark:to-cyan-950 p-4 transition-colors duration-300">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <img
              src={logo.src}
              alt="TecniControl Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-lg font-semibold text-slate-900 dark:text-white">Redirigiendo a TecniControl...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white to-blue-200 dark:from-gray-900 dark:to-gray-950 p-4 transition-colors duration-300">

      {/* Main card */}
      <div className="w-full max-w-md my-8 animate-in fade-in zoom-in-95 duration-300">
        <Card className="shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
          <div className="h-1.5 w-full bg-blue-500"></div>

          {/* Header */}
          <CardHeader className="text-center px-8 pt-8 pb-4">
            <div className="flex justify-center items-center gap-3 mb-2">
              <div className="w-12 h-12 overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                <img
                  src={logo.src}
                  alt="TecniControl Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardTitle className="text-4xl font-bold bg-blue-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                TecniControl
              </CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-gray-300 text-lg">
              Gestiona tus órdenes de servicio
            </CardDescription>
          </CardHeader>

          {/* Content */}
          <CardContent className="px-8 pb-8 space-y-6">

            {/* Error Message (Standard) */}
            {error && !deviceLocked && !notAuthorized && (
              <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <AlertDescription className="text-red-800 dark:text-red-300 font-medium">
                    {error}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Restricted Access View */}
            {(deviceLocked || notAuthorized) ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-2">
                    {deviceLocked ? <Lock className="h-8 w-8" /> : <Shield className="h-8 w-8" />}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Acceso Restringido
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {error}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest text-center">
                    Contacte a Soporte para Habilitación
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <a 
                      href="mailto:extep1983@gmail.com" 
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-900/50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">Correo electrónico</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">extep1983@gmail.com</p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-blue-500 -rotate-90" />
                    </a>

                    <a 
                      href="tel:+573107981736" 
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-green-50 dark:bg-slate-900/50 dark:hover:bg-green-900/20 border border-slate-200 dark:border-slate-800 hover:border-green-300 dark:hover:border-green-800 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm text-green-600 dark:text-green-400">
                          <Phone className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">WhatsApp / Teléfono</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">+57 310 798 1736</p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-green-500 -rotate-90" />
                    </a>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={resetLoginState}
                  className="w-full py-6 rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Volver al inicio de sesión
                </Button>
              </div>
            ) : (
              <>
                {/* Success Message */}
                {successMessage && (
                  <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <AlertDescription className="text-green-850 dark:text-green-200">
                        {successMessage}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                {/* Primary Google Login Option */}
                <div className="space-y-3">
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={loading || isSigningIn}
                    size="lg"
                    className="w-full py-7 text-base font-bold bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
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

                {/* Collapsible Email/Password Form Section */}
                <div className="space-y-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEmailFormExpanded(!isEmailFormExpanded)}
                    className="w-full flex items-center justify-between py-3.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 transition-all duration-200 group"
                  >
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      O ingresar con correo y contraseña
                    </span>
                    <div className="p-1 rounded-md bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700/50 group-hover:border-blue-500/30 transition-all">
                      {isEmailFormExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      )}
                    </div>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isEmailFormExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pt-2 pb-1 space-y-5 px-0.5">
                        {/* Mode selection tabs */}
                        {mode === 'login' && (
                          <div className="flex bg-slate-100 dark:bg-gray-900 p-1 rounded-xl">
                            <div className="flex-1 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-gray-850 text-blue-600 dark:text-blue-400 shadow-sm text-center">
                              Iniciar Sesión
                            </div>
                          </div>
                        )}

                        {/* Forms depending on current mode */}
                        {mode === 'login' && (
                          <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div className="space-y-1">
                              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Correo electrónico</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                                <Input
                                  id="email"
                                  type="email"
                                  placeholder="nombre@ejemplo.com"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="pl-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">Contraseña</Label>
                                <button
                                  type="button"
                                  onClick={() => { setMode('forgot-password'); setError(null); setSuccessMessage(null); }}
                                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  ¿Olvidaste tu contraseña?
                                </button>
                              </div>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                                <Input
                                  id="password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="pl-10 pr-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                                >
                                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </div>

                            <Button
                              type="submit"
                              disabled={loading || isSigningIn}
                              className="w-full py-6 text-base font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              {isSigningIn ? (
                                <>
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                  <span>Iniciando sesión...</span>
                                </>
                              ) : (
                                <span>Ingresar</span>
                              )}
                            </Button>
                          </form>
                        )}
                        {mode === 'forgot-password' && (
                          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
                                Ingresa tu correo electrónico y te enviaremos un enlace de recuperación para restablecer tu contraseña de forma segura.
                              </p>
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Correo electrónico</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                                <Input
                                  id="email"
                                  type="email"
                                  placeholder="nombre@ejemplo.com"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="pl-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                                  required
                                />
                              </div>
                            </div>

                            <Button
                              type="submit"
                              disabled={loading || isSigningIn}
                              className="w-full py-6 text-base font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              {isSigningIn ? (
                                <>
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                  <span>Enviando enlace...</span>
                                </>
                              ) : (
                                <span>Enviar enlace de recuperación</span>
                              )}
                            </Button>

                            <button
                              type="button"
                              onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
                              className="flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                            >
                              <ArrowLeft className="h-4 w-4" />
                              <span>Volver al inicio de sesión</span>
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy info box */}
                <div className="rounded-xl bg-slate-50 dark:bg-gray-700/50 p-5 border border-slate-200 dark:border-gray-600">
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        Tu privacidad está protegida
                      </p>
                      <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                        Solo utilizamos tu información para autenticarte de forma segura. Tus datos están completamente resguardados.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
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
            TecniControl v1.0.0
          </p>
        </footer>
      </div>
    </main>
  )
}
