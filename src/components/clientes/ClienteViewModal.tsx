"use client";

import React, { useState, useCallback, lazy, Suspense } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/basic/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/basic/sheet";
import {
  User,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Monitor,
  Edit,
  X,
  Cpu,
  History,
  RefreshCw,
} from "lucide-react";
import type { Cliente } from "@/types/orden";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { useMediaQuery } from "@/hooks/clientes/useMediaQuery";
import { useSwipeToClose } from "@/hooks/clientes/useSwipeToClose";
import { useHapticFeedback } from "@/hooks/clientes/useHapticFeedback";
const ClienteHistorialModalLazy = lazy(() => import("./ClienteHistorialModal").then(m => ({ default: m.ClienteHistorialModal })));

interface ClienteViewModalProps {
  cliente: Cliente | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function ClienteViewModal({ cliente, open, onClose, onEdit }: ClienteViewModalProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const haptic = useHapticFeedback();
  const [historialOpen, setHistorialOpen] = useState(false);

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeToClose({
    onClose,
    enabled: open && isMobile && !historialOpen,
    threshold: 80,
  });

  useAndroidBack(open, () => {
    if (historialOpen) setHistorialOpen(false);
    else onClose();
  });

  const handleEditClick = useCallback(() => {
    haptic.impactLight();
    onEdit();
  }, [haptic, onEdit]);

  const handleHistorialClick = useCallback(() => {
    haptic.selection();
    setHistorialOpen(true);
  }, [haptic]);

  if (!cliente) return null;

  const modalBody = (
    <div className="divide-y divide-gray-800/50">
      {/* Sección Contacto */}
      <section className="p-6 space-y-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          Información de contacto
        </p>
        <div className="grid grid-cols-1 gap-3">
          {cliente.phone && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-800/30 border border-gray-700/40 group">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Teléfono</p>
                <a href={`tel:${cliente.phone}`} className="text-sm text-white font-medium hover:text-green-400 transition-colors">
                  {cliente.phone}
                </a>
              </div>
            </div>
          )}
          {cliente.email && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-800/30 border border-gray-700/40">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Email</p>
                <a href={`mailto:${cliente.email}`} className="text-sm text-white font-medium hover:text-blue-400 transition-colors truncate block">
                  {cliente.email}
                </a>
              </div>
            </div>
          )}
          {cliente.address && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-800/30 border border-gray-700/40">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Dirección</p>
                <p className="text-sm text-white font-medium">
                  {cliente.address}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Dispositivos */}
      <section className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dispositivos vinculados</p>
          <div className="px-2 py-0.5 rounded-lg bg-gray-800 border border-gray-700">
            <span className="text-[10px] font-black text-gray-400">
              {cliente.dispositivos?.length ?? 0}
            </span>
          </div>
        </div>
        {cliente.dispositivos && cliente.dispositivos.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {cliente.dispositivos.map((d, idx) => (
              <div key={d.id ?? idx} className="bg-gray-800/20 rounded-2xl border border-gray-700/30 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{d.marca} {d.modelo}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-700/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                      {d.tipo}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/30 rounded-xl p-2.5 border border-gray-700/20">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Nº Serie</p>
                    <p className="text-xs font-mono text-gray-300 truncate">{d.numeroSerie || "N/A"}</p>
                  </div>
                  <div className="bg-gray-900/30 rounded-xl p-2.5 border border-gray-700/20">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Estado</p>
                    <p className="text-xs text-gray-300 truncate">{d.estado || "Activo"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center bg-gray-800/10 rounded-3xl border border-dashed border-gray-700/50">
            <Cpu className="w-10 h-10 text-gray-700 mx-auto mb-3 opacity-50" />
            <p className="text-xs text-gray-500 font-medium">Sin dispositivos registrados</p>
          </div>
        )}
      </section>
    </div>
  );

  const header = (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-blue-400/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <User className="w-7 h-7 text-blue-400" />
        </div>
        <div className="min-w-0">
          {isMobile ? (
            <SheetTitle className="text-lg font-bold text-white leading-tight truncate">
              {cliente.name}
            </SheetTitle>
          ) : (
            <DialogTitle className="text-lg font-bold text-white leading-tight truncate">
              {cliente.name}
            </DialogTitle>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <IdCard className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 truncate">{cliente.cedula}</span>
          </div>
          {/* Hidden description for accessibility */}
          {isMobile ? (
             <SheetDescription className="sr-only">Detalles del cliente {cliente.name}</SheetDescription>
          ) : (
             <DialogDescription className="sr-only">Detalles del cliente {cliente.name}</DialogDescription>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-10 h-10 rounded-xl bg-gray-800/50 hover:bg-gray-700 active:bg-gray-600 flex items-center justify-center transition-colors flex-shrink-0"
        aria-label="Cerrar"
      >
        <X className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );

  const sharedModalContent = historialOpen ? (
    <Suspense fallback={
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/20">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    }>
      <ClienteHistorialModalLazy
        open={historialOpen}
        clienteId={cliente.id!}
        clienteNombre={cliente.name}
        onClose={() => setHistorialOpen(false)}
      />
    </Suspense>
  ) : null;

  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
          <SheetContent 
              hideClose 
              side="bottom" 
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
              className="rounded-t-[2.5rem] bg-gray-900 border-t border-gray-800 p-0 max-h-[90vh] flex flex-col overflow-hidden" 
              onTouchStart={handleTouchStart} 
              onTouchMove={handleTouchMove} 
              onTouchEnd={handleTouchEnd}
            >
            <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
            <SheetHeader className="px-6 py-4 border-b border-gray-800/50 flex-shrink-0 text-left">
              {header}
            </SheetHeader>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {modalBody}
            </div>
          </SheetContent>
        </Sheet>
        {sharedModalContent}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent 
          hideClose 
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          className="w-[calc(100%-1.5rem)] max-w-lg mx-auto rounded-3xl bg-gray-900 border border-gray-800 p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col shadow-2xl"
        >
          <DialogHeader className="px-6 py-5 border-b border-gray-800/50 flex-shrink-0 relative">
            {header}
          </DialogHeader>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {modalBody}
          </div>
        </DialogContent>
      </Dialog>
      {sharedModalContent}
    </>
  );
}