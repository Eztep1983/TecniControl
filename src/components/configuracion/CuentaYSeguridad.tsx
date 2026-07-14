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
  reauthenticateWithRedirect,
  getRedirectResult,
  EmailAuthProvider,
  GoogleAuthProvider,
  updatePassword,
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
import * as XLSX from 'xlsx'

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

function isCancelableError(error: any): boolean {
  if (!error) return true
  const message = typeof error === 'string' ? error : error?.message
  const name = error?.name
  const code = error?.code

  return (
    name === 'AbortError' ||
    /cancel|cancelado|canceled|dismissed|denied/i.test(String(message || '')) ||
    code === 'USER_CANCELLED' ||
    code === 'ECANCELED' ||
    code === 'EUSERCANCELLED' ||
    (typeof error === 'object' && Object.keys(error).length === 0)
  )
}

function parseDateSafely(val: any): string {
  if (!val) return ''
  try {
    if (typeof val.toDate === 'function') {
      return val.toDate().toLocaleDateString('es-CO')
    }
    const d = new Date(val)
    if (!isNaN(d.getTime())) return d.toLocaleDateString('es-CO')
  } catch (e) {}
  return ''
}

function formatClientesForExcel(clientes: any[]) {
  return clientes.map(c => ({
    'Nombre del Cliente': c.name || '',
    'Cédula / Documento': c.cedula || '',
    'Correo Electrónico': c.email || '',
    'Teléfono': c.phone || '',
    'Dirección': c.address || '',
    'Fecha de Registro': parseDateSafely(c.createdAt),
  }))
}

function formatOrdenesForExcel(ordenes: any[]) {
  return ordenes.map(o => {
    let repuestos = ''
    if (Array.isArray(o.piezasUsadas) && o.piezasUsadas.length > 0) {
      repuestos = o.piezasUsadas.map((p: any) => `${p.pieza} (${p.cantidad})`).join(', ')
    }
    
    let tareas = ''
    if (Array.isArray(o.tareasRealizadas) && o.tareasRealizadas.length > 0) {
      tareas = o.tareasRealizadas.join(', ')
    }
    
    return {
      'Nro Orden': o.idPersonalizado || '',
      'Tipo de Mantenimiento': o.tipoMantenimiento || '',
      'Nombre del Cliente': o.cliente?.name || '',
      'Cédula Cliente': o.cliente?.cedula || '',
      'Equipo': `${o.dispositivo?.tipo || ''} ${o.dispositivo?.marca || ''} ${o.dispositivo?.modelo || ''}`.trim(),
      'Falla / Observaciones': o.observacionesIniciales || '',
      'Pruebas Realizadas': o.pruebasRealizadas || '',
      'Diagnóstico': o.diagnosticoFinal || '',
      'Repuestos Utilizados': repuestos,
      'Tareas Realizadas': tareas,
      'Garantía': o.garantiaHabilitada ? (o.garantiaDescripcion || 'Habilitada') : 'Sin Garantía',
      'Estado Firma': o.firmaCliente ? 'Firmado' : 'Pendiente',
      'Nombre Receptor': o.nombreReceptor || '',
      'Cédula Receptor': o.cedulaReceptor || '',
      'Fecha Ingreso': parseDateSafely(o.fechaCreacion || o.createdAt),
    }
  })
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
    success: 'bg-green-500/10 border-green-500/30 dark:text-green-400 text-green-700',
    error:   'bg-red-500/10 border-red-500/30 dark:text-red-400 text-red-700',
    info:    'bg-blue-500/10 border-blue-500/30 dark:text-blue-400 text-blue-700',
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
            <div className="mt-2 p-3 dark:bg-slate-900/70 bg-gray-100 rounded-3xl border dark:border-white/10 border-gray-300/50">
              <pre className="text-xs dark:text-slate-300 dark:text-slate-300 text-slate-700 whitespace-pre-wrap font-mono break-words">
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

  // Password change (email/password users only)
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changePasswordLoading, setChangePasswordLoading] = useState(false)
  const [changePasswordStatus, setChangePasswordStatus] = useState<InlineStatus>({ type: null, message: '' })

  // Danger zone accordion
  const [dangerOpen, setDangerOpen] = useState(false)

  // Logout confirmation dialog
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  // Platform detection
  const [isNative, setIsNative] = useState(false)
  useEffect(() => { setIsNative(Capacitor.isNativePlatform()) }, [])

  // ─── Captura resultado del redirect de Google (web/desktop) ──────────────
  // Cuando el usuario vuelve de la página de Google tras reauthenticateWithRedirect,
  // getRedirectResult() entrega la credencial y se procede a borrar la cuenta.
  useEffect(() => {
    let active = true;
    const handleRedirectResult = async () => {
      const intent = sessionStorage.getItem('reauth_intent')
      if (intent !== 'delete_account') return

      try {
        setDeleteState(s => ({ ...s, dialogOpen: true, loading: true }))
        const result = await getRedirectResult(auth)

        if (!active) return;
        
        // Siempre limpiar la intención una vez que hemos procesado (o intentado) el resultado
        sessionStorage.removeItem('reauth_intent')

        if (!result) {
          // El usuario canceló o volvió sin completar la autenticación
          setDeleteState(s => ({ ...s, loading: false }))
          return
        }

        const oauthCredential = GoogleAuthProvider.credentialFromResult(result)
        if (!oauthCredential) throw new Error('No se pudo obtener credencial de Google.')

        await reauthenticateWithCredential(result.user, oauthCredential)
        await performDeleteUser()
      } catch (err: any) {
        if (!active) return;
        sessionStorage.removeItem('reauth_intent')
        const cancelled =
          err.code === 'auth/popup-closed-by-user' ||
          err.code === 'auth/cancelled-popup-request' ||
          err.message?.toLowerCase().includes('cancel')

        if (!cancelled) {
          setDeleteState(s => ({
            ...s,
            loading: false,
            error: 'No se pudo verificar con Google. Intenta de nuevo.',
          }))
        } else {
          setDeleteState(s => ({ ...s, loading: false }))
        }
      }
    }

    handleRedirectResult()
    return () => { active = false; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Auto-clear change password status after 6 s
  useEffect(() => {
    if (changePasswordStatus.type === 'success') {
      const t = setTimeout(() => setChangePasswordStatus({ type: null, message: '' }), 6000)
      return () => clearTimeout(t)
    }
  }, [changePasswordStatus.type])

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

      const clientesData = clientesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const ordenesData  = ordenesSnap.docs.map(d => ({ id: d.id, ...d.data() }))

      const clientesFormatted = formatClientesForExcel(clientesData)
      const ordenesFormatted = formatOrdenesForExcel(ordenesData)

      const wb = XLSX.utils.book_new()
      
      const wsClientes = XLSX.utils.json_to_sheet(clientesFormatted)
      XLSX.utils.book_append_sheet(wb, wsClientes, "Clientes")
      
      const wsOrdenes = XLSX.utils.json_to_sheet(ordenesFormatted)
      XLSX.utils.book_append_sheet(wb, wsOrdenes, "Órdenes")

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const dataSize = excelBuffer.byteLength

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
      const fileName = `TecniControl_Backup_${fecha}_${user.email?.split('@')[0] ?? 'usuario'}.xlsx`

      dispatchExport({ type: 'WRITE', isNative })

      const successDetails =
        `Archivo: ${fileName}\n` +
        `${totalClientes} clientes · ${totalOrdenes} órdenes exportados\n` +
        `Tamaño: ${formatFileSize(dataSize)}`

      if (isNative) {
        const excelBase64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
        await downloadOnNativeExcel(excelBase64, fileName)
        dispatchExport({ type: 'SUCCESS', message: '¡Datos exportados exitosamente!', details: successDetails })
        return
      }

      if ('showSaveFilePicker' in window) {
        try {
          const handle   = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{ description: 'Excel Backup', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }],
          })
          const writable = await handle.createWritable()
          await writable.write(new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
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

      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
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
      console.error('Error exportando datos:', err)
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

  const downloadOnNativeExcel = async (base64Data: string, fileName: string) => {
    try {
      const result = await Filesystem.writeFile({
        path: fileName, data: base64Data,
        directory: Directory.Documents, recursive: true,
      })

      try {
        await Share.share({ title: 'Backup TecniControl', url: result.uri, dialogTitle: 'Compartir backup' })
      } catch (shareError: any) {
        if (isCancelableError(shareError)) return
        throw shareError
      }
    } catch (error: any) {
      const cache = await Filesystem.writeFile({
        path: fileName, data: base64Data,
        directory: Directory.Cache, recursive: true,
      })

      try {
        await Share.share({ title: 'Backup TecniControl', url: cache.uri, dialogTitle: 'Guardar backup' })
      } catch (shareError: any) {
        if (isCancelableError(shareError)) return
        throw shareError
      }
    }
  }

  // ─── Password reset (email users only) ───────────────────────────────────

  const handlePasswordReset = async () => {
    if (!user?.email) return
    try {
      setResetLoading(true)
      setResetStatus({ type: 'info', message: 'Enviando correo de restablecimiento...' })
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

  // ─── Password change (email users only) ───────────────────────────────────

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !user.email) return

    if (newPassword.length < 6) {
      setChangePasswordStatus({
        type: 'error',
        message: 'La nueva contraseña debe tener al menos 6 caracteres.',
      })
      return
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordStatus({
        type: 'error',
        message: 'Las contraseñas nuevas no coinciden.',
      })
      return
    }

    try {
      setChangePasswordLoading(true)
      setChangePasswordStatus({ type: 'info', message: 'Verificando contraseña actual...' })

      // 1. Reautenticar al usuario
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // 2. Actualizar contraseña
      setChangePasswordStatus({ type: 'info', message: 'Actualizando contraseña...' })
      await updatePassword(user, newPassword)

      setChangePasswordStatus({
        type: 'success',
        message: 'Contraseña actualizada correctamente.',
        details: 'Tu contraseña de acceso ha sido cambiada.',
      })

      // Limpiar campos
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setTimeout(() => setShowChangePasswordForm(false), 3000)
    } catch (err: any) {
      console.error('Error changing password:', err)
      let msg = 'No se pudo cambiar la contraseña. Intenta de nuevo.'
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Contraseña actual incorrecta. Verifica tu contraseña.'
      } else if (err.code === 'auth/weak-password') {
        msg = 'La nueva contraseña es demasiado débil. Usa al menos 6 caracteres.'
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Demasiados intentos fallidos. Espera unos minutos.'
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Sin conexión. Verifica tu internet.'
      }
      setChangePasswordStatus({ type: 'error', message: 'Error al cambiar contraseña', details: msg })
    } finally {
      setChangePasswordLoading(false)
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

  // ─── Re-auth: Google (native Capacitor o web redirect) ───────────────────

  const reauthWithGoogle = async () => {
    try {
      setReAuthLoading(true)
      setReAuthError('')

      if (isNative) {
        // ── Android / iOS: plugin nativo de Firebase para Capacitor ─────────
        // Usa el selector de cuentas nativo del SO, sin webview ni popup.
        // Requiere: npm install @capacitor-firebase/authentication
        // y configurar el plugin en capacitor.config.ts con el clientId de Android.
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
        const result = await FirebaseAuthentication.signInWithGoogle()

        const credential = GoogleAuthProvider.credential(
          result.credential?.idToken,
          result.credential?.accessToken,
        )

        await reauthenticateWithCredential(user!, credential)
        await performDeleteUser()
      } else {
        // ── Web / desktop: redirect a Google, sin popup ──────────────────────
        // Guardamos la intención antes de salir de la página; el useEffect de
        // arriba la lee cuando el usuario vuelve y completa la eliminación.
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        sessionStorage.setItem('reauth_intent', 'delete_account')
        await reauthenticateWithRedirect(user!, provider)
        // La página hace redirect → la ejecución no continúa aquí.
      }
    } catch (err: any) {
      // En nativo: detectar cancelación del selector de cuentas
      const cancelled =
        err.code === 'ERR_CANCELED' ||
        err.message?.toLowerCase().includes('cancel') ||
        err.message?.toLowerCase().includes('closed')

      if (cancelled) {
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
      <Card className="dark:bg-slate-950/70 bg-white border dark:border-white/10 border-gray-300/50 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.8)] rounded-[28px]">
        <CardHeader className="border-b dark:border-white/10 border-gray-300/50 pb-4 mb-2">
          <CardTitle className="dark:text-white text-gray-900 flex items-center gap-2 text-xl">
            <User className="w-5 h-5 text-sky-400" />
            Mi Cuenta
          </CardTitle>
          <CardDescription className="dark:text-slate-400 dark:text-slate-400 text-slate-600">
            Información de tu cuenta de acceso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Avatar + identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/30
                            border-2 border-blue-500/30 flex items-center justify-center
                            dark:text-blue-300 text-blue-700 font-semibold text-lg select-none shrink-0">
              {getUserInitials(user?.displayName, user?.email)}
            </div>
            <div className="min-w-0">
              {user?.displayName && (
                <p className="dark:text-white text-gray-900 font-medium truncate">{user.displayName}</p>
              )}
              <p className="dark:text-slate-400 dark:text-slate-400 text-slate-600 text-sm truncate flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {user?.email}
              </p>
              {/* Provider badge */}
              <span className={`inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full
                               text-xs font-medium border
                               ${isGoogleUser
                                 ? 'bg-blue-500/10 dark:text-blue-400 text-blue-700 border-blue-500/20'
                                 : 'dark:bg-slate-800/70 bg-gray-200 dark:text-slate-300 dark:text-slate-300 text-slate-700 border dark:border-white/10 border-gray-300/50'}`}>
                {isGoogleUser
                  ? <><GoogleIcon className="w-3 h-3" />Google</>
                  : <><KeyRound className="w-3 h-3" />Email y contraseña</>}
              </span>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

          {/* Cerrar sesión */}
          <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setLogoutDialogOpen(true)}
                className="border-blue-600/30 dark:text-blue-400 text-blue-700 bg-blue-500/10 hover:bg-blue-500/20
                           hover:dark:text-blue-300 hover:text-blue-700 shrink-0"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="dark:bg-slate-950/95 bg-white border dark:border-white/10 border-gray-300/50 max-w-sm rounded-[32px] shadow-[0_24px_80px_-36px_rgba(15,23,42,0.75)]">
              <AlertDialogHeader>
                <AlertDialogTitle className="dark:text-white text-gray-900">
                  Confirmar cierre de sesión
                </AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro que deseas cerrar la sesión? Si hay datos locales sin sincronizar, podrían perderse.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="w-full sm:w-auto">
                  Cancelar
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setLogoutDialogOpen(false)
                    logout()
                  }}
                >
                  Cerrar sesión
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Password section — adapts to auth provider */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm dark:text-slate-300 dark:text-slate-300 text-slate-700 font-medium flex items-center gap-2">
                <KeyRound className="w-4 h-4 dark:text-slate-400 dark:text-slate-400 text-slate-600" />
                Contraseña
              </p>
              {isGoogleUser ? (
                <p className="text-xs dark:text-slate-400 dark:text-slate-400 text-slate-600 mt-1 max-w-xs">
                  Tu cuenta usa Google para autenticarse enTecniControl.
                  Gestiona tu seguridad directamente desde Google.
                </p>
              ) : (
                <p className="text-xs dark:text-slate-400 dark:text-slate-400 text-slate-600 mt-1">
                  Cambia tu contraseña directamente o solicita un correo de restablecimiento.
                </p>
              )}
            </div>

            {isGoogleUser ? (
              <a
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                           border dark:border-white/10 border-gray-300/50 dark:bg-slate-900/70 bg-gray-100 dark:text-slate-200 dark:text-slate-200 text-slate-800 text-sm
                           hover:dark:bg-slate-900/90 hover:bg-gray-50 hover:dark:text-white hover:text-gray-900 transition-colors
                           min-w-[200px] shrink-0"
              >
                <GoogleIcon />
                Gestionar en Google
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setShowChangePasswordForm(v => !v)}
                  className="border-blue-600/30 dark:text-blue-400 text-blue-700 bg-blue-500/10 hover:bg-blue-500/20
                             hover:dark:text-blue-300 hover:text-blue-700 min-w-[150px]"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  {showChangePasswordForm ? 'Ocultar formulario' : 'Cambiar contraseña'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePasswordReset}
                  disabled={resetLoading}
                  className="border-blue-600/30 dark:text-blue-400 text-blue-700 bg-blue-500/10 hover:bg-blue-500/20
                             hover:dark:text-blue-300 hover:text-blue-700 min-w-[170px]"
                >
                  {resetLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                  ) : (
                    <><Mail className="w-4 h-4 mr-2" />Restablecer por correo</>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Collapsible Direct Password Change Form */}
          {!isGoogleUser && showChangePasswordForm && (
            <form onSubmit={handleChangePassword} className="mt-4 p-4 rounded-3xl border dark:border-white/10 border-gray-300/50 dark:bg-slate-950/70 bg-white space-y-4 shadow-lg shadow-slate-950/20 animate-in fade-in duration-200">
              <p className="text-xs font-semibold uppercase dark:text-blue-400 text-blue-700 tracking-wider">Cambiar contraseña directamente</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="current-password-field" className="dark:text-slate-300 dark:text-slate-300 text-slate-700 text-xs">Contraseña actual</Label>
                  <Input
                    id="current-password-field"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    className="dark:bg-slate-900/90 bg-gray-50 border dark:border-white/10 border-gray-300/50 dark:text-white text-gray-900 focus:border-sky-500 focus:ring-sky-500 h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-password-field" className="dark:text-slate-300 dark:text-slate-300 text-slate-700 text-xs">Nueva contraseña</Label>
                  <Input
                    id="new-password-field"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    className="dark:bg-slate-900/90 bg-gray-50 border dark:border-white/10 border-gray-300/50 dark:text-white text-gray-900 focus:border-sky-500 focus:ring-sky-500 h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-new-password-field" className="dark:text-slate-300 dark:text-slate-300 text-slate-700 text-xs">Confirmar nueva contraseña</Label>
                  <Input
                    id="confirm-new-password-field"
                    type="password"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    required
                    className="dark:bg-slate-900/90 bg-gray-50 border dark:border-white/10 border-gray-300/50 dark:text-white text-gray-900 focus:border-sky-500 focus:ring-sky-500 h-9 text-sm"
                  />
                </div>
              </div>

              {changePasswordStatus.type && <StatusBanner status={changePasswordStatus} />}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowChangePasswordForm(false)
                    setChangePasswordStatus({ type: null, message: '' })
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmNewPassword('')
                  }}
                  className="dark:text-slate-400 dark:text-slate-400 text-slate-600 hover:dark:text-white hover:text-gray-900 hover:dark:bg-slate-900 hover:bg-gray-100 h-9 text-sm"
                  disabled={changePasswordLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={changePasswordLoading || !currentPassword || !newPassword || !confirmNewPassword}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 text-sm px-4"
                >
                  {changePasswordLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Actualizando...</>
                  ) : (
                    'Actualizar contraseña'
                  )}
                </Button>
              </div>
            </form>
          )}

          {resetStatus.type && <StatusBanner status={resetStatus} />}
        </CardContent>
      </Card>

      {/* ── Export ───────────────────────────────────────────────────────── */}
      <Card className="dark:bg-slate-950/70 bg-white border dark:border-white/10 border-gray-300/50 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.8)] rounded-[28px]">
        <CardHeader className="border-b dark:border-white/10 border-gray-300/50 pb-4 mb-2">
          <CardTitle className="dark:text-white text-gray-900 flex items-center gap-2 text-xl">
            <Download className="w-5 h-5 dark:text-emerald-400 text-emerald-700" />
            Tus Datos
          </CardTitle>
          <CardDescription className="dark:text-slate-400 dark:text-slate-400 text-slate-600">
            Descarga una copia de seguridad de todos tus clientes y órdenes de servicio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exportState.status.type && <StatusBanner status={exportState.status} />}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm dark:text-slate-300 dark:text-slate-300 text-slate-700 font-medium">Exportar información</p>
              <p className="text-xs dark:text-slate-400 dark:text-slate-400 text-slate-600 mt-1 max-w-md">
                Obtendrás un archivo XLSX con clientes y todo el historial de mantenimientos.
              </p>
              <p className="text-xs mt-1.5">
                {isNative ? (
                  <span className="text-sky-400 flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />El archivo se guardará en tu dispositivo
                  </span>
                ) : (
                  <span className="dark:text-slate-400 dark:text-slate-400 text-slate-600 flex items-center gap-1">
                    <FolderOpen className="w-3 h-3" />El archivo se descargará en tu carpeta de descargas
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={isExporting}
              className="border-emerald-500/20 dark:text-emerald-300 text-emerald-700 dark:bg-slate-900/70 bg-gray-100 hover:dark:bg-slate-900/90 hover:bg-gray-50
                         hover:dark:text-emerald-200 hover:text-emerald-800 min-w-[180px] shrink-0 shadow-sm shadow-emerald-500/10"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {exportState.step === 'fetching'  ? 'Obteniendo datos...'   :
                   exportState.step === 'validating' ? 'Validando...'          : 'Guardando archivo...'}
                </>
              ) : (
                <><FileJson className="w-4 h-4 mr-2" />Descargar XLSX</>
              )}
            </Button>
          </div>

          {/* Honest indeterminate sweep bar */}
          {isExporting && (
            <div className="space-y-1.5">
              <div className="w-full dark:bg-slate-900/70 bg-gray-100 rounded-full h-1 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full"
                     style={{ animation: 'sweep 1.4s ease-in-out infinite', width: '40%' }} />
              </div>
              <p className="text-xs dark:text-slate-400 dark:text-slate-400 text-slate-600">
                {exportState.step === 'fetching'   && 'Conectando con la base de datos…'}
                {exportState.step === 'validating' && 'Verificando integridad de los datos…'}
                {exportState.step === 'writing'    && 'Generando archivo de exportación…'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Documentos Legales ───────────────────────────────────────── */}
      <Card className="dark:bg-slate-950/70 bg-white border dark:border-white/10 border-gray-300/50 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.8)] rounded-[28px]">
        <CardHeader className="border-b dark:border-white/10 border-gray-300/50 pb-4 mb-2">
          <CardTitle className="dark:text-white text-gray-900 flex items-center gap-2 text-xl">
            <ShieldCheck className="w-5 h-5 dark:text-blue-400 text-blue-700" />
            Acuerdos Legales
          </CardTitle>
          <CardDescription className="dark:text-slate-400 dark:text-slate-400 text-slate-600">
            Consulta nuestros términos de uso y cómo protegemos tu información.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <a
            href="/legal/politica-privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl dark:bg-slate-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 hover:dark:bg-slate-800 hover:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg dark:bg-blue-500/10 bg-blue-100 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 dark:text-blue-400 text-blue-700" />
              </div>
              <div>
                <p className="font-medium dark:text-white text-gray-900">Política de Privacidad</p>
                <p className="text-sm dark:text-gray-400 text-gray-600">Cómo recopilamos y usamos tus datos</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 dark:text-gray-500 text-gray-400 group-hover:dark:text-white group-hover:text-gray-900 transition-colors" />
          </a>

          <a
            href="/legal/terminos-servicio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl dark:bg-slate-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 hover:dark:bg-slate-800 hover:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg dark:bg-emerald-500/10 bg-emerald-100 flex items-center justify-center">
                <FileJson className="w-5 h-5 dark:text-emerald-400 text-emerald-700" />
              </div>
              <div>
                <p className="font-medium dark:text-white text-gray-900">Términos de Servicio</p>
                <p className="text-sm dark:text-gray-400 text-gray-600">Reglas y lineamientos de uso</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 dark:text-gray-500 text-gray-400 group-hover:dark:text-white group-hover:text-gray-900 transition-colors" />
          </a>
        </CardContent>
      </Card>

      {/* ── Danger zone (accordion) ───────────────────────────────────────── */}
      <Card className="dark:bg-gray-900/50 bg-gray-50 border-gray-500/20">
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setDangerOpen(o => !o)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="dark:text-gray-400 text-gray-600 flex items-center gap-2 text-xl">
                <AlertTriangle className="w-5 h-5" />
                Zona de Peligro
              </CardTitle>
              <CardDescription className="dark:text-slate-400 dark:text-slate-400 text-slate-600">
                Acciones irreversibles sobre tu cuenta
              </CardDescription>
            </div>
            <ChevronDown className={`w-5 h-5 dark:text-gray-400 text-gray-600/70 transition-transform duration-200
                                     ${dangerOpen ? 'rotate-180' : ''}`} />
          </div>
        </CardHeader>

        {dangerOpen && (
          <CardContent className="space-y-4">
            {deleteState.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg
                              dark:text-red-400 text-red-700 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p>{deleteState.error}</p>
                  {deleteState.error.includes('Cierra sesión') && (
                    <Button
                      variant="link"
                      className="dark:text-red-400 text-red-700 hover:dark:text-red-300 hover:text-red-700 p-0 h-auto mt-1 text-xs"
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
                <p className="text-sm dark:text-slate-300 dark:text-slate-300 text-slate-700 font-medium">Eliminar cuenta</p>
                <p className="text-xs dark:text-slate-400 dark:text-slate-400 text-slate-600 mt-1 max-w-md">
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
                    className="min-w-[180px] shrink-0 rouded-lg border-red-500/30 bg-red-500/10 hover:bg-red-500/20"
                    disabled={deleteState.loading}
                    onClick={() => setDeleteState(s => ({ ...s, dialogOpen: true }))}
                  >
                    {deleteState.loading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Eliminando...</>
                      : <><Trash2 className="w-4 h-4 mr-2" />Eliminar cuenta</>}
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent className="dark:bg-slate-950/95 bg-white border dark:border-white/10 border-gray-300/50 max-w-md w-[calc(100vw-2rem)] rounded-[28px] shadow-[0_24px_80px_-36px_rgba(15,23,42,0.75)]">
                  <AlertDialogHeader className="flex flex-col items-center text-center">
                    <AlertDialogTitle className="dark:text-white text-gray-900 flex items-center justify-center gap-2">
                      <ShieldCheck className="w-5 h-5 dark:text-red-400 text-red-700" />
                      Confirma tu identidad
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-2 dark:text-slate-400 dark:text-slate-400 text-slate-600 text-sm flex flex-col items-center">
                        <p>
                          {isGoogleUser
                            ? 'Para continuar, deberás autenticarte con Google nuevamente.'
                            : <>Ingresa tu contraseña para eliminar la cuenta de{' '}
                                <span className="dark:text-white text-gray-900 font-medium">{user?.email}</span>.</>}
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
                        className="w-full dark:border-white/10 border-gray-300/50 dark:bg-slate-900/80 bg-gray-50 dark:text-white text-gray-900
                                   hover:dark:bg-slate-900/95 hover:bg-gray-50 gap-2 justify-center"
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
                        <Label htmlFor="reauth-password" className="dark:text-slate-300 dark:text-slate-300 text-slate-700 text-sm">
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
                            className="dark:bg-slate-900/90 bg-gray-50 border dark:border-white/10 border-gray-300/50 dark:text-white text-gray-900 pr-10
                                       focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-slate-400 dark:text-slate-400 text-slate-600
                                       hover:dark:text-slate-200 dark:text-slate-200 text-slate-800 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Shared inline error */}
                    {reAuthError && (
                      <p className="dark:text-red-400 text-red-700 text-xs flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        {reAuthError}
                      </p>
                    )}
                  </div>

                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel
                      className="dark:bg-slate-900/90 bg-gray-50 dark:text-white text-gray-900 hover:dark:bg-slate-900 hover:bg-gray-100 border dark:border-white/10 border-gray-300/50 w-full sm:w-auto"
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