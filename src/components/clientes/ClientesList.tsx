"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { ClientesDataTable } from "./ClientesDataTable";
import { ClienteViewModal } from "@/components/clientes/ClienteViewModal";
import { ClienteFormModal } from "@/components/clientes/ClienteFormModal";
import { ClienteHistorialModal } from "@/components/clientes/ClienteHistorialModal";
import { Input } from "@/components/ui/basic/input";
import { PlusCircle, User, Search, Users, Filter, RefreshCw, X } from "lucide-react";
import type { Cliente } from "@/types/orden";
import { useAuth } from "@/components/auth/AuthProvider";
import { useClientesUsuario } from "@/hooks/useMultiUser";
import { useClienteModal } from "@/hooks/clientes/useClienteModal";
import { usePullToRefresh } from "@/hooks/clientes/usePullToRefresh";
import { useHapticFeedback } from "@/hooks/clientes/useHapticFeedback";

// ── Skeleton ───────────────────────────────────────────────────────────────
const ClientesSkeleton = memo(function ClientesSkeleton() {
  return (
    // FIX: aria-busy + aria-label para que lectores de pantalla anuncien la carga
    <div
      className="p-4 sm:p-5 space-y-4"
      aria-busy="true"
      aria-label="Cargando clientes…"
    >
      <div className="h-16 rounded-2xl bg-gradient-to-r from-gray-800/50 to-gray-700/30 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-gray-800/40 border border-gray-700/40 overflow-hidden"
            // FIX: aria-hidden para que los skeletons no se anuncien individualmente
            aria-hidden="true"
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

  const [historialOpen, setHistorialOpen] = useState(false);
  const [selectedClienteHistorial, setSelectedClienteHistorial] = useState<Cliente | null>(null);

  // FIX: Tipado correcto del ref sin cast inseguro.
  // usePullToRefresh debe devolver RefObject<HTMLElement> o similar.
  const { containerRef } = usePullToRefresh<HTMLDivElement>({
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
        c.phone?.includes(q) ||
        // FIX: También buscar por cédula, útil en flujos latinoamericanos
        c.cedula?.includes(q)
    );
  }, [clientes, searchTerm]);

  // ── Callbacks ───────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    (_id: string) => {
      haptic.impactMedium();
      // FIX: Se pasa el id pero refrescarClientes sincroniza el estado global.
      // No es necesario usar el id aquí si el hook ya actualiza la lista.
      refrescarClientes();
    },
    [haptic, refrescarClientes]
  );

  const handleSuccess = useCallback(
    (_cliente: Cliente) => {
      haptic.success();
      refrescarClientes();
    },
    [haptic, refrescarClientes]
  );

  const clearSearch = useCallback(() => {
    haptic.selection();
    setSearchTerm("");
  }, [haptic]);

  const openCreate = useCallback(() => {
    haptic.impactLight();
    modal.openCreate();
  }, [haptic, modal]);

  const openHistorial = useCallback(
    (cliente: Cliente) => {
      haptic.selection();
      setSelectedClienteHistorial(cliente);
      setHistorialOpen(true);
    },
    [haptic]
  );

  const closeHistorial = useCallback(() => {
    setHistorialOpen(false);
    // FIX: Limpiar el cliente seleccionado con delay para evitar flash de UI vacía
    // mientras el modal cierra con su animación.
    setTimeout(() => setSelectedClienteHistorial(null), 300);
  }, []);

  // ── Estados derivados ───────────────────────────────────────────────────
  const isNoUser = !user;
  const hasError = !!error;
  const isEmpty = !loading && clientes.length === 0;
  const isFiltered = !loading && clientes.length > 0 && filteredClientes.length === 0;
  const showTable = !loading && filteredClientes.length > 0;

  // ── Guard: sin usuario ──────────────────────────────────────────────────
  if (isNoUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div
          className="bg-gray-800/40 rounded-2xl border border-gray-700/50 p-8 max-w-sm w-full text-center"
          role="alert"
        >
          <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7 text-blue-400" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-white mb-1">Acceso Requerido</h2>
          <p className="text-sm text-gray-400">
            Debes iniciar sesión para gestionar los clientes.
          </p>
        </div>
      </div>
    );
  }

  // ── Guard: error ────────────────────────────────────────────────────────
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div
          className="bg-gray-800/40 rounded-2xl border border-red-500/30 p-8 max-w-sm w-full text-center"
          role="alert"
        >
          <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-7 h-7 text-red-400" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-white mb-1">Error al Cargar</h2>
          <p className="text-sm text-gray-400 mb-5">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-sm font-medium transition-colors active:scale-95 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Render principal ─────────────────────────────────────────────────────
  return (
    <>
      {/* Modales */}
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
        clienteId={selectedClienteHistorial?.id ?? ""}
        clienteNombre={selectedClienteHistorial?.name ?? ""}
        onClose={closeHistorial}
      />

      {/* Contenedor principal */}
      <div
        ref={containerRef}
        className="min-h-screen bg-gray-900 overflow-y-auto"
      >
        <div className="w-full p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
          <div className="bg-gray-800/40 rounded-2xl border border-gray-700/50 overflow-hidden">

            {/* Header */}
            <header className="px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-700/50 bg-gray-800/60">
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <div
                  className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  <Users className="w-4.5 h-4.5 text-blue-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="text-sm font-semibold text-white leading-tight">
                    Mis Clientes
                  </h1>
                  {/* FIX: aria-live para que los lectores de pantalla anuncien cambios
                      en el conteo cuando el filtro cambia */}
                  <p
                    className="text-xs text-gray-500 leading-tight mt-0.5"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {loading
                      ? "Cargando…"
                      : `${filteredClientes.length} de ${clientes.length} ${
                          clientes.length === 1 ? "cliente" : "clientes"
                        }`}
                  </p>
                </div>

                {/* Búsqueda desktop */}
                <div className="relative hidden sm:block w-52 lg:w-64 flex-shrink-0">
                  <label htmlFor="search-desktop" className="sr-only">
                    Buscar clientes
                  </label>
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="search-desktop"
                    type="search"
                    placeholder="Buscar…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-8 h-9 text-sm bg-gray-700/40 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-lg"
                    // FIX: autoComplete off para que los autocompletados del browser
                    // no interfieran con la búsqueda en campo controlado
                    autoComplete="off"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-600/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Botón nuevo cliente */}
                <button
                  onClick={openCreate}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 active:bg-blue-500/35 border border-blue-500/30 transition-all active:scale-95 text-sm font-medium flex-shrink-0 min-h-[44px] min-w-[44px] text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  aria-label="Crear nuevo cliente"
                >
                  <PlusCircle className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden xs:inline">Crear cliente</span>
                  <span className="inline xs:hidden" aria-hidden="true">Nuevo</span>
                </button>
              </div>

              {/* Búsqueda móvil */}
              <div className="relative mt-3 sm:hidden">
                <label htmlFor="search-mobile" className="sr-only">
                  Buscar clientes
                </label>
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="search-mobile"
                  type="search"
                  placeholder="Buscar cliente…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-gray-700/30 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-lg"
                  autoComplete="off"
                  // FIX: inputMode="search" activa el teclado de búsqueda en iOS
                  inputMode="search"
                  // FIX: enterKeyHint muestra "buscar" en el teclado virtual iOS/Android
                  enterKeyHint="search"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-600/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
                  </button>
                )}
              </div>
            </header>

            {/* Contenido */}
            <main className="p-4 sm:p-5">
              {loading && <ClientesSkeleton />}

              {isEmpty && (
                <div className="text-center py-14 px-4" role="status">
                  <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-gray-600" aria-hidden="true" />
                  </div>
                  <h2 className="text-base font-semibold text-white mb-2">
                    ¡Comienza tu gestión!
                  </h2>
                  <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                    Agrega tu primer cliente para gestionar dispositivos y órdenes.
                  </p>
                  <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded-xl text-blue-400 font-medium transition-all active:scale-95 min-h-[44px]"
                  >
                    <PlusCircle className="w-4 h-4" aria-hidden="true" />
                    Crear Primer Cliente
                  </button>
                </div>
              )}

              {isFiltered && (
                <div className="text-center py-14 px-4" role="status">
                  <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-10 h-10 text-gray-600" aria-hidden="true" />
                  </div>
                  <h2 className="text-sm font-medium text-gray-300 mb-1">Sin resultados</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    No encontramos clientes que coincidan con{" "}
                    <strong className="text-gray-400">"{searchTerm}"</strong>.
                  </p>
                  <button
                    onClick={clearSearch}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-700/40 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors active:scale-95 min-h-[44px]"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
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
            </main>
          </div>
        </div>
      </div>
    </>
  );
}