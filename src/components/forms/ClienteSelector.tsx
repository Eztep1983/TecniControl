// components/forms/ClienteSelector.tsx
'use client'
import { Cliente } from '@/types/orden'
import { Search, UserPlus, X, MapPin, Phone, Mail, HardDrive, Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, memo } from 'react'
import { ClienteViewModal } from '../clientes/ClienteViewModal'
import { ClienteFormModal } from '../clientes/ClienteFormModal'
import { useClienteModal } from '@/hooks/useClienteModal'

interface ClienteSelectorProps {
  clientes: Cliente[]
  clienteSeleccionado: Cliente | null
  busquedaCliente: string
  setBusquedaCliente: (value: string) => void
  onSeleccionarCliente: (cliente: Cliente) => void
  onDesseleccionarCliente: () => void
}

const ITEMS_PER_PAGE = 10

const ClienteSelector = memo(function ClienteSelector({
  clientes,
  clienteSeleccionado,
  onSeleccionarCliente,
  onDesseleccionarCliente
}: Omit<ClienteSelectorProps, 'busquedaCliente' | 'setBusquedaCliente'>) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [clienteAnimando, setClienteAnimando] = useState<string | null>(null)
  const [localBusqueda, setLocalBusqueda] = useState('')
  const modal = useClienteModal();

  // Validación: asegurar que clientes es un array
  const clientesValidos = Array.isArray(clientes) ? clientes : []

  // Ordenar clientes por fecha de creación (más recientes primero)
  const clientesOrdenados = [...clientesValidos].sort((a, b) => {
    const fechaA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const fechaB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return fechaB - fechaA
  })

  // Obtener los últimos 5 clientes
  const ultimosClientes = clientesOrdenados.slice(0, 5)

  const clientesFiltrados = clientesValidos.filter(cliente =>
    cliente.name?.toLowerCase().includes(localBusqueda.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(localBusqueda.toLowerCase()) ||
    cliente.phone?.includes(localBusqueda)
  )

  // Cálculos de paginación
  const totalPaginas = Math.ceil(clientesFiltrados.length / ITEMS_PER_PAGE)
  const indiceInicio = (paginaActual - 1) * ITEMS_PER_PAGE
  const indiceFin = indiceInicio + ITEMS_PER_PAGE
  const clientesPaginados = clientesFiltrados.slice(indiceInicio, indiceFin)

  useEffect(() => {
    if (!clienteSeleccionado && inputRef.current) {
      inputRef.current.blur()
    }
  }, [clienteSeleccionado])

  // Resetear paginación cuando cambia la búsqueda
  useEffect(() => {
    setPaginaActual(1)
  }, [localBusqueda])

  const handleClearSearch = () => {
    setLocalBusqueda('')
    setPaginaActual(1)
    inputRef.current?.blur()
  }

  const handleSeleccionarCliente = (cliente: Cliente) => {
    setClienteAnimando(cliente.id)
    setTimeout(() => {
      onSeleccionarCliente(cliente)
      setClienteAnimando(null)
    }, 300)
  }

  const handlePaginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(prev => prev + 1)
    }
  }

  const handlePaginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(prev => prev - 1)
    }
  }
  const handleSuccess = useCallback((cliente: Cliente) => {
    onSeleccionarCliente(cliente);
    // La lista de clientes se actualizará desde el componente padre
  }, [onSeleccionarCliente]);

  return (
    <>
      <ClienteViewModal
        open={modal.isView}
        cliente={modal.cliente}
        onClose={modal.close}
        onEdit={modal.switchToEdit}
      />
      <ClienteFormModal
        open={modal.isCreate || modal.isEdit}
        initialData={modal.isEdit ? modal.cliente : null}
        onClose={modal.close}
        onSuccess={handleSuccess}
      />

      {clienteSeleccionado ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/15 to-blue-600/10 p-5 rounded-xl border border-blue-500/40 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16" />
        
        <div className="relative flex justify-between items-start gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                    <span className="text-blue-300 font-semibold text-lg">
                      {clienteSeleccionado.name?.charAt(0).toUpperCase() || '?'}
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
            className="flex-shrink-0 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md active:scale-95"
          >
            Cambiar
          </button>
        </div>
      </div>
      ) : (
      <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="text-xl text-gray-300 font-medium">Seleccionar Cliente</p>
          <p className="text-xs text-gray-500">Busca un cliente existente para generar una orden</p>
        </div>
      </div>
      
        <button
          type="button"
          onClick={modal.openCreate}
          className="w-full sm:w-auto text-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 text-sm font-medium shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:scale-95"
        >
        <UserPlus className="w-4 h-4" />
        <span>Nuevo Cliente</span>
      </button>
      
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={localBusqueda}
          onChange={(e) => setLocalBusqueda(e.target.value)}
          className="w-full pl-10 pr-10 py-3.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-gray-800 transition-all duration-200"
        />
        {localBusqueda && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors p-1 hover:bg-gray-700/50 rounded active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mostrar últimos clientes cuando no hay búsqueda */}
      {!localBusqueda && ultimosClientes.length > 0 && (
        <div className="border border-gray-700/50 rounded-xl bg-gray-800/90 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="p-3 bg-gray-900/50 border-b border-gray-700/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <p className="text-lg text-gray-300 font-medium">Clientes Recientes</p>
              <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded-full">
                {ultimosClientes.length} de {clientesValidos.length}
              </span>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {ultimosClientes.map((cliente, index) => (
              <div
                key={cliente.id}
                onClick={() => handleSeleccionarCliente(cliente)}
                className={`p-4 hover:bg-gray-700/40 cursor-pointer border-b border-gray-700/30 last:border-b-0 transition-all duration-150 group active:scale-[0.99] ${
                  clienteAnimando === cliente.id ? 'bg-blue-500/20 scale-[0.98]' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gray-700 group-hover:bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110">
                      <span className="text-gray-300 group-hover:text-blue-300 font-semibold transition-colors">
                        {cliente.name?.charAt(0).toUpperCase() || '?'}
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
        </div>
      )}

      {/* Mostrar resultados de búsqueda */}
      {localBusqueda && (
        <div className="border border-gray-700/50 rounded-xl bg-gray-800/90 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {clientesFiltrados.length > 0 ? (
            <>
              <div className="p-2 bg-gray-900/50 border-b border-gray-700/50">
                <p className="text-xs text-gray-400 px-2">
                  {clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? 's' : ''} encontrado{clientesFiltrados.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {clientesPaginados.map((cliente, index) => (
                  <div
                    key={cliente.id}
                    onClick={() => handleSeleccionarCliente(cliente)}
                    className={`p-4 hover:bg-gray-700/40 cursor-pointer border-b border-gray-700/30 last:border-b-0 transition-all duration-150 group active:scale-[0.99] ${
                      clienteAnimando === cliente.id ? 'bg-blue-500/20 scale-[0.98]' : ''
                    }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gray-700 group-hover:bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110">
                          <span className="text-gray-300 group-hover:text-blue-300 font-semibold transition-colors">
                            {cliente.name?.charAt(0).toUpperCase() || '?'}
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
              
              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="p-3 bg-gray-900/50 border-t border-gray-700/50 flex items-center justify-between">
                  <button
                    onClick={handlePaginaAnterior}
                    disabled={paginaActual === 1}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all text-sm text-gray-300 active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </button>
                  
                  <span className="text-xs text-gray-400">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  
                  <button
                    onClick={handlePaginaSiguiente}
                    disabled={paginaActual === totalPaginas}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all text-sm text-gray-300 active:scale-95"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
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

      {/* Mensaje cuando no hay clientes */}
      {!localBusqueda && clientesValidos.length === 0 && (
        <div className="text-center py-8 text-gray-500 border border-gray-700/50 rounded-xl bg-gray-800/50">
          <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">No hay clientes registrados</p>
          <p className="text-sm text-gray-500 mt-1">Crea tu primer cliente para comenzar</p>
        </div>
      )}
      
    </div>
    )}
    </>
  )
})

export default ClienteSelector;