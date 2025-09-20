//garantia/page.tsx
'use client'
import { useState, useMemo, useCallback } from 'react'
import { OrdenDiagnostico } from '@/types/orden'
import { Plus, Search, Eye, Printer, ArrowLeft, Shield, X, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import FormularioMantenimiento from '@/app/(app)/ordenes/garantia/formulario'
import { useAuth } from '@/components/auth/AuthProvider'
import { useOrdenesUsuario } from '@/hooks/useMultiUser'
import { useNegocio } from '@/hooks/useNegocio'
import { NegocioHeader } from '@/components/business/headersNegocio'

// Componente para el modal de visualización
const ModalOrden = ({ orden, onClose, onPrint }: { orden: OrdenDiagnostico, onClose: () => void, onPrint: (orden: OrdenDiagnostico) => void }) => {
  if (!orden) return null;
// FUNCIÓN MEJORADA PARA MANEJAR TIMESTAMPS DE FIRESTORE
const formatFecha = (fecha: any) => {
  if (!fecha) return 'Fecha no disponible';
  
  try {
    // Si es un Timestamp de Firestore (tiene seconds y nanoseconds)
    if (fecha && typeof fecha === 'object' && 'seconds' in fecha && 'nanoseconds' in fecha) {
      return new Date(fecha.seconds * 1000 + fecha.nanoseconds / 1000000).toLocaleDateString();
    }
    // Si es un string de fecha ISO
    else if (typeof fecha === 'string') {
      return new Date(fecha).toLocaleDateString();
    }
    // Si ya es un objeto Date
    else if (fecha instanceof Date) {
      return fecha.toLocaleDateString();
    }
    // Si es un número (timestamp en milisegundos)
    else if (typeof fecha === 'number') {
      return new Date(fecha).toLocaleDateString();
    }
    else {
      return 'Formato de fecha no válido';
    }
  } catch (error) {
    console.error('Error formateando fecha:', error, fecha);
    return 'Fecha inválida';
  }
};
  const getTipoColor = (tipo: string) => {
    return tipo === 'preventivo' 
      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
      : 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-800 py-2">
          <h3 className="text-xl font-semibold text-white">Orden de Diagnostico #{orden.idPersonalizado}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
              <div className="space-y-2 text-sm text-gray-300">
                <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2">Fecha de orden</h4>
                  <p className="text-sm text-gray-300">
                  {formatFecha(orden.fechaCreacion)} {orden.horaReporte || ''}
                  </p>  
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2">Información del Cliente</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="font-medium text-gray-200">Nombre:</span> {orden.cliente?.name || 'N/A'}</p>
                <p><span className="font-medium text-gray-200">Cédula:</span> {orden.cliente?.cedula || 'N/A'}</p>
                <p><span className="font-medium text-gray-200">Teléfono:</span> {orden.cliente?.phone || 'N/A'}</p>
                <p><span className="font-medium text-gray-200">Email:</span> {orden.cliente?.email || 'N/A'}</p>
                <p><span className="font-medium text-gray-200">Dirección:</span> {orden.cliente?.address || 'N/A'}</p>
              </div>
            </div>
            
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2">Información del Dispositivo</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="font-medium text-gray-200">Tipo:</span> {orden.dispositivo?.tipo || 'N/A'}</p>
                <p><span className="font-medium text-gray-200">Marca/Modelo:</span> {orden.dispositivo?.marca || ''} {orden.dispositivo?.modelo || ''}</p>
                <p><span className="font-medium text-gray-200">Número de Serie:</span> {orden.dispositivo?.numeroSerie || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2">Acciones Tomadas</h4>
              {orden.accionesTomadas?.length > 0 ? (
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                  {orden.accionesTomadas.map((tarea, index) => (
                    <li key={index}>{tarea}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-gray-400">No se registraron tareas</p>
              )}
            </div>
            
            {orden.piezasUsadas && orden.piezasUsadas.length > 0 && (
              <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2">Piezas Utilizadas</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  {orden.piezasUsadas.map((pieza, index) => (
                    <li key={index}>
                      <span className="font-medium text-gray-200">{pieza.cantidad}x</span> {pieza.pieza}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
            <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2">Estado Inicial antes de la garantia</h4>
            {orden.estadoInicial?.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                {orden.estadoInicial.map((estado, index) => (
                  <li key={index}>{estado}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No se registró el estado inicial</p>
            )}
          </div>
          
          <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
            <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2">Estado Después de garantia</h4>
            {orden.estadoFinal?.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                {orden.estadoFinal.map((estado, index) => (
                  <li key={index}>{estado}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No se registró el estado final</p>
            )}
          </div>
        </div>
        
        <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 mb-6">
          <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2">Garantía</h4>
          <div className="text-sm text-gray-300">
            <p><span className="font-medium text-gray-200">Duración:</span> {orden.garantiaTiempo || 0} meses</p>
            <p><span className="font-medium text-gray-200">Descripción:</span> {orden.descripcionProblema || 'No se especificó el problema'}</p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <button
            onClick={() => onPrint(orden)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal
export default function OrdenesMantenimientoPage() {
  const { user, loading: authLoading } = useAuth()
  const { ordenes: todasLasOrdenes, loading, error, refrescarOrdenes } = useOrdenesUsuario()
  const { negocio, loading: loadingNegocio } = useNegocio()
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenGarantia | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)
  const elementosPorPagina = 10

  const ordenes = useMemo(() => {
    return todasLasOrdenes.filter(orden => orden.tipo === 'garantia') as OrdenGarantia[]
  }, [todasLasOrdenes])

  const handleRowClick = useCallback((orden: OrdenGarantia) => {
    setOrdenSeleccionada(orden);
  }, []);

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(orden => {
      const coincideBusqueda = 
        (orden.cliente?.phone?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
        (orden.cliente?.cedula?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
        (orden.cliente?.name?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
        (orden.dispositivo?.modelo?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
        (orden.dispositivo?.numeroSerie?.toLowerCase() || '').includes(busqueda.toLowerCase());
      
      const coincideTipo = filtroTipo === 'todos';
      
      return coincideBusqueda && coincideTipo;
    });
  }, [ordenes, busqueda, filtroTipo]);

  const totalPaginas = Math.ceil(ordenesFiltradas.length / elementosPorPagina);
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const ordenesPaginadas = ordenesFiltradas.slice(indiceInicio, indiceInicio + elementosPorPagina);

  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

const imprimirOrden = (orden: OrdenGarantia) => {
  const contenido = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Orden de Mantenimiento #${orden.idPersonalizado}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 40px; 
          background-color: #fff;
          color: #000;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .negocio-info {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          gap: 20px;
          flex-wrap: wrap;
        }
        .negocio-logo {
          max-width: 100px;
          max-height: 100px;
          object-fit: contain;
        }
        .negocio-details {
          text-align: center;
        }
        .negocio-details h1 {
          margin: 0;
          font-size: 24px;
          color: #000;
        }
        .negocio-details p {
          margin: 5px 0;
          font-size: 14px;
          color: #666;
        }
        .orden-info {
          margin-top: 15px;
        }
        .orden-info h2 {
          margin: 0;
          font-size: 20px;
          color: #000;
        }
        .orden-info p {
          margin: 5px 0;
          color: #666;
        }
        .section { 
          margin-bottom: 20px; 
          page-break-inside: avoid;
        }
        .section h2 { 
          border-bottom: 1px solid #333; 
          padding-bottom: 5px; 
          margin-bottom: 10px;
          font-size: 18px;
          color: #000;
        }
        .flex-container { 
          display: flex; 
          justify-content: space-between; 
          gap: 20px;
          flex-wrap: wrap;
        }
        .cliente, .dispositivo { 
          width: 48%; 
          min-width: 300px;
          flex: 1;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px; 
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left; 
        }
        th { 
          background-color: #f5f5f5; 
        }
        .badge { 
          padding: 3px 8px; 
          border-radius: 12px; 
          font-size: 12px; 
          font-weight: bold; 
        }
        .preventivo { 
          background-color: #d1fae5; 
          color: #065f46; 
        }
        .correctivo { 
          background-color: #ffedd5; 
          color: #9a3412; 
        }
        .no-print {
          display: block; /* visible normalmente */
          text-align: center;
          margin-top: 30px;
        }
        @media print {
          .no-print { display: none; } /* ocultar en impresión */
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
          <p>Fecha: ${formatFecha(orden.fechaReporte)} ${orden.horaReporte || ''}</p>
        </div>
      </div>

      <div class="flex-container">
        <div class="cliente section">
          <h2>Información del Cliente</h2>
          <p><strong>Nombre:</strong> ${orden.cliente?.name || 'N/A'}</p>
          <p><strong>Teléfono:</strong> ${orden.cliente?.phone || 'N/A'}</p>
          <p><strong>Cédula:</strong> ${orden.cliente?.cedula || 'N/A'}</p>
          <p><strong>Email:</strong> ${orden.cliente?.email || 'N/A'}</p>
          <p><strong>Dirección:</strong> ${orden.cliente?.address || 'N/A'}</p>
        </div>

        <div class="dispositivo section">
          <h2>Información del Dispositivo</h2>
          <p><strong>Tipo:</strong> ${orden.dispositivo?.tipo || 'N/A'}</p>
          <p><strong>Marca/Modelo:</strong> ${orden.dispositivo?.marca || ''} ${orden.dispositivo?.modelo || ''}</p>
          <p><strong>Número de Serie:</strong> ${orden.dispositivo?.numeroSerie || 'N/A'}</p>

        </div>
      </div>

      <div class="section">
        <h2>Reparaciones Realizadas</h2>
        ${(orden.reparacionesRealizadas ?? []).length > 0 ?`
          <ol>
            ${(orden.reparacionesRealizadas ?? []).map(tarea => `<li>${tarea}</li>`).join('')}
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

      <div class="flex-container">
        <div class="section">
          <h2>Estado Antes de la Garantia</h2>
          ${orden.estadoInicial?.length > 0 ? `
            <ul>
              ${orden.estadoInicial.map(estado => `<li>${estado}</li>`).join('')}
            </ul>
          ` : '<p>No se registró estado inicial</p>'}
        </div>

        <div class="section">
          <h2>Estado Después del Mantenimiento</h2>
          ${orden.estadoFinal?.length > 0 ? `
            <ul>
              ${orden.estadoFinal.map(estado => `<li>${estado}</li>`).join('')}
            </ul>
          ` : '<p>No se registró estado final</p>'}
        </div>
      </div>

      <div class="section">
        <h2>Garantía</h2>
        <p><strong>Duración:</strong> ${orden.garantiaTiempo || 0} meses</p>
        <p><strong>Descripción:</strong> ${orden.garantiaDescripcion || 'No se especificó garantía'}</p>
      </div>

      <div class="no-print">
        <button onclick="window.print()" 
          style="padding: 10px 20px; background: #065f46; color: white; border: none; border-radius: 5px; cursor: pointer;">
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
  };
};

  if (mostrarFormulario) {
    return (
      <FormularioMantenimiento
        onClose={() => setMostrarFormulario(false)}
        onSuccess={() => {
          setMostrarFormulario(false);
          refrescarOrdenes(); 
        }}
      />
    );
  }

  // Mostrar loading si está cargando auth o datos
  if (authLoading || (loading && user?.uid)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-400">Cargando órdenes...</p>
        </div>
      </div>
    )
  }

  // Mostrar mensaje si no hay usuario autenticado
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Debes iniciar sesión para acceder a esta página.</p>
        </div>
      </div>
    )
  }

  const formatFecha = (fecha: any) => {
  if (!fecha) return 'Fecha no disponible';
  
  try {
    // Si es un Timestamp de Firestore (tiene seconds y nanoseconds)
    if (fecha && typeof fecha === 'object' && 'seconds' in fecha && 'nanoseconds' in fecha) {
      return new Date(fecha.seconds * 1000 + fecha.nanoseconds / 1000000).toLocaleDateString();
    }
    // Si es un string de fecha ISO
    else if (typeof fecha === 'string') {
      return new Date(fecha).toLocaleDateString();
    }
    // Si ya es un objeto Date
    else if (fecha instanceof Date) {
      return fecha.toLocaleDateString();
    }
    // Si es un número (timestamp en milisegundos)
    else if (typeof fecha === 'number') {
      return new Date(fecha).toLocaleDateString();
    }
    else {
      return 'Formato de fecha no válido';
    }
  } catch (error) {
    console.error('Error formateando fecha:', error, fecha);
    return 'Fecha inválida';
  }
};

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <NegocioHeader 
          negocio={negocio}
          titulo="Órdenes de Garantía"
          subtitulo="Gestión de órdenes de garantía para tus clientes"
        />
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link 
                href="/ordenes" 
                className="text-blue-400 hover:text-blue-300 self-start sm:self-auto transition-colors"
                aria-label="Volver a órdenes"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div className="flex items-start sm:items-center gap-3">
                <Shield className="w-8 h-8 text-blue-400 flex-shrink-0" />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Órdenes de Garantía</h1>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Aquí puedes gestionar todas las órdenes de garantía registradas en el sistema.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 self-start sm:self-auto transition-colors shadow-md hover:shadow-lg w-full sm:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm sm:text-base">Nueva Orden</span>
            </button>
          </div>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
            <button 
              onClick={refrescarOrdenes}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Controles de búsqueda y filtros */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, cédula, teléfono, modelo o número de serie..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="w-full md:w-auto bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors border border-gray-600"
              >
                <Filter className="w-4 h-4" />
                <span>Filtrar</span>
                {mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {mostrarFiltros && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-10 p-3 border border-gray-700">
                  <p className="text-sm font-medium text-gray-300 mb-2">Tipo de mantenimiento</p>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="tipoFiltro"
                        value="todos"
                        checked={filtroTipo === 'todos'}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">Todos</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="tipoFiltro"
                        value="preventivo"
                        checked={filtroTipo === 'preventivo'}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">Preventivo</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="tipoFiltro"
                        value="correctivo"
                        checked={filtroTipo === 'correctivo'}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">Correctivo</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Órdenes */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-400">Cargando órdenes...</p>
            </div>
          ) : ordenesFiltradas.length === 0 ? (
            <div className="p-8 text-center">
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {busqueda || filtroTipo !== 'todos' 
                  ? 'No se encontraron órdenes que coincidan con los criterios de búsqueda' 
                  : 'No hay órdenes de garantía'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {busqueda || filtroTipo !== 'todos' 
                  ? 'Intente con otros términos o elimine los filtros' 
                  : 'Crea la primera orden haciendo clic en "Nueva Orden"'}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-blue-20 to-indigo-10 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Dispositivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                    {ordenesPaginadas.map((orden) => (
                      <tr 
                        key={orden.idPersonalizado} 
                        className="hover:bg-gray-700/50 cursor-pointer transition-colors"
                        onClick={() => handleRowClick(orden)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{orden.cliente?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-400">{orden.cliente?.phone || 'Sin teléfono'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{orden.dispositivo?.marca || ''} {orden.dispositivo?.modelo || ''}</div>
                          <div className="text-sm text-gray-400">S/N: {orden.dispositivo?.numeroSerie || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                           {formatFecha(orden.fechaCreacion)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(orden);
                              }}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/20 transition-colors"
                              aria-label="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                imprimirOrden(orden);
                              }}
                              className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-green-500/20 transition-colors"
                              aria-label="Imprimir orden"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="px-6 py-4 bg-gray-700 border-t border-gray-600 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Mostrando <span className="font-medium text-white">{indiceInicio + 1}</span> a{' '}
                    <span className="font-medium text-white">
                      {Math.min(indiceInicio + elementosPorPagina, ordenesFiltradas.length)}
                    </span> de{' '}
                    <span className="font-medium text-white">{ordenesFiltradas.length}</span> resultados
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => cambiarPagina(paginaActual - 1)}
                      disabled={paginaActual === 1}
                      className="px-3 py-1 rounded-md border border-gray-600 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => cambiarPagina(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                      className="px-3 py-1 rounded-md border border-gray-600 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 hover:shadow-lg transition-shadow" >
            <div className="flex items-center">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Total Órdenes de garantía</p>
                <p className="text-2xl font-bold text-blue-400">{ordenes.length}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Modal de Visualización */}
        {ordenSeleccionada && (
          <ModalOrden 
            orden={ordenSeleccionada} 
            onClose={() => setOrdenSeleccionada(null)} 
            onPrint={imprimirOrden}
          />
        )}
      </div>
    </div>
  );
}