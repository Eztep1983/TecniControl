"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/basic/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/basic/sheet";
import {
  User,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Monitor,
  FileText,
  Edit,
  X,
  History,
  Cpu,
} from "lucide-react";
import type { Cliente } from "@/types/orden";
import Link from "next/link";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { useMediaQuery } from "@/hooks/clientes/useMediaQuery";
import { useSwipeToClose } from "@/hooks/clientes/useSwipeToClose";
import { useHapticFeedback } from "@/hooks/clientes/useHapticFeedback";
import { ClienteHistorialModal } from "./ClienteHistorialModal";

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
    enabled: open && isMobile,
    threshold: 80,
  });

  useAndroidBack(open, onClose);

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
    <>
      {/* Sección Contacto */}
      <section className="px-5 py-4 space-y-3">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Contacto
        </p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-gray-400" />
          </div>
          <a href={`mailto:${cliente.email}`} className="text-sm text-blue-400 truncate py-2">
            {cliente.email}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
            <Phone className="w-4 h-4 text-gray-400" />
          </div>
          <a href={`tel:${cliente.phone}`} className="text-sm text-blue-400 py-2">
            {cliente.phone}
          </a>
        </div>
        {cliente.address && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-300 py-2">
              {cliente.address}
            </p>
          </div>
        )}
      </section>

      {/* Dispositivos */}
      <section className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Dispositivos</p>
          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
            {cliente.dispositivos?.length ?? 0}
          </span>
        </div>
        {cliente.dispositivos && cliente.dispositivos.length > 0 ? (
          <div className="space-y-2">
            {cliente.dispositivos.map((d, idx) => (
              <div key={d.id ?? idx} className="bg-gray-800/60 rounded-xl border border-gray-700/40 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-white capitalize">{d.tipo}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-10">
                  <div><p className="text-[10px] text-gray-500">Marca</p><p className="text-xs text-gray-300">{d.marca}</p></div>
                  <div><p className="text-[10px] text-gray-500">Modelo</p><p className="text-xs text-gray-300">{d.modelo}</p></div>
                  <div className="col-span-2"><p className="text-[10px] text-gray-500">Serie</p><p className="text-xs font-mono text-gray-400">{d.numeroSerie}</p></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center"><Cpu className="w-8 h-8 text-gray-700 mx-auto mb-2" /><p className="text-xs text-gray-500">Sin dispositivos registrados</p></div>
        )}
      </section>

      {/* Acciones rápidas */}
      <section className="px-5 py-4">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Acciones rápidas</p>
        <div className="grid grid-cols-2 gap-3 touch-manipulation">
          <button onClick={handleHistorialClick} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/60 border border-gray-700/40 hover:bg-gray-800 active:bg-gray-700 min-h-[64px]">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center"><History className="w-5 h-5 text-amber-400" /></div>
            <div className="text-left"><p className="text-sm font-medium text-white">Ver Historial</p><p className="text-[11px] text-gray-500">Órdenes anteriores</p></div>
          </button>
        </div>
        <button onClick={handleEditClick} className="mt-3 w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 active:bg-blue-500/30 min-h-[48px]">
          <Edit className="w-4 h-4 text-blue-400" /><span className="text-sm font-medium text-blue-400">Editar cliente</span>
        </button>
      </section>
    </>
  );

  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
          <SheetContent side="bottom" className="rounded-t-2xl bg-gray-900 border-t border-gray-700/60 p-0 max-h-[85vh] flex flex-col" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <SheetHeader className="px-5 pt-5 pb-4 border-b border-gray-700/50 flex-shrink-0 text-left sm:text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/25 to-purple-500/20 ring-1 ring-blue-500/25 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="text-base font-semibold text-white leading-tight truncate">
                      {cliente.name}
                    </SheetTitle>
                    <SheetDescription className="flex items-center gap-1 mt-0.5">
                      <IdCard className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <span className="text-xs text-gray-500 truncate">{cliente.cedula}</span>
                    </SheetDescription>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 active:bg-gray-600 flex items-center justify-center transition-colors flex-shrink-0 touch-manipulation"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </SheetHeader>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-700/40 custom-scrollbar">
              {modalBody}
            </div>
          </SheetContent>
        </Sheet>
        <ClienteHistorialModal open={historialOpen} clienteId={cliente.id!} clienteNombre={cliente.name} onClose={() => setHistorialOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent hideClose className="w-[calc(100%-1.5rem)] max-w-lg mx-auto rounded-2xl bg-gray-900 border border-gray-700/60 p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-700/50 flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/25 to-purple-500/20 ring-1 ring-blue-500/25 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-semibold text-white leading-tight truncate">
                    {cliente.name}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-1 mt-0.5">
                    <IdCard className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span className="text-xs text-gray-500 truncate">{cliente.cedula}</span>
                  </DialogDescription>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 active:bg-gray-600 flex items-center justify-center transition-colors flex-shrink-0 touch-manipulation"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 divide-y divide-gray-700/40 custom-scrollbar">
            {modalBody}
          </div>
        </DialogContent>
      </Dialog>
      <ClienteHistorialModal open={historialOpen} clienteId={cliente.id!} clienteNombre={cliente.name} onClose={() => setHistorialOpen(false)} />
    </>
  );
}