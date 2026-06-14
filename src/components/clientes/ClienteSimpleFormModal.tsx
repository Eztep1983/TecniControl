// components/clientes/ClienteSimpleFormModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/basic/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/basic/form";
import { Input } from "@/components/ui/basic/input";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Hash,
  Loader2,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldErrors } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useEffect } from "react";
import type { Cliente } from "@/types/orden";
import { useClientesUsuario } from "@/hooks/useMultiUser";
import { useAndroidBack } from "@/hooks/useAndroidBack";

// ── Schema con Validaciones ──────────────────────────────────────────────────

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre es requerido (mínimo 2 caracteres)" }),
  cedula: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || (val.length >= 4 && /^[0-9A-Za-z-]+$/.test(val)),
      { message: "Mínimo 4 caracteres (letras, números y guiones)" }
    ),
  email: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || val.length >= 8, { message: "Teléfono muy corto (mínimo 8 caracteres)" }),
  address: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

// ── Props ────────────────────────────────────────────────────────────────────

interface ClienteSimpleFormModalProps {
  open: boolean;
  initialData?: Cliente | null;
  onClose: () => void;
  onSuccess: (cliente: Cliente) => void;
}

// ── Componente ───────────────────────────────────────────────────────────────

export function ClienteSimpleFormModal({
  open,
  initialData,
  onClose,
  onSuccess,
}: ClienteSimpleFormModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { crearCliente, actualizarCliente } = useClientesUsuario();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData?.id;

  useAndroidBack(open, onClose);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cedula: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  // Reset/Cargar valores al abrir
  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name ?? "",
          cedula: initialData.cedula ?? "",
          email: initialData.email ?? "",
          phone: initialData.phone ?? "",
          address: initialData.address ?? "",
        });
      } else {
        form.reset({
          name: "",
          cedula: "",
          email: "",
          phone: "",
          address: "",
        });
      }
    }
  }, [open, initialData, form]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter") return;
    const target = event.target as HTMLElement;
    if (target.tagName === "TEXTAREA") return;

    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit(onSubmit, onError)();
  };

  const onError = (errors: FieldErrors<FormValues>) => {
    if (Object.keys(errors).length === 0) return;

    const firstError =
      errors.name?.message ||
      errors.cedula?.message ||
      errors.email?.message ||
      errors.phone?.message ||
      errors.address?.message ||
      "Revisá los campos del formulario.";

    toast({
      title: "Datos incorrectos",
      description: String(firstError),
      variant: "destructive",
    });
  };

  const onSubmit = async (data: FormValues) => {
    if (!user?.uid) return;
    setIsLoading(true);

    try {
      // Sanitización de entradas (Trim y formateo)
      const sanitizedPayload = {
        name: data.name.trim(),
        cedula: data.cedula ? data.cedula.trim() : "",
        email: data.email ? data.email.trim().toLowerCase() : "",
        phone: data.phone ? data.phone.trim() : "",
        address: data.address ? data.address.trim() : "",
        dispositivos: initialData?.dispositivos || [],
        updatedAt: new Date().toISOString(),
        userId: user.uid,
      };

      if (isEditing && initialData?.id) {
        await actualizarCliente(initialData.id, sanitizedPayload);
        toast({
          title: "✓ Cliente actualizado",
          description: `${sanitizedPayload.name} actualizado correctamente.`,
        });
        onSuccess({ ...initialData, ...sanitizedPayload, id: initialData.id } as Cliente);
      } else {
        const newId = await crearCliente(
          { ...sanitizedPayload, createdAt: new Date().toISOString() }
        );
        toast({
          title: "✓ Cliente creado",
          description: `${sanitizedPayload.name} creado correctamente.`,
        });
        onSuccess({ ...sanitizedPayload, id: newId } as Cliente);
      }
      onClose();
    } catch (error) {
      console.error("Error guardando cliente:", error);
      toast({
        title: "No se pudo guardar",
        description: "Revisá tu conexión e intentá de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/*
        ── Bottom Sheet ──────────────────────────────────────────────────────
        Posicionado en la base de la pantalla, con esquinas superiores
        redondeadas y deslizamiento hacia arriba. Sombra premium y 
        colores HSL coherentes con el diseño de DispositivoFormModal.tsx.
      */}
      <DialogContent
        className={[
          // Forma
          "rounded-t-[28px] rounded-b-none",
          // Fondo / borde
          "bg-gray-900 border-t border-white/[0.06]",
          // Layout
          "p-0 gap-0 flex flex-col",
          // Altura máxima + scroll interno
          "max-h-[92dvh]",
          // Sombra dramática
          "shadow-[0_-20px_60px_rgba(0,0,0,0.6)]",
          // Transición ligera para apertura/cierre
          "transition-opacity duration-150 ease-out",
        ].join(" ")}
        style={{
          position: "fixed",
          top: "auto",
          bottom: 0,
          left: 0,
          right: 0,
          transform: "none",
          width: "100%",
          maxWidth: "100%",
          margin: 0,
        }}
      >
        {/* ── Drag handle ─────────────────────────────────────────────────── */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-white/20" />
        </div>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-5 pt-2 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-[17px] font-semibold tracking-tight text-white leading-tight">
                {isEditing ? "Editar cliente" : "Nuevo cliente"}
              </DialogTitle>
              <p className="text-[13px] text-white/40 mt-0.5 font-medium">
                {isEditing ? "Modifica la información básica" : "Registra la información básica del cliente"}
              </p>
            </div>
            {/* Botón cerrar — estilo iOS */}
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Cerrar"
              className={[
                "w-[30px] h-[30px] rounded-full",
                "bg-white/10 hover:bg-white/15 active:bg-white/20",
                "flex items-center justify-center",
                "transition-colors duration-150",
                "disabled:opacity-30 mt-0.5",
              ].join(" ")}
            >
              <ChevronDown className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>

        {/* ── Formulario ──────────────────────────────────────────────────── */}
        <Form {...form}>
          <div
            onKeyDown={handleKeyDown}
            className="flex flex-col flex-1 min-h-0"
          >
            {/* Área scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 space-y-5 pb-4">

              {/* ── Información Principal ───────────────────────────────────── */}
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-white/30 mb-2.5">
                  Datos del Cliente
                </p>
                <div className="space-y-3">
                  {/* Nombre completo */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/20 pointer-events-none" />
                            <Input
                              {...field}
                              placeholder="Nombre completo *"
                              disabled={isLoading}
                              autoComplete="name"
                              className={[
                                "h-12 pl-10 pr-4 rounded-xl",
                                "bg-white/[0.04] border-white/[0.08]",
                                "text-white placeholder:text-white/20 text-[14px]",
                                "focus:border-white/20 focus:bg-white/[0.06]",
                                "focus:ring-0 focus-visible:ring-0",
                                "transition-colors duration-200",
                              ].join(" ")}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[12px] text-red-400 ml-1 mt-1" />
                      </FormItem>
                    )}
                  />

                  {/* Cédula o NIT */}
                  <FormField
                    control={form.control}
                    name="cedula"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/20 pointer-events-none" />
                            <Input
                              {...field}
                              placeholder="Cédula o NIT (opcional)"
                              disabled={isLoading}
                              autoComplete="off"
                              className={[
                                "h-12 pl-10 pr-4 rounded-xl",
                                "bg-white/[0.04] border-white/[0.08]",
                                "text-white placeholder:text-white/20 text-[14px]",
                                "focus:border-white/20 focus:bg-white/[0.06]",
                                "focus:ring-0 focus-visible:ring-0",
                                "transition-colors duration-200",
                              ].join(" ")}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[12px] text-red-400 ml-1 mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ── Datos de Contacto ───────────────────────────────────────── */}
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-white/30 mb-2.5">
                  Contacto y Ubicación
                </p>
                <div className="space-y-3">
                  {/* Correo electrónico */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/20 pointer-events-none" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="Correo electrónico (opcional)"
                              disabled={isLoading}
                              autoComplete="email"
                              inputMode="email"
                              className={[
                                "h-12 pl-10 pr-4 rounded-xl",
                                "bg-white/[0.04] border-white/[0.08]",
                                "text-white placeholder:text-white/20 text-[14px]",
                                "focus:border-white/20 focus:bg-white/[0.06]",
                                "focus:ring-0 focus-visible:ring-0",
                                "transition-colors duration-200",
                              ].join(" ")}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[12px] text-red-400 ml-1 mt-1" />
                      </FormItem>
                    )}
                  />

                  {/* Teléfono */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/20 pointer-events-none" />
                            <Input
                              {...field}
                              type="tel"
                              placeholder="Teléfono (opcional)"
                              disabled={isLoading}
                              autoComplete="tel"
                              inputMode="tel"
                              className={[
                                "h-12 pl-10 pr-4 rounded-xl",
                                "bg-white/[0.04] border-white/[0.08]",
                                "text-white placeholder:text-white/20 text-[14px]",
                                "focus:border-white/20 focus:bg-white/[0.06]",
                                "focus:ring-0 focus-visible:ring-0",
                                "transition-colors duration-200",
                              ].join(" ")}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[12px] text-red-400 ml-1 mt-1" />
                      </FormItem>
                    )}
                  />

                  {/* Dirección */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/20 pointer-events-none" />
                            <Input
                              {...field}
                              placeholder="Dirección (opcional)"
                              disabled={isLoading}
                              autoComplete="street-address"
                              className={[
                                "h-12 pl-10 pr-4 rounded-xl",
                                "bg-white/[0.04] border-white/[0.08]",
                                "text-white placeholder:text-white/20 text-[14px]",
                                "focus:border-white/20 focus:bg-white/[0.06]",
                                "focus:ring-0 focus-visible:ring-0",
                                "transition-colors duration-200",
                              ].join(" ")}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[12px] text-red-400 ml-1 mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Espacio para safe area inferior */}
              <div className="h-1" />
            </div>

            {/* ── Footer con botones ──────────────────────────────────────── */}
            <div
              className={[
                "px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
                "flex-shrink-0 flex gap-3",
                "border-t border-white/[0.06]",
                "bg-gray-950/85",
              ].join(" ")}
            >
              {/* Cancelar */}
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={[
                  "flex-[0.4] h-[52px] rounded-2xl",
                  "bg-white/[0.06] hover:bg-white/10 active:bg-white/[0.15]",
                  "text-white/60 text-[15px] font-medium",
                  "transition-colors duration-150 active:scale-[0.97]",
                  "disabled:opacity-30",
                ].join(" ")}
              >
                Cancelar
              </button>

              {/* Guardar/Crear */}
              <button
                type="button"
                onClick={form.handleSubmit(onSubmit, onError)}
                disabled={isLoading}
                className={[
                  "flex-1 h-[52px] rounded-2xl",
                  "bg-blue-500 hover:bg-blue-400 active:bg-blue-600",
                  "disabled:bg-white/10 disabled:text-white/20",
                  "text-[#0a0e14] text-[15px] font-semibold",
                  "flex items-center justify-center gap-2",
                  "transition-colors duration-200 active:scale-[0.97]",
                  "shadow-[0_4px_24px_rgba(59,130,246,0.25)]",
                  "disabled:shadow-none",
                ].join(" ")}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                    <span className="text-white/40">Guardando…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-[18px] h-[18px]" />
                    {isEditing ? "Guardar cambios" : "Crear cliente"}
                  </>
                )}
              </button>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
