"use client";

import { useState, useCallback, useMemo, memo, useRef } from "react";
import { ClientesDataTable } from "./ClientesDataTable";
import { ClienteViewModal } from "@/components/clientes/ClienteViewModal";
import { ClienteFormModal } from "@/components/clientes/ClienteFormModal";
import { ClienteHistorialModal } from "@/components/clientes/ClienteHistorialModal";
import { Input } from "@/components/ui/basic/input";
import { PlusCircle, User, Search, Users, Filter, RefreshCw, X, History } from "lucide-react";
import type { Cliente } from "@/types/orden";
import { useAuth } from "@/components/auth/AuthProvider";
import { useClientesUsuario } from "@/hooks/useMultiUser";
import { useClienteModal } from "@/hooks/clientes/useClienteModal";
import { usePullToRefresh } from "@/hooks/clientes/usePullToRefresh";
import { useHapticFeedback } from "@/hooks/clientes/useHapticFeedback";

// ── Skeleton mejorado ──────────────────────────────────────────────────────
const ClientesSkeleton = memo(function ClientesSkeleton() {
  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Barra de estadística simulada */}
      <div className="h-16 rounded-2xl bg-gradient-to-r from-gray-800/50 to-gray-700/30 animate-pulse" />
      
      {/* Grid de tarjetas skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-gray-800/40 border border-gray-700/40 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-700/60 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-700/60 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-gray-700/40 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-gray-700/40 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-gray-700/40 animate-pulse" />
              </div>
            </div>
            <div className="h-11 bg-gray-800/40 animate-pulse border-t border-gray-700/30" />
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Componente principal ───────────────────────────────────────────────────
export function ClientesList() {
  const { user } = useAuth();
  const { clientes, loading, error, refrescarClientes } = useClientesUsuario();
  const [searchTerm, setSearchTerm] = useState("");
  const modal = useClienteModal();
  const haptic = useHapticFeedback();

  // Estado para el modal de historial
  const [historialOpen, setHistorialOpen] = useState(false);
  const [selectedClienteHistorial, setSelectedClienteHistorial] = useState<Cliente | null>(null);

  // Pull‑to‑refresh – el contenedor debe ser el elemento scrolleable principal
  const { containerRef } = usePullToRefresh({
    onRefresh: async () => {
      haptic.impactLight();
      await refrescarClientes();
    },
    enabled: !loading && !!user,
    threshold: 80,
  });

  // ── Filtrado ────────────────────────────────────────────────────────────
  const filteredClientes = useMemo(() => {
    if (!searchTerm.trim()) return clientes;
    const q = searchTerm.toLowerCase();
    return clientes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    );
  }, [clientes, searchTerm]);

  // ── Callbacks con haptic ────────────────────────────────────────────────
  const handleDelete = useCallback((id: string) => {
    haptic.impactMedium();
    refrescarClientes();
  }, [haptic, refrescarClientes]);

  const handleSuccess = useCallback((cliente: Cliente) => {
    haptic.success();
    refrescarClientes();
  }, [haptic, refrescarClientes]);

  const clearSearch = useCallback(() => {
    haptic.selection();
    setSearchTerm("");
  }, [haptic]);

  const openCreate = useCallback(() => {
    haptic.impactLight();
    modal.openCreate();
  }, [haptic, modal]);

  const openHistorial = useCallback((cliente: Cliente) => {
    haptic.selection();
    setSelectedClienteHistorial(cliente);
    setHistorialOpen(true);
  }, [haptic]);

  // ── Estados derivados ───────────────────────────────────────────────────
  const isNoUser = !user;
  const hasError = !!error;
  const isEmpty = !loading && clientes.length === 0;
  const isFiltered = !loading && clientes.length > 0 && filteredClientes.length === 0;
  const showTable = !loading && filteredClientes.length > 0;

  // ── Guard ───────────────────────────────────────────────────────────────
  if (isNoUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/40 rounded-2xl border border-gray-700/50 p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-base font-semibold text-white mb-1">Acceso Requerido</h2>
          <p className="text-sm text-gray-400">
            Debes iniciar sesión para gestionar los clientes.
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/40 rounded-2xl border border-red-500/30 p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-base font-semibold text-white mb-1">Error al Cargar</h2>
          <p className="text-sm text-gray-400 mb-5">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-sm font-medium transition-colors active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Render principal con pull‑to‑refresh ─────────────────────────────────
  return (
    <>
      {/* Modales siempre montados */}
      <ClienteViewModal
        open={modal.isView}
        cliente={modal.cliente}
        onClose={modal.close}
        onEdit={modal.switchToEdit}
      />
      <ClienteFormModal
        open={modal.isCreate || modal.isEdit}
        initialData={modal.isEdit ? modal.cliente : null}
        onClose={modal.close}
        onSuccess={handleSuccess}
      />
      <ClienteHistorialModal
        open={historialOpen}
        clienteId={selectedClienteHistorial?.id || ""}
        clienteNombre={selectedClienteHistorial?.name || ""}
        onClose={() => setHistorialOpen(false)}
      />

      {/* Contenedor principal con referencia para pull‑to‑refresh */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="min-h-screen bg-gray-900 overflow-y-auto"
      >
        <div className="w-full p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
          <div className="bg-gray-800/40 rounded-2xl border border-gray-700/50 overflow-hidden">

            {/* Header – con touch targets ampliados */}
            <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-700/50 bg-gray-800/60">
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4.5 h-4.5 text-blue-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-white leading-tight">Mis Clientes</h3>
                  <p className="text-xs text-gray-500 leading-tight mt-0.5">
                    {loading
                      ? "Cargando…"
                      : `${filteredClientes.length} de ${clientes.length} ${
                          clientes.length === 1 ? "cliente" : "clientes"
                        }`}
                  </p>
                </div>

                {/* Búsqueda desktop */}
                <div className="relative hidden sm:block w-52 lg:w-64 flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Buscar…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-8 h-9 text-sm bg-gray-700/40 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-lg"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-600/50"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  )}
                </div>

                {/* Botón nuevo cliente – touch target amplio */}
                <button
                  onClick={openCreate}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 active:bg-blue-500/35 border border-blue-500/30 transition-all active:scale-95 text-sm font-medium flex-shrink-0 min-h-[44px] min-w-[44px]"
                  aria-label="Crear nuevo cliente"
                >
                  <PlusCircle className="w-4 h-4 text-blue-400" />
                  <span className="hidden xs:inline">Crear cliente</span>
                  <span className="inline xs:hidden">Nuevo</span>
                </button>
              </div>

              {/* Búsqueda móvil */}
              <div className="relative mt-3 sm:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Buscar cliente…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-700/30 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-lg"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600/50"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Contenido dinámico */}
            <div className="p-4 sm:p-5">
              {loading && <ClientesSkeleton />}

              {isEmpty && (
                <div className="text-center py-14 px-4">
                  <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">¡Comienza tu gestión!</h3>
                  <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                    Agrega tu primer cliente para gestionar dispositivos y órdenes.
                  </p>
                  <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded-xl text-blue-400 font-medium transition-all active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Crear Primer Cliente
                  </button>
                </div>
              )}

              {isFiltered && (
                <div className="text-center py-14 px-4">
                  <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300 mb-1">Sin resultados</h3>
                  <p className="text-sm text-gray-500 mb-6">No encontramos clientes que coincidan con tu búsqueda.</p>
                  <button
                    onClick={clearSearch}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-700/40 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors active:scale-95"
                  >
                    <X className="w-4 h-4" />
                    Limpiar búsqueda
                  </button>
                </div>
              )}

              {showTable && (
                <ClientesDataTable
                  data={filteredClientes}
                  onDelete={handleDelete}
                  onView={modal.openView}
                  onEdit={modal.openEdit}
                  onHistorial={openHistorial}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}