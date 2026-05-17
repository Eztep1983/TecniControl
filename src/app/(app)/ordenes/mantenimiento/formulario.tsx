// VERSIÓN OPTIMIZADA DEL FORMULARIO DE MANTENIMIENTO
// Implementa useReducer, React.memo, y optimizaciones de rendimiento

'use client'
import { useState, useEffect, useCallback, useMemo, useReducer } from 'react'
import { OrdenMantenimiento, Cliente, Dispositivo } from '@/types/orden'
import { createPortal } from 'react-dom';
import {
  ArrowLeft, ChevronRight, ChevronLeft, CheckCircle, Users, Wrench,
  ClipboardCheck, GaugeCircle, Laptop, ShieldCheck, PenLine, Check, Share2, Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Haptics, NotificationType } from '@capacitor/haptics'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getClientesPorUsuario,
} from '@/lib/multiuser-helpers'
import { useCrearOrden } from '@/hooks/useMultiUser'
import { useNegocio } from '@/hooks/useNegocio'
import { usePrintService } from '@/components/mantenimiento/PrintService'

// Componentes importados
import ClienteSelector from '@/components/forms/ClienteSelector'
import DispositivoSelector from '@/components/forms/DispositivoSelector'
import MantenimientoInfo from '@/components/forms/MantenimientoInfo'
import GarantiaInput from '@/components/forms/GarantiaInput'
import ContadorInput, { Contador } from '@/components/forms/ContadorInput'
import FirmaInput from '@/components/forms/FirmaInput'
import ResumenMantenimiento from '@/components/forms/ResumenMantenimiento'
import { usePersistentReducer } from '@/hooks/usePersistentReducer'
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible'

interface FormularioMantenimientoProps {
  onClose: () => void
  onSuccess: () => void
  isOnboarding?: boolean
}

const ONBOARDING_HINTS: Record<FormStep, { title: string, hint: React.ReactNode, icon: any }> = {
  cliente: {
    title: "Identifica al Cliente",
    icon: <Users className="w-5 h-5" />,
    hint: <span className="text-lg">Aquí seleccionas quién solicita el servicio. En el modo real, podrás buscar por nombre o cédula. Hemos pre-seleccionado un cliente de prueba para ti.</span>
  },
  dispositivo: {
    title: "Selecciona el Equipo",
    icon: <Laptop className="w-5 h-5" />,
    hint: <span className="text-lg">Cada cliente puede tener múltiples equipos. Aquí eliges cuál vas a intervenir. Esto mantiene un historial técnico organizado por cada dispositivo.</span>
  },
  mantenimiento: {
    title: "Detalla el Trabajo",
    icon: <Wrench className="w-5 h-5" />,
    hint: <span className="text-lg">Indica qué tipo de servicio realizas y qué tareas completaste. También puedes registrar las piezas que usaste para llevar un control de inventario/costos.</span>
  },
  contador: {
    title: "Registro de Uso",
    icon: <GaugeCircle className="w-5 h-5" />,
    hint: <span className="text-lg">Este paso es opcional. Sirve para anotar unidades, horas de uso o impresiones. Ayuda a predecir cuándo será el próximo mantenimiento.</span>
  },
  garantia: {
    title: "Respaldo del Servicio",
    icon: <ShieldCheck className="w-5 h-5" />,
    hint: <span className="text-lg">Configura cuánto tiempo de garantía ofreces. El sistema calculará automáticamente la fecha de vencimiento y la incluirá en el PDF profesional.</span>
  },
  firma: {
    title: "Validación Legal",
    icon: <PenLine className="w-5 h-5" />,
    hint: <span className="text-lg">Tus clientes pueden firmar directamente en tu pantalla. Esto da validez legal al servicio y asegura que el cliente esté conforme con el trabajo.</span>
  },
  resumen: {
    title: "Revisión Final",
    icon: <ClipboardCheck className="w-5 h-5" />,
    hint: <span className="text-lg">Verifica que toda la información sea correcta antes de generar el documento oficial. Una vez guardado, podrás enviarlo por WhatsApp en un segundo.</span>
  }
}


export interface Pieza {
  pieza: string
  cantidad: number
  tipo?: 'predefinida' | 'personalizada'
  idPredefinida?: string
}

export type FormStep = 'cliente' | 'dispositivo' | 'mantenimiento' | 'contador' | 'garantia' | 'firma' | 'resumen'

// ============================================================================
// STATE MANAGEMENT CON USEREDUCER
// ============================================================================
export interface FormState {
  currentStep: FormStep
  loading: boolean
  highestStepCompleted: number // Nuevo: el paso más alto completado

  // Cliente y Dispositivo
  clientes: Cliente[]
  clienteSeleccionado: Cliente | null
  dispositivoSeleccionado: Dispositivo | null

  // Mantenimiento
  tipoMantenimiento: 'preventivo' | 'correctivo' | 'diagnostico' | 'instalacion' | ''
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
  garantiaHabilitada: boolean
  garantiaDescripcion: string
  garantiaTiempoDesde: string
  garantiaTiempoHasta: string
  mesesGarantia: number

  // Contador
  contador: Contador | null
  mostrarContador: boolean

  // Persistencia por tipo
  mantenimientoColecciones: Record<string, any>

  // Firma
  firmaHabilitada: boolean
  firmaCliente: string | null
  validacionCliente: boolean

  // Éxito
  ordenCreada?: OrdenMantenimiento
}

type FormAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_STEP'; payload: FormStep }
  | { type: 'SET_HIGHEST_STEP_COMPLETED'; payload: number }
  | { type: 'SET_CLIENTES'; payload: Cliente[] }
  | { type: 'SET_CLIENTE_SELECCIONADO'; payload: Cliente | null }
  | { type: 'SET_DISPOSITIVO_SELECCIONADO'; payload: Dispositivo | null }
  | { type: 'SET_TIPO_MANTENIMIENTO'; payload: FormState['tipoMantenimiento'] }
  | { type: 'TOGGLE_TAREA_PREDEFINIDA'; payload: string }
  | { type: 'ADD_TAREA_PREDEFINIDA'; payload: string }
  | { type: 'SET_TAREAS_SELECCIONADAS'; payload: string[] }
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
  | { type: 'TOGGLE_GARANTIA_HABILITADA' }
  | { type: 'SET_CONTADOR'; payload: Contador | null }
  | { type: 'TOGGLE_CONTADOR' }
  | { type: 'SET_ORDEN_CREADA'; payload: OrdenMantenimiento }
  | { type: 'RESET_MANTENIMIENTO_DATA' }
  | { type: 'SET_INSTALACION_RECOMENDACIONES'; payload: boolean }
  | { type: 'SET_INSTALACION_RECOMENDACIONES_DETALLE'; payload: string }
  | { type: 'SET_INSTALACION_CONFIGURACION'; payload: boolean }
  | { type: 'TOGGLE_INSTALACION_CONFIGURACION_TIPO'; payload: string }
  | { type: 'ADD_INSTALACION_CONFIGURACION_PERSONALIZADA'; payload: string }
  | { type: 'SET_FIRMA_CLIENTE'; payload: string | null }
  | { type: 'SET_VALIDACION_CLIENTE'; payload: boolean }
  | { type: 'TOGGLE_FIRMA_HABILITADA' }
  | { type: 'SET_ONBOARDING_DATA'; payload: { cliente: Cliente; dispositivo: Dispositivo } }

const initialState: FormState = {
  currentStep: 'cliente',
  loading: false,
  highestStepCompleted: 0, // Solo el paso 0 (cliente) está inicialmente "permitido"
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
  garantiaHabilitada: false,
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
  mantenimientoColecciones: {},
  firmaHabilitada: false, // Por defecto apagado
  firmaCliente: null,
  validacionCliente: false,
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload }

    case 'SET_HIGHEST_STEP_COMPLETED':
      return { ...state, highestStepCompleted: action.payload }

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
      if (state.tipoMantenimiento === action.payload) return state;

      const currentTipo = state.tipoMantenimiento;
      const nextTipo = action.payload;

      // 1. Guardar el estado actual en la colección correspondiente (si hay un tipo seleccionado)
      const dataToSave = {
        tareasSeleccionadas: state.tareasSeleccionadas,
        tareasPersonalizadas: state.tareasPersonalizadas,
        piezasUsadas: state.piezasUsadas,
        observacionesIniciales: state.observacionesIniciales,
        pruebasRealizadas: state.pruebasRealizadas,
        diagnosticoFinal: state.diagnosticoFinal,
        instalacionRecomendaciones: state.instalacionRecomendaciones,
        instalacionRecomendacionesDetalle: state.instalacionRecomendacionesDetalle,
        instalacionConfiguracion: state.instalacionConfiguracion,
        instalacionConfiguracionTipos: state.instalacionConfiguracionTipos,
      };

      const updatedColecciones = {
        ...state.mantenimientoColecciones,
        ...(currentTipo ? { [currentTipo]: dataToSave } : {})
      };

      // 2. Recuperar datos del nuevo tipo o usar valores por defecto
      const savedData = updatedColecciones[nextTipo as string] || {
        tareasSeleccionadas: [],
        tareasPersonalizadas: [''],
        piezasUsadas: [],
        observacionesIniciales: '',
        pruebasRealizadas: '',
        diagnosticoFinal: '',
        instalacionRecomendaciones: false,
        instalacionRecomendacionesDetalle: '',
        instalacionConfiguracion: false,
        instalacionConfiguracionTipos: [],
      };

      return {
        ...state,
        tipoMantenimiento: action.payload,
        mantenimientoColecciones: updatedColecciones,
        ...savedData
      }

    case 'TOGGLE_TAREA_PREDEFINIDA':
      return {
        ...state,
        tareasSeleccionadas: state.tareasSeleccionadas.includes(action.payload)
          ? state.tareasSeleccionadas.filter(t => t !== action.payload)
          : [...state.tareasSeleccionadas, action.payload]
      }

    case 'ADD_TAREA_PREDEFINIDA':
      return {
        ...state,
        tareasSeleccionadas: state.tareasSeleccionadas.includes(action.payload)
          ? state.tareasSeleccionadas
          : [...state.tareasSeleccionadas, action.payload]
      }

    case 'SET_TAREAS_SELECCIONADAS':
      return { ...state, tareasSeleccionadas: action.payload }

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

    case 'TOGGLE_GARANTIA_HABILITADA':
      return { ...state, garantiaHabilitada: !state.garantiaHabilitada }

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

    case 'SET_FIRMA_CLIENTE':
      return { ...state, firmaCliente: action.payload }

    case 'SET_VALIDACION_CLIENTE':
      return { ...state, validacionCliente: action.payload }

    case 'TOGGLE_FIRMA_HABILITADA':
      return {
        ...state,
        firmaHabilitada: !state.firmaHabilitada
      }

    case 'SET_ONBOARDING_DATA':
      const onboardingMantenimientoData = {
        tareasSeleccionadas: ['Limpieza interna y externa', 'Optimización de sistema'],
        tareasPersonalizadas: [''],
        piezasUsadas: [],
        observacionesIniciales: '',
        pruebasRealizadas: '',
        diagnosticoFinal: '',
        instalacionRecomendaciones: false,
        instalacionRecomendacionesDetalle: '',
        instalacionConfiguracion: false,
        instalacionConfiguracionTipos: [],
      };
      return {
        ...state,
        clienteSeleccionado: action.payload.cliente,
        dispositivoSeleccionado: action.payload.dispositivo,
        tipoMantenimiento: 'preventivo',
        tareasSeleccionadas: onboardingMantenimientoData.tareasSeleccionadas,
        tareasPersonalizadas: onboardingMantenimientoData.tareasPersonalizadas,
        piezasUsadas: onboardingMantenimientoData.piezasUsadas,
        mantenimientoColecciones: {
          ...state.mantenimientoColecciones,
          preventivo: onboardingMantenimientoData
        },
        garantiaHabilitada: true,
        garantiaDescripcion: 'Garantía extendida por onboarding',
        mesesGarantia: 6,
        firmaHabilitada: true,
        firmaCliente: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        validacionCliente: true,
        highestStepCompleted: 6
      }

    default:
      return state
  }
}

// Configuración de pasos
const STEPS_CONFIG = [
  { key: 'cliente' as FormStep, title: 'Cliente', description: 'Selecciona el cliente', icon: <Users className="w-5 h-5" /> },
  { key: 'dispositivo' as FormStep, title: 'Equipo', description: 'Elige el dispositivo', icon: <Laptop className="w-5 h-5" /> },
  { key: 'mantenimiento' as FormStep, title: 'Trabajo', description: 'Detalla el trabajo', icon: <Wrench className="w-5 h-5" /> },
  { key: 'contador' as FormStep, title: 'Contador', description: 'Registro opcional', icon: <GaugeCircle className="w-5 h-5" /> },
  { key: 'garantia' as FormStep, title: 'Garantía', description: 'Configura garantía', icon: <ShieldCheck className="w-5 h-5" /> },
  { key: 'firma' as FormStep, title: 'Firma', description: 'Firma del cliente', icon: <PenLine className="w-5 h-5" /> },
  { key: 'resumen' as FormStep, title: 'Resumen', description: 'Revisa y confirma', icon: <ClipboardCheck className="w-5 h-5" /> }
] as const



export default function FormularioMantenimiento({ onClose, onSuccess, isOnboarding }: FormularioMantenimientoProps) {
  const { user } = useAuth()
  const { negocio } = useNegocio()
  const isKeyboardVisible = useKeyboardVisible()
  const { imprimirOrden, compartirOrden } = usePrintService({ negocio })
  const { mutateAsync: crearOrdenMutate } = useCrearOrden()
  const [state, dispatch] = usePersistentReducer(
    isOnboarding ? 'draft_onboarding' : 'draft_mantenimiento',
    formReducer,
    initialState,
    useCallback((savedState: FormState) => ({ ...savedState, loading: false }), [])
  )

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Ocultar MobileNav cuando el formulario está abierto
  useEffect(() => {
    const mobileNav = document.getElementById('mobile-nav')
    if (mobileNav) {
      mobileNav.style.display = 'none'
    }

    return () => {
      if (mobileNav) {
        mobileNav.style.display = ''
      }
    }
  }, [])

  // Inyectar datos de prueba para Onboarding
  useEffect(() => {
    if (isOnboarding) {
      document.body.classList.add('onboarding-active');

      // Usar setTimeout para asegurarse de que el dispatch ocurra después del primer render
      setTimeout(() => {
        const testCliente = {
          id: 'test_cliente',
          name: 'Juan Pérez (Cliente de Prueba)',
          email: 'juan@ejemplo.com',
          phone: '555-0123',
          address: 'Av. Siempre Viva 123',
          tipo: 'persona',
          userId: user?.uid || 'test',
          cedula: '1234567890',
          dispositivos: []
        } as unknown as Cliente;

        const testDispositivo = {
          id: 'test_dispositivo',
          type: 'computadora',
          tipo: 'computadora',
          brand: 'TechBrand',
          marca: 'TechBrand',
          model: 'ProBook X200',
          modelo: 'ProBook X200',
          serialNumber: 'SN-987654321',
          numeroSerie: 'SN-987654321',
          clienteId: 'test_cliente',
        } as unknown as Dispositivo;

        dispatch({
          type: 'SET_ONBOARDING_DATA',
          payload: { cliente: testCliente, dispositivo: testDispositivo }
        });
      }, 500);

      return () => {
        document.body.classList.remove('onboarding-active');
      };
    }
  }, [isOnboarding]);

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

  // Inicializar fecha de garantía solo si está vacía
  useEffect(() => {
    if (!state.garantiaTiempoDesde) {
      const hoy = new Date().toISOString().split('T')[0]
      dispatch({ type: 'SET_GARANTIA_TIEMPO_DESDE', payload: hoy })
    }
  }, [state.garantiaTiempoDesde])

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
  useEffect(() => {
    if (state.ordenCreada) {
      // Notificar éxito con vibración si está disponible
      Haptics.notification({ type: NotificationType.Success }).catch(() => { })

      const timeoutId = setTimeout(() => {
        localStorage.removeItem(isOnboarding ? 'draft_onboarding' : 'draft_mantenimiento')
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [state.ordenCreada, isOnboarding])

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
  // VALIDACIONES OPTIMIZADAS
  // ============================================================================

  const stepValidations = useMemo<Record<number, () => boolean>>(() => ({
    0: () => state.clienteSeleccionado !== null, // cliente
    1: () => state.dispositivoSeleccionado !== null, // dispositivo
    2: () => { // mantenimiento
      if (state.tipoMantenimiento === 'diagnostico') {
        return !!(state.observacionesIniciales.trim() && state.pruebasRealizadas.trim() && state.diagnosticoFinal.trim())
      }
      if (state.tipoMantenimiento === 'instalacion') {
        return state.instalacionConfiguracion || state.instalacionRecomendaciones
      }
      const todasLasTareas = [...state.tareasSeleccionadas, ...state.tareasPersonalizadas.filter(t => t.trim())]
      return todasLasTareas.length > 0
    },
    3: () => true, // contador
    4: () => true, // garantia
    5: () => { // firma
      if (!state.firmaHabilitada) return true;
      return state.validacionCliente && !!state.firmaCliente;
    },
    6: () => true, // resumen
  }), [state.clienteSeleccionado, state.dispositivoSeleccionado, state.tipoMantenimiento, state.observacionesIniciales, state.pruebasRealizadas, state.diagnosticoFinal, state.tareasSeleccionadas, state.tareasPersonalizadas, state.instalacionConfiguracion, state.instalacionRecomendaciones, state.garantiaHabilitada, state.firmaHabilitada, state.validacionCliente, state.firmaCliente])

  // Verifica si un paso específico es accesible
  const isStepAccessible = useCallback((stepIndex: number) => {
    // El paso es accesible si:
    // 1. Es el paso actual o uno anterior al más alto completado (para retroceder)
    // 2. O es el siguiente paso después del más alto completado Y el paso actual está completado
    if (stepIndex <= state.highestStepCompleted) return true

    // Solo se puede avanzar un paso a la vez desde el highestStepCompleted
    if (stepIndex === state.highestStepCompleted + 1) {
      return stepValidations[state.highestStepCompleted]()
    }

    return false
  }, [state.highestStepCompleted, stepValidations])

  const canProceedToNextStep = useCallback(() => {
    const currentIndex = STEPS_CONFIG.findIndex(step => step.key === state.currentStep)
    return stepValidations[currentIndex]()
  }, [state.currentStep, stepValidations])

  // ============================================================================
  // HANDLERS OPTIMIZADOS
  // ============================================================================

  const nextStep = useCallback(() => {
    const currentIndex = STEPS_CONFIG.findIndex(step => step.key === state.currentStep)
    if (currentIndex < STEPS_CONFIG.length - 1) {
      const nextIndex = currentIndex + 1

      // Actualizar el highestStepCompleted si avanzamos
      if (nextIndex > state.highestStepCompleted && canProceedToNextStep()) {
        dispatch({ type: 'SET_HIGHEST_STEP_COMPLETED', payload: nextIndex })
      }

      dispatch({ type: 'SET_CURRENT_STEP', payload: STEPS_CONFIG[nextIndex].key })
      scrollToTop()
    }
  }, [state.currentStep, state.highestStepCompleted, canProceedToNextStep, scrollToTop])

  const prevStep = useCallback(() => {
    const currentIndex = STEPS_CONFIG.findIndex(step => step.key === state.currentStep)
    if (currentIndex > 0) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: STEPS_CONFIG[currentIndex - 1].key })
      scrollToTop()
    }
  }, [state.currentStep, scrollToTop])

  // Handler para saltar a un paso específico (solo si es accesible)
  const goToStep = useCallback((stepKey: FormStep) => {
    const targetIndex = STEPS_CONFIG.findIndex(step => step.key === stepKey)
    if (isStepAccessible(targetIndex)) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: stepKey })
      scrollToTop()
    }
  }, [isStepAccessible, scrollToTop])

  // Handlers de Cliente
  const handleSeleccionarCliente = useCallback((cliente: Cliente) => {
    dispatch({ type: 'SET_CLIENTE_SELECCIONADO', payload: cliente })

    // Si estamos en el paso cliente y se selecciona uno, marcar que se puede avanzar
    const currentIndex = STEPS_CONFIG.findIndex(step => step.key === state.currentStep)
    if (currentIndex === 0 && state.highestStepCompleted < 1) {
      dispatch({ type: 'SET_HIGHEST_STEP_COMPLETED', payload: 1 })
    }
  }, [state.currentStep, state.highestStepCompleted])

  const handleDesseleccionarCliente = useCallback(() => {
    dispatch({ type: 'SET_CLIENTE_SELECCIONADO', payload: null })

    // Si deseleccionamos cliente, reducimos el highestStepCompleted si es necesario
    if (state.highestStepCompleted >= 1) {
      dispatch({ type: 'SET_HIGHEST_STEP_COMPLETED', payload: 0 })
    }
  }, [state.highestStepCompleted])

  // Handlers de Dispositivo
  const handleSeleccionarDispositivo = useCallback((dispositivo: Dispositivo) => {
    dispatch({ type: 'SET_DISPOSITIVO_SELECCIONADO', payload: dispositivo })

    const currentIndex = STEPS_CONFIG.findIndex(step => step.key === state.currentStep)
    if (currentIndex === 1 && state.highestStepCompleted < 2) {
      dispatch({ type: 'SET_HIGHEST_STEP_COMPLETED', payload: 2 })
    }
  }, [state.currentStep, state.highestStepCompleted])

  const handleDesseleccionarDispositivo = useCallback(() => {
    dispatch({ type: 'SET_DISPOSITIVO_SELECCIONADO', payload: null })

    if (state.highestStepCompleted >= 2) {
      dispatch({ type: 'SET_HIGHEST_STEP_COMPLETED', payload: 1 })
    }
  }, [state.highestStepCompleted])

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
  // SUBMIT OPTIMIZADO
  // ============================================================================

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uid) {
      alert('Usuario no autenticado');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Construimos la orden sin idPersonalizado (la mutación lo genera)
      const todasLasTareas = [
        ...state.tareasSeleccionadas,
        ...state.tareasPersonalizadas.filter(t => t.trim())
      ];

      const piezasUsadasFiltradas = state.piezasUsadas
        .filter(pieza => pieza?.pieza?.trim())
        .map(pieza => ({
          pieza: pieza.pieza,
          cantidad: pieza.cantidad || 1
        }));

      let contadorParaGuardar: any = null;
      if (state.mostrarContador && state.contador) {
        contadorParaGuardar = {
          tipo: state.contador.tipo,
          valor: state.contador.valor || 0,
          fechaRegistro: new Date(state.contador.fechaRegistro)
        };
        if (state.contador.unidadPersonalizada?.trim())
          contadorParaGuardar.unidadPersonalizada = state.contador.unidadPersonalizada.trim();
        if (state.contador.notas?.trim())
          contadorParaGuardar.notas = state.contador.notas.trim();
      }

      const nuevaOrden: any = {
        tipo: 'mantenimiento',
        horaCreacion: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cliente: state.clienteSeleccionado!,
        clienteId: state.clienteSeleccionado!.id,
        dispositivo: state.dispositivoSeleccionado!,
        dispositivoId: state.dispositivoSeleccionado!.id,
        fechaCreacion: new Date(),
        tipoMantenimiento: state.tipoMantenimiento,
        tareasRealizadas: todasLasTareas,
        piezasUsadas: piezasUsadasFiltradas,
        userId: user.uid,
      };

      if (contadorParaGuardar) nuevaOrden.contador = contadorParaGuardar;

      if (state.tipoMantenimiento === 'diagnostico') {
        nuevaOrden.observacionesIniciales = state.observacionesIniciales.trim();
        nuevaOrden.pruebasRealizadas = state.pruebasRealizadas.trim();
        nuevaOrden.diagnosticoFinal = state.diagnosticoFinal.trim();
        if (state.contadorMaquina !== undefined) nuevaOrden.contadorMaquina = state.contadorMaquina;
      }

      if (state.tipoMantenimiento === 'instalacion') {
        nuevaOrden.instalacionRecomendaciones = state.instalacionRecomendaciones;
        nuevaOrden.instalacionRecomendacionesDetalle = state.instalacionRecomendacionesDetalle;
        nuevaOrden.instalacionConfiguracion = state.instalacionConfiguracion;
        nuevaOrden.instalacionConfiguracionTipos = state.instalacionConfiguracionTipos;
      }

      if (state.garantiaTiempoDesde) nuevaOrden.garantiaTiempoDesde = new Date(state.garantiaTiempoDesde);
      if (state.garantiaTiempoHasta) nuevaOrden.garantiaTiempoHasta = new Date(state.garantiaTiempoHasta);
      if (state.garantiaDescripcion.trim()) nuevaOrden.garantiaDescripcion = state.garantiaDescripcion.trim();

      // Manejo de firma opcional
      nuevaOrden.firmaCliente = state.firmaHabilitada ? state.firmaCliente : null;
      nuevaOrden.nombreFirmante = state.firmaHabilitada ? (state.clienteSeleccionado?.name || 'Cliente') : null;
      nuevaOrden.validacionCliente = state.firmaHabilitada ? state.validacionCliente : false;
      nuevaOrden.garantiaHabilitada = state.garantiaHabilitada;

      // Limpiar undefineds
      Object.keys(nuevaOrden).forEach(key => {
        if (nuevaOrden[key] === undefined) delete nuevaOrden[key];
      });

      // Ejecutar la mutación (ya genera el ID y guarda)
      const resultado = await crearOrdenMutate(nuevaOrden);

      // Usamos el objeto que devuelve la mutación como orden creada
      // Si por algún motivo no viene, construimos uno mínimo
      const ordenFinal = resultado ?? {
        ...nuevaOrden,
        idPersonalizado: 'generada', // se mostrará hasta que se refresque
      };

      dispatch({ type: 'SET_ORDEN_CREADA', payload: ordenFinal });

      // NOTA: NO llamamos a onSuccess aquí, para que el usuario vea la pantalla de éxito
      // El botón "Volver a la lista" de la pantalla de éxito sí llama a onSuccess y onClose
    } catch (error) {
      console.error('Error creando orden:', error);
      alert('Error al crear la orden: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?.uid, state, crearOrdenMutate]);

  // ============================================================================
  // UTILIDADES MEMOIZADAS
  // ============================================================================

  const getTipoMantenimientoLabel = useMemo(() => {
    const labels = {
      preventivo: 'Preventivo',
      correctivo: 'Correctivo',
      diagnostico: 'Diagnóstico',
      instalacion: 'Instalación',
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

    // Si estamos en onboarding y se selecciona preventivo, autoseleccionar tareas de prueba
    if (isOnboarding && tipo === 'preventivo') {
      setTimeout(() => {
        dispatch({ type: 'ADD_TAREA_PREDEFINIDA', payload: 'Limpieza interna y externa' });
        dispatch({ type: 'ADD_TAREA_PREDEFINIDA', payload: 'Optimización de sistema' });
      }, 50);
    }
  }, [isOnboarding])

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
    setPiezasUsadas: handleSetPiezasUsadas,
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
            garantiaHabilitada={state.garantiaHabilitada}
            onToggleGarantia={() => dispatch({ type: 'TOGGLE_GARANTIA_HABILITADA' })}
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

      case 'firma':
        return (
          <FirmaInput
            firmaHabilitada={state.firmaHabilitada}
            onToggleFirma={() => dispatch({ type: 'TOGGLE_FIRMA_HABILITADA' })}
            firmaCliente={state.firmaCliente || ''}
            setFirmaCliente={(firma) => dispatch({ type: 'SET_FIRMA_CLIENTE', payload: firma })}
            validacionCliente={state.validacionCliente}
            setValidacionCliente={(valida) => dispatch({ type: 'SET_VALIDACION_CLIENTE', payload: valida })}
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

  const currentStepIndex = STEPS_CONFIG.findIndex(s => s.key === state.currentStep)



  return (
    <div className="h-[calc(100dvh-5rem)] w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden relative">
      {/* Onboarding Contextual Hint & Progress */}
      <AnimatePresence mode="wait">
        {isOnboarding && (
          <motion.div 
            key={state.currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed bottom-28 left-4 right-4 z-[35] pointer-events-none"
          >
            <div className="max-w-4xl mx-auto space-y-2">
              {/* Card de Hint */}
              <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-2xl border border-blue-400/30 flex items-start space-x-4 pointer-events-auto">
                <div className="bg-white/20 p-2 rounded-xl shrink-0">
                  {ONBOARDING_HINTS[state.currentStep].icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-0.5">{ONBOARDING_HINTS[state.currentStep].title}</h4>
                  <p className="text-xs text-blue-50/90 leading-relaxed">
                    {ONBOARDING_HINTS[state.currentStep].hint}
                  </p>
                </div>
              </div>

              {/* Indicador de Progreso Flotante */}
              <div className="bg-blue-700/80 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-blue-400/20 flex items-center justify-between text-white pointer-events-auto">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-200" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-50">
                    Paso {currentStepIndex + 1} de 7
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(7)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 w-4 rounded-full transition-all duration-500 ${i <= currentStepIndex ? 'bg-white' : 'bg-blue-400/30'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-900/95 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center space-x-3">
          <button
            onClick={onClose}
            className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-gray-800 transition-all active:scale-95 touch-manipulation"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
              Nueva Orden
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">
              Paso {currentStepIndex + 1} de {STEPS_CONFIG.length}
            </p>
          </div>
        </div>
      </header>

      {/* Stepper Mobile (carrusel horizontal) - SOLO pasos accesibles */}
      <div className="lg:hidden sticky top-[57px] z-20 bg-gray-900/90 border-b border-gray-800">
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex px-4 py-3 gap-4 min-w-max">
            {STEPS_CONFIG.map((step, index) => {
              const isCompleted = stepValidations[index]?.() && state.highestStepCompleted > index
              const isCurrent = state.currentStep === step.key
              const accessible = isStepAccessible(index)

              return (
                <button
                  key={step.key}
                  onClick={() => goToStep(step.key)}
                  disabled={!accessible}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all text-sm font-medium whitespace-nowrap ${!accessible
                      ? 'bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed'
                      : isCurrent
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : isCompleted
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : step.icon}
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
              )
            })}
          </div>
        </div>
        {/* Barra de progreso lineal */}
        <div className="h-1 bg-gray-800 w-full">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out rounded-r-full"
            style={{ width: `${((state.highestStepCompleted + 1) / STEPS_CONFIG.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Stepper Desktop (círculos conectados) */}
      <div className="hidden lg:block max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          {STEPS_CONFIG.map((step, index) => {
            const isCompleted = stepValidations[index]?.() && state.highestStepCompleted > index
            const isCurrent = state.currentStep === step.key
            const accessible = isStepAccessible(index)

            return (
              <div key={step.key} className="flex items-center flex-1">
                <button
                  onClick={() => goToStep(step.key)}
                  disabled={!accessible}
                  className={`flex flex-col items-center cursor-pointer disabled:cursor-not-allowed`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${!accessible
                        ? 'bg-gray-800/50 border-gray-800 cursor-not-allowed'
                        : isCompleted
                          ? 'bg-green-500 border-green-500 scale-105'
                          : isCurrent
                            ? 'bg-blue-500 border-blue-500 scale-110 shadow-lg shadow-blue-500/50'
                            : 'bg-gray-700 border-gray-600'
                      }`}
                  >
                    {isCompleted && accessible ? <CheckCircle className="w-6 h-6 text-white" /> : step.icon}
                  </div>
                  <span className={`text-sm mt-2 text-center font-medium ${!accessible
                      ? 'text-gray-600'
                      : isCurrent
                        ? 'text-blue-400'
                        : isCompleted
                          ? 'text-green-400'
                          : 'text-gray-500'
                    }`}>
                    {step.title}
                  </span>
                  <span className="text-xs text-center text-gray-600">{step.description}</span>
                </button>
                {index < STEPS_CONFIG.length - 1 && (
                  <div className={`flex-1 h-1 mx-3 rounded transition-all ${isCompleted && accessible ? 'bg-green-500' : 'bg-gray-700'
                    }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Contenido del paso actual */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full pt-4 pb-32">
        <form id="mantenimiento-form" onSubmit={handleSubmit}>
          <div className="animate-fadeIn transition-all duration-300 ease-in-out">
            {renderCurrentStep()}
          </div>
        </form>
      </main>

      {/* Barra de navegación inferior flotante */}
      <div 
        className={`h-24 w-full fixed bottom-0 left-0 right-0 z-30 bg-gray-900/95 border-t border-gray-800 transition-all duration-300 transform ${
          isKeyboardVisible ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prevStep}
            disabled={state.currentStep === 'cliente'}
            className="flex items-center justify-center h-12 px-5 text-base font-medium text-gray-300 bg-gray-800 rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 touch-manipulation min-w-[100px]"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">Anterior</span>
            <span className="sm:hidden">Atrás</span>
          </button>

          {state.currentStep === 'resumen' ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={state.loading}
                className="h-12 px-5 text-base font-medium text-gray-300 bg-gray-800 rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-all active:scale-95 touch-manipulation"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="mantenimiento-form"
                disabled={state.loading}
                className="flex items-center justify-center h-12 px-6 text-base font-bold text-white bg-gradient-to-r from-blue-500 to-blue-500 rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-blue-600/30 touch-manipulation"
              >
                {state.loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
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
              className="flex items-center justify-center h-12 px-6 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-blue-500/30 touch-manipulation flex-1 min-w-[140px]"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">Continuar</span>
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>

        {/* Mensaje de validación (solo en móvil) */}
        {!canProceedToNextStep() && state.currentStep !== 'resumen' && (
          <div className="px-4 pb-2 text-center">
            <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg py-2 px-3">
              {state.currentStep === 'cliente' && 'Selecciona un cliente para continuar'}
              {state.currentStep === 'dispositivo' && 'Selecciona un dispositivo para continuar'}
              {state.currentStep === 'mantenimiento' && state.tipoMantenimiento === 'diagnostico' && 'Completa todos los campos del diagnóstico'}
              {state.currentStep === 'mantenimiento' && state.tipoMantenimiento === 'instalacion' && 'Configura o agrega recomendaciones para continuar'}
              {state.currentStep === 'mantenimiento' && state.tipoMantenimiento !== 'diagnostico' && state.tipoMantenimiento !== 'instalacion' && 'Agrega al menos una tarea para continuar'}
              {state.currentStep === 'firma' && 'Debe aceptar los términos y firmar para continuar'}
            </p>
          </div>
        )}
      </div>

      {/* Pantalla de Éxito Premium */}
      {/* Pantalla de Éxito Premium - Renderizada en portal para evitar problemas de containing block */}
      {state.ordenCreada &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/90 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative"
              >
                <div className="p-8 flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12, delay: 0.2 }}
                    className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-600/40"
                  >
                    <Check className="w-10 h-10 text-white stroke-[3px]" />
                  </motion.div>

                  <h2 className="text-2xl font-bold text-white mb-2">¡Orden Generada!</h2>
                  <p className="text-gray-400 mb-6">
                    La orden <span className="text-blue-400 font-mono">#{state.ordenCreada.idPersonalizado}</span> ha sido registrada correctamente.
                  </p>

                  <div className="w-full space-y-3">
                    <button
                      onClick={() => compartirOrden(state.ordenCreada!)}
                      className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center gap-3 font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/30"
                    >
                      <Share2 className="w-5 h-5" />
                      Compartir Orden
                    </button>
                    <button
                      onClick={() => {
                        onSuccess();
                        onClose();
                      }}
                      className="w-full h-12 mt-4 text-gray-400 hover:text-white font-medium transition-colors"
                    >
                      Volver a la lista
                    </button>
                  </div>
                </div>

                {/* Decoración premium */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-50" />
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )
      }
    </div>
  )
}
