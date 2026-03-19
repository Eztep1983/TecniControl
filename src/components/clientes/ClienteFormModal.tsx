// components/clientes/ClienteFormModal.tsx
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
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect, useState, useCallback, memo } from "react";
import type { Cliente } from "@/types/orden";
import { crearCliente, actualizarCliente } from "@/lib/multiuser-helpers";
import { useAndroidBack } from "@/hooks/useAndroidBack";

// ── Constantes ────────────────────────────────────────────────────────────────
const TIPO_OPTIONS = [
  "impresora",
  "fotocopiadora",
  "multifuncional",
  "escaner",
  "plotter",
  "otro",
] as const;

const DISPOSITIVO_VACIO = { tipo: "", marca: "", modelo: "", numeroSerie: "" } as const;

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
        data.dispositivos?.length
          ? data.dispositivos.map((d) => ({
              tipo: d.tipo ?? "",
              marca: d.marca ?? "",
              modelo: d.modelo ?? "",
              numeroSerie: d.numeroSerie ?? "",
            }))
          : [{ ...DISPOSITIVO_VACIO }],
    };
  }
  return {
    name: "",
    cedula: "",
    email: "",
    phone: "",
    address: "",
    dispositivos: [{ ...DISPOSITIVO_VACIO }],
  };
}

// ── Indicador de pasos ────────────────────────────────────────────────────────
const StepIndicator = memo(function StepIndicator({ step }: { step: number }) {
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
});

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

  // Intercepta el botón/gesto de atrás en Android para cerrar el modal
  useAndroidBack(open, onClose);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaults(initialData),
    mode: "onTouched", // menos re-renders que "onChange"
  });

  // useFieldArray para manejo correcto sin mutación directa
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "dispositivos",
  });

  // Reset cuando cambia el cliente o se abre
  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(initialData));
      setStep(1);
    }
  }, [open, initialData, form]);

  // ── Dispositivos ──────────────────────────────────────────────────────────
  const addDispositivo = useCallback(() => {
    append({ ...DISPOSITIVO_VACIO });
  }, [append]);

  const removeDispositivo = useCallback(
    (idx: number) => {
      if (fields.length <= 1) {
        toast({ title: "Debe haber al menos un dispositivo", variant: "destructive" });
        return;
      }
      remove(idx);
    },
    [fields.length, remove, toast]
  );

  // ── Navegación entre pasos ────────────────────────────────────────────────
  const goToStep2 = useCallback(async () => {
    const ok = await form.trigger(["name", "cedula", "email", "phone"]);
    if (ok) setStep(2);
  }, [form]);

  const goToStep1 = useCallback(() => setStep(1), []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = useCallback(
    async (data: FormValues) => {
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

        const payload: Omit<Cliente, "id"> & { updatedAt: string; userId: string } = {
          name: data.name,
          cedula: data.cedula,
          email: data.email,
          phone: data.phone,
          dispositivos: dispositivosConId,
          updatedAt: new Date().toISOString(),
          userId: user.uid,
        };
        if (data.address?.trim()) {
          (payload as any).address = data.address.trim();
        }

        if (isEditing && initialData?.id) {
          await actualizarCliente(initialData.id, payload, user.uid);
          toast({
            title: "Cliente actualizado",
            description: `${data.name} actualizado correctamente.`,
          });
          onSuccess({ ...initialData, ...payload, id: initialData.id } as Cliente);
        } else {
          const newId = await crearCliente(
            { ...payload, createdAt: new Date().toISOString() },
            user.uid
          );
          toast({
            title: "Cliente creado",
            description: `${data.name} creado correctamente.`,
          });
          onSuccess({ ...payload, id: newId } as Cliente);
        }

        onClose();
      } catch (error) {
        toast({
          title: "Error",
          description:
            "No se pudo guardar el cliente. " +
            (error instanceof Error ? error.message : "Intente nuevamente."),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [user, initialData, isEditing, onClose, onSuccess, toast]
  );

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
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <StepIndicator step={step} />
        </DialogHeader>

        {/* Form */}
        <Form {...form}>
          {/*
            Arquitectura de submit:
            - El <form> tiene onSubmit={e => e.preventDefault()} → bloquea Enter y submit nativo.
            - Todos los botones son type="button" → ninguno dispara submit del form.
            - El botón "Guardar/Crear" del paso 2 llama form.handleSubmit(onSubmit)() manualmente.
            - Resultado: el envío SOLO ocurre cuando el usuario está en el paso 2 y hace clic.
          */}
          {/*
            El <form> no tiene onSubmit activo: todos los botones son type="button"
            y el envío se dispara manualmente desde el onClick del botón "Guardar/Crear".
            Esto elimina el submit accidental por tecla Enter o comportamiento del navegador.
          */}
          <form
            onSubmit={(e) => e.preventDefault()}
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {fields.length}{" "}
                      {fields.length === 1 ? "dispositivo" : "dispositivos"} registrado
                      {fields.length !== 1 ? "s" : ""}
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

                  {fields.map((field, idx) => (
                    <div
                      key={field.id}
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
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDispositivo(idx)}
                            className="w-6 h-6 rounded-lg bg-red-500/15 hover:bg-red-500/25 flex items-center justify-center transition-colors"
                            aria-label="Eliminar dispositivo"
                          >
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        )}
                      </div>

                      {/* Tipo */}
                      <FormField
                        control={form.control}
                        name={`dispositivos.${idx}.tipo`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-gray-400">Tipo *</FormLabel>
                            <Select
                              value={f.value}
                              onValueChange={f.onChange}
                              disabled={isLoading}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-gray-700/50 border-gray-600/50 text-white h-9 text-sm rounded-xl">
                                  <SelectValue placeholder="Seleccionar…" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                {TIPO_OPTIONS.map((t) => (
                                  <SelectItem key={t} value={t} className="capitalize">
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Marca + Modelo */}
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name={`dispositivos.${idx}.marca`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-400">Marca *</FormLabel>
                              <FormControl>
                                <Input
                                  {...f}
                                  placeholder="HP, Canon…"
                                  disabled={isLoading}
                                  className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-600 h-9 text-sm rounded-xl"
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`dispositivos.${idx}.modelo`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-400">Modelo *</FormLabel>
                              <FormControl>
                                <Input
                                  {...f}
                                  placeholder="LX-3200…"
                                  disabled={isLoading}
                                  className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-600 h-9 text-sm rounded-xl"
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Serie */}
                      <FormField
                        control={form.control}
                        name={`dispositivos.${idx}.numeroSerie`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-gray-400">Número de serie *</FormLabel>
                            <FormControl>
                              <Input
                                {...f}
                                placeholder="ABC123XYZ"
                                disabled={isLoading}
                                className="bg-gray-700/50 border-gray-600/50 text-white placeholder:text-gray-600 h-9 text-sm rounded-xl font-mono"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Footer con CTAs ────────────────────────────────────────── */}
            <div className="px-5 py-4 border-t border-gray-700/50 flex-shrink-0 bg-gray-900 flex gap-2">
              {step === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 h-11 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={goToStep2}
                    disabled={isLoading}
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
                    onClick={goToStep1}
                    disabled={isLoading}
                    className="flex-1 h-11 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Atrás
                  </button>
                  {/*
                    Todos los botones son type="button" para que el <form>
                    nunca haga submit por teclado (Enter) ni por el navegador.
                    El envío se dispara manualmente aquí, solo en el paso 2.
                  */}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => form.handleSubmit(onSubmit)()}
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