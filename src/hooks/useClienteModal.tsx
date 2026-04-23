// hooks/useClienteModal.ts
// Hook central que coordina qué modal está abierto y sobre qué cliente.
// Todos los modales de clientes se controlan desde aquí.

import { useState, useCallback, useMemo } from "react";
import type { Cliente } from "@/types/orden";

export type ModalMode = "view" | "create" | "edit" | null;

interface ClienteModalState {
  mode: ModalMode;
  cliente: Cliente | null;
}

export function useClienteModal() {
  const [state, setState] = useState<ClienteModalState>({
    mode: null,
    cliente: null,
  });

  const openView = useCallback((cliente: Cliente) => {
    setState({ mode: "view", cliente });
  }, []);

  const openCreate = useCallback(() => {
    setState({ mode: "create", cliente: null });
  }, []);

  const openEdit = useCallback((cliente: Cliente) => {
    setState({ mode: "edit", cliente });
  }, []);

  const close = useCallback(() => {
    setState({ mode: null, cliente: null });
  }, []);

  // Transición directa de "view" a "edit" sin cerrar
  const switchToEdit = useCallback(() => {
    setState((prev) =>
      prev.cliente ? { mode: "edit", cliente: prev.cliente } : prev
    );
  }, []);

  const result = useMemo(() => ({
    mode: state.mode,
    cliente: state.cliente,
    isOpen: state.mode !== null,
    isView: state.mode === "view",
    isCreate: state.mode === "create",
    isEdit: state.mode === "edit",
    openView,
    openCreate,
    openEdit,
    switchToEdit,
    close,
  }), [state.mode, state.cliente, openView, openCreate, openEdit, switchToEdit, close]);

  return result;
}