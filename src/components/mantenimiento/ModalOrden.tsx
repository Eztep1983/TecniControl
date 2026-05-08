// ModalOrden.tsx - Versión Fluida con Sticky + UX Mejorada

import { OrdenMantenimiento } from "@/types/orden";
import { X, Calendar, Clock, Printer, Wrench, AlertCircle, Share2, Copy, Check, CheckCircle } from "lucide-react";
import { useCallback, useMemo, memo, useEffect, useRef, useState, useId } from "react";

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
  instalacion: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  garantia: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
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
// COMPONENTES BÁSICOS MEMOIZADOS
// ============================================================================

const EmptyState = memo(({ message }: { message: string }) => (
  <div className="flex items-center justify-center py-6 text-gray-400 bg-gray-800/30 rounded-lg border border-gray-700/50">
    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
    <p className="text-sm">{message}</p>
  </div>
));

EmptyState.displayName = 'EmptyState';

const InfoField = memo(({ 
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
));

InfoField.displayName = 'InfoField';

const InfoSection = memo(({ 
  title, 
  icon: Icon, 
  children,
  className = ""
}: { 
  title: string; 
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) => {
  const sectionId = useId();
  return (
    <section 
      aria-labelledby={sectionId}
      className={`bg-gray-700/30 p-4 rounded-xl border border-gray-600/50 ${className}`}
    >
      <h4 id={sectionId} className="font-semibold text-white border-b border-gray-600 pb-2 mb-3 flex items-center">
        {Icon && <Icon className="w-4 h-4 mr-2" />}
        {title}
      </h4>
      {children}
    </section>
  );
});

InfoSection.displayName = 'InfoSection';

// ============================================================================
// COMPONENTES COMPLEJOS MEMOIZADOS
// ============================================================================

const ModalHeader = memo(({ 
  idPersonalizado, 
  tipoMantenimiento,
  onCopyId,
  onClose 
}: { 
  idPersonalizado: string;
  tipoMantenimiento: string;
  onCopyId: () => void;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    onCopyId();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopyId]);

  return (
    <header className="flex justify-between items-start mb-4 sticky top-0 bg-gray-800/95 backdrop-blur-sm py-3 z-20 border-b border-gray-700/50 -mx-4 sm:-mx-6 px-4 sm:px-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <Wrench className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <h3 className="text-xl font-semibold text-white truncate">
            Orden #{idPersonalizado}
          </h3>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-700 transition-colors"
            aria-label="Copiar ID de la orden"
            title="Copiar ID"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
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
});

ModalHeader.displayName = 'ModalHeader';

const TareasList = memo(({ tareasRealizadas }: { tareasRealizadas?: string[] }) => {
  if (!tareasRealizadas?.length) return <EmptyState message={DEFAULT_TEXTS.noTasks} />;

  return (
    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
      {tareasRealizadas.map((tarea, idx) => (
        <li key={idx} className="pl-2 py-1 leading-relaxed">{tarea}</li>
      ))}
    </ol>
  );
});

TareasList.displayName = 'TareasList';

const PiezasList = memo(({ piezasUsadas }: { 
  piezasUsadas?: Array<{ cantidad: number; pieza: string }> 
}) => {
  if (!piezasUsadas?.length) return <EmptyState message={DEFAULT_TEXTS.noParts} />;

  return (
    <ul className="space-y-2 text-sm">
      {piezasUsadas.map((pieza, idx) => (
        <li 
          key={idx}
          className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-600/30 hover:bg-gray-700/50 transition-colors"
        >
          <span className="text-gray-300 flex-1 break-words mr-3">{pieza.pieza}</span>
          <span className="font-medium text-blue-400 whitespace-nowrap">x{pieza.cantidad}</span>
        </li>
      ))}
    </ul>
  );
});

PiezasList.displayName = 'PiezasList';

const DiagnosticoInfo = memo(({ 
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
  <div className="space-y-5">
    {observacionesIniciales && (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Observaciones Iniciales
        </p>
        <p className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg border border-gray-600/30 leading-relaxed">
          {observacionesIniciales}
        </p>
      </div>
    )}
    
    {pruebasRealizadas && (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Pruebas Realizadas
        </p>
        <p className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg border border-gray-600/30 leading-relaxed">
          {pruebasRealizadas}
        </p>
      </div>
    )}
    
    {diagnosticoFinal && (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Diagnóstico Final
        </p>
        <p className="text-sm text-gray-300 bg-blue-500/10 p-3 rounded-lg border border-blue-500/30 leading-relaxed">
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
          {contadorMaquina.toLocaleString()} <span className="text-sm font-normal text-gray-400">unidades</span>
        </p>
      </div>
    )}
  </div>
));

DiagnosticoInfo.displayName = 'DiagnosticoInfo';

const InstalacionInfoView = memo(({ 
  recomendaciones,
  recomendacionesDetalle,
  configuracion,
  configuracionTipos
}: {
  recomendaciones?: boolean;
  recomendacionesDetalle?: string;
  configuracion?: boolean;
  configuracionTipos?: string[];
}) => (
  <div className="space-y-5">
    {configuracion && (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Configuraciones Realizadas
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          {configuracionTipos?.map((tipo, idx) => (
            <span key={idx} className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs font-medium text-blue-300">
              {tipo}
            </span>
          ))}
          {!configuracionTipos?.length && <p className="text-sm text-gray-500 italic">No se especificaron configuraciones</p>}
        </div>
      </div>
    )}
    
    {recomendaciones && (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Recomendaciones
        </p>
        <p className="text-sm text-gray-300 bg-green-500/10 p-3 rounded-lg border border-green-500/30 leading-relaxed">
          {recomendacionesDetalle || 'Sin recomendaciones adicionales'}
        </p>
      </div>
    )}

    {!configuracion && !recomendaciones && (
      <EmptyState message="No se registró información detallada de la instalación" />
    )}
  </div>
));

InstalacionInfoView.displayName = 'InstalacionInfoView';

const ContadorInfo = memo(({ contador }: { contador?: any }) => {
  if (!contador) return <EmptyState message={DEFAULT_TEXTS.noCounter} />;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline flex-wrap gap-2">
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
          <p className="text-sm text-gray-300 leading-relaxed">{contador.notas}</p>
        </div>
      )}
    </div>
  );
});

ContadorInfo.displayName = 'ContadorInfo';

const ClienteInfo = memo(({ cliente }: { cliente?: any }) => (
  <InfoSection title="Información del Cliente">
    <div className="space-y-2">
      <InfoField label="Nombre" value={cliente?.name} />
      <InfoField label="Cédula" value={cliente?.cedula} />
      <InfoField label="Teléfono" value={cliente?.phone} />
      <InfoField label="Email" value={cliente?.email} />
      <InfoField label="Dirección" value={cliente?.address} />
    </div>
  </InfoSection>
));

ClienteInfo.displayName = 'ClienteInfo';

const DispositivoInfo = memo(({ dispositivo }: { dispositivo?: any }) => {
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
});

DispositivoInfo.displayName = 'DispositivoInfo';

const GarantiaInfo = memo(({ 
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
          <p className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg border border-gray-600/30 leading-relaxed">
            {garantiaDescripcion}
          </p>
        </div>
      )}
      
      {(garantiaDesde || garantiaHasta) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
));

GarantiaInfo.displayName = 'GarantiaInfo';

const ModalFooter = memo(({ 
  onPrint, 
  onDownload,
  onShare,
  onClose 
}: { 
  onPrint: () => void; 
  onDownload?: () => void;
  onShare?: () => void;
  onClose: () => void;
}) => (
  <footer className="flex flex-col sm:flex-row justify-end gap-3 pt-5 border-t border-gray-700 sticky bottom-0 bg-gray-800/95 backdrop-blur-sm -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-6 z-20">
    <div className="flex flex-col sm:flex-row gap-2 order-2 sm:order-1 sm:mr-auto">
    </div>
    
    <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
      {onDownload && (
        <button
          onClick={onDownload}
          className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto font-medium"
          aria-label="Descargar orden en PDF"
          title="Descargar PDF"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          <span>Descargar PDF</span>
        </button>
      )}
      {onShare && (
        <button
          onClick={onShare}
          className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto font-medium"
          aria-label="Compartir orden"
          title="Compartir"
        >
          <Share2 className="w-4 h-4 flex-shrink-0" />
          <span>Compartir</span>
        </button>
      )}

    </div>
  </footer>
));

ModalFooter.displayName = 'ModalFooter';

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
      contador,
      instalacionRecomendaciones,
      instalacionRecomendacionesDetalle,
      instalacionConfiguracion,
      instalacionConfiguracionTipos,
      firmaCliente,
      nombreFirmante,
      validacionCliente
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
      esDiagnostico: tipoMantenimiento === 'diagnostico',
      esInstalacion: tipoMantenimiento === 'instalacion',
      instalacionRecomendaciones,
      instalacionRecomendacionesDetalle,
      instalacionConfiguracion,
      instalacionConfiguracionTipos,
      firmaCliente,
      nombreFirmante,
      validacionCliente,
      hasFirma: !!firmaCliente
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

const useFocusTrap = (modalRef: React.RefObject<HTMLElement>, isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    firstElement?.focus();
    document.addEventListener('keydown', handleTabKey);
    
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen, modalRef]);
};

const useEscapeKey = (onClose: () => void, isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isOpen]);
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const ModalOrden = ({ 
  orden, 
  onClose, 
  onPrint,
  onDownload,
  onShare
}: { 
  orden: OrdenMantenimiento; 
  onClose: () => void; 
  onPrint: (orden: OrdenMantenimiento) => void;
  onDownload?: (orden: OrdenMantenimiento) => void;
  onShare?: (orden: OrdenMantenimiento) => void;
}) => {
  if (!orden) return null;

  const data = useModalData(orden);
  const modalRef = useRef<HTMLDivElement>(null);
  
  useAndroidBackButton(onClose, true);
  useEscapeKey(onClose, true);
  useFocusTrap(modalRef, true);

  const handlePrint = useCallback(() => onPrint(orden), [onPrint, orden]);
  const handleDownload = useCallback(() => onDownload?.(orden), [onDownload, orden]);
  const handleShare = useCallback(() => onShare?.(orden), [onShare, orden]);
  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(data.idPersonalizado);
  }, [data.idPersonalizado]);
  
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4 transition-all duration-200 will-change-transform"
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalles de la orden ${data.idPersonalizado}`}
        className="bg-gray-800 border border-gray-700/50 rounded-xl p-4 sm:p-6 max-w-4xl w-full max-h-[95vh] overflow-y-auto will-change-scroll shadow-2xl transform transition-all duration-200 scale-100 opacity-100 animate-modalFadeIn"
      >
        
        <ModalHeader 
          idPersonalizado={data.idPersonalizado}
          tipoMantenimiento={data.tipoMantenimiento}
          onCopyId={handleCopyId}
          onClose={onClose} 
        />
        
        <main className="space-y-5">
          <InfoSection title="Fecha de Orden" icon={Calendar}>
            <p className="text-sm text-gray-300">
              {data.fechaCreacion} {data.horaCreacion || ''}
            </p>
          </InfoSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-5">
              <ClienteInfo cliente={data.cliente} />
              <DispositivoInfo dispositivo={data.dispositivo} />
            </div>
            
            <div className="space-y-5">
              {data.esDiagnostico ? (
                <InfoSection title="Diagnóstico Realizado">
                  <DiagnosticoInfo 
                    observacionesIniciales={data.observacionesIniciales}
                    pruebasRealizadas={data.pruebasRealizadas}
                    diagnosticoFinal={data.diagnosticoFinal}
                    contadorMaquina={data.contadorMaquina}
                  />
                </InfoSection>
              ) : data.esInstalacion ? (
                <InfoSection title="Detalles de Instalación">
                  <InstalacionInfoView 
                    recomendaciones={data.instalacionRecomendaciones}
                    recomendacionesDetalle={data.instalacionRecomendacionesDetalle}
                    configuracion={data.instalacionConfiguracion}
                    configuracionTipos={data.instalacionConfiguracionTipos}
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

          {data.hasFirma && (
            <InfoSection title="Firma de Conformidad" icon={CheckCircle}>
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <div className="bg-white rounded-xl p-3 w-full max-w-md shadow-inner">
                  <img 
                    src={data.firmaCliente} 
                    alt="Firma del cliente" 
                    className="w-full h-auto max-h-48 object-contain mx-auto"
                    style={{ filter: 'contrast(1.1) brightness(1.05)' }}
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Recibido por</p>
                  <p className="text-xl font-bold text-white tracking-tight">{data.nombreFirmante || data.cliente?.name}</p>
                  <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium pt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Validado Digitalmente</span>
                  </div>
                </div>
              </div>
            </InfoSection>
          )}
        </main>
        
        <ModalFooter 
          onPrint={handlePrint} 
          onDownload={onDownload ? handleDownload : undefined} 
          onShare={onShare ? handleShare : undefined} 
          onClose={onClose} 
        />
      </div>
    </div>
  );
};

export default memo(ModalOrden);