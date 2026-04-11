'use client'
import { useCallback } from 'react'
import { OrdenMantenimiento } from '@/types/orden'
import { Printer } from 'lucide-react'

interface PrintServiceProps {
  negocio: any
}

export const usePrintService = ({ negocio }: PrintServiceProps) => {
  // Función para formatear fechas
  const formatFecha = useCallback((fecha: any) => {
    if (!fecha) return 'Fecha no disponible';

    try {
      if (fecha && typeof fecha === 'object' && 'seconds' in fecha && 'nanoseconds' in fecha) {
        return new Date(fecha.seconds * 1000 + fecha.nanoseconds / 1000000).toLocaleDateString();
      } else if (typeof fecha === 'string') {
        return new Date(fecha).toLocaleDateString();
      } else if (fecha instanceof Date) {
        return fecha.toLocaleDateString();
      } else if (typeof fecha === 'number') {
        return new Date(fecha).toLocaleDateString();
      } else {
        return 'Formato de fecha no válido';
      }
    } catch (error) {
      console.error('Error formateando fecha:', error, fecha);
      return 'Fecha inválida';
    }
  }, [])

  // Función para formatear fechas de garantía
  const formatGarantiaFecha = useCallback((fecha: any) => {
    if (!fecha) return 'No especificada';

    try {
      if (fecha && typeof fecha === 'object' && 'seconds' in fecha && 'nanoseconds' in fecha) {
        return new Date(fecha.seconds * 1000 + fecha.nanoseconds / 1000000).toLocaleDateString();
      } else if (typeof fecha === 'string') {
        return new Date(fecha).toLocaleDateString();
      } else if (fecha instanceof Date) {
        return fecha.toLocaleDateString();
      } else if (typeof fecha === 'number') {
        return new Date(fecha).toLocaleDateString();
      } else {
        return 'Fecha inválida';
      }
    } catch (error) {
      console.error('Error formateando fecha de garantía:', error, fecha);
      return 'Fecha inválida';
    }
  }, [])

  // Función principal de impresión
  const imprimirOrden = useCallback((orden: OrdenMantenimiento) => {
    const contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orden de Mantenimiento #${orden.idPersonalizado}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background-color: #fff;
            color: #000;
            font-size: 14px;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .negocio-info {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
            gap: 15px;
            flex-wrap: wrap;
          }
          .negocio-logo {
            max-width: 80px;
            max-height: 80px;
            object-fit: contain;
          }
          .negocio-details {
            text-align: center;
          }
          .negocio-details h1 {
            margin: 0;
            font-size: 20px;
            color: #000;
          }
          .negocio-details p {
            margin: 3px 0;
            font-size: 12px;
            color: #666;
          }
          .orden-info {
            margin-top: 10px;
          }
          .orden-info h2 {
            margin: 0;
            font-size: 18px;
            color: #000;
          }
          .orden-info p {
            margin: 3px 0;
            color: #666;
            font-size: 12px;
          }
          .section { 
            margin-bottom: 15px; 
            page-break-inside: avoid;
          }
          .section h2 { 
            border-bottom: 1px solid #333; 
            padding-bottom: 3px; 
            margin-bottom: 8px;
            font-size: 16px;
            color: #000;
          }
          .flex-container { 
            display: flex; 
            justify-content: space-between; 
            gap: 15px;
            flex-wrap: wrap;
          }
          .cliente, .dispositivo { 
            width: 100%; 
            min-width: 250px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            border-bottom: 1px dotted #ddd;
            margin-bottom: 3px;
          }
          .info-label {
            font-weight: bold;
            color: #333;
            flex-shrink: 0;
            margin-right: 10px;
          }
          .info-value {
            text-align: right;
            word-break: break-word;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 8px; 
            font-size: 12px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 6px; 
            text-align: left; 
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: bold;
          }
          .badge { 
            padding: 2px 6px; 
            border-radius: 10px; 
            font-size: 10px; 
            font-weight: bold; 
            display: inline-block;
          }
          .preventivo { 
            background-color: #d1fae5; 
            color: #065f46; 
          }
          .correctivo { 
            background-color: #ffedd5; 
            color: #9a3412; 
          }
          .tasks-list {
            padding-left: 18px;
          }
          .tasks-list li {
            margin-bottom: 5px;
            line-height: 1.3;
          }
          .no-print {
            display: block;
            text-align: center;
            margin-top: 20px;
          }
          
          @media (min-width: 600px) {
            body { margin: 40px; font-size: 14px; }
            .cliente, .dispositivo { width: 48%; }
            .negocio-logo { max-width: 100px; max-height: 100px; }
            .negocio-details h1 { font-size: 24px; }
            .negocio-details p { font-size: 14px; }
            .orden-info h2 { font-size: 20px; }
            .section h2 { font-size: 18px; }
            table { font-size: 14px; }
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
        <!-- Encabezado con información del negocio -->
        <div class="header">
          <div class="negocio-info">
            ${negocio?.logoUrl ? `
              <img src="${negocio.logoUrl}" alt="${negocio.nombre}" class="negocio-logo">
            ` : ''}
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
            <div class="info-row">
              <span class="info-label">Nombre:</span>
              <span class="info-value">${orden.cliente?.name || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Teléfono:</span>
              <span class="info-value">${orden.cliente?.phone || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Cédula:</span>
              <span class="info-value">${orden.cliente?.cedula || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${orden.cliente?.email || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Dirección:</span>
              <span class="info-value">${orden.cliente?.address || 'N/A'}</span>
            </div>
          </div>

          <div class="dispositivo section">
            <h2>Información del Dispositivo</h2>
            <div class="info-row">
              <span class="info-label">Tipo:</span>
              <span class="info-value">${orden.dispositivo?.tipo || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Marca/Modelo:</span>
              <span class="info-value">${orden.dispositivo?.marca || ''} ${orden.dispositivo?.modelo || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Número de Serie:</span>
              <span class="info-value">${orden.dispositivo?.numeroSerie || 'N/A'}</span>
            </div>
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
          ${orden.tareasRealizadas?.length > 0 ? `
            <ol class="tasks-list">
              ${orden.tareasRealizadas.map(tarea => `<li>${tarea}</li>`).join('')}
            </ol>
          ` : '<p>No se registraron tareas</p>'}
        </div>

        ${orden.piezasUsadas && orden.piezasUsadas.length > 0 ? `
        <div class="section">
          <h2>Piezas Utilizadas</h2>
          <table>
            <thead>
              <tr>
                <th>Pieza</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              ${orden.piezasUsadas.map(pieza => `
                <tr>
                  <td>${pieza.pieza}</td>
                  <td>${pieza.cantidad}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="section">
          <h2>Garantía</h2>
          <div class="info-row">
            <span class="info-label">Desde:</span>
            <span class="info-value">${formatGarantiaFecha(orden.garantiaTiempoDesde)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Hasta:</span>
            <span class="info-value">${formatGarantiaFecha(orden.garantiaTiempoHasta)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Descripción:</span>
            <span class="info-value">${orden.garantiaDescripcion || 'No se especificó garantía'}</span>
          </div>
        </div>

        <div class="no-print">
          <button onclick="window.print()" 
            style="padding: 8px 16px; background: #065f46; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
            Imprimir
          </button>
        </div>
      </body>
      </html>
    `;

    // Crear un iframe oculto
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // Escribir el contenido en el iframe
    const doc = iframe.contentWindow!.document;
    doc.open();
    doc.write(contenido);
    doc.close();

    // Esperar un poco y lanzar impresión
    iframe.onload = () => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      // Limpiar el iframe después de imprimir
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  }, [negocio, formatFecha, formatGarantiaFecha])

  return {
    imprimirOrden,
    formatFecha,
    formatGarantiaFecha
  }
}

// Componente de botón de impresión reutilizable
interface PrintButtonProps {
  orden: OrdenMantenimiento
  onPrint: (orden: OrdenMantenimiento) => void
  variant?: 'table' | 'card'
}

export const PrintButton: React.FC<PrintButtonProps> = ({
  orden,
  onPrint,
  variant = 'table'
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPrint(orden);
  };

  if (variant === 'card') {
    return (
      <button
        onClick={handleClick}
        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
      >
        <Printer className="w-4 h-4" />
        <span>Imprimir</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-green-500/20 transition-colors"
      aria-label="Imprimir orden"
    >
      <Printer className="w-4 h-4" />
    </button>
  );
};