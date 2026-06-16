// components/clientes/ImportarContactosModal.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/basic/dialog";
import { Input } from "@/components/ui/basic/input";
import { Checkbox } from "@/components/ui/basic/checkbox";
import {
  Users,
  Search,
  Check,
  Loader2,
  ShieldAlert,
  Smartphone,
  X,
  PhoneCall,
  UserPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useClientesUsuario } from "@/hooks/useMultiUser";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { Capacitor } from "@capacitor/core";
import { Contacts } from "@capacitor-community/contacts";
import type { Cliente } from "@/types/orden";

// ── Mock Contacts for Web / Localhost Fallback ──────────────────────────────
const MOCK_CONTACTS = [
  { name: { display: "Juan Carlos Pérez" }, phones: [{ number: "+5491134567890" }] },
  { name: { display: "María Alejandra Gómez" }, phones: [{ number: "1165432109" }] },
  { name: { display: "Carlos Rodríguez" }, phones: [{ number: "+34 612 345 678" }] },
  { name: { display: "Sofía Fernández" }, phones: [{ number: "15-3849-2019" }] },
  { name: { display: "Andrés Silva" }, phones: [{ number: "099 888 777" }] },
  { name: { display: "Laura Benítez" }, phones: [{ number: "+57 312 456 7890" }] },
  { name: { display: "Luis Martínez" }, phones: [{ number: "555-0199" }] },
  { name: { display: "Ana Belén Rossi" }, phones: [{ number: "+54 9 261 455-6677" }] },
  { name: { display: "Diego Maradona" }, phones: [{ number: "+54 9 11 1010-1010" }] },
  { name: { display: "Lionel Messi" }, phones: [{ number: "+34 1010 1010" }] },
  { name: { display: "Clara Domínguez" }, phones: [{ number: "11-2345-6789" }] },
  { name: { display: "Esteban Quito" }, phones: [{ number: "11-9876-5432" }] },
];

interface ImportarContactosModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportarContactosModal({
  open,
  onClose,
  onSuccess,
}: ImportarContactosModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { clientes, crearCliente } = useClientesUsuario();

  // ── States ──────────────────────────────────────────────────────────────────
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [rawContacts, setRawContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [displayLimit, setDisplayLimit] = useState(50);
  const [isImporting, setIsImporting] = useState(false);

  // Android back button integration
  useAndroidBack(open, onClose);

  // Reset states when modal closes/opens
  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setSelectedKeys(new Set());
      setDisplayLimit(50);
      checkPermission();
    }
  }, [open]);

  // Clean phone number helper
  const cleanPhone = useCallback((phone: string): string => {
    return phone.replace(/\D/g, "");
  }, []);

  // Deduplication check: compare clean phone number suffix (minimum 8 digits)
  const isDuplicate = useCallback((contactPhone: string, existingClients: Cliente[]): boolean => {
    const cleanedContact = cleanPhone(contactPhone);
    if (!cleanedContact || cleanedContact.length < 8) return false;

    return existingClients.some(client => {
      const cleanedClient = cleanPhone(client.phone || "");
      if (!cleanedClient || cleanedClient.length < 8) return false;
      return cleanedContact.endsWith(cleanedClient) || cleanedClient.endsWith(cleanedContact);
    });
  }, [cleanPhone]);

  // ── Permission Management ───────────────────────────────────────────────────
  const checkPermission = async () => {
    if (!Capacitor.isNativePlatform()) {
      setPermissionState('granted');
      loadMockContacts();
      return;
    }
    try {
      setPermissionState('checking');
      const permission = await Contacts.checkPermissions();
      if (permission.contacts === 'granted') {
        setPermissionState('granted');
        fetchDeviceContacts();
      } else if (permission.contacts === 'denied') {
        setPermissionState('denied');
      } else {
        setPermissionState('prompt');
      }
    } catch (error) {
      console.error("Error checking contacts permission:", error);
      setPermissionState('prompt');
    }
  };

  const requestPermission = async () => {
    if (!Capacitor.isNativePlatform()) {
      setPermissionState('granted');
      loadMockContacts();
      return;
    }
    try {
      setPermissionState('checking');
      const permission = await Contacts.requestPermissions();
      if (permission.contacts === 'granted') {
        setPermissionState('granted');
        fetchDeviceContacts();
      } else {
        setPermissionState('denied');
      }
    } catch (error) {
      console.error("Error requesting contacts permission:", error);
      setPermissionState('denied');
    }
  };

  // ── Contact Loading ──────────────────────────────────────────────────────────
  const loadMockContacts = () => {
    setLoadingContacts(true);
    setTimeout(() => {
      setRawContacts(MOCK_CONTACTS);
      setLoadingContacts(false);
    }, 600);
  };

  const fetchDeviceContacts = async () => {
    setLoadingContacts(true);
    try {
      const result = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true,
        },
      });
      setRawContacts(result.contacts || []);
    } catch (error) {
      console.error("Error fetching device contacts:", error);
      toast({
        title: "Error de lectura",
        description: "No pudimos acceder a los contactos de tu dispositivo.",
        variant: "destructive",
      });
    } finally {
      setLoadingContacts(false);
    }
  };

  // ── Computations & Memoized Lists ───────────────────────────────────────────
  const processedContacts = useMemo(() => {
    return rawContacts
      .filter((c) => c.name?.display && c.phones && c.phones.length > 0)
      .map((c, index) => {
        const display = c.name.display;
        const firstPhone = c.phones[0].number || "";
        const key = `${display}-${firstPhone}-${index}`;
        const duplicate = isDuplicate(firstPhone, clientes);
        return {
          key,
          display,
          firstPhone,
          isDuplicate: duplicate,
        };
      });
  }, [rawContacts, clientes, isDuplicate]);

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return processedContacts;
    const searchLower = searchTerm.toLowerCase();
    const cleanSearch = cleanPhone(searchTerm);
    return processedContacts.filter((c) => {
      const nameMatch = c.display.toLowerCase().includes(searchLower);
      const phoneMatch = cleanSearch ? cleanPhone(c.firstPhone).includes(cleanSearch) : false;
      return nameMatch || phoneMatch;
    });
  }, [processedContacts, searchTerm, cleanPhone]);

  // Reset scroll limit when filtering
  useEffect(() => {
    setDisplayLimit(50);
  }, [searchTerm]);

  const visibleContacts = useMemo(() => {
    return filteredContacts.slice(0, displayLimit);
  }, [filteredContacts, displayLimit]);

  const selectableContacts = useMemo(() => {
    return filteredContacts.filter((c) => !c.isDuplicate);
  }, [filteredContacts]);

  const allSelected = useMemo(() => {
    if (selectableContacts.length === 0) return false;
    return selectableContacts.every((c) => selectedKeys.has(c.key));
  }, [selectableContacts, selectedKeys]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        selectableContacts.forEach((c) => next.delete(c.key));
        return next;
      });
    } else {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        selectableContacts.forEach((c) => next.add(c.key));
        return next;
      });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
      if (displayLimit < filteredContacts.length) {
        setDisplayLimit((prev) => prev + 50);
      }
    }
  };

  const handleImport = async () => {
    if (selectedKeys.size === 0 || !user?.uid) return;
    setIsImporting(true);
    let imported = 0;
    let failed = 0;

    try {
      // Import sequentially.
      for (const key of selectedKeys) {
        const contact = processedContacts.find((c) => c.key === key);
        if (!contact) continue;

        try {
          await crearCliente({
            name: contact.display.trim(),
            phone: contact.firstPhone.trim(),
            cedula: "",
            email: "",
            address: "",
            dispositivos: [],
            userId: user.uid,
          });
          imported++;
        } catch (err) {
          console.error("Error al importar contacto:", contact.display, err);
          failed++;
        }
      }

      toast({
        title: "✓ Importación exitosa",
        description: `Se importaron ${imported} contactos correctamente.${
          failed > 0 ? ` (Error en ${failed})` : ""
        }`,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error masivo de importación:", err);
      toast({
        title: "Error al importar",
        description: "Hubo un problema al guardar los contactos seleccionados.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isImporting && onClose()}>
      <DialogContent
        className={[
          "rounded-t-[28px] rounded-b-none",
          "bg-gray-900 border-t border-white/[0.06]",
          "p-0 gap-0 flex flex-col",
          "max-h-[92dvh]",
          "shadow-[0_-20px_60px_rgba(0,0,0,0.6)]",
          "transition-opacity duration-150 ease-out",
        ].join(" ")}
        style={{
          position: "fixed",
          top: "auto",
          bottom: 0,
          left: 0,
          right: 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
          opacity: open ? 1 : 0,
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          width: "100%",
          maxWidth: "100%",
          margin: 0,
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 flex-shrink-0 border-b border-gray-800/40">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-[17px] font-semibold tracking-tight text-white leading-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Importar Contactos
              </DialogTitle>
              <p className="text-[13px] text-white/40 mt-0.5 font-medium">
                Selecciona los contactos de tu libreta para agregarlos como clientes
              </p>
            </div>
            {!isImporting && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-800/40 hover:bg-gray-800 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic States Container */}
        <div className="flex-1 flex flex-col min-h-0 bg-gray-950/20">
          {/* Permission State: Checking */}
          {permissionState === 'checking' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-400">Verificando permisos de contactos...</p>
            </div>
          )}

          {/* Permission State: Prompt / Denied */}
          {(permissionState === 'prompt' || permissionState === 'denied') && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Smartphone className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">Acceso a Contactos Requerido</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Para importar tus contactos rápidamente, necesitamos permiso para leer tu libreta de direcciones.
                </p>
              </div>
              {permissionState === 'denied' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs text-left">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>El permiso fue denegado. Puedes cambiar esto en los ajustes del sistema de tu dispositivo.</span>
                </div>
              )}
              <button
                onClick={requestPermission}
                className="w-full min-h-[48px] bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/10"
              >
                Permitir Acceso
              </button>
            </div>
          )}

          {/* Permission State: Granted */}
          {permissionState === 'granted' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search & Actions Bar */}
              <div className="p-4 space-y-3 flex-shrink-0 bg-gray-900/40 border-b border-gray-800/40">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Buscar por nombre o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 min-h-[44px] text-sm bg-gray-800/30 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 rounded-xl"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-800/80 hover:bg-gray-700/80"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Select All Checkbox */}
                {selectableContacts.length > 0 && (
                  <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-3 cursor-pointer group text-xs text-gray-400 font-medium hover:text-white select-none">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        className="bg-gray-800 border-gray-700 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 rounded"
                      />
                      <span>
                        Seleccionar todos los filtrados ({selectableContacts.length})
                      </span>
                    </label>
                    {selectedKeys.size > 0 && (
                      <button
                        onClick={() => setSelectedKeys(new Set())}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Limpiar selección ({selectedKeys.size})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Scrollable list */}
              <div
                className="flex-1 overflow-y-auto overscroll-contain px-4 py-2 space-y-2 min-h-0"
                onScroll={handleScroll}
              >
                {loadingContacts ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-sm text-gray-400">Leyendo libreta de contactos...</p>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="py-20 text-center space-y-2">
                    <Users className="w-12 h-12 text-gray-700 mx-auto" />
                    <h4 className="text-sm font-semibold text-gray-400">No se encontraron contactos</h4>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto">
                      Intenta buscar con otro nombre o asegúrate de que el contacto tenga un número de teléfono asignado.
                    </p>
                  </div>
                ) : (
                  <>
                    {visibleContacts.map((contact) => (
                      <div
                        key={contact.key}
                        className={[
                          "p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all duration-200",
                          contact.isDuplicate
                            ? "bg-gray-800/20 border-gray-800/40 opacity-50 select-none"
                            : selectedKeys.has(contact.key)
                            ? "bg-blue-500/5 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.05)]"
                            : "bg-gray-800/40 hover:bg-gray-800/60 border-gray-800/60"
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Selector */}
                          <div className="flex-shrink-0">
                            {contact.isDuplicate ? (
                              <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              </div>
                            ) : (
                              <Checkbox
                                checked={selectedKeys.has(contact.key)}
                                onCheckedChange={() => toggleSelect(contact.key)}
                                className="bg-gray-800 border-gray-700 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 rounded"
                              />
                            )}
                          </div>

                          {/* Avatar Circle */}
                          <div className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-gray-300 text-sm flex-shrink-0">
                            {contact.display.slice(0, 2).toUpperCase()}
                          </div>

                          {/* Contact Details */}
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-white truncate leading-tight">
                              {contact.display}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5 leading-none">
                              <PhoneCall className="w-3 h-3 text-gray-500" />
                              {contact.firstPhone}
                            </p>
                          </div>
                        </div>

                        {/* Badges / Extras */}
                        {contact.isDuplicate && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold tracking-wide flex-shrink-0 select-none">
                            Existente
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Pagination Indicator / Load More */}
                    {displayLimit < filteredContacts.length && (
                      <div className="pt-2 pb-6 text-center">
                        <button
                          onClick={() => setDisplayLimit((prev) => prev + 50)}
                          className="px-4 py-2 rounded-xl bg-gray-800/40 hover:bg-gray-800 text-xs font-semibold text-gray-400 transition-colors"
                        >
                          Cargar más contactos ({filteredContacts.length - displayLimit} restantes)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Bottom Sticky Action Panel */}
              <div className="p-4 border-t border-gray-800/60 bg-gray-900/80 backdrop-blur-md flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    disabled={isImporting}
                    onClick={onClose}
                    className="flex-1 min-h-[48px] bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-sm rounded-xl transition-all"
                  >
                    Cancelar
                  </button>

                  <button
                    disabled={selectedKeys.size === 0 || isImporting}
                    onClick={handleImport}
                    className={[
                      "flex-[2] min-h-[48px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all select-none shadow-lg",
                      selectedKeys.size === 0
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-800"
                        : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-blue-500/15"
                    ].join(" ")}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Importar ({selectedKeys.size})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
