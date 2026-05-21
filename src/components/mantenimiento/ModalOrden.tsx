"use client";

import { OrdenMantenimiento } from "@/types/orden";
import {
  X, Clock, Wrench, AlertCircle,
  Share2, CheckCircle, Download,
  User, Cpu, FileText, ShieldCheck, MapPin, PenLine,
  Eye, Printer, ChevronLeft, Loader2, Phone, Mail,
  Hash, Calendar, Tag
} from "lucide-react";
import { useCallback, memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useAndroidBack } from "@/hooks/useAndroidBack";

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
// PRIMITIVAS UI
// ============================================================================

/** Pill de estado/tag pequeño */
const Chip = ({
  children,
  color = "gray",
  icon: Icon,
}: {
  children: React.ReactNode;
  color?: "gray" | "blue" | "amber" | "emerald" | "purple" | "red";
  icon?: React.ElementType;
}) => {
  const colors = {
    gray:    "bg-gray-800 text-gray-400",
    blue:    "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    amber:   "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    purple:  "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    red:     "bg-red-500/10 text-red-400 border border-red-500/20",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold", colors[color])}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

/** Fila de dato: etiqueta + valor */
const DataRow = ({
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
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-600 last:border-0">
      <span className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </span>
      <span className={cn(
        "text-xs text-right leading-relaxed max-w-[55%]",
        mono ? "font-mono" : "font-medium",
        accent ? accentColors[accent] : "text-gray-200"
      )}>
        {value}
      </span>
    </div>
  );
};

/** Tarjeta de sección con título */
const Card = ({
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
  <div className={cn("rounded-xl border border-gray-600 bg-gray-900/60 overflow-hidden", className)}>
    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-600">
      <Icon className={cn("w-3.5 h-3.5 shrink-0", iconColor)} />
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
    </div>
    <div className="px-4 py-3">
      {children}
    </div>
  </div>
);

/** Botón de acción principal */
const ActionBtn = ({
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
    primary:   "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg shadow-blue-900/25",
    secondary: "bg-gray-800 hover:bg-gray-700 active:bg-gray-900 text-gray-200 border border-gray-600",
    ghost:     "bg-transparent hover:bg-gray-800 active:bg-gray-900 text-gray-400 border border-gray-600",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold",
        "transition-all duration-150 active:scale-[0.97] select-none touch-manipulation",
        "disabled:opacity-40 disabled:pointer-events-none min-h-[44px]",
        variants[variant],
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
};

// ============================================================================
// VISTA PREVIA PDF
// ============================================================================

type PreviewState =
  | { status: "loading"; attempt: number }
  | { status: "ready-html"; html: string }
  | { status: "ready-web"; url: string }
  | { status: "ready-native" }
  | { status: "error"; message: string; raw: unknown };

const PDFPreviewView = ({
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
      setState({ status: "loading", attempt: 1 });
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
  }, [orden, generarPDFBlob, generarHTML, native]);

  const footerActions = (
    <footer className="px-3 pb-3 pt-2 bg-gray-950 border-t border-gray-600 flex-shrink-0 safe-bottom">
      <div className={cn(
        "grid gap-2",
        onShare && onDownload ? "grid-cols-3" : onShare || onDownload ? "grid-cols-2" : "grid-cols-1"
      )}>
        {onShare && (
          <ActionBtn variant="primary" icon={Share2} onClick={() => onShare(orden)}>Compartir</ActionBtn>
        )}
        <ActionBtn variant="secondary" icon={Printer} onClick={() => onPrint(orden)}
          className={cn(!onShare && !onDownload && "col-span-full")}>
          Imprimir
        </ActionBtn>
        {onDownload && (
          <ActionBtn variant="ghost" icon={Download} onClick={() => onDownload(orden)}>Guardar</ActionBtn>
        )}
      </div>
    </footer>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-3 py-2.5 border-b border-gray-600 flex items-center gap-2.5 flex-shrink-0 bg-gray-950">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 active:bg-gray-900 flex items-center justify-center transition-colors touch-manipulation"
          aria-label="Volver"
        >
          <ChevronLeft className="w-4 h-4 text-gray-300" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-none">Vista Previa</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Orden #{orden.idPersonalizado || orden.id?.slice(-6)}</p>
        </div>
        {state.status === "loading" && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
        {(state.status === "ready-web" || state.status === "ready-html" || state.status === "ready-native") && (
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Listo
          </span>
        )}
      </header>

      {/* Área central */}
      <div className="flex-1 overflow-hidden bg-gray-950 relative">
        {state.status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
                <FileText className="w-7 h-7 text-blue-400/60" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-950 flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-200">Generando documento…</p>
              <p className="text-xs text-gray-600 mt-1">
                {state.attempt > 1 ? "Reintentando…" : "Un momento"}
              </p>
            </div>
          </div>
        )}

        {state.status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/15 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-200">No se pudo generar la vista previa</p>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed max-w-[240px] mx-auto">
                {state.message.length < 120 ? state.message : "Usa los botones para compartir o guardar directamente."}
              </p>
            </div>
            <div className="flex flex-col w-full max-w-xs gap-2">
              {onShare && <ActionBtn variant="primary" icon={Share2} onClick={() => onShare(orden)}>Compartir PDF</ActionBtn>}
              {onDownload && <ActionBtn variant="secondary" icon={Download} onClick={() => onDownload(orden)}>Descargar PDF</ActionBtn>}
            </div>
          </div>
        )}

        {state.status === "ready-native" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 overflow-y-auto py-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-white">PDF generado</p>
              <p className="text-xs text-gray-400 mt-1.5 max-w-[240px] mx-auto">
                Usa los botones para compartir, descargar o imprimir.
              </p>
            </div>
            <div className="w-full max-w-xs divide-y divide-gray-600 rounded-xl border border-gray-600 bg-gray-900/60 overflow-hidden">
              {[
                { label: "Orden", value: "#" + (orden.idPersonalizado || orden.id?.slice(-6)) },
                { label: "Cliente", value: orden.cliente?.name || "—" },
                { label: "Equipo", value: [orden.dispositivo?.marca, orden.dispositivo?.modelo].filter(Boolean).join(" ") || "—" },
                { label: "Tipo", value: orden.tipoMantenimiento || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-xs text-gray-200 font-medium">{value}</span>
                </div>
              ))}
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
};

// ============================================================================
// VISTA DETALLE — REDISEÑADA
// ============================================================================

const StatusBadge = ({ estado }: { estado?: string }) => {
  if (!estado) return null;
  const map: Record<string, { color: "blue" | "emerald" | "amber" | "gray"; label: string }> = {
    pendiente:   { color: "amber",   label: "Pendiente" },
    en_proceso:  { color: "blue",    label: "En proceso" },
    completado:  { color: "emerald", label: "Completado" },
    entregado:   { color: "emerald", label: "Entregado" },
  };
  const s = map[estado.toLowerCase()] ?? { color: "gray", label: estado };
  return <Chip color={s.color}>{s.label}</Chip>;
};

const DetailView = ({
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
  const deviceName = [orden.dispositivo?.marca, orden.dispositivo?.modelo].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Header compacto ── */}
      <header className="px-4 pt-4 pb-3 flex items-start justify-between gap-3 flex-shrink-0">
        <div className="min-w-0 flex-1">
          {/* Número de orden + estado en la misma línea */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              Orden #{orden.idPersonalizado || orden.id?.slice(-6)}
            </span>
            <StatusBadge estado={(orden as any).estado} />
          </div>
          {/* Tipo de mantenimiento como título */}
          <h2 className="text-base font-bold text-white leading-tight">
            {orden.tipoMantenimiento}
          </h2>
          {/* Fecha en la línea del título */}
          <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatFecha(orden.fechaCreacion)}
            {orden.horaCreacion && ` · ${orden.horaCreacion}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-gray-800/80 hover:bg-gray-700 flex items-center justify-center transition-colors touch-manipulation shrink-0"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </header>

      {/* ── Separador ── */}
      <div className="h-px bg-white/5 mx-4 mb-4" />

      {/* ── Contenido scrolleable ── */}
      <main className="flex-1 overflow-y-auto overscroll-contain px-4 space-y-3">

        {/* CLIENTE */}
        <Card title="Cliente" icon={User} iconColor="text-blue-400">
          {/* Nombre grande + teléfono */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-sm font-bold text-white leading-tight">{orden.cliente.name}</p>
            {orden.cliente.phone && (
              <a
                href={`tel:${orden.cliente.phone}`}
                className="flex items-center gap-1 text-[11px] text-blue-400 font-medium bg-blue-500/10 px-2 py-1 rounded-full shrink-0"
              >
                <Phone className="w-3 h-3" />
                {orden.cliente.phone}
              </a>
            )}
          </div>
          <div className="space-y-0">
            <DataRow label="Cédula / ID" value={orden.cliente.cedula} icon={Hash} mono />
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
          {/* Marca + modelo como nombre del equipo */}
          <p className="text-sm font-bold text-white mb-3 capitalize">{deviceName || "—"}</p>
          <div className="space-y-0">
            <DataRow label="Tipo" value={orden.dispositivo?.tipo} icon={Tag} />
            <DataRow label="Número de serie" value={orden.dispositivo?.numeroSerie || "N/A"} icon={Hash} mono accent="amber" />
          </div>

          {/* Contador */}
          {(orden.contador || orden.contadorMaquina !== undefined) && (
            <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
              <span className="text-xs text-gray-500">Contador</span>
              <span className="text-xs font-semibold text-purple-300">
                {orden.contador
                  ? `${orden.contador.valor} ${orden.contador.unidadPersonalizada || orden.contador.tipo}`
                  : orden.contadorMaquina}
              </span>
            </div>
          )}
        </Card>

        {/* SERVICIO */}
        <Card title="Servicio realizado" icon={Wrench} iconColor="text-orange-400">
          {/* Tareas */}
          {orden.tareasRealizadas && orden.tareasRealizadas.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Tareas</p>
              <div className="flex flex-wrap gap-1.5">
                {orden.tareasRealizadas.map((t, i) => (
                  <Chip key={i} color="gray">{t}</Chip>
                ))}
              </div>
            </div>
          )}

          {/* Repuestos */}
          {orden.piezasUsadas && orden.piezasUsadas.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Repuestos</p>
              <div className="space-y-1">
                {orden.piezasUsadas.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-600 last:border-0">
                    <span className="text-xs text-gray-300">{p.pieza}</span>
                    <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">×{p.cantidad}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Si no hay nada */}
          {(!orden.tareasRealizadas || orden.tareasRealizadas.length === 0) &&
           (!orden.piezasUsadas || orden.piezasUsadas.length === 0) && (
            <p className="text-xs text-gray-600">Sin detalle de tareas registrado.</p>
          )}
        </Card>

        {/* DIAGNÓSTICO — solo si hay data */}
        {(orden.observacionesIniciales || orden.pruebasRealizadas || orden.posiblesCausas || orden.diagnosticoFinal) && (
          <Card title="Diagnóstico" icon={AlertCircle} iconColor="text-yellow-400">
            <div className="space-y-2.5">
              {[
                { label: "Estado inicial",     value: orden.observacionesIniciales },
                { label: "Pruebas realizadas", value: orden.pruebasRealizadas },
                { label: "Posibles causas",    value: orden.posiblesCausas },
              ].filter(i => i.value).map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{value}</p>
                </div>
              ))}
              {orden.diagnosticoFinal && (
                <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Diagnóstico final</p>
                  <p className="text-xs text-blue-200 leading-relaxed">{orden.diagnosticoFinal}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* GARANTÍA */}
        <Card title="Garantía" icon={ShieldCheck} iconColor="text-amber-400">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Vence</p>
              <p className="text-sm font-semibold text-white">{formatFecha(orden.garantiaTiempoHasta)}</p>
            </div>
            <Chip color="amber" icon={ShieldCheck}>Activa</Chip>
          </div>
          {orden.garantiaDescripcion && (
            <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
              {orden.garantiaDescripcion}
            </p>
          )}
        </Card>

        {/* INSTALACIÓN — solo si hay data */}
        {(orden.instalacionRecomendaciones || (orden.instalacionConfiguracionTipos?.length ?? 0) > 0) && (
          <Card title="Instalación" icon={CheckCircle} iconColor="text-teal-400">
            {orden.instalacionRecomendaciones && (
              <div className="mb-2.5">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Recomendaciones</p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {orden.instalacionRecomendacionesDetalle || "Se brindaron recomendaciones de uso al cliente."}
                </p>
              </div>
            )}
            {orden.instalacionConfiguracionTipos && orden.instalacionConfiguracionTipos.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {orden.instalacionConfiguracionTipos.map((tipo, i) => (
                  <Chip key={i} color="gray">{tipo}</Chip>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* FIRMA */}
        {orden.firmaCliente && (
          <Card title="Firma del cliente" icon={PenLine} iconColor="text-indigo-400">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-xl p-2 flex-shrink-0 shadow-sm">
                <img
                  src={orden.firmaCliente}
                  alt="Firma"
                  className="w-28 h-16 object-contain"
                  style={{ filter: "contrast(1.2)" }}
                />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">
                  {orden.nombreFirmante || orden.cliente.name}
                </p>
                <div className="flex items-center gap-1 mt-1.5 text-emerald-400">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">Validado digitalmente</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="h-2" />
      </main>

      {/* ── Footer de acciones ── */}
      <footer className="px-4 pt-2.5 pb-4 bg-gray-950 border-t border-white/5 flex-shrink-0 safe-bottom">
        <div className={cn("grid gap-2", onShare ? "grid-cols-2" : "grid-cols-1")}>
          {onShare && (
            <ActionBtn variant="primary" icon={Share2} onClick={() => onShare(orden)}>
              Compartir
            </ActionBtn>
          )}
          <ActionBtn variant="secondary" icon={Eye} onClick={onPreview}>
            Vista previa
          </ActionBtn>
        </div>
        {onDownload && (
          <ActionBtn variant="ghost" icon={Download} onClick={() => onDownload(orden)} className="w-full mt-2 text-xs">
            Descargar PDF
          </ActionBtn>
        )}
      </footer>
    </div>
  );
};

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

  if (!orden || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[100] sm:p-4 pointer-events-auto"
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className={cn(
          // Base
          "bg-gray-950 w-full flex flex-col overflow-hidden relative",
          // Bordes y sombra
          "shadow-2xl border-t border-x border-gray-600 sm:border",
          // Radios
          "rounded-t-2xl sm:rounded-2xl",
          // ─── Tamaños responsivos ───
          // Móvil: altura fija del sheet para que h-full funcione en el contenido
          "h-[85dvh] max-h-[85dvh]",
          // sm: ventana centrada, ancho acotado, altura automática con límite
          "sm:h-auto sm:max-w-md sm:max-h-[80vh]",
          // lg: un poco más ancha
          "lg:max-w-lg",
          // Animación
          "animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-250 ease-out"
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Orden de mantenimiento #${orden.idPersonalizado}`}
      >
        {/* Drag handle — solo móvil */}
        <div className="flex justify-center pt-2.5 pb-0 sm:hidden flex-shrink-0">
          <div className="w-8 h-1 rounded-full bg-gray-800" />
        </div>

        {view === "detail" && (
          <DetailView
            orden={orden}
            onClose={onClose}
            onPreview={() => setView("preview")}
            onShare={onShare}
            onDownload={onDownload}
          />
        )}
        {view === "preview" && (
          <PDFPreviewView
            orden={orden}
            onBack={() => setView("detail")}
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