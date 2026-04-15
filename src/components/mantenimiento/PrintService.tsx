'use client'
import React, { useCallback } from 'react'
import { OrdenMantenimiento } from '@/types/orden'
import { Printer, Share2, Download } from 'lucide-react'

interface PrintServiceProps {
  negocio: any
}

// ============================================================================
// DETECCIÓN DE ENTORNO
// ============================================================================

/**
 * Detecta si la app corre dentro de un WebView de Capacitor.
 * Capacitor inyecta window.Capacitor al inicializar.
 */
const isCapacitor = (): boolean =>
  typeof window !== 'undefined' && !!(window as any).Capacitor

/**
 * Detecta si la plataforma es nativa (iOS o Android) en Capacitor.
 */
const isNativePlatform = (): boolean => {
  const cap = (window as any).Capacitor
  return isCapacitor() && cap?.getPlatform?.() !== 'web'
}

// ============================================================================
// GENERACIÓN HTML
// ============================================================================

const generarContenidoHTML = (
  orden: OrdenMantenimiento,
  negocio: any,
  formatFecha: Function,
  formatGarantiaFecha: Function
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Orden de Mantenimiento #${orden.idPersonalizado}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Arial, sans-serif; margin: 20px; 
          background-color: #fff; color: #000;
          font-size: 14px; line-height: 1.4;
        }
        .header { 
          text-align: center; margin-bottom: 20px; 
          border-bottom: 2px solid #333; padding-bottom: 15px;
        }
        .negocio-info {
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 15px; gap: 15px; flex-wrap: wrap;
        }
        .negocio-logo { max-width: 80px; max-height: 80px; object-fit: contain; }
        .negocio-details { text-align: center; }
        .negocio-details h1 { margin: 0; font-size: 20px; color: #000; }
        .negocio-details p { margin: 3px 0; font-size: 12px; color: #666; }
        .orden-info { margin-top: 10px; }
        .orden-info h2 { margin: 0; font-size: 18px; color: #000; }
        .orden-info p { margin: 3px 0; color: #666; font-size: 12px; }
        .section { margin-bottom: 15px; page-break-inside: avoid; }
        .section h2 { 
          border-bottom: 1px solid #333; padding-bottom: 3px; 
          margin-bottom: 8px; font-size: 16px; color: #000;
        }
        .flex-container { display: flex; justify-content: space-between; gap: 15px; flex-wrap: wrap; }
        .cliente, .dispositivo { width: 100%; min-width: 250px; }
        .info-row {
          display: flex; justify-content: space-between;
          padding: 3px 0; border-bottom: 1px dotted #ddd; margin-bottom: 3px;
        }
        .info-label { font-weight: bold; color: #333; flex-shrink: 0; margin-right: 10px; }
        .info-value { text-align: right; word-break: break-word; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .badge { 
          padding: 2px 6px; border-radius: 10px; 
          font-size: 10px; font-weight: bold; display: inline-block;
        }
        .preventivo { background-color: #d1fae5; color: #065f46; }
        .correctivo { background-color: #ffedd5; color: #9a3412; }
        .tasks-list { padding-left: 18px; }
        .tasks-list li { margin-bottom: 5px; line-height: 1.3; }
        .no-print { display: block; text-align: center; margin-top: 20px; }
        @media (min-width: 600px) {
          body { margin: 40px; }
          .cliente, .dispositivo { width: 48%; }
          .negocio-logo { max-width: 100px; max-height: 100px; }
          .negocio-details h1 { font-size: 24px; }
          .orden-info h2 { font-size: 20px; }
          .section h2 { font-size: 18px; }
        }
        @media print {
          .no-print { display: none; }
          body { margin: 15px; font-size: 12px; }
          .header { margin-bottom: 15px; }
          .section { margin-bottom: 12px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="negocio-info">
          ${negocio?.logoUrl ? `<img src="${negocio.logoUrl}" alt="${negocio.nombre}" class="negocio-logo">` : ''}
          <div class="negocio-details">
            <h1>${negocio?.nombre || 'Nombre del Negocio'}</h1>
            ${negocio?.direccion ? `<p>${negocio.direccion}</p>` : ''}
            ${negocio?.telefono ? `<p>Teléfono: ${negocio.telefono}</p>` : ''}
            ${negocio?.email ? `<p>Email: ${negocio.email}</p>` : ''}
            ${negocio?.nit ? `<p>NIT: ${negocio.nit}</p>` : ''}
          </div>
        </div>
        <div class="orden-info">
          <h2>Orden de Mantenimiento #${orden.idPersonalizado}</h2>
          <p>Fecha: ${formatFecha(orden.fechaCreacion)} ${orden.horaCreacion || ''}</p>
        </div>
      </div>

      <div class="flex-container">
        <div class="cliente section">
          <h2>Información del Cliente</h2>
          <div class="info-row"><span class="info-label">Nombre:</span><span class="info-value">${orden.cliente?.name || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Teléfono:</span><span class="info-value">${orden.cliente?.phone || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Cédula:</span><span class="info-value">${orden.cliente?.cedula || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${orden.cliente?.email || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Dirección:</span><span class="info-value">${orden.cliente?.address || 'N/A'}</span></div>
        </div>

        <div class="dispositivo section">
          <h2>Información del Dispositivo</h2>
          <div class="info-row"><span class="info-label">Tipo:</span><span class="info-value">${orden.dispositivo?.tipo || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Marca/Modelo:</span><span class="info-value">${orden.dispositivo?.marca || ''} ${orden.dispositivo?.modelo || ''}</span></div>
          <div class="info-row"><span class="info-label">Número de Serie:</span><span class="info-value">${orden.dispositivo?.numeroSerie || 'N/A'}</span></div>
          <div class="info-row">
            <span class="info-label">Tipo de Mantenimiento:</span>
            <span class="info-value">
              <span class="badge ${orden.tipoMantenimiento === 'preventivo' ? 'preventivo' : 'correctivo'}">
                ${orden.tipoMantenimiento}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Tareas Realizadas</h2>
        ${orden.tareasRealizadas?.length > 0
          ? `<ol class="tasks-list">${orden.tareasRealizadas.map((t: string) => `<li>${t}</li>`).join('')}</ol>`
          : '<p>No se registraron tareas</p>'
        }
      </div>

      ${orden.piezasUsadas?.length > 0 ? `
        <div class="section">
          <h2>Piezas Utilizadas</h2>
          <table>
            <thead><tr><th>Pieza</th><th>Cantidad</th></tr></thead>
            <tbody>
              ${orden.piezasUsadas.map((p: { pieza: string; cantidad: number }) =>
                `<tr><td>${p.pieza}</td><td>${p.cantidad}</td></tr>`
              ).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="section">
        <h2>Garantía</h2>
        <div class="info-row"><span class="info-label">Desde:</span><span class="info-value">${formatGarantiaFecha(orden.garantiaTiempoDesde)}</span></div>
        <div class="info-row"><span class="info-label">Hasta:</span><span class="info-value">${formatGarantiaFecha(orden.garantiaTiempoHasta)}</span></div>
        <div class="info-row"><span class="info-label">Descripción:</span><span class="info-value">${orden.garantiaDescripcion || 'No se especificó garantía'}</span></div>
      </div>

      <div class="no-print">
        <button onclick="window.print()" style="padding:8px 16px;background:#065f46;color:white;border:none;border-radius:5px;cursor:pointer;font-size:14px;">
          Imprimir
        </button>
      </div>
    </body>
    </html>
  `
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const usePrintService = ({ negocio }: PrintServiceProps) => {

  const formatFecha = useCallback((fecha: any): string => {
    if (!fecha) return 'Fecha no disponible'
    try {
      if (typeof fecha === 'object' && 'seconds' in fecha && 'nanoseconds' in fecha) {
        return new Date(fecha.seconds * 1000 + fecha.nanoseconds / 1000000).toLocaleDateString()
      } else if (typeof fecha === 'string') {
        return new Date(fecha).toLocaleDateString()
      } else if (fecha instanceof Date) {
        return fecha.toLocaleDateString()
      } else if (typeof fecha === 'number') {
        return new Date(fecha).toLocaleDateString()
      }
      return 'Formato de fecha no válido'
    } catch (error) {
      console.error('Error formateando fecha:', error, fecha)
      return 'Fecha inválida'
    }
  }, [])

  const formatGarantiaFecha = useCallback((fecha: any): string => {
    if (!fecha) return 'No especificada'
    try {
      if (typeof fecha === 'object' && 'seconds' in fecha && 'nanoseconds' in fecha) {
        return new Date(fecha.seconds * 1000 + fecha.nanoseconds / 1000000).toLocaleDateString()
      } else if (typeof fecha === 'string') {
        return new Date(fecha).toLocaleDateString()
      } else if (fecha instanceof Date) {
        return fecha.toLocaleDateString()
      } else if (typeof fecha === 'number') {
        return new Date(fecha).toLocaleDateString()
      }
      return 'Fecha inválida'
    } catch (error) {
      console.error('Error formateando fecha de garantía:', error, fecha)
      return 'Fecha inválida'
    }
  }, [])

  /**
   * Genera el PDF como Blob usando html2pdf.js.
   * Compatible con web y WebView de Capacitor.
   */
  const generarPDFBlob = useCallback(async (orden: OrdenMantenimiento): Promise<Blob> => {
    const contenido = generarContenidoHTML(orden, negocio, formatFecha, formatGarantiaFecha)

    const container = document.createElement('div')
    container.innerHTML = contenido
    container.querySelectorAll('.no-print').forEach(el => el.remove())

    const html2pdf = (await import('html2pdf.js')).default

    const opt = {
      margin: 10,
      filename: `Orden_${orden.idPersonalizado}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      // useCORS: true permite cargar imágenes externas (e.g. el logo del negocio)
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const
      }
    }

    const blob: Blob = await html2pdf().set(opt).from(container).output('blob')
    return blob
  }, [negocio, formatFecha, formatGarantiaFecha])

  /**
   * Convierte un Blob a string base64 puro (sin el prefijo data:...).
   * Necesario para Capacitor Filesystem, que espera base64 sin prefijo.
   */
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Resultado: "data:application/pdf;base64,XXXXX" — extraemos solo la parte base64
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = () => reject(new Error('Error convirtiendo blob a base64'))
      reader.readAsDataURL(blob)
    })
  }, [])

  /**
   * Descarga / guarda el PDF.
   *
   * Plataforma nativa (Capacitor Android/iOS):
   *   1. Guarda el archivo en el directorio Documents del dispositivo.
   *   2. Lo abre con la app predeterminada de PDF del sistema.
   *   Requiere instalar:
   *     npm install @capacitor/filesystem @capacitor-community/file-opener
   *     npx cap sync
   *
   * Web / WebView en modo web:
   *   Descarga estándar con <a download>.
   */
  const descargarPDF = useCallback(async (orden: OrdenMantenimiento) => {
    try {
      const blob = await generarPDFBlob(orden)
      const filename = `Orden_${orden.idPersonalizado}.pdf`

      if (isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        const { FileOpener } = await import('@capacitor-community/file-opener')

        const base64Data = await blobToBase64(blob)

        // Se usa Directory.Data para evitar problemas de permisos de almacenamiento en Android moderno.
        const result = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Data,
          recursive: true
        })

        await FileOpener.open({
          filePath: result.uri,
          contentType: 'application/pdf',
          openWithDefault: true
        })
      } else {
        // Web: descarga con enlace temporal
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error al descargar PDF:', error)
      throw error
    }
  }, [generarPDFBlob, blobToBase64])

  /**
   * Comparte el PDF usando el sheet nativo o Web Share API.
   *
   * Plataforma nativa (Capacitor Android/iOS):
   *   1. Escribe el PDF en el directorio Cache (temporal, sin permisos extra).
   *   2. Invoca el share sheet nativo del sistema operativo.
   *   Requiere instalar:
   *     npm install @capacitor/filesystem @capacitor/share
   *     npx cap sync
   *
   * Web:
   *   Intenta Web Share API con File. Si no está disponible, hace fallback a descargar.
   */
  const compartirOrden = useCallback(async (orden: OrdenMantenimiento) => {
    try {
      const blob = await generarPDFBlob(orden)
      const filename = `Orden_Mantenimiento_${orden.idPersonalizado}.pdf`

      if (isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        const { Share } = await import('@capacitor/share')

        const base64Data = await blobToBase64(blob)

        // Cache: temporal, no necesita permisos de almacenamiento externo
        const result = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true
        })

        await Share.share({
          title: `Orden de Mantenimiento #${orden.idPersonalizado}`,
          text: `Orden de mantenimiento #${orden.idPersonalizado}`,
          url: result.uri,
          dialogTitle: 'Compartir Orden'
        })
      } else {
        // Web: Web Share API con File (frecuentemente falla en PC o por timeouts en Chrome)
        const file = new File([blob], filename, { type: 'application/pdf' })
        const textoOrden = `Orden de mantenimiento #${orden.idPersonalizado} - ${orden.dispositivo?.marca || ''} ${orden.dispositivo?.modelo || ''}`

        const fallbackWebCompartir = async () => {
          // Si estamos en Web y falla el share nativo, descargamos el archivo y damos la opción de WhatsApp
          await descargarPDF(orden)
          
          const telefono = orden.cliente?.phone ? orden.cliente.phone.replace(/\D/g, '') : ''
          const mensaje = encodeURIComponent(`Hola ${orden.cliente?.name || ''}, te adjunto la orden de mantenimiento #${orden.idPersonalizado}.\n\n(Nota: Por favor adjunta el PDF que se acaba de descargar)`)
          
          const waUrl = telefono ? `https://wa.me/${telefono}?text=${mensaje}` : `https://api.whatsapp.com/send?text=${mensaje}`
          
          // Usamos confirmacion simple para que el usuario entienda qué pasó
          if (window.confirm('El entorno web no permite compartir el archivo directamente. El PDF se descargará automáticamente.\n\n¿Deseas abrir WhatsApp ahora para enviarlo manualmente?')) {
            window.open(waUrl, '_blank')
          }
        }

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Orden de Mantenimiento #${orden.idPersonalizado}`,
              text: textoOrden
            })
          } catch (shareErr) {
            if (shareErr instanceof Error && shareErr.name === 'AbortError') return
            console.warn('Web Share falló (ej. pérdida de activación segura), usando fallback de WhatsApp...', shareErr)
            await fallbackWebCompartir()
          }
        } else {
          // Fallback: si el API no soporta compartir el archivo
          await fallbackWebCompartir()
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('Error al compartir orden:', error)
    }
  }, [generarPDFBlob, blobToBase64, descargarPDF])

  /**
   * Imprime la orden abriendo una nueva ventana.
   * En WebView de Capacitor abre el diálogo de impresión del sistema.
   * Se usa window.open en lugar de iframe para mayor compatibilidad con WebViews.
   */
  const imprimirOrden = useCallback((orden: OrdenMantenimiento) => {
    const contenido = generarContenidoHTML(orden, negocio, formatFecha, formatGarantiaFecha)

    const ventana = window.open('', '_blank', 'width=800,height=600')
    if (!ventana) {
      console.error('No se pudo abrir la ventana de impresión. Verifica que los popups no estén bloqueados.')
      return
    }

    ventana.document.open()
    ventana.document.write(contenido)
    ventana.document.close()

    ventana.onload = () => {
      ventana.focus()
      ventana.print()
      // Cierra la ventana después de que el usuario termine con el diálogo de impresión
      ventana.onafterprint = () => ventana.close()
    }
  }, [negocio, formatFecha, formatGarantiaFecha])

  return {
    imprimirOrden,
    compartirOrden,
    descargarPDF,
    generarPDFBlob,
    formatFecha,
    formatGarantiaFecha
  }
}

// ============================================================================
// BOTONES REUTILIZABLES
// ============================================================================

interface PrintButtonProps {
  orden: OrdenMantenimiento
  onPrint: (orden: OrdenMantenimiento) => void
  variant?: 'table' | 'card'
}

export const PrintButton: React.FC<PrintButtonProps> = ({ orden, onPrint, variant = 'table' }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onPrint(orden)
  }

  if (variant === 'card') {
    return (
      <button
        onClick={handleClick}
        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
        aria-label="Imprimir orden"
      >
        <Printer className="w-4 h-4" />
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-green-500/20 transition-colors"
      aria-label="Imprimir orden"
    >
      <Printer className="w-4 h-4" />
    </button>
  )
}

interface ShareButtonProps {
  orden: OrdenMantenimiento
  onShare: (orden: OrdenMantenimiento) => void
  variant?: 'table' | 'card'
}

export const ShareButton: React.FC<ShareButtonProps> = ({ orden, onShare, variant = 'table' }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onShare(orden)
  }

  if (variant === 'card') {
    return (
      <button
        onClick={handleClick}
        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
        aria-label="Compartir orden"
      >
        <Share2 className="w-4 h-4" />
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/20 transition-colors"
      aria-label="Compartir orden"
    >
      <Share2 className="w-4 h-4" />
    </button>
  )
}

interface DownloadButtonProps {
  orden: OrdenMantenimiento
  onDownload: (orden: OrdenMantenimiento) => void
  variant?: 'table' | 'card'
}

/**
 * Botón de descarga de PDF.
 * Expuesto como componente separado para usarse donde sea necesario
 * (por ejemplo en ModalOrden o en la tabla de órdenes).
 */
export const DownloadButton: React.FC<DownloadButtonProps> = ({ orden, onDownload, variant = 'table' }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDownload(orden)
  }

  if (variant === 'card') {
    return (
      <button
        onClick={handleClick}
        className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
        aria-label="Descargar PDF"
      >
        <Download className="w-4 h-4" />
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="text-purple-400 hover:text-purple-300 p-1 rounded hover:bg-purple-500/20 transition-colors"
      aria-label="Descargar PDF"
    >
      <Download className="w-4 h-4" />
    </button>
  )
}