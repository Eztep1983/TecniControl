//mantenimiento/formulario.tsx
//Formulario padre
'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { OrdenMantenimiento, Cliente, Dispositivo } from '@/types/orden'
import { ArrowLeft, Monitor, ChevronRight, ChevronLeft, CheckCircle, Users, Wrench, ClipboardCheck, GaugeCircle, Laptop, ShieldCheck } from 'lucide-react'
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
import GarantiaInput from '@/components/forms/GarantiaInput'
import ContadorInput, { Contador } from '@/components/forms/ContadorInput'

interface FormularioMantenimientoProps {
  onClose: () => void
  onSuccess: () => void
}

// Interface de Pieza compatible con PiezasInput optimizado
interface Pieza {
  pieza: string
  cantidad: number
  tipo?: 'predefinida' | 'personalizada'
  idPredefinida?: string
}

// Definir los pasos del formulario
type FormStep = 'cliente' | 'dispositivo' | 'mantenimiento' | 'contador' | 'garantia' | 'resumen'

// Configuración de pasos
const STEPS_CONFIG = [
  {
    key: 'cliente' as FormStep,
    title: 'Cliente',
    description: 'Selecciona el cliente',
    icon: <Users className="w-5 h-5" />
  },
  {
    key: 'dispositivo' as FormStep,
    title: 'Dispositivo',
    description: 'Elige el dispositivo',
    icon: <Laptop className="w-5 h-5" />
  },
  {
    key: 'mantenimiento' as FormStep,
    title: 'Trabajo',
    description: 'Detalla el trabajo',
    icon: <Wrench className="w-5 h-5" />
  },
  {
    key: 'contador' as FormStep,
    title: 'Contador',
    description: 'Registro opcional',
    icon: <GaugeCircle className="w-5 h-5" />
  },
  {
    key: 'garantia' as FormStep,
    title: 'Garantía',
    description: 'Configura garantía',
    icon: <ShieldCheck className="w-5 h-5" />
  },
  {
    key: 'resumen' as FormStep,
    title: 'Resumen',
    description: 'Revisa y confirma',
    icon: <ClipboardCheck className="w-5 h-5" />
  }
] as const

export default function FormularioMantenimiento({ onClose, onSuccess }: FormularioMantenimientoProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<FormStep>('cliente')
  
  // Estado para clientes y dispositivos
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [dispositivoSeleccionado, setDispositivoSeleccionado] = useState<Dispositivo | null>(null)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  
  // Estado para mantenimiento
  const [tipoMantenimiento, setTipoMantenimiento] = useState<'preventivo' | 'correctivo' | 'diagnostico'>('preventivo')
  const [tareasPersonalizadas, setTareasPersonalizadas] = useState<string[]>([''])
  const [tareasSeleccionadas, setTareasSeleccionadas] = useState<string[]>([])
  const [mostrarTareasPredefinidas, setMostrarTareasPredefinidas] = useState(true)
  const [piezasUsadas, setPiezasUsadas] = useState<Pieza[]>([])
  
  // Estados para diagnóstico
  const [observacionesIniciales, setObservacionesIniciales] = useState('')
  const [pruebasRealizadas, setPruebasRealizadas] = useState('')
  const [diagnosticoFinal, setDiagnosticoFinal] = useState('')
  const [contadorMaquina, setContadorMaquina] = useState<number | undefined>(undefined)
  
  // Estado para garantía
  const [garantiaDescripcion, setGarantiaDescripcion] = useState('')
  const [garantiaTiempoDesde, setGarantiaTiempoDesde] = useState<string>('')
  const [garantiaTiempoHasta, setGarantiaTiempoHasta] = useState<string>('')
  const [mesesGarantia, setMesesGarantia] = useState<number>(3)
  
  // Estado para contador
  const [contador, setContador] = useState<Contador | null>(null)
  const [mostrarContador, setMostrarContador] = useState(false)

  // Cargar clientes al montar
  useEffect(() => {
    if (!user?.uid) return
    
    let mounted = true
    
    const cargarClientes = async () => {
      try {
        const clientesData = await getClientesPorUsuario(user.uid)
        if (mounted) {
          setClientes(clientesData)
        }
      } catch (error) {
        console.error('Error cargando clientes:', error)
      }
    }

    cargarClientes()
    
    return () => {
      mounted = false
    }
  }, [user?.uid])

  // Inicializar fecha de garantía
  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0]
    setGarantiaTiempoDesde(hoy)
  }, [])

  // Calcular fecha hasta de garantía
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

  // Limpiar datos al cambiar tipo de mantenimiento
  useEffect(() => {
    setTareasSeleccionadas([])
    setTareasPersonalizadas([''])
    setPiezasUsadas([])
    
    if (tipoMantenimiento !== 'diagnostico') {
      setObservacionesIniciales('')
      setPruebasRealizadas('')
      setDiagnosticoFinal('')
      setContadorMaquina(undefined)
    }
  }, [tipoMantenimiento])

  // ============================================================================
  // HANDLERS - Navegación
  // ============================================================================
  const nextStep = useCallback(() => {
    const currentIndex = STEPS_CONFIG.findIndex(step => step.key === currentStep)
    if (currentIndex < STEPS_CONFIG.length - 1) {
      setCurrentStep(STEPS_CONFIG[currentIndex + 1].key)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep])

  const prevStep = useCallback(() => {
    const currentIndex = STEPS_CONFIG.findIndex(step => step.key === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEPS_CONFIG[currentIndex - 1].key)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep])

  // ============================================================================
  // VALIDACIONES
  // ============================================================================
  const canProceedToNextStep = useCallback((): boolean => {
    switch (currentStep) {
      case 'cliente':
        return clienteSeleccionado !== null
      case 'dispositivo':
        return dispositivoSeleccionado !== null
      case 'mantenimiento':
        if (tipoMantenimiento === 'diagnostico') {
          return !!(
            observacionesIniciales.trim() &&
            pruebasRealizadas.trim() &&
            diagnosticoFinal.trim()
          )
        } else {
          const todasLasTareas = [
            ...tareasSeleccionadas,
            ...tareasPersonalizadas.filter(t => t.trim())
          ]
          return todasLasTareas.length > 0
        }
      case 'contador':
      case 'garantia':
      case 'resumen':
        return true
      default:
        return false
    }
  }, [
    currentStep,
    clienteSeleccionado,
    dispositivoSeleccionado,
    tipoMantenimiento,
    observacionesIniciales,
    pruebasRealizadas,
    diagnosticoFinal,
    tareasSeleccionadas,
    tareasPersonalizadas
  ])

  // ============================================================================
  // HANDLERS - Cliente
  // ============================================================================
  const handleSeleccionarCliente = useCallback((cliente: Cliente) => {
    setClienteSeleccionado(cliente)
    setDispositivoSeleccionado(null)
    setBusquedaCliente('')
  }, [])

  const handleDesseleccionarCliente = useCallback(() => {
    setClienteSeleccionado(null)
    setDispositivoSeleccionado(null)
  }, [])

  // ============================================================================
  // HANDLERS - Dispositivo
  // ============================================================================
  const handleSeleccionarDispositivo = useCallback((dispositivo: Dispositivo) => {
    setDispositivoSeleccionado(dispositivo)
  }, [])

  const handleDesseleccionarDispositivo = useCallback(() => {
    setDispositivoSeleccionado(null)
  }, [])

  // ============================================================================
  // HANDLERS - Tareas
  // ============================================================================
  const handleToggleTareaPredefinida = useCallback((tarea: string) => {
    setTareasSeleccionadas(prev => {
      if (prev.includes(tarea)) {
        return prev.filter(t => t !== tarea)
      } else {
        return [...prev, tarea]
      }
    })
  }, [])

  const handleActualizarTareaPersonalizada = useCallback((index: number, valor: string) => {
    setTareasPersonalizadas(prev => {
      const nuevasTareas = [...prev]
      nuevasTareas[index] = valor
      return nuevasTareas
    })
  }, [])

  const handleAgregarTareaPersonalizada = useCallback(() => {
    setTareasPersonalizadas(prev => [...prev, ''])
  }, [])

  const handleEliminarTareaPersonalizada = useCallback((index: number) => {
    setTareasPersonalizadas(prev => prev.filter((_, i) => i !== index))
  }, [])

  // ============================================================================
  // HANDLERS - Contador
  // ============================================================================
  const handleToggleContador = useCallback(() => {
    setMostrarContador(prev => {
      const nuevoEstado = !prev
      
      if (nuevoEstado && !contador) {
        const hoy = new Date().toISOString().split('T')[0]
        setContador({
          tipo: 'unidades',
          valor: 0,
          fechaRegistro: hoy,
          notas: ''
        })
      }
      
      if (!nuevoEstado) {
        setContador(null)
      }
      
      return nuevoEstado
    })
  }, [contador])

  const handleCambiarContador = useCallback((nuevoContador: Contador | null) => {
    setContador(nuevoContador)
  }, [])

  // ============================================================================
  // SUBMIT
  // ============================================================================
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (!user?.uid) {
    alert('Usuario no autenticado')
    return
  }

  setLoading(true)

  try {
    const proximoNumero = await obtenerProximoNumeroOrden('mantenimiento')
    const idPersonalizado = formatearIdOrden(proximoNumero, 'mantenimiento')

    const todasLasTareas = [
      ...tareasSeleccionadas,
      ...tareasPersonalizadas.filter(t => t.trim())
    ]

    // Filtrar y limpiar piezas antes de guardar
    const piezasUsadasFiltradas = piezasUsadas
      .filter(pieza => pieza?.pieza?.trim())
      .map(pieza => ({
        pieza: pieza.pieza,
        cantidad: pieza.cantidad || 1
      }))

    // ✅ PREPARAR CONTADOR CORRECTAMENTE - EVITAR undefined
    let contadorParaGuardar: any = null
    
    if (mostrarContador && contador) {
      // Solo incluir contador si está activo Y tiene datos válidos
      contadorParaGuardar = {
        tipo: contador.tipo,
        valor: contador.valor || 0,
        fechaRegistro: new Date(contador.fechaRegistro)
      }
      
      // Solo agregar campos opcionales si tienen valor
      if (contador.unidadPersonalizada && contador.unidadPersonalizada.trim()) {
        contadorParaGuardar.unidadPersonalizada = contador.unidadPersonalizada.trim()
      }
      
      if (contador.notas && contador.notas.trim()) {
        contadorParaGuardar.notas = contador.notas.trim()
      }
    }

    // ✅ CREAR OBJETO BASE SIN CAMPOS UNDEFINED
    const nuevaOrden: any = {
      tipo: 'mantenimiento',
      horaCreacion: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cliente: clienteSeleccionado!,
      dispositivo: dispositivoSeleccionado!,
      fechaCreacion: new Date(),
      tipoMantenimiento,
      tareasRealizadas: todasLasTareas,
      piezasUsadas: piezasUsadasFiltradas,
      idPersonalizado,
      userId: user.uid,
    }

    // ✅ SOLO AGREGAR CONTADOR SI EXISTE
    if (contadorParaGuardar) {
      nuevaOrden.contador = contadorParaGuardar
    }
    
    // ✅ Campos de diagnóstico - Solo si es diagnóstico
    if (tipoMantenimiento === 'diagnostico') {
      nuevaOrden.observacionesIniciales = observacionesIniciales.trim()
      nuevaOrden.pruebasRealizadas = pruebasRealizadas.trim()
      nuevaOrden.diagnosticoFinal = diagnosticoFinal.trim()
      
      // Solo agregar contadorMaquina si tiene valor
      if (contadorMaquina !== undefined && contadorMaquina !== null) {
        nuevaOrden.contadorMaquina = contadorMaquina
      }
    }
    
    // ✅ Garantía - Solo agregar si tienen valores
    if (garantiaTiempoDesde) {
      nuevaOrden.garantiaTiempoDesde = new Date(garantiaTiempoDesde)
    }
    
    if (garantiaTiempoHasta) {
      nuevaOrden.garantiaTiempoHasta = new Date(garantiaTiempoHasta)
    }
    
    if (garantiaDescripcion && garantiaDescripcion.trim()) {
      nuevaOrden.garantiaDescripcion = garantiaDescripcion.trim()
    }

    // ✅ VALIDACIÓN FINAL: Eliminar cualquier campo undefined
    Object.keys(nuevaOrden).forEach(key => {
      if (nuevaOrden[key] === undefined) {
        delete nuevaOrden[key]
      }
    })

    console.log('📦 Datos a guardar:', nuevaOrden) // Para debug

    await crearOrden(nuevaOrden, user.uid)
    onSuccess()
  } catch (error) {
    console.error('Error creando orden:', error)
    alert('Error al crear la orden: ' + (error instanceof Error ? error.message : 'Error desconocido'))
  } finally {
    setLoading(false)
  }
}

  // ============================================================================
  // UTILIDADES
  // ============================================================================
  const getTipoMantenimientoLabel = useMemo(() => {
    const labels = {
      preventivo: 'Preventivo',
      correctivo: 'Correctivo',
      diagnostico: 'Diagnóstico'
    }
    return labels[tipoMantenimiento]
  }, [tipoMantenimiento])

  const getTipoMantenimientoColor = useMemo(() => {
    const colors = {
      preventivo: 'bg-green-600/20 text-green-400 border-green-500/30',
      correctivo: 'bg-orange-600/20 text-orange-400 border-orange-500/30',
      diagnostico: 'bg-blue-600/20 text-blue-400 border-blue-500/30'
    }
    return colors[tipoMantenimiento]
  }, [tipoMantenimiento])

  // Memoizar props para componentes
const mantenimientoInfoProps = useMemo(() => ({
  tipoMantenimiento,
  tareasSeleccionadas,
  tareasPersonalizadas,
  piezasUsadas,
  setPiezasUsadas,  // ✅ Agregar esto
  mostrarTareasPredefinidas,
  observacionesIniciales,
  pruebasRealizadas,
  diagnosticoFinal,
  onCambiarTipoMantenimiento: setTipoMantenimiento,
  onToggleTareaPredefinida: handleToggleTareaPredefinida,
  onSetMostrarTareasPredefinidas: setMostrarTareasPredefinidas,
  onActualizarTareaPersonalizada: handleActualizarTareaPersonalizada,
  onAgregarTareaPersonalizada: handleAgregarTareaPersonalizada,
  onEliminarTareaPersonalizada: handleEliminarTareaPersonalizada,
  onCambiarObservaciones: setObservacionesIniciales,
  onCambiarPruebas: setPruebasRealizadas,
  onCambiarDiagnostico: setDiagnosticoFinal,
}), [
  tipoMantenimiento,
  tareasSeleccionadas,
  tareasPersonalizadas,
  piezasUsadas,
  mostrarTareasPredefinidas,
  observacionesIniciales,
  pruebasRealizadas,
  diagnosticoFinal,
  handleToggleTareaPredefinida,
  handleActualizarTareaPersonalizada,
  handleAgregarTareaPersonalizada,
  handleEliminarTareaPersonalizada,
])

  // ============================================================================
  // RENDER - Paso actual
  // ============================================================================
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'cliente':
        return (
          <Section title="Selecciona el Cliente" colorClass="bg-blue-500" isOpen={true}>
            <ClienteSelector
              clientes={clientes}
              clienteSeleccionado={clienteSeleccionado}
              busquedaCliente={busquedaCliente}
              setBusquedaCliente={setBusquedaCliente}
              onSeleccionarCliente={handleSeleccionarCliente}
              onDesseleccionarCliente={handleDesseleccionarCliente}
            />
          </Section>
        )

      case 'dispositivo':
        return (
          <Section
            title="Selecciona el Dispositivo del Cliente"
            icon={<Monitor className="w-5 h-5 text-green-400" />}
            colorClass="bg-green-500"
            isOpen={true}
          >
            <DispositivoSelector
              cliente={clienteSeleccionado!}
              dispositivoSeleccionado={dispositivoSeleccionado}
              onSeleccionarDispositivo={handleSeleccionarDispositivo}
              onDesseleccionarDispositivo={handleDesseleccionarDispositivo}
            />
          </Section>
        )

      case 'mantenimiento':
        return (
          <Section title="Información del Mantenimiento" colorClass="bg-purple-500" isOpen={true}>
            <MantenimientoInfo {...mantenimientoInfoProps} />
          </Section>
        )

      case 'contador':
        return (
          <Section title="Contador del Dispositivo (Opcional)" colorClass="bg-amber-500" isOpen={true}>
            <ContadorInput
              contador={contador}
              mostrarContador={mostrarContador}
              onToggleContador={handleToggleContador}
              onChangeContador={handleCambiarContador}
            />
          </Section>
        )

      case 'garantia':
        return (
          <Section title="Garantía del Trabajo" colorClass="bg-red-500" isOpen={true}>
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
        )

      case 'resumen':
        return (
          <Section title="Resumen de la Orden" colorClass="bg-indigo-500" isOpen={true}>
            <div className="space-y-6 text-white">
              {/* Información Principal */}
              <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-semibold text-blue-300 uppercase tracking-wide">Cliente</h3>
                    <p className="text-base sm:text-lg font-medium">{clienteSeleccionado?.name}</p>
                    {clienteSeleccionado?.phone && (
                      <p className="text-xs sm:text-sm text-gray-400">{clienteSeleccionado.phone}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-semibold text-green-300 uppercase tracking-wide">Dispositivo</h3>
                    <p className="text-base sm:text-lg font-medium">{dispositivoSeleccionado?.tipo}</p>
                    {dispositivoSeleccionado?.numeroSerie && (
                      <p className="text-xs sm:text-sm text-gray-400">S/N: {dispositivoSeleccionado.numeroSerie}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Mantenimiento/Diagnóstico */}
              <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 space-y-3">
                <h3 className="text-xs sm:text-sm font-semibold text-purple-300 uppercase tracking-wide">
                  {tipoMantenimiento === 'diagnostico' ? 'Diagnóstico' : 'Mantenimiento'}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Tipo:</span>
                  <span className={`text-base font-medium capitalize px-3 py-1 rounded-full border ${getTipoMantenimientoColor}`}>
                    {getTipoMantenimientoLabel}
                  </span>
                </div>
                
                {tipoMantenimiento === 'diagnostico' ? (
                  <div className="pt-2 border-t border-gray-700 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Observaciones iniciales</p>
                      <p className="text-sm text-gray-300 line-clamp-3">{observacionesIniciales}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Diagnóstico final</p>
                      <p className="text-sm text-gray-300 line-clamp-3">{diagnosticoFinal}</p>
                    </div>
                    {contadorMaquina !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Contador de máquina</p>
                        <p className="text-lg font-semibold text-purple-400">{contadorMaquina.toLocaleString()} unidades</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="pt-2 border-t border-gray-700">
                      <p className="text-gray-400 text-sm mb-2">Tareas realizadas:</p>
                      <span className="text-2xl font-bold text-purple-400">
                        {[...tareasSeleccionadas, ...tareasPersonalizadas.filter(t => t.trim())].length}
                      </span>
                    </div>
                    {piezasUsadas.filter(p => p?.pieza?.trim()).length > 0 && (
                      <div className="pt-2 border-t border-gray-700">
                        <p className="text-gray-400 text-sm mb-2">Piezas utilizadas:</p>
                        <div className="space-y-2">
                          {piezasUsadas
                            .filter(p => p?.pieza?.trim())
                            .map((pieza, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-700/30 px-3 py-2 rounded-lg">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {pieza.tipo === 'predefinida' ? (
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs flex-shrink-0">Predef</span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs flex-shrink-0">Person</span>
                                  )}
                                  <span className="text-sm text-white truncate">{pieza.pieza}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-300 ml-2 flex-shrink-0">x{pieza.cantidad}</span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Contador */}
              {mostrarContador && contador && (
                <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 space-y-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-amber-300 uppercase tracking-wide">Contador</h3>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-amber-400">{contador.valor.toLocaleString()}</span>
                    <span className="text-base text-gray-400 capitalize">{contador.tipo}</span>
                  </div>
                  {contador.notas && (
                    <p className="text-sm text-gray-400 pt-2 border-t border-gray-700">{contador.notas}</p>
                  )}
                </div>
              )}

              {/* Garantía */}
              {garantiaDescripcion && (
                <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 space-y-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-red-300 uppercase tracking-wide">Garantía</h3>
                  <p className="text-base">{garantiaDescripcion}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-700 text-sm">
                    <span className="text-gray-400">Vigencia:</span>
                    <span className="bg-red-600/20 px-3 py-1 rounded-full font-medium">
                      {new Date(garantiaTiempoDesde).toLocaleDateString()} - {new Date(garantiaTiempoHasta).toLocaleDateString()}
                    </span>
                    <span className="text-gray-500">({mesesGarantia} meses)</span>
                  </div>
                </div>
              )}
            </div>
          </Section>
        )
    }
  }

  // Guard de autenticación
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-400">Debes iniciar sesión para crear órdenes.</p>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-24 sm:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 shadow-lg">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={onClose} 
              className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-gray-800 transition-all active:scale-95 touch-manipulation"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white truncate">
                Nueva Orden
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">
                Paso {STEPS_CONFIG.findIndex(s => s.key === currentStep) + 1} de {STEPS_CONFIG.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {/* Progress Steps - Desktop */}
        <div className="hidden lg:block mb-8">
          <div className="flex items-center justify-between">
            {STEPS_CONFIG.map((step, index) => {
              const currentIndex = STEPS_CONFIG.findIndex(s => s.key === currentStep)
              const isCompleted = currentIndex > index
              const isCurrent = currentStep === step.key
              
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 scale-105'
                          : isCurrent
                          ? 'bg-blue-500 border-blue-500 scale-110 shadow-lg shadow-blue-500/50'
                          : 'bg-gray-700 border-gray-600'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <span className="text-xl">{step.icon}</span>
                      )}
                    </div>
                    <span className={`text-sm mt-2 text-center font-medium ${
                      isCurrent ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                    <span className={`text-xs text-center ${
                      isCurrent ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {step.description}
                    </span>
                  </div>
                  {index < STEPS_CONFIG.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-3 rounded transition-all ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Progress Steps - Mobile/Tablet */}
        <div className="lg:hidden mb-6">
          <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-xl">
                  {STEPS_CONFIG[STEPS_CONFIG.findIndex(s => s.key === currentStep)].icon}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {STEPS_CONFIG[STEPS_CONFIG.findIndex(s => s.key === currentStep)].title}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {STEPS_CONFIG[STEPS_CONFIG.findIndex(s => s.key === currentStep)].description}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                {STEPS_CONFIG.findIndex(s => s.key === currentStep) + 1}/{STEPS_CONFIG.length}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
                style={{ width: `${((STEPS_CONFIG.findIndex(s => s.key === currentStep) + 1) / STEPS_CONFIG.length) * 100}%` }}
              >
                <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-r from-transparent to-white/30 animate-pulse" />
              </div>
            </div>

            {/* Mini Steps Indicators */}
            <div className="flex justify-between mt-3 px-1">
              {STEPS_CONFIG.map((step, index) => {
                const currentIndex = STEPS_CONFIG.findIndex(s => s.key === currentStep)
                const isCompleted = currentIndex > index
                const isCurrent = currentStep === step.key
                
                return (
                  <div 
                    key={step.key}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isCurrent 
                        ? 'bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-800' 
                        : 'bg-gray-700 text-gray-500'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Paso Actual */}
          <div className="animate-fadeIn">
            {renderCurrentStep()}
          </div>

          {/* Navegación entre Pasos - Fixed en móvil */}
          <div className="fixed bottom-0 left-0 right-0 sm:relative bg-gray-900/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none border-t sm:border-t-0 border-gray-800 sm:border-gray-700 mt-0 sm:mt-8 pt-0 sm:pt-6 z-20">
            <div className="max-w-4xl mx-auto px-3 sm:px-0 py-3 sm:py-0">
              <div className="flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 'cliente'}
                  className="flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-300 bg-gray-800 rounded-lg sm:rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 disabled:active:scale-100 shadow-lg sm:shadow-none touch-manipulation"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">Atrás</span>
                </button>

                {currentStep === 'resumen' ? (
                  <div className="flex gap-2 sm:gap-3 flex-1 sm:flex-initial justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-300 bg-gray-800 rounded-lg sm:rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-all active:scale-95 disabled:active:scale-100 shadow-lg sm:shadow-none touch-manipulation"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-green-600 to-green-500 rounded-lg sm:rounded-xl hover:from-green-700 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 disabled:active:scale-100 shadow-lg shadow-green-500/30 touch-manipulation"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                          Crear Orden
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceedToNextStep()}
                    className="flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 disabled:active:scale-100 shadow-lg shadow-blue-500/30 flex-1 sm:flex-initial touch-manipulation"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <span className="sm:hidden">Continuar</span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
                  </button>
                )}
              </div>

              {/* Hint Text - Solo visible en móvil cuando el botón está deshabilitado */}
              {!canProceedToNextStep() && currentStep !== 'resumen' && (
                <div className="sm:hidden mt-2 text-center">
                  <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg py-2 px-3">
                    {currentStep === 'cliente' && 'Selecciona un cliente para continuar'}
                    {currentStep === 'dispositivo' && 'Selecciona un dispositivo para continuar'}
                    {currentStep === 'mantenimiento' && tipoMantenimiento === 'diagnostico' && 'Completa todos los campos del diagnóstico'}
                    {currentStep === 'mantenimiento' && tipoMantenimiento !== 'diagnostico' && 'Agrega al menos una tarea para continuar'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Mejora del scroll en móviles */
        @media (max-width: 640px) {
          body {
            overflow-x: hidden;
          }
        }

        /* Asegurar que los inputs sean accesibles en móvil */
        input, textarea, select {
          font-size: 16px !important;
        }

        /* Mejorar la experiencia táctil */
        button, a, [role="button"] {
          -webkit-tap-highlight-color: transparent;
        }

        .touch-manipulation {
          touch-action: manipulation;
        }
      `}</style>
    </div>
  )
}