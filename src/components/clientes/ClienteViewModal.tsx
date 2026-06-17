"use client";

import React, { useState, useCallback, lazy, Suspense } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/basic/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/basic/sheet";
import {
  User,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Monitor,
  Edit,
  Trash2,
  Plus,
  X,
  Cpu,
  History,
  RefreshCw,
  Loader2,
} from "lucide-react";
import type { Cliente } from "@/types/orden";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { useMediaQuery } from "@/hooks/clientes/useMediaQuery";
import { useSwipeToClose } from "@/hooks/clientes/useSwipeToClose";
import { useHapticFeedback } from "@/hooks/clientes/useHapticFeedback";
import { useAuth } from "@/components/auth/AuthProvider";
import { useClientesUsuario } from "@/hooks/useMultiUser";
import { useToast } from "@/hooks/use-toast";
import { DispositivoFormModal } from "./DispositivoFormModal";
import type { Dispositivo } from "@/types/orden";
import { useMobileNavigation } from "@/components/providers/MobileNavigationContext";
const ClienteHistorialModalLazy = lazy(() => import("./ClienteHistorialModal").then(m => ({ default: m.ClienteHistorialModal })));

interface ClienteViewModalProps {
  cliente: Cliente | null;
  open: boolean;
  onClose: () => void;
}

export function ClienteViewModal({ cliente, open, onClose }: ClienteViewModalProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const haptic = useHapticFeedback();
  const { openModal } = useMobileNavigation();
  const [historialOpen, setHistorialOpen] = useState(false);
  const { user } = useAuth();
  const { actualizarCliente, eliminarCliente } = useClientesUsuario();
  const { toast } = useToast();
  
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Dispositivo | null>(null);
  const [deleteDeviceOpen, setDeleteDeviceOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Dispositivo | null>(null);
  const [isDeletingDevice, setIsDeletingDevice] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localCliente, setLocalCliente] = useState<Cliente | null>(cliente);
  const [prevCliente, setPrevCliente] = useState<Cliente | null>(cliente);

  if (cliente?.id !== prevCliente?.id || (!isEditing && !isSaving && cliente !== prevCliente)) {
    setPrevCliente(cliente);
    setLocalCliente(cliente);
  }
  const [formData, setFormData] = useState({
    name: "",
    cedula: "",
    phone: "",
    email: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteClientOpen, setDeleteClientOpen] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeToClose({
    onClose,
    enabled: open && isMobile && !historialOpen && !deviceModalOpen && !deleteDeviceOpen,
    threshold: 100,
    scrollRef: scrollRef as any,
  });

  const handleClose = useCallback(() => {
    setIsEditing(false);
    onClose();
  }, [onClose]);

  const handleCancelEdit = useCallback(() => {
    haptic.selection();
    setIsEditing(false);
    setErrors({});
  }, [haptic]);

  useAndroidBack(open, () => {
    if (deleteClientOpen) setDeleteClientOpen(false);
    else if (deleteDeviceOpen) setDeleteDeviceOpen(false);
    else if (deviceModalOpen) setDeviceModalOpen(false);
    else if (historialOpen) setHistorialOpen(false);
    else if (isEditing) handleCancelEdit();
    else handleClose();
  });

  const handleEditClick = useCallback(() => {
    if (!localCliente) return;
    haptic.impactLight();
    setFormData({
      name: localCliente.name ?? "",
      cedula: localCliente.cedula ?? "",
      phone: localCliente.phone ?? "",
      email: localCliente.email ?? "",
      address: localCliente.address ?? "",
    });
    setErrors({});
    setIsEditing(true);
  }, [haptic, localCliente]);

  const handleHistorialClick = useCallback(() => {
    haptic.selection();
    setHistorialOpen(true);
  }, [haptic]);

  const handleCrearOrdenClick = useCallback(() => {
    if (!localCliente) return;
    haptic.impactLight();
    handleClose();

    // Esperar a que el modal actual se cierre y useAndroidBack limpie el historial para evitar cierres instantáneos
    setTimeout(() => {
      openModal();
      const url = new URL(window.location.href);
      url.searchParams.set("clienteId", localCliente.id!);
      window.history.replaceState(window.history.state, "", url.toString());
    }, 200);
  }, [haptic, handleClose, openModal, localCliente]);

  const handleDeleteClientClick = useCallback(() => {
    haptic.impactMedium();
    setDeleteClientOpen(true);
  }, [haptic]);

  const handleDeleteClientConfirm = async () => {
    if (!localCliente || !user?.uid) return;
    setIsDeletingClient(true);
    try {
      await eliminarCliente(localCliente.id);
      toast({
        title: "Cliente eliminado",
        description: "El cliente se eliminó correctamente.",
      });
      setDeleteClientOpen(false);
      handleClose();
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el cliente. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsDeletingClient(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!localCliente || !user?.uid) return;

    // Compute errors inline
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = "El nombre es requerido (mínimo 2 caracteres)";
    }
    if (formData.cedula) {
      const val = formData.cedula.trim();
      if (val.length < 3 || !/^[0-9A-Za-z.\s-]+$/.test(val)) {
        newErrors.cedula = "Mínimo 3 caracteres (letras, números, puntos, espacios y guiones)";
      }
    }
    if (formData.email) {
      const val = formData.email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        newErrors.email = "Email inválido";
      }
    }
    if (formData.phone) {
      const val = formData.phone.trim();
      if (val.length < 7) {
        newErrors.phone = "Teléfono muy corto (mínimo 7 caracteres)";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast({
        title: "Datos incorrectos",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const sanitizedPayload = {
        name: formData.name.trim(),
        cedula: formData.cedula ? formData.cedula.trim() : "",
        email: formData.email ? formData.email.trim().toLowerCase() : "",
        phone: formData.phone ? formData.phone.trim() : "",
        address: formData.address ? formData.address.trim() : "",
        dispositivos: localCliente.dispositivos || [],
        updatedAt: new Date().toISOString(),
        userId: user.uid,
      };
      await actualizarCliente(localCliente.id, sanitizedPayload);
      setLocalCliente({ ...localCliente, ...sanitizedPayload });
      toast({
        title: "✓ Cliente actualizado",
        description: `${sanitizedPayload.name} actualizado correctamente.`,
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error al actualizar",
        description: "No se pudieron guardar los cambios. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditDeviceClick = useCallback((device: Dispositivo) => {
    haptic.selection();
    setEditingDevice(device);
    setDeviceModalOpen(true);
  }, [haptic]);

  const handleAddDeviceClick = useCallback(() => {
    haptic.selection();
    setEditingDevice(null);
    setDeviceModalOpen(true);
  }, [haptic]);

  const handleDeleteDeviceClick = useCallback((device: Dispositivo) => {
    haptic.impactMedium();
    setDeviceToDelete(device);
    setDeleteDeviceOpen(true);
  }, [haptic]);

  const handleDeleteDeviceConfirm = async () => {
    if (!localCliente || !deviceToDelete || !user?.uid) return;
    setIsDeletingDevice(true);
    try {
      const remainingDevices = (localCliente.dispositivos || []).filter(d => d.id !== deviceToDelete.id);
      const updatedPayload = {
        ...localCliente,
        dispositivos: remainingDevices,
        updatedAt: new Date().toISOString()
      };
      await actualizarCliente(localCliente.id, updatedPayload);
      setLocalCliente(updatedPayload);
      
      toast({
        title: "Dispositivo eliminado",
        description: "El dispositivo se eliminó correctamente.",
      });
      setDeleteDeviceOpen(false);
      setDeviceToDelete(null);
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el dispositivo. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsDeletingDevice(false);
    }
  };

  if (!localCliente) return null;

  const modalBody = isEditing ? (
    <div className="divide-y divide-gray-800/50">
      {/* Sección Contacto (Edición) */}
      <section className="p-6 space-y-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          Información de contacto (Edición)
        </p>
        <div className="grid grid-cols-1 gap-4">
          {/* Teléfono */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-800/30 border border-gray-700/40">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mb-1">Teléfono</p>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, phone: e.target.value }));
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                }}
                className={`w-full bg-gray-900/60 border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors ${
                  errors.phone ? "border-red-500/50 focus:border-red-500/50" : "border-gray-700"
                }`}
                placeholder="Ej: +123456789"
              />
              {errors.phone && (
                <p className="text-xs text-red-400 font-semibold mt-1 ml-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-800/30 border border-gray-700/40">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mb-1">Email</p>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                }}
                className={`w-full bg-gray-900/60 border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors ${
                  errors.email ? "border-red-500/50 focus:border-red-500/50" : "border-gray-700"
                }`}
                placeholder="Ej: correo@ejemplo.com"
              />
              {errors.email && (
                <p className="text-xs text-red-400 font-semibold mt-1 ml-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-800/30 border border-gray-700/40">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mb-1">Dirección</p>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                placeholder="Dirección del cliente"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  ) : (
    <div className="divide-y divide-gray-800/50">
      {/* Sección Contacto */}
      <section className="p-6 space-y-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          Información de contacto
        </p>
        <div className="grid grid-cols-1 gap-3">
          {localCliente.phone && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-800/30 border border-gray-700/40 group">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Teléfono</p>
                <a href={`tel:${localCliente.phone}`} className="text-sm text-white font-medium hover:text-green-400 transition-colors">
                  {localCliente.phone}
                </a>
              </div>
            </div>
          )}
          {localCliente.email && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-800/30 border border-gray-700/40">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Email</p>
                <a href={`mailto:${localCliente.email}`} className="text-sm text-white font-medium hover:text-blue-400 transition-colors truncate block">
                  {localCliente.email}
                </a>
              </div>
            </div>
          )}
          {localCliente.address && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-800/30 border border-gray-700/40">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Dirección</p>
                <p className="text-sm text-white font-medium">
                  {localCliente.address}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Dispositivos */}
      <section className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dispositivos vinculados</p>
          <button
            onClick={handleAddDeviceClick}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-bold text-blue-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir
          </button>
        </div>
        {localCliente.dispositivos && localCliente.dispositivos.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {localCliente.dispositivos.map((d, idx) => (
              <div key={d.id ?? idx} className="bg-gray-800/20 rounded-2xl border border-gray-700/30 p-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{d.marca} {d.modelo}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-700/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                        {d.tipo}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-900/40 rounded-lg border border-gray-700/30 p-1">
                    <button
                      onClick={() => handleEditDeviceClick(d)}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDeviceClick(d)}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/30 rounded-xl p-2.5 border border-gray-700/20">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Nº Serie</p>
                    <p className="text-xs font-mono text-gray-300 truncate">{d.numeroSerie || "N/A"}</p>
                  </div>
                  <div className="bg-gray-900/30 rounded-xl p-2.5 border border-gray-700/20">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Estado</p>
                    <p className="text-xs text-gray-300 truncate">{d.estado || "Activo"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center bg-gray-800/10 rounded-3xl border border-dashed border-gray-700/50">
            <Cpu className="w-10 h-10 text-gray-700 mx-auto mb-3 opacity-50" />
            <p className="text-xs text-gray-500 font-medium">Sin dispositivos registrados</p>
          </div>
        )}
      </section>
    </div>
  );

  const actionsSection = isEditing ? (
    <div className="grid grid-cols-2 gap-3 w-full">
      <button
        onClick={handleCancelEdit}
        disabled={isSaving}
        className="h-12 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-gray-650 text-white text-sm font-bold border border-gray-700/50 transition-colors"
      >
        Cancelar
      </button>
      <button
        onClick={handleSaveEdit}
        disabled={isSaving}
        className="h-12 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Guardando...
          </>
        ) : (
          "Guardar cambios"
        )}
      </button>
    </div>
  ) : (
    <div className="space-y-4">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        Acciones de servicio
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCrearOrdenClick}
          className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-sm font-bold text-white transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Emitir orden
        </button>
        <button
          onClick={handleHistorialClick}
          className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gray-800 hover:bg-gray-700 active:bg-gray-650 border border-gray-700/50 text-sm font-bold text-gray-200 transition-all active:scale-[0.98]"
        >
          <History className="w-4 h-4 text-gray-400" />
          Ver historial
        </button>
      </div>
    </div>
  );

  const header = (
    <div className="flex items-start justify-between gap-4 w-full">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-blue-400/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <User className="w-7 h-7 text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="space-y-2 pr-2">
              <div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                  }}
                  className={`w-full bg-gray-900/60 border rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none focus:border-blue-500 ${
                    errors.name ? "border-red-500/50 focus:border-red-500/50" : "border-gray-700/60"
                  }`}
                  placeholder="Nombre del cliente"
                  aria-label="Nombre del cliente"
                />
                {errors.name && (
                  <p className="text-[10px] text-red-400 font-semibold mt-0.5 ml-1">{errors.name}</p>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <IdCard className="w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    value={formData.cedula}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, cedula: e.target.value }));
                      if (errors.cedula) setErrors(prev => ({ ...prev, cedula: "" }));
                    }}
                    className={`w-full bg-gray-900/60 border rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium ${
                      errors.cedula ? "border-red-500/50 focus:border-red-500/50" : "border-gray-700/60"
                    }`}
                    placeholder="Cédula / Identificación"
                    aria-label="Cédula del cliente"
                  />
                </div>
                {errors.cedula && (
                  <p className="text-[10px] text-red-400 font-semibold mt-0.5 ml-5">{errors.cedula}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              {isMobile ? (
                <SheetTitle className="text-lg font-bold text-white leading-tight truncate">
                  {localCliente.name}
                </SheetTitle>
              ) : (
                <DialogTitle className="text-lg font-bold text-white leading-tight truncate">
                  {localCliente.name}
                </DialogTitle>
              )}
              <div className="flex items-center gap-1.5 mt-0.5">
                <IdCard className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 truncate">{localCliente.cedula || "Sin cédula"}</span>
              </div>
            </>
          )}
          {/* Hidden description for accessibility */}
          {isMobile ? (
             <SheetDescription className="sr-only">Detalles del cliente {localCliente.name}</SheetDescription>
          ) : (
             <DialogDescription className="sr-only">Detalles del cliente {localCliente.name}</DialogDescription>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isEditing && (
          <>
            <button
              onClick={handleDeleteClientClick}
              className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 flex items-center justify-center transition-colors border border-red-500/20"
              aria-label="Eliminar cliente"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </button>
            <button
              onClick={handleEditClick}
              className="w-10 h-10 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/30 flex items-center justify-center transition-colors border border-blue-500/20"
              aria-label="Editar cliente"
            >
              <Edit className="w-5 h-5 text-blue-400" />
            </button>
          </>
        )}
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-xl bg-gray-800/50 hover:bg-gray-700 active:bg-gray-600 flex items-center justify-center transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );

  const sharedModalContent = historialOpen ? (
    <Suspense fallback={
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/20">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    }>
      <ClienteHistorialModalLazy
        open={historialOpen}
        clienteId={localCliente.id!}
        clienteNombre={localCliente.name}
        onClose={(shouldCloseParent?: boolean) => {
          setHistorialOpen(false);
          if (shouldCloseParent) {
            handleClose();
          }
        }}
      />
    </Suspense>
  ) : null;

  const modalsAdicionales = (
    <>
      <DispositivoFormModal
        open={deviceModalOpen}
        cliente={localCliente}
        initialData={editingDevice}
        onClose={() => setDeviceModalOpen(false)}
        onSuccess={(updatedCliente) => {
          setLocalCliente(updatedCliente);
          setDeviceModalOpen(false);
        }}
      />

      <Dialog 
        open={deleteDeviceOpen} 
        onOpenChange={(v) => !v && setDeleteDeviceOpen(false)}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm mx-auto rounded-2xl bg-gray-800 border-gray-700 p-6">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              ¿Eliminar {deviceToDelete?.marca}?
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm mt-2">
              Esta acción no se puede deshacer. Se removerá este dispositivo del perfil de {localCliente.name}. El historial de órdenes previo se mantendrá intacto.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={() => setDeleteDeviceOpen(false)}
              className="w-full h-12 rounded-xl bg-gray-700/60 hover:bg-gray-700 text-white text-sm font-medium order-2 sm:order-1 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteDeviceConfirm}
              disabled={isDeletingDevice}
              className="w-full h-12 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-sm font-medium order-1 sm:order-2 transition-colors flex items-center justify-center gap-2"
            >
              {isDeletingDevice ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación para Eliminar Cliente */}
      <Dialog 
        open={deleteClientOpen} 
        onOpenChange={(v) => !v && setDeleteClientOpen(false)}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm mx-auto rounded-2xl bg-gray-800 border-gray-700 p-6">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              ¿Eliminar a {localCliente.name}?
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm mt-2">
              Esta acción no se puede deshacer. Las órdenes asociadas se conservarán pero perderás acceso a la información de contacto y dispositivos vinculados.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={() => setDeleteClientOpen(false)}
              className="w-full h-12 rounded-xl bg-gray-700/60 hover:bg-gray-700 text-white text-sm font-medium order-2 sm:order-1 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteClientConfirm}
              disabled={isDeletingClient}
              className="w-full h-12 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-sm font-medium order-1 sm:order-2 transition-colors flex items-center justify-center gap-2"
            >
              {isDeletingClient ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
          <SheetContent 
              hideClose 
              side="bottom" 
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
              className="rounded-t-[2.5rem] bg-gray-900 border-t border-gray-800 p-0 max-h-[90vh] flex flex-col overflow-hidden" 
              onTouchStart={handleTouchStart} 
              onTouchMove={handleTouchMove} 
              onTouchEnd={handleTouchEnd}
            >
            <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
            <SheetHeader className="px-6 py-4 border-b border-gray-800/50 flex-shrink-0 text-left">
              {header}
            </SheetHeader>
            <div ref={scrollRef} className="overflow-y-auto flex-1 custom-scrollbar">
              {modalBody}
            </div>
            {/* Sticky Actions Footer */}
            {isEditing && (
              <div className="flex-shrink-0 border-t border-gray-800 bg-gray-950/80 p-6">
                {actionsSection}
              </div>
            )}
          </SheetContent>
        </Sheet>
        {sharedModalContent}
        {modalsAdicionales}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent 
          hideClose 
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          className="w-[calc(100%-1.5rem)] max-w-lg mx-auto rounded-3xl bg-gray-900 border border-gray-800 p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col shadow-2xl"
        >
          <DialogHeader className="px-6 py-5 border-b border-gray-800/50 flex-shrink-0 relative">
            {header}
          </DialogHeader>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {modalBody}
          </div>
          {/* Sticky Actions Footer */}
          {isEditing && (
            <div className="flex-shrink-0 border-t border-gray-800 bg-gray-950/80 backdrop-blur-lg p-6">
              {actionsSection}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {sharedModalContent}
      {modalsAdicionales}
    </>
  );
}