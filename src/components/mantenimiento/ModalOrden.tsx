"use client";

import { OrdenMantenimiento } from "@/types/orden";
import {
  X, Wrench, AlertCircle,
  Share2, CheckCircle, Download,
  User, Cpu, FileText, ShieldCheck, MapPin, PenLine,
  Eye, Printer, ChevronLeft, Loader2, Phone, Mail,
  Hash, Calendar, Tag
} from "lucide-react";
import { useCallback, memo, useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { deobfuscateSignature } from "@/lib/signature-utils";

// ============================================================================
// TIPOS
// ============================================================================

type ModalView = "detail" | "preview";

// ============================================================================
// HELPERS
// ============================================================================

const isCapacitor = (): boolean =>
  typeof window !== "undefined" && !!(window as any).Capacitor;

const isNativePlatform = (): boolean => {
  const cap = (window as any).Capacitor;
  return isCapacitor() && cap?.getPlatform?.() !== "web";
};

const formatFecha = (fecha: any): string => {
  if (!fecha) return "N/A";
  try {
    const date = fecha?.seconds
      ? new Date(fecha.seconds * 1000)
      : new Date(fecha);
    return isNaN(date.getTime())
      ? "Fecha inválida"
      : date.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  } catch {
    return "Fecha inválida";
  }
};

// ============================================================================
// PRIMITIVAS UI MEMOIZADAS
// ============================================================================

const Chip = memo(({
  children,
  color = "gray",
  icon: Icon,
}: {
  children: React.ReactNode;
  color?: "gray" | "blue" | "amber" | "emerald" | "purple" | "red";
  icon?: React.ElementType;
}) => {
  const colors = {
    gray:    "bg-gray-800/50 text-gray-400 border-gray-700/50",
    blue:    "bg-blue-500/20 text-blue-300 border-blue-500/30",
    amber:   "bg-amber-500/20 text-amber-300 border-amber-500/30",
    emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    purple:  "bg-purple-500/20 text-purple-300 border-purple-500/30",
    red:     "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border", 
      colors[color]
    )}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
});
Chip.displayName = "Chip";

const DataRow = memo(({
  label,
  value,
  icon: Icon,
  mono,
  accent,
}: {
  label: string;
  value?: string | null;
  icon?: React.ElementType;
  mono?: boolean;
  accent?: "blue" | "amber" | "emerald" | "purple";
}) => {
  if (!value) return null;
  const accentColors = {
    blue:    "text-blue-400",
    amber:   "text-amber-400",
    emerald: "text-emerald-400",
    purple:  "text-purple-400",
  };
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-white/5 last:border-0">
      <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium shrink-0">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </span>
      <span className={cn(
        "text-sm text-right leading-tight max-w-[60%]",
        mono ? "font-mono" : "font-semibold",
        accent ? accentColors[accent] : "text-gray-200"
      )}>
        {value}
      </span>
    </div>
  );
});
DataRow.displayName = "DataRow";

const Card = memo(({
  title,
  icon: Icon,
  iconColor = "text-gray-400",
  children,
  className,
}: {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden", className)}>
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
      <Icon className={cn("w-4 h-4 shrink-0", iconColor)} />
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</span>
    </div>
    <div className="px-4 py-4">
      {children}
    </div>
  </div>
));
Card.displayName = "Card";

const ActionBtn = memo(({
  onClick,
  children,
  variant = "primary",
  icon: Icon,
  className,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  icon?: React.ElementType;
  className?: string;
  disabled?: boolean;
}) => {
  const variants = {
    primary:   "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg shadow-blue-900/20",
    secondary: "bg-white/5 hover:bg-white/10 active:bg-white/15 text-gray-200 border border-white/10",
    ghost:     "bg-transparent hover:bg-white/5 active:bg-white/10 text-gray-400 border border-white/5",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wide",
        "transition-all duration-150 active:scale-[0.97] select-none touch-manipulation",
        "disabled:opacity-40 disabled:pointer-events-none min-h-[48px]",
        variants[variant],
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
});
ActionBtn.displayName = "ActionBtn";

// ============================================================================
// VISTA PREVIA PDF MEMOIZADA
// ============================================================================

type PreviewState =
  | { status: "loading"; attempt: number }
  | { status: "ready-html"; html: string }
  | { status: "ready-web"; url: string }
  | { status: "ready-native" }
  | { status: "error"; message: string; raw: unknown };

const PDFPreviewView = memo(({
  orden,
  onBack,
  onPrint,
  onShare,
  onDownload,
  generarPDFBlob,
  generarHTML,
}: {
  orden: OrdenMantenimiento;
  onBack: () => void;
  onPrint: (orden: OrdenMantenimiento) => void;
  onShare?: (orden: OrdenMantenimiento) => void;
  onDownload?: (orden: OrdenMantenimiento) => void;
  generarPDFBlob: (orden: OrdenMantenimiento) => Promise<Blob>;
  generarHTML?: (orden: OrdenMantenimiento) => Promise<string>;
}) => {
  const [state, setState] = useState<PreviewState>({ status: "loading", attempt: 1 });
  const [attemptCount, setAttemptCount] = useState(1);
  const urlRef = useRef<string | null>(null);
  const native = isNativePlatform();

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const generate = async () => {
      setState({ status: "loading", attempt: attemptCount });
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
      try {
        if (generarHTML) {
          const html = await generarHTML(orden);
          if (cancelled) return;
          setState({ status: "ready-html", html });
        } else {
          const blob = await generarPDFBlob(orden);
          if (cancelled) return;
          if (native) {
            setState({ status: "ready-native" });
          } else {
            const url = URL.createObjectURL(blob);
            urlRef.current = url;
            setState({ status: "ready-web", url });
          }
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message
          : typeof err === "string" ? err
          : "Error desconocido al renderizar el PDF.";
        setState({ status: "error", message, raw: err });
      }
    };
    generate();
    return () => { cancelled = true; };
  }, [orden, generarPDFBlob, generarHTML, native, attemptCount]);

  const handleShare = useCallback(() => onShare?.(orden), [onShare, orden]);
  const handlePrint = useCallback(() => onPrint(orden), [onPrint, orden]);
  const handleDownload = useCallback(() => onDownload?.(orden), [onDownload, orden]);
  const handleRetry = useCallback(() => setAttemptCount(prev => prev + 1), []);

  const footerActions = (
    <footer className="px-5 pb-8 pt-3 bg-gray-950/80 border-t border-white/5 flex-shrink-0">
      <div className={cn(
        "grid gap-2",
        onShare && onDownload ? "grid-cols-3" : onShare || onDownload ? "grid-cols-2" : "grid-cols-1"
      )}>
        {onShare && (
          <ActionBtn variant="primary" icon={Share2} onClick={handleShare}>Compartir</ActionBtn>
        )}
        <ActionBtn variant="secondary" icon={Printer} onClick={handlePrint}
          className={cn(!onShare && !onDownload && "col-span-full")}>
          Imprimir
        </ActionBtn>
        {onDownload && (
          <ActionBtn variant="ghost" icon={Download} onClick={handleDownload}>Guardar</ActionBtn>
        )}
      </div>
    </footer>
  );

  return (
    <div className="flex flex-col h-full transform-gpu">
      {/* Header */}
      <header className="px-5 py-3 border-b border-white/5 flex items-center gap-3 flex-shrink-0 bg-gray-950/80">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 flex items-center justify-center transition-all touch-manipulation shadow-sm"
          aria-label="Volver"
        >
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white uppercase tracking-wider leading-none">Vista Previa</p>
          <p className="text-xs font-medium text-gray-500 mt-1">Orden #{orden.idPersonalizado || orden.id?.slice(-6)}</p>
        </div>
        {state.status === "loading" && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
        {(state.status === "ready-web" || state.status === "ready-html" || state.status === "ready-native") && (
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-tight flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Listo
          </span>
        )}
      </header>

      {/* Área central */}
      <div className="flex-1 overflow-hidden bg-gray-950 relative">
        {state.status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-400/80" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-950 flex items-center justify-center shadow-lg">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
            </div>
            <div className="text-center px-6">
              <p className="text-base font-bold text-gray-100">Generando documento…</p>
              <p className="text-xs font-medium text-gray-500 mt-1.5 uppercase tracking-widest">
                {attemptCount > 1 ? `Reintentando (${attemptCount})…` : "Un momento por favor"}
              </p>
            </div>
          </div>
        )}

        {state.status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-9 h-9 text-red-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-100">Error al generar PDF</p>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-[280px] mx-auto">
                {state.message}
              </p>
            </div>
            <div className="flex flex-col w-full max-w-xs gap-3">
              <ActionBtn variant="secondary" icon={Loader2} onClick={handleRetry}>
                Reintentar
              </ActionBtn>
              <div className="grid grid-cols-2 gap-2">
                {onShare && <ActionBtn variant="primary" icon={Share2} onClick={handleShare} className="text-[10px] px-2">Compartir</ActionBtn>}
                {onDownload && <ActionBtn variant="ghost" icon={Download} onClick={handleDownload} className="text-[10px] px-2 text-gray-300">Descargar</ActionBtn>}
              </div>
            </div>
          </div>
        )}

        {state.status === "ready-native" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 overflow-y-auto py-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
              <CheckCircle className="w-9 h-9 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white tracking-tight">PDF Generado</p>
              <p className="text-sm text-gray-400 mt-2 max-w-[260px] mx-auto leading-relaxed">
                El documento está listo. Utiliza las opciones de la barra inferior para proceder.
              </p>
            </div>
            <div className="w-full max-w-xs space-y-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Resumen del servicio</p>
              <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-sm">
                {[
                  { label: "Orden", value: "#" + (orden.idPersonalizado || orden.id?.slice(-6)) },
                  { label: "Cliente", value: orden.cliente?.name || "—" },
                  { label: "Equipo", value: [orden.dispositivo?.marca, orden.dispositivo?.modelo].filter(Boolean).join(" ") || "—" },
                  { label: "Tipo", value: orden.tipoMantenimiento || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center px-4 py-3">
                    <span className="text-xs font-medium text-gray-500">{label}</span>
                    <span className="text-xs font-bold text-gray-200">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {state.status === "ready-web" && (
          <iframe src={state.url} title="Vista previa del PDF" className="w-full h-full border-0" />
        )}
        {state.status === "ready-html" && (
          <iframe srcDoc={state.html} title="Vista previa de la orden" className="w-full h-full border-0 bg-white" sandbox="allow-same-origin" />
        )}
      </div>

      {state.status !== "error" && footerActions}
    </div>
  );
});
PDFPreviewView.displayName = "PDFPreviewView";

// ============================================================================
// VISTA DETALLE MEMOIZADA
// ============================================================================

const StatusBadge = memo(({ estado }: { estado?: string }) => {
  if (!estado) return null;
  const map: Record<string, { color: "blue" | "emerald" | "amber" | "gray"; label: string }> = {
    pendiente:   { color: "amber",   label: "Pendiente" },
    en_proceso:  { color: "blue",    label: "En proceso" },
    completado:  { color: "emerald", label: "Completado" },
    entregado:   { color: "emerald", label: "Entregado" },
  };
  const s = map[estado.toLowerCase()] ?? { color: "gray", label: estado };
  return <Chip color={s.color}>{s.label}</Chip>;
});
StatusBadge.displayName = "StatusBadge";

const DetailView = memo(({
  orden,
  onClose,
  onPreview,
  onShare,
  onDownload,
}: {
  orden: OrdenMantenimiento;
  onClose: () => void;
  onPreview: () => void;
  onShare?: (orden: OrdenMantenimiento) => void;
  onDownload?: (orden: OrdenMantenimiento) => void;
}) => {
  const deviceName = useMemo(() => 
    [orden.dispositivo?.marca, orden.dispositivo?.modelo].filter(Boolean).join(" "),
  [orden.dispositivo]);

  const handleShare = useCallback(() => onShare?.(orden), [onShare, orden]);
  const handleDownload = useCallback(() => onDownload?.(orden), [onDownload, orden]);

  return (
    <div className="flex flex-col h-full min-h-0 transform-gpu">

      {/* ── Header con jerarquía clara ── */}
      <header className="px-5 pt-5 pb-4 flex items-start justify-between gap-4 flex-shrink-0 bg-gray-950/50">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h2 className="text-xl font-black text-white leading-none tracking-tight uppercase">
              {orden.tipoMantenimiento}
            </h2>
            <StatusBadge estado={(orden as any).estado} />
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-gray-500 uppercase tracking-widest">
            <span>Orden #{orden.idPersonalizado || orden.id?.slice(-6)}</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatFecha(orden.fechaCreacion)}
              {orden.horaCreacion && ` · ${orden.horaCreacion}`}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 flex items-center justify-center transition-all touch-manipulation shrink-0 shadow-sm"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </header>

      <div className="h-px bg-white/5 mx-5 mb-4" />

      <main 
        className="flex-1 overflow-y-auto overscroll-contain px-5 space-y-4 custom-scrollbar"
        style={{ willChange: 'scroll-position' }}
      >
        {/* CLIENTE */}
        <Card title="Cliente" icon={User} iconColor="text-blue-400">
          <div className="flex items-start justify-between gap-4 mb-4">
            <p className="text-base font-bold text-white leading-tight">{orden.cliente.name}</p>
            {orden.cliente.phone && (
              <a
                href={`tel:${orden.cliente.phone}`}
                className="flex items-center gap-1.5 text-xs text-blue-400 font-bold uppercase tracking-wider bg-blue-500/10 px-3 py-1.5 rounded-full shrink-0 border border-blue-500/20 active:scale-95 transition-transform"
              >
                <Phone className="w-3.5 h-3.5" />
                Llamar
              </a>
            )}
          </div>
          <div className="space-y-0">
            {orden.cliente.email && (
              <DataRow label="Email" value={orden.cliente.email} icon={Mail} />
            )}
            {orden.cliente.address && (
              <DataRow label="Dirección" value={orden.cliente.address} icon={MapPin} />
            )}
          </div>
        </Card>

        {/* DISPOSITIVO */}
        <Card title="Dispositivo" icon={Cpu} iconColor="text-emerald-400">
          <p className="text-base font-bold text-white mb-4 capitalize">{deviceName || "Equipo no especificado"}</p>
          <div className="space-y-0">
            <DataRow label="Tipo de equipo" value={orden.dispositivo?.tipo} icon={Tag} />
            <DataRow label="Número de serie" value={orden.dispositivo?.numeroSerie || "N/A"} icon={Hash} mono accent="amber" />
          </div>

          {orden.contador && (
            <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl bg-purple-500/5 border border-purple-500/10 shadow-inner">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Contador ({orden.contador.tipo})</span>
              <span className="text-sm font-black text-purple-300">
                {orden.contador.valor} <span className="text-[10px] font-bold opacity-70 uppercase">{orden.contador.unidadPersonalizada || ''}</span>
              </span>
            </div>
          )}
          {orden.contadorMaquina !== undefined && (
            <div className="mt-2 flex items-center justify-between px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/10 shadow-inner">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Contador de Máquina</span>
              <span className="text-sm font-black text-blue-300">
                {orden.contadorMaquina.toLocaleString()}
              </span>
            </div>
          )}
        </Card>

          {orden.tipoMantenimiento === 'garantia' && (
          <Card title="Garantía Aplicada" icon={ShieldCheck} iconColor="text-amber-400">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5">Orden de Referencia</p>
                <p className="text-lg font-black text-amber-200 font-mono tracking-tighter bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20 inline-block">
                  #{orden.garantiaReferenciaId || "No especificada"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5">Motivo del Reclamo</p>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 shadow-inner">
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    {orden.garantiaMotivo || "Sin detalles específicos del reclamo."}
                  </p>
                </div>
              </div>
            </div>
          </Card>
          )}

          {/* SERVICIO */}
        <Card title="Servicio realizado" icon={Wrench} iconColor="text-orange-400">
          {orden.tareasRealizadas && orden.tareasRealizadas.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Tareas ejecutadas</p>
              <div className="flex flex-wrap gap-2">
                {orden.tareasRealizadas.map((t, i) => (
                  <Chip key={i} color="gray">{t}</Chip>
                ))}
              </div>
            </div>
          )}

          {orden.piezasUsadas && orden.piezasUsadas.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Repuestos instalados</p>
              <div className="space-y-2">
                {orden.piezasUsadas.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-gray-300 font-medium">{p.pieza}</span>
                    <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">×{p.cantidad}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!orden.tareasRealizadas || orden.tareasRealizadas.length === 0) &&
           (!orden.piezasUsadas || orden.piezasUsadas.length === 0) && (
            <div className="py-4 text-center rounded-xl bg-white/[0.02] border border-dashed border-white/5">
              <p className="text-xs text-gray-500 font-medium italic">Sin detalle de tareas registrado.</p>
            </div>
          )}
        </Card>

        {(orden.observacionesIniciales || orden.pruebasRealizadas || orden.posiblesCausas || orden.diagnosticoFinal) && (
          <Card title="Diagnóstico técnico" icon={AlertCircle} iconColor="text-yellow-400">
            <div className="space-y-4">
              {[
                { label: "Estado inicial",     value: orden.observacionesIniciales },
                { label: "Pruebas realizadas", value: orden.pruebasRealizadas },
                { label: "Posibles causas",    value: orden.posiblesCausas },
              ].filter(i => i.value).map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5">{label}</p>
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">{value}</p>
                </div>
              ))}
              {orden.diagnosticoFinal && (
                <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl px-4 py-3.5 shadow-inner">
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1.5">Diagnóstico final</p>
                  <p className="text-sm text-blue-200 leading-relaxed font-bold">{orden.diagnosticoFinal}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* GARANTÍA */}
        {(orden.garantiaHabilitada !== false && (orden.garantiaTiempoHasta || orden.garantiaDescripcion)) || (orden.garantiaHabilitada === false) ? (
          <Card title="Garantía" icon={ShieldCheck} iconColor="text-amber-400">
            {orden.garantiaHabilitada === false ? (
              <div className="flex items-center justify-between py-1">
                <p className="text-sm font-bold text-gray-500 italic">No aplica garantía</p>
                <Chip color="gray" icon={X}>Desactivada</Chip>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Vencimiento</p>
                    <p className="text-base font-black text-white">{formatFecha(orden.garantiaTiempoHasta)}</p>
                  </div>
                  {(() => {
                    if (!orden.garantiaTiempoHasta) return null;
                    const now = new Date();
                    const vencimiento = orden.garantiaTiempoHasta?.seconds 
                      ? new Date(orden.garantiaTiempoHasta.seconds * 1000) 
                      : new Date(orden.garantiaTiempoHasta);
                    
                    if (isNaN(vencimiento.getTime())) return null;
                    
                    return vencimiento > now 
                      ? <Chip color="emerald" icon={ShieldCheck}>Vigente</Chip>
                      : <Chip color="red" icon={AlertCircle}>Expirada</Chip>;
                  })()}
                </div>
                {orden.garantiaDescripcion && (
                  <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                      {orden.garantiaDescripcion}
                    </p>
                  </div>
                )}
              </>
            )}
          </Card>
        ) : null}

        {(orden.instalacionRecomendaciones || (orden.instalacionConfiguracionTipos?.length ?? 0) > 0) && (
          <Card title="Instalación" icon={CheckCircle} iconColor="text-teal-400">
            {orden.instalacionRecomendaciones && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Recomendaciones de uso</p>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">
                  {orden.instalacionRecomendacionesDetalle || "Se brindaron recomendaciones técnicas al cliente."}
                </p>
              </div>
            )}
            {orden.instalacionConfiguracionTipos && orden.instalacionConfiguracionTipos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {orden.instalacionConfiguracionTipos.map((tipo, i) => (
                  <Chip key={i} color="gray">{tipo}</Chip>
                ))}
              </div>
            )}
          </Card>
        )}

        {orden.firmaCliente && (
          <Card title="Conformidad del cliente" icon={PenLine} iconColor="text-indigo-400">
            <div className="flex items-center gap-6">
              <div className="bg-white rounded-2xl p-3 flex-shrink-0 shadow-xl border border-white/10">
                <img
                  src={deobfuscateSignature(orden.firmaCliente) || ''}
                  alt="Firma"
                  width={112}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="w-28 h-16 object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Firmante</p>
                <p className="text-base font-black text-white leading-tight truncate">
                  {orden.nombreFirmante || orden.cliente.name}
                </p>
                <div className="flex items-center gap-1.5 mt-2.5 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-tight">Validada</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="h-4" />
      </main>

      {/* ── Footer con acciones prioritarias ── */}
      <footer className="px-5 pt-3 pb-8 bg-gray-950/80 border-t border-white/5 flex-shrink-0">
        <div className="grid grid-cols-2 gap-3">
          {onShare && (
            <ActionBtn variant="primary" icon={Share2} onClick={handleShare}>
              Compartir
            </ActionBtn>
          )}
          <ActionBtn variant="secondary" icon={Eye} onClick={onPreview} className={cn(!onShare && "col-span-full")}>
            Ver PDF
          </ActionBtn>
          {onDownload && (
            <ActionBtn variant="ghost" icon={Download} onClick={handleDownload} className="col-span-full mt-1 border-dashed text-gray-400 hover:text-gray-200">
              Descargar Documento
            </ActionBtn>
          )}
        </div>
      </footer>
    </div>
  );
});
DetailView.displayName = "DetailView";

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ModalOrden = ({
  orden,
  onClose,
  onPrint,
  onDownload,
  onShare,
  generarPDFBlob,
  generarHTML,
}: {
  orden: OrdenMantenimiento | null;
  onClose: () => void;
  onPrint: (orden: OrdenMantenimiento) => void;
  onDownload?: (orden: OrdenMantenimiento) => void;
  onShare?: (orden: OrdenMantenimiento) => void;
  generarPDFBlob: (orden: OrdenMantenimiento) => Promise<Blob>;
  generarHTML?: (orden: OrdenMantenimiento) => Promise<string>;
}) => {
  const [view, setView] = useState<ModalView>("detail");
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  useEffect(() => { setView("detail"); }, [orden?.id]);

  useAndroidBack(!!orden && mounted, () => {
    if (view === "preview") setView("detail");
    else onClose();
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view === "preview") setView("detail");
        else onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, view]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); },
    [onClose]
  );

  const handlePreview = useCallback(() => setView("preview"), []);
  const handleDetail = useCallback(() => setView("detail"), []);

  if (!orden || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-[110] sm:p-6 pointer-events-auto"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)'}}
        className={cn(
          "bg-gray-950 w-full flex flex-col overflow-hidden relative",
          "shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border-t border-x border-white/10 sm:border",
          "rounded-t-[2.5rem] sm:rounded-[2.5rem]",
          "h-[92dvh] max-h-[92dvh]",
          "sm:h-auto sm:max-w-md sm:max-h-[85vh]",
          "lg:max-w-lg",
          "transform-gpu slide-in-from-bottom-8 sm:zoom-in-95 duration-300 ease-out"
        )}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-orden-title"
      >
        <h2 id="modal-orden-title" className="sr-only">
          Orden de mantenimiento {orden.tipoMantenimiento} #{orden.idPersonalizado || orden.id?.slice(-6)}
        </h2>

        {/* Drag Handle - Visible on all devices when in sheet mode */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-white/10" />
        </div>

        {view === "detail" && (
          <DetailView
            orden={orden}
            onClose={onClose}
            onPreview={handlePreview}
            onShare={onShare}
            onDownload={onDownload}
          />
        )}
        {view === "preview" && (
          <PDFPreviewView
            orden={orden}
            onBack={handleDetail}
            onPrint={onPrint}
            onShare={onShare}
            onDownload={onDownload}
            generarPDFBlob={generarPDFBlob}
            generarHTML={generarHTML}
          />
        )}
      </div>
    </div>,
    document.body
  );
};

export default memo(ModalOrden);
