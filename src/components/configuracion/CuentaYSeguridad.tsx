'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/basic/card"
import { Button } from "@/components/ui/basic/button"
import { useAuth } from '@/components/auth/AuthProvider'
import { KeyRound, Download, Trash2, Loader2, AlertTriangle, CheckCircle, XCircle, FileJson, FolderOpen, Smartphone } from 'lucide-react'
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
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

interface ExportStatus {
  type: 'success' | 'error' | 'info' | null
  message: string
  details?: string
}

export default function CuentaYSeguridad() {
  const { user, logout } = useAuth()
  
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [exportStatus, setExportStatus] = useState<ExportStatus>({ type: null, message: '' })
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    // Detectar si estamos en un dispositivo nativo
    const native = Capacitor.isNativePlatform()
    setIsNative(native)
  }, [])

  const validateExportData = (data: any) => {
    const totalClientes = data.clientes?.length || 0
    const totalOrdenes = data.ordenes?.length || 0
    
    if (totalClientes === 0 && totalOrdenes === 0) {
      return {
        isValid: false,
        message: 'No tienes datos para exportar',
        details: 'No se encontraron clientes ni órdenes de servicio asociados a tu cuenta.'
      }
    }
    
    return {
      isValid: true,
      message: `Se exportarán ${totalClientes} clientes y ${totalOrdenes} órdenes de servicio`,
      totalClientes,
      totalOrdenes
    }
  }

  const downloadOnWeb = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadOnNative = async (jsonString: string, fileName: string) => {
    try {
      // Escribir el archivo en el sistema de archivos
      const result = await Filesystem.writeFile({
        path: fileName,
        data: jsonString,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true
      })

      console.log('Archivo guardado:', result.uri)

      // Intentar compartir/compartir el archivo
      try {
        await Share.share({
          title: 'Backup TecniControl',
          text: 'Aquí está tu backup de TecniControl',
          url: result.uri,
          dialogTitle: 'Compartir backup'
        })
        
        return {
          success: true,
          path: result.uri,
          message: 'Archivo guardado y listo para compartir'
        }
      } catch (shareError) {
        // Si el usuario cancela el share, el archivo ya está guardado
        return {
          success: true,
          path: result.uri,
          message: 'Archivo guardado en Documentos'
        }
      }
    } catch (error: any) {
      console.error('Error en descarga nativa:', error)
      
      // Intentar método alternativo: guardar en caché y compartir
      try {
        const cacheResult = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
          recursive: true
        })
        
        await Share.share({
          title: 'Backup TecniControl',
          text: 'Aquí está tu backup de TecniControl',
          url: cacheResult.uri,
          dialogTitle: 'Guardar backup'
        })
        
        return {
          success: true,
          path: cacheResult.uri,
          message: 'Archivo listo para compartir'
        }
      } catch (cacheError) {
        throw new Error('No se pudo guardar el archivo en el dispositivo')
      }
    }
  }

  const handleExportData = async () => {
    if (!user?.uid) {
      setExportStatus({
        type: 'error',
        message: 'No se pudo identificar tu cuenta',
        details: 'La sesión no está activa. Por favor, inicia sesión nuevamente.'
      })
      return
    }

    try {
      setIsExporting(true)
      setExportStatus({ type: 'info', message: 'Recopilando tus datos...' })
      
      // Obtener datos con timeout
      const timeout = 15000
      const fetchPromise = Promise.all([
        getDocs(query(collection(db, 'clientes'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'ordenes'), where('userId', '==', user.uid)))
      ])
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('La operación tardó demasiado tiempo')), timeout)
      )
      
      const [clientesSnapshot, ordenesSnapshot] = await Promise.race([fetchPromise, timeoutPromise]) as any

      const data = {
        metadata: {
          exportDate: new Date().toISOString(),
          userId: user.uid,
          userEmail: user.email,
          appVersion: '1.0.0',
          totalClientes: clientesSnapshot.docs.length,
          totalOrdenes: ordenesSnapshot.docs.length
        },
        clientes: clientesSnapshot.docs.map((doc: { id: any; data: () => any }) => ({ id: doc.id, ...doc.data() })),
        ordenes: ordenesSnapshot.docs.map((doc: { id: any; data: () => any }) => ({ id: doc.id, ...doc.data() }))
      }

      // Validar datos antes de exportar
      const validation = validateExportData(data)
      if (!validation.isValid) {
        setExportStatus({
          type: 'info',
          message: validation.message,
          details: validation.details
        })
        setIsExporting(false)
        return
      }

      // Verificar espacio disponible (estimación)
      const jsonString = JSON.stringify(data, null, 2)
      const dataSize = new Blob([jsonString]).size
      const maxSize = 10 * 1024 * 1024 // 10MB máximo
      
      if (dataSize > maxSize) {
        setExportStatus({
          type: 'error',
          message: 'Los datos son demasiado grandes para exportar',
          details: `El tamaño estimado es de ${(dataSize / (1024 * 1024)).toFixed(2)}MB. Máximo permitido: 10MB.`
        })
        setIsExporting(false)
        return
      }

      // Crear nombre de archivo con timestamp
      const fecha = new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-')
      
      const nombreArchivo = `TecniControl_Backup_${fecha}_${user.email?.split('@')[0] || 'usuario'}.json`
      
      setExportStatus({
        type: 'info',
        message: isNative ? 'Guardando archivo en tu dispositivo...' : 'Preparando archivo para descarga...',
        details: `Archivo: ${nombreArchivo}`
      })

      if (isNative) {
        // Descarga en dispositivo nativo (Android/iOS)
        const result = await downloadOnNative(jsonString, nombreArchivo)
        
        setExportStatus({
          type: 'success',
          message: '¡Datos exportados exitosamente!',
          details: `${result.message}\n` +
                  `Ruta: ${result.path || 'Documentos/' + nombreArchivo}\n` +
                  `${validation.totalClientes} clientes y ${validation.totalOrdenes} órdenes exportados.`
        })
      } else {
        // Descarga en web
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' })
        
        // Intentar File System Access API
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await (window as any).showSaveFilePicker({
              suggestedName: nombreArchivo,
              types: [{
                description: 'JSON Backup',
                accept: { 'application/json': ['.json'] }
              }]
            })
            const writable = await handle.createWritable()
            await writable.write(blob)
            await writable.close()
            
            setExportStatus({
              type: 'success',
              message: '¡Datos exportados exitosamente!',
              details: `Archivo: ${handle.name}\n` +
                      `${validation.totalClientes} clientes y ${validation.totalOrdenes} órdenes exportados.`
            })
            
            setTimeout(() => setExportStatus({ type: null, message: '' }), 5000)
            setIsExporting(false)
            return
          } catch (error: any) {
            if (error.name === 'AbortError') {
              setExportStatus({ type: 'info', message: 'Exportación cancelada por el usuario' })
              setIsExporting(false)
              return
            }
          }
        }

        // Método tradicional para web
        downloadOnWeb(blob, nombreArchivo)
        
        setExportStatus({
          type: 'success',
          message: '¡Datos exportados exitosamente!',
          details: `Archivo: ${nombreArchivo}\n` +
                  `${validation.totalClientes} clientes y ${validation.totalOrdenes} órdenes exportados.\n` +
                  'Revisa tu carpeta de descargas.'
        })
      }
      
      // Limpiar mensaje después de 8 segundos
      setTimeout(() => setExportStatus({ type: null, message: '' }), 8000)

    } catch (error: any) {
      console.error('Error exportando datos:', error)
      
      let errorDetails = ''
      if (error.message?.includes('timeout') || error.message?.includes('tardó demasiado')) {
        errorDetails = 'La conexión es lenta o hay problemas con el servidor. Intenta de nuevo más tarde.'
      } else if (error.message?.includes('No se pudo guardar')) {
        errorDetails = 'No se pudo guardar el archivo. Verifica los permisos de almacenamiento.'
      } else if (error.code === 'permission-denied') {
        errorDetails = 'No tienes permisos para acceder a estos datos. Verifica tu sesión.'
      } else if (error.code === 'unavailable') {
        errorDetails = 'El servicio no está disponible en este momento. Intenta más tarde.'
      } else {
        errorDetails = 'Ocurrió un error inesperado. Por favor, intenta nuevamente.'
      }
      
      setExportStatus({
        type: 'error',
        message: 'Error al exportar los datos',
        details: errorDetails
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    try {
      setIsDeleting(true)
      setErrorMsg('')
      
      await deleteUser(user)
      
    } catch (error: any) {
      console.error('Error eliminando cuenta:', error)
      setIsDeleting(false)
      
      if (error.code === 'auth/requires-recent-login') {
        setErrorMsg('Por motivos de seguridad, debes cerrar sesión y volver a ingresar para eliminar tu cuenta.')
      } else if (error.code === 'auth/network-request-failed') {
        setErrorMsg('Error de conexión. Verifica tu internet e intenta nuevamente.')
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMsg('Demasiados intentos. Por favor, espera unos minutos e inténtalo de nuevo.')
      } else {
        setErrorMsg('Hubo un error al intentar eliminar la cuenta. Intenta de nuevo más tarde.')
      }
    }
  }

  const getStatusIcon = () => {
    switch (exportStatus.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'info':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
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
        <CardContent className="space-y-4">
          {/* Estado de exportación */}
          {exportStatus.message && (
            <div className={`p-4 rounded-lg border ${
              exportStatus.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
              exportStatus.type === 'error' ? 'bg-red-500/10 border-red-500/30' :
              'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon()}</div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    exportStatus.type === 'success' ? 'text-green-400' :
                    exportStatus.type === 'error' ? 'text-red-400' :
                    'text-blue-400'
                  }`}>
                    {exportStatus.message}
                  </p>
                  {exportStatus.details && (
                    <div className="mt-2 p-3 bg-gray-900/50 rounded border border-gray-700">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                        {exportStatus.details}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-300 font-medium">Exportar Información</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                Obtendrás un archivo JSON con la información de los clientes y todo el historial de mantenimientos.
                {isNative ? (
                  <span className="flex items-center gap-1 mt-1 text-blue-400">
                    <Smartphone className="w-3 h-3" />
                    El archivo se guardará en tu dispositivo
                  </span>
                ) : (
                  <span className="flex items-center gap-1 mt-1 text-gray-400">
                    <FolderOpen className="w-3 h-3" />
                    El archivo se descargará en tu carpeta de descargas
                  </span>
                )}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportData}
              disabled={isExporting}
              className="border-green-600/30 text-green-400 bg-green-500/10 hover:bg-green-500/20 hover:text-green-300 min-w-[180px]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <FileJson className="w-4 h-4 mr-2" />
                  Descargar JSON
                </>
              )}
            </Button>
          </div>

          {/* Indicador de progreso durante exportación */}
          {isExporting && (
            <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div className="bg-green-500 h-full rounded-full animate-pulse" 
                   style={{ width: '60%' }} />
            </div>
          )}
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
              <div>
                <p>{errorMsg}</p>
                {errorMsg.includes('cerrar sesión') && (
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
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-300 font-medium">Eliminar Cuenta</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                Esta acción no se puede deshacer. Se borrará tu acceso y los datos de TecniControl permanentemente.
                <span className="text-yellow-400/80"> Te recomendamos exportar tus datos antes de eliminar la cuenta.</span>
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="min-w-[180px]"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar Cuenta
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    ¿Estás absolutamente seguro?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400 space-y-3">
                    <p>
                      Esta acción no se puede deshacer. Esto eliminará tu cuenta de usuario permanentemente 
                      y no podrás acceder a tus clientes u órdenes previas.
                    </p>
                    <p className="text-yellow-400/80 text-sm">
                      Te recomendamos exportar tus datos primero desde la sección "Tus Datos".
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700 border-gray-600">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={isDeleting}
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