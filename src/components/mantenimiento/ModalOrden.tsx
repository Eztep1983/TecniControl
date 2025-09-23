import { OrdenMantenimiento } from "@/types/orden";
import { X, Calendar, Clock, Printer } from "lucide-react";
import { useCallback, useMemo } from "react";

// Componente para el modal de visualización
const ModalOrden = ({ 
  orden, 
  onClose, 
  onPrint 
}: { 
  orden: OrdenMantenimiento; 
  onClose: () => void; 
  onPrint: (orden: OrdenMantenimiento) => void;
}) => {
  // MEMOIZAR FUNCIONES DE FORMATEO
  const formatFecha = useCallback((fecha: any): string => {
    if (!fecha) return 'Fecha no disponible';
    
    try {
      let date: Date;
      
      // Manejo unificado de diferentes formatos de fecha
      if (fecha && typeof fecha === 'object') {
        if ('seconds' in fecha && 'nanoseconds' in fecha) {
          // Timestamp de Firestore
          date = new Date(fecha.seconds * 1000);
        } else if (fecha instanceof Date) {
          // Objeto Date
          date = fecha;
        } else {
          return 'Formato de fecha no válido';
        }
      } else if (typeof fecha === 'string') {
        // String ISO
        date = new Date(fecha);
      } else if (typeof fecha === 'number') {
        // Timestamp numérico
        date = new Date(fecha);
      } else {
        return 'Formato de fecha no válido';
      }
      
      // Validar que la fecha sea válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formateando fecha:', error, fecha);
      return 'Fecha inválida';
    }
  }, []);

  // MEMOIZAR VALORES COMPUTADOS
  const fechaCreacionFormateada = useMemo(() => 
    formatFecha(orden?.fechaCreacion), [orden?.fechaCreacion, formatFecha]
  );

  const garantiaDesdeFormateada = useMemo(() => 
    formatFecha(orden?.garantiaTiempoDesde), [orden?.garantiaTiempoDesde, formatFecha]
  );

  const garantiaHastaFormateada = useMemo(() => 
    formatFecha(orden?.garantiaTiempoHasta), [orden?.garantiaTiempoHasta, formatFecha]
  );

  const getTipoColor = useCallback((tipo: string) => {
    return tipo === 'preventivo' 
      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
      : 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  }, []);

  const tipoColorClass = useMemo(() => 
    getTipoColor(orden?.tipoMantenimiento || ''), 
    [orden?.tipoMantenimiento, getTipoColor]
  );

  // EVITAR RENDERIZADO SI NO HAY ORDEN
  if (!orden) return null;

  // SIMPLIFICAR ACCESOS A PROPIEDADES
  const {
    idPersonalizado,
    fechaCreacion,
    horaCreacion,
    cliente,
    dispositivo,
    tareasRealizadas,
    piezasUsadas,
    garantiaDescripcion,
    tipoMantenimiento
  } = orden;

  // COMPONENTES MEMOIZADOS PARA LISTAS
  const TareasList = useMemo(() => 
    tareasRealizadas?.length > 0 ? (
      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
        {tareasRealizadas.map((tarea, index) => (
          <li key={index}>{tarea}</li>
        ))}
      </ol>
    ) : (
      <p className="text-sm text-gray-400">No se registraron tareas</p>
    ), [tareasRealizadas]
  );

  const PiezasList = useMemo(() => 
    piezasUsadas && piezasUsadas.length > 0 ? (
      <ul className="space-y-1 text-sm text-gray-300">
        {piezasUsadas.map((pieza, index) => (
          <li key={index}>
            <span className="font-medium text-gray-200">{pieza.cantidad}x</span> {pieza.pieza}
          </li>
        ))}
      </ul>
    ) : null, [piezasUsadas]
  );





  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER STICKY OPTIMIZADO */}
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
        
        {/* CONTENIDO PRINCIPAL CON GRID OPTIMIZADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* COLUMNA IZQUIERDA */}
          <div className="space-y-4">
            {/* FECHA */}
            <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
              <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Fecha de orden
              </h4>
              <p className="text-sm text-gray-300">
                {fechaCreacionFormateada} {horaCreacion || ''}
              </p>  
            </div>
            
            {/* CLIENTE */}
            <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
              <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2">
                Información del Cliente
              </h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="font-medium text-gray-200">Nombre:</span> {cliente?.name || 'N/A'}</p>
                <p><span className="font-medium text-gray-200">Cédula:</span> {cliente?.cedula || 'N/A'}</p>
                <p><span className="font-medium text-gray-200">Teléfono:</span> {cliente?.phone || 'N/A'}</p>
                <p><span className="font-medium text-gray-200">Email:</span> {cliente?.email || 'N/A'}</p>
                <p><span className="font-medium text-gray-200">Dirección:</span> {cliente?.address || 'N/A'}</p>
              </div>
            </div>
            
            {/* DISPOSITIVO */}
            <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
              <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2">
                Información del Dispositivo
              </h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="font-medium text-gray-200">Tipo:</span> {dispositivo?.tipo || 'N/A'}</p>
                <p><span className="font-medium text-gray-200">Marca/Modelo:</span> {dispositivo?.marca || ''} {dispositivo?.modelo || ''}</p>
                <p><span className="font-medium text-gray-200">Número de Serie:</span> {dispositivo?.numeroSerie || 'N/A'}</p>
                <p className="flex items-center">
                  <span className="font-medium text-gray-200 mr-2">Tipo de Mantenimiento:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${tipoColorClass}`}>
                    {tipoMantenimiento}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          {/* COLUMNA DERECHA */}
          <div className="space-y-4">
            {/* TAREAS */}
            <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
              <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2">
                Tareas Realizadas
              </h4>
              {TareasList}
            </div>
            
            {/* PIEZAS (SOLO SI EXISTEN) */}
            {PiezasList && (
              <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
                <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2">
                  Piezas Utilizadas
                </h4>
                {PiezasList}
              </div>
            )}
          </div>
        </div>
        
        {/* GARANTÍA */}
        <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50 mb-4">
          <h4 className="font-semibold text-white border-b border-gray-600 pb-2 mb-2 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Garantía
          </h4>
          <div className="text-sm text-gray-300 space-y-2">
            <p><span className="font-medium text-gray-200">Desde:</span> {garantiaDesdeFormateada}</p>
            <p><span className="font-medium text-gray-200">Hasta:</span> {garantiaHastaFormateada}</p>
            <p><span className="font-medium text-gray-200">Descripción:</span> {garantiaDescripcion || 'No se especificó garantía'}</p>
          </div>
        </div>
        
        {/* BOTONES */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <button
            onClick={() => onPrint(orden)}
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
      </div>
    </div>
  );
};

export default ModalOrden;