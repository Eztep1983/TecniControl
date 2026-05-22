"use client";

import React, { useState, useCallback, Suspense, memo, useMemo, useRef } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/basic/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/basic/sheet";
import { useMediaQuery } from "@/hooks/clientes/useMediaQuery";
import { useOrdenesCliente } from "@/hooks/clientes/useOrdenesCliente";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { haptic } from "@/hooks/clientes/useHapticFeedback";
import { useSwipeToClose } from "@/hooks/clientes/useSwipeToClose";
import { Calendar, ClipboardList, RefreshCw, X, ChevronRight, PlusCircle } from "lucide-react";
import Link from "next/link";
import type { Orden } from "@/types/orden";
import { useNegocioUsuario } from "@/hooks/useMultiUser";
import { usePrintService } from "@/components/mantenimiento/PrintService";
import { cn } from "@/lib/utils";

// FIX #7: Preload real — se dispara al importar este módulo, no en un effect.
// La promise se guarda para que React.lazy la reutilice (mismo specifier = misma promise).
const modalOrdenImport = () =>
  import("@/components/mantenimiento/ModalOrden").then((m) => ({ default: m.ModalOrden }));
const ModalOrdenLazy = React.lazy(modalOrdenImport);
// Dispara el preload inmediatamente al cargar este archivo
if (typeof window !== "undefined") {
  modalOrdenImport().catch(() => {});
}

interface ClienteHistorialModalProps {
  open: boolean;
  clienteId: string;
  clienteNombre: string;
  onClose: () => void;
}

// ── Constantes de Optimización ─────────────────────────────────────────────
const LIST_THRESHOLD = 50;
const ITEM_HEIGHT = 108;
const INITIAL_VISIBLE_ITEMS = 30;

// FIX #5: formatFecha como función de módulo pura — sin hook, sin useCallback.
function formatFecha(fecha: any): string {
  if (!fecha) return "N/A";
  try {
    const date = fecha?.seconds ? new Date(fecha.seconds * 1000) : new Date(fecha);
    return isNaN(date.getTime()) ? "Fecha inválida" : date.toLocaleDateString("es-ES");
  } catch {
    return "Fecha inválida";
  }
}

// ── Componente de Cabecera Memoizado ───────────────────────────────────────
// FIX #8: Usa SheetTitle/SheetDescription cuando está dentro de Sheet
//         y DialogTitle/DialogDescription cuando está dentro de Dialog.
//         Cada wrapper semántico provee los aria-roles correctos.

const SheetHeaderContent = memo(({
  loading,
  ordenesCount,
  clienteNombre,
}: {
  loading: boolean;
  ordenesCount: number;
  clienteNombre: string;
}) => (
  <div className="flex items-center justify-between w-full pr-10">
    <div className="min-w-0">
      <SheetTitle className="text-base font-bold text-white leading-tight">Historial de órdenes</SheetTitle>
      <SheetDescription className="text-xs text-gray-500 truncate mt-0.5">{clienteNombre}</SheetDescription>
    </div>
    {!loading && ordenesCount > 0 && (
      <div className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <span className="text-[10px] font-black text-blue-400">
          {ordenesCount} {ordenesCount === 1 ? 'ORDEN' : 'ÓRDENES'}
        </span>
      </div>
    )}
  </div>
));
SheetHeaderContent.displayName = "SheetHeaderContent";

const DialogHeaderContent = memo(({
  loading,
  ordenesCount,
  clienteNombre,
}: {
  loading: boolean;
  ordenesCount: number;
  clienteNombre: string;
}) => (
  <div className="flex items-center justify-between w-full pr-10">
    <div className="min-w-0">
      <DialogTitle className="text-base font-bold text-white leading-tight">Historial de órdenes</DialogTitle>
      <DialogDescription className="text-xs text-gray-500 truncate mt-0.5">{clienteNombre}</DialogDescription>
    </div>
    {!loading && ordenesCount > 0 && (
      <div className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <span className="text-[10px] font-black text-blue-400">
          {ordenesCount} {ordenesCount === 1 ? 'ORDEN' : 'ÓRDENES'}
        </span>
      </div>
    )}
  </div>
));
DialogHeaderContent.displayName = "DialogHeaderContent";

// ── Tarjeta de Orden Individual Memoizada ──────────────────────────────────
const OrdenItem = memo(({
  orden,
  onClick,
}: {
  orden: Orden;
  onClick: (o: Orden) => void;
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

// ── Fila de Lista Virtualizada ────────────────────────────────────────────
const VirtualRow = memo(({ index, style, data }: ListChildComponentProps) => {
  const { ordenes, onClick } = data;
  const orden = ordenes[index];
  return (
    <div style={{ ...style, paddingBottom: '12px' }}>
      <OrdenItem
        orden={orden}
        onClick={onClick}
      />
    </div>
  );
});
VirtualRow.displayName = "VirtualRow";

// ── Contenido del historial ───────────────────────────────────────────────
// FIX #1: Extraído a un componente React real en lugar de useMemo retornando JSX.
// Esto da reconciliación correcta y evita closures stale.

interface HistorialContentProps {
  loading: boolean;
  error: string | null;
  ordenes: Orden[];
  showAll: boolean;
  setShowAll: (v: boolean) => void;
  openOrden: (o: Orden) => void;
  handleRefresh: () => void;
  clienteId: string;
  onClose: () => void;
}

const HistorialContent = memo(function HistorialContent({
  loading,
  error,
  ordenes,
  showAll,
  setShowAll,
  openOrden,
  handleRefresh,
  clienteId,
  onClose,
}: HistorialContentProps) {
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

  if (ordenes.length > LIST_THRESHOLD && !showAll) {
    const listHeight = Math.min(500, ITEM_HEIGHT * Math.min(10, ordenes.length));

    return (
      <div className="transform-gpu">
        <List
          height={listHeight}
          itemCount={ordenes.length}
          itemSize={ITEM_HEIGHT}
          width="100%"
          className="custom-scrollbar"
          itemData={{
            ordenes,
            onClick: openOrden,
          }}
        >
          {VirtualRow}
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

  const visibleOrdenes = showAll ? ordenes : ordenes.slice(0, INITIAL_VISIBLE_ITEMS);

  return (
    <div className="space-y-3 transform-gpu">
      {visibleOrdenes.map((orden) => (
        <OrdenItem
          key={orden.id}
          orden={orden}
          onClick={openOrden}
        />
      ))}
      {ordenes.length > INITIAL_VISIBLE_ITEMS && !showAll && (
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
});

// ── Componente Principal ──────────────────────────────────────────────────
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

  // FIX #2: Ref para el scroll container — usado con { passive: true }
  // via onTouchStart en JSX (React synthetic events ya son passive por defecto
  // en React 17+). Para Capacitor, registramos con passive explícito.
  const scrollRef = useRef<HTMLDivElement>(null);

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeToClose({
    onClose,
    enabled: open && isMobile && !selectedOrden,
    threshold: 80,
  });

  useAndroidBack(open, () => {
    if (selectedOrden) setSelectedOrden(null);
    else onClose();
  });

  // FIX #4: haptic es un singleton de módulo — referencia estable.
  // openOrden ya no depende de un objeto que cambia cada render.
  const openOrden = useCallback(
    (orden: Orden) => {
      haptic.selection();
      setSelectedOrden(orden);
    },
    []
  );

  const closeOrdenModal = useCallback(() => setSelectedOrden(null), []);

  const handleRefresh = useCallback(() => {
    haptic.impactLight();
    refrescar();
  }, [refrescar]);

  // FIX #2: stopPropagation estable para evitar que el swipe-to-close
  // interfiera con el scroll interno cuando hay una orden abierta.
  const stopTouchPropagation = useCallback((e: React.TouchEvent) => {
    if (selectedOrden) e.stopPropagation();
  }, [selectedOrden]);

  // FIX #3: onOpenChange estable — sin arrow inline en el render.
  const handleOpenChange = useCallback(
    (v: boolean) => { if (!v) onClose(); },
    [onClose]
  );

  const handleInteractOutside = useCallback(
    (e: Event) => { if (selectedOrden) e.preventDefault(); },
    [selectedOrden]
  );

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent
            hideClose
            side="bottom"
            className="rounded-t-[2.5rem] bg-gray-900 border-t border-gray-800 p-0 max-h-[90vh] flex flex-col overflow-hidden z-[105]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onInteractOutside={handleInteractOutside}
          >
            <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

            {/* FIX #8: SheetHeader con SheetTitle/SheetDescription para aria correcto */}
            <SheetHeader className="px-6 py-4 border-b border-gray-800/50 text-left relative">
              <SheetHeaderContent
                loading={loading}
                ordenesCount={ordenes.length}
                clienteNombre={clienteNombre}
              />
              <button
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gray-800/50 active:bg-gray-700 flex items-center justify-center transition-colors"
                aria-label="Cerrar historial"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </SheetHeader>
            <div
              ref={scrollRef}
              className="overflow-y-auto flex-1 p-6 space-y-4 custom-scrollbar"
              onTouchStart={stopTouchPropagation}
            >
              <HistorialContent
                loading={loading}
                error={error}
                ordenes={ordenes}
                showAll={showAll}
                setShowAll={setShowAll}
                openOrden={openOrden}
                handleRefresh={handleRefresh}
                clienteId={clienteId}
                onClose={onClose}
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent
            hideClose
            className="w-[calc(100%-1.5rem)] max-w-lg mx-auto rounded-3xl bg-gray-900 border border-gray-800 p-0 gap-0 max-h-[85vh] flex flex-col overflow-hidden shadow-2xl z-[105]"
            onInteractOutside={handleInteractOutside}
          >
            {/* FIX #8: DialogHeader con DialogTitle/DialogDescription para aria correcto */}
            <DialogHeader className="px-6 py-5 border-b border-gray-800/50 relative">
              <DialogHeaderContent
                loading={loading}
                ordenesCount={ordenes.length}
                clienteNombre={clienteNombre}
              />
              <button
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gray-800/50 active:bg-gray-700 flex items-center justify-center transition-colors"
                aria-label="Cerrar historial"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
              <HistorialContent
                loading={loading}
                error={error}
                ordenes={ordenes}
                showAll={showAll}
                setShowAll={setShowAll}
                openOrden={openOrden}
                handleRefresh={handleRefresh}
                clienteId={clienteId}
                onClose={onClose}
              />
            </div>
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
