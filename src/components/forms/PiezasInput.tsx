// components/forms/PiezasInput.tsx
'use client'
import { Plus, Trash2, Package, Wrench } from 'lucide-react'
import { useCallback, memo, useMemo } from 'react'

interface Pieza {
  pieza: string
  cantidad: number
}

interface PiezasInputProps {
  piezasUsadas: Pieza[]
  onActualizarPieza: (index: number, campo: string, valor: any) => void
  onAgregarPieza: () => void
  onEliminarPieza: (index: number) => void
}

// CONSTANTES EXTERNAS
const EMPTY_STATE_CONFIG = {
  title: 'No se utilizaron piezas adicionales',
  description: 'Este campo es opcional',
  buttonText: 'Agregar primera pieza'
} as const;

// COMPONENTES MEMOIZADOS PEQUEÑOS
const HeaderSection = memo(({ onAgregarPieza }: { onAgregarPieza: () => void }) => (
  <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
    <div className="flex items-center space-x-3 min-w-0">
      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
        <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
      </div>
      <div className="min-w-0">
        <h4 className="font-medium text-white text-sm sm:text-base truncate">Componentes y Piezas</h4>
        <p className="text-xs sm:text-sm text-gray-400 truncate">
          Registra las piezas utilizadas
        </p>
      </div>
    </div>
    
    <button
      type="button"
      onClick={onAgregarPieza}
      className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg sm:rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-colors duration-200 w-full xs:w-auto text-xs sm:text-sm font-medium"
    >
      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span>Agregar pieza</span>
    </button>
  </div>
));

HeaderSection.displayName = 'HeaderSection';

const EmptyState = memo(({ onAgregarPieza }: { onAgregarPieza: () => void }) => (
  <div className="text-center py-6 sm:py-8 text-gray-500 bg-gray-800/20 rounded-lg sm:rounded-xl border border-gray-700/30 border-dashed">
    <Package className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-600" />
    <p className="text-xs sm:text-sm">{EMPTY_STATE_CONFIG.title}</p>
    <p className="text-xs text-gray-600 mt-1">{EMPTY_STATE_CONFIG.description}</p>
    <button
      type="button"
      onClick={onAgregarPieza}
      className="mt-3 inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/30 text-xs transition-colors"
    >
      <Plus className="w-3.5 h-3.5" />
      <span>{EMPTY_STATE_CONFIG.buttonText}</span>
    </button>
  </div>
));

EmptyState.displayName = 'EmptyState';

const ContadorCantidad = memo(({ 
  cantidad, 
  onCambiarCantidad 
}: { 
  cantidad: number;
  onCambiarCantidad: (nuevaCantidad: number) => void;
}) => (
  <div className="flex items-center space-x-1">
    <button
      type="button"
      onClick={() => onCambiarCantidad(cantidad - 1)}
      disabled={cantidad <= 1}
      className="w-6 h-6 flex items-center justify-center bg-gray-700/50 rounded text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      aria-label="Reducir cantidad"
    >
      -
    </button>
    <input
      type="number"
      value={cantidad}
      onChange={(e) => {
        const nuevaCantidad = parseInt(e.target.value) || 1;
        if (nuevaCantidad > 0) onCambiarCantidad(nuevaCantidad);
      }}
      min="1"
      className="w-12 sm:w-16 bg-gray-700/50 border border-gray-600/50 rounded px-1 sm:px-2 py-1 text-white text-center text-sm focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-colors"
      aria-label="Cantidad de piezas"
    />
    <button
      type="button"
      onClick={() => onCambiarCantidad(cantidad + 1)}
      className="w-6 h-6 flex items-center justify-center bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
      aria-label="Aumentar cantidad"
    >
      +
    </button>
  </div>
));

ContadorCantidad.displayName = 'ContadorCantidad';

const PiezaItem = memo(({ 
  pieza, 
  index, 
  onActualizarPieza, 
  onEliminarPieza 
}: { 
  pieza: Pieza;
  index: number;
  onActualizarPieza: (index: number, campo: string, valor: any) => void;
  onEliminarPieza: (index: number) => void;
}) => {
  const handleCambiarCantidad = useCallback((nuevaCantidad: number) => {
    onActualizarPieza(index, 'cantidad', nuevaCantidad);
  }, [index, onActualizarPieza]);

  const handleNombreChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onActualizarPieza(index, 'pieza', e.target.value);
  }, [index, onActualizarPieza]);

  const handleEliminar = useCallback(() => {
    onEliminarPieza(index);
  }, [index, onEliminarPieza]);

  return (
    <div className="group relative">
      <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 bg-gray-800/40 rounded-lg sm:rounded-xl border border-gray-700/50 p-3 sm:p-4 hover:bg-gray-700/40 transition-colors duration-150">
        {/* Icono */}
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500/20 rounded flex items-center justify-center flex-shrink-0">
          <Wrench className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
        </div>
        
        {/* Contenido principal */}
        <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full min-w-0">
          {/* Input de nombre de pieza */}
          <div className="flex-1 w-full min-w-0">
            <input
              type="text"
              value={pieza.pieza}
              onChange={handleNombreChange}
              placeholder="Nombre de la pieza o componente..."
              className="w-full bg-gray-700/30 sm:bg-transparent border-none text-white placeholder-gray-500 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-2 py-1.5 sm:py-1 transition-colors"
              aria-label={`Nombre de la pieza ${index + 1}`}
            />
          </div>
          
          {/* Controles de cantidad */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap flex-shrink-0">
              Cantidad:
            </span>
            <ContadorCantidad 
              cantidad={pieza.cantidad} 
              onCambiarCantidad={handleCambiarCantidad} 
            />
          </div>
        </div>
        
        {/* Botón eliminar */}
        <button
          type="button"
          onClick={handleEliminar}
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors duration-200 opacity-80 hover:opacity-100 xs:opacity-0 xs:group-hover:opacity-100 self-end xs:self-auto mt-2 xs:mt-0 flex-shrink-0"
          aria-label={`Eliminar pieza ${pieza.pieza}`}
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
});

PiezaItem.displayName = 'PiezaItem';

// HOOK PARA OPTIMIZAR HANDLERS
const usePiezasHandlers = (props: Pick<PiezasInputProps, 
  'onAgregarPieza' | 
  'onEliminarPieza' | 
  'onActualizarPieza'
>) => {
  const handleAgregarPieza = useCallback(() => {
    props.onAgregarPieza();
  }, [props.onAgregarPieza]);

  const handleEliminarPieza = useCallback((index: number) => {
    props.onEliminarPieza(index);
  }, [props.onEliminarPieza]);

  const handleActualizarPieza = useCallback((index: number, campo: string, valor: any) => {
    props.onActualizarPieza(index, campo, valor);
  }, [props.onActualizarPieza]);

  return {
    handleAgregarPieza,
    handleEliminarPieza,
    handleActualizarPieza
  };
};

// COMPONENTE PRINCIPAL OPTIMIZADO
const PiezasInput = memo(function PiezasInput({
  piezasUsadas,
  onActualizarPieza,
  onAgregarPieza,
  onEliminarPieza
}: PiezasInputProps) {
  
  const handlers = usePiezasHandlers({
    onAgregarPieza,
    onEliminarPieza,
    onActualizarPieza
  });

  // MEMOIZAR LA LISTA DE PIEZAS PARA EVITAR RENDERIZADOS INNECESARIOS
  const piezasList = useMemo(() => (
    <div className="space-y-2 sm:space-y-3">
      {piezasUsadas.map((pieza, index) => (
        <PiezaItem
          key={index}
          pieza={pieza}
          index={index}
          onActualizarPieza={handlers.handleActualizarPieza}
          onEliminarPieza={handlers.handleEliminarPieza}
        />
      ))}
    </div>
  ), [piezasUsadas, handlers.handleActualizarPieza, handlers.handleEliminarPieza]);

  const tienePiezas = piezasUsadas.length > 0;

  return (
    <div className="space-y-4">
      <HeaderSection onAgregarPieza={handlers.handleAgregarPieza} />
      
      {tienePiezas ? (
        piezasList
      ) : (
        <EmptyState onAgregarPieza={handlers.handleAgregarPieza} />
      )}
    </div>
  );
});

PiezasInput.displayName = 'PiezasInput';

export default PiezasInput;