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
  Printer,
  Copy,
  Layers,
  ScanLine,
  PenTool,
  Plus,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Hash,
  Cpu,
  Tag,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldErrors } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useEffect, useRef } from "react";
import type { Cliente, Dispositivo } from "@/types/orden";
import { actualizarCliente } from "@/lib/multiuser-helpers";
import { useAndroidBack } from "@/hooks/useAndroidBack";

// ─── Tipos de dispositivo predefinidos ────────────────────────────────────────

const TIPO_OPTIONS = [
  { value: "impresora",     label: "Impresora",     icon: Printer },
  { value: "fotocopiadora", label: "Fotocopiadora", icon: Copy },
  { value: "multifuncional",label: "Multifuncional",icon: Layers },
  { value: "escaner",       label: "Escáner",       icon: ScanLine },
  { value: "Computadora",   label: "Computadora",   icon: Cpu },
  { value: "personalizado", label: "Personalizado", icon: Plus },
] as const;

// ─── Schema ───────────────────────────────────────────────────────────────────

const dispositivoSchema = z.object({
  tipo:        z.string().min(1, { message: "Selecciona un tipo" }),
  marca:       z.string().min(1, { message: "La marca es requerida" }),
  modelo:      z.string().optional().or(z.literal("")),
  numeroSerie: z.string().optional().or(z.literal("")),
});

type DispositivoFormValues = z.infer<typeof dispositivoSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface DispositivoFormModalProps {
  open: boolean;
  cliente: Cliente;
  onClose: () => void;
  onSuccess: (clienteActualizado: Cliente, dispositivoNuevo: Dispositivo) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function DispositivoFormModal({
  open,
  cliente,
  onClose,
  onSuccess,
}: DispositivoFormModalProps) {
  const { toast }   = useToast();
  const { user }    = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Estado para tipo personalizado
  const [selectedTile, setSelectedTile]     = useState<string>("");
  const [isCustom, setIsCustom]             = useState(false);
  const [customTipoValue, setCustomTipoValue] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);

  useAndroidBack(open, onClose);

  const form = useForm<DispositivoFormValues>({
    resolver: zodResolver(dispositivoSchema),
    defaultValues: { tipo: "", marca: "", modelo: "", numeroSerie: "" },
  });

  // Reset al abrir
  useEffect(() => {
    if (open) {
      form.reset({ tipo: "", marca: "", modelo: "", numeroSerie: "" });
      setSelectedTile("");
      setIsCustom(false);
      setCustomTipoValue("");
    }
  }, [open, form]);

  // Foco automático en input custom
  useEffect(() => {
    if (isCustom) {
      setTimeout(() => customInputRef.current?.focus(), 150);
    }
  }, [isCustom]);

  // Manejar selección de tile
  const handleTileSelect = (value: string) => {
    if (value === "personalizado") {
      setSelectedTile("personalizado");
      setIsCustom(true);
      setCustomTipoValue("");
      form.setValue("tipo", "");
      form.clearErrors("tipo");
    } else {
      setSelectedTile(value);
      setIsCustom(false);
      setCustomTipoValue("");
      form.setValue("tipo", value, { shouldValidate: true });
    }
  };

  // Manejar cambio en input custom
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setCustomTipoValue(v);
    form.setValue("tipo", v.trim(), { shouldValidate: v.length > 0 });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter") return;
    const target = event.target as HTMLElement;
    if (target.tagName === "TEXTAREA") return;

    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit(onSubmit, onError)();
  };

  const onError = (errors: FieldErrors<DispositivoFormValues>) => {
    if (Object.keys(errors).length === 0) return;

    const firstError =
      errors.tipo?.message ||
      errors.marca?.message ||
      errors.modelo?.message ||
      errors.numeroSerie?.message ||
      "Revisá los campos del formulario.";

    toast({
      title: "Datos incompletos",
      description: String(firstError),
      variant: "destructive",
    });
  };

  const onSubmit = async (data: DispositivoFormValues) => {
    if (!user?.uid || !cliente.id) return;
    setIsLoading(true);

    try {
      const nuevoDispositivo = {
        ...data,
        id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };

      const dispositivosActualizados = [
        ...(cliente.dispositivos || []),
        nuevoDispositivo,
      ];

      const payload = {
        ...cliente,
        dispositivos: dispositivosActualizados,
        updatedAt: new Date().toISOString(),
      };

      await actualizarCliente(cliente.id, payload, user.uid);

      toast({
        title: "Dispositivo agregado",
        description: `${data.marca} ${data.modelo ?? ""} añadido a ${cliente.name}.`,
      });

      onSuccess(payload as Cliente, nuevoDispositivo);
      onClose();
    } catch (error) {
      console.error("Error agregando dispositivo:", error);
      toast({
        title: "No se pudo agregar",
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
        redondeadas y deslizamiento hacia arriba. Compatible con safe-area
        insets de iOS/Android.
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
        // ── Reset del transform/posición que Radix inyecta como estilos inline ──
        // Radix aplica top:50%, left:50%, translate(-50%,-50%) por defecto.
        // Al sobreescribir con style prop lo pisamos con máxima especificidad.
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
                Nuevo dispositivo
              </DialogTitle>
              <p className="text-[13px] text-white/40 mt-0.5 font-medium">
                {cliente.name}
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
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 space-y-6 pb-4">

              {/* ── Tipo de dispositivo ─────────────────────────────────── */}
              <FormField
                control={form.control}
                name="tipo"
                render={() => (
                  <FormItem>
                    <p className="text-[11px] font-semibold tracking-widest uppercase text-white/30 mb-3">
                      Tipo de equipo
                    </p>

                    {/* Grid de tiles táctiles */}
                    <div className="grid grid-cols-3 gap-2.5">
                      {TIPO_OPTIONS.map(({ value, label, icon: Icon }) => {
                        const isSelected = selectedTile === value;
                        const isPersonalized = value === "personalizado";

                        return (
                          <button
                            key={value}
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleTileSelect(value)}
                            className={[
                              // Base
                              "relative flex flex-col items-center justify-center",
                              "gap-2 py-3.5 px-2 rounded-2xl",
                              "border transition-colors duration-200",
                              "active:scale-[0.96] select-none",
                              // Especial para personalizado
                              isPersonalized && !isSelected
                                ? "border-dashed border-white/15 bg-white/[0.03]"
                                : "",
                              // Estado seleccionado
                              isSelected
                                ? "bg-blue-500/15 border-blue-400/40 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
                                : !isPersonalized
                                ? "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07] hover:border-white/15"
                                : "hover:bg-white/[0.06] hover:border-white/20",
                            ].join(" ")}
                          >
                            {/* Ícono */}
                            <div
                              className={[
                                "w-9 h-9 rounded-xl flex items-center justify-center",
                                "transition-colors duration-200",
                                isSelected
                                  ? "bg-blue-400/20"
                                  : isPersonalized
                                  ? "bg-white/[0.06]"
                                  : "bg-white/[0.06]",
                              ].join(" ")}
                            >
                              <Icon
                                className={[
                                  "w-[18px] h-[18px] transition-colors duration-200",
                                  isSelected
                                    ? "text-blue-400"
                                    : isPersonalized
                                    ? "text-white/40"
                                    : "text-white/50",
                                ].join(" ")}
                              />
                            </div>

                            {/* Label */}
                            <span
                              className={[
                                "text-[11px] font-medium leading-tight text-center",
                                "transition-colors duration-200",
                                isSelected
                                  ? "text-blue-300"
                                  : "text-white/50",
                              ].join(" ")}
                            >
                              {label}
                            </span>

                            {/* Punto indicador seleccionado */}
                            {isSelected && (
                              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Input deslizante para tipo personalizado */}
                    <div
                      className={[
                        "overflow-hidden transition-[max-height,opacity] duration-200 ease-out",
                        isCustom ? "max-h-24 opacity-100 mt-3" : "max-h-0 opacity-0",
                      ].join(" ")}
                    >
                      <div className="relative">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400/60 pointer-events-none" />
                        <input
                          ref={customInputRef}
                          type="text"
                          value={customTipoValue}
                          onChange={handleCustomChange}
                          disabled={isLoading}
                          placeholder="Ej: Router, UPS, Switch…"
                          maxLength={40}
                          className={[
                            "w-full h-11 pl-10 pr-4 rounded-xl",
                            "bg-blue-500/[0.07] border border-blue-500/25",
                            "text-white text-[14px] placeholder:text-white/20",
                            "focus:outline-none focus:border-blue-400/50 focus:bg-blue-500/10",
                            "transition-colors duration-200",
                            "disabled:opacity-40",
                          ].join(" ")}
                        />
                        {customTipoValue.length > 0 && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-mono">
                            {40 - customTipoValue.length}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/25 mt-1.5 ml-1">
                        Define el tipo exacto de equipo
                      </p>
                    </div>

                    <FormMessage className="text-[12px] text-red-400 mt-2" />
                  </FormItem>
                )}
              />

              {/* ── Marca y Modelo ──────────────────────────────────────── */}
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-white/30 mb-3">
                  Identificación
                </p>
                <div className="space-y-3">
                  {/* Marca */}
                  <FormField
                    control={form.control}
                    name="marca"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Cpu className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                            <Input
                              {...field}
                              placeholder="Marca  —  HP, Canon, Epson…"
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

                  {/* Modelo */}
                  <FormField
                    control={form.control}
                    name="modelo"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                            <Input
                              {...field}
                              placeholder="Modelo  —  LaserJet 1020, opcional"
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

              {/* ── Número de serie ─────────────────────────────────────── */}
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-white/30 mb-3">
                  Número de serie
                  <span className="normal-case font-normal tracking-normal text-white/20 ml-2">
                    — opcional
                  </span>
                </p>
                <FormField
                  control={form.control}
                  name="numeroSerie"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                          <Input
                            {...field}
                            placeholder="ABC-123-XYZ"
                            disabled={isLoading}
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            className={[
                              "h-12 pl-10 pr-4 rounded-xl font-mono",
                              "bg-white/[0.04] border-white/[0.08]",
                              "text-white placeholder:text-white/20 text-[14px] tracking-wider",
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

              {/* Agregar */}
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
                    Agregar dispositivo
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