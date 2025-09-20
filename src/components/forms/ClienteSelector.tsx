// components/forms/ClienteSelector.tsx
'use client'
import { Cliente } from '@/types/orden'
import { Search, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.name.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    cliente.email.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    cliente.phone.includes(busquedaCliente)
  )

  if (clienteSeleccionado) {
    return (
      <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium text-blue-300">{clienteSeleccionado.name}</h3>
            <p className="text-sm text-blue-400/80 mt-1">{clienteSeleccionado.email} | {clienteSeleccionado.phone}</p>
            {clienteSeleccionado.address && (
              <p className="text-sm text-blue-400/70 mt-1">{clienteSeleccionado.address}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onDesseleccionarCliente}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors px-3 py-1 rounded hover:bg-blue-500/20 ml-4"
          >
            Cambiar
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-400">Busca y selecciona un cliente existente o crea uno nuevo</p>
        <button
          type="button"
          onClick={() => router.push('/clientes/nuevo')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente por nombre, email o teléfono..."
            value={busquedaCliente}
            onChange={(e) => setBusquedaCliente(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
        
        {busquedaCliente && (
          <div className="max-h-60 overflow-y-auto border border-gray-700 rounded-lg bg-gray-800/80 backdrop-blur-sm">
            {clientesFiltrados.length > 0 ? (
              clientesFiltrados.map((cliente) => (
                <div
                  key={cliente.id}
                  onClick={() => onSeleccionarCliente(cliente)}
                  className="p-3 hover:bg-gray-700/50 cursor-pointer border-b border-gray-700/50 last:border-b-0 transition-colors group"
                >
                  <div className="font-medium text-white group-hover:text-blue-300 transition-colors">{cliente.name}</div>
                  <div className="text-sm text-gray-300">{cliente.email} | {cliente.phone}</div>
                  <div className="text-xs text-gray-500 mt-1">{cliente.dispositivos?.length || 0} dispositivo(s)</div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400">
                No se encontraron clientes
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}