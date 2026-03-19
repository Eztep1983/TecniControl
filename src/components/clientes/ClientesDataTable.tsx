// components/clientes/ClientesDataTable.tsx
"use client";

import * as React from "react";
import { memo, useState, useMemo, useEffect, useCallback } from "react";
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
  Edit,
  Trash2,
  Eye,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Users,
  IdCard,
} from "lucide-react";
import type { Cliente } from "@/types/orden";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

// ── CSS animaciones (inyectado una sola vez) ───────────────────────────────────
const CARD_ANIM_ID = "clientes-card-anim";
const CARD_ANIM_CSS = `
@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.cliente-card-enter { animation: cardFadeIn 0.24s ease both; }
@keyframes cardFadeOut {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.96); }
}
.cliente-card-exit { animation: cardFadeOut 0.2s ease forwards; pointer-events: none; }
`;

function injectCardAnim() {
  if (typeof document === "undefined" || document.getElementById(CARD_ANIM_ID)) return;
  const s = document.createElement("style");
  s.id = CARD_ANIM_ID;
  s.textContent = CARD_ANIM_CSS;
  document.head.appendChild(s);
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface ClientesDataTableProps {
  data: Cliente[];
  onDelete: (id: string) => void;
  onView: (cliente: Cliente) => void;
  onEdit: (cliente: Cliente) => void;
}

// ── Tarjeta individual memoizada ──────────────────────────────────────────────
interface ClienteCardProps {
  client: Cliente;
  isExiting: boolean;
  animDelay: number;
  onView: (c: Cliente) => void;
  onEdit: (c: Cliente) => void;
  onDeleteClick: (id: string) => void;
}

const ClienteCard = memo(function ClienteCard({
  client,
  isExiting,
  animDelay,
  onView,
  onEdit,
  onDeleteClick,
}: ClienteCardProps) {
  const handleView = useCallback(() => onView(client), [client, onView]);
  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(client);
    },
    [client, onEdit]
  );
  const handleDelete = useCallback(
    () => onDeleteClick(client.id!),
    [client.id, onDeleteClick]
  );

  return (
    <div
      className={`cliente-card-enter relative bg-gray-800/50 rounded-2xl border border-gray-700/40 overflow-hidden active:scale-[0.99] transition-[opacity,transform]${
        isExiting ? " cliente-card-exit" : ""
      }`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Área clickeable → abre modal de vista */}
      <button onClick={handleView} className="w-full text-left p-4 focus:outline-none">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/15 ring-1 ring-blue-500/20 flex items-center justify-center flex-shrink-0">
            <User className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white text-sm leading-tight truncate">
              {client.name}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <IdCard className="w-3 h-3 text-gray-600 flex-shrink-0" />
              <p className="text-xs text-gray-500 truncate">{client.cedula}</p>
            </div>
          </div>
        </div>

        {/* Info contacto */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="w-3 h-3 text-gray-600 flex-shrink-0" />
            <p className="text-xs text-gray-400 truncate">{client.email}</p>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Phone className="w-3 h-3 text-gray-600 flex-shrink-0" />
            <p className="text-xs text-gray-400 truncate">{client.phone}</p>
          </div>
          {client.address && (
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="w-3 h-3 text-gray-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 line-clamp-1">{client.address}</p>
            </div>
          )}
        </div>
      </button>

      {/* Barra de acciones */}
      <div className="flex items-center border-t border-gray-700/40">
        <button
          onClick={handleEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:text-white hover:bg-gray-700/30 active:bg-gray-700/50 transition-colors"
        >
          <Edit className="w-3.5 h-3.5" />
          Editar
        </button>

        <div className="w-px h-7 bg-gray-700/40" />

        <button
          onClick={handleView}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:text-white hover:bg-gray-700/30 active:bg-gray-700/50 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Ver
        </button>

        <div className="w-px h-7 bg-gray-700/40" />

        <button
          onClick={handleDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-500/60 hover:text-red-400 hover:bg-red-500/8 active:bg-red-500/15 transition-colors"
          aria-label="Eliminar cliente"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

// ── Paginación ────────────────────────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPage: (p: number) => void;
}

const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPage,
}: PaginationProps) {
  const pages = useMemo(() => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    const filtered = all.filter((p) => {
      if (totalPages <= 5) return true;
      if (p === 1 || p === totalPages) return true;
      return Math.abs(p - currentPage) <= 1;
    });

    const result: (number | "...")[] = [];
    filtered.forEach((p, idx) => {
      if (idx > 0 && typeof filtered[idx - 1] === "number" && p - filtered[idx - 1] > 1) {
        result.push("...");
      }
      result.push(p);
    });
    return result;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <button
        onClick={() => onPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gray-700/40 hover:bg-gray-700 text-sm text-gray-300 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
        Anterior
      </button>

      <div className="flex items-center gap-1">
        {pages.map((item, idx) =>
          item === "..." ? (
            <span key={`e-${idx}`} className="w-7 text-center text-xs text-gray-600">
              ···
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPage(item as number)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                currentPage === item
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-500 hover:bg-gray-700/50 hover:text-gray-300"
              }`}
            >
              {item}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPage(currentPage + 2)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gray-700/40 hover:bg-gray-700 text-sm text-gray-300 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Siguiente
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
});

// ── Componente principal ──────────────────────────────────────────────────────
export function ClientesDataTable({
  data,
  onDelete,
  onView,
  onEdit,
}: ClientesDataTableProps) {
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  // Inyectar CSS una sola vez
  useEffect(() => { injectCardAnim(); }, []);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  // Ajustar página si queda fuera de rango
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedClientes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [currentPage, data, itemsPerPage]);

  // ── Callbacks estables ────────────────────────────────────────────────────
  const handleDeleteClick = useCallback((id: string) => {
    setClienteToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!clienteToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "clientes", clienteToDelete));

      setExitingIds((prev) => new Set(prev).add(clienteToDelete));
      setTimeout(() => {
        onDelete(clienteToDelete);
        setExitingIds((prev) => {
          const next = new Set(prev);
          next.delete(clienteToDelete);
          return next;
        });
        // Retroceder página si era el último elemento
        if (paginatedClientes.length === 1 && currentPage > 1) {
          setCurrentPage((p) => p - 1);
        }
      }, 220);

      toast({ title: "Cliente eliminado", description: "Eliminado correctamente." });
    } catch (error) {
      toast({
        title: "Error",
        description:
          "No se pudo eliminar. " +
          (error instanceof Error ? error.message : "Intente nuevamente."),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
    }
  }, [clienteToDelete, currentPage, onDelete, paginatedClientes.length, toast]);

  const handleDeleteCancel = useCallback(() => setDeleteDialogOpen(false), []);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [totalPages]
  );

  const handleItemsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setItemsPerPage(Number(e.target.value));
      setCurrentPage(1);
    },
    []
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 pb-6">
      {/* Modal confirmación eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm mx-auto rounded-2xl bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">¿Eliminar cliente?</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Esta acción no se puede deshacer. ¿Estás seguro?
              No se eliminarán las órdenes asociadas, pero perderás acceso a la información del cliente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 mt-2">
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="w-full h-12 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-sm font-medium"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando…
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
            <Button
              onClick={handleDeleteCancel}
              className="w-full h-12 rounded-xl bg-gray-700/60 hover:bg-gray-700 text-white text-sm font-medium"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stat bar */}
      <div className="bg-gradient-to-br from-blue-400/8 to-blue-900/15 rounded-2xl border border-blue-500/15 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest leading-tight">
            Total de Clientes
          </p>
          <p className="text-2xl font-bold text-white leading-tight">{data.length}</p>
        </div>
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500">
          {data.length === 0
            ? "Sin clientes"
            : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(
                currentPage * itemsPerPage,
                data.length
              )} de ${data.length}`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Ver</span>
          <select
            className="h-8 rounded-lg border border-gray-700 bg-gray-800/50 px-2 text-sm text-white focus:border-blue-500/50 outline-none"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de tarjetas */}
      {paginatedClientes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {paginatedClientes.map((client, idx) => (
            <ClienteCard
              key={client.id}
              client={client}
              isExiting={exitingIds.has(client.id!)}
              animDelay={idx * 35}
              onView={onView}
              onEdit={onEdit}
              onDeleteClick={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-800/30 rounded-2xl border border-gray-700/40 p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-700/30 flex items-center justify-center">
            <Users className="w-7 h-7 text-gray-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">Sin clientes registrados</h3>
          <p className="text-xs text-gray-500">Comienza agregando tu primer cliente</p>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPage={goToPage}
        />
      )}
    </div>
  );
}