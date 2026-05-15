'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/basic/card"
import { Button } from "@/components/ui/basic/button"
import { useAuth } from '@/components/auth/AuthProvider'
import { KeyRound, Download, Trash2, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { sendPasswordResetEmail, deleteUser } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/basic/alert-dialog"

export default function CuentaYSeguridad() {
  const { user, logout } = useAuth()
  
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handlePasswordReset = async () => {
    if (!user?.email) return
    try {
      await sendPasswordResetEmail(auth, user.email)
      setResetEmailSent(true)
      setTimeout(() => setResetEmailSent(false), 5000)
    } catch (error) {
      console.error('Error enviando correo de reseteo', error)
      setErrorMsg('No se pudo enviar el correo de recuperación. Puede que hayas ingresado con Google.')
    }
  }

  const handleExportData = async () => {
    if (!user?.uid) return
    try {
      setIsExporting(true)
      
      const [clientesSnapshot, ordenesSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'clientes'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'ordenes'), where('userId', '==', user.uid)))
      ])

      const data = {
        clientes: clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ordenes: ordenesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tecnicontrol_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error exportando datos', error)
      alert('Hubo un error al exportar tus datos.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    try {
      setIsDeleting(true)
      setErrorMsg('')
      // Eliminar el usuario de Firebase Auth (requiere login reciente)
      await deleteUser(user)
      // Si tiene exito, el AuthProvider reaccionara y lo sacara
    } catch (error: any) {
      console.error('Error eliminando cuenta', error)
      if (error.code === 'auth/requires-recent-login') {
        setErrorMsg('Por motivos de seguridad, debes cerrar sesión y volver a ingresar para eliminar tu cuenta.')
      } else {
        setErrorMsg('Hubo un error al intentar eliminar la cuenta.')
      }
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cambio de Contraseña */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-xl">
            <KeyRound className="w-5 h-5 text-blue-400" />
            Seguridad de la Cuenta
          </CardTitle>
          <CardDescription className="text-gray-400">
            {user?.providerData.some(p => p.providerId === 'google.com') 
              ? 'Has iniciado sesión con Google. El cambio de contraseña se gestiona desde tu cuenta de Google.'
              : 'Actualiza tu contraseña para mantener tu cuenta segura.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-300 font-medium">Restablecer contraseña</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                Te enviaremos un correo electrónico con un enlace para que puedas cambiar tu contraseña de forma segura.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handlePasswordReset}
              disabled={resetEmailSent}
              className="border-gray-600 bg-gray-700 hover:bg-gray-600 text-white min-w-[180px]"
            >
              {resetEmailSent ? (
                <><CheckCircle className="w-4 h-4 mr-2 text-green-400" /> Correo Enviado</>
              ) : (
                'Enviar correo de reseteo'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exportar Datos */}
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
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-300 font-medium">Exportar Información</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                Obtendrás un archivo JSON con la información de los clientes y todo el historial de mantenimientos.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportData}
              disabled={isExporting}
              className="border-green-600/30 text-green-400 bg-green-500/10 hover:bg-green-500/20 hover:text-green-300 min-w-[180px]"
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {isExporting ? 'Exportando...' : 'Descargar JSON'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Zona de Peligro */}
      <Card className="bg-red-900/10 border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2 text-xl">
            <AlertTriangle className="w-5 h-5" />
            Zona de Peligro
          </CardTitle>
          <CardDescription className="text-gray-400">
            Al eliminar tu cuenta se perderán de forma permanente todos tus datos, y no podrán ser recuperados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-300 font-medium">Eliminar Cuenta</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                Esta acción no se puede deshacer. Se borrará tu acceso y la cuenta de Firebase permanentemente.
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="min-w-[180px]">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Cuenta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Esta acción no se puede deshacer. Esto eliminará tu cuenta de usuario permanentemente y no podrás acceder a tus clientes u órdenes previas. Te recomendamos exportar tus datos primero.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700 border-gray-600">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? 'Eliminando...' : 'Sí, eliminar cuenta'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
