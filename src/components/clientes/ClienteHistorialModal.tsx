"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/basic/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/basic/sheet";
import { useMediaQuery } from "@/hooks/clientes/useMediaQuery";
import { useOrdenesCliente } from "@/hooks/clientes/useOrdenesCliente";
import { ModalOrden } from "@/components/mantenimiento/ModalOrden";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { useHapticFeedback } from "@/hooks/clientes/useHapticFeedback";
import { useSwipeToClose } from "@/hooks/clientes/useSwipeToClose";
import { Calendar, ClipboardList, Cpu, PlusCircle, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import type { Orden } from "@/types/orden";
import { useNegocioUsuario } from "@/hooks/useMultiUser";
import { usePrintService } from "@/components/mantenimiento/PrintService";

interface ClienteHistorialModalProps {
  open: boolean;
  clienteId: string;
  clienteNombre: string;
  onClose: () => void;
}

export function ClienteHistorialModal({
  open,
  clienteId,
  clienteNombre,
  onClose,
}: ClienteHistorialModalProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { ordenes, loading, error, refrescar } = useOrdenesCliente(clienteId);
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const { negocio } = useNegocioUsuario();
  const { imprimirOrden, compartirOrden, descargarPDF } = usePrintService({ negocio });
  const haptic = useHapticFeedback();

  // Cerrar con swipe (mobile)
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeToClose({
    onClose,
    enabled: open && isMobile,
    threshold: 80,
  });

  useAndroidBack(open, onClose);

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

    const formatFecha = (fecha: any) => {
      if (!fecha) return "N/A";
      try {
        const date = fecha?.seconds ? new Date(fecha.seconds * 1000) : new Date(fecha);
        return isNaN(date.getTime()) ? "Fecha inválida" : date.toLocaleDateString("es-ES");
      } catch {
        return "Fecha inválida";
      }
    };

    return (
      <div className="space-y-3">
        {ordenes.map((orden) => (
          <button
            key={orden.id}
            onClick={() => openOrden(orden)}
            className="w-full text-left bg-gray-800/40 hover:bg-gray-800/60 active:bg-gray-800/80 rounded-xl border border-gray-700/40 p-4 transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">
                  Orden #{orden.idPersonalizado || orden.id?.slice(-6)}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                    <Calendar className="w-3 h-3" />
                    {formatFecha(orden.fechaCreacion)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-gray-400 text-xs">
                  <Cpu className="w-3 h-3" />
                  <span className="truncate">{orden.dispositivo?.marca} {orden.dispositivo?.modelo}</span>
                </div>
              </div>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const modalProps = {
    open,
    onOpenChange: (v: boolean) => !v && onClose(),
  };

  return (
    <>
      {isMobile ? (
        <Sheet {...modalProps}>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl bg-gray-900 border-t border-gray-700/60 p-0 max-h-[85vh] flex flex-col"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onInteractOutside={(e) => {
              if (selectedOrden) e.preventDefault();
            }}
          >
            <SheetHeader className="px-5 pt-4 pb-2 border-b border-gray-700/50 text-left sm:text-left">
              <SheetTitle className="text-base font-semibold text-white">Historial de órdenes</SheetTitle>
              <SheetDescription className="text-xs text-gray-500">{clienteNombre}</SheetDescription>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 w-8 h-8 rounded-lg bg-gray-800 active:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <span className="sr-only">Cerrar</span>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </SheetHeader>
            <div className="overflow-y-auto flex-1 p-5">{renderContent()}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog {...modalProps}>
          <DialogContent 
            className="w-[calc(100%-1.5rem)] max-w-md mx-auto rounded-2xl bg-gray-900 border border-gray-700/60 p-0 gap-0 max-h-[85vh] flex flex-col"
            onInteractOutside={(e) => {
              if (selectedOrden) e.preventDefault();
            }}
          >
            <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-700/50">
              <DialogTitle className="text-base font-semibold text-white">Historial de órdenes</DialogTitle>
              <DialogDescription className="text-xs text-gray-500">{clienteNombre}</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 p-5">{renderContent()}</div>
          </DialogContent>
        </Dialog>
      )}
      {selectedOrden && (
        <ModalOrden
          orden={selectedOrden}
          onClose={closeOrdenModal}
          onPrint={imprimirOrden}
          onDownload={descargarPDF}
          onShare={compartirOrden}
        />
      )}
    </>
  );
}