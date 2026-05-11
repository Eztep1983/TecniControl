"use client";

import * as React from "react";
import { memo, useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  History,
} from "lucide-react";
import type { Cliente } from "@/types/orden";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import CountUp from "../ui/CountUp";
import { useHapticFeedback } from "@/hooks/clientes/useHapticFeedback";
import { useMediaQuery } from "@/hooks/clientes/useMediaQuery";

// ── CSS de animación (inyectado una sola vez) ────────────────────────────────
const CARD_ANIM_ID = "clientes-card-anim-v2";
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

// ── Props del componente principal ──────────────────────────────────────────
interface ClientesDataTableProps {
  data: Cliente[];
  onDelete: (id: string) => void;
  onView: (cliente: Cliente) => void;
  onEdit: (cliente: Cliente) => void;
  onHistorial: (cliente: Cliente) => void; // Nueva prop
}

// ── Tarjeta individual con swipe to delete y haptic ─────────────────────────
interface ClienteCardProps {
  client: Cliente;
  isExiting: boolean;
  animDelay: number;
  onView: (c: Cliente) => void;
  onEdit: (c: Cliente) => void;
  onDeleteClick: (id: string) => void;
  onHistorial: (c: Cliente) => void;
}

const ClienteCard = memo(function ClienteCard({
  client,
  isExiting,
  animDelay,
  onView,
  onEdit,
  onDeleteClick,
  onHistorial,
}: ClienteCardProps) {
  const haptic = useHapticFeedback();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Estados para swipe to delete (solo móvil)
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const deleteThreshold = -80; // px para activar eliminación

  const handleView = useCallback(() => {
    haptic.selection();
    onView(client);
  }, [client, haptic, onView]);

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      haptic.impactLight();
      onEdit(client);
    },
    [client, haptic, onEdit]
  );

  const handleHistorial = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      haptic.selection();
      onHistorial(client);
    },
    [client, haptic, onHistorial]
  );

  const handleDelete = useCallback(() => {
    haptic.impactMedium();
    onDeleteClick(client.id!);
  }, [client.id, haptic, onDeleteClick]);

  // ── Swipe handlers (solo móvil) ─────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  }, [isMobile]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isSwiping) return;
    const delta = e.touches[0].clientX - startXRef.current;
    if (delta < 0) {
      setSwipeX(Math.max(delta, deleteThreshold)); // solo permitir negativo
    } else {
      setSwipeX(0);
    }
  }, [isMobile, isSwiping, deleteThreshold]);

  const onTouchEnd = useCallback(() => {
    if (!isMobile) return;
    if (swipeX <= deleteThreshold) {
      handleDelete();
    }
    setSwipeX(0);
    setIsSwiping(false);
  }, [isMobile, swipeX, deleteThreshold, handleDelete]);

  return (
    <div
      className={`cliente-card-enter relative bg-gray-800/50 rounded-2xl border border-gray-700/40 overflow-hidden active:scale-[0.98] transition-all ${
        isExiting ? "cliente-card-exit" : ""
      }`}
      style={{
        animationDelay: `${animDelay}ms`,
        transform: isMobile ? `translateX(${swipeX}px)` : undefined,
        transition: isSwiping ? "none" : "transform 0.2s ease-out",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Área clickeable → Ver cliente */}
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

      {/* Barra de acciones con touch targets ampliados (44px mínimo) */}
      <div className="flex items-center border-t border-gray-700/40">
        <button
          onClick={handleEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-500 hover:text-white hover:bg-gray-700/30 active:bg-gray-700/50 transition-colors min-h-[44px]"
        >
          <Edit className="w-4 h-4" />
          <span className="hidden xs:inline">Editar</span>
        </button>

        <div className="w-px h-7 bg-gray-700/40" />

        <button
          onClick={handleView}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-500 hover:text-white hover:bg-gray-700/30 active:bg-gray-700/50 transition-colors min-h-[44px]"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden xs:inline">Ver</span>
        </button>

        <div className="w-px h-7 bg-gray-700/40" />

        <button
          onClick={handleHistorial}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-500 hover:text-white hover:bg-gray-700/30 active:bg-gray-700/50 transition-colors min-h-[44px]"
        >
          <History className="w-4 h-4" />
          <span className="hidden xs:inline">Historial</span>
        </button>

        <div className="w-px h-7 bg-gray-700/40" />

        <button
          onClick={handleDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-red-500/60 hover:text-red-400 hover:bg-red-500/8 active:bg-red-500/15 transition-colors min-h-[44px]"
          aria-label="Eliminar cliente"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

// ── Componente de paginación mejorado ────────────────────────────────────────
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
    <div className="flex items-center justify-between gap-2 pt-2">
      <button
        onClick={() => onPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1.5 h-12 px-5 rounded-xl bg-gray-700/40 hover:bg-gray-700 text-sm text-gray-300 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 min-w-[100px] justify-center"
      >
        <ChevronLeft className="w-4 h-4" />
        Anterior
      </button>

      <div className="flex items-center gap-1">
        {pages.map((item, idx) =>
          item === "..." ? (
            <span key={`e-${idx}`} className="w-8 text-center text-xs text-gray-600">
              ···
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPage(item as number)}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all active:scale-95 ${
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
        onClick={() => onPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1.5 h-12 px-5 rounded-xl bg-gray-700/40 hover:bg-gray-700 text-sm text-gray-300 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 min-w-[100px] justify-center"
      >
        Siguiente
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
});

// ── Componente principal ─────────────────────────────────────────────────────
export function ClientesDataTable({
  data,
  onDelete,
  onView,
  onEdit,
  onHistorial,
}: ClientesDataTableProps) {
  const { toast } = useToast();
  const haptic = useHapticFeedback();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  // Inyectar CSS animación
  useEffect(() => {
    injectCardAnim();
  }, []);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  // Ajustar página si queda fuera de rango
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedClientes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [currentPage, data, itemsPerPage]);

  // ── Eliminación con haptic y animación ──────────────────────────────────
  const handleDeleteClick = useCallback((id: string) => {
    haptic.impactMedium();
    setClienteToDelete(id);
    setDeleteDialogOpen(true);
  }, [haptic]);

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

  const handleDeleteCancel = useCallback(() => {
    haptic.selection();
    setDeleteDialogOpen(false);
  }, [haptic]);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      haptic.selection();
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [haptic, totalPages]
  );

  const handleItemsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      haptic.selection();
      setItemsPerPage(Number(e.target.value));
      setCurrentPage(1);
    },
    [haptic]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-6">
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
          <CountUp
            from={0}
            to={data.length}
            direction="up"
            duration={1}
            className="text-2xl font-bold text-white leading-tight"
            delay={0}
          />
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
            className="h-9 rounded-lg border border-gray-700 bg-gray-800/50 px-2 text-sm text-white focus:border-blue-500/50 outline-none"
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
              onHistorial={onHistorial}
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