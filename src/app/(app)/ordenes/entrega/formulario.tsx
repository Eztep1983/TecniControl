'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { OrdenEntrega, Cliente, Dispositivo } from '@/types/orden'
import { ArrowLeft, ChevronRight, ChevronLeft, CheckCircle, Users, Laptop, ShieldCheck, Check, PenTool, ClipboardCheck } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { 
  getClientesPorUsuario, 
  crearOrden,
} from '@/lib/multiuser-helpers'
import { obtenerProximoNumeroOrden, formatearIdOrden } from '@/lib/firebase-utils'
import { usePersistentReducer } from '@/hooks/usePersistentReducer'

// Componentes importados
import ClienteSelector from '@/components/forms/ClienteSelector'
import DispositivoSelector from '@/components/forms/DispositivoSelector'
import EvidenciaEntrega from '@/components/forms/EvidenciaEntrega'
import TerminosEntrega from '@/components/forms/TerminosEntrega'
import FirmaInput from '@/components/forms/FirmaInput'
import ResumenEntrega from '@/components/forms/ResumenEntrega'

interface FormularioEntregaProps {
  onClose: () => void
  onSuccess: () => void
}

export type FormStepEntrega = 'cliente' | 'dispositivo' | 'entrega' | 'terminos' | 'firma' | 'resumen'

// ============================================================================
// STATE MANAGEMENT CON USEREDUCER
// ============================================================================
export interface FormStateEntrega {
  currentStep: FormStepEntrega
  loading: boolean
  
  // Cliente y Dispositivo
  clientes: Cliente[]
  clienteSeleccionado: Cliente | null
  dispositivoSeleccionado: Dispositivo | null
  busquedaCliente: string
  
  // Entrega Info
  reparacionesRealizadas: string
  repuestosUtilizados: string
  observacionesFinales: string
  
  // Firma
  firmaCliente: string
  validacionCliente: boolean
  nombreFirmante: string
  
  // Éxito
  ordenCreada?: OrdenEntrega
}

type FormActionEntrega =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_STEP'; payload: FormStepEntrega }
  | { type: 'SET_CLIENTES'; payload: Cliente[] }
  | { type: 'SET_CLIENTE_SELECCIONADO'; payload: Cliente | null }
  | { type: 'SET_DISPOSITIVO_SELECCIONADO'; payload: Dispositivo | null }
  | { type: 'SET_BUSQUEDA_CLIENTE'; payload: string }
  | { type: 'SET_REPARACIONES_REALIZADAS'; payload: string }
  | { type: 'SET_REPUESTOS_UTILIZADOS'; payload: string }
  | { type: 'SET_OBSERVACIONES_FINALES'; payload: string }
  | { type: 'SET_FIRMA_CLIENTE'; payload: string }
  | { type: 'SET_VALIDACION_CLIENTE'; payload: boolean }
  | { type: 'SET_NOMBRE_FIRMANTE'; payload: string }
  | { type: 'SET_ORDEN_CREADA'; payload: OrdenEntrega }

const initialState: FormStateEntrega = {
  currentStep: 'cliente',
  loading: false,
  clientes: [],
  clienteSeleccionado: null,
  dispositivoSeleccionado: null,
  busquedaCliente: '',
  reparacionesRealizadas: '',
  repuestosUtilizados: '',
  observacionesFinales: '',
  firmaCliente: '',
  validacionCliente: false,
  nombreFirmante: '',
}

function formReducer(state: FormStateEntrega, action: FormActionEntrega): FormStateEntrega {
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
        dispositivoSeleccionado: null,
        busquedaCliente: '',
        nombreFirmante: action.payload ? action.payload.name : state.nombreFirmante
      }
    case 'SET_DISPOSITIVO_SELECCIONADO':
      return { ...state, dispositivoSeleccionado: action.payload }
    case 'SET_BUSQUEDA_CLIENTE':
      return { ...state, busquedaCliente: action.payload }
    case 'SET_REPARACIONES_REALIZADAS':
      return { ...state, reparacionesRealizadas: action.payload }
    case 'SET_REPUESTOS_UTILIZADOS':
      return { ...state, repuestosUtilizados: action.payload }
    case 'SET_OBSERVACIONES_FINALES':
      return { ...state, observacionesFinales: action.payload }
    case 'SET_FIRMA_CLIENTE':
      return { ...state, firmaCliente: action.payload }
    case 'SET_VALIDACION_CLIENTE':
      return { ...state, validacionCliente: action.payload }
    case 'SET_NOMBRE_FIRMANTE':
      return { ...state, nombreFirmante: action.payload }
    case 'SET_ORDEN_CREADA':
      return { ...state, ordenCreada: action.payload }
    default:
      return state
  }
}

// Configuración de pasos
const STEPS_CONFIG = [
  {
    key: 'cliente' as FormStepEntrega,
    title: 'Cliente',
    description: 'Selecciona el cliente',
    icon: <Users className="w-5 h-5" />
  },
  {
    key: 'dispositivo' as FormStepEntrega,
    title: 'Dispositivo',
    description: 'Elige el dispositivo',
    icon: <Laptop className="w-5 h-5" />
  },
  {
    key: 'entrega' as FormStepEntrega,
    title: 'Detalles',
    description: 'Evidencia e Info',
    icon: <ClipboardCheck className="w-5 h-5" />
  },
  {
    key: 'terminos' as FormStepEntrega,
    title: 'Términos',
    description: 'Derechos y Responsabilidades',
    icon: <ShieldCheck className="w-5 h-5" />
  },
  {
    key: 'firma' as FormStepEntrega,
    title: 'Conformidad',
    description: 'Firma Digital',
    icon: <PenTool className="w-5 h-5" />
  },
  {
    key: 'resumen' as FormStepEntrega,
    title: 'Resumen',
    description: 'Revisa y confirma',
    icon: <CheckCircle className="w-5 h-5" />
  }
] as const

export default function FormularioEntrega({ onClose, onSuccess }: FormularioEntregaProps) {
  const { user } = useAuth()
  const [state, dispatch] = usePersistentReducer(
    'draft_entrega',
    formReducer,
    initialState,
    useCallback((savedState: FormStateEntrega) => ({ ...savedState, loading: false }), [])
  )

  // ============================================================================
  // EFFECTS
  // ============================================================================
  
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
    return () => { mounted = false }
  }, [user?.uid])

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
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
    return () => window.removeEventListener('popstate', handlePopState)
  }, [state.currentStep, onClose])

  useEffect(() => {
    if (state.ordenCreada) {
      const timeoutId = setTimeout(() => {
        localStorage.removeItem('draft_entrega')
      }, 150)
      return () => clearTimeout(timeoutId)
    }
  }, [state.ordenCreada])

  // ============================================================================
  // UTILIDADES Y HANDLERS
  // ============================================================================
  
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => {
      const mainContainer = document.querySelector('.min-h-screen')
      if (mainContainer) {
        mainContainer.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 50)
  }, [])

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

  const stepValidations = useMemo(() => ({
    cliente: () => state.clienteSeleccionado !== null,
    dispositivo: () => state.dispositivoSeleccionado !== null,
    entrega: () => state.observacionesFinales.trim() !== '',
    terminos: () => true,
    firma: () => state.firmaCliente !== '' && state.validacionCliente && state.nombreFirmante.trim() !== '',
    resumen: () => true,
  }), [
    state.clienteSeleccionado,
    state.dispositivoSeleccionado,
    state.observacionesFinales,
    state.firmaCliente,
    state.validacionCliente,
    state.nombreFirmante
  ])

  const canProceedToNextStep = useCallback((): boolean => {
    return stepValidations[state.currentStep]()
  }, [state.currentStep, stepValidations])

  // ============================================================================
  // SUBMIT
  // ============================================================================
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.uid) {
      alert('Usuario no autenticado')
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      const proximoNumero = await obtenerProximoNumeroOrden('entrega')
      const idPersonalizado = formatearIdOrden(proximoNumero, 'entrega')

      const nuevaOrden: any = {
        tipo: 'entrega',
        idPersonalizado,
        userId: user.uid,
        cliente: state.clienteSeleccionado!,
        dispositivo: state.dispositivoSeleccionado!,
        fechaCreacion: new Date(),
        fechaEntrega: new Date(),
        observacionesFinales: state.observacionesFinales.trim(),
        firmaCliente: state.firmaCliente,
        validacionCliente: state.validacionCliente,
      }

      if (state.reparacionesRealizadas.trim()) {
        nuevaOrden.reparacionesRealizadas = state.reparacionesRealizadas.trim()
      }
      if (state.repuestosUtilizados.trim()) {
        nuevaOrden.repuestosUtilizados = state.repuestosUtilizados.trim()
      }

      await crearOrden(nuevaOrden, user.uid)
      
      dispatch({ type: 'SET_ORDEN_CREADA', payload: nuevaOrden })
    } catch (error) {
      console.error('Error creando orden:', error)
      alert('Error al crear la orden: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [user?.uid, state])

  // ============================================================================
  // RENDER PASOS
  // ============================================================================
  
  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 'cliente':
        return (
          <ClienteSelector
            clientes={state.clientes}
            clienteSeleccionado={state.clienteSeleccionado}
            onSeleccionarCliente={(c) => dispatch({ type: 'SET_CLIENTE_SELECCIONADO', payload: c })}
            onDesseleccionarCliente={() => dispatch({ type: 'SET_CLIENTE_SELECCIONADO', payload: null })}
          />
        )
      case 'dispositivo':
        return (
          <DispositivoSelector
            cliente={state.clienteSeleccionado!}
            dispositivoSeleccionado={state.dispositivoSeleccionado}
            onSeleccionarDispositivo={(d) => dispatch({ type: 'SET_DISPOSITIVO_SELECCIONADO', payload: d })}
            onDesseleccionarDispositivo={() => dispatch({ type: 'SET_DISPOSITIVO_SELECCIONADO', payload: null })}
            onClienteActualizado={(c) => dispatch({ type: 'SET_CLIENTE_SELECCIONADO', payload: c })}
          />
        )
      case 'entrega':
        return (
          <EvidenciaEntrega
            observacionesFinales={state.observacionesFinales}
            setObservacionesFinales={(v) => dispatch({ type: 'SET_OBSERVACIONES_FINALES', payload: v })}
            reparacionesRealizadas={state.reparacionesRealizadas}
            setReparacionesRealizadas={(v) => dispatch({ type: 'SET_REPARACIONES_REALIZADAS', payload: v })}
            repuestosUtilizados={state.repuestosUtilizados}
            setRepuestosUtilizados={(v) => dispatch({ type: 'SET_REPUESTOS_UTILIZADOS', payload: v })}
          />
        )
      case 'terminos':
        return <TerminosEntrega />
      case 'firma':
        return (
          <FirmaInput
            firmaCliente={state.firmaCliente}
            setFirmaCliente={(v) => dispatch({ type: 'SET_FIRMA_CLIENTE', payload: v })}
            validacionCliente={state.validacionCliente}
            setValidacionCliente={(v) => dispatch({ type: 'SET_VALIDACION_CLIENTE', payload: v })}
            nombreFirmante={state.nombreFirmante}
            setNombreFirmante={(v) => dispatch({ type: 'SET_NOMBRE_FIRMANTE', payload: v })}
          />
        )
      case 'resumen':
        return <ResumenEntrega state={state} />
    }
  }

  if (!user) return null

  if (state.ordenCreada) {
    return (
      <div className="fixed inset-0 bg-gray-900 border-b border-gray-800 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-xl w-full max-w-lg text-center animate-in zoom-in-95 fade-in duration-300">
          <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Entrega Registrada!</h2>
          <p className="text-gray-400 mb-8">
            La orden <span className="text-gray-200 font-semibold">#{state.ordenCreada.idPersonalizado}</span> ha sido guardada exitosamente.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                localStorage.removeItem('draft_entrega')
                onSuccess()
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-500/20"
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
      <div className="bg-gray-900/95 border-b border-gray-800 shadow-lg">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button onClick={onClose} className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-gray-800 transition-all active:scale-95 touch-manipulation">
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white truncate">Nueva Entrega</h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">
                Paso {STEPS_CONFIG.findIndex(s => s.key === state.currentStep) + 1} de {STEPS_CONFIG.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {/* Desktop Progress */}
        <div className="hidden lg:block mb-8">
          <div className="flex items-center justify-between">
            {STEPS_CONFIG.map((step, index) => {
              const currentIndex = STEPS_CONFIG.findIndex(s => s.key === state.currentStep)
              const isCompleted = currentIndex > index
              const isCurrent = state.currentStep === step.key
              
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-green-500 border-green-500 scale-105' : isCurrent ? 'bg-blue-500 border-blue-500 scale-110 shadow-lg shadow-blue-500/50' : 'bg-gray-700 border-gray-600'}`}>
                      {isCompleted ? <CheckCircle className="w-6 h-6 text-white" /> : <span className="text-xl">{step.icon}</span>}
                    </div>
                    <span className={`text-sm mt-2 text-center font-medium ${isCurrent ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-500'}`}>{step.title}</span>
                    <span className={`text-xs text-center ${isCurrent ? 'text-gray-400' : 'text-gray-600'}`}>{step.description}</span>
                  </div>
                  {index < STEPS_CONFIG.length - 1 && <div className={`flex-1 h-1 mx-3 rounded transition-all ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}`} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile Progress */}
        <div className="lg:hidden mb-6">
          <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-xl text-white">
                  {STEPS_CONFIG[STEPS_CONFIG.findIndex(s => s.key === state.currentStep)].icon}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{STEPS_CONFIG[STEPS_CONFIG.findIndex(s => s.key === state.currentStep)].title}</h2>
                  <p className="text-xs text-gray-400">{STEPS_CONFIG[STEPS_CONFIG.findIndex(s => s.key === state.currentStep)].description}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                {STEPS_CONFIG.findIndex(s => s.key === state.currentStep) + 1}/{STEPS_CONFIG.length}
              </span>
            </div>
            
            <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out" style={{ width: `${((STEPS_CONFIG.findIndex(s => s.key === state.currentStep) + 1) / STEPS_CONFIG.length) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="animate-fadeIn">
            {renderCurrentStep()}
          </div>

          <div className="fixed bottom-0 left-0 right-0 sm:relative bg-gray-900/95 sm:bg-transparent border-t sm:border-t-0 border-gray-800 sm:border-gray-700 mt-0 sm:mt-8 pt-0 sm:pt-6 z-20">
            <div className="max-w-4xl mx-auto px-3 sm:px-0 py-3 sm:py-0">
              <div className="flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={state.currentStep === 'cliente'}
                  className="flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-300 bg-gray-800 rounded-lg sm:rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-all shadow-lg sm:shadow-none"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">Atrás</span>
                </button>

                {state.currentStep === 'resumen' ? (
                  <div className="flex gap-2 sm:gap-3 flex-1 sm:flex-initial justify-end">
                    <button type="button" onClick={onClose} disabled={state.loading} className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-300 bg-gray-800 rounded-lg sm:rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-all">Cancelar</button>
                    <button type="submit" disabled={state.loading} className="flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-green-600 to-green-500 rounded-lg sm:rounded-xl hover:from-green-700 hover:to-green-600 disabled:opacity-50 transition-all">
                      {state.loading ? 'Guardando...' : <><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />Registrar Entrega</>}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceedToNextStep()}
                    className="flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 transition-all flex-1 sm:flex-initial"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <span className="sm:hidden">Continuar</span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}