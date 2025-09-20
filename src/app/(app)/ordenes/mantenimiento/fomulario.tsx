'use client'
import { useState, useEffect } from 'react'
import { OrdenMantenimiento, Cliente, Dispositivo } from '@/types/orden'
import { ArrowLeft, Monitor } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { 
  getClientesPorUsuario, 
  crearOrden,
} from '@/lib/multiuser-helpers'
import { obtenerProximoNumeroOrden, formatearIdOrden } from '@/lib/firebase-utils'

// Componentes importados
import Section from '@/components/ui/basic/Section'
import ClienteSelector from '@/components/forms/ClienteSelector'
import DispositivoSelector from '@/components/forms/DispositivoSelector'
import MantenimientoInfo from '@/components/forms/MantenimientoInfo'
import EstadoInput from '@/components/forms/EstadoInput'
import GarantiaInput from '@/components/forms/GarantiaInput'
import FormActions from '@/components/forms/FormActions'

interface FormularioMantenimientoProps {
  onClose: () => void
  onSuccess: () => void
}

interface Pieza {
  pieza: string
  cantidad: number
}

export default function FormularioMantenimiento({ onClose, onSuccess }: FormularioMantenimientoProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  // Estado para clientes y dispositivos
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [dispositivoSeleccionado, setDispositivoSeleccionado] = useState<Dispositivo | null>(null)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  
  // Estado para mantenimiento
  const [tipoMantenimiento, setTipoMantenimiento] = useState<'preventivo' | 'correctivo'>('preventivo')
  const [tareasPersonalizadas, setTareasPersonalizadas] = useState<string[]>([''])
  const [tareasSeleccionadas, setTareasSeleccionadas] = useState<string[]>([])
  const [mostrarTareasPredefinidas, setMostrarTareasPredefinidas] = useState(true)
  const [piezasUsadas, setPiezasUsadas] = useState<Pieza[]>([])
  
  // Estado para condición del equipo
  const [estadoAntes, setEstadoAntes] = useState<string[]>([''])
  const [estadoDespues, setEstadoDespues] = useState<string[]>([''])
  
  // Estado para garantía
  const [garantiaDescripcion, setGarantiaDescripcion] = useState('')
  const [garantiaTiempoDesde, setGarantiaTiempoDesde] = useState<string>('')
  const [garantiaTiempoHasta, setGarantiaTiempoHasta] = useState<string>('')
  const [mesesGarantia, setMesesGarantia] = useState<number>(3)
  
  // Estado para secciones colapsables
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    cliente: true,
    dispositivo: true,
    mantenimiento: true,
    estado: true,
    garantia: true
  })

  useEffect(() => {
    cargarClientes()
    const hoy = new Date().toISOString().split('T')[0]
    setGarantiaTiempoDesde(hoy)
  }, [user?.uid])

  useEffect(() => {
    if (mesesGarantia > 0 && garantiaTiempoDesde) {
      const fechaDesde = new Date(garantiaTiempoDesde)
      const fechaHasta = new Date(fechaDesde)
      fechaHasta.setMonth(fechaHasta.getMonth() + mesesGarantia)
      setGarantiaTiempoHasta(fechaHasta.toISOString().split('T')[0])
    } else {
      setGarantiaTiempoHasta('')
    }
  }, [mesesGarantia, garantiaTiempoDesde])

  useEffect(() => {
    setTareasSeleccionadas([])
    setTareasPersonalizadas([''])
  }, [tipoMantenimiento])

  const cargarClientes = async () => {
    if (!user?.uid) return
    
    try {
      const clientesData = await getClientesPorUsuario(user.uid)
      setClientes(clientesData)
    } catch (error) {
      console.error('Error cargando clientes:', error)
    }
  }

  const toggleSeccion = (seccion: keyof typeof seccionesAbiertas) => {
    setSeccionesAbiertas(prev => ({
      ...prev,
      [seccion]: !prev[seccion]
    }))
  }

  // Handlers para cliente
  const handleSeleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente)
    setDispositivoSeleccionado(null)
    setBusquedaCliente('')
  }

  const handleDesseleccionarCliente = () => {
    setClienteSeleccionado(null)
    setDispositivoSeleccionado(null)
  }

  // Handlers para dispositivo
  const handleSeleccionarDispositivo = (dispositivo: Dispositivo) => {
    setDispositivoSeleccionado(dispositivo)
  }

  const handleDesseleccionarDispositivo = () => {
    setDispositivoSeleccionado(null)
  }

  // Handlers para tareas
  const handleToggleTareaPredefinida = (tarea: string) => {
    setTareasSeleccionadas(prev => {
      if (prev.includes(tarea)) {
        return prev.filter(t => t !== tarea)
      } else {
        return [...prev, tarea]
      }
    })
  }

  const handleActualizarTareaPersonalizada = (index: number, valor: string) => {
    const nuevasTareas = [...tareasPersonalizadas]
    nuevasTareas[index] = valor
    setTareasPersonalizadas(nuevasTareas)
  }

  const handleAgregarTareaPersonalizada = () => {
    setTareasPersonalizadas([...tareasPersonalizadas, ''])
  }

  const handleEliminarTareaPersonalizada = (index: number) => {
    setTareasPersonalizadas(tareasPersonalizadas.filter((_, i) => i !== index))
  }

  // Handlers para piezas
  const handleActualizarPieza = (index: number, campo: string, valor: any) => {
    const nuevasPiezas = [...piezasUsadas]
    nuevasPiezas[index] = { ...nuevasPiezas[index], [campo]: valor }
    setPiezasUsadas(nuevasPiezas)
  }

  const handleAgregarPieza = () => {
    setPiezasUsadas([...piezasUsadas, { pieza: '', cantidad: 1 }])
  }

  const handleEliminarPieza = (index: number) => {
    setPiezasUsadas(piezasUsadas.filter((_, i) => i !== index))
  }

  // Handlers para estado
  const handleActualizarEstadoAntes = (index: number, valor: string) => {
    const nuevosEstados = [...estadoAntes]
    nuevosEstados[index] = valor
    setEstadoAntes(nuevosEstados)
  }

  const handleAgregarEstadoAntes = () => {
    setEstadoAntes([...estadoAntes, ''])
  }

  const handleEliminarEstadoAntes = (index: number) => {
    setEstadoAntes(estadoAntes.filter((_, i) => i !== index))
  }

  const handleActualizarEstadoDespues = (index: number, valor: string) => {
    const nuevosEstados = [...estadoDespues]
    nuevosEstados[index] = valor
    setEstadoDespues(nuevosEstados)
  }

  const handleAgregarEstadoDespues = () => {
    setEstadoDespues([...estadoDespues, ''])
  }

  const handleEliminarEstadoDespues = (index: number) => {
    setEstadoDespues(estadoDespues.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.uid) {
      alert('Usuario no autenticado')
      return
    }
    
    if (!clienteSeleccionado) {
      alert('Por favor seleccione un cliente')
      return
    }
    
    if (!dispositivoSeleccionado) {
      alert('Por favor seleccione un dispositivo')
      return
    }

    const todasLasTareas = [
      ...tareasSeleccionadas,
      ...tareasPersonalizadas.filter(tarea => tarea.trim() !== '')
    ]

    if (todasLasTareas.length === 0) {
      alert('Por favor agregue al menos una tarea realizada')
      return
    }

    setLoading(true)

    try {
      const proximoNumero = await obtenerProximoNumeroOrden('mantenimiento')
      const idPersonalizado = formatearIdOrden(proximoNumero, 'mantenimiento')

      const piezasUsadasFiltradas = piezasUsadas
        .filter(pieza => pieza.pieza.trim() !== '')
        .map(pieza => ({
          pieza: pieza.pieza,
          cantidad: pieza.cantidad,
        }))

      const nuevaOrden: Omit<OrdenMantenimiento, 'id'> = {
        tipo: 'mantenimiento',
        horaCreacion: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cliente: clienteSeleccionado,
        dispositivo: dispositivoSeleccionado,
        fechaCreacion: new Date(),
        tipoMantenimiento,
        tareasRealizadas: todasLasTareas,
        piezasUsadas: piezasUsadasFiltradas.length > 0 ? piezasUsadasFiltradas : [],
        estadoAntes: estadoAntes.filter(estado => estado.trim() !== ''),
        estadoDespues: estadoDespues.filter(estado => estado.trim() !== ''),
        garantiaTiempoDesde: garantiaTiempoDesde ? new Date(garantiaTiempoDesde) : null,
        garantiaTiempoHasta: garantiaTiempoHasta ? new Date(garantiaTiempoHasta) : null,
        garantiaDescripcion,
        idPersonalizado,
        userId: user.uid,
      }

      await crearOrden(nuevaOrden, user.uid)
      console.log('Orden creada exitosamente con ID:', idPersonalizado)
      onSuccess()
    } catch (error) {
      console.error('Error creando orden:', error)
      alert('Error al crear la orden: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onClose} 
              className="text-blue-400 hover:text-blue-300 p-2 rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Nueva Orden de Mantenimiento</h1>
              <p className="text-gray-400 mt-1">Complete la información del cliente, dispositivo y el trabajo realizado</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Selección de Cliente */}
          <Section
            title="Selecciona el Cliente"
            colorClass="bg-blue-500"
            isOpen={seccionesAbiertas.cliente}
            onToggle={() => toggleSeccion('cliente')}
          >
            <ClienteSelector
              clientes={clientes}
              clienteSeleccionado={clienteSeleccionado}
              busquedaCliente={busquedaCliente}
              setBusquedaCliente={setBusquedaCliente}
              onSeleccionarCliente={handleSeleccionarCliente}
              onDesseleccionarCliente={handleDesseleccionarCliente}
            />
          </Section>

          {/* Selección de Dispositivo */}
          {clienteSeleccionado && (
            <Section
              title="Seleccionar Dispositivo"
              icon={<Monitor className="w-5 h-5 text-green-400" />}
              colorClass="bg-green-500"
              isOpen={seccionesAbiertas.dispositivo}
              onToggle={() => toggleSeccion('dispositivo')}
            >
              <DispositivoSelector
                cliente={clienteSeleccionado}
                dispositivoSeleccionado={dispositivoSeleccionado}
                onSeleccionarDispositivo={handleSeleccionarDispositivo}
                onDesseleccionarDispositivo={handleDesseleccionarDispositivo}
              />
            </Section>
          )}

          {/* Información del Mantenimiento */}
          {clienteSeleccionado && dispositivoSeleccionado && (
            <>
              <Section
                title="Información del Mantenimiento"
                colorClass="bg-purple-500"
                isOpen={seccionesAbiertas.mantenimiento}
                onToggle={() => toggleSeccion('mantenimiento')}
              >
                <MantenimientoInfo
                  tipoMantenimiento={tipoMantenimiento}
                  tareasSeleccionadas={tareasSeleccionadas}
                  tareasPersonalizadas={tareasPersonalizadas}
                  piezasUsadas={piezasUsadas}
                  mostrarTareasPredefinidas={mostrarTareasPredefinidas}
                  onCambiarTipoMantenimiento={setTipoMantenimiento}
                  onToggleTareaPredefinida={handleToggleTareaPredefinida}
                  onSetMostrarTareasPredefinidas={setMostrarTareasPredefinidas}
                  onActualizarTareaPersonalizada={handleActualizarTareaPersonalizada}
                  onAgregarTareaPersonalizada={handleAgregarTareaPersonalizada}
                  onEliminarTareaPersonalizada={handleEliminarTareaPersonalizada}
                  onActualizarPieza={handleActualizarPieza}
                  onAgregarPieza={handleAgregarPieza}
                  onEliminarPieza={handleEliminarPieza}
                />
              </Section>

              {/* Estado del Equipo */}
              <Section
                title="Estado del Equipo"
                colorClass="bg-yellow-500"
                isOpen={seccionesAbiertas.estado}
                onToggle={() => toggleSeccion('estado')}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EstadoInput
                    tipo="antes"
                    estados={estadoAntes}
                    onActualizar={handleActualizarEstadoAntes}
                    onAgregar={handleAgregarEstadoAntes}
                    onEliminar={handleEliminarEstadoAntes}
                  />
                  <EstadoInput
                    tipo="despues"
                    estados={estadoDespues}
                    onActualizar={handleActualizarEstadoDespues}
                    onAgregar={handleAgregarEstadoDespues}
                    onEliminar={handleEliminarEstadoDespues}
                  />
                </div>
              </Section>

              {/* Garantía */}
              <Section
                title="Garantía del Trabajo"
                colorClass="bg-red-500"
                isOpen={seccionesAbiertas.garantia}
                onToggle={() => toggleSeccion('garantia')}
              >
                <GarantiaInput
                  garantiaTiempoDesde={garantiaTiempoDesde}
                  garantiaTiempoHasta={garantiaTiempoHasta}
                  mesesGarantia={mesesGarantia}
                  garantiaDescripcion={garantiaDescripcion}
                  onCambiarFechaDesde={setGarantiaTiempoDesde}
                  onCambiarMeses={setMesesGarantia}
                  onCambiarDescripcion={setGarantiaDescripcion}
                />
              </Section>

              {/* Botones de Acción */}
              <FormActions
                loading={loading}
                tareasSeleccionadas={tareasSeleccionadas}
                tareasPersonalizadas={tareasPersonalizadas}
                onCancel={onClose}
              />
            </>
          )}
        </form>
      </div>
    </div>
  )
}