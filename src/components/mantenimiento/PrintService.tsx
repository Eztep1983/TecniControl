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

const isCapacitor = (): boolean =>
  typeof window !== 'undefined' && !!(window as any).Capacitor

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
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
    body { 
      font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 20px;
      background-color: #fff; color: #1a1a1a;
      font-size: 12px; line-height: 1.5;
    }
    .header { 
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 25px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;
    }
    .negocio-info { display: flex; align-items: center; gap: 15px; }
    .negocio-logo { width: 80px; height: 80px; object-fit: contain; border-radius: 8px; }
    .negocio-details h1 { margin: 0; font-size: 18px; color: #111; font-weight: 700; }
    .negocio-details p { margin: 2px 0; font-size: 11px; color: #4b5563; }
    .orden-meta { text-align: right; }
    .orden-meta h2 { margin: 0; font-size: 16px; color: #2563eb; font-weight: 700; }
    .orden-meta p { margin: 2px 0; font-size: 11px; color: #4b5563; }

    .section { margin-bottom: 20px; page-break-inside: avoid; }
    .section-title { 
      background-color: #f3f4f6; padding: 6px 12px; border-radius: 6px;
      margin-bottom: 10px; font-size: 13px; font-weight: 700; color: #1f2937;
      text-transform: uppercase; letter-spacing: 0.05em; border-left: 4px solid #2563eb;
    }
    
    .flex-info { display: flex; gap: 20px; margin-bottom: 20px; }
    .flex-info > div { flex: 1; }
    .info-group { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .info-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f3f4f6; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #6b7280; font-size: 10px; text-transform: uppercase; }
    .info-value { color: #111827; font-weight: 500; text-align: right; }

    .data-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-top: 5px; }
    .data-label { font-weight: 700; font-size: 11px; color: #374151; margin-bottom: 4px; display: block; }
    .data-content { color: #4b5563; font-size: 11px; white-space: pre-wrap; }

    table { width: 100%; border-collapse: collapse; margin-top: 10px; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background-color: #f9fafb; font-weight: 700; color: #374151; font-size: 11px; text-transform: uppercase; }
    td { color: #4b5563; font-size: 11px; }

    .badge { 
      padding: 4px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; 
      text-transform: uppercase; display: inline-block;
    }
    .badge-preventivo { background-color: #dcfce7; color: #166534; }
    .badge-correctivo { background-color: #ffedd5; color: #9a3412; }
    .badge-diagnostico { background-color: #dbeafe; color: #1e40af; }
    .badge-instalacion { background-color: #f3e8ff; color: #6b21a8; }

    .signatures { display: flex; gap: 40px; margin-top: 40px; }
    .signatures > div { flex: 1; }
    .signature-box { border-top: 1px solid #374151; padding-top: 10px; text-align: center; }
    .signature-img { max-width: 180px; max-height: 80px; margin-bottom: 5px; object-fit: contain; }
    .signature-name { font-weight: 700; color: #111827; font-size: 12px; }
    .signature-role { color: #6b7280; font-size: 10px; text-transform: uppercase; }

    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 15px; }

    @media print {
      body { padding: 0; margin: 0; }
      .info-group { border: 1px solid #eee; }
    }
  `;

  const htmlContent = `
    <div class="header">
      <div class="negocio-info">
        ${negocio?.logoUrl 
          ? `<img src="${negocio.logoUrl}" alt="Logo" class="negocio-logo" crossorigin="anonymous">` 
          : `<div class="negocio-logo" style="background:#f3f4f6; display:flex; align-items:center; justify-content:center; border:1px dashed #ccc;">
              <span style="color:#999; font-size:10px;">Sin Logo</span>
             </div>`
        }
        <div class="negocio-details">
          <h1>${negocio?.nombre || 'TecniControl Service'}</h1>
          ${negocio?.nit ? `<p>NIT: ${negocio.nit}</p>` : ''}
          ${negocio?.direccion ? `<p>${negocio.direccion}</p>` : ''}
          ${negocio?.telefono ? `<p>Tel: ${negocio.telefono}</p>` : ''}
          ${negocio?.email ? `<p>${negocio.email}</p>` : ''}
        </div>
      </div>
      <div class="orden-meta">
        <h2>ORDEN DE SERVICIO</h2>
        <p style="font-weight:700; font-size:14px; color:#111;"># ${orden.idPersonalizado}</p>
        <p>Fecha: ${formatFecha(orden.fechaCreacion)}</p>
        <p>Hora: ${orden.horaCreacion || '--:--'}</p>
        <div style="margin-top:5px;">
          <span class="badge badge-${orden.tipoMantenimiento}">
            ${orden.tipoMantenimiento}
          </span>
        </div>
      </div>
    </div>

    <div class="flex-info section">
      <div class="info-group">
        <div class="section-title" style="border-left-color: #2563eb;">Información del Cliente</div>
        <div class="info-row"><span class="info-label">Nombre</span><span class="info-value">${orden.cliente?.name || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Teléfono</span><span class="info-value">${orden.cliente?.phone || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Documento</span><span class="info-value">${orden.cliente?.cedula || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Dirección</span><span class="info-value">${orden.cliente?.address || 'N/A'}</span></div>
      </div>

      <div class="info-group">
        <div class="section-title" style="border-left-color: #10b981;">Información del Equipo</div>
        <div class="info-row"><span class="info-label">Tipo</span><span class="info-value">${orden.dispositivo?.tipo || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Marca/Modelo</span><span class="info-value">${orden.dispositivo?.marca || ''} ${orden.dispositivo?.modelo || ''}</span></div>
        <div class="info-row"><span class="info-label">S/N</span><span class="info-value">${orden.dispositivo?.numeroSerie || 'N/A'}</span></div>
        ${orden.contador ? `
          <div class="info-row">
            <span class="info-label">Contador (${orden.contador.tipo})</span>
            <span class="info-value">${orden.contador.valor}</span>
          </div>
        ` : ''}
        ${orden.contadorMaquina ? `
          <div class="info-row">
            <span class="info-label">Contador de Máquina</span>
            <span class="info-value">${orden.contadorMaquina.toLocaleString()}</span>
          </div>
        ` : ''}
      </div>
    </div>

    ${(orden.observacionesIniciales || orden.pruebasRealizadas || orden.posiblesCausas || orden.diagnosticoFinal) ? `
      <div class="section">
        <div class="section-title" style="border-left-color: #f59e0b;">Detalle del Diagnóstico / Observaciones</div>
        <div class="flex-info">
          ${orden.observacionesIniciales ? `
            <div class="data-box">
              <span class="data-label">Observaciones Iniciales</span>
              <div class="data-content">${orden.observacionesIniciales}</div>
            </div>
          ` : ''}
          ${orden.pruebasRealizadas ? `
            <div class="data-box">
              <span class="data-label">Pruebas Realizadas</span>
              <div class="data-content">${orden.pruebasRealizadas}</div>
            </div>
          ` : ''}
        </div>
        <div class="flex-info" style="margin-top:10px;">
          ${orden.posiblesCausas ? `
            <div class="data-box">
              <span class="data-label">Posibles Causas</span>
              <div class="data-content">${orden.posiblesCausas}</div>
            </div>
          ` : ''}
          ${orden.diagnosticoFinal ? `
            <div class="data-box">
              <span class="data-label">Diagnóstico Final</span>
              <div class="data-content" style="font-weight:600; color:#111;">${orden.diagnosticoFinal}</div>
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    ${(orden.tipoMantenimiento === 'instalacion' || orden.instalacionRecomendaciones || (orden.instalacionConfiguracionTipos?.length ?? 0) > 0) ? `
      <div class="section">
        <div class="section-title" style="border-left-color: #8b5cf6;">Detalle de Instalación</div>
        ${(orden.instalacionConfiguracion || (orden.instalacionConfiguracionTipos?.length ?? 0) > 0) ? `
          <div class="data-box">
            <span class="data-label">Configuraciones Realizadas</span>
            <div class="data-content">
              ${orden.instalacionConfiguracionTipos?.join(', ') || 'Instalación estándar'}
            </div>
          </div>
        ` : ''}
        ${(orden.instalacionRecomendaciones || orden.instalacionRecomendacionesDetalle) ? `
          <div class="data-box" style="margin-top:10px;">
            <span class="data-label">Recomendaciones del Técnico</span>
            <div class="data-content">${orden.instalacionRecomendacionesDetalle || 'Se brindaron recomendaciones de uso al cliente.'}</div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    ${(orden.tipoMantenimiento === 'preventivo' || orden.tipoMantenimiento === 'correctivo') ? `
      <div class="section">
        <div class="section-title">Tareas Realizadas</div>
        <div class="data-box">
          <ul style="margin:0; padding-left:15px; font-size:11px; color:#4b5563;">
            ${orden.tareasRealizadas?.map((t: string) => `<li>${t}</li>`).join('') || '<li>No se registraron tareas</li>'}
          </ul>
        </div>
      </div>
    ` : ''}

    ${orden.piezasUsadas?.length > 0 ? `
      <div class="section">
        <div class="section-title">Repuestos / Materiales</div>
        <table>
          <thead><tr><th>Descripción</th><th style="text-align:right">Cantidad</th></tr></thead>
          <tbody>
            ${orden.piezasUsadas.map((p: { pieza: string; cantidad: number }) =>
              `<tr><td>${p.pieza}</td><td style="text-align:right">${p.cantidad}</td></tr>`
            ).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <div class="section">
      <div class="section-title" style="border-left-color: #6b7280;">Garantía y Observaciones</div>
      <div class="flex-info">
        ${orden.garantiaHabilitada === false ? `
          <div class="data-box" style="margin:0; flex: 1; display: flex; align-items: center; justify-content: space-between;">
            <span class="data-label" style="margin-bottom:0;">Garantía del Servicio:</span>
            <span class="info-value" style="color: #6b7280;">No aplica</span>
          </div>
        ` : `
          <div class="info-group">
            <div class="info-row"><span class="info-label">Vigencia Desde</span><span class="info-value">${formatGarantiaFecha(orden.garantiaTiempoDesde)}</span></div>
            <div class="info-row"><span class="info-label">Vigencia Hasta</span><span class="info-value">${formatGarantiaFecha(orden.garantiaTiempoHasta)}</span></div>
          </div>
          <div class="data-box" style="margin:0; flex: 1.5;">
            <span class="data-label">Términos de Garantía</span>
            <div class="data-content">${orden.garantiaDescripcion || 'Garantía estándar según políticas de la empresa.'}</div>
          </div>
        `}
      </div>
    </div>

    <div class="signatures">
      <div class="signature-box">
        ${orden.firmaCliente
          ? `<img src="${orden.firmaCliente}" alt="Firma Cliente" class="signature-img">`
          : '<div style="height:80px; display:flex; align-items:center; justify-content:center; color:#9ca3af; font-size:10px;">Firma No Registrada</div>'
        }
        <div class="signature-name">${orden.nombreFirmante || orden.cliente?.name || 'Cliente'}</div>
        <div class="signature-role">Firma del Cliente</div>
      </div>
      <div class="signature-box">
        <div style="height:80px; display:flex; align-items:flex-end; justify-content:center; padding-bottom:10px;">
          <div style="border-bottom:1px solid #ccc; width:150px; text-align:center; padding-bottom:5px;">
            <span style="font-size:12px; font-weight:700; color:#333;">${negocio?.nombre || 'Técnico Autorizado'}</span>
          </div>
        </div>
        <div class="signature-name">Técnico Responsable</div>
        <div class="signature-role">TecniControl Service</div>
      </div>
    </div>

    <div class="footer">
      Documento generado electrónicamente por TecniControl. 
      Este documento es un comprobante de servicio y no representa una factura legal de venta.
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Orden de Mantenimiento #${orden.idPersonalizado}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${styles}</style>
    </head>
    <body>
      <div id="pdf-root">
        ${htmlContent}
      </div>
    </body>
    </html>
  `;
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
   * Convierte una URL de imagen a base64.
   * Silencia errores de CORS — si falla, devuelve null.
   */
  const urlToBase64 = useCallback(async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url, { mode: 'cors' })
      if (!res.ok) return null
      const blob = await res.blob()
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('FileReader error'))
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  }, [])

  /**
   * Genera el PDF como Blob usando html2pdf.js.
   *
   * Estrategia:
   *   1. Procesa el logo a base64 para evitar problemas de CORS en el canvas.
   *   2. Genera el HTML completo.
   *   3. Usa un elemento temporal para asegurar que los estilos se apliquen correctamente.
   */
  const generarPDFBlob = useCallback(async (orden: OrdenMantenimiento): Promise<Blob> => {
    const html2pdf = (await import('html2pdf.js')).default

    const opt = {
      margin: 10,
      filename: `Orden_${orden.idPersonalizado}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        letterRendering: true,
        logging: false,
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const,
      },
    }

    // Procesa el logo de forma asíncrona
    let logoBase64: string | null = null
    if (negocio?.logoUrl) {
      if (negocio.logoUrl.startsWith('data:')) {
        logoBase64 = negocio.logoUrl
      } else {
        logoBase64 = await urlToBase64(negocio.logoUrl)
      }
    }

    const obtenerPDF = async (conLogo: boolean): Promise<Blob> => {
      const negProcesado = { ...negocio, logoUrl: conLogo ? logoBase64 : null }
      const fullHtml = generarContenidoHTML(orden, negProcesado, formatFecha, formatGarantiaFecha)
      
      // Creamos un contenedor temporal en el DOM para asegurar que los estilos
      // sean procesados correctamente por html2canvas.
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '-9999px'
      container.style.width = '800px' // Ancho fijo para el renderizado
      
      // Usamos DOMParser para extraer solo el contenido del body pero manteniendo
      // los estilos si estuvieran inline. En este caso, inyectamos el HTML completo
      // pero html2pdf aceptará el elemento.
      container.innerHTML = fullHtml
      document.body.appendChild(container)
      
      try {
        // Buscamos el root del PDF dentro del contenedor
        const element = (container.querySelector('#pdf-root') as HTMLElement) || container
        const blob: Blob = await html2pdf().set(opt).from(element).output('blob')
        document.body.removeChild(container)
        return blob
      } catch (err) {
        if (container.parentNode) document.body.removeChild(container)
        throw err
      }
    }

    try {
      return await obtenerPDF(true)
    } catch (err1) {
      console.warn('[generarPDFBlob] Intento 1 fallido, reintentando sin logo:', err1)
      try {
        return await obtenerPDF(false)
      } catch (err2) {
        console.error('[generarPDFBlob] Error crítico al generar PDF:', err2)
        throw err2
      }
    }
  }, [negocio, formatFecha, formatGarantiaFecha, urlToBase64])

  /**
   * Convierte un Blob a string base64 puro (sin el prefijo data:...).
   * Necesario para Capacitor Filesystem, que espera base64 sin prefijo.
   */
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = () => reject(new Error('Error convirtiendo blob a base64'))
      reader.readAsDataURL(blob)
    })
  }, [])

  /**
   * Genera el HTML string de la orden.
   */
  const generarHTML = useCallback(async (orden: OrdenMantenimiento): Promise<string> => {
    let negocioProcesado = { ...negocio }

    if (negocio?.logoUrl && !negocio.logoUrl.startsWith('data:')) {
      const base64 = await urlToBase64(negocio.logoUrl)
      if (base64) {
        negocioProcesado = { ...negocio, logoUrl: base64 }
      } else {
        negocioProcesado = { ...negocio, logoUrl: null }
      }
    }
    return generarContenidoHTML(orden, negocioProcesado, formatFecha, formatGarantiaFecha)
  }, [negocio, formatFecha, formatGarantiaFecha, urlToBase64])

  /**
   * Descarga / guarda el PDF.
   */
  const descargarPDF = useCallback(async (orden: OrdenMantenimiento) => {
    try {
      const blob = await generarPDFBlob(orden)
      const filename = `Orden_${orden.idPersonalizado}.pdf`

      if (isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        const { FileOpener } = await import('@capacitor-community/file-opener')

        const base64Data = await blobToBase64(blob)

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
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error: any) {
      const isCanceled =
        !error ||
        error?.name === 'AbortError' ||
        error?.message?.toLowerCase().includes('canceled') ||
        error?.message?.toLowerCase().includes('cancelado') ||
        (typeof error === 'string' && error.toLowerCase().includes('canceled')) ||
        (typeof error === 'object' && Object.keys(error).length === 0)

      if (isCanceled) return

      console.error('Error al descargar PDF:', error)
      throw error
    }
  }, [generarPDFBlob, blobToBase64])

  /**
   * Comparte el PDF usando el sheet nativo o Web Share API.
   */
  const compartirOrden = useCallback(async (orden: OrdenMantenimiento) => {
    try {
      const blob = await generarPDFBlob(orden)
      const filename = `Orden_Mantenimiento_${orden.idPersonalizado}.pdf`

      if (isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        const { Share } = await import('@capacitor/share')

        const base64Data = await blobToBase64(blob)

        const result = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true
        })

        try {
          await Share.share({
            title: `Orden de Mantenimiento #${orden.idPersonalizado}`,
            text: `Orden de mantenimiento #${orden.idPersonalizado}`,
            url: result.uri,
            dialogTitle: 'Compartir Orden'
          })
        } catch (shareError: any) {
          const isCanceled =
            !shareError ||
            shareError?.name === 'AbortError' ||
            shareError?.message?.toLowerCase().includes('canceled') ||
            shareError?.message?.toLowerCase().includes('cancelado') ||
            (typeof shareError === 'string' && shareError.toLowerCase().includes('canceled')) ||
            (typeof shareError === 'object' && Object.keys(shareError).length === 0)

          if (isCanceled) return
          throw shareError
        }
      } else {
        const file = new File([blob], filename, { type: 'application/pdf' })
        const textoOrden = `Orden de mantenimiento #${orden.idPersonalizado} - ${orden.dispositivo?.marca || ''} ${orden.dispositivo?.modelo || ''}`

        const fallbackWebCompartir = async () => {
          await descargarPDF(orden)
          const telefono = orden.cliente?.phone ? orden.cliente.phone.replace(/\D/g, '') : ''
          const mensaje = encodeURIComponent(`Hola ${orden.cliente?.name || ''}, te adjunto la orden de mantenimiento #${orden.idPersonalizado}.\n\n(Nota: Por favor adjunta el PDF que se acaba de descargar)`)
          const waUrl = telefono ? `https://wa.me/${telefono}?text=${mensaje}` : `https://api.whatsapp.com/send?text=${mensaje}`
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
            console.warn('Web Share falló, usando fallback de WhatsApp...', shareErr)
            await fallbackWebCompartir()
          }
        } else {
          await fallbackWebCompartir()
        }
      }
    } catch (error: any) {
      const isCanceled =
        !error ||
        error?.name === 'AbortError' ||
        error?.message?.toLowerCase().includes('canceled') ||
        error?.message?.toLowerCase().includes('cancelado') ||
        (typeof error === 'string' && error.toLowerCase().includes('canceled')) ||
        (typeof error === 'object' && Object.keys(error).length === 0)

      if (isCanceled) return

      console.error('Error al compartir orden:', error)
    }
  }, [generarPDFBlob, blobToBase64, descargarPDF])

  /**
   * Imprime la orden.
   * En plataformas nativas redirige a compartir (el SO puede enviar a impresora).
   * En web abre ventana con diálogo de impresión.
   */
  const imprimirOrden = useCallback(async (orden: OrdenMantenimiento) => {
    if (isNativePlatform()) {
      await compartirOrden(orden)
    } else {
      let negocioProcesado = negocio
      if (negocio?.logoUrl && !negocio.logoUrl.startsWith('data:')) {
        try {
          const res = await fetch(negocio.logoUrl, { mode: 'cors' })
          const blob = await res.blob()
          const base64Url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
          negocioProcesado = { ...negocio, logoUrl: base64Url }
        } catch (err) {
          console.warn('Error al convertir logo a base64 para imprimir', err)
        }
      }

      const contenido = generarContenidoHTML(orden, negocioProcesado, formatFecha, formatGarantiaFecha)
      const ventana = window.open('', '_blank', 'width=800,height=600')

      if (!ventana) {
        alert('No se pudo abrir la ventana de impresión. Por favor, permite los pop-ups en este sitio.')
        return
      }

      ventana.document.open()
      ventana.document.write(contenido)
      ventana.document.close()

      const waitImages = () => {
        const images = ventana.document.getElementsByTagName('img')
        let loaded = 0
        if (images.length === 0) {
          ventana.focus()
          ventana.print()
          ventana.onafterprint = () => ventana.close()
          return
        }
        for (let i = 0; i < images.length; i++) {
          if (images[i].complete) {
            loaded++
          } else {
            images[i].onload = () => {
              loaded++
              if (loaded === images.length) {
                ventana.focus()
                ventana.print()
                ventana.onafterprint = () => ventana.close()
              }
            }
          }
        }
        if (loaded === images.length) {
          ventana.focus()
          ventana.print()
          ventana.onafterprint = () => ventana.close()
        }
      }

      ventana.onload = waitImages
    }
  }, [negocio, formatFecha, formatGarantiaFecha, compartirOrden])

  return {
    imprimirOrden,
    compartirOrden,
    descargarPDF,
    generarPDFBlob,
    generarHTML,
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
  variant?: 'table' | 'card' | 'icon'
}

export const PrintButton: React.FC<PrintButtonProps> = ({ orden, onPrint, variant = 'table' }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onPrint(orden)
  }

  if (variant === 'icon') {
    return (
      <button onClick={handleClick} className="p-2 rounded-lg hover:bg-green-500/10 text-green-400 transition-colors" aria-label="Imprimir orden">
        <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    )
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
  variant?: 'table' | 'card' | 'icon'
}

export const ShareButton: React.FC<ShareButtonProps> = ({ orden, onShare, variant = 'table' }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onShare(orden)
  }

  if (variant === 'icon') {
    return (
      <button onClick={handleClick} className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors" aria-label="Compartir orden">
        <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    )
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
  variant?: 'table' | 'card' | 'icon'
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ orden, onDownload, variant = 'table' }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDownload(orden)
  }

  if (variant === 'icon') {
    return (
      <button onClick={handleClick} className="p-2 rounded-lg hover:bg-purple-500/10 text-purple-400 transition-colors" aria-label="Descargar PDF">
        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    )
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