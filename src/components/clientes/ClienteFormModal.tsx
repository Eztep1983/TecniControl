// components/clientes/ClienteFormModal.tsx
// Modal de 2 pasos para crear o editar un cliente.
// Paso 1: datos de contacto. Paso 2: dispositivos.
// Notifica al padre con onSuccess(cliente) para actualizar la lista en tiempo real.

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/basic/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/basic/form";
import { Input } from "@/components/ui/basic/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/basic/select";
import {
  User,
  Monitor,
  Loader2,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect, useState } from "react";
import type { Cliente } from "@/types/orden";
import { crearCliente, actualizarCliente } from "@/lib/multiuser-helpers";

// ── Validación ────────────────────────────────────────────────────────────────
const dispositivoSchema = z.object({
  tipo: z.string().min(1, { message: "Requerido" }),
  marca: z.string().min(1, { message: "Requerido" }),
  modelo: z.string().min(1, { message: "Requerido" }),
  numeroSerie: z.string().min(1, { message: "Requerido" }),
});

const formSchema = z.object({
  name: z.string().min(2, { message: "Mínimo 2 caracteres" }),
  cedula: z
    .string()
    .min(4, { message: "Mínimo 4 caracteres" })
    .regex(/^[0-9A-Za-z-]+$/, { message: "Solo números, letras y guiones" }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z.string().min(8, { message: "Teléfono muy corto" }),
  address: z.string().optional(),
  dispositivos: z
    .array(dispositivoSchema)
    .min(1, { message: "Agrega al menos un dispositivo" }),
});

type FormValues = z.infer<typeof formSchema>;

// ── Props ────────────────────────────────────────────────────────────────────
interface ClienteFormModalProps {
  open: boolean;
  initialData?: Cliente | null;
  onClose: () => void;
  /** Llamado con el cliente creado/actualizado para actualizar la lista sin reload */
  onSuccess: (cliente: Cliente) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildDefaults(data?: Cliente | null): FormValues {
  if (data) {
    return {
      name: data.name ?? "",
      cedula: data.cedula ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      address: data.address ?? "",
      dispositivos:
        data.dispositivos?.map((d) => ({
          tipo: d.tipo ?? "",
          marca: d.marca ?? "",
          modelo: d.modelo ?? "",
          numeroSerie: d.numeroSerie ?? "",
        })) ?? [{ tipo: "", marca: "", modelo: "", numeroSerie: "" }],
    };
  }
  return {
    name: "",
    cedula: "",
    email: "",
    phone: "",
    address: "",
    dispositivos: [{ tipo: "", marca: "", modelo: "", numeroSerie: "" }],
  };
}

// ── Indicador de pasos ────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[
        { n: 1, label: "Información", icon: <User className="w-3.5 h-3.5" /> },
        { n: 2, label: "Dispositivos", icon: <Monitor className="w-3.5 h-3.5" /> },
      ].map(({ n, label, icon }, idx) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              step === n
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/25"
                : step > n
                ? "bg-gray-700/60 text-gray-400 border border-gray-600/40"
                : "bg-gray-800/60 text-gray-600 border border-gray-700/30"
            }`}
          >
            {icon}
            <span className="hidden xs:inline">{label}</span>
          </div>
          {idx === 0 && (
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function ClienteFormModal({
  open,
  initialData,
  onClose,
  onSuccess,
}: ClienteFormModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!initialData?.id;

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaults(initialData),
    mode: "onChange",
  });

  const dispositivos = form.watch("dispositivos") ?? [];

  // Reset cuando cambia el cliente o se abre
  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(initialData));
      setStep(1);
    }
  }, [open, initialData]);

  // ── Dispositivos ──────────────────────────────────────────────────────────
  const addDispositivo = () => {
    const current = form.getValues("dispositivos");
    form.setValue(
      "dispositivos",
      [...current, { tipo: "", marca: "", modelo: "", numeroSerie: "" }],
      { shouldValidate: false }
    );
  };

  const removeDispositivo = (idx: number) => {
    const current = form.getValues("dispositivos");
    if (current.length <= 1) {
      toast({ title: "Debe haber al menos un dispositivo", variant: "destructive" });
      return;
    }
    form.setValue(
      "dispositivos",
      current.filter((_, i) => i !== idx),
      { shouldValidate: true }
    );
  };

  // ── Navegación entre pasos ────────────────────────────────────────────────
  const goToStep2 = async () => {
    const ok = await form.trigger(["name", "cedula", "email", "phone"]);
    if (ok) setStep(2);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    if (!user?.uid) return;
    setIsLoading(true);

    try {
      const dispositivosConId = data.dispositivos.map((d, i) => ({
        id: initialData?.dispositivos?.[i]?.id ?? `${Date.now()}-${i}`,
        tipo: d.tipo,
        marca: d.marca,
        modelo: d.modelo,
        numeroSerie: d.numeroSerie,
      }));

      const payload: any = {
        name: data.name,
        cedula: data.cedula,
        email: data.email,
        phone: data.phone,
        dispositivos: dispositivosConId,
        updatedAt: new Date().toISOString(),
        userId: user.uid,
      };
      if (data.address?.trim()) payload.address = data.address.trim();

      if (isEditing && initialData?.id) {
        await actualizarCliente(initialData.id, payload, user.uid);
        toast({ title: " Cliente actualizado", description: `${data.name} actualizado correctamente.` });
        onSuccess({ ...initialData, ...payload, id: initialData.id } as Cliente);
      } else {
        const newId = await crearCliente(
          { ...payload, createdAt: new Date().toISOString() },
          user.uid
        );
        toast({ title: " Cliente creado", description: `${data.name} creado correctamente.` });
        onSuccess({ ...payload, id: newId } as Cliente);
      }

      onClose();
    } catch (error) {
      toast({
        title: " Error",
        description:
          "No se pudo guardar el cliente. " +
          (error instanceof Error ? error.message : "Intente nuevamente."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg mx-auto rounded-2xl bg-gray-900 border border-gray-700/60 p-0 gap-0 overflow-hidden max-h-[92dvh] flex flex-col">

        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <DialogTitle className="text-base font-semibold text-white">
              {isEditing ? "Editar cliente" : "Nuevo cliente"}
            </DialogTitle>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <StepIndicator step={step} />
        </DialogHeader>

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={(e) => {
              // Bloquear submit si no estamos en el paso 2
              if (step !== 3) {
                e.preventDefault();
                return;
              }
              form.handleSubmit(onSubmit)(e);
            }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Scroll area */}
            <div className="overflow-y-auto flex-1 px-5 py-4">

              {/* ── Paso 1: Información ────────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-400">Nombre completo *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Juan Pérez"
                            {...field}
                            disabled={isLoading}
                            className="bg-gray-800/60 border-gray-700/50 text-white placeholder:text-gray-600 h-10 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cedula"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-400">Cédula o NIT *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: 1234567890"
                            {...field}
                            disabled={isLoading}
                            className="bg-gray-800/60 border-gray-700/50 text-white placeholder:text-gray-600 h-10 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-400">Email *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="correo@ejemplo.com"
                              {...field}
                              disabled={isLoading}
                              className="bg-gray-800/60 border-gray-700/50 text-white placeholder:text-gray-600 h-10 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-400">Teléfono *</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="3001234567"
                              {...field}
                              disabled={isLoading}
                              className="bg-gray-800/60 border-gray-700/50 text-white placeholder:text-gray-600 h-10 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-400">
                          Dirección{" "}
                          <span className="text-gray-600">(opcional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Calle 123 #45-67"
                            {...field}
                            disabled={isLoading}
                            className="bg-gray-800/60 border-gray-700/50 text-white placeholder:text-gray-600 h-10 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* ── Paso 2: Dispositivos ───────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* Encabezado del listado */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {dispositivos.length}{" "}
                      {dispositivos.length === 1 ? "dispositivo" : "dispositivos"} registrado
                      {dispositivos.length !== 1 ? "s" : ""}
                    </p>
                    <button
                      type="button"
                      onClick={addDispositivo}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/20 text-blue-400 text-xs font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar
                    </button>
                  </div>

                  {dispositivos.map((d, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-800/50 rounded-xl border border-gray-700/40 p-3.5 space-y-3"
                    >
                      {/* Cabecera tarjeta dispositivo */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Monitor className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <span className="text-xs font-medium text-gray-400">
                            Dispositivo {idx + 1}
                          </span>
                        </div>
                        {dispositivos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDispositivo(idx)}
                            className="w-6 h-6 rounded-lg bg-red-500/15 hover:bg-red-500/25 flex items-center justify-center transition-colors"
                          >
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        )}
                      </div>

                      {/* Tipo */}
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Tipo *</label>
                        <Select
                          value={d.tipo}
                          onValueChange={(val) => {
                            const cur = form.getValues("dispositivos");
                            cur[idx].tipo = val;
                            form.setValue("dispositivos", cur, { shouldValidate: true });
                          }}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="bg-gray-700/50 border-gray-600/50 text-white h-9 text-sm rounded-xl">
                            <SelectValue placeholder="Seleccionar…" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {["impresora", "fotocopiadora", "multifuncional", "escaner", "plotter", "otro"].map((t) => (
                              <SelectItem key={t} value={t} className="capitalize">
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.dispositivos?.[idx]?.tipo && (
                          <p className="text-xs text-red-400 mt-1">
                            {form.formState.errors.dispositivos[idx]?.tipo?.message}
                          </p>
                        )}
                      </div>

                      {/* Marca + Modelo */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Marca *</label>
                          <Input
                            value={d.marca}
                            onChange={(e) => {
                              const cur = form.getValues("dispositivos");
                              cur[idx].marca = e.target.value;
                              form.setValue("dispositivos", cur, { shouldValidate: true });
                            }}
                            placeholder="HP, Canon…"
                            disabled={isLoading}
                            className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-600 h-9 text-sm rounded-xl"
                          />
                          {form.formState.errors.dispositivos?.[idx]?.marca && (
                            <p className="text-xs text-red-400 mt-1">
                              {form.formState.errors.dispositivos[idx]?.marca?.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Modelo *</label>
                          <Input
                            value={d.modelo}
                            onChange={(e) => {
                              const cur = form.getValues("dispositivos");
                              cur[idx].modelo = e.target.value;
                              form.setValue("dispositivos", cur, { shouldValidate: true });
                            }}
                            placeholder="LX-3200…"
                            disabled={isLoading}
                            className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-600 h-9 text-sm rounded-xl"
                          />
                          {form.formState.errors.dispositivos?.[idx]?.modelo && (
                            <p className="text-xs text-red-400 mt-1">
                              {form.formState.errors.dispositivos[idx]?.modelo?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Serie */}
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Número de serie *</label>
                        <Input
                          value={d.numeroSerie}
                          onChange={(e) => {
                            const cur = form.getValues("dispositivos");
                            cur[idx].numeroSerie = e.target.value;
                            form.setValue("dispositivos", cur, { shouldValidate: true });
                          }}
                          placeholder="ABC123XYZ"
                          disabled={isLoading}
                          className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-600 h-9 text-sm rounded-xl font-mono"
                        />
                        {form.formState.errors.dispositivos?.[idx]?.numeroSerie && (
                          <p className="text-xs text-red-400 mt-1">
                            {form.formState.errors.dispositivos[idx]?.numeroSerie?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Footer con CTAs ──────────────────────────────────────── */}
            <div className="px-5 py-4 border-t border-gray-700/50 flex-shrink-0 bg-gray-900 flex gap-2">
              {step === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-11 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={goToStep2}
                    className="flex-1 h-11 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 active:bg-blue-500/35 border border-blue-500/25 text-blue-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 h-11 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-11 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 active:bg-blue-500/35 border border-blue-500/25 text-blue-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {isEditing ? "Guardar" : "Crear cliente"}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}