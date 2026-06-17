"use client";

import * as React from "react";
import { memo, useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/basic/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/basic/dialog";
import {
  Trash2,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Users,
  IdCard,
  History,
  Plus,
  Monitor,
} from "lucide-react";
import type { Cliente } from "@/types/orden";
import { useToast } from "@/hooks/use-toast";
import CountUp from "../ui/CountUp";
import { haptic } from "@/hooks/clientes/useHapticFeedback";
import { useMediaQuery } from "@/hooks/clientes/useMediaQuery";
import { cn } from "@/lib/utils";
import { useMobileNavigation } from "@/components/providers/MobileNavigationContext";

// ── Tarjeta individual ───────────────────────────────────────────────────────
interface ClienteCardProps {
  client: Cliente;
  isExiting: boolean;
  isMobile: boolean;
  onView: (c: Cliente) => void;
  onHistorial: (c: Cliente) => void;
}

const ClienteCard = memo(function ClienteCard({
  client,
  isExiting,
  isMobile,
  onView,
  onHistorial,
}: ClienteCardProps) {
  const { openModal } = useMobileNavigation();

  const handleView = useCallback(() => {
    haptic.selection();
    onView(client);
  }, [client, onView]);

  const handleEmitirOrden = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      haptic.impactLight();
      openModal();
      const url = new URL(window.location.href);
      url.searchParams.set("clienteId", client.id!);
      window.history.replaceState(window.history.state, "", url.toString());
    },
    [client, openModal]
  );

  const handleHistorial = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      haptic.selection();
      onHistorial(client);
    },
    [client, onHistorial]
  );

  return (
    <div
      className={cn(
        "relative bg-gray-800/40 rounded-2xl border border-gray-700/50 transition-all duration-200 overflow-hidden",
        isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100",
        "group hover:bg-gray-800/60 hover:border-gray-600/50 flex flex-col sm:flex-row"
      )}
    >
      {/* Información del Cliente (Tappable para ver detalle) */}
      <div 
        className="flex-1 flex items-center p-4 gap-4 cursor-pointer"
        onClick={handleView}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleView();
          }
        }}
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-blue-600/20">
          <User className="w-6 h-6 text-blue-400" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-bold text-white text-base leading-tight truncate group-hover:text-blue-400 transition-colors">
            {client.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-medium text-gray-400">
            {client.cedula && (
              <span className="flex items-center gap-1">
                <IdCard className="w-3.5 h-3.5" />
                {client.cedula}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {client.phone}
              </span>
            )}
            <span className="flex items-center gap-1 text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded-md">
              <Monitor className="w-3 h-3" />
              {client.dispositivos?.length ?? 0} {client.dispositivos?.length === 1 ? 'Disp.' : 'Disp.'}
            </span>
          </div>
        </div>
        <div className="text-gray-500 group-hover:text-blue-400 transition-colors flex flex-col items-center justify-center">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center gap-1.5 p-3 sm:p-4 bg-gray-900/30 sm:bg-transparent border-t border-gray-700/30 sm:border-t-0 sm:border-l sm:ml-auto">
        <button
          onClick={handleEmitirOrden}
          className="flex-1 sm:flex-none min-w-[44px] min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 transition-colors px-3"
          aria-label="Emitir orden"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs font-bold sm:hidden">Emitir Orden</span>
        </button>
        <button
          onClick={handleHistorial}
          className="flex-1 sm:flex-none min-w-[44px] min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 border border-gray-700/50 text-gray-300 transition-colors px-3"
          aria-label="Ver historial"
        >
          <History className="w-4 h-4" />
          <span className="text-xs font-bold sm:hidden">Historial</span>
        </button>
      </div>
    </div>
  );
});

// ── Paginación ────────────────────────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  isMobile: boolean;
  onPage: (p: number) => void;
}

const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  isMobile,
  onPage,
}: PaginationProps) {
  const pages = useMemo(() => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    const visible = all.filter((p) => {
      if (totalPages <= 7) return true;
      if (p === 1 || p === totalPages) return true;
      return Math.abs(p - currentPage) <= 1;
    });

    const result: (number | { type: "ellipsis"; key: string })[] = [];
    visible.forEach((p, idx) => {
      if (idx > 0 && p - visible[idx - 1] > 1) {
        result.push({ type: "ellipsis", key: `ellipsis-${idx}` });
      }
      result.push(p);
    });
    return result;
  }, [currentPage, totalPages]);

  const handlePageChange = useCallback((p: number) => {
    if (p === currentPage || p < 1 || p > totalPages) return;
    haptic.selection();
    onPage(p);
  }, [currentPage, totalPages, onPage]);

  if (isMobile) {
    return (
      <div className="sticky bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-20 px-4 mt-8 pointer-events-none">
        <nav
          aria-label="Paginación móvil"
          className="mx-auto max-w-[280px] flex items-center justify-between bg-gray-900/80 border border-gray-700/50 rounded-2xl p-1.5 shadow-2xl shadow-black/60 ring-1 ring-white/10 pointer-events-auto transition-transform active:scale-[0.98]"
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-gray-800/60 text-gray-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none active:scale-90 transition-all focus:outline-none"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center px-4">
            <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-0.5 leading-none">
              Página
            </span>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-sm font-black text-blue-400 tabular-nums">
                {currentPage}
              </span>
              <span className="text-[10px] text-gray-600 font-medium">/</span>
              <span className="text-xs font-semibold text-gray-500 tabular-nums">
                {totalPages}
              </span>
            </div>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-gray-800/60 text-gray-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none active:scale-90 transition-all focus:outline-none"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </nav>
      </div>
    );
  }

  return (
    <nav
      aria-label="Paginación de clientes"
      className="flex items-center justify-between gap-4 pt-6 border-t border-gray-800/50 mt-4"
    >
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-2 h-11 px-4 rounded-xl bg-gray-800/40 hover:bg-gray-700/60 text-sm text-gray-300 font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Anterior</span>
      </button>

      <div className="flex items-center gap-1.5">
        {pages.map((item) => {
          if (typeof item === "object") {
            return (
              <span
                key={item.key}
                className="w-8 text-center text-xs text-gray-600 font-bold"
                aria-hidden="true"
              >
                ···
              </span>
            );
          }
          return (
            <button
              key={item}
              onClick={() => handlePageChange(item)}
              aria-current={currentPage === item ? "page" : undefined}
              className={`min-w-[40px] h-10 rounded-xl text-sm font-bold transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none ${
                currentPage === item
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                  : "text-gray-500 hover:bg-gray-800/60 hover:text-gray-300"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-2 h-11 px-4 rounded-xl bg-gray-800/40 hover:bg-gray-700/60 text-sm text-gray-300 font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
      >
        <span>Siguiente</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
});

interface ClientesDataTableProps {
  data: Cliente[];
  totalGlobal?: number | null;
  onView: (c: Cliente) => void;
  onHistorial: (c: Cliente) => void;
}

// ── Componente principal ─────────────────────────────────────────────────────
export const ClientesDataTable = memo(function ClientesDataTable({
  data,
  totalGlobal,
  onView,
  onHistorial,
}: ClientesDataTableProps) {
  const { toast } = useToast();
  
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const isMobileSm = useMediaQuery("(max-width: 640px)");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const handleViewStable = useCallback((c: Cliente) => onView(c), [onView]);
  const handleHistorialStable = useCallback((c: Cliente) => onHistorial(c), [onHistorial]);


  // 1. Resetear paginación al buscar/filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const safePage = currentPage > totalPages ? totalPages : currentPage;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  
  const paginatedClientes = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [safePage, data, itemsPerPage]);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      haptic.selection();
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [totalPages]
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-gray-400 font-medium" aria-live="polite">
          {data.length === 0
            ? "Sin resultados"
            : `Mostrando ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                currentPage * itemsPerPage,
                data.length
              )} de ${totalGlobal && data.length !== totalGlobal ? `${data.length} (filtrados)` : data.length} clientes`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" role="list" aria-label="Lista de clientes">
        {paginatedClientes.map((client) => (
          <div key={client.id} role="listitem">
            <ClienteCard
              client={client}
              isExiting={false}
              isMobile={isMobile}
              onView={handleViewStable}
              onHistorial={handleHistorialStable}
            />
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          isMobile={isMobileSm}
          onPage={goToPage}
        />
      )}
    </div>
  );
});
