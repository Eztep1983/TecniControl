import React, { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Eraser, PenSquare, PenOff, PenIcon, AlertCircle, Undo, CheckCircle2, Info } from 'lucide-react'
import { useSignatureCanvas, SignatureState } from '../../hooks/useSignatureCanvas'

interface FirmaInputProps {
  signatureState: SignatureState
  onChange: (state: SignatureState) => void
}

export default function FirmaInput({
  signatureState,
  onChange,
}: FirmaInputProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const switchRef = useRef<HTMLButtonElement>(null)
  const [isConfirmingClear, setIsConfirmingClear] = useState(false)
  const [touchedFields, setTouchedFields] = useState<{
    nombre?: boolean
    cedula?: boolean
    firma?: boolean
    validacion?: boolean
  }>({})
  const [canvasTouched, setCanvasTouched] = useState(false)
  const [showConfirmToggle, setShowConfirmToggle] = useState(false)

  const { guardarFirma, limpiarFirma } = useSignatureCanvas(
    containerRef,
    sigCanvas,
    signatureState.firma,
    (firma) => onChange({ ...signatureState, firma })
  )

  const isEmpty = !signatureState.firma && !canvasTouched

  // Resetear confirmación de limpieza automáticamente después de 3s
  useEffect(() => {
    if (!isConfirmingClear) return
    const timer = setTimeout(() => setIsConfirmingClear(false), 3000)
    return () => clearTimeout(timer)
  }, [isConfirmingClear])

  const handleToggle = () => {
    if (signatureState.habilitada) {
      const tieneDatos =
        !!signatureState.firma ||
        !!signatureState.nombreReceptor?.trim() ||
        !!signatureState.cedulaReceptor?.trim() ||
        !!signatureState.validada

      if (tieneDatos) {
        setShowConfirmToggle(true)
      } else {
        // Desactivar inmediatamente si no hay datos
        onChange({
          ...signatureState,
          habilitada: false,
          firma: null,
          validada: false,
          nombreReceptor: '',
          cedulaReceptor: '',
        })
        setTouchedFields({})
        setCanvasTouched(false)
      }
    } else {
      // Activar
      onChange({
        ...signatureState,
        habilitada: true,
      })
    }
  }

  const handleClear = () => {
    if (isConfirmingClear) {
      limpiarFirma()
      setIsConfirmingClear(false)
      setCanvasTouched(false)
      setTouchedFields(prev => ({ ...prev, firma: false }))
    } else {
      setIsConfirmingClear(true)
    }
  }

  const handleUndo = () => {
    if (sigCanvas.current) {
      const data = sigCanvas.current.toData()
      if (data && data.length > 0) {
        data.pop()
        sigCanvas.current.fromData(data)
        if (data.length === 0) {
          onChange({ ...signatureState, firma: null })
          setCanvasTouched(false)
          setTouchedFields(prev => ({ ...prev, firma: false }))
        } else {
          guardarFirma()
        }
      }
    }
  }

  const showFirmaError = signatureState.habilitada && touchedFields.firma && !signatureState.firma
  const showValidacionError = signatureState.habilitada && touchedFields.validacion && !signatureState.validada
  const showNombreError = signatureState.habilitada && touchedFields.nombre && !signatureState.nombreReceptor?.trim()
  const showCedulaError = signatureState.habilitada && touchedFields.cedula && (
    !signatureState.cedulaReceptor?.trim() || signatureState.cedulaReceptor.trim().length < 5
  )

  return (
    <div className="space-y-6">
      <div>
        {/* Interruptor principal */}
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg hover:border-gray-600/50 transition-colors mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                signatureState.habilitada
                  ? 'bg-blue-500/20 shadow-inner'
                  : 'bg-gray-700/50 shadow-none'
              }`}
            >
              {signatureState.habilitada ? (
                <PenSquare className="w-6 h-6 text-blue-400" />
              ) : (
                <PenOff className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-100 flex items-center gap-2">
                Firma de conformidad
              </h3>
              <p
                className={`text-xs sm:text-sm transition-colors duration-300 ${
                  signatureState.habilitada
                    ? 'text-blue-300/80'
                    : 'text-gray-500'
                }`}
              >
                {signatureState.habilitada
                  ? 'Firma requerida del cliente'
                  : 'No se requiere firma'}
              </p>
            </div>
          </div>

          <button
            ref={switchRef}
            type="button"
            role="switch"
            aria-checked={signatureState.habilitada}
            onClick={handleToggle}
            className={`
              relative inline-flex h-8 w-14 sm:h-9 sm:w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
              transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
              ${signatureState.habilitada ? 'bg-blue-500' : 'bg-gray-600'}
            `}
          >
            <span className="sr-only">
              {signatureState.habilitada ? "Desactivar firma" : "Activar firma"}
            </span>
            <span
              className={`
                pointer-events-none inline-block h-7 w-7 sm:h-8 sm:w-8 transform rounded-full bg-white shadow-md 
                transition duration-300 ease-in-out
                ${
                  signatureState.habilitada
                    ? 'translate-x-6 sm:translate-x-7'
                    : 'translate-x-0'
                }
              `}
            />
          </button>
        </div>

        {/* Advertencia de confirmación inline */}
        {showConfirmToggle && (
          <div role="alert" className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <p className="text-xs text-amber-200 leading-relaxed">
              Desactivar la firma eliminará los datos ingresados del receptor (nombre y cédula), la firma dibujada y la aceptación de términos. ¿Estás seguro de que deseas continuar?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmToggle(false)
                  switchRef.current?.focus()
                }}
                className="px-3.5 py-2 text-xs font-semibold text-gray-300 hover:text-white rounded-lg hover:bg-gray-800 transition-colors min-h-[40px] flex items-center justify-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmToggle(false)
                  onChange({
                    ...signatureState,
                    habilitada: false,
                    firma: null,
                    validada: false,
                    nombreReceptor: '',
                    cedulaReceptor: '',
                  })
                  setTouchedFields({})
                  setCanvasTouched(false)
                  setTimeout(() => {
                    switchRef.current?.focus()
                  }, 0)
                }}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-gray-950 rounded-lg transition-colors active:scale-95 min-h-[40px] flex items-center justify-center shadow-lg shadow-amber-900/10"
              >
                Sí, desactivar
              </button>
            </div>
          </div>
        )}

        {signatureState.habilitada ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Campos del Receptor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-800/40 p-4 border border-gray-700/30 rounded-2xl">
              <div className="space-y-1.5">
                <label htmlFor="nombreReceptor" className="block text-sm font-medium text-gray-300">
                  Nombre Completo del Receptor <span className="text-red-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  id="nombreReceptor"
                  required
                  aria-required="true"
                  aria-invalid={showNombreError ? "true" : "false"}
                  value={signatureState.nombreReceptor || ''}
                  onChange={(e) => onChange({ ...signatureState, nombreReceptor: e.target.value })}
                  onBlur={() => {
                    const trimmed = signatureState.nombreReceptor?.trim() || ''
                    onChange({ ...signatureState, nombreReceptor: trimmed })
                    setTouchedFields(prev => ({ ...prev, nombre: true }))
                  }}
                  placeholder="Ej. Juan Pérez"
                  className={`w-full px-4 py-3 bg-gray-900/60 border rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 outline-none ${
                    showNombreError ? 'border-red-500/50 focus:border-red-500/50' : 'border-gray-700/50'
                  }`}
                />
                {showNombreError && (
                  <p role="alert" className="text-xs text-red-400 flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    El nombre del receptor es obligatorio.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cedulaReceptor" className="block text-sm font-medium text-gray-300">
                  Cédula del Receptor <span className="text-red-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="cedulaReceptor"
                  required
                  aria-required="true"
                  aria-invalid={showCedulaError ? "true" : "false"}
                  value={signatureState.cedulaReceptor || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    if (/\D/.test(val)) {
                      const selectionStart = e.target.selectionStart || 0
                      const selectionEnd = e.target.selectionEnd || 0
                      
                      // Count non-digits up to selectionStart and selectionEnd
                      const valBeforeStart = val.slice(0, selectionStart)
                      const valBeforeEnd = val.slice(0, selectionEnd)
                      const nonDigitsStart = (valBeforeStart.match(/\D/g) || []).length
                      const nonDigitsEnd = (valBeforeEnd.match(/\D/g) || []).length
                      
                      const clean = val.replace(/\D/g, '')
                      onChange({ ...signatureState, cedulaReceptor: clean })
                      
                      setTimeout(() => {
                        if (e.target) {
                          e.target.setSelectionRange(
                            Math.max(0, selectionStart - nonDigitsStart),
                            Math.max(0, selectionEnd - nonDigitsEnd)
                          )
                        }
                      }, 0)
                    } else {
                      onChange({ ...signatureState, cedulaReceptor: val })
                    }
                  }}
                  onBlur={() => {
                    const trimmed = signatureState.cedulaReceptor?.trim() || ''
                    onChange({ ...signatureState, cedulaReceptor: trimmed })
                    setTouchedFields(prev => ({ ...prev, cedula: true }))
                  }}
                  placeholder="Ej. 123456789"
                  className={`w-full px-4 py-3 bg-gray-900/60 border rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 outline-none ${
                    showCedulaError ? 'border-red-500/50 focus:border-red-500/50' : 'border-gray-700/50'
                  }`}
                />
                {showCedulaError && (
                  <p role="alert" className="text-xs text-red-400 flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {!signatureState.cedulaReceptor?.trim()
                      ? 'La cédula del receptor es obligatoria.'
                      : 'La cédula debe tener al menos 5 dígitos.'}
                  </p>
                )}
              </div>
            </div>

            {/* Lienzo de firma */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Firma Digital del Receptor <span className="text-red-400 font-bold">*</span>
                </label>
                <div className="flex gap-2 justify-end w-full sm:w-auto">
                  {!isEmpty && (
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="text-xs flex items-center justify-center px-4 py-2.5 rounded-xl bg-gray-700/50 text-gray-300 hover:text-white transition-all active:scale-95 min-h-[40px] min-w-[90px]"
                    >
                      <Undo className="w-4 h-4 mr-1.5" />
                      Deshacer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClear}
                    className={`text-xs flex items-center justify-center px-4 py-2.5 rounded-xl transition-all active:scale-95 min-h-[40px] min-w-[90px] ${
                      isConfirmingClear
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-red-500/10 text-red-400 hover:text-red-300'
                    }`}
                  >
                    <Eraser className="w-4 h-4 mr-1.5" />
                    {isConfirmingClear ? '¿Confirmar?' : 'Limpiar'}
                  </button>
                </div>
              </div>

              <div
                ref={containerRef}
                className={`border-2 border-dashed rounded-xl bg-white overflow-hidden relative shadow-inner touch-none ${
                  showFirmaError ? 'border-red-500/50' : 'border-gray-600/50'
                }`}
                style={{ height: 'clamp(160px, 28dvh, 240px)' }}
              >
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  minWidth={1.5}
                  maxWidth={4.5}
                  canvasProps={{
                    className: 'cursor-crosshair',
                    style: {
                      display: 'block',
                      touchAction: 'none',
                      width: '100%',
                      height: '100%',
                    },
                  }}
                  onBegin={() => {
                    setCanvasTouched(true)
                  }}
                  onEnd={() => {
                    guardarFirma()
                    setTouchedFields(prev => ({ ...prev, firma: true }))
                  }}
                  clearOnResize={false}
                />
                {isEmpty && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-400 bg-white/80 px-3 py-1 rounded-full scale-95 opacity-80">
                      Firme aquí
                    </span>
                  </div>
                )}
              </div>

              {showFirmaError && (
                <p role="alert" className="text-xs text-red-400 flex items-center gap-1.5 mt-2 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  La firma es obligatoria.
                </p>
              )}

              <div className="p-4 rounded-3xl border border-blue-500/20 bg-blue-500/5 text-blue-100 space-y-2 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Info className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-sm font-medium">
                    Para que esta firma sea válida debe ser firmada por el cliente o el receptor relacionado al cliente/empresa en esta orden.
                  </p>
                </div>
              </div>
            </div>

            {/* Checkbox de aceptación mejorado */}
            <div className="space-y-3">
              <label
                htmlFor="validacionCliente"
                className={`flex items-start p-4 rounded-xl border transition-all cursor-pointer ${
                  signatureState.validada
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5 relative">
                  <input
                    id="validacionCliente"
                    type="checkbox"
                    checked={signatureState.validada}
                    onChange={(e) => {
                      setTouchedFields(prev => ({ ...prev, validacion: true }))
                      onChange({ ...signatureState, validada: e.target.checked })
                    }}
                    className="sr-only peer"
                  />
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                      signatureState.validada
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-gray-900 border-gray-600'
                    } peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-900`}
                  >
                    {signatureState.validada && (
                      <CheckCircle2 className="w-4 h-4 text-white animate-in zoom-in duration-200" />
                    )}
                  </div>
                </div>
                <span
                  className={`ml-3 text-xs leading-relaxed ${
                    signatureState.validada
                      ? 'text-blue-100 font-medium'
                      : 'text-gray-400'
                  }`}
                >
                  Declaro que recibo el equipo a mi entera satisfacción y
                  acepto el tratamiento de mis datos personales de acuerdo con la{' '}
                  <a 
                    href="/legal/politica-privacidad" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Política de Privacidad
                  </a>
                  {' '}y los{' '}
                  <a 
                    href="/legal/terminos-servicio" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Términos de Servicio
                  </a>
                  {' '}de TecniControl (Ley 1581 de 2012).
                </span>
              </label>

              {showValidacionError && (
                <p role="alert" className="text-xs text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  El receptor debe aceptar los términos para finalizar.
                </p>
              )}
              {signatureState.validada && (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Términos aceptados.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex gap-4 items-start animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <PenIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-blue-400">
                Firma opcional
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                  La firma confirma que el cliente recibió el equipo y acepta las condiciones del servicio. Actívala para que la orden quede validada.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}