'use client'

import { useState, useEffect, useReducer } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/basic/card"
import { Button } from "@/components/ui/basic/button"
import { Input } from "@/components/ui/basic/input"
import { Label } from "@/components/ui/basic/label"
import { useAuth } from '@/components/auth/AuthProvider'
import {
  KeyRound, Download, Trash2, Loader2, AlertTriangle,
  CheckCircle, XCircle, FileJson, FolderOpen, Smartphone,
  User, Mail, ShieldCheck, Eye, EyeOff, ChevronDown,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import {
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/basic/alert-dialog"
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusType = 'success' | 'error' | 'info' | null

interface InlineStatus {
  type: StatusType
  message: string
  details?: string
}

type ExportStep = 'idle' | 'fetching' | 'validating' | 'writing' | 'done' | 'error'

interface ExportState {
  step: ExportStep
  status: InlineStatus
}

type ExportAction =
  | { type: 'FETCH' }
  | { type: 'VALIDATE' }
  | { type: 'WRITE'; isNative: boolean }
  | { type: 'SUCCESS'; message: string; details: string }
  | { type: 'ERROR'; message: string; details: string }
  | { type: 'RESET' }
  | { type: 'CANCELLED' }

function exportReducer(state: ExportState, action: ExportAction): ExportState {
  switch (action.type) {
    case 'FETCH':
      return { step: 'fetching', status: { type: 'info', message: 'Recopilando tus datos...' } }
    case 'VALIDATE':
      return { step: 'validating', status: { type: 'info', message: 'Validando información...' } }
    case 'WRITE':
      return {
        step: 'writing',
        status: {
          type: 'info',
          message: action.isNative
            ? 'Guardando en tu dispositivo...'
            : 'Preparando archivo para descarga...',
        },
      }
    case 'SUCCESS':
      return { step: 'done', status: { type: 'success', message: action.message, details: action.details } }
    case 'ERROR':
      return { step: 'error', status: { type: 'error', message: action.message, details: action.details } }
    case 'CANCELLED':
      return { step: 'idle', status: { type: 'info', message: 'Exportación cancelada' } }
    case 'RESET':
      return { step: 'idle', status: { type: null, message: '' } }
    default:
      return state
  }
}

// ─── Auth provider helpers ─────────────────────────────────────────────────────

type AuthProvider = 'password' | 'google.com' | 'unknown'

function getAuthProvider(user: any): AuthProvider {
  const providerId = user?.providerData?.[0]?.providerId
  if (providerId === 'password') return 'password'
  if (providerId === 'google.com') return 'google.com'
  return 'unknown'
}

// ─── Misc helpers ──────────────────────────────────────────────────────────────

function getUserInitials(displayName?: string | null, email?: string | null): string {
  if (displayName) {
    return displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
  }
  return (email?.[0] ?? '?').toUpperCase()
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// ─── Google SVG icon ───────────────────────────────────────────────────────────

function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

// ─── StatusBanner ──────────────────────────────────────────────────────────────

function StatusBanner({ status }: { status: InlineStatus }) {
  if (!status.type) return null

  const styles: Record<NonNullable<StatusType>, string> = {
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    error:   'bg-red-500/10 border-red-500/30 text-red-400',
    info:    'bg-blue-500/10 border-blue-500/30 text-blue-400',
  }

  const icons: Record<NonNullable<StatusType>, typeof CheckCircle> = {
    success: CheckCircle,
    error:   XCircle,
    info:    Loader2,
  }

  const Icon = icons[status.type]

  return (
    <div className={`p-4 rounded-lg border ${styles[status.type]} transition-all duration-300`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${status.type === 'info' ? 'animate-spin' : ''}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{status.message}</p>
          {status.details && (
            <div className="mt-2 p-3 bg-gray-900/50 rounded border border-gray-700/50">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono break-words">
                {status.details}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function CuentaYSeguridad() {
  const { user, logout } = useAuth()

  // Derived — stable, computed once per render from user.providerData
  const authProvider = getAuthProvider(user)
  const isGoogleUser = authProvider === 'google.com'

  // Export
  const [exportState, dispatchExport] = useReducer(exportReducer, {
    step: 'idle',
    status: { type: null, message: '' },
  })

  // Delete
  const [deleteState, setDeleteState] = useState<{
    loading: boolean
    error: string
    dialogOpen: boolean
  }>({ loading: false, error: '', dialogOpen: false })

  // Re-auth (shared between both providers)
  const [reAuthPassword, setReAuthPassword] = useState('')
  const [showPassword, setShowPassword]     = useState(false)
  const [reAuthError, setReAuthError]       = useState('')
  const [reAuthLoading, setReAuthLoading]   = useState(false)

  // Password reset (email/password users only)
  const [resetStatus, setResetStatus]   = useState<InlineStatus>({ type: null, message: '' })
  const [resetLoading, setResetLoading] = useState(false)

  // Danger zone accordion
  const [dangerOpen, setDangerOpen] = useState(false)

  // Platform detection
  const [isNative, setIsNative] = useState(false)
  useEffect(() => { setIsNative(Capacitor.isNativePlatform()) }, [])

  // Auto-clear export success/info after 8 s
  useEffect(() => {
    if (
      ['done', 'idle'].includes(exportState.step) &&
      ['success', 'info'].includes(exportState.status.type ?? '')
    ) {
      const t = setTimeout(() => dispatchExport({ type: 'RESET' }), 8000)
      return () => clearTimeout(t)
    }
  }, [exportState.step])

  // Auto-clear reset status after 6 s
  useEffect(() => {
    if (resetStatus.type) {
      const t = setTimeout(() => setResetStatus({ type: null, message: '' }), 6000)
      return () => clearTimeout(t)
    }
  }, [resetStatus.type])

  // ─── Dialog cleanup ───────────────────────────────────────────────────────

  const resetDialogState = () => {
    setReAuthPassword('')
    setReAuthError('')
    setShowPassword(false)
  }

  // ─── Export ──────────────────────────────────────────────────────────────

  const handleExportData = async () => {
    if (!user?.uid) {
      dispatchExport({
        type: 'ERROR',
        message: 'No se pudo identificar tu cuenta',
        details: 'Sesión inactiva. Por favor, inicia sesión nuevamente.',
      })
      return
    }

    try {
      dispatchExport({ type: 'FETCH' })

      const controller = new AbortController()
      const timeoutId  = setTimeout(() => controller.abort(), 15000)

      const [clientesSnap, ordenesSnap] = await Promise.all([
        getDocs(query(collection(db, 'clientes'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'ordenes'),  where('userId', '==', user.uid))),
      ])
      clearTimeout(timeoutId)

      dispatchExport({ type: 'VALIDATE' })

      const totalClientes = clientesSnap.docs.length
      const totalOrdenes  = ordenesSnap.docs.length

      if (totalClientes === 0 && totalOrdenes === 0) {
        dispatchExport({
          type: 'ERROR',
          message: 'No hay datos para exportar',
          details: 'No se encontraron clientes ni órdenes asociados a tu cuenta.',
        })
        return
      }

      const data = {
        metadata: {
          exportDate: new Date().toISOString(),
          userId: user.uid, userEmail: user.email,
          appVersion: '1.0.0', totalClientes, totalOrdenes,
        },
        clientes: clientesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        ordenes:  ordenesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      }

      const jsonString = JSON.stringify(data, null, 2)
      const dataSize   = new Blob([jsonString]).size

      if (dataSize > 10 * 1024 * 1024) {
        dispatchExport({
          type: 'ERROR',
          message: 'Los datos son demasiado grandes',
          details: `Tamaño estimado: ${formatFileSize(dataSize)}. Máximo permitido: 10 MB.`,
        })
        return
      }

      const fecha    = new Date()
        .toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })
        .replace(/\//g, '-')
      const fileName = `TecniControl_Backup_${fecha}_${user.email?.split('@')[0] ?? 'usuario'}.json`

      dispatchExport({ type: 'WRITE', isNative })

      const successDetails =
        `Archivo: ${fileName}\n` +
        `${totalClientes} clientes · ${totalOrdenes} órdenes exportados\n` +
        `Tamaño: ${formatFileSize(dataSize)}`

      if (isNative) {
        await downloadOnNative(jsonString, fileName)
        dispatchExport({ type: 'SUCCESS', message: '¡Datos exportados exitosamente!', details: successDetails })
        return
      }

      if ('showSaveFilePicker' in window) {
        try {
          const handle   = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{ description: 'JSON Backup', accept: { 'application/json': ['.json'] } }],
          })
          const writable = await handle.createWritable()
          await writable.write(new Blob([jsonString], { type: 'application/json;charset=utf-8' }))
          await writable.close()
          dispatchExport({
            type: 'SUCCESS', message: '¡Datos exportados exitosamente!',
            details: `Archivo: ${handle.name}\n${totalClientes} clientes · ${totalOrdenes} órdenes\nTamaño: ${formatFileSize(dataSize)}`,
          })
          return
        } catch (err: any) {
          if (err.name === 'AbortError') { dispatchExport({ type: 'CANCELLED' }); return }
        }
      }

      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = fileName
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)

      dispatchExport({
        type: 'SUCCESS', message: '¡Datos exportados exitosamente!',
        details: successDetails + '\nRevisa tu carpeta de descargas.',
      })
    } catch (err: any) {
      let details = 'Ocurrió un error inesperado. Por favor, intenta nuevamente.'
      if (err.name === 'AbortError' || err.message?.includes('tardó'))
        details = 'La conexión es lenta o el servidor no respondió. Intenta de nuevo.'
      else if (err.code === 'permission-denied')
        details = 'Sin permisos para acceder a tus datos. Verifica tu sesión.'
      else if (err.code === 'unavailable')
        details = 'El servicio no está disponible. Intenta más tarde.'
      dispatchExport({ type: 'ERROR', message: 'Error al exportar los datos', details })
    }
  }

  const downloadOnNative = async (jsonString: string, fileName: string) => {
    try {
      const result = await Filesystem.writeFile({
        path: fileName, data: jsonString,
        directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true,
      })
      try {
        await Share.share({ title: 'Backup TecniControl', url: result.uri, dialogTitle: 'Compartir backup' })
      } catch { /* user dismissed — file already saved */ }
    } catch {
      const cache = await Filesystem.writeFile({
        path: fileName, data: jsonString,
        directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true,
      })
      await Share.share({ title: 'Backup TecniControl', url: cache.uri, dialogTitle: 'Guardar backup' })
    }
  }

  // ─── Password reset (email users only) ───────────────────────────────────

  const handlePasswordReset = async () => {
    if (!user?.email) return
    try {
      setResetLoading(true)
      await sendPasswordResetEmail(auth, user.email)
      setResetStatus({
        type: 'success',
        message: `Correo enviado a ${user.email}`,
        details: 'Revisa tu bandeja de entrada (y la carpeta de spam).',
      })
    } catch (err: any) {
      const msg =
        err.code === 'auth/network-request-failed' ? 'Sin conexión. Verifica tu internet.' :
        err.code === 'auth/too-many-requests'       ? 'Demasiados intentos. Espera unos minutos.' :
        'No se pudo enviar el correo. Intenta de nuevo más tarde.'
      setResetStatus({ type: 'error', message: 'Error al enviar el correo', details: msg })
    } finally {
      setResetLoading(false)
    }
  }

  // ─── Re-auth: email/password ──────────────────────────────────────────────

  const reauthWithPassword = async () => {
    if (!user?.email || !reAuthPassword) {
      setReAuthError('Ingresa tu contraseña para continuar.')
      return
    }
    try {
      setReAuthLoading(true)
      setReAuthError('')
      const credential = EmailAuthProvider.credential(user.email, reAuthPassword)
      await reauthenticateWithCredential(user, credential)
      await performDeleteUser()
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential')
        setReAuthError('Contraseña incorrecta. Por favor, verifica e intenta de nuevo.')
      else if (err.code === 'auth/too-many-requests')
        setReAuthError('Demasiados intentos. Espera unos minutos.')
      else if (err.code === 'auth/network-request-failed')
        setReAuthError('Sin conexión. Verifica tu internet.')
      else
        setReAuthError('Error al verificar tu identidad. Intenta de nuevo.')
    } finally {
      setReAuthLoading(false)
    }
  }

  // ─── Re-auth: Google (native Capacitor or web popup) ─────────────────────

  const reauthWithGoogle = async () => {
    try {
      setReAuthLoading(true)
      setReAuthError('')

      let idToken: string

      if (isNative) {
        // ── Android / iOS via @codetrix-studio/capacitor-google-auth ────────
        // GoogleAuth.initialize() must be called once at app startup.
        // See: app.tsx → GoogleAuth.initialize({ clientId, scopes: ['profile','email'] })
        const googleUser = await GoogleAuth.signIn()
        idToken = googleUser.authentication.idToken
      } else {
        // ── Web: popup flow ──────────────────────────────────────────────────
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        const result = await signInWithPopup(auth, provider)
        idToken = await result.user.getIdToken()
      }

      const credential = GoogleAuthProvider.credential(idToken)

      try {
        await reauthenticateWithCredential(user!, credential)
      } catch (inner: any) {
        // Firebase token may be stale even though Google re-auth succeeded.
        // Retry once — Firebase should have refreshed the session by now.
        if (
          inner.code === 'auth/user-token-expired' ||
          inner.code === 'auth/invalid-credential'
        ) {
          await reauthenticateWithCredential(user!, credential)
        } else {
          throw inner
        }
      }

      await performDeleteUser()
    } catch (err: any) {
      // Detect user-cancelled flows across platforms
      const cancelled =
        err.code === 'ERR_CANCELED' ||
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.message?.toLowerCase().includes('cancel') ||
        err.message?.toLowerCase().includes('closed')

      if (cancelled) {
        // Not an error — user simply closed the picker
        setReAuthError('')
        return
      }

      if (err.code === 'auth/network-request-failed')
        setReAuthError('Sin conexión. Verifica tu internet e intenta de nuevo.')
      else if (err.code === 'auth/too-many-requests')
        setReAuthError('Demasiados intentos. Espera unos minutos.')
      else
        setReAuthError('No se pudo verificar con Google. Intenta de nuevo.')
    } finally {
      setReAuthLoading(false)
    }
  }

  // ─── Delete (called only after re-auth succeeds) ──────────────────────────

  const performDeleteUser = async () => {
    if (!user) return
    try {
      setDeleteState(s => ({ ...s, loading: true, error: '' }))
      await deleteUser(user)
      // AuthProvider's onAuthStateChanged listener handles the post-deletion redirect
    } catch (err: any) {
      let error = 'Hubo un error al eliminar la cuenta. Intenta de nuevo más tarde.'
      if (err.code === 'auth/requires-recent-login')
        error = 'Sesión expirada. Cierra sesión, vuelve a ingresar e intenta de nuevo.'
      else if (err.code === 'auth/network-request-failed')
        error = 'Error de conexión. Verifica tu internet.'
      setDeleteState(s => ({ ...s, loading: false, error }))
    }
  }

  const isExporting = ['fetching', 'validating', 'writing'].includes(exportState.step)

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Account info ─────────────────────────────────────────────────── */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-xl">
            <User className="w-5 h-5 text-blue-400" />
            Mi Cuenta
          </CardTitle>
          <CardDescription className="text-gray-400">
            Información de tu cuenta de acceso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Avatar + identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/30
                            border-2 border-blue-500/30 flex items-center justify-center
                            text-blue-300 font-semibold text-lg select-none shrink-0">
              {getUserInitials(user?.displayName, user?.email)}
            </div>
            <div className="min-w-0">
              {user?.displayName && (
                <p className="text-white font-medium truncate">{user.displayName}</p>
              )}
              <p className="text-gray-400 text-sm truncate flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {user?.email}
              </p>
              {/* Provider badge */}
              <span className={`inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full
                               text-xs font-medium border
                               ${isGoogleUser
                                 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                 : 'bg-gray-700/60 text-gray-400 border-gray-600/40'}`}>
                {isGoogleUser
                  ? <><GoogleIcon className="w-3 h-3" />Google</>
                  : <><KeyRound className="w-3 h-3" />Email y contraseña</>}
              </span>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                {/* cerrar sesion */}
        <Button
          variant="outline"
          onClick={logout}
          className="border-blue-600/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20
                     hover:text-blue-300 shrink-0"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar sesión
        </Button>
          {/* Password section — adapts to auth provider */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-300 font-medium flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-gray-400" />
                Contraseña
              </p>
              {isGoogleUser ? (
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Tu cuenta usa Google para autenticarse — no tienes contraseña en TecniControl.
                  Gestiona tu seguridad directamente desde Google.
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Te enviaremos un enlace de restablecimiento a tu correo
                </p>
              )}
            </div>

            {isGoogleUser ? (
              <a
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                           border border-gray-600/40 bg-gray-700/30 text-gray-300 text-sm
                           hover:bg-gray-700/60 hover:text-white transition-colors
                           min-w-[200px] shrink-0"
              >
                <GoogleIcon />
                Gestionar en Google
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            ) : (
              <Button
                variant="outline"
                onClick={handlePasswordReset}
                disabled={resetLoading}
                className="border-blue-600/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20
                           hover:text-blue-300 min-w-[200px] shrink-0"
              >
                {resetLoading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando correo...</>
                  : <><KeyRound className="w-4 h-4 mr-2" />Restablecer contraseña</>}
              </Button>
            )}
          </div>

          {resetStatus.type && <StatusBanner status={resetStatus} />}
        </CardContent>
      </Card>

      {/* ── Export ───────────────────────────────────────────────────────── */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-xl">
            <Download className="w-5 h-5 text-green-400" />
            Tus Datos
          </CardTitle>
          <CardDescription className="text-gray-400">
            Descarga una copia de seguridad de todos tus clientes y órdenes de servicio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exportState.status.type && <StatusBanner status={exportState.status} />}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-300 font-medium">Exportar información</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                Obtendrás un archivo JSON con clientes y todo el historial de mantenimientos.
              </p>
              <p className="text-xs mt-1.5">
                {isNative ? (
                  <span className="text-blue-400 flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />El archivo se guardará en tu dispositivo
                  </span>
                ) : (
                  <span className="text-gray-400 flex items-center gap-1">
                    <FolderOpen className="w-3 h-3" />El archivo se descargará en tu carpeta de descargas
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={isExporting}
              className="border-green-600/30 text-green-400 bg-green-500/10 hover:bg-green-500/20
                         hover:text-green-300 min-w-[180px] shrink-0"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {exportState.step === 'fetching'  ? 'Obteniendo datos...'   :
                   exportState.step === 'validating' ? 'Validando...'          : 'Guardando archivo...'}
                </>
              ) : (
                <><FileJson className="w-4 h-4 mr-2" />Descargar JSON</>
              )}
            </Button>
          </div>

          {/* Honest indeterminate sweep bar */}
          {isExporting && (
            <div className="space-y-1.5">
              <div className="w-full bg-gray-700/60 rounded-full h-1 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full"
                     style={{ animation: 'sweep 1.4s ease-in-out infinite', width: '40%' }} />
              </div>
              <p className="text-xs text-gray-500">
                {exportState.step === 'fetching'   && 'Conectando con la base de datos…'}
                {exportState.step === 'validating' && 'Verificando integridad de los datos…'}
                {exportState.step === 'writing'    && 'Generando archivo de exportación…'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Danger zone (accordion) ───────────────────────────────────────── */}
      <Card className="bg-red-900/10 border-red-500/20">
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setDangerOpen(o => !o)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-red-400 flex items-center gap-2 text-xl">
                <AlertTriangle className="w-5 h-5" />
                Zona de Peligro
              </CardTitle>
              <CardDescription className="text-gray-400">
                Acciones irreversibles sobre tu cuenta
              </CardDescription>
            </div>
            <ChevronDown className={`w-5 h-5 text-red-400/70 transition-transform duration-200
                                     ${dangerOpen ? 'rotate-180' : ''}`} />
          </div>
        </CardHeader>

        {dangerOpen && (
          <CardContent className="space-y-4">
            {deleteState.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg
                              text-red-400 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p>{deleteState.error}</p>
                  {deleteState.error.includes('Cierra sesión') && (
                    <Button
                      variant="link"
                      className="text-red-400 hover:text-red-300 p-0 h-auto mt-1 text-xs"
                      onClick={() => logout()}
                    >
                      Cerrar sesión ahora
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-300 font-medium">Eliminar cuenta</p>
                <p className="text-xs text-gray-500 mt-1 max-w-md">
                  Esta acción no se puede deshacer. Se borrará tu acceso y todos los datos permanentemente.
                </p>
                <p className="text-xs text-yellow-400/80 mt-1">
                  Te recomendamos exportar tus datos antes de continuar.
                </p>
              </div>

              <AlertDialog
                open={deleteState.dialogOpen}
                onOpenChange={open => {
                  setDeleteState(s => ({ ...s, dialogOpen: open }))
                  if (!open) resetDialogState()
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="min-w-[180px] shrink-0"
                    disabled={deleteState.loading}
                    onClick={() => setDeleteState(s => ({ ...s, dialogOpen: true }))}
                  >
                    {deleteState.loading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Eliminando...</>
                      : <><Trash2 className="w-4 h-4 mr-2" />Eliminar cuenta</>}
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent className="bg-gray-900 border-gray-700 max-w-md w-[calc(100vw-2rem)]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-red-400" />
                      Confirma tu identidad
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-2 text-gray-400 text-sm">
                        <p>
                          {isGoogleUser
                            ? 'Para continuar, deberás autenticarte con Google nuevamente.'
                            : <>Ingresa tu contraseña para eliminar la cuenta de{' '}
                                <span className="text-white font-medium">{user?.email}</span>.</>}
                        </p>
                        <p className="text-yellow-400/80 text-xs">
                          Esta acción es permanente y no se puede deshacer.
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  {/* ── Re-auth body — branches on provider ── */}
                  <div className="py-2 space-y-3">
                    {isGoogleUser ? (
                      // Google: single button triggers the native/popup flow
                      <Button
                        variant="outline"
                        className="w-full border-gray-600 bg-gray-800 text-white
                                   hover:bg-gray-700 gap-2 justify-center"
                        onClick={reauthWithGoogle}
                        disabled={reAuthLoading || deleteState.loading}
                      >
                        {reAuthLoading || deleteState.loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {deleteState.loading ? 'Eliminando cuenta...' : 'Verificando con Google...'}
                          </>
                        ) : (
                          <><GoogleIcon />Continuar con Google</>
                        )}
                      </Button>
                    ) : (
                      // Email/password: text input
                      <div className="space-y-2">
                        <Label htmlFor="reauth-password" className="text-gray-300 text-sm">
                          Contraseña actual
                        </Label>
                        <div className="relative">
                          <Input
                            id="reauth-password"
                            type={showPassword ? 'text' : 'password'}
                            value={reAuthPassword}
                            onChange={e => { setReAuthPassword(e.target.value); setReAuthError('') }}
                            onKeyDown={e => e.key === 'Enter' && reauthWithPassword()}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="bg-gray-800 border-gray-600 text-white pr-10
                                       focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                                       hover:text-gray-200 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Shared inline error */}
                    {reAuthError && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        {reAuthError}
                      </p>
                    )}
                  </div>

                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel
                      className="bg-gray-800 text-white hover:bg-gray-700 border-gray-600 w-full sm:w-auto"
                      disabled={reAuthLoading || deleteState.loading}
                    >
                      Cancelar
                    </AlertDialogCancel>

                    {/* Confirm button — only for email/password.
                        Google users confirm via the Google button above. */}
                    {!isGoogleUser && (
                      <Button
                        variant="destructive"
                        className="w-full sm:w-auto"
                        onClick={reauthWithPassword}
                        disabled={reAuthLoading || deleteState.loading || !reAuthPassword}
                      >
                        {reAuthLoading || deleteState.loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {deleteState.loading ? 'Eliminando...' : 'Verificando...'}
                          </>
                        ) : (
                          <><Trash2 className="w-4 h-4 mr-2" />Sí, eliminar cuenta</>
                        )}
                      </Button>
                    )}
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        )}
      </Card>

      <style>{`
        @keyframes sweep {
          0%   { transform: translateX(-150%); width: 40%; }
          50%  { width: 55%; }
          100% { transform: translateX(350%); width: 40%; }
        }
      `}</style>
    </div>
  )
}