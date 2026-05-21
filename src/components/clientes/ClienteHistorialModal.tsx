"use client";

import React, { useState, useCallback, lazy, Suspense, memo } from "react";
import { FixedSizeList as List } from "react-window";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/basic/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/basic/sheet";
import { useMediaQuery } from "@/hooks/clientes/useMediaQuery";
import { useOrdenesCliente } from "@/hooks/clientes/useOrdenesCliente";
const ModalOrdenLazy = React.lazy(() => import("@/components/mantenimiento/ModalOrden").then(m => ({ default: m.ModalOrden })));
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { useHapticFeedback } from "@/hooks/clientes/useHapticFeedback";
import { useSwipeToClose } from "@/hooks/clientes/useSwipeToClose";
import { Calendar, ClipboardList, RefreshCw, X, ChevronRight, PlusCircle } from "lucide-react";
import Link from "next/link";
import type { Orden } from "@/types/orden";
import { useNegocioUsuario } from "@/hooks/useMultiUser";
import { usePrintService } from "@/components/mantenimiento/PrintService";
import { cn } from "@/lib/utils";

interface ClienteHistorialModalProps {
  open: boolean;
  clienteId: string;
  clienteNombre: string;
  onClose: () => void;
}

// ── Tarjeta de Orden Individual ───────────────────────────────────────────
const OrdenItem = memo(({ 
  orden, 
  onClick, 
  formatFecha 
}: { 
  orden: Orden; 
  onClick: (o: Orden) => void;
  formatFecha: (f: any) => string;
}) => (
  <button
    onClick={() => onClick(orden)}
    className="group w-full text-left bg-gray-800/30 hover:bg-gray-800/60 active:bg-gray-800/80 rounded-2xl border border-gray-700/40 p-4 transition-all duration-150 active:scale-[0.98]"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
            #{orden.idPersonalizado || orden.id?.slice(-6)}
          </span>
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider",
            orden.tipoMantenimiento === 'preventivo' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
            orden.tipoMantenimiento === 'correctivo' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
            'bg-blue-500/10 border-blue-500/20 text-blue-400'
          )}>
            {orden.tipoMantenimiento || 'Servicio'}
          </span>
        </div>
        
        <h4 className="font-bold text-white text-sm truncate group-hover:text-blue-400 transition-colors">
          {orden.dispositivo?.marca} {orden.dispositivo?.modelo}
        </h4>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-400 font-medium">{formatFecha(orden.fechaCreacion)}</span>
          </div>
          {orden.contadorMaquina !== undefined && (
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-400 font-medium">{orden.contadorMaquina.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-10 h-10 rounded-xl bg-gray-700/30 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
      </div>
    </div>
  </button>
));
OrdenItem.displayName = "OrdenItem";

export function ClienteHistorialModal({
  open,
  clienteId,
  clienteNombre,
  onClose,
}: ClienteHistorialModalProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const { ordenes, loading, error, refrescar } = useOrdenesCliente(clienteId);
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { negocio } = useNegocioUsuario();
  const { imprimirOrden, compartirOrden, descargarPDF, generarPDFBlob, generarHTML } = usePrintService({ negocio });
  const haptic = useHapticFeedback();

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeToClose({
    onClose,
    enabled: open && isMobile && !selectedOrden,
    threshold: 80,
  });

  useAndroidBack(open, () => {
    if (selectedOrden) setSelectedOrden(null);
    else onClose();
  });

  const openOrden = useCallback(
    (orden: Orden) => {
      haptic.selection();
      setSelectedOrden(orden);
    },
    [haptic]
  );

  const closeOrdenModal = useCallback(() => setSelectedOrden(null), []);

  const handleRefresh = useCallback(() => {
    haptic.impactLight();
    refrescar();
  }, [haptic, refrescar]);

  const formatFecha = useCallback((fecha: any) => {
    if (!fecha) return "N/A";
    try {
      const date = fecha?.seconds ? new Date(fecha.seconds * 1000) : new Date(fecha);
      return isNaN(date.getTime()) ? "Fecha inválida" : date.toLocaleDateString("es-ES");
    } catch {
      return "Fecha inválida";
    }
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-3 p-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-800/50 rounded-xl h-24" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 text-red-400 mx-auto mb-3 opacity-60" />
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-700 text-white text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      );
    }

    if (ordenes.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-800 flex items-center justify-center">
            <ClipboardList className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">Sin órdenes</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
            Este cliente aún no tiene órdenes de servicio.
          </p>
          <Link
            href={`/ordenes/nueva?clienteId=${clienteId}`}
            onClick={onClose}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded-xl text-blue-400 font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Crear primera orden
          </Link>
        </div>
      );
    }

    const threshold = 50;
    if (ordenes.length > threshold && !showAll) {
      // Virtualize large lists; render a fixed-height list with windowing
      const itemHeight = 108; // approximate height per item including gap
      const listHeight = Math.min(window.innerHeight * 0.6, itemHeight * Math.min(10, ordenes.length));

      const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const orden = ordenes[index];
        return (
          <div style={{ ...style, paddingBottom: '12px' }}>
            <OrdenItem 
              orden={orden} 
              onClick={openOrden} 
              formatFecha={formatFecha} 
            />
          </div>
        );
      };

      return (
        <div className="transform-gpu">
          <List
            height={listHeight}
            itemCount={ordenes.length}
            itemSize={itemHeight}
            width="100%"
            className="custom-scrollbar"
          >
            {Row}
          </List>
          <div className="text-center mt-3">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/30 border border-gray-700/40 text-sm text-white"
            >
              Mostrar todo ({ordenes.length})
            </button>
          </div>
        </div>
      );
    }

    const visibleOrdenes = showAll ? ordenes : ordenes.slice(0, 30);

    return (
      <div className="space-y-3 transform-gpu">
        {visibleOrdenes.map((orden) => (
          <OrdenItem 
            key={orden.id} 
            orden={orden} 
            onClick={openOrden} 
            formatFecha={formatFecha} 
          />
        ))}
        {ordenes.length > 30 && !showAll && (
          <div className="text-center">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/30 border border-gray-700/40 text-sm text-white"
            >
              Mostrar más ({ordenes.length})
            </button>
          </div>
        )}
      </div>
    );
  };

  const modalProps = {
    open,
    onOpenChange: (v: boolean) => !v && onClose(),
  };

  const HeaderContent = () => (
    <div className="flex items-center justify-between w-full pr-10">
      <div className="min-w-0">
        <SheetTitle className="text-base font-bold text-white leading-tight">Historial de órdenes</SheetTitle>
        <SheetDescription className="text-xs text-gray-500 truncate mt-0.5">{clienteNombre}</SheetDescription>
      </div>
      {!loading && ordenes.length > 0 && (
        <div className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <span className="text-[10px] font-black text-blue-400">{ordenes.length} {ordenes.length === 1 ? 'ORDEN' : 'ÓRDENES'}</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Sheet {...modalProps}>
          <SheetContent
            hideClose
            side="bottom"
            className="rounded-t-[2.5rem] bg-gray-900 border-t border-gray-800 p-0 max-h-[90vh] flex flex-col overflow-hidden z-[105]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onInteractOutside={(e) => {
              if (selectedOrden) e.preventDefault();
            }}
          >
            <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
            
            <SheetHeader className="px-6 py-4 border-b border-gray-800/50 text-left relative">
              <HeaderContent />
              <button
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gray-800/50 active:bg-gray-700 flex items-center justify-center transition-colors"
                aria-label="Cerrar historial"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </SheetHeader>
            <div className="overflow-y-auto flex-1 p-6 space-y-4 custom-scrollbar" onTouchStart={(e) => selectedOrden && e.stopPropagation()}>{renderContent()}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog {...modalProps}>
          <DialogContent 
            hideClose
            className="w-[calc(100%-1.5rem)] max-w-lg mx-auto rounded-3xl bg-gray-900 border border-gray-800 p-0 gap-0 max-h-[85vh] flex flex-col overflow-hidden shadow-2xl z-[105]"
            onInteractOutside={(e) => {
              if (selectedOrden) e.preventDefault();
            }}
          >
            <DialogHeader className="px-6 py-5 border-b border-gray-800/50 relative">
              <HeaderContent />
              <button
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gray-800/50 active:bg-gray-700 flex items-center justify-center transition-colors"
                aria-label="Cerrar historial"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">{renderContent()}</div>
          </DialogContent>
        </Dialog>
      )}
      {selectedOrden && (
        <Suspense fallback={null}>
          <ModalOrdenLazy
            generarPDFBlob={generarPDFBlob}
            generarHTML={generarHTML}
            orden={selectedOrden as any}
            onClose={closeOrdenModal}
            onPrint={imprimirOrden}
            onDownload={descargarPDF}
            onShare={compartirOrden}
          />
        </Suspense>
      )}
    </>
  );
}