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
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect, useState, useCallback, useRef, memo } from "react";
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

// ── Error clasificado ─────────────────────────────────────────────────────────
type SubmitErrorKind = "network" | "conflict" | "unknown";

interface SubmitError {
  kind: SubmitErrorKind;
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
    if (msg.includes("cedula") || msg.includes("duplicate") || msg.includes("already")) {
      return {
        kind: "conflict",
        message: "Ya existe un cliente con esa cédula/NIT.",
        retryable: false,
      };
    }
    return { kind: "unknown", message: err.message, retryable: true };
  }
  return { kind: "unknown", message: "Error inesperado. Intenta nuevamente.", retryable: true };
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

// ── Barra de progreso animada ─────────────────────────────────────────────────
const ProgressBar = memo(function ProgressBar({ step }: { step: number }) {
  return (
    <div className="relative h-0.5 bg-gray-700/60 rounded-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500 ease-out"
        style={{ width: step === 1 ? "50%" : "100%" }}
      />
    </div>
  );
});

// ── Indicador de pasos ────────────────────────────────────────────────────────
const StepIndicator = memo(function StepIndicator({ step }: { step: number }) {
  const steps = [
    { n: 1, label: "Información", icon: <User className="w-3 h-3" /> },
    { n: 2, label: "Dispositivos", icon: <Monitor className="w-3 h-3" /> },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        {steps.map(({ n, label, icon }, idx) => (
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
              {step > n ? <CheckCircle2 className="w-3 h-3" /> : icon}
              <span className="hidden xs:inline">{label}</span>
            </div>
            {idx === 0 && (
              <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
            )}
          </div>
        ))}

        {/* Conteo paso */}
        <span className="ml-auto text-[10px] text-gray-600 tabular-nums">
          {step} / 2
        </span>
      </div>
      <ProgressBar step={step} />
    </div>
  );
});

// ── Banner de error persistente ───────────────────────────────────────────────
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
    <div className="mx-4 mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex-shrink-0">
        {error.kind === "network" ? (
          <WifiOff className="w-4 h-4 text-red-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-red-300/90 leading-relaxed font-medium">{error.message}</p>
        {error.retryable && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-[11px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider transition-colors"
          >
            Reintentar
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="flex-shrink-0 w-8 h-8 -mt-1 -mr-1 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="Cerrar error"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

// ── Step 1 Component ────────────────────────────────────────────────────────
const Step1Content = memo(function Step1Content({ 
  control, 
  isLoading 
}: { 
  control: any; 
  isLoading: boolean 
}) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Nombre completo *</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: Juan Pérez"
                {...field}
                disabled={isLoading}
                autoComplete="name"
                className="bg-gray-800/40 border-gray-700/50 text-white placeholder:text-gray-600 h-11 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/10 transition-all text-base"
              />
            </FormControl>
            <FormMessage className="text-[10px] ml-1 font-medium text-red-400/90" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="cedula"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Cédula o NIT *</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: 1234567890"
                {...field}
                disabled={isLoading}
                inputMode="numeric"
                className="bg-gray-800/40 border-gray-700/50 text-white placeholder:text-gray-600 h-11 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/10 transition-all text-base"
              />
            </FormControl>
            <FormMessage className="text-[10px] ml-1 font-medium text-red-400/90" />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Email *</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  {...field}
                  disabled={isLoading}
                  autoComplete="email"
                  inputMode="email"
                  className="bg-gray-800/40 border-gray-700/50 text-white placeholder:text-gray-600 h-11 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/10 transition-all text-base"
                />
              </FormControl>
              <FormMessage className="text-[10px] ml-1 font-medium text-red-400/90" />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="phone"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Teléfono *</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="3001234567"
                  {...field}
                  disabled={isLoading}
                  autoComplete="tel"
                  inputMode="tel"
                  className="bg-gray-800/40 border-gray-700/50 text-white placeholder:text-gray-600 h-11 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/10 transition-all text-base"
                />
              </FormControl>
              <FormMessage className="text-[10px] ml-1 font-medium text-red-400/90" />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="address"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">
              Dirección <span className="text-gray-600 font-normal">(opcional)</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Calle 123 #45-67"
                {...field}
                disabled={isLoading}
                autoComplete="street-address"
                className="bg-gray-800/40 border-gray-700/50 text-white placeholder:text-gray-600 h-11 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/10 transition-all text-base"
              />
            </FormControl>
            <FormMessage className="text-[10px] ml-1 font-medium text-red-400/90" />
          </FormItem>
        )}
      />
    </div>
  );
});

// ── Step 2 Component ────────────────────────────────────────────────────────
const Step2Content = memo(function Step2Content({
  control,
  isLoading,
  fields,
  addDispositivo,
  removeDispositivo,
  errors
}: {
  control: any;
  isLoading: boolean;
  fields: any[];
  addDispositivo: () => void;
  removeDispositivo: (idx: number) => void;
  errors: any;
}) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col">
          <h4 className="text-sm font-semibold text-white">Dispositivos vinculados</h4>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
            {fields.length} {fields.length === 1 ? "unidad" : "unidades"} registrada(s)
          </p>
        </div>
        <button
          type="button"
          onClick={addDispositivo}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 disabled:opacity-40 border border-blue-500/20 text-blue-400 text-xs font-bold transition-all shadow-sm shadow-blue-500/5"
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir
        </button>
      </div>

      {errors.dispositivos?.root && (
        <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl flex items-center gap-2 text-red-400 animate-in fade-in zoom-in-95 duration-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-[11px] font-bold">{errors.dispositivos.root.message}</p>
        </div>
      )}

      <div className="space-y-3 pb-2">
        {fields.map((field, idx) => (
          <DispositivoCard
            key={field.id}
            idx={idx}
            fieldId={field.id}
            control={control}
            isLoading={isLoading}
            canRemove={fields.length > 1}
            onRemove={removeDispositivo}
          />
        ))}
      </div>
    </div>
  );
});

// ── Campo de dispositivo memoizado ────────────────────────────────────────────
// Evita que todos los dispositivos se re-rendericen cuando uno cambia
const DispositivoCard = memo(function DispositivoCard({
  idx,
  fieldId,
  control,
  isLoading,
  canRemove,
  onRemove,
}: {
  idx: number;
  fieldId: string;
  control: any;
  isLoading: boolean;
  canRemove: boolean;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="bg-gray-800/40 rounded-2xl border border-gray-700/40 p-4 space-y-4 transition-all duration-200 group active:border-gray-600/60 shadow-sm">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-400/5 border border-blue-500/20 flex items-center justify-center shadow-inner">
            <Monitor className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Registrado como</span>
            <span className="text-xs font-bold text-white tracking-wide">
              Dispositivo {idx + 1}
            </span>
          </div>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="w-8 h-8 rounded-xl bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 flex items-center justify-center transition-all active:scale-90 group/btn"
            aria-label={`Eliminar dispositivo ${idx + 1}`}
          >
            <X className="w-4 h-4 text-red-400 group-hover/btn:scale-110 transition-transform" />
          </button>
        )}
      </div>

      <div className="space-y-3.5 pt-1">
        {/* Tipo */}
        <FormField
          control={control}
          name={`dispositivos.${idx}.tipo`}
          render={({ field: f }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Tipo *</FormLabel>
              <Select value={f.value} onValueChange={f.onChange} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger className="bg-gray-900/40 border-gray-700/60 text-white h-11 text-base rounded-xl transition-all hover:border-gray-600/60 focus:ring-blue-500/10">
                    <SelectValue placeholder="Seleccionar tipo de equipo…" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 text-white border-gray-700 rounded-xl overflow-hidden shadow-2xl">
                  {TIPO_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize py-3 text-sm focus:bg-blue-500/10 focus:text-blue-400">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-[10px] ml-1 font-medium text-red-400/90" />
            </FormItem>
          )}
        />

        {/* Marca + Modelo */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={control}
            name={`dispositivos.${idx}.marca`}
            render={({ field: f }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Marca *</FormLabel>
                <FormControl>
                  <Input
                    {...f}
                    placeholder="HP, Canon…"
                    disabled={isLoading}
                    className="bg-gray-900/40 border-gray-700/60 text-white placeholder:text-gray-600 h-11 text-base rounded-xl transition-all focus:ring-blue-500/10"
                  />
                </FormControl>
                <FormMessage className="text-[10px] ml-1 font-medium text-red-400/90" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`dispositivos.${idx}.modelo`}
            render={({ field: f }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Modelo *</FormLabel>
                <FormControl>
                  <Input
                    {...f}
                    placeholder="LX-3200…"
                    disabled={isLoading}
                    className="bg-gray-900/40 border-gray-700/60 text-white placeholder:text-gray-600 h-11 text-base rounded-xl transition-all focus:ring-blue-500/10"
                  />
                </FormControl>
                <FormMessage className="text-[10px] ml-1 font-medium text-red-400/90" />
              </FormItem>
            )}
          />
        </div>

        {/* Serie */}
        <FormField
          control={control}
          name={`dispositivos.${idx}.numeroSerie`}
          render={({ field: f }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Número de serie *</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  placeholder="ABC123XYZ"
                  disabled={isLoading}
                  className="bg-gray-900/40 border-gray-700/60 text-white placeholder:text-gray-600 h-11 text-base rounded-xl font-mono tracking-wider transition-all focus:ring-blue-500/10 uppercase"
                />
              </FormControl>
              <FormMessage className="text-[10px] ml-1 font-medium text-red-400/90" />
            </FormItem>
          )}
        />
      </div>
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

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);

  // Ref para el último submit (para poder reintentarlo)
  const lastSubmitDataRef = useRef<FormValues | null>(null);

  // ── Hook de Android back — siempre primero, antes de cualquier return ──────
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

  // ── Reset al abrir / cambiar cliente ──────────────────────────────────────
  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(initialData));
      setStep(1);
      setSubmitError(null);
      lastSubmitDataRef.current = null;
    }
  }, [open, initialData, form]);

  // ── Limpiar error al cambiar de paso ─────────────────────────────────────
  useEffect(() => {
    setSubmitError(null);
  }, [step]);

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

  // ── Submit central — separado del handler para poder reintentarlo ─────────
  const executeSubmit = useCallback(
    async (data: FormValues) => {
      if (!user?.uid) return;

      setIsLoading(true);
      setSubmitError(null);
      lastSubmitDataRef.current = data;

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
            title: "✓ Cliente actualizado",
            description: `${data.name} actualizado correctamente.`,
          });
          onSuccess({ ...initialData, ...payload, id: initialData.id } as Cliente);
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

        // Solo hacer toast para errores de red (más urgentes); el banner cubre el resto
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

  // Retry: re-ejecuta con los últimos datos válidos
  const handleRetry = useCallback(() => {
    if (lastSubmitDataRef.current) {
      executeSubmit(lastSubmitDataRef.current);
    }
  }, [executeSubmit]);

  const dismissError = useCallback(() => setSubmitError(null), []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg mx-auto rounded-2xl bg-gray-900 border border-gray-700/60 p-0 gap-0 overflow-hidden max-h-[92dvh] flex flex-col [&>button:last-child]:hidden">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <DialogTitle className="text-base font-semibold text-white">
              {isEditing ? "Editar cliente" : "Nuevo cliente"}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <StepIndicator step={step} />
        </DialogHeader>

        {/* ── Banner de error (fuera del scroll para que siempre sea visible) ── */}
        {submitError && (
          <ErrorBanner
            error={submitError}
            onRetry={submitError.retryable ? handleRetry : undefined}
            onDismiss={dismissError}
          />
        )}

        {/* ── Form ────────────────────────────────────────────────────── */}
        <Form {...form}>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Scroll area */}
            <div className="overflow-y-auto flex-1 px-4 py-4 custom-scrollbar">
              {/* Contenido dinámico según el paso */}
              {step === 1 ? (
                <Step1Content 
                  control={form.control} 
                  isLoading={isLoading} 
                />
              ) : (
                <Step2Content 
                  control={form.control}
                  isLoading={isLoading}
                  fields={fields}
                  addDispositivo={addDispositivo}
                  removeDispositivo={removeDispositivo}
                  errors={form.formState.errors}
                />
              )}
            </div>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <div className="px-5 py-4 border-t border-gray-700/50 flex-shrink-0 bg-gray-900/80 backdrop-blur-sm flex gap-2">
              {step === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 h-11 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={goToStep2}
                    disabled={isLoading}
                    className="flex-1 h-11 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 active:bg-blue-500/35 disabled:opacity-40 border border-blue-500/25 text-blue-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
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
                    className="flex-1 h-11 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Atrás
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => form.handleSubmit(executeSubmit)()}
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
  )
})