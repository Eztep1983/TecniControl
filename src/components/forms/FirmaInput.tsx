import React, { useRef, useCallback, useEffect } from 'react'
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
  const lastSignatureRef = useRef<string>(firmaCliente)

  // Actualizar el ref de la firma cada vez que cambie
  useEffect(() => {
    lastSignatureRef.current = firmaCliente
  }, [firmaCliente])

  // Restaurar firma al montar o cuando cambie firmaCliente (si el canvas está vacío)
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

    // Intentar restaurar inmediatamente
    restoreSignature()
    
    // Y un par de intentos con delay por si el canvas está terminando de inicializarse
    const timer1 = setTimeout(restoreSignature, 100)
    const timer2 = setTimeout(restoreSignature, 500)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [firmaCliente])

  // Manejar el redimensionamiento del canvas (común cuando se abre el teclado en móvil)
  useEffect(() => {
    let resizeTimer: any;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const signature = lastSignatureRef.current;
        if (sigCanvas.current && signature && sigCanvas.current.isEmpty()) {
          // El canvas se limpia al redimensionar. Restauramos desde el ref.
          try {
            sigCanvas.current.fromDataURL(signature)
          } catch (e) {
            console.warn('Firma no restaurada aún, reintentando...');
            setTimeout(() => sigCanvas.current?.fromDataURL(signature), 200);
          }
        }
      }, 250); // Tiempo suficiente para que el teclado termine de salir
    };

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimer);
    }
  }, [])

  const [localNombre, setLocalNombre] = React.useState(nombreFirmante)

  // Sincronizar nombre local con el prop si este cambia externamente
  useEffect(() => {
    setLocalNombre(nombreFirmante)
  }, [nombreFirmante])

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setLocalNombre(valor)
    setNombreFirmante(valor) // Sincronizamos inmediatamente pero el re-render ahora es más controlado
  }

  const limpiarFirma = useCallback(() => {
    sigCanvas.current?.clear()
    setFirmaCliente('')
  }, [setFirmaCliente])

  const guardarFirma = useCallback(() => {
    if (sigCanvas.current?.isEmpty()) {
      setFirmaCliente('')
    } else {
      // Guardamos la firma como data URL
      const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png')
      if (dataUrl) {
        setFirmaCliente(dataUrl)
      }
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
              value={localNombre || ''}
              onChange={handleNombreChange}
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
                canvasProps={{ 
                  className: 'w-full h-full cursor-crosshair',
                  // Esto ayuda a que el canvas mantenga una resolución decente
                  style: { display: 'block' }
                }}
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