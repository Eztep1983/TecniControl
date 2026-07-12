"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { ClientesDataTable } from "./ClientesDataTable";
import { ClienteViewModal } from "@/components/clientes/ClienteViewModal";
import { ClienteSimpleFormModal } from "@/components/clientes/ClienteSimpleFormModal";
import { ClienteHistorialModal } from "@/components/clientes/ClienteHistorialModal";
import { ImportarContactosModal } from "./ImportarContactosModal";
import { Input } from "@/components/ui/basic/input";
import { PlusCircle, User, Search, Users, Filter, RefreshCw, X } from "lucide-react";
import type { Cliente } from "@/types/orden";
import { useAuth } from "@/components/auth/AuthProvider";
import { useClientesUsuario } from "@/hooks/useMultiUser";
import { useClienteModal } from "@/hooks/clientes/useClienteModal";
import { usePullToRefresh } from "@/hooks/clientes/usePullToRefresh";
import { useHapticFeedback } from "@/hooks/clientes/useHapticFeedback";
import { useDebounce } from "use-debounce";
import { performLocalClientSearch } from "@/lib/search-helpers";

const MODAL_ANIMATION_DURATION = 300;

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
            className="rounded-2xl dark:bg-gray-800/40 bg-gray-200 border dark:border-gray-700/40 border-gray-300 overflow-hidden"
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
            <div className="h-11 dark:bg-gray-800/40 bg-gray-200 animate-pulse border-t dark:border-gray-700/30 border-gray-300" />
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Componente principal ───────────────────────────────────────────────────
export function ClientesList() {
  const { user } = useAuth();
  const { clientes, loading, error, refrescarClientes, eliminarCliente } = useClientesUsuario();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const modal = useClienteModal();
  const haptic = useHapticFeedback();

  const [historialOpen, setHistorialOpen] = useState(false);
  const [selectedClienteHistorial, setSelectedClienteHistorial] = useState<Cliente | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);


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
    return performLocalClientSearch(clientes, debouncedSearch, 5000) as Cliente[];
  }, [clientes, debouncedSearch]);

  const activeCliente = useMemo(() => {
    if (!modal.cliente) return null;
    return clientes.find((c) => c.id === modal.cliente!.id) || modal.cliente;
  }, [clientes, modal.cliente]);

  // ── Callbacks ───────────────────────────────────────────────────────────

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

  const openImport = useCallback(() => {
    haptic.impactLight();
    setImportModalOpen(true);
  }, [haptic]);

  const handleImportSuccess = useCallback(() => {
    haptic.success();
    refrescarClientes();
  }, [haptic, refrescarClientes]);

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
    setTimeout(() => setSelectedClienteHistorial(null), MODAL_ANIMATION_DURATION);
  }, []);

  // ── Estados derivados ───────────────────────────────────────────────────
  const isNoUser = !user;
  const hasError = !!error;
  const isEmpty = !loading && clientes.length === 0;
  const isFiltered = clientes.length > 0 && filteredClientes.length === 0;
  const showTable = filteredClientes.length > 0;

  // ── Guard: sin usuario ──────────────────────────────────────────────────
  if (isNoUser) {
    return (
      <div className="min-h-screen dark:bg-gray-900 bg-gray-100 flex items-center justify-center p-4">
        <div
          className="dark:bg-gray-800/40 bg-gray-200 rounded-2xl border dark:border-gray-700/50 border-gray-300 p-8 max-w-sm w-full text-center"
          role="alert"
        >
          <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7 text-blue-400" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold dark:text-white text-gray-900 mb-1">Acceso Requerido</h2>
          <p className="text-sm dark:text-gray-400 text-gray-600">
            Debes iniciar sesión para gestionar los clientes.
          </p>
        </div>
      </div>
    );
  }

  // ── Guard: error ────────────────────────────────────────────────────────
  if (hasError) {
    return (
      <div className="min-h-screen dark:bg-gray-900 bg-gray-100 flex items-center justify-center p-4">
        <div
          className="dark:bg-gray-800/40 bg-gray-200 rounded-2xl border border-red-500/30 p-8 max-w-sm w-full text-center"
          role="alert"
        >
          <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-7 h-7 text-red-400" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold dark:text-white text-gray-900 mb-1">Error al Cargar</h2>
          <p className="text-sm dark:text-gray-400 text-gray-600 mb-5">{error}</p>
          <button
            onClick={refrescarClientes}
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
        cliente={activeCliente}
        onClose={modal.close}
      />
      <ClienteSimpleFormModal
        open={modal.isCreate}
        initialData={null}
        onClose={modal.close}
        onSuccess={handleSuccess}
      />
      <ClienteHistorialModal
        open={historialOpen}
        clienteId={selectedClienteHistorial?.id ?? ""}
        clienteNombre={selectedClienteHistorial?.name ?? ""}
        onClose={closeHistorial}
      />
      <ImportarContactosModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Contenedor principal */}
      <div
        ref={containerRef}
        className="bg-transparent min-h-screen pb-safe"
        style={{ touchAction: 'pan-y' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-40 dark:bg-gray-900/95 bg-gray-100/95 border-b dark:border-gray-800 border-gray-200 pt-safe backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0"
                aria-hidden="true"
              >
                <Users className="w-5 h-5 text-blue-400" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-base font-semibold dark:text-white text-gray-900 leading-tight">
                  Mis Clientes
                </h1>
                <p
                  className="text-sm text-gray-500 leading-tight mt-0.5"
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
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <label htmlFor="search-input" className="sr-only">
                  Buscar clientes
                </label>
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="search-input"
                  type="search"
                  placeholder="Buscar clientes…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 min-h-[48px] text-sm dark:bg-gray-800/50 bg-gray-200 dark:border-gray-700/50 border-gray-300 dark:text-white text-gray-900 placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl transition-all"
                  autoComplete="off"
                  inputMode="search"
                  enterKeyHint="search"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full hover:dark:bg-gray-700/50 hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-colors"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4 dark:text-gray-400 text-gray-600" aria-hidden="true" />
                  </button>
                )}
              </div>

              <button
                onClick={openImport}
                className="flex items-center justify-center gap-2 px-4 rounded-xl dark:bg-gray-800/60 bg-gray-200 hover:dark:bg-gray-800 hover:bg-gray-200 active:bg-gray-700/80 border dark:border-gray-700/50 border-gray-300 transition-all active:scale-95 text-sm font-medium flex-shrink-0 min-h-[48px] dark:text-gray-300 text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-700/50"
                aria-label="Importar contactos"
              >
                <Users className="w-4 h-4 dark:text-gray-400 text-gray-600" aria-hidden="true" />
                <span>Importar</span>
              </button>

              <button
                onClick={openCreate}
                className="flex items-center justify-center gap-2 px-4 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 active:bg-blue-500/35 border border-blue-500/30 transition-all active:scale-95 text-sm font-medium flex-shrink-0 min-h-[48px] text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                aria-label="Crear nuevo cliente"
              >
                <PlusCircle className="w-5 h-5" aria-hidden="true" />
                <span className="hidden sm:inline">Nuevo Cliente</span>
                <span className="inline sm:hidden" aria-hidden="true">Nuevo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-7xl mx-auto px-4 py-5 space-y-6">
          <main>
            {loading && clientes.length === 0 && <ClientesSkeleton />}

            {isEmpty && (
              <div className="text-center py-14 px-4 dark:bg-gray-800/40 bg-gray-200 rounded-3xl border dark:border-gray-700/50 border-gray-300" role="status">
                <div className="w-20 h-20 dark:bg-gray-800 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-gray-600" aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold dark:text-white text-gray-900 mb-2">
                  ¡Comienza tu gestión!
                </h2>
                <p className="text-sm dark:text-gray-400 text-gray-600 mb-6 max-w-xs mx-auto">
                  Agrega tu primer cliente para gestionar dispositivos y órdenes.
                </p>
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded-xl text-blue-400 font-medium transition-all active:scale-95 min-h-[48px]"
                >
                  <PlusCircle className="w-5 h-5" aria-hidden="true" />
                  Crear Primer Cliente
                </button>
              </div>
            )}

            {isFiltered && (
              <div className="text-center py-14 px-4 dark:bg-gray-800/40 bg-gray-200 rounded-3xl border dark:border-gray-700/50 border-gray-300" role="status">
                <div className="w-20 h-20 dark:bg-gray-800 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-10 h-10 text-gray-600" aria-hidden="true" />
                </div>
                <h2 className="text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">Sin resultados</h2>
                <p className="text-sm text-gray-500 mb-6">
                  No encontramos clientes que coincidan con{" "}
                  <strong className="dark:text-gray-400 text-gray-600">"{searchTerm.length > 30 ? searchTerm.slice(0, 30) + '...' : searchTerm}"</strong>.
                </p>
                <button
                  onClick={clearSearch}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-700/40 hover:bg-gray-700 dark:text-gray-300 text-gray-700 text-sm font-medium transition-colors active:scale-95 min-h-[48px]"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                  Limpiar búsqueda
                </button>
              </div>
            )}

            {showTable && (
              <div className="overflow-visible">
                <ClientesDataTable
                  data={filteredClientes}
                  totalGlobal={clientes.length}
                  onView={modal.openView}
                  onHistorial={openHistorial}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}