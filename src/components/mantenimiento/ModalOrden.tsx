import { OrdenMantenimiento } from "@/types/orden";
import { X, Calendar, Clock, Printer } from "lucide-react";
import { useCallback, useMemo, memo } from "react";

// CONSTANTES EXTERNAS PARA REUTILIZACIÓN
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
};

const DEFAULT_TEXTS = {
  noDate: 'Fecha no disponible',
  invalidDate: 'Fecha inválida',
  noTasks: 'No se registraron tareas',
  noWarranty: 'No se especificó garantía',
  notAvailable: 'N/A'
} as const;

// COMPONENTES MEMOIZADOS PEQUEÑOS
const ModalHeader = memo(({ 
  idPersonalizado, 
  onClose 
}: { 
  idPersonalizado: string; 
  onClose: () => void;
}) => (
  <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-800/90 backdrop-blur-md py-2 z-10">
    <h3 className="text-xl font-semibold text-white">
      Orden de Mantenimiento #{idPersonalizado}
    </h3>
    <button
      onClick={onClose}
      className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
      aria-label="Cerrar modal"
    >
      <X className="w-6 h-6" />
    </button>
  </div>
));

ModalHeader.displayName = 'ModalHeader';

const InfoSection = memo(({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon?: React.ComponentType<any>;
  children: React.ReactNode;
}) => (
  <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
    <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2 flex items-center">
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {title}
    </h4>
    {children}
  </div>
));

InfoSection.displayName = 'InfoSection';

const TareasList = memo(({ tareasRealizadas }: { tareasRealizadas: string[] }) => {
  if (!tareasRealizadas?.length) {
    return <p className="text-sm text-gray-400">{DEFAULT_TEXTS.noTasks}</p>;
  }

  return (
    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
      {tareasRealizadas.map((tarea, index) => (
        <li key={`${index}-${tarea.substring(0, 20)}`}>{tarea}</li>
      ))}
    </ol>
  );
});

TareasList.displayName = 'TareasList';

const PiezasList = memo(({ piezasUsadas }: { piezasUsadas?: Array<{ cantidad: number; pieza: string }> }) => {
  if (!piezasUsadas?.length) return null;

  return (
    <ul className="space-y-1 text-sm text-gray-300">
      {piezasUsadas.map((pieza, index) => (
        <li key={`${index}-${pieza.pieza.substring(0, 15)}`}>
          <span className="font-medium text-gray-200">{pieza.cantidad}x</span> {pieza.pieza}
        </li>
      ))}
    </ul>
  );
});

PiezasList.displayName = 'PiezasList';

// HOOK PERSONALIZADO PARA FORMATEO DE FECHAS
const useDateFormatter = () => {
  const formatFecha = useCallback((fecha: unknown): string => {
    if (!fecha) return DEFAULT_TEXTS.noDate;
    
    try {
      let date: Date;
      
      if (fecha && typeof fecha === 'object') {
        if ('seconds' in fecha && 'nanoseconds' in fecha) {
          date = new Date((fecha as any).seconds * 1000);
        } else if (fecha instanceof Date) {
          date = fecha;
        } else {
          return DEFAULT_TEXTS.invalidDate;
        }
      } else if (typeof fecha === 'string') {
        date = new Date(fecha);
      } else if (typeof fecha === 'number') {
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
  }, []);

  return formatFecha;
};

// HOOK PARA DATOS DEL MODAL
const useModalData = (orden: OrdenMantenimiento) => {
  const formatFecha = useDateFormatter();
  
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
    garantiaTiempoHasta
  } = orden;

  // MEMOIZAR TODOS LOS VALORES COMPUTADOS
  const formattedData = useMemo(() => ({
    fechaCreacion: formatFecha(fechaCreacion),
    garantiaDesde: formatFecha(garantiaTiempoDesde),
    garantiaHasta: formatFecha(garantiaTiempoHasta),
    tipoColorClass: tipoMantenimiento === 'preventivo' 
      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
      : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  }), [fechaCreacion, garantiaTiempoDesde, garantiaTiempoHasta, tipoMantenimiento, formatFecha]);

  const hasPiezas = piezasUsadas.length > 0;

  return {
    idPersonalizado,
    horaCreacion,
    cliente,
    dispositivo,
    tareasRealizadas,
    piezasUsadas,
    garantiaDescripcion,
    tipoMantenimiento,
    hasPiezas,
    ...formattedData
  };
};

// COMPONENTE PRINCIPAL OPTIMIZADO
const ModalOrden = ({ 
  orden, 
  onClose, 
  onPrint 
}: { 
  orden: OrdenMantenimiento; 
  onClose: () => void; 
  onPrint: (orden: OrdenMantenimiento) => void;
}) => {
  // EVITAR RENDERIZADO SI NO HAY ORDEN
  if (!orden) return null;

  const modalData = useModalData(orden);

  const handlePrint = useCallback(() => {
    onPrint(orden);
  }, [onPrint, orden]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <ModalHeader 
          idPersonalizado={modalData.idPersonalizado} 
          onClose={onClose} 
        />
        
        {/* CONTENIDO PRINCIPAL CON MEJOR ESTRUCTURA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* COLUMNA IZQUIERDA */}
          <div className="space-y-4">
            <InfoSection title="Fecha de orden" icon={Calendar}>
              <p className="text-sm text-gray-300">
                {modalData.fechaCreacion} {modalData.horaCreacion || ''}
              </p>  
            </InfoSection>
            
            <InfoSection title="Información del Cliente">
              <div className="space-y-2 text-sm text-gray-300">
                <InfoField label="Nombre" value={modalData.cliente?.name} />
                <InfoField label="Cédula" value={modalData.cliente?.cedula} />
                <InfoField label="Teléfono" value={modalData.cliente?.phone} />
                <InfoField label="Email" value={modalData.cliente?.email} />
                <InfoField label="Dirección" value={modalData.cliente?.address} />
              </div>
            </InfoSection>
            
            <InfoSection title="Información del Dispositivo">
              <div className="space-y-2 text-sm text-gray-300">
                <InfoField label="Tipo" value={modalData.dispositivo?.tipo} />
                <InfoField 
                  label="Marca/Modelo" 
                  value={`${modalData.dispositivo?.marca || ''} ${modalData.dispositivo?.modelo || ''}`.trim()} 
                />
                <InfoField label="Número de Serie" value={modalData.dispositivo?.numeroSerie} />
                <p className="flex items-center">
                  <span className="font-medium text-gray-200 mr-2">Tipo de Mantenimiento:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${modalData.tipoColorClass}`}>
                    {modalData.tipoMantenimiento}
                  </span>
                </p>
              </div>
            </InfoSection>
          </div>
          
          {/* COLUMNA DERECHA */}
          <div className="space-y-4">
            <InfoSection title="Tareas Realizadas">
              <TareasList tareasRealizadas={modalData.tareasRealizadas} />
            </InfoSection>
            
            {modalData.hasPiezas && (
              <InfoSection title="Piezas Utilizadas">
                <PiezasList piezasUsadas={modalData.piezasUsadas} />
              </InfoSection>
            )}
          </div>
        </div>
        
        {/* GARANTÍA */}
        <InfoSection title="Garantía" icon={Clock}>
          <div className="text-sm text-gray-300 space-y-2">
            <InfoField label="Desde" value={modalData.garantiaDesde} />
            <InfoField label="Hasta" value={modalData.garantiaHasta} />
            <InfoField 
              label="Descripción" 
              value={modalData.garantiaDescripcion || DEFAULT_TEXTS.noWarranty} 
            />
          </div>
        </InfoSection>
        
        {/* BOTONES */}
        <ModalFooter onPrint={handlePrint} onClose={onClose} />
      </div>
    </div>
  );
};

// COMPONENTES AUXILIARES MEMOIZADOS
const InfoField = memo(({ label, value }: { label: string; value?: string }) => (
  <p>
    <span className="font-medium text-gray-200">{label}:</span> {value || DEFAULT_TEXTS.notAvailable}
  </p>
));

InfoField.displayName = 'InfoField';

const ModalFooter = memo(({ 
  onPrint, 
  onClose 
}: { 
  onPrint: () => void; 
  onClose: () => void;
}) => (
  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
    <button
      onClick={onPrint}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-md hover:shadow-lg"
    >
      <Printer className="w-4 h-4" />
      <span>Imprimir</span>
    </button>
    <button
      onClick={onClose}
      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg"
    >
      Cerrar
    </button>
  </div>
));

ModalFooter.displayName = 'ModalFooter';

export default memo(ModalOrden);