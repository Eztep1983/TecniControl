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

// ── CSS de animación (inyectado una sola vez, fuera del ciclo de render) ─────
const CARD_ANIM_ID = "clientes-card-anim-v2";

// FIX: Se mueve la inyección fuera del componente para que ocurra solo una vez
// y no dependa de efectos ni del DOM disponible en SSR.
if (typeof document !== "undefined" && !document.getElementById(CARD_ANIM_ID)) {
  const s = document.createElement("style");
  s.id = CARD_ANIM_ID;
  s.textContent = `
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
  document.head.appendChild(s);
}

// ── Props del componente principal ──────────────────────────────────────────
interface ClientesDataTableProps {
  data: Cliente[];
  onDelete: (id: string) => void;
  onView: (cliente: Cliente) => void;
  onEdit: (cliente: Cliente) => void;
  onHistorial: (cliente: Cliente) => void;
}

// ── Tarjeta individual ───────────────────────────────────────────────────────
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
  const cardRef = useRef<HTMLDivElement>(null);



  // FIX: Umbral como constante clara para no recalcular en cada handler
  const DELETE_THRESHOLD = -80;
  // FIX: Se separa el umbral de "activación visual" del de "confirmación"
  // para mostrar el color rojo antes de soltar el dedo
  const DANGER_ZONE = DELETE_THRESHOLD * 0.6; // -48px empieza a mostrar rojo

  const swipeProgress = Math.min(1, swipeX / DELETE_THRESHOLD); // 0..1

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

  const handleDeleteConfirmButton = useCallback(() => {
    haptic.impactMedium();
    onDeleteClick(client.id!);
  }, [client.id, haptic, onDeleteClick]);

  // ── Swipe handlers ─────────────────────────────────────────────────────
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile) return;
      startXRef.current = e.touches[0].clientX;
      setIsSwiping(true);
    },
    [isMobile]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || !isSwiping) return;
      const delta = e.touches[0].clientX - startXRef.current;
      if (delta < 0) {
        // FIX: preventDefault evita que el scroll vertical de iOS compita
        // con el gesto horizontal cuando el usuario desliza diagonalmente.
        e.preventDefault();
        setSwipeX(Math.max(delta, DELETE_THRESHOLD));
      } else {
        setSwipeX(0);
      }
    },
    [isMobile, isSwiping, DELETE_THRESHOLD]
  );

  const onTouchEnd = useCallback(() => {
    if (!isMobile) return;
    if (swipeX <= DELETE_THRESHOLD) {
      haptic.impactMedium();
      // FIX: El swipe abre el diálogo de confirmación (misma ruta que el botón),
      // NO llama directamente a onDelete. Flujo consistente con el botón de papelera.
      onDeleteClick(client.id!);
    }
    setSwipeX(0);
    setIsSwiping(false);
  }, [isMobile, swipeX, DELETE_THRESHOLD, haptic, onDeleteClick, client.id]);

  // FIX: React no permite registrar listeners no-pasivos mediante props (onTouchMove).
  // Para llamar a preventDefault() y bloquear el scroll vertical durante el swipe horizontal,
  // debemos usar addEventListener nativo con passive: false.
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !isMobile) return;

    // El touchmove DEBE ser passive: false para poder cancelar el scroll nativo
    el.addEventListener("touchstart", onTouchStart as any, { passive: true });
    el.addEventListener("touchmove", onTouchMove as any, { passive: false });
    el.addEventListener("touchend", onTouchEnd as any, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart as any);
      el.removeEventListener("touchmove", onTouchMove as any);
      el.removeEventListener("touchend", onTouchEnd as any);
    };
  }, [isMobile, onTouchStart, onTouchMove, onTouchEnd]);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* FIX: Fondo de "zona de peligro" visible durante el swipe.
          Se muestra gradualmente proporcional al desplazamiento. */}
      {isMobile && swipeX < 0 && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500/20 border border-red-500/30 rounded-2xl"
          style={{
            width: `${Math.abs(swipeX)}px`,
            opacity: swipeProgress,
          }}
          aria-hidden="true"
        >
          <Trash2
            className="text-red-400 transition-transform"
            style={{
              width: swipeX < DANGER_ZONE ? "20px" : "24px",
              height: swipeX < DANGER_ZONE ? "20px" : "24px",
            }}
          />
        </div>
      )}

      <div
        className={`cliente-card-enter bg-gray-800/50 rounded-2xl border border-gray-700/40 overflow-hidden transition-shadow ${
          isExiting ? "cliente-card-exit" : ""
        }`}
        style={{
          animationDelay: `${animDelay}ms`,
          // FIX: Se elimina active:scale para que no compita con el translateX
          // en el compositor de iOS. El efecto de presión queda solo en los botones internos.
          transform: isMobile && swipeX !== 0 ? `translateX(${swipeX}px)` : undefined,
          transition: isSwiping ? "none" : "transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          // FIX: touch-action en el elemento correcto para Android
          touchAction: isMobile ? "pan-y" : undefined,
          willChange: isMobile ? "transform" : undefined,
        }}
        ref={cardRef}
      >
        {/* Área clickeable → Ver cliente */}
        <button
          onClick={handleView}
          className="w-full text-left p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-t-2xl active:bg-gray-700/20 transition-colors"
          // FIX: aria-label descriptivo con el nombre del cliente
          aria-label={`Ver detalle de ${client.name}`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/15 ring-1 ring-blue-500/20 flex items-center justify-center flex-shrink-0">
              <User className="w-4.5 h-4.5 text-blue-400" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white text-sm leading-tight truncate">
                {client.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <IdCard className="w-3 h-3 text-gray-600 flex-shrink-0" aria-hidden="true" />
                <p className="text-xs text-gray-500 truncate">{client.cedula}</p>
              </div>
            </div>
          </div>

          {/* Info contacto */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-3 h-3 text-gray-600 flex-shrink-0" aria-hidden="true" />
              <p className="text-xs text-gray-400 truncate">{client.email}</p>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="w-3 h-3 text-gray-600 flex-shrink-0" aria-hidden="true" />
              <p className="text-xs text-gray-400 truncate">{client.phone}</p>
            </div>
            {client.address && (
              <div className="flex items-start gap-2 min-w-0">
                <MapPin className="w-3 h-3 text-gray-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-gray-400 line-clamp-1">{client.address}</p>
              </div>
            )}
          </div>
        </button>

        {/* Barra de acciones */}
        <div className="flex items-center border-t border-gray-700/40" role="toolbar" aria-label={`Acciones para ${client.name}`}>
          <button
            onClick={handleEdit}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-500 hover:text-white hover:bg-gray-700/30 active:bg-gray-700/50 active:scale-95 transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/50"
            aria-label={`Editar a ${client.name}`}
          >
            <Edit className="w-4 h-4" aria-hidden="true" />
            <span className="hidden xs:inline">Editar</span>
          </button>

          <div className="w-px h-7 bg-gray-700/40" aria-hidden="true" />

          <button
            onClick={handleView}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-500 hover:text-white hover:bg-gray-700/30 active:bg-gray-700/50 active:scale-95 transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/50"
            aria-label={`Ver perfil de ${client.name}`}
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span className="hidden xs:inline">Ver</span>
          </button>

          <div className="w-px h-7 bg-gray-700/40" aria-hidden="true" />

          <button
            onClick={handleHistorial}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-500 hover:text-white hover:bg-gray-700/30 active:bg-gray-700/50 active:scale-95 transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/50"
            aria-label={`Ver historial de ${client.name}`}
          >
            <History className="w-4 h-4" aria-hidden="true" />
            <span className="hidden xs:inline">Historial</span>
          </button>

          <div className="w-px h-7 bg-gray-700/40" aria-hidden="true" />

          <button
            onClick={handleDeleteConfirmButton}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-red-500/60 hover:text-red-400 hover:bg-red-500/8 active:bg-red-500/15 active:scale-95 transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500/50"
            // FIX: aria-label incluye el nombre para que lectores de pantalla identifiquen cuál cliente
            aria-label={`Eliminar a ${client.name}`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
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
  onPage: (p: number) => void;
}

const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPage,
}: PaginationProps) {
  // FIX: Las elipsis usan un key único basado en posición, no en el string "..."
  // para evitar colisiones cuando hay dos elipsis en la lista.
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
        // FIX: key único con posición para que React no confunda dos elipsis
        result.push({ type: "ellipsis", key: `ellipsis-${idx}` });
      }
      result.push(p);
    });
    return result;
  }, [currentPage, totalPages]);

  return (
    // FIX: nav + aria-label para que lectores de pantalla anuncien el rol
    <nav aria-label="Paginación de clientes" className="flex items-center justify-between gap-2 pt-2">
      <button
        onClick={() => onPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1.5 h-12 px-4 sm:px-5 rounded-xl bg-gray-700/40 hover:bg-gray-700 text-sm text-gray-300 font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 min-w-[44px] justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      <div className="flex items-center gap-1" role="list" aria-label="Páginas">
        {pages.map((item) => {
          if (typeof item === "object") {
            return (
              <span
                key={item.key}
                role="listitem"
                className="w-8 text-center text-xs text-gray-600"
                aria-hidden="true"
              >
                ···
              </span>
            );
          }
          return (
            <button
              key={item}
              role="listitem"
              onClick={() => onPage(item)}
              // FIX: aria-current="page" para que lectores de pantalla anuncien la página activa
              aria-current={currentPage === item ? "page" : undefined}
              aria-label={`Ir a página ${item}`}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                currentPage === item
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-500 hover:bg-gray-700/50 hover:text-gray-300"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1.5 h-12 px-4 sm:px-5 rounded-xl bg-gray-700/40 hover:bg-gray-700 text-sm text-gray-300 font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 min-w-[44px] justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        aria-label="Página siguiente"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </nav>
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

  // FIX: Referencia al contenedor scrolleable propio para que scrollTo
  // funcione dentro del webview sin afectar el viewport global.
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  // Ajustar página si queda fuera de rango
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedClientes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [currentPage, data, itemsPerPage]);

  // ── Eliminación ──────────────────────────────────────────────────────────
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

      // FIX: Usar el id capturado antes del setState para evitar closure stale
      const idToRemove = clienteToDelete;
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.add(idToRemove);
        return next;
      });

      setTimeout(() => {
        onDelete(idToRemove);
        setExitingIds((prev) => {
          const next = new Set(prev);
          next.delete(idToRemove);
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
        description:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar. Intente nuevamente.",
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
  }, [haptic]);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      haptic.selection();
      setCurrentPage(page);
      // FIX: Scroll al contenedor propio del componente, no al viewport global.
      // Esto funciona correctamente dentro de webviews iOS/Android.
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
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

  // FIX: Nombre del cliente a eliminar para el diálogo (más descriptivo)
  const clienteNombreAEliminar = useMemo(
    () => data.find((c) => c.id === clienteToDelete)?.name ?? "este cliente",
    [data, clienteToDelete]
  );

  return (
    <div ref={scrollContainerRef} className="space-y-4 pb-6">
      {/* Modal confirmación eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm mx-auto rounded-2xl bg-gray-800 border-gray-700">
          <DialogHeader>
            {/* FIX: El título incluye el nombre para mayor claridad */}
            <DialogTitle className="text-white text-lg">
              ¿Eliminar a {clienteNombreAEliminar}?
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Esta acción no se puede deshacer. Las órdenes asociadas se conservarán
              pero perderás acceso a la información del cliente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 mt-2">
            {/* FIX: Botón cancelar primero en el DOM (orden lógico en mobile: acción segura arriba) */}
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

      {/* Stat bar */}
      <div
        className="bg-gradient-to-br from-blue-400/8 to-blue-900/15 rounded-2xl border border-blue-500/15 px-4 py-3 flex items-center gap-3"
        role="status"
        aria-live="polite"
        aria-label={`Total de clientes: ${data.length}`}
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
            to={data.length}
            direction="up"
            duration={1}
            className="text-2xl font-bold text-white leading-tight"
            delay={0}
          />
        </div>
      </div>

      {/* Controles de paginación superior */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500" aria-live="polite">
          {data.length === 0
            ? "Sin clientes"
            : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(
                currentPage * itemsPerPage,
                data.length
              )} de ${data.length}`}
        </p>
        <div className="flex items-center gap-2">
          {/* FIX: Label con htmlFor correctamente vinculado al select */}
          <label
            htmlFor="items-per-page-select"
            className="text-xs text-gray-500"
          >
            Mostrar
          </label>
          <select
            id="items-per-page-select"
            className="h-9 rounded-lg border border-gray-700 bg-gray-800/50 px-2 text-sm text-white focus:border-blue-500/50 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} por página
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de tarjetas */}
      {paginatedClientes.length > 0 ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          role="list"
          aria-label="Lista de clientes"
        >
          {paginatedClientes.map((client, idx) => (
            <div key={client.id} role="listitem">
              <ClienteCard
                client={client}
                isExiting={exitingIds.has(client.id!)}
                animDelay={idx * 35}
                onView={onView}
                onEdit={onEdit}
                onDeleteClick={handleDeleteClick}
                onHistorial={onHistorial}
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