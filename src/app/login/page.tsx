//app/login/page.tsx

"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/basic/button"
import { Alert, AlertDescription } from "@/components/ui/basic/alert"
import {
  Loader2,
  Shield,
  AlertCircle,
  Lock,
  CheckCircle2,
  RefreshCw,
  PenTool,
  FileText,
  Download,
  UserPlus,
  Search,
  Wrench,
  WifiOff,
  ChevronRight,
  PhoneCall,
  Check,
  Eye,
  Share2,
  CloudOff,
  Smartphone,
  Laptop,
  Cpu
} from "lucide-react"
import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import logo from "@/public/logo.png"
import { motion, AnimatePresence } from "framer-motion"

// ─── Onboarding Slide Mockups ───────────────────────────────────────────────

function OrderMockup() {
  return (
    <div className="w-full h-full flex flex-col justify-between text-left">
      {/* Accent bar */}
      <div className="h-[4px] w-full bg-green-500 flex-shrink-0" />

      {/* Body container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        {/* Row 1: client name · status dot · tipo pill */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-[14px] font-semibold text-white leading-snug flex-1 min-w-0 truncate">
            Restaurante El Sol
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="inline-flex px-2.5 py-[3px] text-[9.5px] font-medium rounded-full bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20 uppercase tracking-wide">
              preventivo
            </span>
          </div>
        </div>

        {/* Row 2: ID · fecha */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium tracking-wide mb-2.5">
          <span>OS-1428</span>
          <span>·</span>
          <span>14 Jul 2026</span>
        </div>

        {/* Row 3: device pill · phone */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 bg-white/[0.05] border border-white/[0.07] rounded-full px-3 py-[3px]">
            <Laptop className="w-3.5 h-3.5 text-slate-550" />
            Samsung WindFree 12K
          </span>
          <span className="text-[11px] text-slate-400 font-medium tracking-wide">
            +57 312 456 7890
          </span>
        </div>

        {/* Row 4: resumen */}
        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 border-t border-slate-800/50 pt-2.5">
          Limpieza de serpentina y filtros, medición de carga de refrigerante R410A y pruebas de drenaje.
        </p>
      </div>

      {/* Footer: primary view action + secondary actions */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-800/40 bg-slate-900/40 flex-shrink-0">
        <div className="flex flex-1 items-center justify-center gap-1.5 bg-white/[0.08] text-slate-200 rounded-lg py-2 text-[11px] font-bold">
          <Eye className="w-3.5 h-3.5" />
          Ver orden
        </div>
        <div className="flex items-center justify-center w-[36px] h-[36px] rounded-lg bg-white/[0.05] border border-white/[0.07] text-slate-500">
          <Download className="w-4 h-4" />
        </div>
        <div className="flex items-center justify-center w-[36px] h-[36px] rounded-lg bg-white/[0.05] border border-white/[0.07] text-slate-500">
          <Share2 className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}

function PdfMockup() {
  return (
    <div className="w-full h-full bg-white text-slate-800 p-2.5 rounded-xl flex flex-col justify-between text-[7px] leading-tight select-none border border-slate-200/60 shadow-inner text-left">
      {/* Header based on PrintService */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-1.5 mb-1 flex-shrink-0">
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[8px] font-black">
            TC
          </div>
          <div>
            <h4 className="text-[8px] font-bold text-slate-900">TecniControl Service</h4>
            <p className="text-[5.5px] text-slate-500">NIT: 900.123.456-1 · Tel: +57 312 456</p>
          </div>
        </div>
        <div className="text-right">
          <h5 className="text-[7.5px] font-black text-blue-650">ORDEN DE SERVICIO</h5>
          <p className="text-[6.5px] font-bold text-slate-900"># OS-1428</p>
          <span className="inline-block px-1 py-[1px] text-[5.5px] font-bold rounded bg-green-100 text-green-800 uppercase scale-90 origin-right">
            preventivo
          </span>
        </div>
      </div>

      {/* Info Group Columns (flex-info in PrintService) */}
      <div className="grid grid-cols-2 gap-2 mb-1 flex-shrink-0">
        {/* Cliente Box */}
        <div className="border border-slate-200 rounded p-1 bg-slate-50/50">
          <div className="text-[6px] font-bold text-slate-900 border-l-2 border-blue-500 pl-1 mb-0.5 uppercase tracking-wide">
            Cliente
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between"><span className="text-slate-400">Nombre:</span><span className="font-semibold text-slate-800">Restaurante El Sol</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Teléfono:</span><span className="text-slate-700">+57 312 456</span></div>
          </div>
        </div>

        {/* Equipo Box */}
        <div className="border border-slate-200 rounded p-1 bg-slate-50/50">
          <div className="text-[6px] font-bold text-slate-900 border-l-2 border-emerald-500 pl-1 mb-0.5 uppercase tracking-wide">
            Equipo
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between"><span className="text-slate-400">Tipo:</span><span className="font-semibold text-slate-800">Aire Acondicionado</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Serial:</span><span className="text-slate-700">SAMSUNG-9824X</span></div>
          </div>
        </div>
      </div>

      {/* Service Details (Diagnostic section) */}
      <div className="border border-slate-200 rounded p-1 bg-slate-50/50 mb-1 flex-1 flex flex-col justify-between min-h-0">
        <div className="text-[6px] font-bold text-slate-900 border-l-2 border-amber-500 pl-1 mb-0.5 uppercase tracking-wide flex-shrink-0">
          Detalle del Servicio
        </div>
        <p className="text-[5.8px] text-slate-600 leading-normal overflow-hidden line-clamp-3">
          Mantenimiento preventivo completo realizado de forma exitosa. Se realiza lavado de serpentín, limpieza de filtros HEPA, y verificación de presión de refrigerante dentro de rangos óptimos.
        </p>
      </div>

      {/* Signatures Area based on PrintService */}
      <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-1 flex-shrink-0">
        {/* Technician Signature */}
        <div className="text-center">
          <div className="h-5 flex items-center justify-center mb-0.5">
            <svg className="w-12 h-4 text-slate-700" viewBox="0 0 100 50">
              <path d="M 10,25 Q 30,10 50,30 T 90,20" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="border-t border-slate-400 w-16 mx-auto mb-0.5" />
          <div className="text-[5.5px] font-bold text-slate-900">Carlos Técnico</div>
          <div className="text-[4.5px] text-slate-400 uppercase font-semibold">Técnico Autorizado</div>
        </div>

        {/* Customer Signature Box (Empty / Awaiting sign in Slide 2) */}
        <div className="text-center">
          <div className="h-5 flex items-center justify-center mb-0.5">
            <span className="text-[5.5px] text-slate-350 italic">Pendiente firma</span>
          </div>
          <div className="border-t border-slate-400 w-16 mx-auto mb-0.5" />
          <div className="text-[5.5px] font-bold text-slate-900">Juan Carlos Gómez</div>
          <div className="text-[4.5px] text-slate-400 uppercase font-semibold">Cliente Receptor</div>
        </div>
      </div>
    </div>
  )
}

function FirmaDocumentoMockup() {
  return (
    <div className="w-full h-full bg-white text-slate-800 p-2.5 rounded-xl flex flex-col justify-between text-[7px] leading-tight select-none border border-slate-200/60 shadow-inner text-left">
      {/* Header based on PrintService */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-1.5 mb-1 flex-shrink-0">
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[8px] font-black">
            TC
          </div>
          <div>
            <h4 className="text-[8px] font-bold text-slate-900">TecniControl Service</h4>
            <p className="text-[5.5px] text-slate-500">NIT: 900.123.456-1 · Tel: +57 312 456</p>
          </div>
        </div>
        <div className="text-right">
          <h5 className="text-[7.5px] font-black text-blue-650">ORDEN DE SERVICIO</h5>
          <p className="text-[6.5px] font-bold text-slate-900"># OS-1428</p>
          <span className="inline-block px-1 py-[1px] text-[5.5px] font-bold rounded bg-green-100 text-green-800 uppercase scale-90 origin-right">
            preventivo
          </span>
        </div>
      </div>

      {/* Info Group Columns (flex-info in PrintService) */}
      <div className="grid grid-cols-2 gap-2 mb-1 flex-shrink-0">
        {/* Cliente Box */}
        <div className="border border-slate-200 rounded p-1 bg-slate-50/50">
          <div className="text-[6px] font-bold text-slate-900 border-l-2 border-blue-500 pl-1 mb-0.5 uppercase tracking-wide">
            Cliente
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between"><span className="text-slate-400">Nombre:</span><span className="font-semibold text-slate-800">Restaurante El Sol</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Teléfono:</span><span className="text-slate-700">+57 312 456</span></div>
          </div>
        </div>

        {/* Equipo Box */}
        <div className="border border-slate-200 rounded p-1 bg-slate-50/50">
          <div className="text-[6px] font-bold text-slate-900 border-l-2 border-emerald-500 pl-1 mb-0.5 uppercase tracking-wide">
            Equipo
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between"><span className="text-slate-400">Tipo:</span><span className="font-semibold text-slate-800">Aire Acondicionado</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Serial:</span><span className="text-slate-700">SAMSUNG-9824X</span></div>
          </div>
        </div>
      </div>

      {/* Service Details (Diagnostic section) */}
      <div className="border border-slate-200 rounded p-1 bg-slate-50/50 mb-1 flex-1 flex flex-col justify-between min-h-0">
        <div className="text-[6px] font-bold text-slate-900 border-l-2 border-amber-500 pl-1 mb-0.5 uppercase tracking-wide flex-shrink-0">
          Detalle del Servicio
        </div>
        <p className="text-[5.8px] text-slate-600 leading-normal overflow-hidden line-clamp-3">
          Mantenimiento preventivo completo realizado de forma exitosa. Se realiza lavado de serpentín, limpieza de filtros HEPA, y verificación de presión de refrigerante dentro de rangos óptimos.
        </p>
      </div>

      {/* Signatures Area based on PrintService with ANIMATED Customer signature on top */}
      <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-1 flex-shrink-0">
        {/* Technician Signature */}
        <div className="text-center">
          <div className="h-5 flex items-center justify-center mb-0.5">
            <svg className="w-12 h-4 text-slate-600" viewBox="0 0 100 50">
              <path d="M 10,25 Q 30,10 50,30 T 90,20" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="border-t border-slate-400 w-16 mx-auto mb-0.5" />
          <div className="text-[5.5px] font-bold text-slate-900">Carlos Técnico</div>
          <div className="text-[4.5px] text-slate-400 uppercase font-semibold">Técnico Autorizado</div>
        </div>

        {/* Customer Signature Box (With animated drawing signature path and pen icon) */}
        <div className="text-center relative">
          <div className="h-5 flex items-center justify-center mb-0.5 relative overflow-hidden">
            
            {/* Animated Customer signature path drawing itself over the document line */}
            <svg className="w-12 h-4 text-blue-650 drop-shadow-sm" viewBox="0 0 100 50">
              <motion.path
                d="M 10,35 Q 25,5 35,30 T 60,15 T 80,35 T 95,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
              />
            </svg>

            {/* Stylus / Pen Icon Drawing the Signature */}
            <motion.div
              className="absolute text-slate-800 pointer-events-none"
              style={{ originX: 0, originY: 1 }}
              animate={{
                x: [2, 10, 16, 25, 34, 45, 55, 65, 75, 82],
                y: [12, 4, 13, 6, 10, 5, 13, 8, 13, 8],
                opacity: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
              }}
              transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
            >
              <PenTool className="w-2.5 h-2.5 -rotate-45" />
            </motion.div>

          </div>
          <div className="border-t border-slate-400 w-16 mx-auto mb-0.5" />
          <div className="text-[5.5px] font-bold text-slate-900">Juan Carlos Gómez</div>
          <div className="text-[4.5px] text-slate-400 uppercase font-semibold">Cliente Receptor</div>
        </div>
      </div>
    </div>
  )
}

function ContactsMockup() {
  return (
    <div className="w-full h-full flex flex-col justify-between text-left pt-2">
      {/* Dialog Header */}
      <div className="px-3 pb-2 border-b border-slate-800/80 flex-shrink-0">
        <h3 className="text-[12px] font-bold dark:text-white text-slate-200 flex items-center gap-1.5">
          <UserPlus className="w-3.5 h-3.5 text-blue-400" />
          Importar Contactos
        </h3>
        <p className="text-[8.5px] text-slate-505 mt-0.5 leading-tight">
          Selecciona contactos para agregarlos como clientes
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="p-2 space-y-1.5 dark:bg-slate-900 bg-slate-950/20 border-b border-slate-800/50 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input
            type="text"
            readOnly
            placeholder="Buscar contacto..."
            className="w-full pl-6 pr-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[8px] text-slate-400 focus:outline-none"
          />
        </div>
        
        {/* Select All Checkbox */}
        <div className="flex items-center justify-between px-0.5 text-[7.5px] text-slate-400 font-semibold select-none">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-slate-850 border border-slate-750 flex items-center justify-center">
              {/* unchecked */}
            </div>
            <span>Seleccionar todos (12)</span>
          </div>
          <span className="text-blue-400 font-bold">Limpiar (2)</span>
        </div>
      </div>

      {/* List items - displaying 4 contacts with no scrollbar clipping */}
      <div className="flex-1 space-y-1.5 py-1.5 overflow-y-auto min-h-0 max-h-[175px]">
        
        {/* Contact 1: Selected */}
        <div className="w-full p-1.5 rounded-lg border border-blue-500/30 bg-blue-500/5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-[9px] flex-shrink-0">
              AM
            </div>
            <div className="min-w-0">
              <h4 className="text-[9px] font-semibold text-white truncate leading-tight">
                Andrés Mendoza
              </h4>
              <p className="text-[7.5px] text-slate-400 mt-0.5 flex items-center gap-1 leading-none">
                <PhoneCall className="w-2.5 h-2.5 text-slate-505" />
                +57 301 543 9876
              </p>
            </div>
          </div>
          <div className="w-3.5 h-3.5 bg-blue-600 border border-blue-600 rounded flex items-center justify-center text-white flex-shrink-0">
            <Check className="w-2 h-2" />
          </div>
        </div>

        {/* Contact 2: Duplicate / Already Imported */}
        <div className="w-full p-1.5 rounded-lg border border-slate-800 bg-slate-900/20 opacity-50 flex items-center justify-between gap-2 select-none cursor-default">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-350 text-[9px] flex-shrink-0">
              MC
            </div>
            <div className="min-w-0">
              <h4 className="text-[9px] font-semibold text-slate-300 truncate leading-tight">
                Marcela Castro
              </h4>
              <p className="text-[7.5px] text-slate-500 mt-0.5 flex items-center gap-1 leading-none">
                <PhoneCall className="w-2.5 h-2.5 text-slate-650" />
                +57 312 456 7890
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[7px] px-1 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold select-none">
              Existente
            </span>
          </div>
        </div>

        {/* Contact 3: Unselected */}
        <div className="w-full p-1.5 rounded-lg border border-slate-800 bg-slate-800/25 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-lg bg-slate-850 border border-slate-750 flex items-center justify-center font-bold text-slate-300 text-[9px] flex-shrink-0">
              CR
            </div>
            <div className="min-w-0">
              <h4 className="text-[9px] font-semibold text-slate-305 truncate leading-tight">
                Carlos Rodríguez
              </h4>
              <p className="text-[7.5px] text-slate-400 mt-0.5 flex items-center gap-1 leading-none">
                <PhoneCall className="w-2.5 h-2.5 text-slate-500" />
                +57 310 234 5678
              </p>
            </div>
          </div>
          <div className="w-3.5 h-3.5 bg-slate-900 border border-slate-700 rounded flex-shrink-0" />
        </div>

        {/* Contact 4: Selected */}
        <div className="w-full p-1.5 rounded-lg border border-blue-500/30 bg-blue-500/5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-[9px] flex-shrink-0">
              LB
            </div>
            <div className="min-w-0">
              <h4 className="text-[9px] font-semibold text-white truncate leading-tight">
                Laura Benítez
              </h4>
              <p className="text-[7.5px] text-slate-400 mt-0.5 flex items-center gap-1 leading-none">
                <PhoneCall className="w-2.5 h-2.5 text-slate-505" />
                +57 318 765 4321
              </p>
            </div>
          </div>
          <div className="w-3.5 h-3.5 bg-blue-600 border border-blue-600 rounded flex items-center justify-center text-white flex-shrink-0">
            <Check className="w-2.5 h-2.5" />
          </div>
        </div>

      </div>

      {/* Footer Dialog Action */}
      <div className="p-2 border-t border-slate-800/40 flex justify-end flex-shrink-0">
        <button className="px-3.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[8px] font-bold shadow-md shadow-blue-500/10">
          Importar seleccionados (2)
        </button>
      </div>
    </div>
  )
}

function OfflineMockup() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setIsOnline((prev) => !prev)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full h-full flex flex-col justify-between text-left">
      {/* App Header Bar */}
      <div className="px-4 py-2.5 border-b border-slate-855 flex items-center justify-between flex-shrink-0">
        <span className="text-[12px] font-bold text-slate-350">Tablero Principal</span>
        <div className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-black">
          TC
        </div>
      </div>

      {/* OfflineSyncBanner Mockup */}
      <div className="px-4 pt-3 flex-shrink-0">
        <AnimatePresence mode="wait">
          {!isOnline ? (
            /* Banner: sin conexión + hay pendientes */
            <motion.div
              key="offline-banner"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-2.5 rounded-lg text-amber-400 text-[11px] font-semibold"
            >
              <CloudOff className="w-4 h-4 shrink-0" />
              <span>2 órdenes guardadas localmente. Se sincronizarán al recuperar conexión.</span>
            </motion.div>
          ) : (
            /* Banner: sincronización completada */
            <motion.div
              key="online-banner"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3.5 py-2.5 rounded-lg text-green-400 text-[11px] font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>2 órdenes sincronizadas correctamente</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main content Area with a simplified order row */}
      <div className="flex-1 px-4 py-3.5 flex flex-col justify-center">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/20 flex items-center justify-between gap-2">
          <div>
            <h4 className="text-[11px] font-semibold text-slate-350">Nevera Mabe 420L</h4>
            <p className="text-[9px] text-slate-500 mt-0.5 font-semibold">Cliente: Alejandro Díaz · OS-1429</p>
          </div>
          <span className="inline-flex px-2 py-[2px] text-[8px] font-medium rounded-full bg-orange-500/10 text-orange-400 ring-1 ring-inset ring-orange-500/20 uppercase tracking-wide">
            correctivo
          </span>
        </div>
      </div>

      {/* Footer notice */}
      <div className="text-[9px] text-slate-400 bg-blue-500/5 border border-blue-500/10 rounded p-2 text-center mt-0.5 mx-4 mb-3">
        La aplicación detecta el estado de red y sincroniza las órdenes en segundo plano.
      </div>
    </div>
  )
}

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="24px"
      height="24px"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.663,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  )
}

// ─── Slide Data ─────────────────────────────────────────────────────────────

const SLIDES = [
  {
    title: "Gestión de Órdenes de Servicio",
    description: "Administra órdenes de mantenimiento preventivo, correctivo o diagnósticos. Controla tareas, piezas y repuestos en un solo lugar.",
    icon: Wrench,
    mockup: <OrderMockup />
  },
  {
    title: "Generación de Reportes PDF",
    description: "Crea de manera automática reportes y actas de servicio técnicos profesionales, listos para exportar o enviar al cliente por WhatsApp y correo.",
    icon: FileText,
    mockup: <PdfMockup />
  },
  {
    title: "Firma Digital Autógrafa",
    description: "Tus clientes pueden firmar de forma táctil sobre la pantalla de tu celular para certificar la entrega del servicio y cerrar la orden en tiempo real.",
    icon: PenTool,
    mockup: <FirmaDocumentoMockup />
  },
  {
    title: "Importación de Clientes y Equipos",
    description: "Importa clientes al instante desde los contactos de tu celular. Registra marcas, modelos y seriales de sus equipos de manera organizada.",
    icon: UserPlus,
    mockup: <ContactsMockup />
  },
  {
    title: "Sincronización Sin Internet",
    description: "¿Sin cobertura? Guarda tus órdenes de manera local de forma segura. La aplicación se sincronizará automáticamente al recuperar conexión.",
    icon: WifiOff,
    mockup: <OfflineMockup />
  }
]

// ─── LoginPage Component ────────────────────────────────────────────────────

export default function LoginPage() {
  const { user, signInWithGoogle, loading, error: authError, clearError } = useAuth()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceLocked, setDeviceLocked] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [shakeTerms, setShakeTerms] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  // showLogin es true por defecto para evitar parpadeos en usuarios recurrentes
  const [showLogin, setShowLogin] = useState(true)

  // Comprobar si el usuario es recurrente al montar la página
  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("tecnicontrol_onboarding_seen")
      if (seen !== "true") {
        setShowLogin(false) // Usuario nuevo: mostrar el carrusel de onboarding
      }
    }
  }, [])

  // Auto-play slideshow (solo si está el onboarding visible)
  useEffect(() => {
    if (showLogin) return
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [showLogin])



  // Function to reset all states
  const resetLoginState = useCallback(() => {
    setError(null)
    setDeviceLocked(false)
    setIsSigningIn(false) 
    clearError()
  }, [clearError])

  // Listen for global auth errors
  useEffect(() => {
    if (authError) {
      if (authError.includes('DEVICE_LOCKED')) {
        setDeviceLocked(true)
        setError('Esta cuenta ya está registrada en otro dispositivo.')
      } else {
        setError(authError)
      }
    }
  }, [authError])

  // Initialize on mount
  useEffect(() => {
    setMounted(true)
    clearError()

    // Detect dark mode preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(prefersDark)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [clearError])

  // Apply dark mode class
  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', darkMode)
    }
  }, [darkMode, mounted])

  // Redirect if authenticated
  useEffect(() => {
    if (!loading && user && mounted && !isRedirecting) {
      console.log('User authenticated, redirecting to /ordenes')
      setIsRedirecting(true)
      router.push('/ordenes')
    }
  }, [user, loading, mounted, router, isRedirecting])

  const handleGoogleSignIn = async () => {
    // Si no ha aceptado términos, aplicar vibración y advertencia
    if (!acceptedTerms) {
      setShakeTerms(true)
      setError("Debes aceptar el tratamiento de datos personales para continuar.")
      setTimeout(() => setShakeTerms(false), 500)
      return
    }

    try {
      setIsSigningIn(true)
      clearError()
      setError(null)
      setDeviceLocked(false)
      console.log('Attempting Google sign in...')
      await signInWithGoogle()
      // Guardar flag de onboarding visto en ingreso exitoso
      localStorage.setItem("tecnicontrol_onboarding_seen", "true")
    } catch (error: any) {
      console.error('Google Sign In Error:', error)
      const code = error.code || ''
      const msg = error.message || ''

      // Limpiar errores silenciosamente si el usuario canceló el popup de Google
      const isCancelled = 
        code === 'auth/popup-closed-by-user' || 
        code === 'auth/cancelled-popup-request' ||
        msg.includes('popup-closed-by-user') ||
        msg.includes('cancelled-popup-request')

      if (isCancelled) {
        setError(null)
      } else if (msg.includes('DEVICE_LOCKED')) {
        setDeviceLocked(true)
        setError('Esta cuenta ya está registrada en otro dispositivo.')
      } else {
        setError(error.message || 'Error al iniciar sesión con Google.')
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  if (!mounted) {
    return null
  }

  if ((user && !loading) || isRedirecting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white-500 to-blue-500 dark:from-blue-900 dark:to-cyan-950 p-4 transition-colors duration-300">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <img
              src={logo.src}
              alt="TecniControl Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-lg font-semibold dark:text-slate-100 text-slate-900 dark:text-white">Redirigiendo a TecniControl...</p>
        </div>
      </div>
    )
  }

  const ActiveIcon = SLIDES[activeSlide].icon

  return (
    <main className="flex min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors duration-300 overflow-y-auto">
      <AnimatePresence mode="wait">
        {!showLogin ? (
          /* VISTA 1: Onboarding Slideshow Fullscreen */
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white flex flex-col justify-between relative p-6 sm:p-8"
          >
            {/* Glow decorativo de fondo */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Header: Branding y Saltar */}
            <header className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 overflow-hidden rounded-xl bg-white shadow-md border border-slate-700">
                  <img src={logo.src} alt="TecniControl Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-lg font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                  TecniControl
                </span>
              </div>
              <button
                onClick={() => setShowLogin(true)}
                className="text-xs sm:text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-0.5 group"
              >
                Saltar
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </header>

            {/* Center Area: Grid with Device Mockup */}
            <div className="relative z-10 flex-1 w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 py-8 my-auto min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 min-h-0"
                >
                  {/* Left Column: Device frame (Conditional Layout based on Slide) */}
                  <div className="w-full md:w-1/2 flex justify-center min-h-0">
                    {activeSlide === 3 ? (
                      /* Phone portrait mockup specifically for Contacts slide */
                      <div className="w-[280px] h-[365px] bg-slate-900/90 border-4 border-slate-800 rounded-[32px] p-4 shadow-2xl flex flex-col justify-between relative backdrop-blur-sm overflow-hidden select-none flex-shrink-0">
                        {/* Notch */}
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-slate-800 rounded-b-xl z-20 flex items-center justify-center">
                          <div className="w-6 h-1 bg-slate-900 rounded-full" />
                        </div>
                        {/* Mockup content */}
                        <div className="w-full h-full flex flex-col justify-between pt-1">
                          {SLIDES[activeSlide].mockup}
                        </div>
                      </div>
                    ) : (
                      /* Original horizontal card layout for other slides (Order, PDF, Firma, Offline) */
                      <div className="w-full max-w-[360px] sm:max-w-[420px] aspect-[16/11] bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between relative backdrop-blur-sm overflow-hidden flex-shrink-0">
                        {SLIDES[activeSlide].mockup}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Info text content */}
                  <div className="w-full md:w-1/2 text-center md:text-left flex flex-col items-center md:items-start max-w-md mx-auto md:mx-0 flex-shrink-0">
                    <div className="inline-flex p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4 shadow-inner">
                      <ActiveIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white mb-3 tracking-tight">
                      {SLIDES[activeSlide].title}
                    </h3>
                    <p className="text-slate-355 text-sm sm:text-base leading-relaxed">
                      {SLIDES[activeSlide].description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation controls footer */}
            <footer className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between border-t border-slate-800/40 pt-5 flex-shrink-0">
              {/* Back Button */}
              <div className="w-32 text-left">
                {activeSlide > 0 ? (
                  <button
                    onClick={() => setActiveSlide((prev) => prev - 1)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm sm:text-base font-bold text-slate-350 hover:text-white transition-all active:scale-[0.97]"
                  >
                    Atrás
                  </button>
                ) : null}
              </div>

              {/* Dots Pagination */}
              <div className="flex items-center gap-0.5">
                {SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className="p-2.5 flex items-center justify-center focus:outline-none"
                    aria-label={`Ver diapositiva ${idx + 1}`}
                  >
                    <div
                      className={`h-1.5 rounded-full transition-all duration-355 ${
                        activeSlide === idx ? 'w-8 bg-blue-500' : 'w-2.5 bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Next / Start Button */}
              <div className="w-32 text-right">
                {activeSlide < SLIDES.length - 1 ? (
                  <button
                    onClick={() => setActiveSlide((prev) => prev + 1)}
                    className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-sm sm:text-base font-extrabold text-blue-400 hover:text-blue-300 transition-all flex items-center gap-1 ml-auto active:scale-[0.97]"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLogin(true)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm sm:text-base font-extrabold transition-all shadow-md shadow-blue-600/20 active:scale-[0.97]"
                  >
                    Comenzar
                  </button>
                )}
              </div>
            </footer>
          </motion.div>
        ) : (
          /* VISTA 2: Login Card Centered (Soporta recurrentes al instante) */
          <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Glow decorativo de fondo */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-2xl p-6 sm:p-8 flex flex-col justify-center min-h-[500px] transition-colors duration-300 relative z-10"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center items-center gap-2 mb-3">
                  <div className="w-10 h-10 overflow-hidden rounded-xl bg-white shadow-md border border-gray-200 dark:border-gray-800">
                    <img
                      src={logo.src}
                      alt="TecniControl Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight">
                    TecniControl
                  </h2>
                </div>
                <p className="text-sm dark:text-gray-400 text-slate-600 leading-normal max-w-xs mx-auto">
                  ¡Crea y gestiona tus órdenes de servicio de forma ágil y profesional!
                </p>
              </div>

              <div className="space-y-6">
                {/* Error Message */}
                {error && !deviceLocked && (
                  <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="h-4.5 w-4.5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <AlertDescription className="text-xs text-red-800 dark:text-red-300 font-medium">
                        {error}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                {/* Locked Device View */}
                {deviceLocked ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-1">
                      <Lock className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Acceso Restringido
                    </h3>
                    <p className="text-xs text-slate-650 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                      {error}
                    </p>

                    <div className="flex flex-col gap-2 pt-1">
                      <a
                        href="https://wa.me/573000000000?text=Hola,%20mi%20cuenta%20de%20TecniControl%20aparece%20bloqueada%20por%20dispositivo.%20Necesito%20ayuda."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.397 9.806-9.801.001-2.597-1.002-5.04-2.823-6.861Y3.94C16.43 2.12 13.99 1.117 12 1.118 6.595 1.118 2.2 5.517 2.197 10.922c-.001 1.554.417 3.076 1.211 4.426l-.102.164-.997 3.638 3.73-.978.158.102z" />
                        </svg>
                        Contactar soporte por WhatsApp
                      </a>
                      
                      <Button
                        variant="outline"
                        onClick={resetLoginState}
                        className="w-full py-5 rounded-xl border-slate-200 dark:border-slate-800 dark:text-slate-400 text-slate-650 dark:text-slate-400 hover:dark:bg-slate-950 hover:bg-slate-50 gap-2 text-xs font-semibold"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Volver al inicio de sesión
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Terms and Conditions Checkbox */}
                    <motion.div
                      animate={shakeTerms ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
                        shakeTerms 
                          ? 'border-red-500 bg-red-500/5 dark:border-red-500/30' 
                          : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5 relative">
                        <input
                          id="terms"
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          onClick={() => setAcceptedTerms(!acceptedTerms)}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-slate-900 ${
                            acceptedTerms
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {acceptedTerms && (
                            <CheckCircle2 className="w-4.5 h-4.5 dark:text-white text-slate-800 animate-in zoom-in duration-200" />
                          )}
                        </div>
                      </div>
                      <label 
                        htmlFor="terms" 
                        className="text-[11px] sm:text-xs dark:text-gray-400 text-slate-600 leading-normal cursor-pointer select-none"
                      >
                        Acepto el tratamiento de mis datos personales de acuerdo con la{' '}
                        <a 
                          href="/legal/politica-privacidad" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Política de Privacidad
                        </a>
                        {' '}y los{' '}
                        <a 
                          href="/legal/terminos-servicio" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Términos de Servicio
                        </a>
                        {' '}de TecniControl (Ley 1581 de 2012).
                      </label>
                    </motion.div>

                    {/* Primary Google Login Button */}
                    <Button
                      onClick={handleGoogleSignIn}
                      disabled={loading || isSigningIn}
                      size="lg"
                      className="w-full py-6 text-sm font-bold bg-white dark:bg-slate-900 dark:hover:bg-slate-800 hover:bg-slate-50 dark:text-slate-200 text-slate-800 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                    >
                      {loading || isSigningIn ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Iniciando sesión...</span>
                        </>
                      ) : (
                        <>
                          <GoogleIcon className="w-5 h-5" />
                          <span>Continuar con Google</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Privacy info box */}
                <div className="rounded-xl bg-slate-50/50 dark:bg-slate-950/30 p-4 border border-slate-200/50 dark:border-slate-850">
                  <div className="flex gap-2.5">
                    <Shield className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white text-xs">
                        Tu privacidad está protegida
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-normal">
                        Solo utilizamos tu cuenta de Google para identificarte de forma segura. Tus datos de servicio están completamente encriptados y resguardados.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <footer className="mt-8 text-center space-y-2.5">
                <button
                  onClick={() => {
                    setShowLogin(false)
                    setActiveSlide(0)
                  }}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                >
                  Ver introducción de la aplicación
                </button>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Al ingresar, aceptas el uso de la aplicación conforme a nuestras políticas de servicio.
                </p>
                <p className="text-[10px] font-bold text-slate-500">
                  TecniControl v1.1.0
                </p>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
