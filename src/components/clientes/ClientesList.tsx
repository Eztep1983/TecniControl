// components/clientes/ClientesList.tsx
"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { ClientesDataTable } from "./ClientesDataTable";
import { ClienteViewModal } from "@/components/clientes/ClienteViewModal";
import { ClienteFormModal } from "@/components/clientes/ClienteFormModal";
import { Input } from "@/components/ui/basic/input";
import { PlusCircle, User, Search, Users, Filter, RefreshCw, X } from "lucide-react";
import type { Cliente } from "@/types/orden";
import { useAuth } from "@/components/auth/AuthProvider";
import { useClientesUsuario } from "@/hooks/useMultiUser";
import { useClienteModal } from "@/hooks/useClienteModal";

// ── Skeleton — defined OUTSIDE with memo to keep static flags stable ──────────
// Declaring this as a named const outside the parent component prevents React
// from seeing it as a new component type on every render, which is one source
// of the "Expected static flag was missing" error.
const ClientesSkeleton = memo(function ClientesSkeleton() {
  return (
    <div className="p-4 sm:p-5 space-y-3">
      <div className="h-[60px] rounded-2xl bg-gray-700/30 animate-pulse" />
      <div className="flex justify-between items-center">
        <div className="h-4 w-24 rounded bg-gray-700/40 animate-pulse" />
        <div className="h-8 w-20 rounded-lg bg-gray-700/40 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-gray-800/50 border border-gray-700/40 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-700/50 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 rounded bg-gray-700/50 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-gray-700/40 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-gray-700/40 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-gray-700/40 animate-pulse" />
              </div>
            </div>
            <div className="h-10 bg-gray-700/20 animate-pulse border-t border-gray-700/30" />
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Componente principal ──────────────────────────────────────────────────────
export function ClientesList() {
  const { user } = useAuth();
  const { clientes, loading, error, refrescarClientes } = useClientesUsuario();
  const [searchTerm, setSearchTerm] = useState("");
  const modal = useClienteModal();

  // ── Filtrado reactivo (memoizado) ───────────────────────────────────────────
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

  // ── Callbacks CRUD ──────────────────────────────────────────────────────────
  const handleDelete = useCallback((id: string) => {
    // Aquí podrías llamar a una mutación para eliminar
    // Por ahora refrescamos para simplificar
    refrescarClientes();
  }, [refrescarClientes]);

  const handleSuccess = useCallback((cliente: Cliente) => {
    refrescarClientes();
  }, [refrescarClientes]);

  const clearSearch = useCallback(() => setSearchTerm(""), []);

  // ── Derived booleans — computed after all hooks ─────────────────────────────
  // Pull these out so JSX stays clean and we don't call any hooks after this point
  const isNoUser = !user;
  const hasError = !!error;
  const isEmpty = !loading && clientes.length === 0;
  const isFiltered = !loading && clientes.length > 0 && filteredClientes.length === 0;
  const showTable = !loading && filteredClientes.length > 0;

  // ── Guards rendered via data, NOT via early return before hooks ─────────────
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Modales — always mounted so their own hooks never change count */}
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

      {/* Layout */}
      <div className="min-h-screen bg-gray-900">
        <div className="w-full p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
          <div className="bg-gray-800/40 rounded-2xl border border-gray-700/50 overflow-hidden">

            {/* Header */}
            <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-700/50 bg-gray-800/60">
              <div className="flex items-center gap-3">
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

                {/* Búsqueda inline — desktop */}
                <div className="relative hidden sm:block w-52 lg:w-64 flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Buscar…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-8 h-8 text-sm bg-gray-700/40 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-lg"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* CTA nuevo cliente */}
                <button
                  onClick={modal.openCreate}
                  className="flex items-center text-white gap-1.5 px-3 py-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 active:bg-blue-500/35 border border-blue-500/30 transition-colors text-sm flex-shrink-0"
                >
                  <PlusCircle className="w-4 h-4 text-blue-400" />
                  Crear cliente
                  <span className="text-blue-400 font-medium hidden xs:inline">Nuevo</span>
                </button>
              </div>

              {/* Búsqueda — mobile */}
              <div className="relative mt-3 sm:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Buscar cliente…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm bg-gray-700/30 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-lg"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Contenido — single conditional branch, no nested ternary chains */}
            <div className="p-4 sm:p-5">
              {loading && <ClientesSkeleton />}

              {isEmpty && (
                <div className="text-center py-14 px-4">
                  <div className="w-16 h-16 bg-gray-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">¡Comienza tu gestión!</h3>
                  <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                    Agrega tu primer cliente para gestionar dispositivos y órdenes.
                  </p>
                  <button
                    onClick={modal.openCreate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded-xl text-blue-400 font-medium transition-colors active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Crear Primer Cliente
                  </button>
                </div>
              )}

              {isFiltered && (
                <div className="text-center py-14 px-4">
                  <div className="w-16 h-16 bg-gray-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300 mb-1">Sin resultados</h3>
                  <p className="text-sm text-gray-500 mb-4">Ajusta los criterios de búsqueda.</p>
                  <button
                    onClick={clearSearch}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-700/40 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
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
                />
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}