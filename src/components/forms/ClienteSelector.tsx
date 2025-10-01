// components/forms/ClienteSelector.tsx
'use client'
import { Cliente } from '@/types/orden'
import { Search, UserPlus, X, MapPin, Phone, Mail, HardDrive } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

interface ClienteSelectorProps {
  clientes: Cliente[]
  clienteSeleccionado: Cliente | null
  busquedaCliente: string
  setBusquedaCliente: (value: string) => void
  onSeleccionarCliente: (cliente: Cliente) => void
  onDesseleccionarCliente: () => void
}

export default function ClienteSelector({
  clientes,
  clienteSeleccionado,
  busquedaCliente,
  setBusquedaCliente,
  onSeleccionarCliente,
  onDesseleccionarCliente
}: ClienteSelectorProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.name.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    cliente.email.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    cliente.phone.includes(busquedaCliente)
  )

  useEffect(() => {
    if (!clienteSeleccionado && inputRef.current) {
      inputRef.current.focus()
    }
  }, [clienteSeleccionado])

  const handleClearSearch = () => {
    setBusquedaCliente('')
    inputRef.current?.focus()
  }

  if (clienteSeleccionado) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/15 to-blue-600/10 p-5 rounded-xl border border-blue-500/40 shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
        
        <div className="relative flex justify-between items-start gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-300 font-semibold text-lg">
                      {clienteSeleccionado.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-200 text-lg">{clienteSeleccionado.name}</h3>
                    <p className="text-xs text-blue-400/60">Cliente seleccionado</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-blue-400/70" />
                <span className="text-blue-300/90">{clienteSeleccionado.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-blue-400/70" />
                <span className="text-blue-300/90">{clienteSeleccionado.phone}</span>
              </div>
            </div>

            {clienteSeleccionado.address && (
              <div className="flex items-start gap-2 text-sm pl-12">
                <MapPin className="w-4 h-4 text-blue-400/70 mt-0.5 flex-shrink-0" />
                <span className="text-blue-300/80">{clienteSeleccionado.address}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pl-12">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 rounded-full">
                <HardDrive className="w-3.5 h-3.5 text-blue-300" />
                <span className="text-xs text-blue-300 font-medium">
                  {clienteSeleccionado.dispositivos?.length || 0} dispositivo(s)
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onDesseleccionarCliente}
            className="flex-shrink-0 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
          >
            Cambiar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="text-sm text-gray-300 font-medium">Seleccionar Cliente</p>
          <p className="text-xs text-gray-500">Busca un cliente existente o crea uno nuevo</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/clientes/nuevo')}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 text-sm font-medium shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>
      
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={busquedaCliente}
          onChange={(e) => setBusquedaCliente(e.target.value)}
          className="w-full pl-10 pr-10 py-3.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-gray-800 transition-all duration-200"
        />
        {busquedaCliente && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors p-1 hover:bg-gray-700/50 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {busquedaCliente && (
        <div className="border border-gray-700/50 rounded-xl bg-gray-800/90 shadow-xl overflow-hidden backdrop-blur-sm">
          {clientesFiltrados.length > 0 ? (
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              <div className="p-2 bg-gray-900/50 border-b border-gray-700/50">
                <p className="text-xs text-gray-400 px-2">
                  {clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? 's' : ''} encontrado{clientesFiltrados.length !== 1 ? 's' : ''}
                </p>
              </div>
              {clientesFiltrados.map((cliente, index) => (
                <div
                  key={cliente.id}
                  onClick={() => onSeleccionarCliente(cliente)}
                  className="p-4 hover:bg-gray-700/40 cursor-pointer border-b border-gray-700/30 last:border-b-0 transition-all duration-150 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gray-700 group-hover:bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
                        <span className="text-gray-300 group-hover:text-blue-300 font-semibold transition-colors">
                          {cliente.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white group-hover:text-blue-300 transition-colors truncate">
                          {cliente.name}
                        </div>
                        <div className="text-sm text-gray-400 mt-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{cliente.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{cliente.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="px-2.5 py-1 bg-gray-700/50 group-hover:bg-blue-500/20 rounded-full transition-colors">
                        <span className="text-xs text-gray-400 group-hover:text-blue-300 font-medium transition-colors">
                          {cliente.dispositivos?.length || 0} dispositivo{cliente.dispositivos?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 font-medium">No se encontraron clientes</p>
              <p className="text-sm text-gray-500 mt-1">Intenta con otro término de búsqueda</p>
            </div>
          )}
        </div>
      )}

      {!busquedaCliente && clientes.length > 0 && (
        <div className="text-center py-6 text-gray-500 text-sm">
          Escribe para buscar entre {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}