// ModalOrden.tsx - Versión Fluida con Sticky

import { OrdenMantenimiento } from "@/types/orden";
import { X, Calendar, Clock, Printer, Wrench, AlertCircle } from "lucide-react";
import { useCallback, useMemo, memo, useEffect, useRef } from "react";

// ============================================================================
// CONSTANTES Y TIPOS
// ============================================================================

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
} as const;

const DEFAULT_TEXTS = {
  noDate: 'Fecha no disponible',
  invalidDate: 'Fecha inválida',
  noTasks: 'No se registraron tareas',
  notAvailable: 'N/A',
  noParts: 'No se utilizaron piezas',
  noCounter: 'No se registró contador'
} as const;

const TIPO_COLORS = {
  preventivo: 'bg-green-500/20 text-green-400 border-green-500/30',
  correctivo: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  diagnostico: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  default: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
} as const;

const UNIDAD_LABELS: Record<string, string> = {
  unidades: 'unidades',
  copias: 'copias',
  impresiones: 'impresiones',
  horas: 'horas',
  kilometros: 'kilómetros'
} as const;

// ============================================================================
// UTILIDADES OPTIMIZADAS
// ============================================================================

const formatDate = (fecha: unknown): string => {
  if (!fecha) return DEFAULT_TEXTS.noDate;
  
  try {
    const date = fecha && typeof fecha === 'object' && 'seconds' in fecha
      ? new Date((fecha as any).seconds * 1000)
      : new Date(fecha as any);
    
    return isNaN(date.getTime()) 
      ? DEFAULT_TEXTS.invalidDate 
      : date.toLocaleDateString('es-ES', DATE_FORMAT_OPTIONS);
  } catch {
    return DEFAULT_TEXTS.invalidDate;
  }
};

const getTipoColor = (tipo: string): string => 
  TIPO_COLORS[tipo as keyof typeof TIPO_COLORS] || TIPO_COLORS.default;

const getUnidadLabel = (tipo: string, unidadPersonalizada?: string): string => 
  tipo === 'personalizado' && unidadPersonalizada 
    ? unidadPersonalizada 
    : UNIDAD_LABELS[tipo] || tipo;

// ============================================================================
// COMPONENTES BÁSICOS
// ============================================================================

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center py-4 text-gray-500">
    <AlertCircle className="w-4 h-4 mr-2" />
    <p className="text-sm">{message}</p>
  </div>
);

const InfoField = ({ 
  label, 
  value, 
  fallback = DEFAULT_TEXTS.notAvailable 
}: { 
  label: string; 
  value?: string | null;
  fallback?: string;
}) => (
  <p className="text-sm">
    <span className="font-medium text-gray-200">{label}:</span>{' '}
    <span className="text-gray-300">{value || fallback}</span>
  </p>
);

const InfoSection = ({ 
  title, 
  icon: Icon, 
  children,
  className = ""
}: { 
  title: string; 
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={`bg-gray-700/30 p-4 rounded-xl border border-gray-600/50 ${className}`}>
    <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-3 flex items-center">
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {title}
    </h4>
    {children}
  </section>
);

// ============================================================================
// COMPONENTES COMPLEJOS
// ============================================================================

const ModalHeader = ({ 
  idPersonalizado, 
  tipoMantenimiento,
  onClose 
}: { 
  idPersonalizado: string;
  tipoMantenimiento: string;
  onClose: () => void;
}) => (
  <header className="flex justify-between items-start mb-4 sticky top-0 bg-gray-800/98 py-3 z-20 border-b border-gray-700/50 -mx-4 sm:-mx-6 px-4 sm:px-6">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-2">
        <Wrench className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <h3 className="text-xl font-semibold text-white truncate">
          Orden #{idPersonalizado}
        </h3>
      </div>
      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border capitalize ${getTipoColor(tipoMantenimiento)}`}>
        {tipoMantenimiento}
      </span>
    </div>
    <button
      onClick={onClose}
      className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors ml-2 flex-shrink-0"
      aria-label="Cerrar modal"
    >
      <X className="w-6 h-6" />
    </button>
  </header>
);

const TareasList = ({ tareasRealizadas }: { tareasRealizadas?: string[] }) => {
  if (!tareasRealizadas?.length) return <EmptyState message={DEFAULT_TEXTS.noTasks} />;

  return (
    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
      {tareasRealizadas.map((tarea, idx) => (
        <li key={idx} className="pl-2 py-1">{tarea}</li>
      ))}
    </ol>
  );
};

const PiezasList = ({ piezasUsadas }: { 
  piezasUsadas?: Array<{ cantidad: number; pieza: string }> 
}) => {
  if (!piezasUsadas?.length) return <EmptyState message={DEFAULT_TEXTS.noParts} />;

  return (
    <ul className="space-y-2 text-sm">
      {piezasUsadas.map((pieza, idx) => (
        <li 
          key={idx}
          className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-600/30"
        >
          <span className="text-gray-300 flex-1">{pieza.pieza}</span>
          <span className="font-medium text-blue-400 ml-3">x{pieza.cantidad}</span>
        </li>
      ))}
    </ul>
  );
};

const DiagnosticoInfo = ({ 
  observacionesIniciales,
  pruebasRealizadas,
  diagnosticoFinal,
  contadorMaquina
}: {
  observacionesIniciales?: string;
  pruebasRealizadas?: string;
  diagnosticoFinal?: string;
  contadorMaquina?: number;
}) => (
  <div className="space-y-4">
    {observacionesIniciales && (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Observaciones Iniciales
        </p>
        <p className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg border border-gray-600/30">
          {observacionesIniciales}
        </p>
      </div>
    )}
    
    {pruebasRealizadas && (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Pruebas Realizadas
        </p>
        <p className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg border border-gray-600/30">
          {pruebasRealizadas}
        </p>
      </div>
    )}
    
    {diagnosticoFinal && (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Diagnóstico Final
        </p>
        <p className="text-sm text-gray-300 bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
          {diagnosticoFinal}
        </p>
      </div>
    )}
    
    {contadorMaquina != null && (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Contador de Máquina
        </p>
        <p className="text-2xl font-bold text-purple-400">
          {contadorMaquina.toLocaleString()} unidades
        </p>
      </div>
    )}
  </div>
);

const ContadorInfo = ({ contador }: { contador?: any }) => {
  if (!contador) return <EmptyState message={DEFAULT_TEXTS.noCounter} />;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline space-x-3">
        <span className="text-4xl font-bold text-amber-400">
          {contador.valor?.toLocaleString() ?? '0'}
        </span>
        <span className="text-lg text-gray-400 capitalize">
          {getUnidadLabel(contador.tipo, contador.unidadPersonalizada)}
        </span>
      </div>
      
      {contador.fechaRegistro && (
        <p className="text-sm text-gray-400">
          Registrado: {formatDate(contador.fechaRegistro)}
        </p>
      )}
      
      {contador.notas && (
        <div className="pt-3 border-t border-gray-600">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Notas
          </p>
          <p className="text-sm text-gray-300">{contador.notas}</p>
        </div>
      )}
    </div>
  );
};

const ClienteInfo = ({ cliente }: { cliente?: any }) => (
  <InfoSection title="Información del Cliente">
    <div className="space-y-2">
      <InfoField label="Nombre" value={cliente?.name} />
      <InfoField label="Cédula" value={cliente?.cedula} />
      <InfoField label="Teléfono" value={cliente?.phone} />
      <InfoField label="Email" value={cliente?.email} />
      <InfoField label="Dirección" value={cliente?.address} />
    </div>
  </InfoSection>
);

const DispositivoInfo = ({ dispositivo }: { dispositivo?: any }) => {
  const marcaModelo = `${dispositivo?.marca || ''} ${dispositivo?.modelo || ''}`.trim() || undefined;

  return (
    <InfoSection title="Información del Dispositivo">
      <div className="space-y-2">
        <InfoField label="Tipo" value={dispositivo?.tipo} />
        <InfoField label="Marca/Modelo" value={marcaModelo} />
        <InfoField label="Número de Serie" value={dispositivo?.numeroSerie} />
      </div>
    </InfoSection>
  );
};

const GarantiaInfo = ({ 
  garantiaDescripcion,
  garantiaDesde,
  garantiaHasta
}: {
  garantiaDescripcion?: string;
  garantiaDesde?: string;
  garantiaHasta?: string;
}) => (
  <InfoSection title="Garantía" icon={Clock}>
    <div className="space-y-3">
      {garantiaDescripcion && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Descripción
          </p>
          <p className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg border border-gray-600/30">
            {garantiaDescripcion}
          </p>
        </div>
      )}
      
      {(garantiaDesde || garantiaHasta) && (
        <div className="grid grid-cols-2 gap-3">
          {garantiaDesde && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Desde
              </p>
              <p className="text-sm text-gray-300">{garantiaDesde}</p>
            </div>
          )}
          {garantiaHasta && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Hasta
              </p>
              <p className="text-sm text-gray-300">{garantiaHasta}</p>
            </div>
          )}
        </div>
      )}
    </div>
  </InfoSection>
);

const ModalFooter = ({ 
  onPrint, 
  onDownload,
  onClose 
}: { 
  onPrint: () => void; 
  onDownload?: () => void;
  onClose: () => void;
}) => (
  <footer className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-700 sticky bottom-0 bg-gray-800/98 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-6 z-20">
    <div className="flex flex-col sm:flex-row gap-2 order-2 sm:order-1 sm:mr-auto">
      <button
        onClick={onClose}
        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
      >
        Cerrar
      </button>
    </div>
    
    <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
      {onDownload && (
        <button
          onClick={onDownload}
          className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
          aria-label="Descargar orden en PDF"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          <span className="font-medium">Descargar PDF</span>
        </button>
      )}
      <button
        onClick={onPrint}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto font-medium"
        aria-label="Imprimir orden"
      >
        <Printer className="w-4 h-4 flex-shrink-0" />
        <span>Imprimir</span>
      </button>
    </div>
  </footer>
);

// ============================================================================
// HOOKS PERSONALIZADOS
// ============================================================================

const useModalData = (orden: OrdenMantenimiento) => {
  return useMemo(() => {
    const {
      idPersonalizado,
      fechaCreacion,
      horaCreacion,
      cliente,
      dispositivo,
      tareasRealizadas = [],
      piezasUsadas = [],
      garantiaDescripcion,
      tipoMantenimiento,
      garantiaTiempoDesde,
      garantiaTiempoHasta,
      observacionesIniciales,
      pruebasRealizadas,
      diagnosticoFinal,
      contadorMaquina,
      contador
    } = orden;

    return {
      idPersonalizado,
      horaCreacion,
      cliente,
      dispositivo,
      tareasRealizadas,
      piezasUsadas,
      garantiaDescripcion,
      tipoMantenimiento,
      observacionesIniciales,
      pruebasRealizadas,
      diagnosticoFinal,
      contadorMaquina,
      contador,
      fechaCreacion: formatDate(fechaCreacion),
      garantiaDesde: formatDate(garantiaTiempoDesde),
      garantiaHasta: formatDate(garantiaTiempoHasta),
      hasPiezas: piezasUsadas.length > 0,
      hasGarantia: !!(garantiaDescripcion || garantiaTiempoDesde || garantiaTiempoHasta),
      hasContador: !!contador,
      esDiagnostico: tipoMantenimiento === 'diagnostico'
    };
  }, [orden]);
};

const useAndroidBackButton = (onClose: () => void, isOpen: boolean) => {
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isOpen) return;

    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }

    window.history.pushState({ modalOpen: true }, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      
      cleanupTimeoutRef.current = setTimeout(() => {
        if (window.history.state?.modalOpen) {
          window.history.back();
        }
      }, 50);
    };
  }, [onClose, isOpen]);
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const ModalOrden = ({ 
  orden, 
  onClose, 
  onPrint,
  onDownload
}: { 
  orden: OrdenMantenimiento; 
  onClose: () => void; 
  onPrint: (orden: OrdenMantenimiento) => void;
  onDownload?: (orden: OrdenMantenimiento) => void;
}) => {
  if (!orden) return null;

  const data = useModalData(orden);
  
  useAndroidBackButton(onClose, true);

  const handlePrint = useCallback(() => onPrint(orden), [onPrint, orden]);
  const handleDownload = useCallback(() => {
    if (onDownload) onDownload(orden);
  }, [onDownload, orden]);
  
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-gray-800 border border-gray-700/50 rounded-xl p-4 sm:p-6 max-w-4xl w-full max-h-[95vh] overflow-y-auto will-change-scroll"
      >
        <ModalHeader 
          idPersonalizado={data.idPersonalizado}
          tipoMantenimiento={data.tipoMantenimiento}
          onClose={onClose} 
        />
        
        <main className="space-y-4">
          <InfoSection title="Fecha de Orden" icon={Calendar}>
            <p className="text-sm text-gray-300">
              {data.fechaCreacion} {data.horaCreacion || ''}
            </p>
          </InfoSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <ClienteInfo cliente={data.cliente} />
              <DispositivoInfo dispositivo={data.dispositivo} />
            </div>
            
            <div className="space-y-4">
              {data.esDiagnostico ? (
                <InfoSection title="Diagnóstico Realizado">
                  <DiagnosticoInfo 
                    observacionesIniciales={data.observacionesIniciales}
                    pruebasRealizadas={data.pruebasRealizadas}
                    diagnosticoFinal={data.diagnosticoFinal}
                    contadorMaquina={data.contadorMaquina}
                  />
                </InfoSection>
              ) : (
                <>
                  <InfoSection title="Tareas Realizadas">
                    <TareasList tareasRealizadas={data.tareasRealizadas} />
                  </InfoSection>
                  
                  {data.hasPiezas && (
                    <InfoSection title="Piezas Utilizadas">
                      <PiezasList piezasUsadas={data.piezasUsadas} />
                    </InfoSection>
                  )}
                </>
              )}
            </div>
          </div>

          {data.hasContador && (
            <InfoSection title="Contador Registrado" icon={Clock}>
              <ContadorInfo contador={data.contador} />
            </InfoSection>
          )}
          
          {data.hasGarantia && (
            <GarantiaInfo 
              garantiaDescripcion={data.garantiaDescripcion}
              garantiaDesde={data.garantiaDesde}
              garantiaHasta={data.garantiaHasta}
            />
          )}
        </main>
        
        <ModalFooter onPrint={handlePrint} onDownload={handleDownload} onClose={onClose} />
      </div>
    </div>
  );
};

export default memo(ModalOrden);