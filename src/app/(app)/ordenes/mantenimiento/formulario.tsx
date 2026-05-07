// VERSIÓN OPTIMIZADA DEL FORMULARIO DE MANTENIMIENTO
// Implementa useReducer, React.memo, y optimizaciones de rendimiento

'use client'
import { useState, useEffect, useCallback, useMemo, useReducer } from 'react'
import { OrdenMantenimiento, Cliente, Dispositivo } from '@/types/orden'
import { ArrowLeft, Monitor, ChevronRight, ChevronLeft, CheckCircle, Users, Wrench, ClipboardCheck, GaugeCircle, Laptop, ShieldCheck, Check } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { 
  getClientesPorUsuario, 
  crearOrden,
} from '@/lib/multiuser-helpers'
import { obtenerProximoNumeroOrden, formatearIdOrden } from '@/lib/firebase-utils'
import { useNegocio } from '@/hooks/useNegocio'
import { usePrintService } from '@/components/mantenimiento/PrintService'

// Componentes importados
import ClienteSelector from '@/components/forms/ClienteSelector'
import DispositivoSelector from '@/components/forms/DispositivoSelector'
import MantenimientoInfo from '@/components/forms/MantenimientoInfo'
import GarantiaInput from '@/components/forms/GarantiaInput'
import ContadorInput, { Contador } from '@/components/forms/ContadorInput'
import ResumenMantenimiento from '@/components/forms/ResumenMantenimiento'
import { usePersistentReducer } from '@/hooks/usePersistentReducer'

interface FormularioMantenimientoProps {
  onClose: () => void
  onSuccess: () => void
}

export interface Pieza {
  pieza: string
  cantidad: number
  tipo?: 'predefinida' | 'personalizada'
  idPredefinida?: string
}

export type FormStep = 'cliente' | 'dispositivo' | 'mantenimiento' | 'contador' | 'garantia' | 'resumen'

// ============================================================================
// STATE MANAGEMENT CON USEREDUCER
// ============================================================================
export interface FormState {
  currentStep: FormStep
  loading: boolean
  
  // Cliente y Dispositivo
  clientes: Cliente[]
  clienteSeleccionado: Cliente | null
  dispositivoSeleccionado: Dispositivo | null
  
  // Mantenimiento
  tipoMantenimiento: 'preventivo' | 'correctivo' | 'diagnostico' | 'instalacion' | 'garantia' | ''
  tareasSeleccionadas: string[]
  tareasPersonalizadas: string[]
  mostrarTareasPredefinidas: boolean
  piezasUsadas: Pieza[]
  
  // Instalación
  instalacionRecomendaciones: boolean
  instalacionRecomendacionesDetalle: string
  instalacionConfiguracion: boolean
  instalacionConfiguracionTipos: string[]
  instalacionConfiguracionPersonalizada: string
  
  // Diagnóstico
  observacionesIniciales: string
  pruebasRealizadas: string
  diagnosticoFinal: string
  contadorMaquina?: number
  
  // Garantía
  garantiaDescripcion: string
  garantiaTiempoDesde: string
  garantiaTiempoHasta: string
  mesesGarantia: number
  
  // Contador
  contador: Contador | null
  mostrarContador: boolean
  
  // Éxito
  ordenCreada?: OrdenMantenimiento
}

type FormAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_STEP'; payload: FormStep }
  | { type: 'SET_CLIENTES'; payload: Cliente[] }
  | { type: 'SET_CLIENTE_SELECCIONADO'; payload: Cliente | null }
  | { type: 'SET_DISPOSITIVO_SELECCIONADO'; payload: Dispositivo | null }
  | { type: 'SET_TIPO_MANTENIMIENTO'; payload: FormState['tipoMantenimiento'] }
  | { type: 'TOGGLE_TAREA_PREDEFINIDA'; payload: string }
  | { type: 'SET_TAREAS_PERSONALIZADAS'; payload: string[] }
  | { type: 'UPDATE_TAREA_PERSONALIZADA'; payload: { index: number; valor: string } }
  | { type: 'ADD_TAREA_PERSONALIZADA'; payload?: string }
  | { type: 'REMOVE_TAREA_PERSONALIZADA'; payload: number }
  | { type: 'SET_PIEZAS_USADAS'; payload: Pieza[] }
  | { type: 'SET_MOSTRAR_TAREAS_PREDEFINIDAS'; payload: boolean }
  | { type: 'SET_OBSERVACIONES_INICIALES'; payload: string }
  | { type: 'SET_PRUEBAS_REALIZADAS'; payload: string }
  | { type: 'SET_DIAGNOSTICO_FINAL'; payload: string }
  | { type: 'SET_CONTADOR_MAQUINA'; payload: number | undefined }
  | { type: 'SET_GARANTIA_DESCRIPCION'; payload: string }
  | { type: 'SET_GARANTIA_TIEMPO_DESDE'; payload: string }
  | { type: 'SET_GARANTIA_TIEMPO_HASTA'; payload: string }
  | { type: 'SET_MESES_GARANTIA'; payload: number }
  | { type: 'SET_CONTADOR'; payload: Contador | null }
  | { type: 'TOGGLE_CONTADOR' }
  | { type: 'SET_ORDEN_CREADA'; payload: OrdenMantenimiento }
  | { type: 'RESET_MANTENIMIENTO_DATA' }
  | { type: 'SET_INSTALACION_RECOMENDACIONES'; payload: boolean }
  | { type: 'SET_INSTALACION_RECOMENDACIONES_DETALLE'; payload: string }
  | { type: 'SET_INSTALACION_CONFIGURACION'; payload: boolean }
  | { type: 'TOGGLE_INSTALACION_CONFIGURACION_TIPO'; payload: string }
  | { type: 'ADD_INSTALACION_CONFIGURACION_PERSONALIZADA'; payload: string }

const initialState: FormState = {
  currentStep: 'cliente',
  loading: false,
  clientes: [],
  clienteSeleccionado: null,
  dispositivoSeleccionado: null,
  tipoMantenimiento: '',
  tareasSeleccionadas: [],
  tareasPersonalizadas: [''],
  mostrarTareasPredefinidas: true,
  piezasUsadas: [],
  observacionesIniciales: '',
  pruebasRealizadas: '',
  diagnosticoFinal: '',
  contadorMaquina: undefined,
  garantiaDescripcion: '',
  garantiaTiempoDesde: '',
  garantiaTiempoHasta: '',
  mesesGarantia: 3,
  contador: null,
  mostrarContador: false,
  instalacionRecomendaciones: false,
  instalacionRecomendacionesDetalle: '',
  instalacionConfiguracion: false,
  instalacionConfiguracionTipos: [],
  instalacionConfiguracionPersonalizada: '',
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload }
    
    case 'SET_CLIENTES':
      return { ...state, clientes: action.payload }
    
    case 'SET_CLIENTE_SELECCIONADO':
      return { 
        ...state, 
        clienteSeleccionado: action.payload,
        dispositivoSeleccionado: null
      }
    
    case 'SET_DISPOSITIVO_SELECCIONADO':
      return { ...state, dispositivoSeleccionado: action.payload }
    
    
    case 'SET_TIPO_MANTENIMIENTO':
      if (state.tipoMantenimiento !== action.payload) {
        return { 
          ...state, 
          tipoMantenimiento: action.payload,
          tareasSeleccionadas: [],
          tareasPersonalizadas: [''],
          piezasUsadas: [],
          observacionesIniciales: '',
          pruebasRealizadas: '',
          diagnosticoFinal: '',
          contadorMaquina: undefined,
          instalacionRecomendaciones: false,
          instalacionRecomendacionesDetalle: '',
          instalacionConfiguracion: false,
          instalacionConfiguracionTipos: [],
          instalacionConfiguracionPersonalizada: ''
        }
      }
      return state
    
    case 'TOGGLE_TAREA_PREDEFINIDA':
      return {
        ...state,
        tareasSeleccionadas: state.tareasSeleccionadas.includes(action.payload)
          ? state.tareasSeleccionadas.filter(t => t !== action.payload)
          : [...state.tareasSeleccionadas, action.payload]
      }
    
    case 'SET_TAREAS_PERSONALIZADAS':
      return { ...state, tareasPersonalizadas: action.payload }
    
    case 'UPDATE_TAREA_PERSONALIZADA':
      return {
        ...state,
        tareasPersonalizadas: state.tareasPersonalizadas.map((tarea, i) =>
          i === action.payload.index ? action.payload.valor : tarea
        )
      }
    
    case 'ADD_TAREA_PERSONALIZADA':
      return {
        ...state,
        tareasPersonalizadas: [...state.tareasPersonalizadas, action.payload || '']
      }
    
    case 'REMOVE_TAREA_PERSONALIZADA':
      return {
        ...state,
        tareasPersonalizadas: state.tareasPersonalizadas.filter((_, i) => i !== action.payload)
      }
    
    case 'SET_PIEZAS_USADAS':
      return { ...state, piezasUsadas: action.payload }
    
    case 'SET_MOSTRAR_TAREAS_PREDEFINIDAS':
      return { ...state, mostrarTareasPredefinidas: action.payload }
    
    case 'SET_OBSERVACIONES_INICIALES':
      return { ...state, observacionesIniciales: action.payload }
    
    case 'SET_PRUEBAS_REALIZADAS':
      return { ...state, pruebasRealizadas: action.payload }
    
    case 'SET_DIAGNOSTICO_FINAL':
      return { ...state, diagnosticoFinal: action.payload }
    
    case 'SET_CONTADOR_MAQUINA':
      return { ...state, contadorMaquina: action.payload }
    
    case 'SET_GARANTIA_DESCRIPCION':
      return { ...state, garantiaDescripcion: action.payload }
    
    case 'SET_GARANTIA_TIEMPO_DESDE':
      return { ...state, garantiaTiempoDesde: action.payload }
    
    case 'SET_GARANTIA_TIEMPO_HASTA':
      return { ...state, garantiaTiempoHasta: action.payload }
    
    case 'SET_MESES_GARANTIA':
      return { ...state, mesesGarantia: action.payload }
    
    case 'SET_CONTADOR':
      return { ...state, contador: action.payload }
    
    case 'TOGGLE_CONTADOR':
      const nuevoMostrarContador = !state.mostrarContador
      return {
        ...state,
        mostrarContador: nuevoMostrarContador,
        contador: nuevoMostrarContador && !state.contador
          ? {
              tipo: 'unidades',
              valor: 0,
              fechaRegistro: new Date().toISOString().split('T')[0],
              notas: ''
            }
          : nuevoMostrarContador ? state.contador : null
      }
    
    case 'SET_ORDEN_CREADA':
      return { ...state, ordenCreada: action.payload }
    
    case 'RESET_MANTENIMIENTO_DATA':
      return {
        ...state,
        tareasSeleccionadas: [],
        tareasPersonalizadas: [''],
        piezasUsadas: [],
        observacionesIniciales: '',
        pruebasRealizadas: '',
        diagnosticoFinal: '',
        contadorMaquina: undefined,
        instalacionRecomendaciones: false,
        instalacionRecomendacionesDetalle: '',
        instalacionConfiguracion: false,
        instalacionConfiguracionTipos: [],
        instalacionConfiguracionPersonalizada: ''
      }
    
    case 'SET_INSTALACION_RECOMENDACIONES':
      return { ...state, instalacionRecomendaciones: action.payload }
    
    case 'SET_INSTALACION_RECOMENDACIONES_DETALLE':
      return { ...state, instalacionRecomendacionesDetalle: action.payload }
    
    case 'SET_INSTALACION_CONFIGURACION':
      return { ...state, instalacionConfiguracion: action.payload }
    
    case 'TOGGLE_INSTALACION_CONFIGURACION_TIPO':
      return {
        ...state,
        instalacionConfiguracionTipos: state.instalacionConfiguracionTipos.includes(action.payload)
          ? state.instalacionConfiguracionTipos.filter(t => t !== action.payload)
          : [...state.instalacionConfiguracionTipos, action.payload]
      }
    
    case 'ADD_INSTALACION_CONFIGURACION_PERSONALIZADA':
      return {
        ...state,
        instalacionConfiguracionTipos: [...state.instalacionConfiguracionTipos, action.payload]
      }
    
    default:
      return state
  }
}

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
  const { negocio } = useNegocio()
  const { imprimirOrden, compartirOrden } = usePrintService({ negocio })
  const [state, dispatch] = usePersistentReducer(
    'draft_mantenimiento',
    formReducer,
    initialState,
    useCallback((savedState: FormState) => ({ ...savedState, loading: false }), [])
  )

  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  // Cargar clientes al montar
  useEffect(() => {
    if (!user?.uid) return
    
    let mounted = true
    
    const cargarClientes = async () => {
      try {
        const clientesData = await getClientesPorUsuario(user.uid)
        if (mounted) {
          dispatch({ type: 'SET_CLIENTES', payload: clientesData })
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
    dispatch({ type: 'SET_GARANTIA_TIEMPO_DESDE', payload: hoy })
  }, [])

  // Calcular fecha hasta de garantía (optimizado)
  const fechaGarantiaHasta = useMemo(() => {
    if (state.mesesGarantia > 0 && state.garantiaTiempoDesde) {
      const fechaDesde = new Date(state.garantiaTiempoDesde)
      const fechaHasta = new Date(fechaDesde)
      fechaHasta.setMonth(fechaHasta.getMonth() + state.mesesGarantia)
      return fechaHasta.toISOString().split('T')[0]
    }
    return ''
  }, [state.mesesGarantia, state.garantiaTiempoDesde])

  useEffect(() => {
    if (fechaGarantiaHasta !== state.garantiaTiempoHasta) {
      dispatch({ type: 'SET_GARANTIA_TIEMPO_HASTA', payload: fechaGarantiaHasta })
    }
  }, [fechaGarantiaHasta, state.garantiaTiempoHasta])


  // Manejar el botón back del navegador/Android
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Ignorar popstate si fue programático (ej. al cerrar un modal interno)
      if ((window as any).__ignoring_next_popstate__) {
        (window as any).__ignoring_next_popstate__ = false;
        return;
      }

      event.preventDefault()
      
      const currentIndex = STEPS_CONFIG.findIndex(step => step.key === state.currentStep)
      
      if (currentIndex > 0) {
        prevStep()
        window.history.pushState(null, '', window.location.pathname)
      } else {
        onClose()
      }
    }

    window.history.pushState(null, '', window.location.pathname)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [state.currentStep, onClose])

  // ============================================================================
  // PREVENCIÓN DE BUG DEL BORRADOR RETENIDO
  // ============================================================================
  // El usePersistentReducer sobrescribe el borrador con cada cambio de estado.
  // Aquí aseguramos de borrarlo en loop para que no se quede pausada
  // luego de haberse emitido si el componente vuelve a transicionar estados.
  useEffect(() => {
    if (state.ordenCreada) {
      const timeoutId = setTimeout(() => {
        localStorage.removeItem('draft_mantenimiento')
      }, 150)
      return () => clearTimeout(timeoutId)
    }
  }, [state.ordenCreada, state.loading])

  // ============================================================================
  // UTILIDADES MEMOIZADAS
  // ============================================================================
  
  // Función de scroll reutilizable
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => {
      const mainContainer = document.querySelector('.min-h-screen')
      if (mainContainer) {
        mainContainer.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 50)
  }, [])

  // ============================================================================
  // HANDLERS OPTIMIZADOS
  // ============================================================================
  
  const nextStep = useCallback(() => {
    const currentIndex = STEPS_CONFIG.findIndex(step => step.key === state.currentStep)
    if (currentIndex < STEPS_CONFIG.length - 1) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: STEPS_CONFIG[currentIndex + 1].key })
      scrollToTop()
    }
  }, [state.currentStep, scrollToTop])

  const prevStep = useCallback(() => {
    const currentIndex = STEPS_CONFIG.findIndex(step => step.key === state.currentStep)
    if (currentIndex > 0) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: STEPS_CONFIG[currentIndex - 1].key })
      scrollToTop()
    }
  }, [state.currentStep, scrollToTop])

  // Handlers de Cliente
  const handleSeleccionarCliente = useCallback((cliente: Cliente) => {
    dispatch({ type: 'SET_CLIENTE_SELECCIONADO', payload: cliente })
  }, [])

  const handleDesseleccionarCliente = useCallback(() => {
    dispatch({ type: 'SET_CLIENTE_SELECCIONADO', payload: null })
  }, [])

  // Handlers de Dispositivo
  const handleSeleccionarDispositivo = useCallback((dispositivo: Dispositivo) => {
    dispatch({ type: 'SET_DISPOSITIVO_SELECCIONADO', payload: dispositivo })
  }, [])

  const handleDesseleccionarDispositivo = useCallback(() => {
    dispatch({ type: 'SET_DISPOSITIVO_SELECCIONADO', payload: null })
  }, [])

  // Handlers de Tareas
  const handleToggleTareaPredefinida = useCallback((tarea: string) => {
    dispatch({ type: 'TOGGLE_TAREA_PREDEFINIDA', payload: tarea })
  }, [])

  const handleActualizarTareaPersonalizada = useCallback((index: number, valor: string) => {
    dispatch({ type: 'UPDATE_TAREA_PERSONALIZADA', payload: { index, valor } })
  }, [])

  const handleAgregarTareaPersonalizada = useCallback((valor?: string) => {
    dispatch({ type: 'ADD_TAREA_PERSONALIZADA', payload: valor })
  }, [])

  const handleEliminarTareaPersonalizada = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_TAREA_PERSONALIZADA', payload: index })
  }, [])

  // Handlers de Contador
  const handleToggleContador = useCallback(() => {
    dispatch({ type: 'TOGGLE_CONTADOR' })
  }, [])

  const handleCambiarContador = useCallback((nuevoContador: Contador | null) => {
    dispatch({ type: 'SET_CONTADOR', payload: nuevoContador })
  }, [])

  // ============================================================================
  // VALIDACIONES OPTIMIZADAS
  // ============================================================================
  
  const stepValidations = useMemo(() => ({
    cliente: () => state.clienteSeleccionado !== null,
    dispositivo: () => state.dispositivoSeleccionado !== null,
    mantenimiento: () => {
      if (state.tipoMantenimiento === 'diagnostico') {
        return !!(
          state.observacionesIniciales.trim() &&
          state.pruebasRealizadas.trim() &&
          state.diagnosticoFinal.trim()
        )
      }
      if (state.tipoMantenimiento === 'instalacion') {
        return state.instalacionConfiguracion || state.instalacionRecomendaciones
      }
      const todasLasTareas = [
        ...state.tareasSeleccionadas,
        ...state.tareasPersonalizadas.filter(t => t.trim())
      ]
      return todasLasTareas.length > 0
    },
    contador: () => true,
    garantia: () => true,
    resumen: () => true,
  }), [
    state.clienteSeleccionado,
    state.dispositivoSeleccionado,
    state.tipoMantenimiento,
    state.observacionesIniciales,
    state.pruebasRealizadas,
    state.diagnosticoFinal,
    state.tareasSeleccionadas,
    state.tareasPersonalizadas,
    state.instalacionConfiguracion,
    state.instalacionRecomendaciones
  ])

  const canProceedToNextStep = useCallback((): boolean => {
    return stepValidations[state.currentStep]()
  }, [state.currentStep, stepValidations])

  // ============================================================================
  // SUBMIT OPTIMIZADO
  // ============================================================================
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.uid) {
      alert('Usuario no autenticado')
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      const proximoNumero = await obtenerProximoNumeroOrden('mantenimiento')
      const idPersonalizado = formatearIdOrden(proximoNumero, 'mantenimiento')

      const todasLasTareas = [
        ...state.tareasSeleccionadas,
        ...state.tareasPersonalizadas.filter(t => t.trim())
      ]

      const piezasUsadasFiltradas = state.piezasUsadas
        .filter(pieza => pieza?.pieza?.trim())
        .map(pieza => ({
          pieza: pieza.pieza,
          cantidad: pieza.cantidad || 1
        }))

      let contadorParaGuardar: any = null
      
      if (state.mostrarContador && state.contador) {
        contadorParaGuardar = {
          tipo: state.contador.tipo,
          valor: state.contador.valor || 0,
          fechaRegistro: new Date(state.contador.fechaRegistro)
        }
        
        if (state.contador.unidadPersonalizada && state.contador.unidadPersonalizada.trim()) {
          contadorParaGuardar.unidadPersonalizada = state.contador.unidadPersonalizada.trim()
        }
        
        if (state.contador.notas && state.contador.notas.trim()) {
          contadorParaGuardar.notas = state.contador.notas.trim()
        }
      }

      const nuevaOrden: any = {
        tipo: 'mantenimiento',
        horaCreacion: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cliente: state.clienteSeleccionado!,
        dispositivo: state.dispositivoSeleccionado!,
        fechaCreacion: new Date(),
        tipoMantenimiento: state.tipoMantenimiento,
        tareasRealizadas: todasLasTareas,
        piezasUsadas: piezasUsadasFiltradas,
        idPersonalizado,
        userId: user.uid,
      }

      if (contadorParaGuardar) {
        nuevaOrden.contador = contadorParaGuardar
      }
      
      if (state.tipoMantenimiento === 'diagnostico') {
        nuevaOrden.observacionesIniciales = state.observacionesIniciales.trim()
        nuevaOrden.pruebasRealizadas = state.pruebasRealizadas.trim()
        nuevaOrden.diagnosticoFinal = state.diagnosticoFinal.trim()
        
        if (state.contadorMaquina !== undefined && state.contadorMaquina !== null) {
          nuevaOrden.contadorMaquina = state.contadorMaquina
        }
      }
      
      if (state.tipoMantenimiento === 'instalacion') {
        nuevaOrden.instalacionRecomendaciones = state.instalacionRecomendaciones
        nuevaOrden.instalacionRecomendacionesDetalle = state.instalacionRecomendacionesDetalle
        nuevaOrden.instalacionConfiguracion = state.instalacionConfiguracion
        nuevaOrden.instalacionConfiguracionTipos = state.instalacionConfiguracionTipos
      }
      
      if (state.garantiaTiempoDesde) {
        nuevaOrden.garantiaTiempoDesde = new Date(state.garantiaTiempoDesde)
      }
      
      if (state.garantiaTiempoHasta) {
        nuevaOrden.garantiaTiempoHasta = new Date(state.garantiaTiempoHasta)
      }
      
      if (state.garantiaDescripcion && state.garantiaDescripcion.trim()) {
        nuevaOrden.garantiaDescripcion = state.garantiaDescripcion.trim()
      }

      Object.keys(nuevaOrden).forEach(key => {
        if (nuevaOrden[key] === undefined) {
          delete nuevaOrden[key]
        }
      })

      await crearOrden(nuevaOrden, user.uid)
      
      dispatch({ type: 'SET_ORDEN_CREADA', payload: nuevaOrden })
    } catch (error) {
      console.error('Error creando orden:', error)
      alert('Error al crear la orden: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [user?.uid, state, onSuccess])

  // ============================================================================
  // UTILIDADES MEMOIZADAS
  // ============================================================================
  
  const getTipoMantenimientoLabel = useMemo(() => {
    const labels = {
      preventivo: 'Preventivo',
      correctivo: 'Correctivo',
      diagnostico: 'Diagnóstico',
      instalacion: 'Instalación',
      garantia: 'Garantía',
      '': 'Sin especificar'
    } as const
    
    return labels[state.tipoMantenimiento]
  }, [state.tipoMantenimiento])

  const getTipoMantenimientoColor = useMemo(() => {
    const colors = {
      preventivo: 'bg-green-600/20 text-green-400 border-green-500/30',
      correctivo: 'bg-orange-600/20 text-orange-400 border-orange-500/30',
      diagnostico: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
      instalacion: 'bg-purple-600/20 text-purple-400 border-purple-500/30',
      garantia: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
      '': 'bg-gray-600/20 text-gray-400 border-gray-500/30'
    } as const
    
    return colors[state.tipoMantenimiento]
  }, [state.tipoMantenimiento])

const handleSetPiezasUsadas = useCallback((value: React.SetStateAction<Pieza[]>) => {
  if (typeof value === 'function') {
    dispatch({ 
      type: 'SET_PIEZAS_USADAS', 
      payload: value(state.piezasUsadas) 
    })
  } else {
    dispatch({ type: 'SET_PIEZAS_USADAS', payload: value })
  }
}, [state.piezasUsadas])

const handleCambiarTipoMantenimiento = useCallback((tipo: typeof state.tipoMantenimiento) => {
  dispatch({ type: 'SET_TIPO_MANTENIMIENTO', payload: tipo })
}, [])

const handleSetMostrarTareasPredefinidas = useCallback((mostrar: boolean) => {
  dispatch({ type: 'SET_MOSTRAR_TAREAS_PREDEFINIDAS', payload: mostrar })
}, [])

const handleCambiarObservaciones = useCallback((valor: string) => {
  dispatch({ type: 'SET_OBSERVACIONES_INICIALES', payload: valor })
}, [])

const handleCambiarPruebas = useCallback((valor: string) => {
  dispatch({ type: 'SET_PRUEBAS_REALIZADAS', payload: valor })
}, [])

const handleCambiarDiagnostico = useCallback((valor: string) => {
  dispatch({ type: 'SET_DIAGNOSTICO_FINAL', payload: valor })
}, [])

const handleToggleInstalacionRecomendaciones = useCallback((valor: boolean) => {
  dispatch({ type: 'SET_INSTALACION_RECOMENDACIONES', payload: valor })
}, [])

const handleCambiarInstalacionRecomendacionesDetalle = useCallback((valor: string) => {
  dispatch({ type: 'SET_INSTALACION_RECOMENDACIONES_DETALLE', payload: valor })
}, [])

const handleToggleInstalacionConfiguracion = useCallback((valor: boolean) => {
  dispatch({ type: 'SET_INSTALACION_CONFIGURACION', payload: valor })
}, [])

const handleToggleInstalacionConfiguracionTipo = useCallback((tipo: string) => {
  dispatch({ type: 'TOGGLE_INSTALACION_CONFIGURACION_TIPO', payload: tipo })
}, [])

const handleAgregarInstalacionConfiguracionPersonalizada = useCallback((tipo: string) => {
  dispatch({ type: 'ADD_INSTALACION_CONFIGURACION_PERSONALIZADA', payload: tipo })
}, [])

// ============================================================================
// PROPS MEMOIZADAS
// ============================================================================

// Memoizar props para componentes
const mantenimientoInfoProps = useMemo(() => ({
  tipoMantenimiento: state.tipoMantenimiento,
  tareasSeleccionadas: state.tareasSeleccionadas,
  tareasPersonalizadas: state.tareasPersonalizadas,
  piezasUsadas: state.piezasUsadas,
  setPiezasUsadas: handleSetPiezasUsadas, // ✅ Usar el handler creado arriba
  mostrarTareasPredefinidas: state.mostrarTareasPredefinidas,
  observacionesIniciales: state.observacionesIniciales,
  pruebasRealizadas: state.pruebasRealizadas,
  diagnosticoFinal: state.diagnosticoFinal,
  onCambiarTipoMantenimiento: handleCambiarTipoMantenimiento,
  onToggleTareaPredefinida: handleToggleTareaPredefinida,
  onSetMostrarTareasPredefinidas: handleSetMostrarTareasPredefinidas,
  onActualizarTareaPersonalizada: handleActualizarTareaPersonalizada,
  onAgregarTareaPersonalizada: handleAgregarTareaPersonalizada,
  onEliminarTareaPersonalizada: handleEliminarTareaPersonalizada,
  onCambiarObservaciones: handleCambiarObservaciones,
  onCambiarPruebas: handleCambiarPruebas,
  onCambiarDiagnostico: handleCambiarDiagnostico,
  instalacionRecomendaciones: state.instalacionRecomendaciones,
  instalacionRecomendacionesDetalle: state.instalacionRecomendacionesDetalle,
  instalacionConfiguracion: state.instalacionConfiguracion,
  instalacionConfiguracionTipos: state.instalacionConfiguracionTipos,
  onToggleInstalacionRecomendaciones: handleToggleInstalacionRecomendaciones,
  onCambiarInstalacionRecomendacionesDetalle: handleCambiarInstalacionRecomendacionesDetalle,
  onToggleInstalacionConfiguracion: handleToggleInstalacionConfiguracion,
  onToggleInstalacionConfiguracionTipo: handleToggleInstalacionConfiguracionTipo,
  onAgregarInstalacionConfiguracionPersonalizada: handleAgregarInstalacionConfiguracionPersonalizada,
}), [
  state.tipoMantenimiento,
  state.tareasSeleccionadas,
  state.tareasPersonalizadas,
  state.piezasUsadas,
  state.mostrarTareasPredefinidas,
  state.observacionesIniciales,
  state.pruebasRealizadas,
  state.diagnosticoFinal,
  state.instalacionRecomendaciones,
  state.instalacionRecomendacionesDetalle,
  state.instalacionConfiguracion,
  state.instalacionConfiguracionTipos,
  handleSetPiezasUsadas,
  handleCambiarTipoMantenimiento,
  handleToggleTareaPredefinida,
  handleSetMostrarTareasPredefinidas,
  handleActualizarTareaPersonalizada,
  handleAgregarTareaPersonalizada,
  handleEliminarTareaPersonalizada,
  handleCambiarObservaciones,
  handleCambiarPruebas,
  handleCambiarDiagnostico,
  handleToggleInstalacionRecomendaciones,
  handleCambiarInstalacionRecomendacionesDetalle,
  handleToggleInstalacionConfiguracion,
  handleToggleInstalacionConfiguracionTipo,
  handleAgregarInstalacionConfiguracionPersonalizada,
])

// Memoizar props para ContadorInput
const contadorInputProps = useMemo(() => ({
  contador: state.contador,
  mostrarContador: state.mostrarContador,
  onToggleContador: handleToggleContador,
  onChangeContador: handleCambiarContador,
}), [state.contador, state.mostrarContador, handleToggleContador, handleCambiarContador])

  // ============================================================================
  // RENDER - Paso actual
  // ============================================================================
  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 'cliente':
        return (
          <ClienteSelector
            clientes={state.clientes}
            clienteSeleccionado={state.clienteSeleccionado}
            onSeleccionarCliente={handleSeleccionarCliente}
            onDesseleccionarCliente={handleDesseleccionarCliente}
          />
        )

      case 'dispositivo':
        return (
          <DispositivoSelector
            cliente={state.clienteSeleccionado!}
            dispositivoSeleccionado={state.dispositivoSeleccionado}
            onSeleccionarDispositivo={handleSeleccionarDispositivo}
            onDesseleccionarDispositivo={handleDesseleccionarDispositivo}
            onClienteActualizado={(c) => dispatch({ type: 'SET_CLIENTE_SELECCIONADO', payload: c })}
          />
        )

      case 'mantenimiento':
        return <MantenimientoInfo {...mantenimientoInfoProps} />

      case 'contador':
        return <ContadorInput {...contadorInputProps} />

      case 'garantia':
        return (
          <GarantiaInput
            garantiaTiempoDesde={state.garantiaTiempoDesde}
            garantiaTiempoHasta={state.garantiaTiempoHasta}
            mesesGarantia={state.mesesGarantia}
            garantiaDescripcion={state.garantiaDescripcion}
            onCambiarFechaDesde={(fecha: string) => 
              dispatch({ type: 'SET_GARANTIA_TIEMPO_DESDE', payload: fecha })}
            onCambiarMeses={(meses: number) => 
              dispatch({ type: 'SET_MESES_GARANTIA', payload: meses })}
            onCambiarDescripcion={(desc: string) => 
              dispatch({ type: 'SET_GARANTIA_DESCRIPCION', payload: desc })}
          />
        )

      case 'resumen':
        return (
          <ResumenMantenimiento 
            state={state}
            tipoMantenimientoLabel={getTipoMantenimientoLabel}
            tipoMantenimientoColor={getTipoMantenimientoColor}
          />
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
  
  if (state.ordenCreada) {
    return (
      <div className="fixed inset-0 bg-gray-900 border-b border-gray-800 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-xl w-full max-w-lg text-center animate-in zoom-in-95 fade-in duration-300">
          <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Orden Generada!</h2>
          <p className="text-gray-400 mb-8">
            La orden <span className="text-gray-200 font-semibold">#{state.ordenCreada.idPersonalizado}</span> ha sido guardada exitosamente.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => compartirOrden(state.ordenCreada!)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-500/20"
            >
              Compartir Orden (PDF)
            </button>
            <button
              onClick={() => imprimirOrden(state.ordenCreada!)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-all"
            >
              Imprimir
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('draft_mantenimiento')
                onSuccess()
              }}
              className="w-full text-gray-400 hover:text-white font-medium py-3 rounded-xl transition-colors mt-2"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-48 sm:pb-8">
      {/* Header */}
      <div className="bg-gray-900/95 border-b border-gray-800 shadow-lg">
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
                Paso {STEPS_CONFIG.findIndex(s => s.key === state.currentStep) + 1} de {STEPS_CONFIG.length}
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
              const currentIndex = STEPS_CONFIG.findIndex(s => s.key === state.currentStep)
              const isCompleted = currentIndex > index
              const isCurrent = state.currentStep === step.key
              
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
                  {STEPS_CONFIG[STEPS_CONFIG.findIndex(s => s.key === state.currentStep)].icon}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {STEPS_CONFIG[STEPS_CONFIG.findIndex(s => s.key === state.currentStep)].title}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {STEPS_CONFIG[STEPS_CONFIG.findIndex(s => s.key === state.currentStep)].description}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                {STEPS_CONFIG.findIndex(s => s.key === state.currentStep) + 1}/{STEPS_CONFIG.length}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
                style={{ width: `${((STEPS_CONFIG.findIndex(s => s.key === state.currentStep) + 1) / STEPS_CONFIG.length) * 100}%` }}
              >
                <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-r from-transparent to-white/30 animate-pulse" />
              </div>
            </div>

            {/* Mini Steps Indicators */}
            <div className="flex justify-between mt-3 px-1">
              {STEPS_CONFIG.map((step, index) => {
                const currentIndex = STEPS_CONFIG.findIndex(s => s.key === state.currentStep)
                const isCompleted = currentIndex > index
                const isCurrent = state.currentStep === step.key
                
                return (
                  <div 
                    key={step.key}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                      isCompleted 
                        ? 'bg-green-400 text-white' 
                        : isCurrent 
                        ? 'bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-800' 
                        : 'bg-gray-700 text-gray-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle/> : index + 1}
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
          <div className="fixed bottom-0 left-0 right-0 sm:relative bg-gray-900/95 sm:bg-transparent border-t sm:border-t-0 border-gray-800 sm:border-gray-700 mt-0 sm:mt-8 pt-0 sm:pt-6 z-20">
            <div className="max-w-4xl mx-auto px-3 sm:px-0 py-3 sm:py-0">
              <div className="flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={state.currentStep === 'cliente'}
                  className="flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-300 bg-gray-800 rounded-lg sm:rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 disabled:active:scale-100 shadow-lg sm:shadow-none touch-manipulation"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">Atrás</span>
                </button>

                {state.currentStep === 'resumen' ? (
                  <div className="flex gap-2 sm:gap-3 flex-1 sm:flex-initial justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={state.loading}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-300 bg-gray-800 rounded-lg sm:rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-all active:scale-95 disabled:active:scale-100 shadow-lg sm:shadow-none touch-manipulation"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={state.loading}
                      className="flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-green-600 to-green-500 rounded-lg sm:rounded-xl hover:from-green-700 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 disabled:active:scale-100 shadow-lg shadow-green-500/30 touch-manipulation"
                    >
                      {state.loading ? (
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
              {!canProceedToNextStep() && state.currentStep !== 'resumen' && (
                <div className="sm:hidden mt-2 text-center">
                  <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg py-2 px-3">
                    {state.currentStep === 'cliente' && 'Selecciona un cliente para continuar'}
                    {state.currentStep === 'dispositivo' && 'Selecciona un dispositivo para continuar'}
                    {state.currentStep === 'mantenimiento' && state.tipoMantenimiento === 'diagnostico' && 'Completa todos los campos del diagnóstico'}
                    {state.currentStep === 'mantenimiento' && state.tipoMantenimiento === 'instalacion' && 'Configura o agrega recomendaciones para continuar'}
                    {state.currentStep === 'mantenimiento' && state.tipoMantenimiento !== 'diagnostico' && state.tipoMantenimiento !== 'instalacion' && 'Agrega al menos una tarea para continuar'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

    </div>
  )
}