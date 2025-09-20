'use client'
import { useState, useEffect } from 'react'
import { OrdenDiagnostico, Cliente, Dispositivo } from '@/types/orden'
import { ArrowLeft, Save, Plus, Trash2, UserPlus, Monitor, Search, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
// IMPORTAR LOS HELPERS MULTI-USUARIO
import { 
  getClientesPorUsuario, 
  crearOrden,
  generarIdPersonalizado
} from '@/lib/multiuser-helpers'
import { obtenerProximoNumeroOrden, formatearIdOrden } from '@/lib/firebase-utils'

interface FormularioDiagnosticoProps {
  onClose: () => void
  onSuccess: () => void
}

export default function FormularioDiagnostico({ onClose, onSuccess }: FormularioDiagnosticoProps) {
  const router = useRouter()
  const { user } = useAuth() // OBTENER USUARIO AUTENTICADO
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [dispositivoSeleccionado, setDispositivoSeleccionado] = useState<Dispositivo | null>(null)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  
  // Campos específicos de diagnóstico
  const [observacionesIniciales, setObservacionesIniciales] = useState('')
  const [pruebasRealizadas, setPruebasRealizadas] = useState('')
  const [posiblesCausas, setPosiblesCausas] = useState('')
  const [contadorMaquina, setContadorMaquina] = useState<number>(0)
  const [fechaCompra, setFechaCompra] = useState<string>('')
  const [diagnosticoFinal, setDiagnosticoFinal] = useState('')
  const [recomendaciones, setRecomendaciones] = useState('')

  useEffect(() => {
    cargarClientes()
  }, [user?.uid])

  const cargarClientes = async () => {
    if (!user?.uid) return
    
    try {
      // USAR EL HELPER MULTI-USUARIO
      const clientesData = await getClientesPorUsuario(user.uid)
      setClientes(clientesData)
    } catch (error) {
      console.error('Error cargando clientes:', error)
    }
  }

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.name.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    cliente.email.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    cliente.phone.includes(busquedaCliente)
  )

  const seleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente)
    setDispositivoSeleccionado(null)
    setBusquedaCliente('')
  }

  const seleccionarDispositivo = (dispositivo: Dispositivo) => {
    setDispositivoSeleccionado(dispositivo)
    // Si el dispositivo tiene fecha de compra, establecerla automáticamente
    if (dispositivo.fechaCompra) {
      const fecha = new Date(dispositivo.fechaCompra)
      setFechaCompra(fecha.toISOString().split('T')[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      alert('Usuario no autenticado');
      return;
    }
    
    if (!clienteSeleccionado) {
      alert('Por favor seleccione un cliente');
      return;
    }
    
    if (!dispositivoSeleccionado) {
      alert('Por favor seleccione un dispositivo');
      return;
    }

    setLoading(true);

    try {
      // OBTENER NÚMERO CONSECUTIVO EN LUGAR DE ID PERSONALIZADO ALEATORIO
      const proximoNumero = await obtenerProximoNumeroOrden('diagnostico');
      const idPersonalizado = formatearIdOrden(proximoNumero, 'diagnostico');

      // Crear la orden de diagnóstico
      const nuevaOrden: Omit<OrdenDiagnostico, 'id'> = {
        tipo: 'diagnostico',
        idPersonalizado, // USAR EL ID CONSECUTIVO
        userId: user.uid, // INCLUIR EL USER ID
        cliente: clienteSeleccionado,
        dispositivo: dispositivoSeleccionado,
        fechaCreacion: new Date(),
        observacionesIniciales,
        pruebasRealizadas,
        posiblesCausas,
        contadorMaquina: contadorMaquina > 0 ? contadorMaquina : undefined,
        fechaCompra: fechaCompra ? new Date(fechaCompra) : undefined,
        diagnosticoFinal,
        recomendaciones
      }

      // USAR EL HELPER MULTI-USUARIO PARA CREAR LA ORDEN
      await crearOrden(nuevaOrden, user.uid);
      
      console.log('Orden de diagnóstico creada exitosamente con ID:', idPersonalizado);
      onSuccess();
    } catch (error) {
      console.error('Error creando orden de diagnóstico:', error);
      alert('Error al crear la orden: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // VERIFICAR QUE EL USUARIO ESTÉ AUTENTICADO
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Debes iniciar sesión para crear órdenes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onClose} 
              className="text-blue-400 hover:text-blue-300 p-1 rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Nueva Orden de Diagnóstico</h1>
              <p className="text-gray-400">Complete la información del cliente, dispositivo y el diagnóstico</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de Cliente */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Selecciona el Cliente</h2>
              <button
                type="button"
                onClick={() => router.push('/clientes/nuevo')}
                className="text-blue-400 hover:text-blue-300 flex items-center text-sm transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Nuevo Cliente
              </button>
            </div>
            
            {!clienteSeleccionado ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente por nombre, email o teléfono..."
                    value={busquedaCliente}
                    onChange={(e) => setBusquedaCliente(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                
                {busquedaCliente && (
                  <div className="max-h-60 overflow-y-auto border border-gray-700 rounded-lg bg-gray-800">
                    {clientesFiltrados.length > 0 ? (
                      clientesFiltrados.map((cliente) => (
                        <div
                          key={cliente.id}
                          onClick={() => seleccionarCliente(cliente)}
                          className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-white">{cliente.name}</div>
                          <div className="text-sm text-gray-300">{cliente.email} | {cliente.phone}</div>
                          <div className="text-xs text-gray-500">{cliente.dispositivos?.length || 0} dispositivo(s)</div>
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
            ) : (
              <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-blue-300">{clienteSeleccionado.name}</h3>
                    <p className="text-sm text-blue-400/80">{clienteSeleccionado.email} | {clienteSeleccionado.phone}</p>
                    <p className="text-sm text-blue-400/70">{clienteSeleccionado.address}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClienteSeleccionado(null)}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Selección de Dispositivo */}
          {clienteSeleccionado && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Monitor className="w-5 h-5 mr-2 text-blue-400" />
                Seleccionar Dispositivo
              </h2>
              
              {!dispositivoSeleccionado ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clienteSeleccionado.dispositivos && clienteSeleccionado.dispositivos.length > 0 ? (
                    clienteSeleccionado.dispositivos.map((dispositivo) => (
                      <div
                        key={dispositivo.id}
                        onClick={() => seleccionarDispositivo(dispositivo)}
                        className="p-4 border border-gray-700 rounded-lg hover:bg-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
                      >
                        <div className="font-medium text-white">{dispositivo.tipo}</div>
                        <div className="text-sm text-gray-300">{dispositivo.marca} {dispositivo.modelo}</div>
                        <div className="text-xs text-gray-500">S/N: {dispositivo.numeroSerie}</div>
                        {dispositivo.fechaCompra && (
                          <div className="text-xs text-gray-500 mt-1">
                            Comprado: {new Date(dispositivo.fechaCompra).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <Monitor className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-400">Este cliente no tiene dispositivos registrados</p>
                      <button
                        type="button"
                        onClick={() => router.push(`/clientes/${clienteSeleccionado.id}/editar`)}
                        className="mt-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                      >
                        Agregar dispositivos al cliente
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-blue-300">{dispositivoSeleccionado.tipo}</h3>
                      <p className="text-sm text-blue-400/80">{dispositivoSeleccionado.marca} {dispositivoSeleccionado.modelo}</p>
                      <p className="text-sm text-blue-400/70">S/N: {dispositivoSeleccionado.numeroSerie}</p>
                      {dispositivoSeleccionado.fechaCompra && (
                        <p className="text-sm text-blue-400/60">
                          Fecha compra: {new Date(dispositivoSeleccionado.fechaCompra).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDispositivoSeleccionado(null)}
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Información del Diagnóstico - Solo visible si hay cliente y dispositivo seleccionados */}
          {clienteSeleccionado && dispositivoSeleccionado && (
            <>
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Información del Diagnóstico</h2>
                
                {/* Fecha de compra y contador */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fecha de Compra (Opcional)
                    </label>
                    <div className="relative">
                      <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={fechaCompra}
                        onChange={(e) => setFechaCompra(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contador de Máquina (Opcional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={contadorMaquina}
                      onChange={(e) => setContadorMaquina(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Ingrese el contador actual..."
                    />
                  </div>
                </div>

                {/* Observaciones Iniciales */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Observaciones Iniciales *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={observacionesIniciales}
                    onChange={(e) => setObservacionesIniciales(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Describa las observaciones iniciales del equipo y los síntomas reportados..."
                  />
                </div>

                {/* Pruebas Realizadas */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pruebas Realizadas *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={pruebasRealizadas}
                    onChange={(e) => setPruebasRealizadas(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Describa las pruebas realizadas para diagnosticar el problema..."
                  />
                </div>

                {/* Posibles Causas */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Posibles Causas *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={posiblesCausas}
                    onChange={(e) => setPosiblesCausas(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enumere las posibles causas del problema identificadas durante el diagnóstico..."
                  />
                </div>

                {/* Diagnóstico Final */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Diagnóstico Final *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={diagnosticoFinal}
                    onChange={(e) => setDiagnosticoFinal(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Describa el diagnóstico final y la causa raíz del problema..."
                  />
                </div>

                {/* Recomendaciones */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recomendaciones *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={recomendaciones}
                    onChange={(e) => setRecomendaciones(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Proporcione recomendaciones para la reparación, mantenimiento o próximos pasos..."
                  />
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Guardando...' : 'Guardar Diagnóstico'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}