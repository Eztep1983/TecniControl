import React, { useRef, useCallback, useEffect, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Eraser, PenSquare, PenOff, PenIcon } from 'lucide-react'

interface FirmaInputProps {
  firmaCliente: string
  setFirmaCliente: (firma: string) => void
  validacionCliente: boolean
  setValidacionCliente: (valida: boolean) => void
  nombreFirmante: string
  setNombreFirmante: (nombre: string) => void
}

export default function FirmaInput({
  firmaCliente,
  setFirmaCliente,
  validacionCliente,
  setValidacionCliente,
  nombreFirmante,
  setNombreFirmante
}: FirmaInputProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const lastSignatureRef = useRef<string>(firmaCliente)
  
  // Estado local para el toggle - INICIA EN OFF
  const [firmaActiva, setFirmaActiva] = useState<boolean>(false)

  useEffect(() => {
    lastSignatureRef.current = firmaCliente
  }, [firmaCliente])

  useEffect(() => {
    const restoreSignature = () => {
      if (firmaCliente && sigCanvas.current && sigCanvas.current.isEmpty()) {
        try {
          sigCanvas.current.fromDataURL(firmaCliente)
        } catch (e) {
          console.error('Error restaurando firma:', e)
        }
      }
    }

    restoreSignature()
    const timer1 = setTimeout(restoreSignature, 100)
    const timer2 = setTimeout(restoreSignature, 500)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [firmaCliente])

  useEffect(() => {
    let resizeTimer: any
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        const signature = lastSignatureRef.current
        if (sigCanvas.current && signature && sigCanvas.current.isEmpty()) {
          try {
            sigCanvas.current.fromDataURL(signature)
          } catch (e) {
            console.warn('Firma no restaurada aún, reintentando...')
            setTimeout(() => sigCanvas.current?.fromDataURL(signature), 200)
          }
        }
      }, 250)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimer)
    }
  }, [])

  // Manejar el toggle de firma
  const handleToggleFirma = (checked: boolean) => {
    if (!checked) {
      // Al desactivar, limpiar firma y desmarcar validación
      if (sigCanvas.current) {
        sigCanvas.current.clear()
      }
      setFirmaCliente('')
      setValidacionCliente(false)
      setNombreFirmante('')
    }
    setFirmaActiva(checked)
  }

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNombreFirmante(e.target.value)
  }

  const limpiarFirma = useCallback(() => {
    sigCanvas.current?.clear()
    setFirmaCliente('')
  }, [setFirmaCliente])

  const guardarFirma = useCallback(() => {
    if (sigCanvas.current?.isEmpty()) {
      setFirmaCliente('')
    } else {
      const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png')
      if (dataUrl) {
        setFirmaCliente(dataUrl)
      }
    }
  }, [setFirmaCliente])

  return (
    <div className="space-y-6">
      <div>
        {/* Banner Principal de Control - Toggle Switch */}
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg hover:border-gray-600/50 transition-colors mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${firmaActiva ? 'bg-blue-500/20 shadow-inner' : 'bg-gray-700/50 shadow-none'}`}>
              {firmaActiva ? (
                <PenSquare className="w-6 h-6 text-blue-400" />
              ) : (
                <PenOff className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-100 flex items-center gap-2">
                Firma de conformidad
              </h3>
              <p className={`text-xs sm:text-sm transition-colors duration-300 ${firmaActiva ? 'text-blue-300/80' : 'text-gray-500'}`}>
                {firmaActiva ? 'Firma requerida del cliente' : 'No se requiere firma'}
              </p>
            </div>
          </div>
          
          {/* iOS-like Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={firmaActiva}
            onClick={() => handleToggleFirma(!firmaActiva)}
            className={`
              relative inline-flex h-8 w-14 sm:h-9 sm:w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
              transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 
              focus-visible:ring-blue-500 focus-visible:ring-opacity-75 shadow-inner
              ${firmaActiva ? 'bg-blue-500' : 'bg-gray-600'}
            `}
          >
            <span className="sr-only">Activar firma</span>
            <span
              aria-hidden="false"
              className={`
                pointer-events-none inline-block h-7 w-7 sm:h-8 sm:w-8 transform rounded-full bg-white shadow-md 
                transition duration-300 ease-in-out
                ${firmaActiva ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0'}
              `}
            />
          </button>
        </div>

        {/* Contenido condicional según estado del toggle */}
        {firmaActiva ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre del firmante *
              </label>
              <input
                type="text"
                value={nombreFirmante}
                onChange={handleNombreChange}
                placeholder="Nombre completo del cliente"
                className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Firma Digital *
                </label>
                <button
                  type="button"
                  onClick={limpiarFirma}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center transition-colors bg-red-500/10 px-3 py-1.5 rounded-lg active:scale-95"
                >
                  <Eraser className="w-3.5 h-3.5 mr-1" />
                  Limpiar firma
                </button>
              </div>
              
              <div className="border-2 border-dashed border-gray-600/50 rounded-xl bg-white overflow-hidden relative shadow-inner touch-none" style={{ height: 200 }}>
                {/* @ts-ignore: canvasContextAttributes es soportado por la librería aunque no esté tipado */}
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{ 
                    className: 'w-full h-full cursor-crosshair',
                    style: { display: 'block' }
                  }}
                  canvasContextAttributes={{ willReadFrequently: true }}
                  onEnd={guardarFirma}
                />
                {!firmaCliente && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-400">
                    <span className="text-sm font-medium bg-white/80 px-3 py-1 rounded-full">Firme aquí</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Use su dedo o un stylus para firmar dentro del recuadro blanco.
              </p>
            </div>

            <div className="flex items-start bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 transition-colors hover:bg-blue-500/15">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  id="validacionCliente"
                  type="checkbox"
                  checked={validacionCliente}
                  onChange={(e) => setValidacionCliente(e.target.checked)}
                  className="w-5 h-5 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer"
                />
              </div>
              <label htmlFor="validacionCliente" className="ml-3 block text-sm text-blue-100 cursor-pointer leading-relaxed">
                Declaro que recibo el equipo a mi entera satisfacción, habiendo comprobado su correcto funcionamiento tras el servicio o instalación realizada, y acepto las condiciones y términos de entrega.
              </label>
            </div>
          </div>
        ) : (
          /* Estado OFF - Sin firma */
        <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
          <PenIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg text-center font-bold text-blue-400">¿Por qué registrar la firma de conformidad?</h4>
            <p className="text-sm text-gray-400 text-justify leading-relaxed">
              Registrar la firma de conformidad permite validar la entrega del equipo realizada por el técnico y la conformidad del cliente con el servicio o instalación realizada.
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}