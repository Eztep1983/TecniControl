// components/clientes/ClientesDataTable.tsx
"use client";

import * as React from "react";
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
import { useState, useMemo, useEffect } from "react";

// ── Animaciones ───────────────────────────────────────────────────────────────
const CARD_ANIM = `
@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.cliente-card-enter { animation: cardFadeIn 0.28s ease both; }
@keyframes cardFadeOut {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.96); }
}
.cliente-card-exit { animation: cardFadeOut 0.22s ease forwards; }
`;

// ── Props ─────────────────────────────────────────────────────────────────────
interface ClientesDataTableProps {
  data: Cliente[];
  onDelete: (id: string) => void;
  onView: (cliente: Cliente) => void;
  onEdit: (cliente: Cliente) => void;
}

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
  const [pageKey, setPageKey] = useState(0);

  // Inyectar CSS de animaciones una sola vez
  useEffect(() => {
    if (document.getElementById("clientes-card-anim")) return;
    const s = document.createElement("style");
    s.id = "clientes-card-anim";
    s.textContent = CARD_ANIM;
    document.head.appendChild(s);
  }, []);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedClientes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [currentPage, data, itemsPerPage]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClienteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clienteToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "clientes", clienteToDelete));

      // Fade-out antes de remover
      setExitingIds((prev) => new Set(prev).add(clienteToDelete));
      setTimeout(() => {
        onDelete(clienteToDelete);
        setExitingIds((prev) => {
          const next = new Set(prev);
          next.delete(clienteToDelete!);
          return next;
        });
      }, 230);

      toast({
        title: "✅ Cliente eliminado",
        description: "El cliente ha sido eliminado correctamente.",
      });

      if (paginatedClientes.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch (error) {
      toast({
        title: "❌ Error",
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
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setPageKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 pb-6">

      {/* Modal confirmación eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm mx-auto rounded-2xl bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">¿Eliminar cliente?</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este cliente
              permanentemente?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 mt-2">
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="w-full h-12 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-sm font-medium"
            >
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando…</>
              ) : (
                "Eliminar"
              )}
            </Button>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
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

      {/* Controles */}
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
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
              setPageKey((k) => k + 1);
            }}
          >
            {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Grid de tarjetas */}
      {paginatedClientes.length > 0 ? (
        <div
          key={pageKey}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          {paginatedClientes.map((client, idx) => {
            const isExiting = exitingIds.has(client.id!);

            return (
              <div
                key={client.id}
                className={`cliente-card-enter relative bg-gray-800/50 rounded-2xl border border-gray-700/40 overflow-hidden transition-opacity duration-200 active:scale-[0.99] ${
                  isExiting ? "cliente-card-exit" : ""
                }`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Área clickeable → abre modal de vista */}
                <button
                  onClick={() => onView(client)}
                  className="w-full text-left p-4 focus:outline-none"
                >
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
                    onClick={(e) => { e.stopPropagation(); onEdit(client); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:text-white hover:bg-gray-700/30 active:bg-gray-700/50 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Editar
                  </button>

                  <div className="w-px h-7 bg-gray-700/40" />

                  <button
                    onClick={() => onView(client)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:text-white hover:bg-gray-700/30 active:bg-gray-700/50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver
                  </button>

                  <div className="w-px h-7 bg-gray-700/40" />

                  <button
                    onClick={(e) => handleDeleteClick(client.id!, e)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-500/60 hover:text-red-400 hover:bg-red-500/8 active:bg-red-500/15 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
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
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gray-700/40 hover:bg-gray-700 text-sm text-gray-300 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (totalPages <= 5) return true;
                if (p === 1 || p === totalPages) return true;
                return Math.abs(p - currentPage) <= 1;
              })
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (
                  idx > 0 &&
                  typeof arr[idx - 1] === "number" &&
                  (p as number) - (arr[idx - 1] as number) > 1
                ) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "..." ? (
                  <span key={`e-${idx}`} className="w-7 text-center text-xs text-gray-600">···</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => goToPage(item as number)}
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
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gray-700/40 hover:bg-gray-700 text-sm text-gray-300 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}