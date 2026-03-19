// components/clientes/ClienteViewModal.tsx
// Modal de detalle: muestra info completa del cliente, sus dispositivos
// y acciones rápidas (historial, nueva orden). Se abre desde la tarjeta.

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/basic/dialog";
import {
  User,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Monitor,
  Calendar,
  FileText,
  Edit,
  X,
  History,
  ChevronRight,
  Cpu,
} from "lucide-react";
import type { Cliente } from "@/types/orden";
import Link from "next/link";
import { useAndroidBack } from "@/hooks/useAndroidBack";


interface ClienteViewModalProps {
  cliente: Cliente | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function ClienteViewModal({
  cliente,
  open,
  onClose,
  onEdit,
}: ClienteViewModalProps) {
  if (!cliente) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  useAndroidBack(open, onClose);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg mx-auto rounded-2xl bg-gray-900 border border-gray-700/60 p-0 gap-0 overflow-hidden max-h-[92dvh] flex flex-col">

        {/* ── Header ──────────────────────────────────────────────────── */}
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
                <div className="flex items-center gap-1 mt-0.5">
                  <IdCard className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <p className="text-xs text-gray-500 truncate">{cliente.cedula}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </DialogHeader>

        {/* ── Scroll body ─────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-700/40">

          {/* Contacto */}
          <section className="px-5 py-4 space-y-2.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Contacto
            </p>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <a
                href={`mailto:${cliente.email}`}
                className="text-sm text-blue-400 hover:text-blue-300 truncate transition-colors"
              >
                {cliente.email}
              </a>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <a
                href={`tel:${cliente.phone}`}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {cliente.phone}
              </a>
            </div>

            {cliente.address && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-300">{cliente.address}</p>
              </div>
            )}

            {/* Fechas */}
            {(cliente.createdAt || cliente.updatedAt) && (
              <div className="flex items-center gap-4 pt-1">
                {cliente.createdAt && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-gray-600" />
                    <span className="text-xs text-gray-500">
                      Registro: {formatDate(cliente.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Dispositivos */}
          <section className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                Dispositivos
              </p>
              <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                {cliente.dispositivos?.length ?? 0}
              </span>
            </div>

            {cliente.dispositivos && cliente.dispositivos.length > 0 ? (
              <div className="space-y-2">
                {cliente.dispositivos.map((d, idx) => (
                  <div
                    key={d.id ?? idx}
                    className="bg-gray-800/60 rounded-xl border border-gray-700/40 p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center flex-shrink-0">
                        <Monitor className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <p className="text-sm font-medium text-white capitalize">{d.tipo}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-9">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Marca</p>
                        <p className="text-xs text-gray-300">{d.marca}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Modelo</p>
                        <p className="text-xs text-gray-300">{d.modelo}</p>
                      </div>
                      <div className="col-span-2 mt-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Serie</p>
                        <p className="text-xs font-mono text-gray-400">{d.numeroSerie}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <Cpu className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Sin dispositivos registrados</p>
              </div>
            )}
          </section>

          {/* Acciones rápidas */}
          <section className="px-5 py-4">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Acciones rápidas
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/clientes/${cliente.id}/historial`}
                onClick={onClose}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-800/60 border border-gray-700/40 hover:bg-gray-800 hover:border-gray-600/60 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <History className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white">Historial</p>
                  <p className="text-[10px] text-gray-500 truncate">Órdenes anteriores</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600 ml-auto group-hover:text-gray-400 transition-colors flex-shrink-0" />
              </Link>

              <Link
                href={`/ordenes/nueva?clienteId=${cliente.id}`}
                onClick={onClose}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-800/60 border border-gray-700/40 hover:bg-gray-800 hover:border-gray-600/60 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/15 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white">Nueva orden</p>
                  <p className="text-[10px] text-gray-500 truncate">Para este cliente</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600 ml-auto group-hover:text-gray-400 transition-colors flex-shrink-0" />
              </Link>
            </div>
          </section>
        </div>

      </DialogContent>
    </Dialog>
  );
}