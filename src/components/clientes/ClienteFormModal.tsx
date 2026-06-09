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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  User,
  Monitor,
  Loader2,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Plus,
  X,
  AlertCircle,
  WifiOff,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useFieldArray,
  useFormContext,
  useWatch,
  type Control,
} from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  memo,
} from "react";
import type { Cliente } from "@/types/orden";
import { crearCliente, actualizarCliente } from "@/lib/multiuser-helpers";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { motion, AnimatePresence } from "motion/react";

// ── Constantes ────────────────────────────────────────────────────────────────
const TIPO_OPTIONS = [
  "impresora",
  "fotocopiadora",
  "multifuncional",
  "escaner",
  "plotter",
  "otro",
] as const;

const DISPOSITIVO_VACIO = {
  tipo: "",
  marca: "",
  modelo: "",
  numeroSerie: "",
} as const;

// ── Schema ────────────────────────────────────────────────────────────────────
const dispositivoSchema = z.object({
  id: z.string().optional(),
  tipo: z.string().min(1, "Requerido"),
  marca: z.string().min(1, "Requerido"),
  modelo: z.string().optional().or(z.literal("")),
  numeroSerie: z.string().optional().or(z.literal("")),
});

const formSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  cedula: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || (val.length >= 4 && /^[0-9A-Za-z-]+$/.test(val)),
      "Mínimo 4 caracteres (letras, números y guiones)"
    ),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || val.length >= 7, "Teléfono muy corto"),
  address: z.string().optional().or(z.literal("")),
  dispositivos: z
    .array(dispositivoSchema)
    .min(1, "Agrega al menos un dispositivo")
    .default([{ ...DISPOSITIVO_VACIO }]),
});

type FormValues = z.infer<typeof formSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface ClienteFormModalProps {
  open: boolean;
  initialData?: Cliente | null;
  onClose: () => void;
  onSuccess: (cliente: Cliente) => void;
}

// ── Error clasificado ─────────────────────────────────────────────────────────
type ErrorKind = "network" | "conflict" | "unknown";

interface SubmitError {
  kind: ErrorKind;
  message: string;
  retryable: boolean;
}

function classifyError(err: unknown): SubmitError {
  if (err instanceof TypeError && err.message.includes("fetch")) {
    return {
      kind: "network",
      message: "Sin conexión. Verifica tu internet e intenta de nuevo.",
      retryable: true,
    };
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (
      msg.includes("cedula") ||
      msg.includes("duplicate") ||
      msg.includes("already")
    ) {
      return {
        kind: "conflict",
        message: "Ya existe un cliente con esa cédula/NIT.",
        retryable: false,
      };
    }
    return { kind: "unknown", message: err.message, retryable: true };
  }
  return {
    kind: "unknown",
    message: "Error inesperado. Intenta nuevamente.",
    retryable: true,
  };
}

// ── Defaults ──────────────────────────────────────────────────────────────────
function buildDefaults(data?: Cliente | null): FormValues {
  if (data) {
    return {
      name: data.name ?? "",
      cedula: data.cedula ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      address: data.address ?? "",
      dispositivos: data.dispositivos?.length
        ? data.dispositivos.map((d) => ({
            id: d.id,
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

// ── StepIndicator ─────────────────────────────────────────────────────────────
const StepIndicator = memo(function StepIndicator({ step }: { step: number }) {
  const steps = [
    { n: 1, label: "Información", Icon: User },
    { n: 2, label: "Dispositivos", Icon: Monitor },
  ];

  return (
    <div
      className="space-y-2.5"
      role="navigation"
      aria-label={`Paso ${step} de 2`}
    >
      <div className="flex items-center gap-2">
        {steps.map(({ n, label, Icon }, idx) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                step === n
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10"
                  : step > n
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-gray-800/60 text-gray-600 border border-gray-700/30"
              }`}
            >
              {step > n ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Icon className="w-3 h-3" />
              )}
              <span>{label}</span>
            </div>
            {idx === 0 && (
              <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
            )}
          </div>
        ))}
        <span className="ml-auto text-[10px] text-gray-600 tabular-nums">
          {step}/2
        </span>
      </div>

      {/* Barra de progreso */}
      <div
        className="h-0.5 bg-gray-700/60 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={2}
        aria-label={`Progreso: paso ${step} de 2`}
      >
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>
    </div>
  );
});

// ── ErrorBanner ───────────────────────────────────────────────────────────────
const ErrorBanner = memo(function ErrorBanner({
  error,
  onRetry,
  onDismiss,
}: {
  error: SubmitError;
  onRetry?: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mx-4 mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-3"
    >
      <div className="flex-shrink-0 mt-0.5">
        {error.kind === "network" ? (
          <WifiOff className="w-4 h-4 text-red-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-red-300/90 leading-relaxed font-medium">
          {error.message}
        </p>
        {/* FIX: área táctil mínima de 44px en el botón de retry */}
        {error.retryable && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 h-11 px-1 -ml-1 flex items-center text-[11px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider transition-colors"
          >
            Reintentar
          </button>
        )}
      </div>
      {/* FIX: área táctil mínima de 44px en el botón de cerrar */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar error"
        className="w-11 h-11 -mt-1 -mr-1 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

// ── InputField — componente atómico con useFormContext ────────────────────────
// Evita pasar `control` por props en cada campo del paso 1
const InputField = memo(function InputField({
  name,
  label,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
  disabled,
}: {
  name: "name" | "cedula" | "email" | "phone" | "address";
  label: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  disabled?: boolean;
}) {
  const { control } = useFormContext<FormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1.5">
          <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">
            {label}
          </FormLabel>
          <FormControl>
            <Input
              type={type}
              inputMode={inputMode}
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
              {...field}
              value={(field.value as string) ?? ""}
              className="bg-gray-800/40 border-gray-700/50 text-white placeholder:text-gray-600 h-11 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/10 transition-all text-base"
            />
          </FormControl>
          <FormMessage className="text-[10px] ml-1 font-medium text-red-400/90" />
        </FormItem>
      )}
    />
  );
});

// ── DispositivoCard ───────────────────────────────────────────────────────────
const DispositivoCard = memo(function DispositivoCard({
  idx,
  control,
  canRemove,
  onRemove,
  isLoading,
}: {
  idx: number;
  control: Control<FormValues>;
  canRemove: boolean;
  onRemove: (idx: number) => void;
  isLoading: boolean;
}) {
  const { setValue } = useFormContext<FormValues>();
  
  const tipoActual = useWatch({
    control,
    name: `dispositivos.${idx}.tipo`,
  });

  const [modoCustom, setModoCustom] = useState(false);

  // Sincronizar el modo de entrada con el valor real del campo
  useEffect(() => {
    const esRealmenteCustom = !!tipoActual && !TIPO_OPTIONS.filter(t => t !== 'otro').includes(tipoActual as any);
    if (esRealmenteCustom && !modoCustom) {
      setModoCustom(true);
    }
  }, [tipoActual, modoCustom]);

  const handleTipoChange = useCallback((val: string) => {
    if (val === "otro") {
      setModoCustom(true);
      setValue(`dispositivos.${idx}.tipo`, "", { shouldDirty: true });
    } else {
      setValue(`dispositivos.${idx}.tipo`, val, { shouldDirty: true, shouldValidate: true });
    }
  }, [idx, setValue]);

  const volverALista = useCallback(() => {
    setModoCustom(false);
    setValue(`dispositivos.${idx}.tipo`, "", { shouldDirty: true });
  }, [idx, setValue]);

  return (
    <div className="bg-gray-800/40 rounded-2xl border border-gray-700/40 p-4 space-y-3.5 motion-safe:animate-in motion-safe:fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Monitor className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
              Equipo
            </span>
            <span className="text-xs font-bold text-white">
              Dispositivo {idx + 1}
            </span>
          </div>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(idx)}
            disabled={isLoading}
            aria-label={`Eliminar dispositivo ${idx + 1}`}
            className="w-11 h-11 rounded-xl bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 flex items-center justify-center transition-colors disabled:opacity-40 active:scale-90"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        )}
      </div>

      <FormField
        control={control}
        name={`dispositivos.${idx}.tipo`}
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <div className="flex items-center justify-between ml-1 mr-1">
              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Tipo *
              </FormLabel>
              {modoCustom && (
                <button
                  type="button"
                  onClick={volverALista}
                  className="h-11 px-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  ← Ver lista
                </button>
              )}
            </div>
            
            <FormControl>
              {modoCustom ? (
                <Input
                  {...field}
                  autoFocus
                  placeholder="Ej: laminadora, encuadernadora…"
                  disabled={isLoading}
                  className="bg-gray-900/40 border-gray-700/60 text-white placeholder:text-gray-600 h-11 text-base rounded-xl focus:ring-blue-500/10"
                />
              ) : (
                <Drawer>
                  <DrawerTrigger asChild>
                    <button
                      type="button"
                      disabled={isLoading}
                      className="w-full bg-gray-900/40 border border-gray-700/60 text-white h-11 rounded-xl px-3 flex items-center justify-between focus:ring-2 focus:ring-blue-500/10 transition-all active:scale-[0.98]"
                    >
                      <span className={!field.value ? "text-gray-500" : ""}>
                        {field.value
                          ? TIPO_OPTIONS.find((t) => t === field.value)
                            ? field.value.charAt(0).toUpperCase() + field.value.slice(1)
                            : field.value
                          : "Seleccionar tipo…"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-500 rotate-90" />
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="bg-gray-950 border-gray-800 pb-8 z-[100]">
                    <div className="max-w-md mx-auto w-full">
                      <DrawerHeader className="border-b border-gray-800 mb-2">
                        <DrawerTitle className="text-white text-center">Tipo de Dispositivo</DrawerTitle>
                      </DrawerHeader>
                      <div className="p-4 grid gap-2">
                        {TIPO_OPTIONS.map((t) => (
                          <DrawerClose key={t} asChild>
                            <button
                              type="button"
                              onClick={() => handleTipoChange(t)}
                              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-800 hover:bg-blue-600 text-white transition-all active:scale-95"
                            >
                              <span className="capitalize font-semibold text-base">
                                {t === "otro" ? "Otro tipo (manual)" : t}
                              </span>
                              {field.value === t && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                            </button>
                          </DrawerClose>
                        ))}
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>
              )}
            </FormControl>
            <FormMessage className="text-[10px] ml-1 font-medium text-red-400/90" />
          </FormItem>
        )}
      />

      {/* Marca + Modelo */}
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={control}
          name={`dispositivos.${idx}.marca`}
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">
                Marca *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="HP, Canon…"
                  disabled={isLoading}
                  className="bg-gray-900/40 border-gray-700/60 text-white placeholder:text-gray-600 h-11 text-base rounded-xl focus:ring-blue-500/10"
                />
              </FormControl>
              <FormMessage className="text-[10px] ml-1 font-medium text-red-400/90" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`dispositivos.${idx}.modelo`}
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">
                Modelo
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="LX-3200…"
                  disabled={isLoading}
                  className="bg-gray-900/40 border-gray-700/60 text-white placeholder:text-gray-600 h-11 text-base rounded-xl focus:ring-blue-500/10"
                />
              </FormControl>
              <FormMessage className="text-[10px] ml-1 font-medium text-red-400/90" />
            </FormItem>
          )}
        />
      </div>

      {/* Número de serie */}
      <FormField
        control={control}
        name={`dispositivos.${idx}.numeroSerie`}
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">
              N° Serie{" "}
              <span className="text-gray-600 font-normal normal-case">
                (opcional)
              </span>
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="ABC123XYZ"
                disabled={isLoading}
                className="bg-gray-900/40 border-gray-700/60 text-white placeholder:text-gray-600 h-11 text-base rounded-xl font-mono tracking-wider focus:ring-blue-500/10 uppercase"
              />
            </FormControl>
            <FormMessage className="text-[10px] ml-1 font-medium text-red-400/90" />
          </FormItem>
        )}
      />
    </div>
  );
});

// ── Componente principal ──────────────────────────────────────────────────────
export const ClienteFormModal = memo(function ClienteFormModal({
  open,
  initialData,
  onClose,
  onSuccess,
}: ClienteFormModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!initialData?.id;

  const scrollRef = useRef<HTMLDivElement>(null);
  // Controla la dirección de la animación de slide
  const slideDir = useRef<1 | -1>(1);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);
  // Guarda los últimos datos válidos para poder reintentar sin re-validar
  const lastDataRef = useRef<FormValues | null>(null);

  // Hook de Android back — siempre antes de cualquier return condicional
  useAndroidBack(open, onClose);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaults(initialData),
    mode: "onTouched",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "dispositivos",
  });

  // ── Reset al abrir o cambiar de cliente ───────────────────────────────────
  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(initialData));
      setStep(1);
      setSubmitError(null);
      lastDataRef.current = null;
    }
  }, [open, initialData, form]);

  // ── Limpia el error al cambiar de paso ────────────────────────────────────
  useEffect(() => {
    setSubmitError(null);
  }, [step]);

  // ── Navegación ────────────────────────────────────────────────────────────
  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goToStep2 = useCallback(async () => {
    // FIX: incluir "address" en la validación antes de avanzar
    const ok = await form.trigger(["name", "cedula", "email", "phone", "address"]);
    if (!ok) return;
    slideDir.current = 1;
    setStep(2);
    scrollToTop();
  }, [form, scrollToTop]);

  const goToStep1 = useCallback(() => {
    slideDir.current = -1;
    setStep(1);
    scrollToTop();
  }, [scrollToTop]);

  // ── Dispositivos ──────────────────────────────────────────────────────────
  const addDispositivo = useCallback(() => {
    append({ ...DISPOSITIVO_VACIO });
  }, [append]);

  const removeDispositivo = useCallback(
    (idx: number) => {
      if (fields.length <= 1) {
        toast({
          title: "Mínimo un dispositivo",
          description: "Debe existir al menos un equipo registrado.",
          variant: "destructive",
        });
        return;
      }
      remove(idx);
    },
    [fields.length, remove, toast]
  );

  // ── Submit ────────────────────────────────────────────────────────────────
  const executeSubmit = useCallback(
    async (data: FormValues) => {
      if (!user?.uid) return;

      setIsLoading(true);
      setSubmitError(null);
      lastDataRef.current = data;

      try {
        const dispositivos = data.dispositivos
          .filter((d) => d.tipo || d.marca)
          .map((d, i) => ({
            // FIX: crypto.randomUUID() evita colisión de IDs en el mismo loop
            id: d.id ?? initialData?.dispositivos?.[i]?.id ?? crypto.randomUUID(),
            tipo: d.tipo ?? "",
            marca: d.marca ?? "",
            modelo: d.modelo ?? "",
            numeroSerie: d.numeroSerie ?? "",
          }));

        const payload: Omit<Cliente, "id"> & {
          updatedAt: string;
          userId: string;
        } = {
          name: data.name,
          cedula: data.cedula ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          // FIX: siempre enviar address (incluso vacío) para poder borrarlo al editar
          address: data.address?.trim() ?? "",
          dispositivos,
          updatedAt: new Date().toISOString(),
          userId: user.uid,
        };

        if (isEditing && initialData?.id) {
          await actualizarCliente(initialData.id, payload, user.uid);
          toast({
            title: "✓ Cliente actualizado",
            description: `${data.name} actualizado correctamente.`,
          });
          onSuccess({
            ...initialData,
            ...payload,
            id: initialData.id,
          } as Cliente);
        } else {
          const newId = await crearCliente(
            { ...payload, createdAt: new Date().toISOString() },
            user.uid
          );
          toast({
            title: "✓ Cliente creado",
            description: `${data.name} creado correctamente.`,
          });
          onSuccess({ ...payload, id: newId } as Cliente);
        }

        onClose();
      } catch (err) {
        const classified = classifyError(err);
        setSubmitError(classified);
        // Toast solo para errores de red (el banner cubre el resto)
        if (classified.kind === "network") {
          toast({
            title: "Sin conexión",
            description: classified.message,
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [user, initialData, isEditing, onClose, onSuccess, toast]
  );

  // Reintento sin re-validar: usa los últimos datos guardados
  const handleRetry = useCallback(() => {
    if (lastDataRef.current) executeSubmit(lastDataRef.current);
  }, [executeSubmit]);

  const dismissError = useCallback(() => setSubmitError(null), []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={[
          "w-[calc(100%-1.5rem)] max-w-lg mx-auto",
          "rounded-2xl bg-gray-900 border border-gray-700/60",
          "p-0 gap-0 overflow-hidden",
          // dvh es más fiable que vh en Capacitor/WebView
          "max-h-[92dvh] flex flex-col",
          // Oculta solo el botón de cierre nativo de Radix (último hijo del DialogContent)
          "[&>button:last-child]:hidden",
        ].join(" ")}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <DialogTitle className="text-base font-semibold text-white">
              {isEditing ? "Editar cliente" : "Nuevo cliente"}
            </DialogTitle>
            {/* FIX: botón de cerrar con área táctil de 44px */}
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Cerrar modal"
              className="w-11 h-11 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <StepIndicator step={step} />
        </DialogHeader>

        {/* ── Banner de error — fuera del scroll para que siempre sea visible */}
        {submitError && (
          <ErrorBanner
            error={submitError}
            onRetry={submitError.retryable ? handleRetry : undefined}
            onDismiss={dismissError}
          />
        )}

        {/* ── Formulario ────────────────────────────────────────────────── */}
        <Form {...form}>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Área scrolleable */}
            <div
              ref={scrollRef}
              className="overflow-y-auto flex-1 px-4 py-4"
              // Scroll nativo fluido en iOS WebView
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  // La dirección del slide sigue la dirección de navegación
                  initial={{ opacity: 0, x: slideDir.current * 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: slideDir.current * -20 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {step === 1 ? (
                    /* ── Paso 1: Información del cliente ── */
                    <div className="space-y-4">
                      <InputField
                        name="name"
                        label="Nombre completo *"
                        placeholder="Ej: Juan Pérez"
                        autoComplete="name"
                        disabled={isLoading}
                      />
                      <InputField
                        name="cedula"
                        label="Cédula o NIT (opcional)"
                        placeholder="Ej: 1234567890"
                        // FIX: text en lugar de numeric porque acepta letras y guiones
                        inputMode="text"
                        disabled={isLoading}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField
                          name="email"
                          label="Email (opcional)"
                          placeholder="correo@ejemplo.com"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          disabled={isLoading}
                        />
                        <InputField
                          name="phone"
                          label="Teléfono (opcional)"
                          placeholder="3001234567"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          disabled={isLoading}
                        />
                      </div>
                      <InputField
                        name="address"
                        label="Dirección (opcional)"
                        placeholder="Calle 123 #45-67"
                        autoComplete="street-address"
                        disabled={isLoading}
                      />
                    </div>
                  ) : (
                    /* ── Paso 2: Dispositivos ── */
                    <div className="space-y-4 pb-2">
                      <div className="flex items-center justify-between px-1">
                        <div>
                          <h4 className="text-sm font-semibold text-white">
                            Equipos vinculados
                          </h4>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                            {fields.length}{" "}
                            {fields.length === 1 ? "unidad" : "unidades"}
                          </p>
                        </div>
                        {/* FIX: botón de añadir con área táctil de 44px */}
                        <button
                          type="button"
                          onClick={addDispositivo}
                          disabled={isLoading}
                          aria-label="Añadir dispositivo"
                          className="w-11 h-11 flex items-center justify-center rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 transition-colors disabled:opacity-40 active:scale-95"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      {fields.map((field, idx) => (
                        <DispositivoCard
                          key={field.id}
                          idx={idx}
                          control={form.control}
                          canRemove={fields.length > 1}
                          onRemove={removeDispositivo}
                          isLoading={isLoading}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Footer ────────────────────────────────────────────────── */}
            {/*
             * FIX: pb-[calc(1rem+env(safe-area-inset-bottom))] asegura que los botones
             * no queden tapados por el home indicator de iOS ni por la barra de navegación
             * de Android en Capacitor.
             */}
            <div className="px-5 pt-4 border-t border-gray-700/50 flex-shrink-0 bg-gray-900/80 flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {step === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 h-12 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-sm font-medium transition-colors active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={goToStep2}
                    disabled={isLoading}
                    className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
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
                    className="flex-1 h-12 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => form.handleSubmit(executeSubmit)()}
                    disabled={isLoading}
                    // FIX: aria-busy para lectores de pantalla y asistentes de Android
                    aria-busy={isLoading}
                    className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {isEditing ? "Guardar cambios" : "Crear cliente"}
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
});