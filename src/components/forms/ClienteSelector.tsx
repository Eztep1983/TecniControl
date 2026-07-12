// components/forms/ClienteSelector.tsx
'use client'
import { Cliente } from '@/types/orden'
import {
  Search, UserPlus, X, MapPin, Phone, Mail,
  HardDrive, Clock, AlertCircle, ChevronDown,
  CheckCircle2, ArrowRight
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, memo, useMemo } from 'react'
import { ClienteViewModal } from '../clientes/ClienteViewModal'
import { ClienteSimpleFormModal } from '../clientes/ClienteSimpleFormModal'
import { useClienteModal } from '@/hooks/clientes/useClienteModal'

interface ClienteSelectorProps {
  clientes: Cliente[]
  clienteSeleccionado: Cliente | null
  busquedaCliente: string
  setBusquedaCliente: (value: string) => void
  onSeleccionarCliente: (cliente: Cliente) => void
  onDesseleccionarCliente: () => void
}

// Cuántos clientes mostrar inicialmente y cuánto añadir por cada "Ver más"
const INITIAL_VISIBLE = 6
const LOAD_MORE_STEP = 6

const ClienteSelector = memo(function ClienteSelector({
  clientes,
  clienteSeleccionado,
  onSeleccionarCliente,
  onDesseleccionarCliente,
}: Omit<ClienteSelectorProps, 'busquedaCliente' | 'setBusquedaCliente'>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [clienteAnimando, setClienteAnimando] = useState<string | null>(null)
  const [localBusqueda, setLocalBusqueda] = useState('')
  // Cuántos resultados de búsqueda mostrar
  const [visiblesEnBusqueda, setVisiblesEnBusqueda] = useState(INITIAL_VISIBLE)
  const modal = useClienteModal()

  const activeCliente = useMemo(() => {
    if (!modal.cliente) return null;
    return clientes.find((c) => c.id === modal.cliente!.id) || modal.cliente;
  }, [clientes, modal.cliente]);

  const clientesValidos = Array.isArray(clientes) ? clientes : []

  const clientesOrdenados = [...clientesValidos].sort((a, b) => {
    const fechaA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const fechaB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return fechaB - fechaA
  })

  // Últimos 5 para la sección "Recientes"
  const ultimosClientes = clientesOrdenados.slice(0, 5)

  const clientesFiltrados = clientesValidos.filter(c =>
    c.name?.toLowerCase().includes(localBusqueda.toLowerCase()) ||
    c.email?.toLowerCase().includes(localBusqueda.toLowerCase()) ||
    c.phone?.includes(localBusqueda)
  )

  const clientesVisibles = clientesFiltrados.slice(0, visiblesEnBusqueda)
  const hayMasResultados = clientesFiltrados.length > visiblesEnBusqueda

  // Resetear "Ver más" cuando cambia la búsqueda
  useEffect(() => {
    setVisiblesEnBusqueda(INITIAL_VISIBLE)
  }, [localBusqueda])

  useEffect(() => {
    if (!clienteSeleccionado && inputRef.current) {
      inputRef.current.blur()
    }
  }, [clienteSeleccionado])

  const handleClearSearch = () => {
    setLocalBusqueda('')
    inputRef.current?.focus()
  }

  const handleSeleccionarCliente = (cliente: Cliente) => {
    setClienteAnimando(cliente.id)
    setTimeout(() => {
      onSeleccionarCliente(cliente)
      setClienteAnimando(null)
    }, 250)
  }

  const handleSuccess = useCallback((cliente: Cliente) => {
    onSeleccionarCliente(cliente)
    modal.close()
  }, [onSeleccionarCliente, modal])

  /* ─── CLIENTE SELECCIONADO ──────────────────────────────────────── */
  if (clienteSeleccionado) {
    return (
      <>
        <ClienteViewModal
          open={modal.isView}
          cliente={activeCliente}
          onClose={modal.close}
        />
        <ClienteSimpleFormModal
          open={modal.isCreate}
          initialData={null}
          onClose={modal.close}
          onSuccess={handleSuccess}
        />

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/15 to-blue-600/10 rounded-2xl border border-blue-500/40 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/5 rounded-full -ml-12 -mb-12 pointer-events-none" />

          <div className="relative p-4 sm:p-5">
            {/* Check badge */}
            <div className="flex items-center gap-1.5 mb-3">
              <CheckCircle2 className="w-4 h-4 dark:text-blue-400 text-blue-700" />
              <span className="text-xs font-medium dark:text-blue-400 text-blue-700 uppercase tracking-wide">
                Cliente seleccionado
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              {/* Avatar + info */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 bg-blue-500/25 rounded-2xl flex items-center justify-center flex-shrink-0 animate-in zoom-in duration-200">
                  <span className="dark:text-blue-200 text-blue-800 font-bold text-xl">
                    {clienteSeleccionado.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold dark:text-white text-gray-900 text-base leading-tight truncate">
                    {clienteSeleccionado.name}
                  </h3>

                  {/* Contact info — stacked on mobile */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 dark:text-blue-400 text-blue-700/70 flex-shrink-0" />
                      <span className="text-sm dark:text-blue-300 text-blue-700/80 truncate">{clienteSeleccionado.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 dark:text-blue-400 text-blue-700/70 flex-shrink-0" />
                      <span className="text-sm dark:text-blue-300 text-blue-700/80">{clienteSeleccionado.phone}</span>
                    </div>
                    {clienteSeleccionado.address && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 dark:text-blue-400 text-blue-700/70 flex-shrink-0 mt-0.5" />
                        <span className="text-sm dark:text-blue-300 text-blue-700/70 line-clamp-1">{clienteSeleccionado.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Device count pill */}
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 rounded-full">
                    <HardDrive className="w-3 h-3 dark:text-blue-300 text-blue-700" />
                    <span className="text-xs dark:text-blue-300 text-blue-700 font-medium">
                      {clienteSeleccionado.dispositivos?.length || 0}{' '}
                      dispositivo{clienteSeleccionado.dispositivos?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Change button — tall enough for thumb tap */}
              <button
                type="button"
                onClick={onDesseleccionarCliente}
                className="flex-shrink-0 min-h-[44px] px-4 py-2 bg-blue-500/20 hover:bg-blue-500/35 active:bg-blue-500/45 dark:text-blue-300 text-blue-700 hover:text-blue-100 rounded-xl transition-all duration-150 font-medium text-sm active:scale-95"
              >
                Cambiar
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  /* ─── SELECTOR ──────────────────────────────────────────────────── */
  return (
    <>
      <ClienteViewModal
        open={modal.isView}
        cliente={activeCliente}
        onClose={modal.close}
      />
      <ClienteSimpleFormModal
        open={modal.isCreate}
        initialData={null}
        onClose={modal.close}
        onSuccess={handleSuccess}
      />

      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xl font-semibold dark:text-gray-200 text-gray-800">SELECCIONAR CLIENTE</p>
            <p className="text-md text-gray-500 mt-0.5">Busca o crea un cliente</p>
          </div>

          {/* Nuevo Cliente — primary CTA, full thumb-friendly height */}
          <button
            type="button"
            onClick={modal.openCreate}
            className="flex-shrink-0 min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl transition-all duration-150 text-sm font-semibold shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 dark:text-gray-400 text-gray-600 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            autoComplete="off"
            placeholder="Nombre, email o teléfono…"
            value={localBusqueda}
            onChange={e => setLocalBusqueda(e.target.value)}
            className="w-full h-12 pl-10 pr-10 dark:bg-gray-800/70 bg-gray-200 border dark:border-gray-700/60 border-gray-300 rounded-xl dark:text-white text-gray-900 placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 focus:dark:bg-gray-800 focus:bg-gray-200 transition-all duration-200 outline-none"
          />
          {localBusqueda && (
            <button
              type="button"
              onClick={handleClearSearch}
              // 44×44 touch target via padding
              className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center dark:text-gray-400 text-gray-600 hover:dark:text-gray-200 hover:text-gray-800 active:scale-90 transition-all"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Clientes recientes (sin búsqueda) ── */}
        {!localBusqueda && ultimosClientes.length > 0 && (
          <div className="rounded-2xl border dark:border-gray-700/50 border-gray-300 dark:bg-gray-800/80 bg-gray-200/80 overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="px-4 py-3 dark:bg-gray-900/60 bg-gray-50 border-b dark:border-gray-700/50 border-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4 dark:text-blue-400 text-blue-700" />
              <span className="text-sm font-medium dark:text-gray-300 text-gray-700">Recientes</span>
              <span className="ml-auto text-xs text-gray-500 bg-gray-700/60 px-2 py-0.5 rounded-full">
                {clientesValidos.length} en total
              </span>
            </div>

            {ultimosClientes.map((cliente, index) => (
              <ClienteRow
                key={cliente.id}
                cliente={cliente}
                animando={clienteAnimando === cliente.id}
                delay={index * 40}
                onSelect={handleSeleccionarCliente}
                showDivider={index < ultimosClientes.length - 1}
              />
            ))}
          </div>
        )}

        {/* ── Resultados de búsqueda ── */}
        {localBusqueda && (
          <div className="rounded-2xl border dark:border-gray-700/50 border-gray-300 dark:bg-gray-800/80 bg-gray-200/80 overflow-hidden shadow-xl animate-in fade-in duration-200">
            {clientesFiltrados.length > 0 ? (
              <>
                <div className="px-4 py-2.5 dark:bg-gray-900/60 bg-gray-50 border-b dark:border-gray-700/50 border-gray-300">
                  <span className="text-xs dark:text-gray-400 text-gray-600">
                    {clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {clientesVisibles.map((cliente, index) => (
                  <ClienteRow
                    key={cliente.id}
                    cliente={cliente}
                    animando={clienteAnimando === cliente.id}
                    delay={index * 25}
                    onSelect={handleSeleccionarCliente}
                    showDivider={index < clientesVisibles.length - 1}
                  />
                ))}

                {/* Ver más — mejor que paginación en mobile */}
                {hayMasResultados && (
                  <button
                    type="button"
                    onClick={() => setVisiblesEnBusqueda(v => v + LOAD_MORE_STEP)}
                    className="w-full min-h-[48px] flex items-center justify-center gap-2 border-t dark:border-gray-700/50 border-gray-300 text-sm dark:text-gray-400 text-gray-600 hover:dark:text-blue-400 hover:text-blue-700 hover:bg-gray-700/30 active:dark:bg-gray-700/50 active:bg-gray-300 transition-all duration-150"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Ver {Math.min(LOAD_MORE_STEP, clientesFiltrados.length - visiblesEnBusqueda)} más
                  </button>
                )}
              </>
            ) : (
              <EmptySearch query={localBusqueda} onCrear={modal.openCreate} />
            )}
          </div>
        )}

        {/* ── Sin clientes en absoluto ── */}
        {!localBusqueda && clientesValidos.length === 0 && (
          <EmptyClientes onCrear={modal.openCreate} />
        )}
      </div>
    </>
  )
})

export default ClienteSelector

/* ─────────────────────────────────────────────────────────────────── */
/* Sub-componentes                                                       */
/* ─────────────────────────────────────────────────────────────────── */

interface ClienteRowProps {
  cliente: Cliente
  animando: boolean
  delay: number
  onSelect: (c: Cliente) => void
  showDivider: boolean
}

const ClienteRow = memo(function ClienteRow({
  cliente, animando, delay, onSelect, showDivider
}: ClienteRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(cliente)}
      // min-h-[64px] garantiza touch target cómodo en mobile
      className={`w-full min-h-[64px] px-4 py-3.5 flex items-center gap-3 text-left transition-all duration-150 active:scale-[0.985] ${animando ? 'bg-blue-500/20' : 'hover:bg-gray-700/40 active:bg-gray-700/60'} ${showDivider ? 'border-b dark:border-gray-700/30 border-gray-300' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Avatar */}
      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150 group-hover:bg-blue-600/20">
        <span className="dark:text-gray-300 text-gray-700 font-semibold text-base">
          {cliente.name?.charAt(0).toUpperCase() || '?'}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium dark:text-white text-gray-900 text-md truncate">{cliente.name}</div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs dark:text-gray-400 text-gray-600 truncate max-w-[140px]">{cliente.email}</span>
          {cliente.phone && (
            <>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-xs dark:text-gray-400 text-gray-600">{cliente.phone}</span>
            </>
          )}
        </div>
      </div>

      {/* Dispositivos badge + arrow */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-gray-500 bg-gray-700/60 px-2 py-0.5 rounded-full">
          {cliente.dispositivos?.length || 0}d
        </span>
        <ArrowRight className="w-4 h-4 text-gray-600" />
      </div>
    </button>
  )
})

function EmptySearch({ query, onCrear }: { query: string; onCrear: () => void }) {
  return (
    <div className="py-10 px-6 text-center">
      <div className="w-14 h-14 bg-gray-700/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <Search className="w-7 h-7 text-gray-500" />
      </div>
      <p className="dark:text-gray-300 text-gray-700 font-medium text-sm">Sin resultados para</p>
      <p className="dark:text-blue-400 text-blue-700/80 font-semibold text-sm mt-0.5 truncate px-4">"{query}"</p>
      <p className="text-xs text-gray-500 mt-2 mb-4">¿Es un cliente nuevo?</p>
      <button
        type="button"
        onClick={onCrear}
        className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 bg-blue-600/80 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all active:scale-95"
      >
        <UserPlus className="w-4 h-4" />
        Crear cliente nuevo
      </button>
    </div>
  )
}

function EmptyClientes({ onCrear }: { onCrear: () => void }) {
  return (
    <div className="py-12 px-6 text-center border dark:border-gray-700/50 border-gray-300 rounded-2xl dark:bg-gray-800/50 bg-gray-200 animate-in fade-in duration-300">
      <div className="w-16 h-16 bg-gray-700/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-gray-500" />
      </div>
      <p className="dark:text-gray-300 text-gray-700 font-semibold">Aún no hay clientes</p>
      <p className="text-sm text-gray-500 mt-1 mb-5">Crea tu primer cliente para generar una orden</p>
      <button
        type="button"
        onClick={onCrear}
        className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all active:scale-95"
      >
        <UserPlus className="w-4 h-4" />
        Crear primer cliente
      </button>
    </div>
  )
}