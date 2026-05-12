"use client";

import { OrdenMantenimiento } from "@/types/orden";
import {
  X, Clock, Wrench, AlertCircle,
  Share2, CheckCircle, Download,
  User, Cpu, FileText, ShieldCheck, MapPin, PenLine,
  Eye, Printer, ChevronLeft, Loader2
} from "lucide-react";
import { useCallback, useMemo, memo, useEffect, useRef, useState } from "react";
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
    const date =
      fecha?.seconds
        ? new Date(fecha.seconds * 1000)
        : new Date(fecha);
    return isNaN(date.getTime())
      ? "Fecha inválida"
      : date.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
  } catch {
    return "Fecha inválida";
  }
};

// ============================================================================
// SUB-COMPONENTES UI
// ============================================================================

const InfoSection = ({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: any;
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={cn("px-5 py-5 border-b border-white/5 last:border-0", className)}>
    <div className="flex items-center gap-2.5 mb-4">
      {Icon && (
        <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-blue-400" />
        </div>
      )}
      <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.12em]">
        {title}
      </h3>
    </div>
    {children}
  </section>
);

const Badge = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide",
      className
    )}
  >
    {children}
  </span>
);

// Botón táctil optimizado para móvil (mínimo 48px de touch target)
const TouchButton = ({
  onClick,
  children,
  className,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "min-h-[52px] flex items-center justify-center gap-2 rounded-2xl font-bold text-sm transition-all duration-150",
      "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
      "select-none touch-manipulation",
      className
    )}
  >
    {children}
  </button>
);

// ============================================================================
// VISTA PREVIA PDF
// ============================================================================

/**
 * Estados de generación del PDF.
 * "ready-native" = blob generado en plataforma nativa (no se puede mostrar en iframe).
 * "ready-web"    = blob generado en web, se muestra en iframe.
 * "error"        = falló la generación.
 * "loading"      = en progreso.
 */
type PreviewState =
  | { status: "loading"; attempt: number }
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
}: {
  orden: OrdenMantenimiento;
  onBack: () => void;
  onPrint: (orden: OrdenMantenimiento) => void;
  onShare?: (orden: OrdenMantenimiento) => void;
  onDownload?: (orden: OrdenMantenimiento) => void;
  generarPDFBlob: (orden: OrdenMantenimiento) => Promise<Blob>;
}) => {
  const [state, setState] = useState<PreviewState>({ status: "loading", attempt: 1 });
  const urlRef = useRef<string | null>(null);
  const native = isNativePlatform();

  // Limpia el blob URL al desmontar
  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  // Genera el PDF. En nativo no necesitamos el blob URL (no se puede mostrar en iframe),
  // pero sí generamos el blob para validar que el proceso completo funciona.
  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      setState({ status: "loading", attempt: 1 });

      // Limpiar URL anterior si existía
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }

      try {
        const blob = await generarPDFBlob(orden);
        if (cancelled) return;

        if (native) {
          // En nativo no usamos blob URL — el iframe no puede abrirlos en WebView.
          // Solo validamos que se generó correctamente.
          setState({ status: "ready-native" });
        } else {
          const url = URL.createObjectURL(blob);
          urlRef.current = url;
          setState({ status: "ready-web", url });
        }
      } catch (err: unknown) {
        if (cancelled) return;
        console.error("[PDFPreview] Error generando PDF:", err);
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : "Error desconocido al renderizar el PDF.";
        setState({ status: "error", message, raw: err });
      }
    };

    generate();
    return () => { cancelled = true; };
  }, [orden, generarPDFBlob, native]);

  // ── Footer de acciones (compartido entre estados) ──────────────────────────
  const footerActions = (
    <footer className="px-4 pt-3 pb-4 bg-gray-950 border-t border-white/5 flex-shrink-0 safe-bottom">
      <div
        className={cn(
          "grid gap-2.5",
          // Si hay 3 acciones → 3 columnas; si hay 2 → 2 columnas
          onShare && onDownload
            ? "grid-cols-3"
            : onShare || onDownload
            ? "grid-cols-2"
            : "grid-cols-1"
        )}
      >
        {onShare && (
          <TouchButton
            onClick={() => onShare(orden)}
            className="bg-blue-600 active:bg-blue-700 text-white shadow-lg shadow-blue-900/30 flex-col gap-1 py-3"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-[10px] font-bold">Compartir</span>
          </TouchButton>
        )}
        <TouchButton
          onClick={() => onPrint(orden)}
          className={cn(
            "bg-gray-800 active:bg-gray-700 text-white flex-col gap-1 py-3",
            !onShare && !onDownload && "col-span-full"
          )}
        >
          <Printer className="w-4 h-4" />
          <span className="text-[10px] font-bold">Imprimir</span>
        </TouchButton>
        {onDownload && (
          <TouchButton
            onClick={() => onDownload(orden)}
            className="bg-gray-800/60 border border-white/5 active:bg-gray-800 text-gray-300 flex-col gap-1 py-3"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] font-bold">Guardar</span>
          </TouchButton>
        )}
      </div>
    </footer>
  );

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-4 py-3 bg-gray-950/90 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-gray-800/80 active:bg-gray-700 flex items-center justify-center transition-colors touch-manipulation flex-shrink-0"
          aria-label="Volver al detalle"
        >
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Vista Previa</p>
          <p className="text-[10px] text-gray-500 font-medium">
            Orden #{orden.idPersonalizado || orden.id?.slice(-6)}
          </p>
        </div>
        {/* Indicador de estado en el header */}
        {state.status === "loading" && (
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
        )}
        {(state.status === "ready-web" || state.status === "ready-native") && (
          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
        )}
      </header>

      {/* Área central */}
      <div className="flex-1 overflow-hidden bg-gray-950 relative">

        {/* ── Cargando ── */}
        {state.status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-400/60" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-950 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
            </div>
            <div className="text-center px-8">
              <p className="text-sm font-semibold text-gray-200">Generando documento…</p>
              <p className="text-xs text-gray-600 mt-1.5">
                {state.attempt > 1
                  ? "Reintentando sin logo externo…"
                  : "Procesando imágenes y contenido"}
              </p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {state.status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/15 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-200">No se pudo generar la vista previa</p>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-[260px] mx-auto">
                {state.message.length < 120
                  ? state.message
                  : "Ocurrió un error al renderizar el PDF. Puedes usar Compartir o Guardar directamente."}
              </p>
            </div>
            {/* Acciones alternativas en modo error */}
            <div className="flex flex-col w-full max-w-xs gap-2">
              {onShare && (
                <TouchButton
                  onClick={() => onShare(orden)}
                  className="bg-blue-600 active:bg-blue-700 text-white px-4 w-full"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir PDF
                </TouchButton>
              )}
              {onDownload && (
                <TouchButton
                  onClick={() => onDownload(orden)}
                  className="bg-gray-800 active:bg-gray-700 text-gray-200 px-4 w-full"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </TouchButton>
              )}
            </div>
          </div>
        )}

        {/* ── Listo en nativo: iframe no disponible, mostramos resumen ── */}
        {state.status === "ready-native" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 overflow-y-auto py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-white">PDF generado</p>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed max-w-[260px] mx-auto">
                El documento está listo. Usa los botones de abajo para compartirlo,
                descargarlo o enviarlo a imprimir.
              </p>
            </div>
            {/* Tarjeta resumen de la orden */}
            <div className="w-full max-w-xs bg-gray-800/50 rounded-2xl border border-white/5 divide-y divide-white/5">
              {[
                {
                  sub: "Identificador",
                  label: "Orden #" + (orden.idPersonalizado || orden.id?.slice(-6)),
                },
                { sub: "Cliente", label: orden.cliente?.name || "—" },
                {
                  sub: "Equipo",
                  label: [orden.dispositivo?.marca, orden.dispositivo?.modelo]
                    .filter(Boolean)
                    .join(" ") || "—",
                },
                { sub: "Tipo", label: orden.tipoMantenimiento || "—" },
              ].map(({ label, sub }) => (
                <div key={sub} className="flex justify-between items-center px-4 py-3">
                  <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider">
                    {sub}
                  </span>
                  <span className="text-xs text-gray-200 font-medium text-right max-w-[55%] truncate capitalize">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Listo en web: iframe con el PDF ── */}
        {state.status === "ready-web" && (
          <iframe
            src={state.url}
            title="Vista previa del PDF"
            className="w-full h-full border-0 block"
          />
        )}
      </div>

      {/* Footer: no mostrar en estado error (ya tiene sus propios botones) */}
      {state.status !== "error" && footerActions}
    </div>
  );
};

// ============================================================================
// VISTA DETALLE (contenido del modal normal)
// ============================================================================

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
}) => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <header className="px-4 py-3 bg-gray-950/90 border-b border-white/5 sticky top-0 z-10 flex items-center gap-3 flex-shrink-0 safe-top">
      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-bold text-white leading-tight truncate">
          Orden #{orden.idPersonalizado || orden.id?.slice(-6)}
        </h2>
        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
          {orden.tipoMantenimiento}
        </p>
      </div>
      <button
        onClick={onClose}
        className="w-10 h-10 rounded-xl bg-gray-800/80 active:bg-gray-700 flex items-center justify-center transition-colors touch-manipulation flex-shrink-0"
        aria-label="Cerrar"
      >
        <X className="w-5 h-5 text-gray-400" />
      </button>
    </header>

    {/* Scrollable content */}
    <main className="flex-1 overflow-y-auto overscroll-contain bg-gray-950">
      {/* Cliente */}
      <InfoSection title="Cliente" icon={User}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-lg font-bold text-white leading-tight truncate">
              {orden.cliente.name}
            </p>
            <p className="text-sm text-gray-500 mt-1 font-mono">{orden.cliente.cedula}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg text-gray-300 font-medium">{orden.cliente.phone}</p>
            {orden.cliente.email && (
              <p className="text-sm text-gray-500 mt-0.5 truncate max-w-[140px]">
                {orden.cliente.email}
              </p>
            )}
          </div>
        </div>
        {orden.cliente.address && (
          <div className="flex items-start gap-2 text-gray-500 bg-gray-800/30 rounded-xl px-3 py-2.5">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-600" />
            <p className="text-xs leading-relaxed">{orden.cliente.address}</p>
          </div>
        )}
      </InfoSection>

      {/* Dispositivo */}
      <InfoSection title="Dispositivo" icon={Cpu}>
        <div className="bg-gray-800/30 rounded-2xl border border-white/5 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <p className="font-bold text-white text-lg capitalize leading-tight">
              {orden.dispositivo.marca} {orden.dispositivo.modelo}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Tipo", value: orden.dispositivo.tipo, mono: false },
              {
                label: "Número de Serie",
                value: orden.dispositivo.numeroSerie || "N/A",
                mono: true,
                accent: true,
              },
            ].map(({ label, value, mono, accent }) => (
              <div key={label} className="bg-gray-900/50 rounded-xl px-3 py-2.5">
                <p className="text-[9x] text-gray-600 text-xs font-black uppercase tracking-widest mb-1">
                  {label}
                </p>
                <p
                  className={cn(
                    "text-lg font-semibold capitalize",
                    mono && "font-mono text-xs",
                    accent ? "text-amber-400/90" : "text-gray-200"
                  )}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {(orden.contador || orden.contadorMaquina !== undefined) && (
          <div className="mt-3 flex items-center gap-3 bg-purple-500/5 border border-purple-500/10 rounded-2xl px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-0.5">
                Contador Registrado
              </p>
              {orden.contador ? (
                <p className="text-sm font-semibold text-white">
                  {orden.contador.valor}{" "}
                  <span className="text-gray-500 text-xs font-normal">
                    ({orden.contador.unidadPersonalizada || orden.contador.tipo})
                  </span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-white">{orden.contadorMaquina}</p>
              )}
            </div>
          </div>
        )}
      </InfoSection>

      {/* Servicio */}
      <InfoSection title="Servicio Realizado" icon={Wrench}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge className="bg-blue-500/10 text-blue-400 text-sm border border-blue-500/15">
            <Clock className="w-3 h-3 mr-1.5" />
            {formatFecha(orden.fechaCreacion)}
          </Badge>
          {orden.horaCreacion && (
            <Badge className="bg-gray-800 text-gray-400 text-sm border border-white/5">
              {orden.horaCreacion}
            </Badge>
          )}
        </div>

        {orden.tareasRealizadas && orden.tareasRealizadas.length > 0 && (
          <div className="mb-4">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2">
              Tareas
            </p>
            <div className="flex flex-wrap gap-2">
              {orden.tareasRealizadas.map((t, i) => (
                <span
                  key={i}
                  className="text-sm px-3 py-1.5 rounded-xl bg-gray-800/60 text-gray-300 border border-white/5"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {orden.piezasUsadas && orden.piezasUsadas.length > 0 && (
          <div>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2">
              Repuestos
            </p>
            <div className="space-y-1.5">
              {orden.piezasUsadas.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-800/40 border border-white/5"
                >
                  <span className="text-xs text-gray-300">{p.pieza}</span>
                  <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                    ×{p.cantidad}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </InfoSection>

      {/* Diagnóstico */}
      {(orden.observacionesIniciales ||
        orden.pruebasRealizadas ||
        orden.posiblesCausas ||
        orden.diagnosticoFinal) && (
        <InfoSection title="Diagnóstico y Observaciones" icon={AlertCircle}>
          <div className="space-y-3">
            {[
              { label: "Estado Inicial", value: orden.observacionesIniciales },
              { label: "Pruebas Realizadas", value: orden.pruebasRealizadas },
              { label: "Posibles Causas", value: orden.posiblesCausas },
            ]
              .filter((i) => i.value)
              .map(({ label, value }) => (
                <div key={label} className="bg-gray-800/30 rounded-xl px-3 py-3">
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">
                    {label}
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed">{value}</p>
                </div>
              ))}
            {orden.diagnosticoFinal && (
              <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-3 py-3">
                <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest mb-1.5">
                  Diagnóstico Final
                </p>
                <p className="text-sm text-blue-100 leading-relaxed font-medium">
                  {orden.diagnosticoFinal}
                </p>
              </div>
            )}
          </div>
        </InfoSection>
      )}

      {/* Garantía */}
      <InfoSection title="Garantía" icon={ShieldCheck}>
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-sm font-bold text-amber-200">
              Vence: {formatFecha(orden.garantiaTiempoHasta)}
            </p>
          </div>
          <p className="text-xs text-amber-100/50 leading-relaxed">
            {orden.garantiaDescripcion ||
              "Términos estándar de garantía aplicados a este servicio."}
          </p>
        </div>
      </InfoSection>

      {/* Instalación */}
      {(orden.instalacionRecomendaciones ||
        (orden.instalacionConfiguracionTipos &&
          orden.instalacionConfiguracionTipos.length > 0)) && (
        <InfoSection title="Detalles de Instalación" icon={CheckCircle}>
          <div className="space-y-3">
            {orden.instalacionRecomendaciones && (
              <div className="bg-gray-800/30 rounded-xl px-3 py-3">
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">
                  Recomendaciones
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {orden.instalacionRecomendacionesDetalle ||
                    "Se brindaron recomendaciones de uso al cliente."}
                </p>
              </div>
            )}
            {orden.instalacionConfiguracionTipos &&
              orden.instalacionConfiguracionTipos.length > 0 && (
                <div>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2">
                    Configuraciones
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {orden.instalacionConfiguracionTipos.map((tipo, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1.5 rounded-xl bg-gray-800/60 text-gray-300 border border-white/5 capitalize"
                      >
                        {tipo}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </InfoSection>
      )}

      {/* Firma */}
      {orden.firmaCliente && (
        <InfoSection title="Firma y Conformidad" icon={PenLine}>
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white rounded-2xl p-3 w-full max-w-[280px] shadow-lg shadow-black/20">
              <img
                src={orden.firmaCliente}
                alt="Firma del cliente"
                className="w-full h-28 object-contain"
                style={{ filter: "contrast(1.2)" }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white uppercase tracking-tight">
                {orden.nombreFirmante || orden.cliente.name}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-1.5 text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Validado Digitalmente
                </span>
              </div>
            </div>
          </div>
        </InfoSection>
      )}

      {/* Espaciado inferior para no tapar el footer */}
      <div className="h-2" />
    </main>

    {/* Footer */}
    <footer className="px-4 pt-3 pb-4 bg-gray-950 border-t border-white/5 flex-shrink-0 safe-bottom">
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        {onShare && (
          <TouchButton
            onClick={() => onShare(orden)}
            className="bg-blue-600 active:bg-blue-700 text-white shadow-lg shadow-blue-900/25 px-4"
          >
            <Share2 className="w-4 h-4" />
            Compartir
          </TouchButton>
        )}
        <TouchButton
          onClick={onPreview}
          className={cn(
            "bg-gray-800 active:bg-gray-700 text-white px-4",
            !onShare && "col-span-2"
          )}
        >
          <Eye className="w-4 h-4" />
          Vista Previa
        </TouchButton>
      </div>
      {onDownload && (
        <TouchButton
          onClick={() => onDownload(orden)}
          className="w-full bg-gray-800/40 border border-white/6 active:bg-gray-800 text-gray-400 text-xs min-h-[44px]"
        >
          <Download className="w-3.5 h-3.5" />
          Descargar PDF
        </TouchButton>
      )}
    </footer>
  </div>
);

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
}: {
  orden: OrdenMantenimiento | null;
  onClose: () => void;
  onPrint: (orden: OrdenMantenimiento) => void;
  onDownload?: (orden: OrdenMantenimiento) => void;
  onShare?: (orden: OrdenMantenimiento) => void;
  /**
   * Función que genera el Blob del PDF. Se obtiene de usePrintService:
   *   const { generarPDFBlob } = usePrintService({ negocio })
   */
  generarPDFBlob: (orden: OrdenMantenimiento) => Promise<Blob>;
}) => {
  const [view, setView] = useState<ModalView>("detail");
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Resetear a vista detalle cuando cambia la orden
  useEffect(() => {
    setView("detail");
  }, [orden?.id]);

  // Cierre con botón físico de Android
  useAndroidBack(!!orden && mounted, () => {
    if (view === "preview") {
      setView("detail");
    } else {
      onClose();
    }
  });

  // Escape en web
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view === "preview") {
          setView("detail");
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, view]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const handlePreview = useCallback(() => setView("preview"), []);
  const handleBack = useCallback(() => setView("detail"), []);

  if (!orden || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-[100] sm:p-4 pointer-events-auto"
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className={cn(
          // Móvil: sheet que ocupa toda la pantalla
          "bg-gray-950 w-full flex flex-col overflow-hidden",
          // Bordes redondeados arriba en móvil (sheet style), full rounded en desktop
          "rounded-t-3xl sm:rounded-2xl",
          // Altura: pantalla completa en móvil, acotada en desktop
          "h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-xl",
          // Sombra y borde
          "shadow-2xl border-t border-x border-white/5 sm:border",
          // Animación: sube desde abajo en móvil, zoom en desktop
          "animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300 ease-out"
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Orden de mantenimiento #${orden.idPersonalizado}`}
      >
        {/* Indicador de arrastre (drag handle) — solo en móvil */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-700" />
        </div>

        {/* Vistas */}
        {view === "detail" ? (
          <DetailView
            orden={orden}
            onClose={onClose}
            onPreview={handlePreview}
            onShare={onShare}
            onDownload={onDownload}
          />
        ) : (
          <PDFPreviewView
            orden={orden}
            onBack={handleBack}
            onPrint={onPrint}
            onShare={onShare}
            onDownload={onDownload}
            generarPDFBlob={generarPDFBlob}
          />
        )}
      </div>
    </div>,
    document.body
  );
};

export default memo(ModalOrden);