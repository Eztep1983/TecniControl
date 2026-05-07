import React, { useRef, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Eraser } from 'lucide-react'

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

  const limpiarFirma = useCallback(() => {
    sigCanvas.current?.clear()
    setFirmaCliente('')
  }, [setFirmaCliente])

  const guardarFirma = useCallback(() => {
    if (sigCanvas.current?.isEmpty()) {
      setFirmaCliente('')
    } else {
      setFirmaCliente(sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png') || '')
    }
  }, [setFirmaCliente])

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/40 rounded-2xl shadow-sm border border-gray-700/50 p-4 sm:p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          Conformidad y Firma
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre de quien recibe *
            </label>
            <input
              type="text"
              required
              value={nombreFirmante || ''}
              onChange={(e) => setNombreFirmante(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-600/50 bg-gray-700/50 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-500"
              placeholder="Nombre completo del cliente o representante"
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
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
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
              Declaro que recibo el equipo a mi entera satisfacción, habiendo comprobado su correcto funcionamiento tras el servicio realizado, y acepto las condiciones y términos de entrega.
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
