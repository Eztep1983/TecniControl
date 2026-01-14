// ModalOrden.tsx - Versión Optimizada

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
  noWarranty: 'No se especificó garantía',
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
// UTILIDADES
// ============================================================================

const formatDate = (fecha: unknown): string => {
  if (!fecha) return DEFAULT_TEXTS.noDate;
  
  try {
    let date: Date;
    
    if (fecha && typeof fecha === 'object') {
      if ('seconds' in fecha) {
        date = new Date((fecha as any).seconds * 1000);
      } else if (fecha instanceof Date) {
        date = fecha;
      } else {
        return DEFAULT_TEXTS.invalidDate;
      }
    } else if (typeof fecha === 'string' || typeof fecha === 'number') {
      date = new Date(fecha);
    } else {
      return DEFAULT_TEXTS.invalidDate;
    }
    
    return isNaN(date.getTime()) 
      ? DEFAULT_TEXTS.invalidDate 
      : date.toLocaleDateString('es-ES', DATE_FORMAT_OPTIONS);
  } catch {
    return DEFAULT_TEXTS.invalidDate;
  }
};

const getTipoColor = (tipo: string): string => {
  return TIPO_COLORS[tipo as keyof typeof TIPO_COLORS] || TIPO_COLORS.default;
};

const getUnidadLabel = (tipo: string, unidadPersonalizada?: string): string => {
  if (tipo === 'personalizado' && unidadPersonalizada) {
    return unidadPersonalizada;
  }
  return UNIDAD_LABELS[tipo] || tipo;
};

// ============================================================================
// COMPONENTES BÁSICOS
// ============================================================================

const EmptyState = memo(({ message }: { message: string }) => (
  <div className="flex items-center justify-center py-4 text-gray-500">
    <AlertCircle className="w-4 h-4 mr-2" />
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
}) => (
  <section 
    className={`bg-gray-700/30 p-4 rounded-xl border border-gray-600/50 ${className}`}
    aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <h4 
      id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className="font-semibold text-white border-b border-gray-600 pb-2 mb-3 flex items-center"
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {title}
    </h4>
    {children}
  </section>
));
InfoSection.displayName = 'InfoSection';

// ============================================================================
// COMPONENTES COMPLEJOS
// ============================================================================

const ModalHeader = memo(({ 
  idPersonalizado, 
  tipoMantenimiento,
  onClose 
}: { 
  idPersonalizado: string;
  tipoMantenimiento: string;
  onClose: () => void;
}) => (
  <header className="flex justify-between items-start mb-4 sticky top-0 bg-gray-800/95 backdrop-blur-md py-3 z-10 border-b border-gray-700/50">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-2">
        <Wrench className="w-5 h-5 text-blue-400 flex-shrink-0" aria-hidden="true" />
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
));
ModalHeader.displayName = 'ModalHeader';

const TareasList = memo(({ tareasRealizadas }: { tareasRealizadas?: string[] }) => {
  if (!tareasRealizadas?.length) {
    return <EmptyState message={DEFAULT_TEXTS.noTasks} />;
  }

  return (
    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
      {tareasRealizadas.map((tarea, idx) => (
        <li key={`tarea-${idx}`} className="pl-2 py-1">
          {tarea}
        </li>
      ))}
    </ol>
  );
});
TareasList.displayName = 'TareasList';

const PiezasList = memo(({ piezasUsadas }: { 
  piezasUsadas?: Array<{ cantidad: number; pieza: string }> 
}) => {
  if (!piezasUsadas?.length) {
    return <EmptyState message={DEFAULT_TEXTS.noParts} />;
  }

  return (
    <ul className="space-y-2 text-sm">
      {piezasUsadas.map((pieza, idx) => (
        <li 
          key={`pieza-${idx}`}
          className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-600/30"
        >
          <span className="text-gray-300 flex-1">{pieza.pieza}</span>
          <span className="font-medium text-blue-400 ml-3">x{pieza.cantidad}</span>
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
));
DiagnosticoInfo.displayName = 'DiagnosticoInfo';

const ContadorInfo = memo(({ contador }: { contador?: any }) => {
  if (!contador) {
    return <EmptyState message={DEFAULT_TEXTS.noCounter} />;
  }

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
  const marcaModelo = useMemo(() => 
    `${dispositivo?.marca || ''} ${dispositivo?.modelo || ''}`.trim() || undefined,
    [dispositivo?.marca, dispositivo?.modelo]
  );

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
));
GarantiaInfo.displayName = 'GarantiaInfo';

const ModalFooter = memo(({ 
  onPrint, 
  onClose 
}: { 
  onPrint: () => void; 
  onClose: () => void;
}) => (
  <footer className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-700 sticky bottom-0 bg-gray-800/95 backdrop-blur-md">
    <button
      onClick={onPrint}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-md hover:shadow-lg order-2 sm:order-1"
      aria-label="Imprimir orden"
    >
      <Printer className="w-4 h-4" />
      <span>Imprimir</span>
    </button>
    <button
      onClick={onClose}
      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg order-1 sm:order-2"
    >
      Cerrar
    </button>
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
      hasTareas: tareasRealizadas.length > 0,
      hasGarantia: !!(garantiaDescripcion || garantiaTiempoDesde || garantiaTiempoHasta),
      hasContador: !!contador,
      esDiagnostico: tipoMantenimiento === 'diagnostico'
    };
  }, [orden]);
};

const useFocusTrap = (isOpen: boolean) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    modal.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => modal.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  return modalRef;
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const ModalOrden = ({ 
  orden, 
  onClose, 
  onPrint 
}: { 
  orden: OrdenMantenimiento; 
  onClose: () => void; 
  onPrint: (orden: OrdenMantenimiento) => void;
}) => {
  if (!orden) return null;

  const data = useModalData(orden);
  const modalRef = useFocusTrap(true);

  const handlePrint = useCallback(() => {
    onPrint(orden);
  }, [onPrint, orden]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`orden-${data.idPersonalizado}`}
        className="bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-xl p-4 sm:p-6 max-w-4xl w-full max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <ModalHeader 
          idPersonalizado={data.idPersonalizado}
          tipoMantenimiento={data.tipoMantenimiento}
          onClose={onClose} 
        />
        
        <main className="space-y-4">
          {/* Fecha de Orden */}
          <InfoSection title="Fecha de Orden" icon={Calendar}>
            <p className="text-sm text-gray-300">
              {data.fechaCreacion} {data.horaCreacion || ''}
            </p>
          </InfoSection>

          {/* Grid principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Columna izquierda */}
            <div className="space-y-4">
              <ClienteInfo cliente={data.cliente} />
              <DispositivoInfo dispositivo={data.dispositivo} />
            </div>
            
            {/* Columna derecha */}
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

          {/* Contador */}
          {data.hasContador && (
            <InfoSection title="Contador Registrado" icon={Clock}>
              <ContadorInfo contador={data.contador} />
            </InfoSection>
          )}
          
          {/* Garantía */}
          {data.hasGarantia && (
            <GarantiaInfo 
              garantiaDescripcion={data.garantiaDescripcion}
              garantiaDesde={data.garantiaDesde}
              garantiaHasta={data.garantiaHasta}
            />
          )}
        </main>
        
        <ModalFooter onPrint={handlePrint} onClose={onClose} />
      </div>
    </div>
  );
};

export default memo(ModalOrden);