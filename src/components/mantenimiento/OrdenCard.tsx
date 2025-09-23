import { memo, useCallback } from 'react'
import { OrdenMantenimiento } from '@/types/orden'
import { Eye } from 'lucide-react'
import { PrintButton } from './PrintService'

interface OrdenCardProps {
  orden: OrdenMantenimiento;
  onView: (orden: OrdenMantenimiento) => void;
  onPrint: (orden: OrdenMantenimiento) => void;
  getTipoColor: (tipo: string) => string;
  formatFecha: (fecha: any) => string;
}

const OrdenCard: React.FC<OrdenCardProps> = memo(({ 
  orden, 
  onView, 
  onPrint, 
  getTipoColor, 
  formatFecha 
}) => {
  
  const handleCardClick = useCallback(() => {
    onView(orden);
  }, [onView, orden]);

  const handleViewClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onView(orden);
  }, [onView, orden]);

  const handlePrintClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPrint(orden);
  }, [onPrint, orden]);

  return (
    <div 
      className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:bg-gray-700/50 transition-colors duration-150 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">
            {orden.cliente?.name || 'N/A'}
          </h3>
          <p className="text-sm text-gray-400">
            ID: {orden.idPersonalizado}
          </p>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ml-2 ${getTipoColor(orden.tipoMantenimiento)}`}>
          {orden.tipoMantenimiento}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Teléfono:</span>
          <span className="text-white truncate ml-2">{orden.cliente?.phone || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Dispositivo:</span>
          <span className="text-white truncate ml-2">
            {orden.dispositivo?.marca || ''} {orden.dispositivo?.modelo || ''}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Fecha:</span>
          <span className="text-white">{formatFecha(orden.fechaCreacion)}</span>
        </div>
      </div>
      
      <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-600/50">
        <button
          onClick={handleViewClick}
          className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
        >
          <Eye className="w-4 h-4" />
          <span>Ver</span>
        </button>
        <PrintButton 
          orden={orden} 
          onPrint={onPrint}
          variant="card"
        />
      </div>
    </div>
  );
});

OrdenCard.displayName = 'OrdenCard';

export default memo(OrdenCard);