// components/forms/DispositivoSelector.tsx
'use client'
import { Cliente, Dispositivo } from '@/types/orden'
import {
  Monitor, Laptop, Smartphone, Tablet, HardDrive,
  Cpu, Package, AlertCircle, Plus, CheckCircle2,
  ChevronDown, ArrowRight,
  Printer
} from 'lucide-react'
import { useState, memo } from 'react'
import { DispositivoFormModal } from '@/components/clientes/DispositivoFormModal'

interface DispositivoSelectorProps {
  cliente: Cliente
  dispositivoSeleccionado: Dispositivo | null
  onSeleccionarDispositivo: (dispositivo: Dispositivo) => void
  onDesseleccionarDispositivo: () => void
  onClienteActualizado?: (cliente: Cliente) => void
}

const INITIAL_VISIBLE = 6
const LOAD_MORE_STEP = 6

/* ── Icono según tipo de dispositivo ──────────────────────────────── */
function getIconoDispositivo(tipo: string) {
  const t = tipo.toLowerCase()
  if (t.includes('impresora') || t.includes('multifuncional') || t.includes('scanner') || t.includes('plotter') || t.includes('Fotocopiadora') ) return Printer
  if (t.includes('celular') || t.includes('móvil') || t.includes('smartphone')) return Smartphone
  if (t.includes('computadora') || t.includes('pc') || t.includes('laptop')) return Laptop
  if (t.includes('tablet')) return Tablet
  if (t.includes('monitor')) return Monitor
  if (t.includes('disco') || t.includes('hdd') || t.includes('ssd')) return HardDrive
  return Cpu
}

/* ── Color de estado ──────────────────────────────────────────────── */
function getEstadoStyle(estado?: string) {
  if (!estado) return null
  const e = estado.toLowerCase()
  if (e.includes('bueno') || e.includes('funciona')) return 'bg-emerald-500/15 text-emerald-400'
  if (e.includes('malo') || e.includes('daño') || e.includes('roto')) return 'bg-red-500/15 text-red-400'
  if (e.includes('regular') || e.includes('usado')) return 'bg-amber-500/15 text-amber-400'
  return 'bg-gray-700/50 text-gray-400'
}

export default function DispositivoSelector({
  cliente,
  dispositivoSeleccionado,
  onSeleccionarDispositivo,
  onDesseleccionarDispositivo,
  onClienteActualizado,
}: DispositivoSelectorProps) {
  const [dispositivoAnimando, setDispositivoAnimando] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visibles, setVisibles] = useState(INITIAL_VISIBLE)

  const dispositivos = Array.isArray(cliente.dispositivos) ? cliente.dispositivos : []

  const dispositivosVisibles = dispositivos.slice(0, visibles)
  const hayMas = dispositivos.length > visibles

  const handleSeleccionarDispositivo = (dispositivo: Dispositivo) => {
    setDispositivoAnimando(dispositivo.id)
    setTimeout(() => {
      onSeleccionarDispositivo(dispositivo)
      setDispositivoAnimando(null)
    }, 250)
  }

  const handleModalSuccess = (c: Cliente) => {
    setIsModalOpen(false)
    onClienteActualizado?.(c)
  }

  /* ── DISPOSITIVO SELECCIONADO ────────────────────────────────────── */
  if (dispositivoSeleccionado) {
    const Icono = getIconoDispositivo(dispositivoSeleccionado.tipo)
    const estadoStyle = getEstadoStyle(dispositivoSeleccionado.estado)

    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/15 to-blue-600/10 rounded-2xl border border-blue-500/40 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="relative p-4 sm:p-5">
          {/* Badge */}
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">
              Dispositivo seleccionado
            </span>
          </div>

          <div className="flex items-start justify-between gap-3">
            {/* Icon + info */}
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 animate-in zoom-in duration-200">
                <Icono className="w-6 h-6 text-blue-300" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-base leading-tight">
                  {dispositivoSeleccionado.tipo}
                </h3>
                <p className="text-sm text-blue-300/80 mt-0.5">
                  {dispositivoSeleccionado.marca} {dispositivoSeleccionado.modelo}
                </p>

                <div className="flex items-center gap-1.5 mt-2">
                  <Package className="w-3.5 h-3.5 text-blue-400/60" />
                  <span className="text-xs text-blue-300/60 font-mono">
                    S/N: {dispositivoSeleccionado.numeroSerie}
                  </span>
                </div>

                {estadoStyle && (
                  <span className={`inline-flex items-center mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${estadoStyle}`}>
                    {dispositivoSeleccionado.estado}
                  </span>
                )}
              </div>
            </div>

            {/* Change button — thumb-friendly */}
            <button
              type="button"
              onClick={onDesseleccionarDispositivo}
              className="flex-shrink-0 min-h-[44px] px-4 py-2 bg-blue-500/20 hover:bg-blue-500/35 active:bg-blue-500/45 text-blue-300 hover:text-blue-100 rounded-xl transition-all duration-150 font-medium text-sm active:scale-95"
            >
              Cambiar
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── SIN DISPOSITIVOS ─────────────────────────────────────────────── */
  if (dispositivos.length === 0) {
    return (
      <>
        <div className="py-12 px-6 text-center border border-gray-700/50 rounded-2xl bg-gray-800/50 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="w-16 h-16 bg-gray-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-300 font-semibold">Sin dispositivos registrados</p>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Agrega el dispositivo de {cliente.name?.split(' ')[0] || 'este cliente'} para continuar
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Agregar dispositivo
          </button>
        </div>

        <DispositivoFormModal
          open={isModalOpen}
          cliente={cliente}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      </>
    )
  }

  /* ── LISTA DE DISPOSITIVOS ────────────────────────────────────────── */
  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-gray-200">DISPOSITIVOS DEL CLIENTE</p>
            <p className="text-md text-gray-500 mt-0.5">
              {dispositivos.length} dispositivo{dispositivos.length !== 1 ? 's' : ''} registrado{dispositivos.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Nuevo dispositivo button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex-shrink-0 min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-500/15 hover:bg-blue-500/25 active:bg-blue-500/35 border border-blue-500/25 text-blue-400 hover:text-blue-300 rounded-xl text-sm font-medium transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="sm:inline">Nuevo</span>
          </button>
        </div>

        {/* Device list */}
        <div className="rounded-2xl border border-gray-700/50 bg-gray-800/80 overflow-hidden shadow-xl">
          {dispositivosVisibles.map((dispositivo, index) => (
            <DispositivoRow
              key={dispositivo.id}
              dispositivo={dispositivo}
              animando={dispositivoAnimando === dispositivo.id}
              delay={index * 35}
              onSelect={handleSeleccionarDispositivo}
              showDivider={index < dispositivosVisibles.length - 1 || hayMas}
            />
          ))}

          {/* Ver más */}
          {hayMas && (
            <button
              type="button"
              onClick={() => setVisibles(v => v + LOAD_MORE_STEP)}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-blue-400 hover:bg-gray-700/30 active:bg-gray-700/50 transition-all duration-150"
            >
              <ChevronDown className="w-4 h-4" />
              Ver {Math.min(LOAD_MORE_STEP, dispositivos.length - visibles)} más
            </button>
          )}
        </div>
      </div>

      <DispositivoFormModal
        open={isModalOpen}
        cliente={cliente}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────── */
/* Sub-componente: fila de dispositivo                                  */
/* ─────────────────────────────────────────────────────────────────── */

interface DispositivoRowProps {
  dispositivo: Dispositivo
  animando: boolean
  delay: number
  onSelect: (d: Dispositivo) => void
  showDivider: boolean
}

const DispositivoRow = memo(function DispositivoRow({
  dispositivo, animando, delay, onSelect, showDivider
}: DispositivoRowProps) {
  const Icono = getIconoDispositivo(dispositivo.tipo)
  const estadoStyle = getEstadoStyle(dispositivo.estado)

  return (
    <button
      type="button"
      onClick={() => onSelect(dispositivo)}
      // min-h-[72px] para touch target cómodo dado el contenido
      className={`w-full min-h-[72px] px-4 py-4 flex items-center gap-3 text-left transition-all duration-150 active:scale-[0.985] ${animando ? 'bg-blue-500/20' : 'hover:bg-gray-700/40 active:bg-gray-700/60'} ${showDivider ? 'border-b border-gray-700/30' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Device icon */}
      <div className="w-11 h-11 bg-gray-700/60 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
        <Icono className="w-5 h-5 text-gray-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm">{dispositivo.tipo}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          {dispositivo.marca} {dispositivo.modelo}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <div className="flex items-center gap-1">
            <Package className="w-3 h-3 text-gray-600" />
            <span className="text-xs text-gray-500 font-mono">{dispositivo.numeroSerie}</span>
          </div>
          {estadoStyle && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${estadoStyle}`}>
              {dispositivo.estado}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
    </button>
  )
})