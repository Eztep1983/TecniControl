"use client";

import { OrdenMantenimiento } from "@/types/orden";
import { 
  X, Clock, Printer, Wrench, AlertCircle, 
  Share2, CheckCircle, Download,
  User, Cpu, FileText, ShieldCheck, MapPin, PenLine
} from "lucide-react";
import { useCallback, useMemo, memo, useEffect, useRef, useState, useId } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useAndroidBack } from "@/hooks/useAndroidBack";

// ============================================================================
// COMPONENTES INTERNOS DE APOYO (UI)
// ============================================================================

const InfoSection = ({ title, icon: Icon, children, className }: any) => (
  <section className={cn("p-5 border-b border-gray-800/40 last:border-0", className)}>
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="w-4 h-4 text-blue-400" />}
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</h3>
    </div>
    {children}
  </section>
);

const Badge = ({ children, className }: any) => (
  <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold", className)}>
    {children}
  </span>
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
}: {
  orden: OrdenMantenimiento | null;
  onClose: () => void;
  onPrint: (orden: OrdenMantenimiento) => void;
  onDownload?: (orden: OrdenMantenimiento) => void;
  onShare?: (orden: OrdenMantenimiento) => void;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useAndroidBack(!!orden && mounted, onClose);

  // Escape key support
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const handlePrint = useCallback(() => orden && onPrint(orden), [onPrint, orden]);
  const handleDownload = useCallback(() => orden && onDownload?.(orden), [onDownload, orden]);
  const handleShare = useCallback(() => orden && onShare?.(orden), [onShare, orden]);

  if (!orden || !mounted) return null;

  const formatFecha = (fecha: any) => {
    if (!fecha) return "N/A";
    try {
      const date = fecha?.seconds ? new Date(fecha.seconds * 1000) : new Date(fecha);
      return isNaN(date.getTime()) ? "Fecha inválida" : date.toLocaleDateString("es-ES", {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch {
      return "Fecha inválida";
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-0 sm:p-4 transition-all duration-300 pointer-events-auto"
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className="bg-gray-900 w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl border-x sm:border border-gray-700/50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <header className="px-5 py-4 bg-gray-900/80 border-b border-gray-800 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">Orden #{orden.idPersonalizado || orden.id?.slice(-6)}</h2>
              <p className="text-[10px] text-gray-500 mt-1.5 font-medium uppercase tracking-wider">{orden.tipoMantenimiento}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-900">
          <div className="divide-y divide-gray-800/40">
            {/* Cliente */}
            <InfoSection title="Cliente" icon={User}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-white truncate">{orden.cliente.name}</p>
                  <p className="text-sm text-gray-400 mt-1">{orden.cliente.cedula}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-gray-300">{orden.cliente.phone}</p>
                  <p className="text-xs text-gray-500 mt-1">{orden.cliente.email}</p>
                </div>
              </div>
              {orden.cliente.address && (
                <div className="mt-4 flex items-start gap-2 text-gray-400">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <p className="text-xs italic">{orden.cliente.address}</p>
                </div>
              )}
            </InfoSection>

            {/* Dispositivo */}
            <InfoSection title="Dispositivo" icon={Cpu}>
              <div className="bg-gray-800/40 rounded-xl border border-gray-700/30 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="font-bold text-white text-base capitalize">{orden.dispositivo.marca} {orden.dispositivo.modelo}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 ml-11">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Tipo</p>
                    <p className="text-sm text-gray-200 capitalize">{orden.dispositivo.tipo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Serie</p>
                    <p className="text-sm font-mono text-amber-400/90">{orden.dispositivo.numeroSerie || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Contadores */}
              {(orden.contador || orden.contadorMaquina !== undefined) && (
                <div className="mt-4 bg-gray-800/40 rounded-xl border border-gray-700/30 p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Contador Registrado</p>
                    {orden.contador ? (
                      <p className="text-sm font-medium text-white">
                        {orden.contador.valor} <span className="text-gray-400 text-xs">({orden.contador.unidadPersonalizada || orden.contador.tipo})</span>
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-white">
                        {orden.contadorMaquina}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </InfoSection>

            {/* Detalles del Servicio */}
            <InfoSection title="Servicio Realizado" icon={Wrench}>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {formatFecha(orden.fechaCreacion)}
                  </Badge>
                  <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 lowercase">
                    {orden.horaCreacion}
                  </Badge>
                </div>
                
                {orden.tareasRealizadas && orden.tareasRealizadas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500">Tareas:</p>
                    <div className="flex flex-wrap gap-2">
                      {orden.tareasRealizadas.map((t, i) => (
                        <span key={i} className="text-xs px-3 py-1 rounded-lg bg-gray-800 text-gray-300 border border-gray-700/50">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {orden.piezasUsadas && orden.piezasUsadas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500">Repuestos:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {orden.piezasUsadas.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30 border border-gray-700/30">
                          <span className="text-xs text-gray-300">{p.pieza}</span>
                          <span className="text-xs font-bold text-blue-400">x{p.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </InfoSection>

            {/* Diagnóstico (si aplica) */}
            {(orden.observacionesIniciales || orden.pruebasRealizadas || orden.posiblesCausas || orden.diagnosticoFinal) && (
              <InfoSection title="Diagnóstico y Observaciones" icon={AlertCircle}>
                <div className="space-y-4">
                  {orden.observacionesIniciales && (
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Estado Inicial</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{orden.observacionesIniciales}</p>
                    </div>
                  )}
                  {orden.pruebasRealizadas && (
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Pruebas Realizadas</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{orden.pruebasRealizadas}</p>
                    </div>
                  )}
                  {orden.posiblesCausas && (
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Posibles Causas</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{orden.posiblesCausas}</p>
                    </div>
                  )}
                  {orden.diagnosticoFinal && (
                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                      <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">Diagnóstico Final</p>
                      <p className="text-sm text-blue-100 leading-relaxed font-medium">{orden.diagnosticoFinal}</p>
                    </div>
                  )}
                </div>
              </InfoSection>
            )}

            {/* Garantía */}
            <InfoSection title="Garantía" icon={ShieldCheck}>
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-sm font-bold text-amber-200">
                      Vence: {formatFecha(orden.garantiaTiempoHasta)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-amber-100/60 leading-relaxed italic">
                  {orden.garantiaDescripcion || "Términos estándar de garantía aplicados a este servicio."}
                </p>
              </div>
            </InfoSection>

            {/* Instalación (si aplica) */}
            {(orden.instalacionRecomendaciones || (orden.instalacionConfiguracionTipos && orden.instalacionConfiguracionTipos.length > 0)) && (
              <InfoSection title="Detalles de Instalación" icon={CheckCircle}>
                <div className="space-y-4">
                  {orden.instalacionRecomendaciones && (
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Recomendaciones Brindadas</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{orden.instalacionRecomendacionesDetalle || "Se brindaron recomendaciones de uso al cliente."}</p>
                    </div>
                  )}
                  {orden.instalacionConfiguracionTipos && orden.instalacionConfiguracionTipos.length > 0 && (
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Configuraciones Realizadas</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {orden.instalacionConfiguracionTipos.map((tipo, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-gray-800/80 text-gray-300 border border-gray-700/50 capitalize">
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
                <div className="flex flex-col items-center">
                  <div className="bg-white rounded-xl p-2 w-full max-w-sm mb-4">
                    <img 
                      src={orden.firmaCliente} 
                      alt="Firma" 
                      className="w-full h-32 object-contain mx-auto"
                      style={{ filter: "contrast(1.2)" }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white uppercase tracking-tight">{orden.nombreFirmante || orden.cliente.name}</p>
                    <div className="flex items-center justify-center gap-1.5 mt-1 text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Validado Digitalmente</span>
                    </div>
                  </div>
                </div>
              </InfoSection>
            )}
          </div>
        </main>

        {/* Footer Actions */}
        <footer className="p-5 bg-gray-900 border-t border-gray-800 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm transition-all shadow-lg shadow-blue-900/20"
            >
              <Share2 className="w-4 h-4" />
              Compartir
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white font-bold text-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>
          {onDownload && (
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 text-gray-300 font-bold text-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar PDF
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
};

export default memo(ModalOrden);