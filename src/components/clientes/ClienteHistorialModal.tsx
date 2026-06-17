"use client";

import React, { useState, useCallback, Suspense, memo, useMemo, useRef } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { Modal } from "@/components/ui/Modal";
import { useMediaQuery } from "@/hooks/clientes/useMediaQuery";
import { useOrdenesCliente } from "@/hooks/clientes/useOrdenesCliente";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { haptic } from "@/hooks/clientes/useHapticFeedback";
import { useSwipeToClose } from "@/hooks/clientes/useSwipeToClose";
import { Calendar, ClipboardList, RefreshCw, X, ChevronRight, PlusCircle, CloudOff } from "lucide-react";
import { useMobileNavigation } from "@/components/providers/MobileNavigationContext";
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
  onClose: (shouldCloseParent?: boolean) => void;
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
          {(orden as any).isOfflinePending && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              <CloudOff className="w-3 h-3" />
              Pendiente
            </span>
          )}
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
  onCrearOrdenClick: () => void;
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
  onCrearOrdenClick,
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
        <button
          onClick={onCrearOrdenClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded-xl text-blue-400 font-medium transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          Crear primera orden
        </button>
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
  const { openModal } = useMobileNavigation();

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
    threshold: 100,
    scrollRef: scrollRef as any,
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

  const handleCrearOrdenClick = useCallback(() => {
    haptic.impactLight();
    onClose(true);

    // Esperar a que los modales se cierren y useAndroidBack limpie el historial para evitar cierres instantáneos
    setTimeout(() => {
      openModal();
      // Añadir el parámetro clienteId a la URL sin recargar
      const url = new URL(window.location.href);
      url.searchParams.set("clienteId", clienteId);
      window.history.replaceState(window.history.state, "", url.toString());
    }, 200);
  }, [onClose, openModal, clienteId]);

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
      <Modal
        isOpen={open}
        onClose={onClose}
        title={
          <div className="flex items-center justify-between w-full pr-10">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white leading-tight">Historial de órdenes</h3>
              <p className="text-xs text-gray-500 truncate mt-0.5">{clienteNombre}</p>
            </div>
            {!loading && ordenes.length > 0 && (
              <div className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="text-[10px] font-black text-blue-400">
                  {ordenes.length} {ordenes.length === 1 ? 'ORDEN' : 'ÓRDENES'}
                </span>
              </div>
            )}
          </div>
        }
      >
        <div
          ref={scrollRef}
          className="space-y-4"
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
            onCrearOrdenClick={handleCrearOrdenClick}
          />
        </div>
      </Modal>
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
