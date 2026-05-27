import React, { useRef, useCallback, useEffect, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Eraser, PenSquare, PenOff, PenIcon } from 'lucide-react'

interface FirmaInputProps {
  firmaHabilitada: boolean
  onToggleFirma: () => void
  firmaCliente: string
  setFirmaCliente: (firma: string | null) => void
  validacionCliente: boolean
  setValidacionCliente: (valida: boolean) => void
}

export default function FirmaInput({
  firmaHabilitada,
  onToggleFirma,
  firmaCliente,
  setFirmaCliente,
  validacionCliente,
  setValidacionCliente,
}: FirmaInputProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  // Función para restaurar la firma en el canvas
  const restoreSignature = useCallback(() => {
    if (firmaCliente && sigCanvas.current) {
      try {
        sigCanvas.current.fromDataURL(firmaCliente)
        setIsEmpty(false)
      } catch (e) {
        console.error('Error restaurando firma:', e)
      }
    }
  }, [firmaCliente])

  // Manejar el redimensionamiento del canvas para que coincida con su contenedor
  useEffect(() => {
    if (!firmaHabilitada || !containerRef.current || !sigCanvas.current) return

    const resizeCanvas = () => {
      const canvas = sigCanvas.current?.getCanvas()
      const container = containerRef.current
      if (canvas && container) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        
        // Guardar la firma actual antes de redimensionar (puntos vectoriales para mejor fidelidad)
        const currentData = sigCanvas.current?.toData() || []
        
        // Ajustar dimensiones internas del canvas con el ratio de densidad de píxeles
        canvas.width = container.offsetWidth * ratio
        canvas.height = container.offsetHeight * ratio
        
        // Escalar el contexto para que las coordenadas de dibujo coincidan con CSS
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform before scaling
          ctx.scale(ratio, ratio)
        }
        
        // Limpiar y restaurar
        sigCanvas.current?.clear()
        if (currentData.length > 0) {
          sigCanvas.current?.fromData(currentData)
        } else if (firmaCliente) {
          restoreSignature()
        }
      }
    }

    const observer = new ResizeObserver(() => {
      resizeCanvas()
    })

    observer.observe(containerRef.current)
    
    // Ejecución inicial con un pequeño delay para asegurar el montaje
    const timer = setTimeout(resizeCanvas, 150)

    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [firmaHabilitada, firmaCliente, restoreSignature])

  const limpiarFirma = useCallback(() => {
    sigCanvas.current?.clear()
    setFirmaCliente(null)
    setIsEmpty(true)
  }, [setFirmaCliente])

  const guardarFirma = useCallback(() => {
    if (sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        setFirmaCliente(null)
        setIsEmpty(true)
      } else {
        // Usar toDataURL del componente (canvas completo) para evitar el efecto de "encogimiento"
        // al restaurar una firma recortada en un canvas de distinto tamaño.
        const dataUrl = sigCanvas.current.getCanvas().toDataURL('image/png')
        setFirmaCliente(dataUrl)
        setIsEmpty(false)
      }
    }
  }, [setFirmaCliente])

  return (
    <div className="space-y-6">
      <div>
        {/* Banner Principal de Control - Toggle Switch */}
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg hover:border-gray-600/50 transition-colors mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${firmaHabilitada ? 'bg-blue-500/20 shadow-inner' : 'bg-gray-700/50 shadow-none'}`}>
              {firmaHabilitada ? (
                <PenSquare className="w-6 h-6 text-blue-400" />
              ) : (
                <PenOff className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-100 flex items-center gap-2">
                Firma de conformidad
              </h3>
              <p className={`text-xs sm:text-sm transition-colors duration-300 ${firmaHabilitada ? 'text-blue-300/80' : 'text-gray-500'}`}>
                {firmaHabilitada ? 'Firma requerida del cliente' : 'No se requiere firma'}
              </p>
            </div>
          </div>
          
          {/* iOS-like Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={firmaHabilitada}
            onClick={onToggleFirma}
            className={`
              relative inline-flex h-8 w-14 sm:h-9 sm:w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
              transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 
              focus-visible:ring-blue-500 focus-visible:ring-opacity-75 shadow-inner
              ${firmaHabilitada ? 'bg-blue-500' : 'bg-gray-600'}
            `}
          >
            <span className="sr-only">Activar firma</span>
            <span
              aria-hidden="false"
              className={`
                pointer-events-none inline-block h-7 w-7 sm:h-8 sm:w-8 transform rounded-full bg-white shadow-md 
                transition duration-300 ease-in-out
                ${firmaHabilitada ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0'}
              `}
            />
          </button>
        </div>

        {/* Contenido condicional según estado del toggle */}
        {firmaHabilitada ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Firma Digital del Receptor del dispositivo *
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
              
              <div 
                ref={containerRef}
                className="border-2 border-dashed border-gray-600/50 rounded-xl bg-white overflow-hidden relative shadow-inner touch-none" 
                style={{ height: 200 }}
              >
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  minWidth={1.5}
                  maxWidth={4.5}
                  canvasProps={{ 
                    className: 'cursor-crosshair',
                    style: { display: 'block', touchAction: 'none', width: '100%', height: '100%' }
                  }}
                  onBegin={() => setIsEmpty(false)}
                  onEnd={guardarFirma}
                  clearOnResize={false}
                />
                {(isEmpty && !firmaCliente) && (
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
            <h4 className="text-lg font-bold text-blue-400">Firma opcional</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Si el cliente no está presente o no puede firmar en este momento, puede omitir este paso desactivando el toggle superior.
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}