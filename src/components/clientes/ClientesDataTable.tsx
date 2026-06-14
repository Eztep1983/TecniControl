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
  Edit,
} from "lucide-react";
import type { Cliente } from "@/types/orden";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import CountUp from "../ui/CountUp";
import { haptic } from "@/hooks/clientes/useHapticFeedback";
import { useMediaQuery } from "@/hooks/clientes/useMediaQuery";
import { cn } from "@/lib/utils";

// ── Tarjeta individual ───────────────────────────────────────────────────────
interface ClienteCardProps {
  client: Cliente;
  isExiting: boolean;
  isMobile: boolean;
  onView: (c: Cliente) => void;
  onEdit: (c: Cliente) => void;
  onDeleteClick: (id: string) => void;
  onHistorial: (c: Cliente) => void;
}

const ClienteCard = memo(function ClienteCard({
  client,
  isExiting,
  isMobile,
  onView,
  onEdit,
  onDeleteClick,
  onHistorial,
}: ClienteCardProps) {
  const handleView = useCallback(() => {
    haptic.selection();
    onView(client);
  }, [client, onView]);

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      haptic.impactLight();
      onEdit(client);
    },
    [client, onEdit]
  );

  const handleHistorial = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      haptic.selection();
      onHistorial(client);
    },
    [client, onHistorial]
  );

  const handleDeleteConfirmButton = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      haptic.impactMedium();
      onDeleteClick(client.id!);
    },
    [client.id, onDeleteClick]
  );

  return (
    <div
      className={cn(
        "relative bg-gray-800/40 rounded-2xl border border-gray-700/50 transition-all duration-200 overflow-hidden",
        isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100",
        "group hover:bg-gray-800/60 hover:border-gray-600/50"
      )}
    >
      <div 
        className="relative p-5 cursor-pointer flex flex-col gap-4"
        onClick={handleView}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-blue-600/20">
                <User className="w-6 h-6 text-blue-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-base leading-tight truncate group-hover:text-blue-400 transition-colors">
                  {client.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <IdCard className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-400">{client.cedula}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-4">
              {client.phone && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-900/40 border border-gray-700/30">
                  <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <span className="text-xs text-gray-300 font-medium truncate">{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-900/40 border border-gray-700/30">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-xs text-gray-300 font-medium truncate">{client.email}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-900/40 border border-gray-700/30">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <span className="text-xs text-gray-300 font-medium truncate">{client.address}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleDeleteConfirmButton}
            className={cn(
              "p-2 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors",
              !isMobile && "opacity-0 group-hover:opacity-100"
            )}
            aria-label="Eliminar cliente"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={handleHistorial}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 active:bg-gray-700/60 border border-gray-700/50 text-xs font-bold text-gray-300 transition-all active:scale-[0.97]"
          >
            <History className="w-4 h-4" />
            Historial
          </button>
          <button
            onClick={handleEdit}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/30 border border-blue-500/20 text-xs font-bold text-blue-400 transition-all active:scale-[0.97]"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
        </div>
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
      <div className="sticky bottom-6 left-0 right-0 z-20 px-4 mt-8 pointer-events-none">
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
  onDelete: (id: string) => void;
  onView: (c: Cliente) => void;
  onEdit: (c: Cliente) => void;
  onHistorial: (c: Cliente) => void;
}

// ── Componente principal ─────────────────────────────────────────────────────
export const ClientesDataTable = memo(function ClientesDataTable({
  data,
  totalGlobal,
  onDelete,
  onView,
  onEdit,
  onHistorial,
}: ClientesDataTableProps) {
  const { toast } = useToast();
  const scrollSentinelRef = useRef<HTMLDivElement>(null);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const isMobileSm = useMediaQuery("(max-width: 640px)");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exitingIds, setExitingIds] = useState<Record<string, boolean>>({});

  const handleViewStable = useCallback((c: Cliente) => onView(c), [onView]);
  const handleEditStable = useCallback((c: Cliente) => onEdit(c), [onEdit]);
  const handleHistorialStable = useCallback((c: Cliente) => onHistorial(c), [onHistorial]);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const safePage = currentPage > totalPages ? totalPages : currentPage;

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  
  const paginatedClientes = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [safePage, data, itemsPerPage]);

  const handleDeleteClick = useCallback((id: string) => {
    haptic.impactMedium();
    setClienteToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!clienteToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "clientes", clienteToDelete));

      const idToRemove = clienteToDelete;
      setExitingIds((prev) => ({ ...prev, [idToRemove]: true }));

      setTimeout(() => {
        onDelete(idToRemove);
        setExitingIds((prev) => {
          const next = { ...prev };
          delete next[idToRemove];
          return next;
        });
        if (paginatedClientes.length === 1 && currentPage > 1) {
          setCurrentPage((p) => p - 1);
        }
      }, 220);

      toast({ title: "Cliente eliminado", description: "Eliminado correctamente." });
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: error instanceof Error ? error.message : "No se pudo eliminar.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
    }
  }, [clienteToDelete, currentPage, onDelete, paginatedClientes.length, toast]);

  const handleDeleteCancel = useCallback(() => {
    haptic.selection();
    setDeleteDialogOpen(false);
    setClienteToDelete(null);
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      haptic.selection();
      setCurrentPage(page);
      scrollSentinelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [totalPages]
  );

  const clienteNombreAEliminar = useMemo(
    () => data.find((c) => c.id === clienteToDelete)?.name ?? "este cliente",
    [data, clienteToDelete]
  );

  return (
    <div className="space-y-4 pb-24 sm:pb-8">
      <div ref={scrollSentinelRef} aria-hidden="true" />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm mx-auto rounded-2xl bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              ¿Eliminar a {clienteNombreAEliminar}?
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Esta acción no se puede deshacer. Las órdenes asociadas se conservarán
              pero perderás acceso a la información del cliente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 mt-2">
            <Button
              onClick={handleDeleteCancel}
              className="w-full h-12 rounded-xl bg-gray-700/60 hover:bg-gray-700 text-white text-sm font-medium order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="w-full h-12 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-sm font-medium order-1 sm:order-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Eliminando…
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div
        className="bg-gradient-to-br from-blue-400/8 to-blue-900/15 rounded-2xl border border-blue-500/15 px-4 py-3 flex items-center gap-3"
        role="status"
        aria-live="polite"
        aria-label={`Total de clientes: ${totalGlobal ?? data.length}`}
      >
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-blue-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest leading-tight">
            Total de Clientes
          </p>
          <CountUp
            from={0}
            to={Math.max(totalGlobal ?? 0, data.length)}
            direction="up"
            duration={1}
            className="text-2xl font-bold text-white leading-tight"
            delay={0}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">
              {totalGlobal && data.length !== totalGlobal ? "Resultados Filtrados" : "Mostrando"}
            </p>
            <p className="text-xs text-gray-300 font-medium" aria-live="polite">
              {data.length === 0
                ? "Sin resultados"
                : `${(currentPage - 1) * itemsPerPage + 1} a ${Math.min(
                    currentPage * itemsPerPage,
                    data.length
                  )} de ${data.length}`}
            </p>
          </div>
        </div>

        {data.length > 0 && (
          <div className="h-1.5 w-full bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/20 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-500 ease-out"
              style={{
                width: `${data.length > 0 ? Math.min(100, (Math.min(currentPage * itemsPerPage, data.length) / data.length) * 100) : 0}%`,
              }}
            />
          </div>
        )}
      </div>

      {paginatedClientes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-3 px-0.5" role="list" aria-label="Lista de clientes">
          {paginatedClientes.map((client) => (
            <div key={client.id} role="listitem">
              <ClienteCard
                client={client}
                isExiting={!!exitingIds[client.id!]}
                isMobile={isMobile}
                onView={handleViewStable}
                onEdit={handleEditStable}
                onDeleteClick={handleDeleteClick}
                onHistorial={handleHistorialStable}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800/30 rounded-2xl border border-gray-700/40 p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-700/30 flex items-center justify-center">
            <Users className="w-7 h-7 text-gray-600" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">Sin clientes registrados</h3>
          <p className="text-xs text-gray-500">Comienza agregando tu primer cliente</p>
        </div>
      )}

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
